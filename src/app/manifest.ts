import type { MetadataRoute } from "next";

import { getIdentitySettings, getSeoSettings } from "@/server/queries/settings.query";

/**
 * Manifeste d'application.
 *
 * §10.3 du Rapport 2 : `name`, `short_name` et `description` viennent
 * désormais des réglages `identity` et `seo` — `getIdentitySettings()` et
 * `getSeoSettings()` replient sur `site-config.ts` si la base est
 * injoignable, ce filet n'a donc pas à être répété ici.
 *
 * Les icônes pointent vers les fichiers de la convention de nommage
 * (`icon-192.png`, `icon-512.png`). Tant qu'ils ne sont pas déposés, le
 * navigateur retombe sur `icon.svg`, généré depuis le pictogramme du logo.
 *
 * ⚠️  `force-dynamic` — TRANSITOIRE, À RETIRER AU LOT 15, même raison que
 * `sitemap.ts` : sans elle, ce fichier serait figé au build (mesuré :
 * `○ /manifest.webmanifest`) et un nom d'association renseigné depuis le
 * dashboard n'y apparaîtrait qu'au prochain déploiement.
 */
export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const [identite, seo] = await Promise.all([getIdentitySettings(), getSeoSettings()]);

  return {
    name: `${identite.name} — ${identite.legalName}`,
    short_name: identite.name,
    description: seo.metaDescription,
    lang: "fr",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1b2b",
    theme_color: "#0b1b2b",
    icons: [
      {
        src: "/images/logo/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/images/logo/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
