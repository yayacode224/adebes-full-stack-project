import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import type {
  CreateMediaAsset,
  MediaAsset,
  MediaFilter,
  MediaUsage,
  UpdateMediaAsset,
} from "@/core/cms/entities/media-asset";
import type {
  MediaReadPort,
  MediaWritePort,
} from "@/core/cms/ports/media.port";
import { normalizeFilter, toRange } from "@/core/shared/pagination";

import type { Database } from "../database.types";
import { mapPostgrestError, requireDeleted, requireOneRow } from "../errors";
import {
  toMediaAsset,
  toMediaAssetInsert,
  toMediaAssetUpdate,
} from "../mappers/media-asset.mapper";

/**
 * Implémentation Supabase des ports de la médiathèque.
 *
 * Même contrat que `SupabaseProgrammeRepository` : les méthodes LÈVENT une
 * `AppError`, la frontière qui la transforme en réponse sérialisable est
 * `createAction`.
 */

/** Colonnes autorisées au tri — jamais la valeur brute reçue du client. */
const COLONNES_TRI = new Set(["created_at", "filename", "size_bytes", "folder"]);

const TRI_ALIAS: Record<string, string> = {
  createdAt: "created_at",
  sizeBytes: "size_bytes",
};

export class SupabaseMediaRepository implements MediaReadPort, MediaWritePort {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  // ═══════════════════════════════════════════════════════════════ Lecture ══

  /**
   * ⚠️  `findAll` et `count` DOIVENT appliquer exactement les mêmes conditions.
   *
   * La chaîne de filtres est écrite deux fois plutôt que factorisée dans une
   * méthode générique : le constructeur de requêtes de PostgREST est typé par
   * la table ET par la projection, et le rendre générique ici imposait un
   * `as unknown as`, que la règle 3 du plan interdit. Douze lignes redites
   * valent mieux qu'une conversion qui désactive le typage sur toute une
   * couche d'accès aux données.
   *
   * Toute condition ajoutée ici doit l'être dans les deux — sans quoi la
   * pagination annonce trois pages et n'en remplit qu'une.
   */
  async findAll(filter: MediaFilter = {}): Promise<MediaAsset[]> {
    const normalise = normalizeFilter(filter);
    let requete = this.supabase.from("media_assets").select("*");

    if (filter.kind === "image") {
      requete = requete.like("mime_type", "image/%");
    } else if (filter.kind === "document") {
      requete = requete.eq("bucket", "documents");
    }

    if (filter.folder !== undefined) {
      requete =
        filter.folder === ""
          ? requete.is("folder", null)
          : requete.eq("folder", filter.folder);
    }

    const recherche = echapperRecherche(normalise.search ?? "");
    if (recherche) {
      requete = requete.or(
        `filename.ilike.%${recherche}%,alt_text.ilike.%${recherche}%,caption.ilike.%${recherche}%`,
      );
    }

    const colonne = colonneDeTri(normalise.sortBy);
    requete = requete.order(colonne, {
      // Par défaut, le plus récent d'abord : dans une médiathèque, ce qu'on
      // cherche est presque toujours ce qu'on vient de téléverser.
      ascending: normalise.sortDirection
        ? normalise.sortDirection !== "desc"
        : colonne !== "created_at",
    });

    const { from, to } = toRange(normalise);
    requete = requete.range(from, to);

    const { data, error } = await requete;
    if (error) throw mapPostgrestError(error, { ressource: "média" });

    return (data ?? []).map(toMediaAsset);
  }

  async count(filter: MediaFilter = {}): Promise<number> {
    let requete = this.supabase
      .from("media_assets")
      .select("id", { count: "exact", head: true });

    if (filter.kind === "image") {
      requete = requete.like("mime_type", "image/%");
    } else if (filter.kind === "document") {
      requete = requete.eq("bucket", "documents");
    }

    if (filter.folder !== undefined) {
      requete =
        filter.folder === ""
          ? requete.is("folder", null)
          : requete.eq("folder", filter.folder);
    }

    const recherche = echapperRecherche(filter.search?.trim() ?? "");
    if (recherche) {
      requete = requete.or(
        `filename.ilike.%${recherche}%,alt_text.ilike.%${recherche}%,caption.ilike.%${recherche}%`,
      );
    }

    const { count, error } = await requete;
    if (error) throw mapPostgrestError(error, { ressource: "média" });
    return count ?? 0;
  }

  async findById(id: string): Promise<MediaAsset | null> {
    const { data, error } = await this.supabase
      .from("media_assets")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw mapPostgrestError(error, { ressource: "média" });
    return data ? toMediaAsset(data) : null;
  }

  async findByIds(ids: string[]): Promise<MediaAsset[]> {
    if (ids.length === 0) return [];

    const { data, error } = await this.supabase
      .from("media_assets")
      .select("*")
      .in("id", ids);

    if (error) throw mapPostgrestError(error, { ressource: "média" });
    return (data ?? []).map(toMediaAsset);
  }

