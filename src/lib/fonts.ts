import { Inter, Lora, Montserrat, Poppins, Sora, Source_Sans_3 } from "next/font/google";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LA LISTE FERMÉE DE POLICES — §11.2 du Rapport 2
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * `next/font/google` exige des valeurs LITTÉRALES au build : chaque fonction
 * (`Inter`, `Sora`, …) est appelée une fois, ici, au niveau module. Une police
 * saisie librement dans le dashboard est donc techniquement impossible — ce
 * n'est pas un manque, c'est la contrainte que l'éditeur de thème explique à
 * l'utilisateur (`theme-settings-form.tsx`).
 *
 * ---------------------------------------------------------------------------
 * POURQUOI LES QUATRE POLICES SECONDAIRES SONT EN `preload: false`
 * ---------------------------------------------------------------------------
 * Les six `@font-face` sont toujours déclarées (l'appel de fonction suffit),
 * mais seul le couple par défaut (Inter + Sora) est préchargé. Les quatre
 * autres ne sont téléchargées QUE si le thème enregistré les référence
 * réellement via `--font-*-runtime` (voir `globals.css` et `(site)/layout.tsx`)
 * — `display: "swap"` couvre alors le court instant de bascule. Précharger les
 * six punirait chaque visiteur pour un choix que l'association fait une fois.
 *
 * ---------------------------------------------------------------------------
 * LES NOMS DE VARIABLES CSS SONT FIGÉS
 * ---------------------------------------------------------------------------
 * `--font-inter` et `--font-sora` sont déjà lus par `globals.css`
 * (`@theme inline`) comme repli des tokens `--font-sans` / `--font-heading`.
 * Les renommer casserait le rendu par défaut ; les quatre nouveaux suivent la
 * même convention (`--font-<id-en-minuscules-tiret>`).
 */

/*
 * `subsets: ["latin", "latin-ext"]` est redéclaré à chaque appel — et non
 * extrait en constante — pour que le typage contextuel de `next/font` le
 * restreigne à l'union propre à chaque police. Les deux sous-ensembles
 * couvrent tous les accents français.
 */

/** Corps de texte par défaut. Préchargée. */
export const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

/** Titres par défaut. Préchargée. */
export const sora = Sora({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sora",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

/** Poppins n'est pas une police variable : ses graisses sont énumérées. */
const poppins = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
  preload: false,
  fallback: ["system-ui", "sans-serif"],
});

const montserrat = Montserrat({
  subsets: ["latin", "latin-ext"],
  variable: "--font-montserrat",
  display: "swap",
  preload: false,
  fallback: ["system-ui", "sans-serif"],
});

const lora = Lora({
  subsets: ["latin", "latin-ext"],
  variable: "--font-lora",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "serif"],
});

const sourceSans3 = Source_Sans_3({
  subsets: ["latin", "latin-ext"],
  variable: "--font-source-sans-3",
  display: "swap",
  preload: false,
  fallback: ["system-ui", "sans-serif"],
});

/**
 * Les six classes `.variable` à poser sur `<html>` (layout racine). Elles
 * définissent `--font-inter`, `--font-poppins`, … globalement ; c'est ensuite
 * le `<style>` du thème qui décide lesquelles sont réellement utilisées.
 */
export const FONT_VARIABLE_CLASSNAMES = [
  inter.variable,
  sora.variable,
  poppins.variable,
  montserrat.variable,
  lora.variable,
  sourceSans3.variable,
].join(" ");
