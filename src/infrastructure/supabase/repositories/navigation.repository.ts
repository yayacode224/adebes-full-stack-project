import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  CreateNavigationItem,
  NavigationItem,
  NavigationMenu,
  UpdateNavigationItem,
} from "@/core/cms/entities/navigation-item";
import type {
  NavigationReadPort,
  NavigationWritePort,
} from "@/core/cms/ports/navigation.port";

import type { Database } from "../database.types";
import { mapPostgrestError, requireDeleted, requireOneRow } from "../errors";
import {
  toNavigationItem,
  toNavigationItemInsert,
  toNavigationItemUpdate,
} from "../mappers/navigation-item.mapper";

/**
 * Implémentation Supabase des ports de navigation.
 *
 * ⚠️  `reorder_rows('navigation_items', ids)` (§3.4) est appelé UN MENU À LA
 * FOIS — jamais avec un mélange de menus. C'est le cas d'usage
 * (`reorder-navigation-items.ts`) qui garantit cette frontière ; ce dépôt fait
 * confiance à la liste reçue, comme `SupabasePageSectionRepository` fait
 * confiance à `reorderSections` pour les sections d'une seule page.
 */
export class SupabaseNavigationRepository
  implements NavigationReadPort, NavigationWritePort
{
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  // ═══════════════════════════════════════════════════════════════ Lecture ══

  async findByMenu(menu: NavigationMenu): Promise<NavigationItem[]> {
    const { data, error } = await this.supabase
      .from("navigation_items")
      .select("*")
      .eq("menu", menu)
      .order("position", { ascending: true });

    if (error) throw mapPostgrestError(error, { ressource: "entrée de navigation" });
    return (data ?? []).map(toNavigationItem);
  }

  async findVisibleByMenu(menu: NavigationMenu): Promise<NavigationItem[]> {
    const { data, error } = await this.supabase
      .from("navigation_items")
      .select("*")
      .eq("menu", menu)
      .eq("is_visible", true)
      .order("position", { ascending: true });

    if (error) throw mapPostgrestError(error, { ressource: "entrée de navigation" });
    return (data ?? []).map(toNavigationItem);
  }

  async findById(id: string): Promise<NavigationItem | null> {
    const { data, error } = await this.supabase
      .from("navigation_items")
      .select("*")
      .eq("id", id)
      // `maybeSingle` : l'absence est un cas normal (fiche déjà supprimée).
      .maybeSingle();

    if (error) throw mapPostgrestError(error, { ressource: "entrée de navigation" });
    return data ? toNavigationItem(data) : null;
  }

  // ═══════════════════════════════════════════════════════════════ Écriture ══

  async create(input: CreateNavigationItem): Promise<NavigationItem> {
    const { data, error } = await this.supabase
      .from("navigation_items")
      .insert(toNavigationItemInsert(input))
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "entrée de navigation" });

    const refus = requireOneRow(data, {
      ressource: "entrée de navigation",
      action: "créer",
    });
    if (refus) throw refus;

    return toNavigationItem(data![0]);
  }

  async update(id: string, input: UpdateNavigationItem): Promise<NavigationItem> {
    const champs = toNavigationItemUpdate(input);

    if (Object.keys(champs).length === 0) {
      const actuelle = await this.findById(id);
      if (!actuelle) {
        throw requireOneRow(null, {
          ressource: "entrée de navigation",
          action: "modifier",
        });
      }
      return actuelle;
    }

    const { data, error } = await this.supabase
      .from("navigation_items")
      .update(champs)
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "entrée de navigation" });

    const refus = requireOneRow(data, {
      ressource: "entrée de navigation",
      action: "modifier",
    });
    if (refus) throw refus;

    return toNavigationItem(data![0]);
  }

  async delete(id: string): Promise<void> {
    const { data, error } = await this.supabase
      .from("navigation_items")
      .delete()
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "entrée de navigation" });

    const refus = requireDeleted(data, "entrée de navigation");
    if (refus) throw refus;
  }

  async reorder(orderedIds: string[]): Promise<void> {
    const { error } = await this.supabase.rpc("reorder_rows", {
      p_table: "navigation_items",
      p_ids: orderedIds,
    });

    if (error) throw mapPostgrestError(error, { ressource: "entrée de navigation" });
  }

  async setVisibility(id: string, isVisible: boolean): Promise<NavigationItem> {
    const { data, error } = await this.supabase
      .from("navigation_items")
      .update({ is_visible: isVisible })
      .eq("id", id)
      .select();

    if (error) throw mapPostgrestError(error, { ressource: "entrée de navigation" });

    const refus = requireOneRow(data, {
      ressource: "entrée de navigation",
      action: "modifier",
    });
    if (refus) throw refus;

    return toNavigationItem(data![0]);
  }
}
