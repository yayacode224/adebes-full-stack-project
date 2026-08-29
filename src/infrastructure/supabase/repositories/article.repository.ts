import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  Article,
  CreateArticle,
  UpdateArticle,
} from "@/core/cms/entities/article";
import type { ContentStatus } from "@/core/cms/entities/content-status";
import type {
  ArticleReadPort,
  ArticleWritePort,
} from "@/core/cms/ports/article.port";
import {
  normalizeFilter,
  toRange,
  type ListFilter,
} from "@/core/shared/pagination";

import type { Database } from "../database.types";
import { mapPostgrestError, requireDeleted, requireOneRow } from "../errors";
import { toArticle, toArticleInsert, toArticleUpdate } from "../mappers/article.mapper";

/** Colonnes autorisées au tri — jamais la valeur brute reçue du client. */
const COLONNES_TRI = new Set([
  "published_at",
  "title",
  "slug",
  "status",
  "created_at",
  "updated_at",
]);

/** Traduction camelCase → colonne SQL pour le tri. */
const TRI_ALIAS: Record<string, string> = {
  publishedAt: "published_at",
  createdAt: "created_at",
  updatedAt: "updated_at",
};

/**
 * Implémentation Supabase des ports de l'actualité.
 *
 * Reçoit son client par injection : le même code sert au dashboard (client
 * serveur, avec cookies) et aux lectures publiques (client anonyme). C'est la
 * RLS qui fait la différence entre les deux, pas une branche dans ce fichier.
 *
 * ⚠️  Les méthodes LÈVENT une `AppError` en cas d'échec, elles ne renvoient pas
 * de `Result`. La frontière qui transforme l'exception en réponse sérialisable
 * est `createAction`.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  AUCUNE MÉTHODE `reorder` ICI — ET C'EST UN DÉFAUT LATENT À CONNAÎTRE
 * ---------------------------------------------------------------------------
 * La table `articles` n'a PAS de colonne `position` (migration 0005) : un fil
 * d'actualités s'ordonne par `published_at`. Elle figure pourtant dans la liste
 * blanche de `reorder_rows` (migration 0012), aux côtés de tables qui, elles,
 * portent bien une `position`.
 *
 * Conséquence : un appel à `reorder_rows('articles', …)` passerait les deux
 * gardes de la fonction — liste blanche, puis contrôle de rôle — pour échouer
 * ensuite sur `column "position" does not exist`, avec un message technique que
 * `mapPostgrestError` traduirait en « Une erreur technique est survenue ».
 *
 * Personne n'appelle cette combinaison, et ce dépôt ne l'expose pas : le port
 * `ArticleWritePort` ne déclare pas `reorder`, donc le cas ne se compile même
 * pas. Le réordonnancement du Lot 8B porte sur les CATÉGORIES
 * (`article-category.repository.ts`). Le retrait de `'articles'` de la liste
 * blanche appartient à une migration, hors périmètre de ce lot ; il est
 * consigné dans REPRISE-CONTEXTE.
 */
