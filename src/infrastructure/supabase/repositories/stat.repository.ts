import type { SupabaseClient } from "@supabase/supabase-js";

import type { CreateStatRow, Stat, UpdateStat } from "@/core/cms/entities/stat";
import type { StatReadPort, StatWritePort } from "@/core/cms/ports/stat.port";
import {
  normalizeFilter,
  toRange,
  type ListFilter,
} from "@/core/shared/pagination";

import type { Database } from "../database.types";
import { mapPostgrestError, requireDeleted, requireOneRow } from "../errors";
import { toStat, toStatInsert, toStatUpdate } from "../mappers/stat.mapper";

/**
 * Colonnes autorisées au tri — jamais la valeur brute reçue du client.
 *
 * ⚠️  `status` n'y est pas, et ne peut pas y être : la table n'en a pas.
 * `is_visible` et `to_confirm` y sont — ce sont les deux tris utiles de cet
 * écran : « qu'est-ce que le site montre » et « qu'est-ce qui reste à
 * revalider ».
 *
 * ⚠️  `value` Y EST AUSSI, et le tri a un comportement à connaître : PostgreSQL
 * range les `NULL` en DERNIER en ordre croissant, en PREMIER en décroissant.
 * Trier par chiffre décroissant remonte donc les chiffres non fournis en tête.
 * Ce n'est pas un défaut — c'est même utile, « qu'est-ce qui manque » — mais
 * cela se constate, et la recette le mesure plutôt que de le supposer.
 */
const COLONNES_TRI = new Set([
  "position",
  "label",
  "value",
  "is_visible",
  "to_confirm",
  "created_at",
  "updated_at",
]);

/** Traduction camelCase → colonne SQL pour le tri. */
const TRI_ALIAS: Record<string, string> = {
  createdAt: "created_at",
  updatedAt: "updated_at",
  isVisible: "is_visible",
  toConfirm: "to_confirm",
};

/**
 * Implémentation Supabase des ports du chiffre clé.
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
 * ⚠️  CE DÉPÔT IGNORE `filter.status`, DÉLIBÉRÉMENT (écart nº 109)
 * ---------------------------------------------------------------------------
 * Le transmettre à PostgREST produirait « column stats.status does not exist » —
 * une panne technique pour un filtre qui n'a simplement pas de sens ici. Il est
 * donc ignoré, et la liste ENTIÈRE est renvoyée : renvoyer zéro ligne aurait été
 * bien pire, car un écran vide ne se distingue pas d'une collection vide.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LA RECHERCHE NE PORTE PAS SUR LE CHIFFRE
 * ---------------------------------------------------------------------------
 * `ilike` s'applique à `label` et `note`, deux colonnes texte. Chercher « 30 »
 * ne trouve donc PAS le chiffre 30 — sauf s'il apparaît dans une précision.
 * Casser `value` en texte (`value::text ilike …`) était possible et a été
 * écarté : cela empêcherait l'usage de l'index et ferait trouver 130 et 300 en
 * cherchant 30. Le dépôt en mémoire a la même limite, volontairement.
 *
 * ---------------------------------------------------------------------------
 * `reorder_rows('stats')` EST LÉGITIME
 * ---------------------------------------------------------------------------
 * La table porte bien une colonne `position` (migration 0005) et figure dans la
 * liste blanche de la migration 0012 — vérifié dans le fichier, pas supposé.
 */
export class SupabaseStatRepository implements StatReadPort, StatWritePort {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  // ═══════════════════════════════════════════════════════════════ Lecture ══

  async findAll(filter: ListFilter = {}): Promise<Stat[]> {
    const normalise = normalizeFilter(filter);
    let requete = this.supabase.from("stats").select("*");

    if (normalise.search) {
      const q = echapperRecherche(normalise.search);
      requete = requete.or(`label.ilike.%${q}%,note.ilike.%${q}%`);
    }

    const colonne = colonneDeTri(normalise.sortBy);
    requete = requete.order(colonne, {
      ascending: normalise.sortDirection !== "desc",
    });

    const { from, to } = toRange(normalise);
    requete = requete.range(from, to);

    const { data, error } = await requete;
    if (error) throw mapPostgrestError(error, { ressource: "chiffre" });

    return (data ?? []).map(toStat);
  }

  async findById(id: string): Promise<Stat | null> {
    const { data, error } = await this.supabase
      .from("stats")
      .select("*")
      .eq("id", id)
      // `maybeSingle` et non `single` : l'absence est un cas normal.
      // `single` lèverait PGRST116.
      .maybeSingle();

    if (error) throw mapPostgrestError(error, { ressource: "chiffre" });
    return data ? toStat(data) : null;
  }

  /**
   * Résolution par clé technique — contrôle d'unicité à la création.
   *
   * ⚠️  Appelée par un compte du STAFF uniquement. Un anonyme ne verrait que
   * les lignes visibles (`stats_public_read`), et conclurait qu'une clé
   * appartenant à un chiffre masqué est libre. Ce n'est pas un défaut à
   * corriger ici : `createStat` n'est atteignable qu'avec `stat:create`, donc
   * en session administrateur, pour qui `stats_staff_read` rend TOUTES les
   * lignes. La contrainte `unique` de la base reste le dernier mot.
   */
  async findByKey(key: string): Promise<Stat | null> {
    const { data, error } = await this.supabase
      .from("stats")
      .select("*")
      .eq("key", key)
      .maybeSingle();

    if (error) throw mapPostgrestError(error, { ressource: "chiffre" });
    return data ? toStat(data) : null;
  }

