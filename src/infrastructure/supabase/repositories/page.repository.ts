import type { SupabaseClient } from "@supabase/supabase-js";

import type { ContentStatus } from "@/core/cms/entities/content-status";
import type {
  CreatePage,
  Page,
  PageSection,
  PageWithSections,
  UpdatePage,
} from "@/core/cms/entities/page";
import type { PageReadPort, PageWritePort } from "@/core/cms/ports/page.port";
import { normalizeFilter, toRange, type ListFilter } from "@/core/shared/pagination";

import type { Database } from "../database.types";
import { mapPostgrestError, requireDeleted, requireOneRow } from "../errors";
import {
  toPage,
  toPageInsert,
  toPageSection,
  toPageUpdate,
} from "../mappers/page.mapper";

/** Colonnes autorisées au tri — jamais la valeur brute reçue du client. */
const COLONNES_TRI = new Set([
  "title",
  "route",
  "status",
  "created_at",
  "updated_at",
  "published_at",
]);

const TRI_ALIAS: Record<string, string> = {
  createdAt: "created_at",
  updatedAt: "updated_at",
  publishedAt: "published_at",
};

/**
 * Implémentation Supabase des ports de la page.
 *
 * Reçoit son client par injection : le même code sert au dashboard (client
 * serveur, avec cookies) et au rendu public (client public, sans cookies).
 * C'est la RLS qui fait la différence, pas une branche dans ce fichier.
 *
 * ⚠️  Les méthodes LÈVENT une `AppError`, elles ne renvoient pas de `Result`.
 * La frontière qui transforme l'exception en réponse sérialisable est
 * `createAction` (Lot 4).
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `pages` N'EST PAS DANS LA LISTE BLANCHE DE `reorder_rows`, ET C'EST NORMAL
 * ---------------------------------------------------------------------------
 * La table n'a pas de colonne `position` : l'ordre des pages n'existe pas. Ce
 * sont les SECTIONS qui se réordonnent, et `page_sections` figure bien dans la
 * liste blanche de la migration 0012 — vérifié dans le fichier, pas supposé.
 */
export class SupabasePageRepository implements PageReadPort, PageWritePort {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  // ═══════════════════════════════════════════════════════════════ Lecture ══

  async findAll(filter: ListFilter = {}): Promise<Page[]> {
    const normalise = normalizeFilter(filter);
    let requete = this.supabase.from("pages").select("*");

    if (normalise.search) {
      const q = echapperRecherche(normalise.search);
      requete = requete.or(`title.ilike.%${q}%,route.ilike.%${q}%`);
    }

    if (normalise.status) {
      requete = requete.eq("status", normalise.status as ContentStatus);
    }

    requete = requete.order(colonneDeTri(normalise.sortBy), {
      ascending: normalise.sortDirection !== "desc",
    });

    const { from, to } = toRange(normalise);
    requete = requete.range(from, to);

    const { data, error } = await requete;
    if (error) throw mapPostgrestError(error, { ressource: "page" });

    return (data ?? []).map(toPage);
  }

  async findById(id: string): Promise<Page | null> {
    const { data, error } = await this.supabase
      .from("pages")
      .select("*")
      .eq("id", id)
      // `maybeSingle` et non `single` : l'absence est un cas normal.
      .maybeSingle();

    if (error) throw mapPostgrestError(error, { ressource: "page" });
    return data ? toPage(data) : null;
  }

  async findBySlug(slug: string): Promise<Page | null> {
    const { data, error } = await this.supabase
      .from("pages")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw mapPostgrestError(error, { ressource: "page" });
    return data ? toPage(data) : null;
  }

  async findByRoute(route: string): Promise<Page | null> {
    const { data, error } = await this.supabase
      .from("pages")
      .select("*")
      .eq("route", route)
      .maybeSingle();

    if (error) throw mapPostgrestError(error, { ressource: "page" });
    return data ? toPage(data) : null;
  }

  async count(filter: ListFilter = {}): Promise<number> {
    let requete = this.supabase
      .from("pages")
      .select("*", { count: "exact", head: true });

    if (filter.search?.trim()) {
      const q = echapperRecherche(filter.search.trim());
      requete = requete.or(`title.ilike.%${q}%,route.ilike.%${q}%`);
    }
    if (filter.status) {
      requete = requete.eq("status", filter.status as ContentStatus);
    }

    const { count, error } = await requete;
    if (error) throw mapPostgrestError(error, { ressource: "page" });
    return count ?? 0;
  }

  /**
   * La page publiée servie à cette adresse, sections VISIBLES comprises.
   *
   * ---------------------------------------------------------------------------
   * ⚠️  UNE SEULE REQUÊTE, ET LE FILTRE SUR LES SECTIONS EST EXPLICITE
   * ---------------------------------------------------------------------------
   * La jointure imbriquée de PostgREST (`page_sections(*)`) évite le second
   * aller-retour sur le chemin le plus chaud du site.
   *
   * `eq("page_sections.is_visible", true)` est posé alors que la politique
   * `page_sections_public_read` impose déjà `is_visible`. Les deux barrières
   * sont indépendantes, et ce filtre-ci doit rester correct appelé avec un
   * client AUTHENTIFIÉ, pour qui `page_sections_staff_read` rend TOUTES les
   * sections — y compris les masquées. Sans lui, un membre du personnel
   * connecté verrait sur le site public des sections que le visiteur ne voit
   * pas, et ne s'en rendrait jamais compte.
   *
   * Même raisonnement pour `eq("status", "published")` sur la page.
   */
  async findPublishedByRoute(route: string): Promise<PageWithSections | null> {
    const { data, error } = await this.supabase
      .from("pages")
      .select("*, page_sections(*)")
      .eq("route", route)
      .eq("status", "published")
      .eq("page_sections.is_visible", true)
      .maybeSingle();

    if (error) throw mapPostgrestError(error, { ressource: "page" });
    if (!data) return null;

    const { page_sections: sections, ...page } = data;

    return {
      ...toPage(page),
      // PostgREST ne garantit pas l'ordre d'une relation imbriquée : le tri est
      // fait ici plutôt que par un `order()` sur la table jointe, dont la
      // syntaxe change selon les versions.
      sections: (sections ?? [])
        .map(toPageSection)
        .sort((a, b) => a.position - b.position),
    };
  }

