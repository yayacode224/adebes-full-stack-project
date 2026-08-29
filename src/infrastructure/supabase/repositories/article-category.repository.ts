import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ArticleCategory,
  CreateArticleCategory,
  UpdateArticleCategory,
} from "@/core/cms/entities/article";
import type {
  ArticleCategoryReadPort,
  ArticleCategoryWritePort,
} from "@/core/cms/ports/article.port";

import type { Database } from "../database.types";
import { mapPostgrestError, requireDeleted, requireOneRow } from "../errors";
import {
  toArticleCategory,
  toArticleCategoryInsert,
  toArticleCategoryUpdate,
} from "../mappers/article.mapper";

/**
 * Implémentation Supabase des ports de catégorie d'actualité.
 *
 * Dépôt SÉPARÉ de `SupabaseArticleRepository`, et non une poignée de méthodes
 * de plus : les deux tables ont des droits distincts en base — la RLS ouvre la
 * modification d'une catégorie au personnel mais réserve son ajout et sa
 * suppression à `app_can_publish()` (migration 0009). Un dépôt unique aurait
 * laissé croire qu'un même jeu de droits couvre les deux.
 *
 * ⚠️  L'ordre est TOUJOURS `position asc` : c'est celui des boutons de filtre
 * de `/actualites`. Aucune méthode n'expose de tri alternatif — une liste de
 * cinq libellés n'a pas de raison d'être triée autrement, et l'ordre est
 * précisément ce que l'utilisateur vient de régler à la main.
 */
export class SupabaseArticleCategoryRepository
  implements ArticleCategoryReadPort, ArticleCategoryWritePort
{
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  // ═══════════════════════════════════════════════════════════════ Lecture ══

  async findAll(): Promise<ArticleCategory[]> {
    const { data, error } = await this.supabase
      .from("article_categories")
      .select("*")
      .order("position", { ascending: true })
      // Départage stable quand deux catégories partagent une position — ce qui
      // arrive après un `insert` manuel en base, où `position` vaut 0 par
      // défaut. Sans ce second critère, l'ordre varierait d'une requête à
      // l'autre et le filtre du site changerait tout seul.
      .order("label", { ascending: true });

    if (error) throw mapPostgrestError(error, { ressource: "catégorie" });
    return (data ?? []).map(toArticleCategory);
  }

  async findById(id: string): Promise<ArticleCategory | null> {
    const { data, error } = await this.supabase
      .from("article_categories")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw mapPostgrestError(error, { ressource: "catégorie" });
    return data ? toArticleCategory(data) : null;
  }

  async findBySlug(slug: string): Promise<ArticleCategory | null> {
    const { data, error } = await this.supabase
      .from("article_categories")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw mapPostgrestError(error, { ressource: "catégorie" });
    return data ? toArticleCategory(data) : null;
  }

  // ═══════════════════════════════════════════════════════════════ Écriture ══

  async create(input: CreateArticleCategory): Promise<ArticleCategory> {
    const { data, error } = await this.supabase
      .from("article_categories")
      .insert(toArticleCategoryInsert({ ...input, slug: input.slug ?? "" }))
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "catégorie" });

    const refus = requireOneRow(data, { ressource: "catégorie", action: "créer" });
    if (refus) throw refus;

    return toArticleCategory(data![0]);
  }

  async update(
    id: string,
    input: UpdateArticleCategory,
  ): Promise<ArticleCategory> {
    const champs = toArticleCategoryUpdate(input);

    if (Object.keys(champs).length === 0) {
      const actuelle = await this.findById(id);
      if (!actuelle) {
        throw requireOneRow(null, { ressource: "catégorie", action: "modifier" });
      }
      return actuelle;
    }

    const { data, error } = await this.supabase
      .from("article_categories")
      .update(champs)
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "catégorie" });

    const refus = requireOneRow(data, { ressource: "catégorie", action: "modifier" });
    if (refus) throw refus;

    return toArticleCategory(data![0]);
  }

  async delete(id: string): Promise<void> {
    const { data, error } = await this.supabase
      .from("article_categories")
      .delete()
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "catégorie" });

    // Découverte nº 1 : la RLS FILTRE au lieu de rejeter. Zéro ligne = refus.
    const refus = requireDeleted(data, "catégorie");
    if (refus) throw refus;
  }

  async reorder(orderedIds: string[]): Promise<void> {
    // Une transaction unique, côté base. `article_categories` fait partie de la
    // liste blanche de `reorder_rows` (migration 0012) et porte bien une
    // colonne `position` — ce qui n'est pas le cas de `articles`, pourtant
    // présente dans cette même liste blanche : voir l'avertissement de
    // `article.repository.ts`.
    const { error } = await this.supabase.rpc("reorder_rows", {
      p_table: "article_categories",
      p_ids: orderedIds,
    });

    if (error) throw mapPostgrestError(error, { ressource: "catégorie" });
  }
}
