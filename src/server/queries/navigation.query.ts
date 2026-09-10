import "server-only";

import { cache } from "react";

import type { NavigationItem, NavigationMenu } from "@/core/cms/entities/navigation-item";
import { createPublicClient } from "@/infrastructure/supabase/clients/public";
import { SupabaseNavigationRepository } from "@/infrastructure/supabase/repositories/navigation.repository";
import { conversionNav, legalNav, mainNav, type NavItem } from "@/lib/navigation";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LECTURES PUBLIQUES DE LA NAVIGATION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §10.3 du Rapport 2. Même filet qu'aux réglages (`settings.query.ts`) et
 * pour la même raison : une panne ici touche l'en-tête et le pied de page de
 * CHAQUE page du site. Le repli reprend les trois tableaux statiques de
 * `src/lib/navigation.ts` — `footer` n'a pas d'équivalent statique (le menu
 * est un ajout du Lot 10, voir `navigation-item.ts`) et replie donc sur une
 * liste vide, jamais sur une exception qui ferait tomber le pied de page.
 */

function portPublic() {
  return new SupabaseNavigationRepository(createPublicClient());
}

let compteurRepli = 0;

/** Un `NavItem` statique n'a ni identifiant ni position : ce repli les invente. */
function depuisNavItemStatique(
  menu: NavigationMenu,
  items: readonly NavItem[],
): NavigationItem[] {
  return items.map((item, index) => ({
    id: `repli-${compteurRepli++}-${index}`,
    menu,
    label: item.label,
    href: item.href,
    description: item.description ?? null,
    parentId: null,
    position: index + 1,
    isExternal: /^https?:\/\//i.test(item.href),
    isVisible: true,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  }));
}

const REPLIS: Record<NavigationMenu, NavigationItem[]> = {
  main: depuisNavItemStatique("main", mainNav),
  conversion: depuisNavItemStatique("conversion", conversionNav),
  legal: depuisNavItemStatique("legal", legalNav),
  footer: [],
};

export const getVisibleNavigation = cache(
  async (menu: NavigationMenu): Promise<NavigationItem[]> => {
    try {
      return await portPublic().findVisibleByMenu(menu);
    } catch (erreur) {
      console.error(
        `[ADEBES] Lecture du menu « ${menu} » impossible, repli sur navigation.ts`,
        erreur,
      );
      return REPLIS[menu];
    }
  },
);
