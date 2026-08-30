import type { SupabaseClient } from "@supabase/supabase-js";

import type { ContentStatus } from "@/core/cms/entities/content-status";
import type {
  CreateGalleryItem,
  GalleryItem,
  UpdateGalleryItem,
} from "@/core/cms/entities/gallery";
import type {
  GalleryItemReadPort,
  GalleryItemWritePort,
} from "@/core/cms/ports/gallery.port";
import { normalizeFilter, toRange, type ListFilter } from "@/core/shared/pagination";

import type { Database } from "../database.types";
import { mapPostgrestError, requireDeleted, requireOneRow } from "../errors";
import {
  toGalleryItem,
  toGalleryItemInsert,
  toGalleryItemUpdate,
} from "../mappers/gallery.mapper";

/** Colonnes autorisées au tri — jamais la valeur brute reçue du client. */
const COLONNES_TRI = new Set([
  "position",
  "status",
  "category_id",
  "created_at",
  "updated_at",
]);

/** Traduction camelCase → colonne SQL pour le tri. */
const TRI_ALIAS: Record<string, string> = {
  createdAt: "created_at",
  updatedAt: "updated_at",
  categoryId: "category_id",
  mediaId: "media_id",
};

/**
 * Implémentation Supabase des ports de l'élément de galerie.
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
 * `reorder_rows('gallery_items')` est légitime : la table porte bien une
 * colonne `position` (migration 0005) et figure dans la liste blanche de la
 * migration 0012 — contrairement à l'entrée `'articles'`, défaut latent signalé
 * au Lot 8B.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  IL N'Y A AUCUNE RECHERCHE TEXTUELLE, ET IL NE PEUT PAS Y EN AVOIR
 * ---------------------------------------------------------------------------
 * `gallery_items` ne contient AUCUNE colonne de texte : `media_id`,
 * `category_id`, `position`, `status`. Le seul texte qu'un utilisateur associe
 * à une photo — sa description — vit dans `media_assets.alt_text`, une autre
 * table.
 *
 * Deux voies étaient ouvertes, et la seconde a été écartée :
 *
 *   1. **Ignorer `filter.search`**, ce qui est fait. L'écran de liste, lui,
 *      cherche bien dans les descriptions : `<DataTable>` filtre EN MÉMOIRE
 *      (écart nº 51) sur des lignes déjà enrichies du texte alternatif par la
 *      page. La recherche existe donc pour l'utilisateur, à l'endroit où elle
 *      peut être juste.
 *   2. **Une jointure PostgREST `media_assets!inner(alt_text)`** avec un filtre
 *      sur la table jointe. Elle aurait fonctionné, mais changé le type de la
 *      projection — donc obligé le mapper à connaître une forme de ligne
 *      différente selon le filtre — et transformé chaque lecture de liste en
 *      jointure, y compris celles qui n'en ont pas besoin.
 *
 * `filter.search` est donc **ignoré**, et le dépôt en mémoire l'ignore aussi :
 * il doit ressembler au vrai jusque dans ce qu'il ne fait pas (écarts nº 109
 * et nº 132).
 */
