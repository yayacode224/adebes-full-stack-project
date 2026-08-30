import type { SupabaseClient } from "@supabase/supabase-js";

import type { ContentStatus } from "@/core/cms/entities/content-status";
import type {
  CreateFaqItem,
  FaqItem,
  FaqTopic,
  UpdateFaqItem,
} from "@/core/cms/entities/faq-item";
import type {
  FaqItemReadPort,
  FaqItemWritePort,
} from "@/core/cms/ports/faq-item.port";
import { normalizeFilter, toRange, type ListFilter } from "@/core/shared/pagination";

import type { Database } from "../database.types";
import { mapPostgrestError, requireDeleted, requireOneRow } from "../errors";
import {
  toFaqItem,
  toFaqItemInsert,
  toFaqItemUpdate,
} from "../mappers/faq-item.mapper";

/** Colonnes autorisées au tri — jamais la valeur brute reçue du client. */
const COLONNES_TRI = new Set([
  "position",
  "question",
  "topic",
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
 * Implémentation Supabase des ports de la question fréquente.
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
 * `reorder_rows('faq_items')` est légitime : la table porte bien une colonne
 * `position` (migration 0005) et figure dans la liste blanche de la migration
 * 0012 — contrairement à l'entrée `'articles'`, défaut latent signalé au
 * Lot 8B.
 *
 * ---------------------------------------------------------------------------
 * LA RECHERCHE PORTE SUR LA QUESTION ET LA RÉPONSE, PAS SUR LES PUCES
 * ---------------------------------------------------------------------------
 * `bullets` est un `text[]`, et `ilike` ne s'applique pas à un tableau : le
 * transmettre à `or()` produirait « operator does not exist: text[] ~~* text ».
 * PostgREST offre bien des opérateurs de tableau (`cs`, `ov`), mais ils
 * comparent des ÉLÉMENTS ENTIERS — chercher « Mobile » ne trouverait pas la
 * puce « Mobile Money (Orange Money, MTN Mobile Money) : … ».
 *
 * La limite est donc réelle et assumée : une recherche ne trouve pas un mot qui
 * n'existe que dans une puce. Le dépôt en mémoire se comporte à l'identique —
 * il doit ressembler au vrai jusque dans ce qu'il ne fait pas (écart nº 109).
 */
export class SupabaseFaqItemRepository implements FaqItemReadPort, FaqItemWritePort {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  // ═══════════════════════════════════════════════════════════════ Lecture ══

  async findAll(filter: ListFilter = {}): Promise<FaqItem[]> {
    const normalise = normalizeFilter(filter);
    let requete = this.supabase.from("faq_items").select("*");

    if (normalise.status) {
      requete = requete.eq("status", normalise.status as ContentStatus);
    }

    if (normalise.search) {
      const q = echapperRecherche(normalise.search);
      requete = requete.or(`question.ilike.%${q}%,answer.ilike.%${q}%`);
    }

    const colonne = colonneDeTri(normalise.sortBy);
    requete = requete.order(colonne, {
      ascending: normalise.sortDirection !== "desc",
    });

    const { from, to } = toRange(normalise);
    requete = requete.range(from, to);

    const { data, error } = await requete;
    if (error) throw mapPostgrestError(error, { ressource: "question fréquente" });

    return (data ?? []).map(toFaqItem);
  }

  async findById(id: string): Promise<FaqItem | null> {
    const { data, error } = await this.supabase
      .from("faq_items")
      .select("*")
      .eq("id", id)
      // `maybeSingle` et non `single` : l'absence est un cas normal.
      // `single` lèverait PGRST116.
      .maybeSingle();

    if (error) throw mapPostgrestError(error, { ressource: "question fréquente" });
    return data ? toFaqItem(data) : null;
  }

  /**
   * Les questions publiées, dans l'ordre d'affichage, éventuellement bornées à
   * un sujet.
   *
   * Le tri est `position`, et il est GLOBAL : les positions numérotent la table
   * entière, tous sujets confondus. Filtrer par sujet ne renumérote pas — les
   * questions de don peuvent porter les positions 1, 2 et 3 comme 4, 9 et 12.
   * Seul leur ordre RELATIF compte sur la page, et c'est bien ce qu'il donne.
   */
  async findPublished(
    options: { topic?: FaqTopic; limit?: number } = {},
  ): Promise<FaqItem[]> {
    const { topic, limit = 100 } = options;

    let requete = this.supabase
      .from("faq_items")
      .select("*")
      .eq("status", "published");

    if (topic) requete = requete.eq("topic", topic);

    const { data, error } = await requete
      .order("position", { ascending: true })
      .limit(limit);

    if (error) throw mapPostgrestError(error, { ressource: "question fréquente" });
    return (data ?? []).map(toFaqItem);
  }

  async count(filter: ListFilter = {}): Promise<number> {
    // `head: true` : on ne rapatrie aucune ligne, seulement l'en-tête de
    // comptage.
    let requete = this.supabase
      .from("faq_items")
      .select("*", { count: "exact", head: true });

    if (filter.status) {
      requete = requete.eq("status", filter.status as ContentStatus);
    }
    if (filter.search?.trim()) {
      const q = echapperRecherche(filter.search.trim());
      requete = requete.or(`question.ilike.%${q}%,answer.ilike.%${q}%`);
    }

    const { count, error } = await requete;
    if (error) throw mapPostgrestError(error, { ressource: "question fréquente" });
    return count ?? 0;
  }

  // ═══════════════════════════════════════════════════════════════ Écriture ══

  async create(input: CreateFaqItem): Promise<FaqItem> {
    const { data, error } = await this.supabase
      .from("faq_items")
      .insert(toFaqItemInsert(input))
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "question fréquente" });

    // Voir le commentaire « écriture silencieusement refusée » dans errors.ts.
    const refus = requireOneRow(data, {
      ressource: "question fréquente",
      action: "créer",
    });
    if (refus) throw refus;

    return toFaqItem(data![0]!);
  }

  async update(id: string, input: UpdateFaqItem): Promise<FaqItem> {
    const champs = toFaqItemUpdate(input);

    // Une mise à jour vide renverrait 0 ligne et serait prise pour un refus.
    if (Object.keys(champs).length === 0) {
      const actuelle = await this.findById(id);
      if (!actuelle) {
        throw requireOneRow(null, {
          ressource: "question fréquente",
          action: "modifier",
        });
      }
      return actuelle;
    }

    const { data, error } = await this.supabase
      .from("faq_items")
      .update(champs)
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "question fréquente" });

    const refus = requireOneRow(data, {
      ressource: "question fréquente",
      action: "modifier",
    });
    if (refus) throw refus;

    return toFaqItem(data![0]!);
  }

  async delete(id: string): Promise<void> {
    const { data, error } = await this.supabase
      .from("faq_items")
      .delete()
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "question fréquente" });

    // ⚠️  Sans ce contrôle, une suppression refusée par la RLS renvoie
    // HTTP 204 et passerait pour un succès. Mesuré au Lot 1.
    const refus = requireDeleted(data, "question fréquente");
    if (refus) throw refus;
  }

  async reorder(orderedIds: string[]): Promise<void> {
    // Une transaction unique, côté base : N requêtes successives laisseraient
    // des positions incohérentes si l'une échouait (§3.4 du Rapport 2).
    const { error } = await this.supabase.rpc("reorder_rows", {
      p_table: "faq_items",
      p_ids: orderedIds,
    });

    if (error) throw mapPostgrestError(error, { ressource: "question fréquente" });
  }

  async setStatus(id: string, status: ContentStatus): Promise<FaqItem> {
    const { data, error } = await this.supabase
      .from("faq_items")
      .update({ status })
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "question fréquente" });

    const refus = requireOneRow(data, {
      ressource: "question fréquente",
      action: "modifier",
    });
    if (refus) throw refus;

    return toFaqItem(data![0]!);
  }
}

/**
 * Neutralise les caractères qui ont un sens dans la syntaxe de filtre
 * PostgREST.
 *
 * `or()` reçoit une CHAÎNE que PostgREST analyse : une virgule y sépare deux
 * conditions, les parenthèses groupent. Le pourcentage et le tiret bas sont les
 * jokers de `ilike`.
 *
 * ⚠️  Le POINT D'INTERROGATION est conservé, et c'est particulier à cette
 * collection : toutes les questions en portent un, et c'est le caractère le
 * plus naturel à taper pour retrouver une question. Il n'a aucun sens spécial
 * pour PostgREST ni pour `ilike`.
 *
 * L'apostrophe, elle, est retirée comme dans les cinq autres dépôts.
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
