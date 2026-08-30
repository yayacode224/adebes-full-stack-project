import type { SupabaseClient } from "@supabase/supabase-js";

import type { ContentStatus } from "@/core/cms/entities/content-status";
import type {
  CreateTeamMember,
  TeamMember,
  UpdateTeamMember,
} from "@/core/cms/entities/team-member";
import type {
  TeamMemberReadPort,
  TeamMemberWritePort,
} from "@/core/cms/ports/team-member.port";
import { normalizeFilter, toRange, type ListFilter } from "@/core/shared/pagination";

import type { Database } from "../database.types";
import { mapPostgrestError, requireDeleted, requireOneRow } from "../errors";
import {
  toTeamMember,
  toTeamMemberInsert,
  toTeamMemberUpdate,
} from "../mappers/team-member.mapper";

/** Colonnes autorisées au tri — jamais la valeur brute reçue du client. */
const COLONNES_TRI = new Set([
  "position",
  "name",
  "role",
  "status",
  "created_at",
  "updated_at",
]);

/** Traduction camelCase → colonne SQL pour le tri. */
const TRI_ALIAS: Record<string, string> = {
  createdAt: "created_at",
  updatedAt: "updated_at",
};

/**
 * Implémentation Supabase des ports du membre de l'équipe.
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
 * `reorder_rows('team_members')` est légitime : la table porte bien une
 * colonne `position` (migration 0005) et figure dans la liste blanche de la
 * migration 0012 — contrairement à l'entrée `'articles'`, défaut latent
 * signalé au Lot 8B.
 */
export class SupabaseTeamMemberRepository
  implements TeamMemberReadPort, TeamMemberWritePort
{
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  // ═══════════════════════════════════════════════════════════════ Lecture ══

  async findAll(filter: ListFilter = {}): Promise<TeamMember[]> {
    const normalise = normalizeFilter(filter);
    let requete = this.supabase.from("team_members").select("*");

    if (normalise.status) {
      requete = requete.eq("status", normalise.status as ContentStatus);
    }

    if (normalise.search) {
      const q = echapperRecherche(normalise.search);
      requete = requete.or(`name.ilike.%${q}%,role.ilike.%${q}%,bio.ilike.%${q}%`);
    }

    const colonne = colonneDeTri(normalise.sortBy);
    requete = requete.order(colonne, {
      ascending: normalise.sortDirection !== "desc",
    });

    const { from, to } = toRange(normalise);
    requete = requete.range(from, to);

    const { data, error } = await requete;
    if (error) throw mapPostgrestError(error, { ressource: "membre de l'équipe" });

    return (data ?? []).map(toTeamMember);
  }

  async findById(id: string): Promise<TeamMember | null> {
    const { data, error } = await this.supabase
      .from("team_members")
      .select("*")
      .eq("id", id)
      // `maybeSingle` et non `single` : l'absence est un cas normal.
      // `single` lèverait PGRST116.
      .maybeSingle();

    if (error) throw mapPostgrestError(error, { ressource: "membre de l'équipe" });
    return data ? toTeamMember(data) : null;
  }

  /**
   * Les membres publiés, dans l'ordre d'affichage.
   *
   * La règle publique tient en une méthode plutôt qu'en trois conditions
   * recopiées par chaque appelant. C'est la plus simple des quatre
   * collections : aucune date à échoir, aucun accord à vérifier — un membre
   * publié est visible.
   */
  async findPublished(limit = 100): Promise<TeamMember[]> {
    const { data, error } = await this.supabase
      .from("team_members")
      .select("*")
      .eq("status", "published")
      .order("position", { ascending: true })
      .limit(limit);

    if (error) throw mapPostgrestError(error, { ressource: "membre de l'équipe" });
    return (data ?? []).map(toTeamMember);
  }

  async count(filter: ListFilter = {}): Promise<number> {
    // `head: true` : on ne rapatrie aucune ligne, seulement l'en-tête de
    // comptage.
    let requete = this.supabase
      .from("team_members")
      .select("*", { count: "exact", head: true });

    if (filter.status) {
      requete = requete.eq("status", filter.status as ContentStatus);
    }
    if (filter.search?.trim()) {
      const q = echapperRecherche(filter.search.trim());
      requete = requete.or(`name.ilike.%${q}%,role.ilike.%${q}%,bio.ilike.%${q}%`);
    }

    const { count, error } = await requete;
    if (error) throw mapPostgrestError(error, { ressource: "membre de l'équipe" });
    return count ?? 0;
  }

  // ═══════════════════════════════════════════════════════════════ Écriture ══

  async create(input: CreateTeamMember): Promise<TeamMember> {
    const { data, error } = await this.supabase
      .from("team_members")
      .insert(toTeamMemberInsert(input))
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "membre de l'équipe" });

    // Voir le commentaire « écriture silencieusement refusée » dans errors.ts.
    const refus = requireOneRow(data, {
      ressource: "membre de l'équipe",
      action: "créer",
    });
    if (refus) throw refus;

    return toTeamMember(data![0]);
  }

  async update(id: string, input: UpdateTeamMember): Promise<TeamMember> {
    const champs = toTeamMemberUpdate(input);

    // Une mise à jour vide renverrait 0 ligne et serait prise pour un refus.
    if (Object.keys(champs).length === 0) {
      const actuel = await this.findById(id);
      if (!actuel) {
        throw requireOneRow(null, {
          ressource: "membre de l'équipe",
          action: "modifier",
        });
      }
      return actuel;
    }

    const { data, error } = await this.supabase
      .from("team_members")
      .update(champs)
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "membre de l'équipe" });

    const refus = requireOneRow(data, {
      ressource: "membre de l'équipe",
      action: "modifier",
    });
    if (refus) throw refus;

    return toTeamMember(data![0]);
  }

  async delete(id: string): Promise<void> {
    const { data, error } = await this.supabase
      .from("team_members")
      .delete()
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "membre de l'équipe" });

    // ⚠️  Sans ce contrôle, une suppression refusée par la RLS renvoie
    // HTTP 204 et passerait pour un succès. Mesuré au Lot 1.
    const refus = requireDeleted(data, "membre de l'équipe");
    if (refus) throw refus;
  }

  async reorder(orderedIds: string[]): Promise<void> {
    // Une transaction unique, côté base : N requêtes successives laisseraient
    // des positions incohérentes si l'une échouait (§3.4 du Rapport 2).
    const { error } = await this.supabase.rpc("reorder_rows", {
      p_table: "team_members",
      p_ids: orderedIds,
    });

    if (error) throw mapPostgrestError(error, { ressource: "membre de l'équipe" });
  }

  async setStatus(id: string, status: ContentStatus): Promise<TeamMember> {
    const { data, error } = await this.supabase
      .from("team_members")
      .update({ status })
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "membre de l'équipe" });

    const refus = requireOneRow(data, {
      ressource: "membre de l'équipe",
      action: "modifier",
    });
    if (refus) throw refus;

    return toTeamMember(data![0]);
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
 * ⚠️  Les CROCHETS comptent ici plus qu'ailleurs : le nom des trois lignes du
 * seed est littéralement « [À COMPLÉTER] ». Ils ne sont pas retirés — ils
 * n'ont aucun sens spécial pour PostgREST ni pour `ilike` — et rechercher
 * « [À COMPLÉTER] » dans le dashboard fonctionne donc. C'est voulu : c'est la
 * façon la plus directe de retrouver les fiches qui restent à renseigner.
 *
 * L'apostrophe, elle, est retirée comme dans les trois autres dépôts.
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