  /**
   * Les chiffres affichés, dans l'ordre.
   *
   * `eq("is_visible", true)` alors que la RLS publique impose déjà
   * `using (is_visible)` : les deux barrières sont indépendantes, et cette
   * méthode doit rester correcte appelée avec un client authentifié — pour qui
   * `stats_staff_read` rend TOUTES les lignes.
   *
   * ⚠️  Aucune condition sur `value` : un chiffre non fourni est AFFICHÉ, avec
   * « — ». C'est l'invariant nº 1, et c'est le comportement actuel du site.
   */
  async findVisible(limit = 50): Promise<Stat[]> {
    const { data, error } = await this.supabase
      .from("stats")
      .select("*")
      .eq("is_visible", true)
      .order("position", { ascending: true })
      .limit(limit);

    if (error) throw mapPostgrestError(error, { ressource: "chiffre" });
    return (data ?? []).map(toStat);
  }

  async count(filter: ListFilter = {}): Promise<number> {
    // `head: true` : on ne rapatrie aucune ligne, seulement l'en-tête de
    // comptage.
    let requete = this.supabase
      .from("stats")
      .select("*", { count: "exact", head: true });

    if (filter.search?.trim()) {
      const q = echapperRecherche(filter.search.trim());
      requete = requete.or(`label.ilike.%${q}%,note.ilike.%${q}%`);
    }

    const { count, error } = await requete;
    if (error) throw mapPostgrestError(error, { ressource: "chiffre" });
    return count ?? 0;
  }

  // ═══════════════════════════════════════════════════════════════ Écriture ══

  async create(input: CreateStatRow): Promise<Stat> {
    const { data, error } = await this.supabase
      .from("stats")
      .insert(toStatInsert(input))
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "chiffre" });

    /*
      Voir le commentaire « écriture silencieusement refusée » dans errors.ts.

      ⚠️  Comme au Lot 8E : `stats_admin_insert` exige `app_can_publish()`. Un
      ÉDITEUR qui atteindrait cette méthode verrait son insertion REJETÉE
      (42501) et non filtrée — sa politique n'a qu'un `WITH CHECK`, il n'y a
      aucune ligne à filtrer (écart nº 105). Les deux protections sont donc non
      redondantes : le code d'erreur couvre l'insertion, le comptage de lignes
      couvre la mise à jour et la suppression.
    */
    const refus = requireOneRow(data, { ressource: "chiffre", action: "créer" });
    if (refus) throw refus;

    return toStat(data![0]);
  }

  async update(id: string, input: UpdateStat): Promise<Stat> {
    const champs = toStatUpdate(input);

    // Une mise à jour vide renverrait 0 ligne et serait prise pour un refus.
    if (Object.keys(champs).length === 0) {
      const actuel = await this.findById(id);
      if (!actuel) {
        throw requireOneRow(null, { ressource: "chiffre", action: "modifier" });
      }
      return actuel;
    }

    const { data, error } = await this.supabase
      .from("stats")
      .update(champs)
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "chiffre" });

    const refus = requireOneRow(data, {
      ressource: "chiffre",
      action: "modifier",
    });
    if (refus) throw refus;

    return toStat(data![0]);
  }

  async delete(id: string): Promise<void> {
    const { data, error } = await this.supabase
      .from("stats")
      .delete()
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "chiffre" });

    // ⚠️  Sans ce contrôle, une suppression refusée par la RLS renvoie
    // HTTP 204 et passerait pour un succès. Mesuré au Lot 1.
    const refus = requireDeleted(data, "chiffre");
    if (refus) throw refus;
  }

  async reorder(orderedIds: string[]): Promise<void> {
    // Une transaction unique, côté base : N requêtes successives laisseraient
    // des positions incohérentes si l'une échouait (§3.4 du Rapport 2).
    const { error } = await this.supabase.rpc("reorder_rows", {
      p_table: "stats",
      p_ids: orderedIds,
    });

    if (error) throw mapPostgrestError(error, { ressource: "chiffre" });
  }

  async setVisibility(id: string, isVisible: boolean): Promise<Stat> {
    const { data, error } = await this.supabase
      .from("stats")
      .update({ is_visible: isVisible })
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "chiffre" });

    const refus = requireOneRow(data, {
      ressource: "chiffre",
      action: "modifier",
    });
    if (refus) throw refus;

    return toStat(data![0]);
  }
}

/**
 * Neutralise les caractères qui ont un sens dans la syntaxe de filtre
 * PostgREST.
 *
 * `or()` reçoit une CHAÎNE que PostgREST analyse : une virgule y sépare deux
 * conditions, les parenthèses groupent. Le pourcentage et le tiret bas sont les
 * jokers de `ilike`. L'apostrophe est retirée comme dans les six autres dépôts.
 *
 * ⚠️  Le pourcentage est un caractère PLAUSIBLE dans cette collection — un
 * suffixe « % », une précision « 80 % des dons ». Il est donc neutralisé comme
 * ailleurs, ce qui signifie qu'une recherche sur « 80 % » cherche « 80 ». La
 * limite est acceptée : l'alternative, l'échappement `\%` de PostgREST, s'est
 * révélée dépendante de la version au Lot 3 et n'a pas été retenue.
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
