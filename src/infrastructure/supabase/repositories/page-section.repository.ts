import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  CreatePageSection,
  PageSection,
  UpdatePageSection,
} from "@/core/cms/entities/page";
import type {
  SectionReadPort,
  SectionWritePort,
} from "@/core/cms/ports/page.port";

import type { Database, Json } from "../database.types";
import { mapPostgrestError, requireDeleted, requireOneRow } from "../errors";
import {
  toPageSection,
  toPageSectionInsert,
  toPageSectionUpdate,
} from "../mappers/page.mapper";

/**
 * Implémentation Supabase des ports de la section.
 *
 * Un dépôt distinct de celui des pages, comme les ports le sont. Ce n'est pas
 * du zèle : les deux tables n'ont pas les mêmes politiques d'écriture
 * (`page_sections_staff_update` accepte un éditeur, `pages_admin_insert` non),
 * et les mêler aurait rendu impossible d'injecter l'un sans l'autre.
 *
 * ⚠️  Aucune méthode de recherche, aucune pagination : les sections se lisent
 * TOUJOURS par leur page, et une page en compte trente au maximum. Ajouter un
 * `findAll` paginé aurait été du code sans appelant.
 */
export class SupabasePageSectionRepository
  implements SectionReadPort, SectionWritePort
{
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  // ═══════════════════════════════════════════════════════════════ Lecture ══

  /**
   * Les sections d'une page, dans l'ordre — masquées comprises.
   *
   * ⚠️  Aucun filtre sur `is_visible` : c'est la lecture du DASHBOARD, et la
   * recette du lot exige qu'« une section masquée disparaisse du site mais
   * reste dans le dashboard ». Le rendu public passe, lui, par
   * `findPublishedByRoute()` du dépôt de pages, qui filtre.
   */
  async findByPage(pageId: string): Promise<PageSection[]> {
    const { data, error } = await this.supabase
      .from("page_sections")
      .select("*")
      .eq("page_id", pageId)
      .order("position", { ascending: true });

    if (error) throw mapPostgrestError(error, { ressource: "section" });
    return (data ?? []).map(toPageSection);
  }

  async findById(id: string): Promise<PageSection | null> {
    const { data, error } = await this.supabase
      .from("page_sections")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw mapPostgrestError(error, { ressource: "section" });
    return data ? toPageSection(data) : null;
  }

  // ══════════════════════════════════════════════════════════════ Écriture ══

  async create(input: CreatePageSection): Promise<PageSection> {
    const { data, error } = await this.supabase
      .from("page_sections")
      .insert(toPageSectionInsert(input))
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "section" });

    // `page_sections_admin_insert` exige `app_can_publish()` : un éditeur voit
    // son insertion FILTRÉE — HTTP 201 et zéro ligne, soit un succès apparent.
    const refus = requireOneRow(data, { ressource: "section", action: "créer" });
    if (refus) throw refus;

    return toPageSection(data![0]);
  }

  async update(id: string, input: UpdatePageSection): Promise<PageSection> {
    const champs = toPageSectionUpdate(input);

    if (Object.keys(champs).length === 0) {
      const actuelle = await this.findById(id);
      if (!actuelle) {
        throw requireOneRow(null, { ressource: "section", action: "modifier" });
      }
      return actuelle;
    }

    const { data, error } = await this.supabase
      .from("page_sections")
      .update(champs)
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "section" });

    const refus = requireOneRow(data, { ressource: "section", action: "modifier" });
    if (refus) throw refus;

    return toPageSection(data![0]);
  }

  async delete(id: string): Promise<void> {
    const { data, error } = await this.supabase
      .from("page_sections")
      .delete()
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "section" });

    const refus = requireDeleted(data, "section");
    if (refus) throw refus;
  }

  async reorder(orderedIds: string[]): Promise<void> {
    /*
      Une transaction unique, côté base (§3.4). N requêtes successives
      laisseraient des positions incohérentes si l'une échouait — et pire
      ici qu'ailleurs : la contrainte d'unicité `(page_id, position)` est
      `deferrable initially deferred` PRÉCISÉMENT pour que l'état
      intermédiaire d'un échange de positions soit toléré à l'intérieur d'une
      transaction. Hors transaction, deux sections qui échangent leurs
      positions violent la contrainte à mi-chemin et la seconde requête échoue.
    */
    const { error } = await this.supabase.rpc("reorder_rows", {
      p_table: "page_sections",
      p_ids: orderedIds,
    });

    if (error) throw mapPostgrestError(error, { ressource: "section" });
  }

  /**
   * Insère une section à une position donnée, en décalant les suivantes.
   *
   * Passe par `insert_section_at()` (migration 0014) pour la même raison que
   * `reorder()` : décaler puis insérer sont deux écritures, et PostgREST ne les
   * réunit dans aucune transaction. Voir l'en-tête de la migration.
   */
  async insertAt(
    input: CreatePageSection,
    position: number,
  ): Promise<PageSection> {
    const { data, error } = await this.supabase.rpc("insert_section_at", {
      p_page_id: input.pageId,
      p_block_type: input.blockType,
      p_content: (input.content ?? {}) as Json,
      p_is_visible: input.isVisible ?? true,
      p_position: position,
    });

    if (error) throw mapPostgrestError(error, { ressource: "section" });

    // La fonction rend la ligne insérée. Zéro ligne signifierait que la
    // fonction a rendu `null` sans lever — un cas qu'elle n'a pas, mais qu'on
    // ne suppose pas : c'est la leçon de l'écriture silencieusement refusée.
    const refus = requireOneRow(data ? [data] : null, {
      ressource: "section",
      action: "créer",
    });
    if (refus) throw refus;

    return toPageSection(data!);
  }
}
