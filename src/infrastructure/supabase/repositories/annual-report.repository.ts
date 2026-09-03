import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  AnnualReport,
  CreateAnnualReport,
  UpdateAnnualReport,
} from "@/core/cms/entities/annual-report";
import type { ContentStatus } from "@/core/cms/entities/content-status";
import type {
  AnnualReportReadPort,
  AnnualReportWritePort,
} from "@/core/cms/ports/annual-report.port";
import { normalizeFilter, toRange, type ListFilter } from "@/core/shared/pagination";

import type { Database } from "../database.types";
import { mapPostgrestError, requireDeleted, requireOneRow } from "../errors";
import {
  toAnnualReport,
  toAnnualReportInsert,
  toAnnualReportUpdate,
} from "../mappers/annual-report.mapper";

/** Colonnes autorisées au tri — jamais la valeur brute reçue du client. */
const COLONNES_TRI = new Set([
  "position",
  "year",
  "title",
  "status",
  "created_at",
  "updated_at",
]);

/** Traduction camelCase → colonne SQL pour le tri. */
const TRI_ALIAS: Record<string, string> = {
  createdAt: "created_at",
  updatedAt: "updated_at",
  documentMediaId: "document_media_id",
};

/**
 * Implémentation Supabase des ports du rapport annuel.
 *
 * Reçoit son client par injection : le même code sert au dashboard (client
 * serveur, avec cookies) et aux lectures publiques (client public, sans
 * cookies). C'est la RLS qui fait la différence entre les deux, pas une branche
 * dans ce fichier.
 *
 * ⚠️  Les méthodes LÈVENT une `AppError` en cas d'échec, elles ne renvoient pas
 * de `Result`. La frontière qui transforme l'exception en réponse sérialisable
 * est `createAction` (Lot 4).
 *
 * `reorder_rows('annual_reports')` est légitime : la table porte bien une
 * colonne `position` (migration 0005) et figure dans la liste blanche de la
 * migration 0012 — vérifié dans le fichier, pas supposé.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LA RECHERCHE PORTE SUR DEUX COLONNES DE TYPES DIFFÉRENTS
 * ---------------------------------------------------------------------------
 * `title` est un `text` : `ilike` s'y applique. `year` est un `integer` :
 * `ilike` sur une colonne numérique lève une erreur PostgREST (« operator does
 * not exist: integer ~~* unknown »), et c'est le piège de cette collection.
 *
 * La branche « année » n'est donc ajoutée que si la recherche est un ENTIER, et
 * elle emploie `eq` :
 *
 *   * chercher « 2025 » trouve le rapport 2025 ;
 *   * chercher « 202 » ne trouve rien par l'année — et c'est correct : `eq` ne
 *     fait pas de préfixe, et convertir en texte côté base (`year::text`)
 *     imposerait une expression que PostgREST n'accepte pas dans un `or`.
 *
 * L'écran de liste, lui, complète cela : `<DataTable>` filtre EN MÉMOIRE
 * (écart nº 51) sur des lignes déjà chargées, où l'année est une chaîne — une
 * saisie partielle y fonctionne. Les deux niveaux ne mentent pas l'un sur
 * l'autre : le dépôt fait ce que SQL sait faire, l'écran ce que le navigateur
 * sait faire. Le dépôt en mémoire imite exactement le dépôt réel (`includes`
 * sur `String(year)`) — écarts nº 109, 132 et 141.
 */
