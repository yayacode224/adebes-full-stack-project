import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /api/preview/exit — SORTIE DU MODE PRÉVISUALISATION (§12.3)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Déclenchée par le bouton « Quitter » de la bannière de prévisualisation, via
 * un `<form method="GET">` — et non un `<Link>` : Next.js précharge les liens,
 * ce qui effacerait le cookie avant même le clic (doc Next.js, Draft Mode).
 *
 * Aucune garde d'accès : sortir du mode brouillon ne révèle rien. On désactive
 * le cookie et on renvoie l'utilisateur là où il était — ou à l'accueil si le
 * chemin est absent ou externe.
 */
export async function GET(request: Request): Promise<Response> {
  (await draftMode()).disable();

  const { searchParams } = new URL(request.url);
  const chemin = searchParams.get("chemin") ?? "/";
  const cible =
    chemin.startsWith("/") && !chemin.startsWith("//") && !chemin.startsWith("/\\")
      ? chemin
      : "/";

  redirect(cible);
}
