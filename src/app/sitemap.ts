import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site-config";
import { getArticlesPublies } from "@/server/queries/articles.query";
import { getProgrammesPublies } from "@/server/queries/programmes.query";

/**
 * Sitemap.
 *
 * L'audit relève (§4.7) qu'aucune page n'était indexée et qu'un site mono-page
 * ne peut structurellement pas se positionner sur plusieurs requêtes. Chaque
 * programme et chaque article dispose désormais de sa propre URL, déclarée ici.
 *
 * ---------------------------------------------------------------------------
 * LES PROGRAMMES VIENNENT DE LA BASE (Lot 8A)
 * ---------------------------------------------------------------------------
 * Et uniquement les PUBLIÉS — la RLS du client anonyme s'en charge. Déclarer
 * un brouillon reviendrait à inviter Google à indexer une page qui répond 404,
 * et laisser un programme supprimé dans le sitemap, à publier un lien mort
 * (invariant nº 2).
 *
 * ---------------------------------------------------------------------------
 * LES ARTICLES AUSSI (Lot 8B)
 * ---------------------------------------------------------------------------
 * Et uniquement les publiés DONT LA DATE EST ÉCHUE — c'est ce que garantit
 * `getArticlesPublies()`. Déclarer un article programmé pour la semaine
 * prochaine reviendrait à inviter Google sur une page qui répond 404 : le
 * sitemap deviendrait lui-même une source de liens morts, exactement ce que
 * l'invariant nº 2 interdit.
 *
 * ⚠️  Le §15.3 prévoit d'y ajouter les réglages de `robots.ts` et de
 * `manifest.ts`. Ce lot n'y touche pas.
 *
 * `force-dynamic` : un sitemap figé au build ne verrait jamais une publication
 * faite depuis le dashboard. Comme pour les pages, la mise en cache viendra au
 * Lot 15.
 */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [programmes, articles] = await Promise.all([
    getProgrammesPublies(),
    getArticlesPublies(),
  ]);

  const routes = [
    { url: "/", changeFrequency: "weekly", priority: 1 },
    { url: "/a-propos", changeFrequency: "monthly", priority: 0.8 },
    { url: "/biographie", changeFrequency: "yearly", priority: 0.6 },
    { url: "/programmes", changeFrequency: "monthly", priority: 0.9 },
    { url: "/impact", changeFrequency: "monthly", priority: 0.8 },
    { url: "/actualites", changeFrequency: "weekly", priority: 0.8 },
    { url: "/galerie", changeFrequency: "monthly", priority: 0.6 },
    { url: "/don", changeFrequency: "monthly", priority: 0.9 },
    { url: "/benevolat", changeFrequency: "monthly", priority: 0.9 },
    { url: "/contact", changeFrequency: "yearly", priority: 0.7 },
    { url: "/mentions-legales", changeFrequency: "yearly", priority: 0.3 },
    {
      url: "/politique-confidentialite",
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ] as const;

  const pagesFixes: MetadataRoute.Sitemap = routes.map((entry) => ({
    ...entry,
    url: `${siteUrl}${entry.url === "/" ? "" : entry.url}`,
    lastModified: now,
  }));

  const pagesProgrammes: MetadataRoute.Sitemap = programmes.map((programme) => ({
    url: `${siteUrl}/programmes/${programme.slug}`,
    // La date de dernière modification du programme, pas celle du build : c'est
    // ce que `lastmod` est censé dire, et c'est désormais une vraie donnée.
    lastModified: new Date(programme.updatedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const pagesActualites: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${siteUrl}/actualites/${article.slug}`,
    // La date de dernière modification de l'article, pas celle du build : c'est
    // ce que `lastmod` est censé dire. Elle est préférée à `published_at`, qui
    // ne bouge plus après la mise en ligne alors qu'un article corrigé mérite
    // d'être réexploré.
    lastModified: new Date(article.updatedAt),
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  return [...pagesFixes, ...pagesProgrammes, ...pagesActualites];
}
