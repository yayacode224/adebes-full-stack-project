import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  CreateGalleryCategory,
  GalleryCategory,
  UpdateGalleryCategory,
} from "@/core/cms/entities/gallery";
import type {
  GalleryCategoryReadPort,
  GalleryCategoryWritePort,
} from "@/core/cms/ports/gallery.port";

import type { Database } from "../database.types";
import { mapPostgrestError, requireDeleted, requireOneRow } from "../errors";
import {
  toGalleryCategory,
  toGalleryCategoryInsert,
  toGalleryCategoryUpdate,
} from "../mappers/gallery.mapper";

/**
 * Implémentation Supabase des ports de catégorie de galerie.
 *
 * Dépôt SÉPARÉ de `SupabaseGalleryItemRepository`, et non une poignée de
 * méthodes de plus : les deux tables ont des droits distincts en base — la RLS
 * ouvre la modification d'une catégorie au personnel mais réserve son ajout et
 * sa suppression à `app_can_publish()` (migration 0009). Un dépôt unique aurait
 * laissé croire qu'un même jeu de droits couvre les deux. Même découpage qu'au
 * Lot 8B.
 *
 * ⚠️  L'ordre est TOUJOURS `position asc` : c'est celui des boutons de filtre
 * de `/galerie`. Aucune méthode n'expose de tri alternatif — une liste de
 * quatre libellés n'a pas de raison d'être triée autrement, et l'ordre est
 * précisément ce que l'utilisateur vient de régler à la main.
 *
 * ---------------------------------------------------------------------------
 * LA LECTURE PUBLIQUE N'EST PAS CONDITIONNÉE
 * ---------------------------------------------------------------------------
 * `gallery_categories_public_read` est `using (true)` (migration 0009) : les
 * quatre catégories sont lisibles par un visiteur anonyme, même celles qu'aucune
 * photo n'emploie. C'est la page publique qui décide de n'afficher que les
 * catégories réellement employées — `categoriesAffichees()`, dans le domaine —
 * et non la RLS, qui ne saurait pas l'exprimer.
 */
export class SupabaseGalleryCategoryRepository
  implements GalleryCategoryReadPort, GalleryCategoryWritePort
{
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  // ═══════════════════════════════════════════════════════════════ Lecture ══

  async findAll(): Promise<GalleryCategory[]> {
    const { data, error } = await this.supabase
      .from("gallery_categories")
      .select("*")
      .order("position", { ascending: true })
      // Départage stable quand deux catégories partagent une position — ce qui
      // arrive après un `insert` manuel en base, où `position` vaut 0 par
      // défaut. Sans ce second critère, l'ordre varierait d'une requête à
      // l'autre et les boutons de filtre du site changeraient tout seuls.
      .order("label", { ascending: true });

    if (error) throw mapPostgrestError(error, { ressource: "catégorie de galerie" });
    return (data ?? []).map(toGalleryCategory);
  }

  async findById(id: string): Promise<GalleryCategory | null> {
    const { data, error } = await this.supabase
      .from("gallery_categories")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw mapPostgrestError(error, { ressource: "catégorie de galerie" });
    return data ? toGalleryCategory(data) : null;
  }

  async findBySlug(slug: string): Promise<GalleryCategory | null> {
    const { data, error } = await this.supabase
      .from("gallery_categories")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw mapPostgrestError(error, { ressource: "catégorie de galerie" });
    return data ? toGalleryCategory(data) : null;
  }

  // ═══════════════════════════════════════════════════════════════ Écriture ══

  async create(input: CreateGalleryCategory): Promise<GalleryCategory> {
    const { data, error } = await this.supabase
      .from("gallery_categories")
      .insert(toGalleryCategoryInsert({ ...input, slug: input.slug ?? "" }))
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "catégorie de galerie" });

    const refus = requireOneRow(data, {
      ressource: "catégorie de galerie",
      action: "créer",
    });
    if (refus) throw refus;

    return toGalleryCategory(data![0]!);
  }

  async update(
    id: string,
    input: UpdateGalleryCategory,
  ): Promise<GalleryCategory> {
    const champs = toGalleryCategoryUpdate(input);

    if (Object.keys(champs).length === 0) {
      const actuelle = await this.findById(id);
      if (!actuelle) {
        throw requireOneRow(null, {
          ressource: "catégorie de galerie",
          action: "modifier",
        });
      }
      return actuelle;
    }

    const { data, error } = await this.supabase
      .from("gallery_categories")
      .update(champs)
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "catégorie de galerie" });

    const refus = requireOneRow(data, {
      ressource: "catégorie de galerie",
      action: "modifier",
    });
    if (refus) throw refus;

    return toGalleryCategory(data![0]!);
  }

  async delete(id: string): Promise<void> {
    const { data, error } = await this.supabase
      .from("gallery_categories")
      .delete()
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "catégorie de galerie" });

    // Découverte nº 1 : la RLS FILTRE au lieu de rejeter. Zéro ligne = refus.
    const refus = requireDeleted(data, "catégorie de galerie");
    if (refus) throw refus;
  }

  async reorder(orderedIds: string[]): Promise<void> {
    // Une transaction unique, côté base. `gallery_categories` fait partie de la
    // liste blanche de `reorder_rows` (migration 0012) et porte bien une
    // colonne `position`.
    const { error } = await this.supabase.rpc("reorder_rows", {
      p_table: "gallery_categories",
      p_ids: orderedIds,
    });

    if (error) throw mapPostgrestError(error, { ressource: "catégorie de galerie" });
  }
}
