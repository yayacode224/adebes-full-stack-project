import Image from "next/image";

import { resolveMedia } from "@/lib/media";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

/**
 * Deux verrouillages, deux teintes.
 *
 * `full` est le logo officiel complet (pictogramme + ADEBES + raison sociale +
 * signature). Ses trois lignes de texte ne deviennent lisibles qu'à partir de
 * ~80 px de haut : il est réservé au pied de page et aux grands formats.
 *
 * `compact` est le même logo réduit au pictogramme et au mot « ADEBES », le
 * mot étant recentré verticalement sur le pictogramme. C'est la seule version
 * qui reste nette dans un header de 64 à 80 px de haut.
 *
 * Chaque verrouillage existe en bleu marine (fonds clairs) et en blanc (fonds
 * sombres et photos) : le fichier source est monochrome, il disparaîtrait
 * purement et simplement en thème sombre sans sa contrepartie blanche.
 */
export const LOGO_PATHS = {
  full: {
    color: "/images/logo/logo-full-color.jpeg",
    white: "/images/logo/logo-full-white.jpeg",
  },
  compact: {
    color: "/images/logo/logo-compact-color.jpeg",
    white: "/images/logo/logo-compact-white.jpeg",
  },
} as const;

/**
 * Dimensions intrinsèques réelles des fichiers, au pixel près : sans elles
 * `next/image` réserve un rapport 4:1 puis se corrige au chargement, ce qui
 * décale le header (CLS).
 *
 * **À remesurer à chaque remplacement de fichier** — c'est le rapport de
 * l'image réellement servie qui compte, pas celui du logo d'origine. Les
 * valeurs ci-dessous correspondent à `logo-full-*.svg` (1361 × 415) et à
 * `logo-compact-*.jpeg` (1600 × 768).
 */
const LOGO_SIZE = {
  full: { width: 1361, height: 415 },
  compact: { width: 1600, height: 768 },
} as const;

/**
 * Pictogramme provisoire : cœur formé de deux rubans (bleu à gauche, vert à
 * droite), trois silhouettes à l'intérieur, pousse verte au sommet.
 *
 * Il reprend la construction du logo réel pour que la mise en page, les
 * proportions et les contrastes soient déjà justes. Dès que
 * `logo-full-color.svg` est déposé dans /public/images/logo/, c'est le fichier
 * officiel qui est rendu à la place, sans changer une ligne de code.
 */
function LogoMark({
  className,
  monochrome = false,
}: {
  className?: string;
  monochrome?: boolean;
}) {
  const blue = monochrome ? "currentColor" : "var(--color-brand-blue)";
  const green = monochrome ? "currentColor" : "var(--color-brand-green)";
  const orange = monochrome ? "currentColor" : "var(--color-brand-orange)";
  const navy = monochrome ? "currentColor" : "var(--color-brand-navy)";

  return (
    <svg
      viewBox="0 0 64 64"
      role="presentation"
      focusable="false"
      className={cn("h-full w-auto shrink-0", className)}
    >
      {/* Pousse / feuille au sommet du cœur */}
      <path
        d="M32 15c0-4.6 2.6-8.4 7.4-9.4.6 4.9-2.2 9-7.4 9.4Z"
        fill={green}
      />
      {/* Ruban gauche */}
      <path
        d="M32 17.4C29.7 13.4 25.6 11 21.1 11 13.9 11 8.5 16.7 8.5 24.2c0 11.6 13.9 23.4 21 29.4"
        fill="none"
        stroke={blue}
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Ruban droit */}
      <path
        d="M32 17.4C34.3 13.4 38.4 11 42.9 11 50.1 11 55.5 16.7 55.5 24.2c0 11.6-13.9 23.4-21 29.4"
        fill="none"
        stroke={green}
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Trois silhouettes aux bras levés */}
      <circle cx="23.5" cy="31" r="3" fill={orange} />
      <path
        d="M18.8 43.5c0-2.9 2.1-5.2 4.7-5.2s4.7 2.3 4.7 5.2"
        fill="none"
        stroke={orange}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="32" cy="27.5" r="3.6" fill={navy} />
      <path
        d="M26.4 41.5c0-3.4 2.5-6.2 5.6-6.2s5.6 2.8 5.6 6.2"
        fill="none"
        stroke={navy}
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <circle cx="40.5" cy="31" r="3" fill={green} />
      <path
        d="M35.8 43.5c0-2.9 2.1-5.2 4.7-5.2s4.7 2.3 4.7 5.2"
        fill="none"
        stroke={green}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* Deux mains ouvertes qui portent le cœur */}
      <path
        d="M20 50.5c-2.6-.9-4.8-.4-6.6 1.5M44 50.5c2.6-.9 4.8-.4 6.6 1.5"
        fill="none"
        stroke={blue}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Logo ADEBES.
 *
 * `variant="white"` est destiné aux fonds sombres (footer, mode sombre) : le
 * texte de marque du logo officiel étant bleu marine, il devient illisible sur
 * fond bleu nuit sans cette variante (section 6 du cahier des charges).
 */