export class SupabaseArticleRepository
  implements ArticleReadPort, ArticleWritePort
{
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  // ═══════════════════════════════════════════════════════════════ Lecture ══

  async findAll(filter: ListFilter = {}): Promise<Article[]> {
    const normalise = normalizeFilter(filter);
    let requete = this.supabase.from("articles").select("*");

    if (normalise.status) {
      requete = requete.eq("status", normalise.status as ContentStatus);
    }

    if (normalise.search) {
      const q = echapperRecherche(normalise.search);
      requete = requete.or(`title.ilike.%${q}%,excerpt.ilike.%${q}%`);
    }

    const colonne = colonneDeTri(normalise.sortBy);
    requete = requete.order(colonne, {
      ascending: normalise.sortDirection !== "desc",
      /*
        Les brouillons n'ont pas de date de publication. Sans `nullsFirst:
        false`, PostgreSQL les remonte EN TÊTE d'un tri descendant (`nulls
        first` est son défaut pour `desc`) : le dashboard s'ouvrirait sur les
        brouillons, et le fil public — s'il en contenait — commencerait par du
        vide.
      */
      nullsFirst: false,
    });

    const { from, to } = toRange(normalise);
    requete = requete.range(from, to);

    const { data, error } = await requete;
    if (error) throw mapPostgrestError(error, { ressource: "article" });

    return (data ?? []).map(toArticle);
  }

  async findBySlug(slug: string): Promise<Article | null> {
    const { data, error } = await this.supabase
      .from("articles")
      .select("*")
      .eq("slug", slug)
      // `maybeSingle` et non `single` : l'absence est un cas normal ici
      // (vérification d'unicité avant création). `single` lèverait PGRST116.
      .maybeSingle();

    if (error) throw mapPostgrestError(error, { ressource: "article" });
    return data ? toArticle(data) : null;
  }

  async findById(id: string): Promise<Article | null> {
    const { data, error } = await this.supabase
      .from("articles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw mapPostgrestError(error, { ressource: "article" });
    return data ? toArticle(data) : null;
  }

  /**
   * Les articles réellement visibles du public.
   *
   * ⚠️  LA CONDITION DE DATE EST ICI, PAS DANS UN FILTRE DE L'APPELANT.
   *
   * `published_at is null or published_at <= now()` — la même que la politique
   * RLS `articles_public_read` (écart nº 12). Elle est répétée parce que la
   * RLS ne protège que le client ANONYME : ce dépôt sert aussi le dashboard,
   * avec un client authentifié pour lequel la politique `articles_staff_read`
   * ouvre tout. Sans cette clause, l'aperçu du site rendu depuis une session
   * connectée montrerait les articles programmés.
   */
  async findPublished(limit = 100): Promise<Article[]> {
    const { data, error } = await this.supabase
      .from("articles")
      .select("*")
      .eq("status", "published")
      .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) throw mapPostgrestError(error, { ressource: "article" });
    return (data ?? []).map(toArticle);
  }

  async count(filter: ListFilter = {}): Promise<number> {
    /*
      ⚠️  TOUTE CONDITION AJOUTÉE À `findAll` DOIT L'ÊTRE ICI AUSSI.

      La chaîne de filtres est écrite deux fois, comme au Lot 7 (écart nº 53) :
      la factoriser imposerait un `as unknown as`, le constructeur de requêtes
      PostgREST étant typé par la table ET par la projection — `head: true` ne
      produit pas le même type que `select('*')`. Quelques lignes redites
      valent mieux qu'une conversion qui désactive le typage sur toute une
      couche d'accès aux données.
    */
    let requete = this.supabase
      .from("articles")
      .select("*", { count: "exact", head: true });

    if (filter.status) {
      requete = requete.eq("status", filter.status as ContentStatus);
    }
    if (filter.search?.trim()) {
      const q = echapperRecherche(filter.search.trim());
      requete = requete.or(`title.ilike.%${q}%,excerpt.ilike.%${q}%`);
    }

    const { count, error } = await requete;
    if (error) throw mapPostgrestError(error, { ressource: "article" });
    return count ?? 0;
  }

  async countByCategory(categoryId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("articles")
      .select("*", { count: "exact", head: true })
      .eq("category_id", categoryId);

    if (error) throw mapPostgrestError(error, { ressource: "article" });
    return count ?? 0;
  }

  async listSlugs(): Promise<string[]> {
    const { data, error } = await this.supabase.from("articles").select("slug");
    if (error) throw mapPostgrestError(error, { ressource: "article" });
    return (data ?? []).map((r) => r.slug);
  }

  // ═══════════════════════════════════════════════════════════════ Écriture ══

  async create(input: CreateArticle): Promise<Article> {
    const { data, error } = await this.supabase
      .from("articles")
      .insert(toArticleInsert({ ...input, slug: input.slug ?? "" }))
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "article" });

    // Voir le commentaire « écriture silencieusement refusée » dans errors.ts.
    const refus = requireOneRow(data, { ressource: "article", action: "créer" });
    if (refus) throw refus;

    return toArticle(data![0]);
  }

  async update(id: string, input: UpdateArticle): Promise<Article> {
    const champs = toArticleUpdate(input);

    // Une mise à jour vide renverrait 0 ligne et serait prise pour un refus.
    if (Object.keys(champs).length === 0) {
      const actuel = await this.findById(id);
      if (!actuel) {
        throw requireOneRow(null, { ressource: "article", action: "modifier" });
      }
      return actuel;
    }

    const { data, error } = await this.supabase
      .from("articles")
      .update(champs)
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "article" });

    const refus = requireOneRow(data, { ressource: "article", action: "modifier" });
    if (refus) throw refus;

    return toArticle(data![0]);
  }

  async delete(id: string): Promise<void> {
    const { data, error } = await this.supabase
      .from("articles")
      .delete()
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "article" });

    // ⚠️  Sans ce contrôle, une suppression refusée par la RLS renvoie
    // HTTP 204 et passerait pour un succès (découverte nº 1).
    const refus = requireDeleted(data, "article");
    if (refus) throw refus;
  }

  async setStatus(
    id: string,
    status: ContentStatus,
    publishedAt?: string | null,
  ): Promise<Article> {
    // `publishedAt` omis = date inchangée. La distinction `undefined` / `null`
    // est celle du mapper : `null` EFFACE la date, `undefined` ne l'écrit pas.
    const champs =
      publishedAt === undefined ? { status } : { status, published_at: publishedAt };

    const { data, error } = await this.supabase
      .from("articles")
      .update(champs)
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "article" });

    const refus = requireOneRow(data, { ressource: "article", action: "modifier" });
    if (refus) throw refus;

    return toArticle(data![0]);
  }
}

/**
 * Neutralise les caractères qui ont un sens dans la syntaxe de filtre
 * PostgREST.
 *
 * Voir le commentaire détaillé de `programme.repository.ts` : une virgule y
 * sépare deux conditions, `%` et `_` sont les jokers de `ilike`. Une recherche
 * « santé, éducation » produirait sinon un filtre malformé.
 */
function echapperRecherche(valeur: string): string {
  return valeur.replace(/[,()%_\\*"']/g, " ").trim();
}

function colonneDeTri(sortBy: string | undefined): string {
  if (!sortBy) return "published_at";
  const colonne = TRI_ALIAS[sortBy] ?? sortBy;
  // Une colonne inconnue est ignorée plutôt que transmise : `order()` sur une
  // colonne inexistante lève une erreur PostgREST peu lisible.
  return COLONNES_TRI.has(colonne) ? colonne : "published_at";
}