  /**
   * Les dossiers existants.
   *
   * PostgREST n'expose pas de `distinct` : la colonne est rapatriée puis
   * dédoublonnée ici. Acceptable au volume de ce site (quelques centaines de
   * fichiers au plus) ; une vue SQL serait la réponse au-delà.
   */
  async listFolders(): Promise<string[]> {
    const { data, error } = await this.supabase
      .from("media_assets")
      .select("folder")
      .not("folder", "is", null);

    if (error) throw mapPostgrestError(error, { ressource: "média" });

    const dossiers = new Set<string>();
    for (const ligne of data ?? []) {
      if (ligne.folder) dossiers.add(ligne.folder);
    }

    return [...dossiers].sort((a, b) => a.localeCompare(b, "fr"));
  }

  /**
   * ═════════════════════════════════════════════════════════════════════════
   *  OÙ CE MÉDIA EST-IL EMPLOYÉ ?
   * ═════════════════════════════════════════════════════════════════════════
   *
   * Neuf références au catalogue existent dans le schéma (migrations 0003,
   * 0005 et 0006). Elles sont interrogées EN PARALLÈLE : ce sont neuf requêtes
   * indépendantes, les enchaîner ajouterait neuf allers-retours avant
   * l'ouverture d'une simple confirmation.
   *
   * -------------------------------------------------------------------------
   * CE QUI N'EST PAS COUVERT, ET POURQUOI C'EST DIT À L'UTILISATEUR
   * -------------------------------------------------------------------------
   * `page_sections.content` est du JSONB : un bloc « image + texte » y range un
   * `mediaId` à une profondeur qui dépend du type de bloc. Le registre de blocs
   * n'existe pas avant le Lot 9, et les sections sont aujourd'hui seedées en
   * squelettes (écart nº 15) — chercher ici supposerait de deviner la forme de
   * contenus qui ne sont pas encore écrits.
   *
   * L'interface l'ANNONCE plutôt que de laisser croire à une liste exhaustive :
   * une liste vide signifie « aucun usage connu », pas « aucun usage ». C'est
   * l'invariant nº 1 appliqué à un décompte.
   */
  async findUsages(id: string): Promise<MediaUsage[]> {
    const [
      programmesCouverture,
      programmesGalerie,
      articles,
      equipe,
      temoignages,
      pages,
      galerie,
      rapports,
      profils,
    ] = await Promise.all([
      this.tolerant(
        "programmes",
        this.supabase
          .from("programmes")
          .select("id, title")
          .eq("cover_media_id", id),
      ),
      this.tolerant(
        "programmes",
        this.supabase
          .from("programmes")
          .select("id, title")
          // `contains` sur un `uuid[]` : `gallery_media_ids @> '{<id>}'`.
          .contains("gallery_media_ids", [id]),
      ),
      this.tolerant(
        "articles",
        this.supabase
          .from("articles")
          .select("id, title")
          .eq("cover_media_id", id),
      ),
      this.tolerant(
        "team_members",
        this.supabase
          .from("team_members")
          .select("id, name")
          .eq("photo_media_id", id),
      ),
      this.tolerant(
        "testimonials",
        this.supabase
          .from("testimonials")
          .select("id, author_name")
          .eq("photo_media_id", id),
      ),
      this.tolerant(
        "pages",
        this.supabase.from("pages").select("id, title").eq("og_media_id", id),
      ),
      this.tolerant(
        "gallery_items",
        this.supabase
          .from("gallery_items")
          .select("id, position")
          .eq("media_id", id),
      ),
      this.tolerant(
        "annual_reports",
        this.supabase
          .from("annual_reports")
          .select("id, title, year")
          .eq("document_media_id", id),
      ),
      /*
       * Les profils sont lus sans bruit : la RLS n'ouvre l'annuaire qu'aux
       * administrateurs (politique `profiles_admin_read`). Un éditeur obtient
       * zéro ligne — ce qui est sans conséquence, puisqu'il n'a de toute façon
       * pas `media:delete`.
       */
      this.tolerant(
        "profiles",
        this.supabase
          .from("profiles")
          .select("id, full_name, email")
          .eq("avatar_media_id", id),
      ),
    ]);

    return [
      ...programmesCouverture.map((ligne) => ({
        resource: "Programme",
        label: ligne.title,
        id: ligne.id,
        field: "Image de couverture",
        blocking: false,
      })),

      ...programmesGalerie.map((ligne) => ({
        resource: "Programme",
        label: ligne.title,
        id: ligne.id,
        field: "Galerie du programme",
        /*
         * `gallery_media_ids` est un `uuid[]` SANS clé étrangère : la base
         * laisserait la suppression passer et le tableau garderait un
         * identifiant qui ne pointe plus sur rien. Bloquant ici, faute de
         * l'être en base — invariant nº 2, « aucun lien mort ».
         */
        blocking: true,
      })),

      ...articles.map((ligne) => ({
        resource: "Article",
        label: ligne.title,
        id: ligne.id,
        field: "Image de couverture",
        blocking: false,
      })),

      ...equipe.map((ligne) => ({
        resource: "Membre de l'équipe",
        label: ligne.name,
        id: ligne.id,
        field: "Photo",
        blocking: false,
      })),

      ...temoignages.map((ligne) => ({
        resource: "Témoignage",
        label: ligne.author_name,
        id: ligne.id,
        field: "Photo",
        blocking: false,
      })),

      ...pages.map((ligne) => ({
        resource: "Page",
        label: ligne.title,
        id: ligne.id,
        field: "Image de partage",
        blocking: false,
      })),

      ...galerie.map((ligne) => ({
        resource: "Galerie",
        // `gallery_items` n'a pas de titre : la position est le seul repère
        // dont dispose l'utilisateur pour retrouver l'élément à l'écran.
        label: `Photo nº ${ligne.position + 1}`,
        id: ligne.id,
        field: "Image",
        // `on delete restrict` (migration 0005) : la base refuserait.
        blocking: true,
      })),

      ...rapports.map((ligne) => ({
        resource: "Rapport annuel",
        label: `${ligne.title} (${ligne.year})`,
        id: ligne.id,
        field: "Fichier PDF",
        // `on delete restrict` (migration 0005).
        blocking: true,
      })),

      ...profils.map((ligne) => ({
        resource: "Compte utilisateur",
        label: ligne.full_name ?? ligne.email,
        id: ligne.id,
        field: "Photo de profil",
        blocking: false,
      })),
    ];
  }

