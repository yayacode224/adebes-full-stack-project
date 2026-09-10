import { draftMode } from "next/headers";
import { Eye } from "lucide-react";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  BANNIÈRE DE PRÉVISUALISATION (§12.3 du Rapport 2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * « Une bannière fixe “Mode prévisualisation — vous voyez les brouillons” avec
 * bouton “Quitter” est affichée dans le layout (site) quand
 * `(await draftMode()).isEnabled` est vrai. »
 *
 * ---------------------------------------------------------------------------
 * COMPOSANT SERVEUR, ET UN `<form method="GET">` POUR QUITTER
 * ---------------------------------------------------------------------------
 * `draftMode()` se lit sur le serveur. Le bouton « Quitter » est un
 * formulaire, pas un `<Link>` : Next.js précharge les liens, ce qui
 * appellerait `/api/preview/exit` — donc effacerait le cookie — avant même le
 * clic (doc Next.js). Un formulaire n'est jamais préchargé. Aucun JavaScript
 * n'est requis pour sortir du mode.
 *
 * ---------------------------------------------------------------------------
 * `sticky`, PAS `fixed`
 * ---------------------------------------------------------------------------
 * Une bannière `fixed` recouvrirait le lien d'évitement et le haut de l'en-tête.
 * `sticky top-0` la garde visible au défilement tout en poussant le contenu.
 */
export async function PreviewBanner() {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-[200] flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-brand-orange-ink/30 bg-brand-orange-ink px-4 py-2 text-center text-sm font-medium text-white"
    >
      <span className="inline-flex items-center gap-2">
        <Eye className="size-4 shrink-0" aria-hidden="true" />
        Mode prévisualisation — vous voyez les brouillons et les contenus
        programmés.
      </span>

      <form action="/api/preview/exit" method="get" className="contents">
        <button
          type="submit"
          className="rounded-md bg-white/15 px-2.5 py-1 font-semibold underline-offset-2 hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Quitter
        </button>
      </form>
    </div>
  );
}
