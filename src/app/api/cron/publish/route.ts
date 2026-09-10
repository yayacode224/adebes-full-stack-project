import { revalidateTag } from "next/cache";

import { createPublicClient } from "@/infrastructure/supabase/clients/public";
import {
  ETIQUETTE_ARTICLES,
  etiquetteArticle,
} from "@/server/queries/articles.query";
import { etiquettesDePage } from "@/server/queries/pages.query";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /api/cron/publish — PUBLICATION PROGRAMMÉE (§12.4 du Rapport 2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Un contenu `status = 'published'` dont `published_at` est dans le futur est
 * déjà « publié » côté éditorial, mais invisible : les lectures publiques
 * filtrent `published_at <= now()` (RLS pour les articles, cas d'usage pour les
 * pages). Rien à faire pour qu'il apparaisse à l'heure dite… sauf réévaluer les
 * pages mises en cache.
 *
 * Ce Route Handler, appelé une fois par jour par Vercel Cron (`vercel.json`),
 * repère les contenus dont la date de parution vient d'échoir et marque leurs
 * étiquettes de cache comme périmées.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `revalidateTag(tag, 'max')` — PAS `updateTag`
 * ---------------------------------------------------------------------------
 * `updateTag` n'existe que dans une Server Action. Dans un Route Handler, c'est
 * `revalidateTag`, et le second argument est OBLIGATOIRE en Next.js 16. `'max'`
 * = sémantique « périmé pendant qu'on rafraîchit » : le visiteur suivant reçoit
 * l'ancienne page pendant que la nouvelle se construit, ce qui est le bon
 * compromis pour un contenu qui vient d'être mis en ligne.
 *
 * ---------------------------------------------------------------------------
 * PORTÉE RÉELLE AUJOURD'HUI
 * ---------------------------------------------------------------------------
 * Tant que `cacheComponents` n'est pas activé (Lot 15), les lectures publiques
 * ne sont pas mises en cache entre deux requêtes : un contenu programmé
 * apparaît de lui-même à sa date. Ce handler EXISTE et fonctionne dès
 * maintenant — il repère les contenus échus et purge les bonnes étiquettes —,
 * mais son effet observable ne sera complet qu'avec le cache du Lot 15. Le
 * bâtir ici, c'est éviter d'avoir à s'en souvenir plus tard.
 *
 * ---------------------------------------------------------------------------
 * AUTHENTIFICATION
 * ---------------------------------------------------------------------------
 * Vercel Cron envoie `Authorization: Bearer <CRON_SECRET>` quand la variable
 * `CRON_SECRET` est déclarée. Sans variable configurée, on refuse (fail
 * closed) : une route de purge ouverte est un vecteur de déni de service par
 * invalidation.
 */

/** Fenêtre de rattrapage : un peu plus qu'un jour, pour absorber un cron manqué. */
const FENETRE_HEURES = 25;

export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return Response.json(
      { erreur: "CRON_SECRET n'est pas configuré." },
      { status: 500 },
    );
  }

  const entete = request.headers.get("authorization");
  if (entete !== `Bearer ${secret}`) {
    return new Response("Non autorisé", { status: 401 });
  }

  const maintenant = Date.now();
  const depuis = new Date(maintenant - FENETRE_HEURES * 3_600_000).toISOString();
  const jusqua = new Date(maintenant).toISOString();

  const supabase = createPublicClient();

  const [articles, pages] = await Promise.all([
    supabase
      .from("articles")
      .select("slug, published_at")
      .eq("status", "published")
      .gte("published_at", depuis)
      .lte("published_at", jusqua),
    supabase
      .from("pages")
      .select("slug, route, published_at")
      .eq("status", "published")
      .gte("published_at", depuis)
      .lte("published_at", jusqua),
  ]);

  if (articles.error || pages.error) {
    return Response.json(
      { erreur: "Lecture des contenus programmés impossible." },
      { status: 500 },
    );
  }

  const etiquettes = new Set<string>();
  const liberes: { type: "article" | "page"; ref: string; publishedAt: string | null }[] =
    [];

  for (const article of articles.data ?? []) {
    etiquettes.add(ETIQUETTE_ARTICLES);
    etiquettes.add(etiquetteArticle(article.slug));
    etiquettes.add("cms:page:accueil");
    etiquettes.add("cms:page:actualites");
    liberes.push({ type: "article", ref: article.slug, publishedAt: article.published_at });
  }

  for (const page of pages.data ?? []) {
    for (const etiquette of etiquettesDePage(page.slug)) etiquettes.add(etiquette);
    liberes.push({ type: "page", ref: page.route, publishedAt: page.published_at });
  }

  for (const etiquette of etiquettes) revalidateTag(etiquette, "max");

  return Response.json({
    ran: jusqua,
    windowHours: FENETRE_HEURES,
    released: liberes,
    revalidated: [...etiquettes],
  });
}