export function Logo({
  variant = "color",
  withBaseline = false,
  fetchPriority = "auto",
  className,
}: {
  variant?: "color" | "white";
  /** Affiche la baseline sous le nom — réservé au footer et aux grands formats. */
  withBaseline?: boolean;
  /**
   * `"high"` pour le logo du header, visible dès le premier écran.
   *
   * Volontairement pas `preload` : le header rend les deux teintes et masque
   * l'une en CSS. Un préchargement téléchargerait les deux fichiers, alors que
   * le `loading="lazy"` par défaut ne charge que celui qui est réellement
   * affiché — c'est la recommandation de la doc `next/image` pour ce motif
   * (`priority` est par ailleurs déprécié depuis Next.js 16).
   */
  fetchPriority?: "high" | "auto";
  className?: string;
}) {
  const lockup = withBaseline ? "full" : "compact";
  const file = resolveMedia(LOGO_PATHS[lockup][variant]);
  const onDark = variant === "white";

  if (file.available) {
    return (
      <Image
        src={file.src}
        alt={`${siteConfig.name} — ${siteConfig.legalName}`}
        {...LOGO_SIZE[lockup]}
        /*
         * Le SVG doit contourner l'optimiseur, et ce n'est pas qu'une question
         * de poids : `/_next/image` refuse les SVG par une **erreur 400**
         * (« image type is not allowed ») tant que `images.dangerouslyAllowSVG`
         * n'est pas activé dans next.config.ts — ce qu'on ne veut pas, un SVG
         * pouvant embarquer du script. Inverser cette condition fait donc
         * disparaître purement et simplement le logo du pied de page, seul
         * emplacement servi par un SVG (`logo-full-white.svg`).
         *
         * Le JPEG, lui, a tout à gagner à être optimisé : 67 Ko à la source,
         * 17 Ko après conversion AVIF/WebP.
         */
        unoptimized={file.src.endsWith(".svg")}
        fetchPriority={fetchPriority}
        className={cn("h-10 w-auto select-none", className)}
      />
    );
  }

  return (
    <span
      className={cn("flex h-10 items-center gap-2.5", className)}
      // Le logo est décomposé en éléments décoratifs + texte : les lecteurs
      // d'écran annoncent le nom une seule fois, proprement.
      role="img"
      aria-label={`${siteConfig.name} — ${siteConfig.legalName}`}
    >
      <LogoMark monochrome={onDark} className={onDark ? "text-white" : ""} />

      <span
        aria-hidden="true"
        className={cn(
          "h-[70%] w-px shrink-0",
          onDark ? "bg-white/35" : "bg-brand-navy/25",
        )}
      />

      <span aria-hidden="true" className="flex min-w-0 flex-col justify-center">
        <span
          className={cn(
            "font-heading text-[1.35rem] font-extrabold leading-none tracking-tight",
            onDark ? "text-white" : "text-brand-navy dark:text-foreground",
          )}
        >
          ADEBES
        </span>
        {withBaseline ? (
          <>
            <span
              className={cn(
                "mt-1 text-[0.62rem] font-medium leading-tight",
                onDark ? "text-white/75" : "text-muted-foreground",
              )}
            >
              {siteConfig.legalName}
            </span>
            <span
              className={cn(
                "mt-0.5 text-[0.6rem] font-semibold uppercase leading-tight tracking-wide",
                onDark ? "text-brand-green" : "text-brand-green-ink",
              )}
            >
              {siteConfig.motto}
            </span>
          </>
        ) : null}
      </span>
    </span>
  );
}