  /**
   * Le nombre de sections de chaque page.
   *
   * Une seule requête qui ne rapatrie qu'une colonne, puis un comptage en
   * mémoire. L'alternative — un `count` groupé — n'existe pas dans PostgREST
   * sans une vue dédiée, et trente lignes d'identifiants ne justifient pas une
   * migration.
   */
  async countSectionsByPage(): Promise<Map<string, number>> {
    const { data, error } = await this.supabase
      .from("page_sections")
      .select("page_id");

    if (error) throw mapPostgrestError(error, { ressource: "section" });

    const compte = new Map<string, number>();
    for (const ligne of data ?? []) {
      compte.set(ligne.page_id, (compte.get(ligne.page_id) ?? 0) + 1);
    }
    return compte;
  }

  // ══════════════════════════════════════════════════════════════ Écriture ══

  async create(input: CreatePage): Promise<Page> {
    const { data, error } = await this.supabase
      .from("pages")
      .insert(toPageInsert(input))
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "page" });

    /*
      Voir « écriture silencieusement refusée » dans errors.ts.

      `pages_admin_insert` exige `app_can_publish()` : un ÉDITEUR qui
      atteindrait cette méthode verrait son insertion FILTRÉE par la RLS —
      HTTP 201 et zéro ligne, soit un succès apparent.
    */
    const refus = requireOneRow(data, { ressource: "page", action: "créer" });
    if (refus) throw refus;

    return toPage(data![0]);
  }

  async update(id: string, input: UpdatePage): Promise<Page> {
    const champs = toPageUpdate(input);

    // Une mise à jour vide renverrait 0 ligne et serait prise pour un refus.
    if (Object.keys(champs).length === 0) {
      const actuelle = await this.findById(id);
      if (!actuelle) {
        throw requireOneRow(null, { ressource: "page", action: "modifier" });
      }
      return actuelle;
    }

    const { data, error } = await this.supabase
      .from("pages")
      .update(champs)
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "page" });

    const refus = requireOneRow(data, { ressource: "page", action: "modifier" });
    if (refus) throw refus;

    return toPage(data![0]);
  }

  async delete(id: string): Promise<void> {
    const { data, error } = await this.supabase
      .from("pages")
      .delete()
      .eq("id", id)
      .select();

    // ⚠️  Le trigger `guard_system_page` lève ADB03 sur une page système, et
    // `mapPostgrestError` rend son message tel quel — celui de la base est
    // déjà en français et déjà juste.
    if (error) throw mapPostgrestError(error, { ressource: "page" });

    // Sans ce contrôle, une suppression refusée par la RLS renvoie HTTP 204 et
    // passerait pour un succès. Mesuré au Lot 1.
    const refus = requireDeleted(data, "page");
    if (refus) throw refus;
  }

  async setStatus(id: string, status: ContentStatus): Promise<Page> {
    /*
      `published_at` est posé à la PREMIÈRE publication et jamais recalculé —
      même règle qu'aux neuf collections de la série 8. Une page dépubliée puis
      republiée garde sa date d'origine : c'est celle qui a du sens pour un
      lecteur, pas celle du dernier aller-retour éditorial.

      Il faut donc lire avant d'écrire. Le faire dans une fonction SQL aurait
      économisé un aller-retour ; ce serait la huitième variante d'un geste que
      les neuf collections font déjà ainsi, pour un gain nul sur douze lignes.
    */
    const actuelle = await this.findById(id);
    if (!actuelle) {
      throw requireOneRow(null, { ressource: "page", action: "modifier" });
    }

    const champs: { status: ContentStatus; published_at?: string } = { status };
    if (status === "published" && actuelle.publishedAt === null) {
      champs.published_at = new Date().toISOString();
    }

    const { data, error } = await this.supabase
      .from("pages")
      .update(champs)
      .eq("id", id)
      .select();

    // ⚠️  Le trigger `guard_publish` lève ADB01 si un éditeur tente de
    // publier — troisième barrière après la matrice RBAC et `createAction`.
    if (error) throw mapPostgrestError(error, { ressource: "page" });

    const refus = requireOneRow(data, { ressource: "page", action: "modifier" });
    if (refus) throw refus;

    return toPage(data![0]);
  }
}

/**
 * Neutralise les caractères qui ont un sens dans la syntaxe de filtre
 * PostgREST.
 *
 * `or()` reçoit une CHAÎNE que PostgREST analyse : une virgule y sépare deux
 * conditions, les parenthèses groupent, `%` et `_` sont les jokers de `ilike`.
 *
 * ⚠️  La barre oblique est CONSERVÉE, contrairement aux neuf autres dépôts :
 * c'est le caractère le plus utile de cette recherche — on cherche
 * « /a-propos », pas « a propos ».
 */
function echapperRecherche(valeur: string): string {
  return valeur.replace(/[,()%_\\*"']/g, " ").trim();
}

function colonneDeTri(sortBy: string | undefined): string {
  if (!sortBy) return "title";
  const colonne = TRI_ALIAS[sortBy] ?? sortBy;
  return COLONNES_TRI.has(colonne) ? colonne : "title";
}

/** Type utilitaire employé par le dépôt de sections, pour rester cohérent. */
export type { PageSection };
