import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { StickyMobileActionBar } from "@/components/layout/sticky-mobile-action-bar";

/**
 * Chrome du site public.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI CE FICHIER EXISTE
 * ---------------------------------------------------------------------------
 * Jusqu'au Lot 4, l'en-tête, le pied de page et la barre d'action mobile
 * vivaient dans `src/app/layout.tsx`, donc s'appliquaient à TOUTES les routes.
 * Le dashboard et les écrans de connexion en auraient hérité : un back-office
 * coiffé du menu public et surmonté d'un bouton « Faire un don ».
 *
 * Le route group `(site)` isole ce chrome. Les parenthèses ne paraissent
 * jamais dans l'URL : `/a-propos` reste `/a-propos`.
 *
 * ---------------------------------------------------------------------------
 * `pb-action-bar` : ici, et pas sur le <body>
 * ---------------------------------------------------------------------------
 * Cette classe réserve, sous `lg:`, la hauteur de la `StickyMobileActionBar`
 * plus `env(safe-area-inset-bottom)`. Elle était posée sur le `<body>` du
 * layout racine, donc aussi sur le dashboard — où la barre n'existe pas, et
 * où elle aurait creusé un espace mort en bas de chaque écran (§5.3 du
 * Rapport 2).
 *
 * Elle accompagne désormais le composant qu'elle sert.
 */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col pb-action-bar lg:pb-0">
      {/*
        Lien d'évitement : première cible du clavier, il permet de sauter la
        navigation pour atteindre le contenu. Il vit ici plutôt qu'à la racine
        car il pointe vers `#contenu`, qui n'existe que dans ce layout.
      */}
      <a
        href="#contenu"
        className="sr-only rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100]"
      >
        Aller au contenu principal
      </a>

      <SiteHeader />

      <main id="contenu" className="flex-1">
        {children}
      </main>

      <SiteFooter />
      <StickyMobileActionBar />
    </div>
  );
}
