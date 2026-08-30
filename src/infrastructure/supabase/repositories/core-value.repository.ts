import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  CoreValue,
  CreateCoreValue,
  UpdateCoreValue,
} from "@/core/cms/entities/core-value";
import type {
  CoreValueReadPort,
  CoreValueWritePort,
} from "@/core/cms/ports/core-value.port";
import { normalizeFilter, toRange, type ListFilter } from "@/core/shared/pagination";

import type { Database } from "../database.types";
import { mapPostgrestError, requireDeleted, requireOneRow } from "../errors";
import {
  toCoreValue,
  toCoreValueInsert,
  toCoreValueUpdate,
} from "../mappers/core-value.mapper";

/**
 * Colonnes autorisées au tri — jamais la valeur brute reçue du client.
 *
 * ⚠️  `status` n'y est pas, et ne peut pas y être : la table n'en a pas.
 * `is_visible` y est, en revanche — c'est le tri le plus utile de cet écran,
 * « qu'est-ce qui est en ligne ».
 */
const COLONNES_TRI = new Set([
  "position",
  "title",
  "is_visible",
  "created_at",
  "updated_at",
]);

/** Traduction camelCase → colonne SQL pour le tri. */
const TRI_ALIAS: Record<string, string> = {
  createdAt: "created_at",
  updatedAt: "updated_at",
  isVisible: "is_visible",
};

/**
 * Implémentation Supabase des ports de la valeur.
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
 * ---------------------------------------------------------------------------
 * ⚠️  CE DÉPÔT IGNORE `filter.status`, DÉLIBÉRÉMENT
 * ---------------------------------------------------------------------------
 * `ListFilter` porte un champ `status` parce que quatre collections sur cinq en
 * ont un. `core_values` n'en a pas. Le transmettre à PostgREST produirait
 * « column core_values.status does not exist » — une panne technique pour un
 * filtre qui n'a simplement pas de sens ici.
 *
 * Il est donc ignoré, et la liste ENTIÈRE est renvoyée. Le choix est écrit
 * plutôt que subi : renvoyer zéro ligne aurait été bien pire, car un écran vide
 * ne se distingue pas d'une collection vide.
 *
 * ---------------------------------------------------------------------------
 * `reorder_rows('core_values')` EST LÉGITIME
 * ---------------------------------------------------------------------------
 * La table porte bien une colonne `position` (migration 0005) et figure dans la
 * liste blanche de la migration 0012 — vérifié dans le fichier, pas supposé.
 */
