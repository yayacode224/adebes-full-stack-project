"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { NavigationItem, NavigationMenu } from "@/core/cms/entities/navigation-item";

import { NavigationMenuList } from "./navigation-menu-list";

/**
 * Les quatre menus, en onglets — §10.1 du Rapport 2.
 *
 * ⚠️  Ce sont ici de VRAIS onglets Radix (`components/ui/tabs.tsx`), à la
 * différence de `<SettingsTabs>` : les quatre panneaux ne sont pas des
 * routes, mais un contenu qui remplace un autre sans navigation — exactement
 * ce que `role="tablist"` / `role="tabpanel"` décrivent, et exactement le cas
 * des trois onglets de l'éditeur de pages (Lot 9), dont ce composant reprend
 * le gabarit.
 *
 * `overflow-x-auto` sur le conteneur des déclencheurs, comme
 * `<SettingsTabs>` : « Mentions légales » et « Pied de page » ne tiennent pas
 * côte à côte avec les deux autres sous 390 px.
 */
const MENUS: { value: NavigationMenu; label: string }[] = [
  { value: "main", label: "Menu principal" },
  { value: "conversion", label: "Conversion" },
  { value: "legal", label: "Mentions légales" },
  { value: "footer", label: "Pied de page" },
];

export function NavigationClient({
  parMenu,
  peutCreer,
  peutModifier,
  peutSupprimer,
  peutReordonner,
}: {
  parMenu: Record<NavigationMenu, NavigationItem[]>;
  peutCreer: boolean;
  peutModifier: boolean;
  peutSupprimer: boolean;
  peutReordonner: boolean;
}) {
  return (
    <Tabs defaultValue="main">
      <div className="-mx-4 overflow-x-auto sm:mx-0">
        <TabsList className="justify-start px-4 sm:px-0">
          {MENUS.map((menu) => (
            <TabsTrigger key={menu.value} value={menu.value} className="shrink-0 grow-0">
              {menu.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {MENUS.map((menu) => (
        <TabsContent key={menu.value} value={menu.value} className="pt-4">
          <NavigationMenuList
            menu={menu.value}
            entrees={parMenu[menu.value]}
            peutCreer={peutCreer}
            peutModifier={peutModifier}
            peutSupprimer={peutSupprimer}
            peutReordonner={peutReordonner}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