  // ═══════════════════════════════════════════════════════════════ Écriture ══

  async create(input: CreateMediaAsset): Promise<MediaAsset> {
    const { data, error } = await this.supabase
      .from("media_assets")
      .insert(toMediaAssetInsert(input))
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "média" });

    // Voir « écriture silencieusement refusée » dans errors.ts : la RLS FILTRE
    // les écritures, elle ne les rejette pas.
    const refus = requireOneRow(data, { ressource: "média", action: "créer" });
    if (refus) throw refus;

    return toMediaAsset(data![0]);
  }

  async update(id: string, input: UpdateMediaAsset): Promise<MediaAsset> {
    const champs = toMediaAssetUpdate(input);

    // Une mise à jour vide renverrait 0 ligne et serait prise pour un refus.
    if (Object.keys(champs).length === 0) {
      const actuel = await this.findById(id);
      if (!actuel) {
        throw requireOneRow(null, { ressource: "média", action: "modifier" });
      }
      return actuel;
    }

    const { data, error } = await this.supabase
      .from("media_assets")
      .update(champs)
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "média" });

    const refus = requireOneRow(data, { ressource: "média", action: "modifier" });
    if (refus) throw refus;

    return toMediaAsset(data![0]);
  }

  async delete(id: string): Promise<void> {
    const { data, error } = await this.supabase
      .from("media_assets")
      .delete()
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "média" });

    const refus = requireDeleted(data, "média");
    if (refus) throw refus;
  }

  // ═══════════════════════════════════════════════════════════════ Interne ══

  /**
   * Une lecture d'usages qui ne fait pas échouer les huit autres.
   *
   * `findUsages` alimente une confirmation de suppression : si l'une des neuf
   * tables est inaccessible — la RLS filtre `profiles` pour un éditeur —, la
   * bonne réponse est « aucun usage connu de cette table », journalisé, et
   * surtout pas une erreur qui empêcherait toute suppression.
   */
  private async tolerant<T>(
    table: string,
    requete: PromiseLike<{ data: T[] | null; error: PostgrestError | null }>,
  ): Promise<T[]> {
    const { data, error } = await requete;

    if (error) {
      console.error("[ADEBES] Lecture des usages impossible", { table, error });
      return [];
    }

    return data ?? [];
  }
}

/**
 * Neutralise les caractères qui ont un sens dans la syntaxe de filtre
 * PostgREST — voir la note détaillée dans `programme.repository.ts`.
 */
function echapperRecherche(valeur: string): string {
  return valeur.replace(/[,()%_\\*"']/g, " ").trim();
}

function colonneDeTri(sortBy: string | undefined): string {
  if (!sortBy) return "created_at";
  const colonne = TRI_ALIAS[sortBy] ?? sortBy;
  // Une colonne inconnue est ignorée plutôt que transmise : `order()` sur une
  // colonne inexistante lève une erreur PostgREST peu lisible.
  return COLONNES_TRI.has(colonne) ? colonne : "created_at";
}