export class SupabaseCoreValueRepository
  implements CoreValueReadPort, CoreValueWritePort
{
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  // ═══════════════════════════════════════════════════════════════ Lecture ══

  async findAll(filter: ListFilter = {}): Promise<CoreValue[]> {
    const normalise = normalizeFilter(filter);
    let requete = this.supabase.from("core_values").select("*");

    if (normalise.search) {
      const q = echapperRecherche(normalise.search);
      requete = requete.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
    }

    const colonne = colonneDeTri(normalise.sortBy);
    requete = requete.order(colonne, {
      ascending: normalise.sortDirection !== "desc",
    });

    const { from, to } = toRange(normalise);
    requete = requete.range(from, to);

    const { data, error } = await requete;
    if (error) throw mapPostgrestError(error, { ressource: "valeur" });

    return (data ?? []).map(toCoreValue);
  }

  async findById(id: string): Promise<CoreValue | null> {
    const { data, error } = await this.supabase
      .from("core_values")
      .select("*")
      .eq("id", id)
      // `maybeSingle` et non `single` : l'absence est un cas normal.
      // `single` lèverait PGRST116.
      .maybeSingle();

    if (error) throw mapPostgrestError(error, { ressource: "valeur" });
    return data ? toCoreValue(data) : null;
  }

  /**
   * Les valeurs affichées, dans l'ordre.
   *
   * `eq("is_visible", true)` alors que la RLS publique impose déjà
   * `using (is_visible)` : les deux barrières sont indépendantes, et cette
   * méthode doit rester correcte appelée avec un client authentifié — pour qui
   * `core_values_staff_read` rend TOUTES les lignes.
   */
  async findVisible(limit = 50): Promise<CoreValue[]> {
    const { data, error } = await this.supabase
      .from("core_values")
      .select("*")
      .eq("is_visible", true)
      .order("position", { ascending: true })
      .limit(limit);

    if (error) throw mapPostgrestError(error, { ressource: "valeur" });
    return (data ?? []).map(toCoreValue);
  }

  async count(filter: ListFilter = {}): Promise<number> {
    // `head: true` : on ne rapatrie aucune ligne, seulement l'en-tête de
    // comptage.
    let requete = this.supabase
      .from("core_values")
      .select("*", { count: "exact", head: true });

    if (filter.search?.trim()) {
      const q = echapperRecherche(filter.search.trim());
      requete = requete.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
    }

    const { count, error } = await requete;
    if (error) throw mapPostgrestError(error, { ressource: "valeur" });
    return count ?? 0;
  }

  // ═══════════════════════════════════════════════════════════════ Écriture ══

  async create(input: CreateCoreValue): Promise<CoreValue> {
    const { data, error } = await this.supabase
      .from("core_values")
      .insert(toCoreValueInsert(input))
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "valeur" });

    /*
      Voir le commentaire « écriture silencieusement refusée » dans errors.ts.

      ⚠️  Ce contrôle compte plus ici qu'ailleurs : `core_values_admin_insert`
      exige `app_can_publish()`. Un ÉDITEUR qui atteindrait cette méthode verrait
      son insertion filtrée par la RLS — HTTP 201 et zéro ligne, soit un succès
      apparent. C'est la première collection où ce cas concerne la CRÉATION et
      pas seulement la publication.
    */
    const refus = requireOneRow(data, { ressource: "valeur", action: "créer" });
    if (refus) throw refus;

    return toCoreValue(data![0]);
  }

  async update(id: string, input: UpdateCoreValue): Promise<CoreValue> {
    const champs = toCoreValueUpdate(input);

    // Une mise à jour vide renverrait 0 ligne et serait prise pour un refus.
    if (Object.keys(champs).length === 0) {
      const actuelle = await this.findById(id);
      if (!actuelle) {
        throw requireOneRow(null, { ressource: "valeur", action: "modifier" });
      }
      return actuelle;
    }

    const { data, error } = await this.supabase
      .from("core_values")
      .update(champs)
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "valeur" });

    const refus = requireOneRow(data, { ressource: "valeur", action: "modifier" });
    if (refus) throw refus;

    return toCoreValue(data![0]);
  }

  async delete(id: string): Promise<void> {
    const { data, error } = await this.supabase
      .from("core_values")
      .delete()
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "valeur" });

    // ⚠️  Sans ce contrôle, une suppression refusée par la RLS renvoie
    // HTTP 204 et passerait pour un succès. Mesuré au Lot 1.
    const refus = requireDeleted(data, "valeur");
    if (refus) throw refus;
  }

  async reorder(orderedIds: string[]): Promise<void> {
    // Une transaction unique, côté base : N requêtes successives laisseraient
    // des positions incohérentes si l'une échouait (§3.4 du Rapport 2).
    const { error } = await this.supabase.rpc("reorder_rows", {
      p_table: "core_values",
      p_ids: orderedIds,
    });

    if (error) throw mapPostgrestError(error, { ressource: "valeur" });
  }

  async setVisibility(id: string, isVisible: boolean): Promise<CoreValue> {
    const { data, error } = await this.supabase
      .from("core_values")
      .update({ is_visible: isVisible })
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "valeur" });

    const refus = requireOneRow(data, { ressource: "valeur", action: "modifier" });
    if (refus) throw refus;

    return toCoreValue(data![0]);
  }
}

/**
 * Neutralise les caractères qui ont un sens dans la syntaxe de filtre
 * PostgREST.
 *
 * `or()` reçoit une CHAÎNE que PostgREST analyse : une virgule y sépare deux
 * conditions, les parenthèses groupent. Le pourcentage et le tiret bas sont les
 * jokers de `ilike`. L'apostrophe est retirée comme dans les quatre autres
 * dépôts — et elle est fréquente ici : « L'union fait la force ».
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
