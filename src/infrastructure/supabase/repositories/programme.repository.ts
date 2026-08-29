import type { SupabaseClient } from "@supabase/supabase-js";

import type { ContentStatus } from "@/core/cms/entities/content-status";
import type {
  CreateProgramme,
  Programme,
  UpdateProgramme,
} from "@/core/cms/entities/programme";
import type {
  ProgrammeReadPort,
  ProgrammeWritePort,
} from "@/core/cms/ports/programme.port";
import { normalizeFilter, toRange, type ListFilter } from "@/core/shared/pagination";

import type { Database } from "../database.types";
import { mapPostgrestError, requireDeleted, requireOneRow } from "../errors";
import {
  toProgramme,
  toProgrammeInsert,
  toProgrammeUpdate,
} from "../mappers/programme.mapper";

/** Colonnes autorisées au tri — jamais la valeur brute reçue du client. */
const COLONNES_TRI = new Set([
  "position",
  "title",
  "slug",
  "status",
  "created_at",
  "updated_at",
]);

/** Traduction camelCase → colonne SQL pour le tri. */
const TRI_ALIAS: Record<string, string> = {
  createdAt: "created_at",
  updatedAt: "updated_at",
  shortTitle: "short_title",
};

/**
 * Implémentation Supabase des ports du programme.
 *
 * Reçoit son client par injection : le même code sert au dashboard (client
 * serveur, avec cookies) et aux lectures publiques mises en cache (client
 * public, sans cookies). C'est la RLS qui fait la différence entre les deux,
 * pas une branche dans ce fichier.
 *
 * ⚠️  Les méthodes LÈVENT une `AppError` en cas d'échec, elles ne renvoient
 * pas de `Result`. La frontière qui transforme l'exception en réponse
 * sérialisable est `createAction` (Lot 4). Les cas d'usage, eux, réservent le
 * `Result` aux règles métier — un slug déjà pris n'est pas une panne.
 */
export class SupabaseProgrammeRepository
  implements ProgrammeReadPort, ProgrammeWritePort
{
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  // ═══════════════════════════════════════════════════════════════ Lecture ══

  async findAll(filter: ListFilter = {}): Promise<Programme[]> {
    const normalise = normalizeFilter(filter);
    let requete = this.supabase.from("programmes").select("*");

    if (normalise.status) {
      requete = requete.eq("status", normalise.status as ContentStatus);
    }

    if (normalise.search) {
      const q = echapperRecherche(normalise.search);
      requete = requete.or(`title.ilike.%${q}%,summary.ilike.%${q}%`);
    }

    const colonne = colonneDeTri(normalise.sortBy);
    requete = requete.order(colonne, {
      ascending: normalise.sortDirection !== "desc",
    });

    const { from, to } = toRange(normalise);
    requete = requete.range(from, to);

    const { data, error } = await requete;
    if (error) throw mapPostgrestError(error, { ressource: "programme" });

    return (data ?? []).map(toProgramme);
  }

  async findBySlug(slug: string): Promise<Programme | null> {
    const { data, error } = await this.supabase
      .from("programmes")
      .select("*")
      .eq("slug", slug)
      // `maybeSingle` et non `single` : l'absence est un cas normal ici
      // (vérification d'unicité avant création). `single` lèverait PGRST116.
      .maybeSingle();

    if (error) throw mapPostgrestError(error, { ressource: "programme" });
    return data ? toProgramme(data) : null;
  }

  async findById(id: string): Promise<Programme | null> {
    const { data, error } = await this.supabase
      .from("programmes")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw mapPostgrestError(error, { ressource: "programme" });
    return data ? toProgramme(data) : null;
  }

  async count(filter: ListFilter = {}): Promise<number> {
    // `head: true` : on ne rapatrie aucune ligne, seulement l'en-tête de
    // comptage. Compter en chargeant les lignes serait absurde sur une liste
    // paginée.
    let requete = this.supabase
      .from("programmes")
      .select("*", { count: "exact", head: true });

    if (filter.status) {
      requete = requete.eq("status", filter.status as ContentStatus);
    }
    if (filter.search?.trim()) {
      const q = echapperRecherche(filter.search.trim());
      requete = requete.or(`title.ilike.%${q}%,summary.ilike.%${q}%`);
    }

    const { count, error } = await requete;
    if (error) throw mapPostgrestError(error, { ressource: "programme" });
    return count ?? 0;
  }

  async listSlugs(): Promise<string[]> {
    const { data, error } = await this.supabase.from("programmes").select("slug");
    if (error) throw mapPostgrestError(error, { ressource: "programme" });
    return (data ?? []).map((r) => r.slug);
  }

  // ═══════════════════════════════════════════════════════════════ Écriture ══

  async create(input: CreateProgramme): Promise<Programme> {
    const { data, error } = await this.supabase
      .from("programmes")
      .insert(toProgrammeInsert({ ...input, slug: input.slug ?? "" }))
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "programme" });

    // Voir le commentaire « écriture silencieusement refusée » dans errors.ts.
    const refus = requireOneRow(data, { ressource: "programme", action: "créer" });
    if (refus) throw refus;

    return toProgramme(data![0]);
  }

  async update(id: string, input: UpdateProgramme): Promise<Programme> {
    const champs = toProgrammeUpdate(input);

    // Une mise à jour vide renverrait 0 ligne et serait prise pour un refus.
    if (Object.keys(champs).length === 0) {
      const actuel = await this.findById(id);
      if (!actuel) {
        const refus = requireOneRow(null, {
          ressource: "programme",
          action: "modifier",
        });
        throw refus;
      }
      return actuel;
    }

    const { data, error } = await this.supabase
      .from("programmes")
      .update(champs)
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "programme" });

    const refus = requireOneRow(data, { ressource: "programme", action: "modifier" });
    if (refus) throw refus;

    return toProgramme(data![0]);
  }

  async delete(id: string): Promise<void> {
    const { data, error } = await this.supabase
      .from("programmes")
      .delete()
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "programme" });

    // ⚠️  Sans ce contrôle, une suppression refusée par la RLS renvoie
    // HTTP 204 et passerait pour un succès. Mesuré au Lot 1.
    const refus = requireDeleted(data, "programme");
    if (refus) throw refus;
  }

  async reorder(orderedIds: string[]): Promise<void> {
    // Une transaction unique, côté base : N requêtes successives laisseraient
    // des positions incohérentes si l'une échouait (§3.4 du Rapport 2).
    const { error } = await this.supabase.rpc("reorder_rows", {
      p_table: "programmes",
      p_ids: orderedIds,
    });

    if (error) throw mapPostgrestError(error, { ressource: "programme" });
  }

  async setStatus(id: string, status: ContentStatus): Promise<Programme> {
    const { data, error } = await this.supabase
      .from("programmes")
      .update({ status })
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "programme" });

    const refus = requireOneRow(data, { ressource: "programme", action: "modifier" });
    if (refus) throw refus;

    return toProgramme(data![0]);
  }
}

/**
 * Neutralise les caractères qui ont un sens dans la syntaxe de filtre
 * PostgREST.
 *
 * `or()` reçoit une CHAÎNE que PostgREST analyse : une virgule y sépare deux
 * conditions, les parenthèses groupent. Une recherche contenant « santé,
 * éducation » produirait un filtre malformé — et une chaîne bien choisie
 * pourrait altérer la condition. Le pourcentage et le tiret bas sont les
 * jokers de `ilike` : les laisser passer transformerait toute recherche
 * contenant « % » en « tout afficher ».
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
