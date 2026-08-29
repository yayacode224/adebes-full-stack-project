import type { SupabaseClient } from "@supabase/supabase-js";

import type { ContentStatus } from "@/core/cms/entities/content-status";
import type {
  CreateTestimonial,
  Testimonial,
  UpdateTestimonial,
} from "@/core/cms/entities/testimonial";
import type {
  TestimonialReadPort,
  TestimonialWritePort,
} from "@/core/cms/ports/testimonial.port";
import { normalizeFilter, toRange, type ListFilter } from "@/core/shared/pagination";

import type { Database } from "../database.types";
import { mapPostgrestError, requireDeleted, requireOneRow } from "../errors";
import {
  toTestimonial,
  toTestimonialInsert,
  toTestimonialUpdate,
} from "../mappers/testimonial.mapper";

/** Colonnes autorisées au tri — jamais la valeur brute reçue du client. */
const COLONNES_TRI = new Set([
  "position",
  "author_name",
  "author_role",
  "status",
  "created_at",
  "updated_at",
]);

/** Traduction camelCase → colonne SQL pour le tri. */
const TRI_ALIAS: Record<string, string> = {
  createdAt: "created_at",
  updatedAt: "updated_at",
  authorName: "author_name",
  authorRole: "author_role",
};

/**
 * Implémentation Supabase des ports du témoignage.
 *
 * Reçoit son client par injection : le même code sert au dashboard (client
 * serveur, avec cookies) et aux lectures publiques (client public, sans
 * cookies). C'est la RLS qui fait la différence entre les deux, pas une
 * branche dans ce fichier.
 *
 * ⚠️  Les méthodes LÈVENT une `AppError` en cas d'échec, elles ne renvoient
 * pas de `Result`. La frontière qui transforme l'exception en réponse
 * sérialisable est `createAction` (Lot 4).
 *
 * ---------------------------------------------------------------------------
 * `reorder_rows('testimonials')` EST LÉGITIME ICI
 * ---------------------------------------------------------------------------
 * Contrairement au Lot 8B, où l'entrée `'articles'` de la liste blanche de la
 * migration 0012 désigne une table SANS colonne `position` — défaut latent
 * signalé et laissé à une migration future. `testimonials`, elle, porte bien
 * cette colonne (migration 0005) : l'appel ci-dessous est celui pour lequel la
 * fonction a été écrite.
 */