export class SupabaseAnnualReportRepository
  implements AnnualReportReadPort, AnnualReportWritePort
{
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  // ═══════════════════════════════════════════════════════════════ Lecture ══

  async findAll(filter: ListFilter = {}): Promise<AnnualReport[]> {
    const normalise = normalizeFilter(filter);
    let requete = this.supabase.from("annual_reports").select("*");

    if (normalise.status) {
      requete = requete.eq("status", normalise.status as ContentStatus);
    }

    if (normalise.search) {
      requete = requete.or(clauseRecherche(normalise.search));
    }

    const colonne = colonneDeTri(normalise.sortBy);
    requete = requete.order(colonne, {
      ascending: normalise.sortDirection !== "desc",
      // Un rapport sans PDF ne doit pas décider seul de sa place quand on trie
      // par document : `nullsFirst: false` le range en queue.
      nullsFirst: false,
    });

    const { from, to } = toRange(normalise);
    requete = requete.range(from, to);

    const { data, error } = await requete;
    if (error) throw mapPostgrestError(error, { ressource: "rapport annuel" });

    return (data ?? []).map(toAnnualReport);
  }

  async findById(id: string): Promise<AnnualReport | null> {
    const { data, error } = await this.supabase
      .from("annual_reports")
      .select("*")
      .eq("id", id)
      // `maybeSingle` et non `single` : l'absence est un cas normal.
      // `single` lèverait PGRST116.
      .maybeSingle();

    if (error) throw mapPostgrestError(error, { ressource: "rapport annuel" });
    return data ? toAnnualReport(data) : null;
  }

  /**
   * Le rapport d'une année, ou `null`.
   *
   * `year` est `unique` : `maybeSingle` est donc exact, et non une tolérance.
   */
  async findByYear(year: number): Promise<AnnualReport | null> {
    const { data, error } = await this.supabase
      .from("annual_reports")
      .select("*")
      .eq("year", year)
      .maybeSingle();

    if (error) throw mapPostgrestError(error, { ressource: "rapport annuel" });
    return data ? toAnnualReport(data) : null;
  }

  async findPublished(options: { limit?: number } = {}): Promise<AnnualReport[]> {
    const { limit = 100 } = options;

    const { data, error } = await this.supabase
      .from("annual_reports")
      .select("*")
      .eq("status", "published")
      .order("position", { ascending: true })
      .limit(limit);

    if (error) throw mapPostgrestError(error, { ressource: "rapport annuel" });
    return (data ?? []).map(toAnnualReport);
  }

  async count(filter: ListFilter = {}): Promise<number> {
    // `head: true` : on ne rapatrie aucune ligne, seulement l'en-tête de
    // comptage.
    let requete = this.supabase
      .from("annual_reports")
      .select("*", { count: "exact", head: true });

    if (filter.status) {
      requete = requete.eq("status", filter.status as ContentStatus);
    }

    // ⚠️  Le décompte DOIT appliquer le même filtre que la liste, sinon la
    // pagination annonce un total qui ne correspond pas aux lignes rendues.
    if (filter.search?.trim()) {
      requete = requete.or(clauseRecherche(filter.search.trim()));
    }

    const { count, error } = await requete;
    if (error) throw mapPostgrestError(error, { ressource: "rapport annuel" });
    return count ?? 0;
  }

  async countByMedia(mediaId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("annual_reports")
      .select("*", { count: "exact", head: true })
      .eq("document_media_id", mediaId);

    if (error) throw mapPostgrestError(error, { ressource: "rapport annuel" });
    return count ?? 0;
  }

  // ═══════════════════════════════════════════════════════════════ Écriture ══

  async create(input: CreateAnnualReport): Promise<AnnualReport> {
    const { data, error } = await this.supabase
      .from("annual_reports")
      .insert(toAnnualReportInsert(input))
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "rapport annuel" });

    // Voir le commentaire « écriture silencieusement refusée » dans errors.ts.
    const refus = requireOneRow(data, {
      ressource: "rapport annuel",
      action: "créer",
    });
    if (refus) throw refus;

    return toAnnualReport(data![0]!);
  }

  async update(id: string, input: UpdateAnnualReport): Promise<AnnualReport> {
    const champs = toAnnualReportUpdate(input);

    // Une mise à jour vide renverrait 0 ligne et serait prise pour un refus.
    if (Object.keys(champs).length === 0) {
      const actuel = await this.findById(id);
      if (!actuel) {
        throw requireOneRow(null, {
          ressource: "rapport annuel",
          action: "modifier",
        });
      }
      return actuel;
    }

    const { data, error } = await this.supabase
      .from("annual_reports")
      .update(champs)
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "rapport annuel" });

    const refus = requireOneRow(data, {
      ressource: "rapport annuel",
      action: "modifier",
    });
    if (refus) throw refus;

    return toAnnualReport(data![0]!);
  }

  async delete(id: string): Promise<void> {
    const { data, error } = await this.supabase
      .from("annual_reports")
      .delete()
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "rapport annuel" });

    // ⚠️  Sans ce contrôle, une suppression refusée par la RLS renvoie
    // HTTP 204 et passerait pour un succès. Mesuré au Lot 1.
    const refus = requireDeleted(data, "rapport annuel");
    if (refus) throw refus;
  }

  async reorder(orderedIds: string[]): Promise<void> {
    // Une transaction unique, côté base : N requêtes successives laisseraient
    // des positions incohérentes si l'une échouait (§3.4 du Rapport 2).
    const { error } = await this.supabase.rpc("reorder_rows", {
      p_table: "annual_reports",
      p_ids: orderedIds,
    });

    if (error) throw mapPostgrestError(error, { ressource: "rapport annuel" });
  }

  async setStatus(id: string, status: ContentStatus): Promise<AnnualReport> {
    const { data, error } = await this.supabase
      .from("annual_reports")
      .update({ status })
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "rapport annuel" });

    const refus = requireOneRow(data, {
      ressource: "rapport annuel",
      action: "modifier",
    });
    if (refus) throw refus;

    return toAnnualReport(data![0]!);
  }
}

/**
 * La clause `or` de la recherche.
 *
 * ⚠️  `year` n'y entre QUE si la saisie est un entier. `year.eq.abc` produit un
 * 22P02 (« invalid input syntax for type integer ») qui remonterait en erreur
 * technique sur une simple recherche par titre.
 */
function clauseRecherche(saisie: string): string {
  const q = echapperRecherche(saisie);
  const clauses = [`title.ilike.%${q}%`];

  if (/^\d+$/.test(q)) clauses.push(`year.eq.${q}`);

  return clauses.join(",");
}

function echapperRecherche(valeur: string): string {
  return valeur.replace(/[,()%_\\*"']/g, " ").trim();
}

function colonneDeTri(sortBy: string | undefined): string {
  if (!sortBy) return "position";
  const colonne = TRI_ALIAS[sortBy] ?? sortBy;
  // Une colonne inconnue est ignorée plutôt que transmise : `order()` sur une
  // colonne inexistante lève une erreur PostgREST peu lisible.
  return COLONNES_TRI.has(colonne) ? colonne : "position";
}