export class SupabaseGalleryItemRepository
  implements GalleryItemReadPort, GalleryItemWritePort
{
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  // ═══════════════════════════════════════════════════════════════ Lecture ══

  async findAll(filter: ListFilter = {}): Promise<GalleryItem[]> {
    const normalise = normalizeFilter(filter);
    let requete = this.supabase.from("gallery_items").select("*");

    if (normalise.status) {
      requete = requete.eq("status", normalise.status as ContentStatus);
    }

    const colonne = colonneDeTri(normalise.sortBy);
    requete = requete.order(colonne, {
      ascending: normalise.sortDirection !== "desc",
      // Un élément sans catégorie ne doit pas décider seul de sa place quand on
      // trie par catégorie : `nullsFirst: false` le range en queue, ce qui est
      // aussi ce que fait l'écran de liste.
      nullsFirst: false,
    });

    const { from, to } = toRange(normalise);
    requete = requete.range(from, to);

    const { data, error } = await requete;
    if (error) throw mapPostgrestError(error, { ressource: "élément de galerie" });

    return (data ?? []).map(toGalleryItem);
  }

  async findById(id: string): Promise<GalleryItem | null> {
    const { data, error } = await this.supabase
      .from("gallery_items")
      .select("*")
      .eq("id", id)
      // `maybeSingle` et non `single` : l'absence est un cas normal.
      // `single` lèverait PGRST116.
      .maybeSingle();

    if (error) throw mapPostgrestError(error, { ressource: "élément de galerie" });
    return data ? toGalleryItem(data) : null;
  }

  /**
   * Les éléments publiés, dans l'ordre d'affichage.
   *
   * Aucun filtre de catégorie : la page publique charge la grille entière et
   * filtre dans le navigateur — voir `listPublishedGalleryItems`.
   */
  async findPublished(options: { limit?: number } = {}): Promise<GalleryItem[]> {
    const { limit = 200 } = options;

    const { data, error } = await this.supabase
      .from("gallery_items")
      .select("*")
      .eq("status", "published")
      .order("position", { ascending: true })
      .limit(limit);

    if (error) throw mapPostgrestError(error, { ressource: "élément de galerie" });
    return (data ?? []).map(toGalleryItem);
  }

  async count(filter: ListFilter = {}): Promise<number> {
    // `head: true` : on ne rapatrie aucune ligne, seulement l'en-tête de
    // comptage.
    let requete = this.supabase
      .from("gallery_items")
      .select("*", { count: "exact", head: true });

    if (filter.status) {
      requete = requete.eq("status", filter.status as ContentStatus);
    }

    const { count, error } = await requete;
    if (error) throw mapPostgrestError(error, { ressource: "élément de galerie" });
    return count ?? 0;
  }

  async countByCategory(categoryId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("gallery_items")
      .select("*", { count: "exact", head: true })
      .eq("category_id", categoryId);

    if (error) throw mapPostgrestError(error, { ressource: "élément de galerie" });
    return count ?? 0;
  }

  async countByMedia(mediaId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("gallery_items")
      .select("*", { count: "exact", head: true })
      .eq("media_id", mediaId);

    if (error) throw mapPostgrestError(error, { ressource: "élément de galerie" });
    return count ?? 0;
  }

  // ═══════════════════════════════════════════════════════════════ Écriture ══

  async create(input: CreateGalleryItem): Promise<GalleryItem> {
    const { data, error } = await this.supabase
      .from("gallery_items")
      .insert(toGalleryItemInsert(input))
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "élément de galerie" });

    // Voir le commentaire « écriture silencieusement refusée » dans errors.ts.
    const refus = requireOneRow(data, {
      ressource: "élément de galerie",
      action: "créer",
    });
    if (refus) throw refus;

    return toGalleryItem(data![0]!);
  }

  async update(id: string, input: UpdateGalleryItem): Promise<GalleryItem> {
    const champs = toGalleryItemUpdate(input);

    // Une mise à jour vide renverrait 0 ligne et serait prise pour un refus.
    if (Object.keys(champs).length === 0) {
      const actuel = await this.findById(id);
      if (!actuel) {
        throw requireOneRow(null, {
          ressource: "élément de galerie",
          action: "modifier",
        });
      }
      return actuel;
    }

    const { data, error } = await this.supabase
      .from("gallery_items")
      .update(champs)
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "élément de galerie" });

    const refus = requireOneRow(data, {
      ressource: "élément de galerie",
      action: "modifier",
    });
    if (refus) throw refus;

    return toGalleryItem(data![0]!);
  }

  async delete(id: string): Promise<void> {
    const { data, error } = await this.supabase
      .from("gallery_items")
      .delete()
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "élément de galerie" });

    // ⚠️  Sans ce contrôle, une suppression refusée par la RLS renvoie
    // HTTP 204 et passerait pour un succès. Mesuré au Lot 1.
    const refus = requireDeleted(data, "élément de galerie");
    if (refus) throw refus;
  }

  async reorder(orderedIds: string[]): Promise<void> {
    // Une transaction unique, côté base : N requêtes successives laisseraient
    // des positions incohérentes si l'une échouait (§3.4 du Rapport 2).
    const { error } = await this.supabase.rpc("reorder_rows", {
      p_table: "gallery_items",
      p_ids: orderedIds,
    });

    if (error) throw mapPostgrestError(error, { ressource: "élément de galerie" });
  }

  async setStatus(id: string, status: ContentStatus): Promise<GalleryItem> {
    const { data, error } = await this.supabase
      .from("gallery_items")
      .update({ status })
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "élément de galerie" });

    const refus = requireOneRow(data, {
      ressource: "élément de galerie",
      action: "modifier",
    });
    if (refus) throw refus;

    return toGalleryItem(data![0]!);
  }
}

function colonneDeTri(sortBy: string | undefined): string {
  if (!sortBy) return "position";
  const colonne = TRI_ALIAS[sortBy] ?? sortBy;
  // Une colonne inconnue est ignorée plutôt que transmise : `order()` sur une
  // colonne inexistante lève une erreur PostgREST peu lisible.
  return COLONNES_TRI.has(colonne) ? colonne : "position";
}
