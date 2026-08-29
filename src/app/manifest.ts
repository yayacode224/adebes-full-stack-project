import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site-config";

/**
 * Manifeste d'application.
 *
 * Les icônes pointent vers les fichiers de la convention de nommage
 * (`icon-192.png`, `icon-512.png`). Tant qu'ils ne sont pas déposés, le
 * navigateur retombe sur `icon.svg`, généré depuis le pictogramme du logo.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name} — ${siteConfig.legalName}`,
    short_name: siteConfig.name,
    description: siteConfig.metaDescription,
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