export class SupabaseTestimonialRepository
  implements TestimonialReadPort, TestimonialWritePort
{
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  // ═══════════════════════════════════════════════════════════════ Lecture ══

  async findAll(filter: ListFilter = {}): Promise<Testimonial[]> {
    const normalise = normalizeFilter(filter);
    let requete = this.supabase.from("testimonials").select("*");

    if (normalise.status) {
      requete = requete.eq("status", normalise.status as ContentStatus);
    }

    if (normalise.search) {
      const q = echapperRecherche(normalise.search);
      requete = requete.or(
        `quote.ilike.%${q}%,author_name.ilike.%${q}%,author_role.ilike.%${q}%`,
      );
    }

    const colonne = colonneDeTri(normalise.sortBy);
    requete = requete.order(colonne, {
      ascending: normalise.sortDirection !== "desc",
    });

    const { from, to } = toRange(normalise);
    requete = requete.range(from, to);

    const { data, error } = await requete;
    if (error) throw mapPostgrestError(error, { ressource: "témoignage" });

    return (data ?? []).map(toTestimonial);
  }

  async findById(id: string): Promise<Testimonial | null> {
    const { data, error } = await this.supabase
      .from("testimonials")
      .select("*")
      .eq("id", id)
      // `maybeSingle` et non `single` : l'absence est un cas normal.
      // `single` lèverait PGRST116.
      .maybeSingle();

    if (error) throw mapPostgrestError(error, { ressource: "témoignage" });
    return data ? toTestimonial(data) : null;
  }

  /**
   * Les témoignages publiés, dans l'ordre d'affichage.
   *
   * La règle publique tient en une méthode plutôt qu'en trois conditions
   * recopiées par chaque appelant. Elle est plus simple que celle des
   * actualités : aucune date à échoir, un témoignage publié est visible.
   */
  async findPublished(limit = 100): Promise<Testimonial[]> {
    const { data, error } = await this.supabase
      .from("testimonials")
      .select("*")
      .eq("status", "published")
      .order("position", { ascending: true })
      .limit(limit);

    if (error) throw mapPostgrestError(error, { ressource: "témoignage" });
    return (data ?? []).map(toTestimonial);
  }

  async count(filter: ListFilter = {}): Promise<number> {
    // `head: true` : on ne rapatrie aucune ligne, seulement l'en-tête de
    // comptage.
    let requete = this.supabase
      .from("testimonials")
      .select("*", { count: "exact", head: true });

    if (filter.status) {
      requete = requete.eq("status", filter.status as ContentStatus);
    }
    if (filter.search?.trim()) {
      const q = echapperRecherche(filter.search.trim());
      requete = requete.or(
        `quote.ilike.%${q}%,author_name.ilike.%${q}%,author_role.ilike.%${q}%`,
      );
    }

    const { count, error } = await requete;
    if (error) throw mapPostgrestError(error, { ressource: "témoignage" });
    return count ?? 0;
  }

  async countByProgramme(programmeId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("testimonials")
      .select("*", { count: "exact", head: true })
      .eq("programme_id", programmeId);

    if (error) throw mapPostgrestError(error, { ressource: "témoignage" });
    return count ?? 0;
  }

  // ═══════════════════════════════════════════════════════════════ Écriture ══

  async create(input: CreateTestimonial): Promise<Testimonial> {
    const { data, error } = await this.supabase
      .from("testimonials")
      .insert(toTestimonialInsert(input))
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "témoignage" });

    // Voir le commentaire « écriture silencieusement refusée » dans errors.ts.
    const refus = requireOneRow(data, { ressource: "témoignage", action: "créer" });
    if (refus) throw refus;

    return toTestimonial(data![0]);
  }

  async update(id: string, input: UpdateTestimonial): Promise<Testimonial> {
    const champs = toTestimonialUpdate(input);

    // Une mise à jour vide renverrait 0 ligne et serait prise pour un refus.
    if (Object.keys(champs).length === 0) {
      const actuel = await this.findById(id);
      if (!actuel) {
        throw requireOneRow(null, { ressource: "témoignage", action: "modifier" });
      }
      return actuel;
    }

    const { data, error } = await this.supabase
      .from("testimonials")
      .update(champs)
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "témoignage" });

    const refus = requireOneRow(data, { ressource: "témoignage", action: "modifier" });
    if (refus) throw refus;

    return toTestimonial(data![0]);
  }

  async delete(id: string): Promise<void> {
    const { data, error } = await this.supabase
      .from("testimonials")
      .delete()
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "témoignage" });

    // ⚠️  Sans ce contrôle, une suppression refusée par la RLS renvoie
    // HTTP 204 et passerait pour un succès. Mesuré au Lot 1.
    const refus = requireDeleted(data, "témoignage");
    if (refus) throw refus;
  }

  async reorder(orderedIds: string[]): Promise<void> {
    // Une transaction unique, côté base : N requêtes successives laisseraient
    // des positions incohérentes si l'une échouait (§3.4 du Rapport 2).
    const { error } = await this.supabase.rpc("reorder_rows", {
      p_table: "testimonials",
      p_ids: orderedIds,
    });

    if (error) throw mapPostgrestError(error, { ressource: "témoignage" });
  }

  async setStatus(id: string, status: ContentStatus): Promise<Testimonial> {
    const { data, error } = await this.supabase
      .from("testimonials")
      .update({ status })
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "témoignage" });

    const refus = requireOneRow(data, { ressource: "témoignage", action: "modifier" });
    if (refus) throw refus;

    return toTestimonial(data![0]);
  }
}

/**
 * Neutralise les caractères qui ont un sens dans la syntaxe de filtre
 * PostgREST.
 *
 * `or()` reçoit une CHAÎNE que PostgREST analyse : une virgule y sépare deux
 * conditions, les parenthèses groupent. Le pourcentage et le tiret bas sont
 * les jokers de `ilike`.
 *
 * ⚠️  L'apostrophe est retirée elle aussi. Sur cette collection plus que sur
 * les autres, c'est visible : les citations françaises en sont pleines
 * (« l'accompagnement »). Rechercher « l'accompagnement » revient donc à
 * rechercher « l accompagnement », et `ilike %…%` ne trouve rien. La parade
 * est de taper le mot seul — comportement identique aux Lots 8A et 8B, où le
 * même échappement est appliqué.
 */
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
