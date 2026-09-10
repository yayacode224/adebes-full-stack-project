import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

import { can } from "@/core/rbac/policy";
import { getCurrentActor } from "@/server/dal/session";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /api/preview — ENTRÉE EN MODE PRÉVISUALISATION (§12.3 du Rapport 2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * `GET /api/preview?chemin=/actualites/mon-brouillon`
 *
 * Active le mode brouillon de Next.js (cookie `__prerender_bypass`) puis
 * redirige vers `chemin`. À partir de là, les pages du site appellent les
 * lectures de `server/preview/read.ts` : elles voient les brouillons et les
 * contenus programmés.
 *
 * ---------------------------------------------------------------------------
 * PAS DE JETON PARTAGÉ — UNE SESSION DE PERSONNEL
 * ---------------------------------------------------------------------------
 * Le guide Next.js protège cette route par un secret parce qu'il suppose un
 * CMS tiers. Ici, le CMS EST cette application : le rédacteur est déjà
 * connecté. On vérifie donc `page:read` — la porte du personnel — plutôt qu'un
 * secret de plus à faire fuiter.
 *
 * ---------------------------------------------------------------------------
 * REDIRECTION OUVERTE — LE CHEMIN EST CONTRÔLÉ
 * ---------------------------------------------------------------------------
 * `chemin` vient de l'URL. Sans contrôle, `?chemin=https://evil.example`
 * ferait de cette route un tremplin de hameçonnage. On n'accepte qu'un chemin
 * interne : commence par `/`, jamais par `//` ni `/\`.
 */
export async function GET(request: Request): Promise<Response> {
  const actor = await getCurrentActor();
  if (!actor || !can(actor, "page:read")) {
    return new Response("Non autorisé", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const chemin = searchParams.get("chemin") ?? "/";

  if (!cheminInterneValide(chemin)) {
    return new Response("Chemin de prévisualisation invalide.", { status: 400 });
  }

  (await draftMode()).enable();
  redirect(chemin);
}

/** Un chemin relatif au site, jamais une URL absolue ni un chemin protocole-relatif. */
function cheminInterneValide(chemin: string): boolean {
  return (
    chemin.startsWith("/") &&
    !chemin.startsWith("//") &&
    !chemin.startsWith("/\\")
  );
}
