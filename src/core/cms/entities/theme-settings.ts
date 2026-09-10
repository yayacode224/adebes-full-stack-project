/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LE GROUPE DE RÉGLAGES « theme » (Famille C) — §11 du Rapport 2
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Sixième groupe de `site_settings`, resté vide (`'{}'::jsonb`) depuis le seed
 * en attendant ce lot. Il reprend les tokens de `src/app/globals.css` : les
 * couleurs de marque, l'interface claire, l'interface sombre, le rayon des
 * angles et le couple de polices.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `THEME_DEFAULTS` EST LA COPIE EXACTE DE `globals.css`, PAS UNE APPROX.
 * ---------------------------------------------------------------------------
 * La recette du lot vérifie que « Rétablir les couleurs d'origine ADEBES »
 * restaure EXACTEMENT les valeurs de `:root` et `.dark`. Toute divergence ici
 * est un bug. Quand `globals.css` change, ce fichier change avec lui.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  CE MODULE EST SANS FRAMEWORK
 * ---------------------------------------------------------------------------
 * Il est lu par le schéma (`theme.schema.ts`), le mappeur, la lecture publique
 * et — pour `THEME_FONT_LABELS` — le composant de formulaire. Aucune
 * dépendance à React, Next ou Supabase (garde-fou ESLint nº 1). La
 * connaissance des variables CSS de polices (`--font-poppins`, …) vit dans
 * `src/lib/fonts.ts`, pas ici.
 */

/* ═══════════════════════════════════════════════════════════════════════════
 * Polices — liste FERMÉE (contrainte `next/font`, §11.2)
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Les identifiants sont ceux des fonctions `next/font/google` (`Source_Sans_3`
 * garde son underscore) : `src/lib/fonts.ts` s'en sert comme clés de `FONTS`.
 */
export const THEME_FONT_IDS = [
  "Inter",
  "Sora",
  "Poppins",
  "Montserrat",
  "Lora",
  "Source_Sans_3",
] as const;

export type ThemeFontId = (typeof THEME_FONT_IDS)[number];

/** Le nom lisible affiché dans les deux menus déroulants du dashboard. */
export const THEME_FONT_LABELS: Record<ThemeFontId, string> = {
  Inter: "Inter",
  Sora: "Sora",
  Poppins: "Poppins",
  Montserrat: "Montserrat",
  Lora: "Lora (avec empattements)",
  Source_Sans_3: "Source Sans 3",
};

/**
 * La variable CSS qui porte chaque famille, définie par `src/lib/fonts.ts`
 * (`next/font`) sur `<html>`. C'est un contrat de `globals.css` — pas un
 * secret de `next/font` — donc il vit ici, en donnée pure : l'injection
 * serveur ET l'aperçu client (composant React) s'en servent sans tirer
 * `next/font` dans leur bundle.
 */
export const FONT_CSS_VARS: Record<ThemeFontId, string> = {
  Inter: "--font-inter",
  Sora: "--font-sora",
  Poppins: "--font-poppins",
  Montserrat: "--font-montserrat",
  Lora: "--font-lora",
  Source_Sans_3: "--font-source-sans-3",
};

/* ═══════════════════════════════════════════════════════════════════════════
 * Formes de la palette
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Une palette = un mode (clair ou sombre). Dix-huit tokens éditables ;
 * `--popover` / `--popover-foreground` sont dérivés de `card` à l'injection
 * (ils sont toujours égaux dans `globals.css`), `--chart-*` et `--sidebar-*`
 * gardent leur valeur de `globals.css` — l'éditeur ne les expose pas.
 */
export type ThemePalette = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  success: string;
  successForeground: string;
  destructive: string;
  border: string;
  input: string;
  ring: string;
};

/** Couleurs du logo — identiques dans les deux modes (§11.1, ligne « Marque »). */
export type ThemeBrand = {
  navy: string;
  blue: string;
  blueInk: string;
  green: string;
  greenInk: string;
  orange: string;
  orangeInk: string;
};

export type ThemeSettings = {
  light: ThemePalette;
  dark: ThemePalette;
  brand: ThemeBrand;
  /** Rayon de base, ex. `0.75rem`. Les `--radius-*` en dérivent par `calc()`. */
  radius: string;
  headingFont: ThemeFontId;
  bodyFont: ThemeFontId;
};

/* ═══════════════════════════════════════════════════════════════════════════
 * Correspondance token → variable CSS — écrite EN TOUTES LETTRES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Même parti pris que `core/rbac/permissions.ts` : pas de `camelToKebab()`
 * générique. La liste doit se relire ligne à ligne, et c'est elle qui fixe
 * aussi l'ORDRE d'émission dans le `<style>` injecté.
 */
export const PALETTE_CSS_VARS: readonly (readonly [keyof ThemePalette, string])[] = [
  ["background", "--background"],
  ["foreground", "--foreground"],
  ["card", "--card"],
  ["cardForeground", "--card-foreground"],
  ["primary", "--primary"],
  ["primaryForeground", "--primary-foreground"],
  ["secondary", "--secondary"],
  ["secondaryForeground", "--secondary-foreground"],
  ["muted", "--muted"],
  ["mutedForeground", "--muted-foreground"],
  ["accent", "--accent"],
  ["accentForeground", "--accent-foreground"],
  ["success", "--success"],
  ["successForeground", "--success-foreground"],
  ["destructive", "--destructive"],
  ["border", "--border"],
  ["input", "--input"],
  ["ring", "--ring"],
];

export const BRAND_CSS_VARS: readonly (readonly [keyof ThemeBrand, string])[] = [
  ["navy", "--brand-navy"],
  ["blue", "--brand-blue"],
  ["blueInk", "--brand-blue-ink"],
  ["green", "--brand-green"],
  ["greenInk", "--brand-green-ink"],
  ["orange", "--brand-orange"],
  ["orangeInk", "--brand-orange-ink"],
];

/** Libellés français des tokens de palette, pour le formulaire et la recette. */
export const PALETTE_LABELS: Record<keyof ThemePalette, string> = {
  background: "Fond de page",
  foreground: "Texte principal",
  card: "Fond des cartes",
  cardForeground: "Texte sur carte",
  primary: "Couleur principale",
  primaryForeground: "Texte sur couleur principale",
  secondary: "Couleur secondaire",
  secondaryForeground: "Texte sur couleur secondaire",
  muted: "Fond atténué",
  mutedForeground: "Texte atténué",
  accent: "Fond d'accentuation",
  accentForeground: "Texte d'accentuation",
  success: "Succès",
  successForeground: "Texte sur succès",
  destructive: "Alerte / suppression",
  border: "Bordures",
  input: "Bordure des champs",
  ring: "Halo de focus",
};

export const BRAND_LABELS: Record<keyof ThemeBrand, string> = {
  navy: "Bleu marine",
  blue: "Bleu ruban",
  blueInk: "Bleu ruban foncé (sur blanc)",
  green: "Vert ruban",
  greenInk: "Vert ruban foncé (sur blanc)",
  orange: "Orange silhouette",
  orangeInk: "Orange foncé (sur blanc)",
};

/* ═══════════════════════════════════════════════════════════════════════════
 * Valeurs d'origine — reprise EXACTE de src/app/globals.css
 * ═══════════════════════════════════════════════════════════════════════════ */

const LIGHT_DEFAULT: ThemePalette = {
  background: "#fafafa",
  foreground: "#0f2d52",
  card: "#ffffff",
  cardForeground: "#0f2d52",
  primary: "#1b6fa8",
  primaryForeground: "#ffffff",
  secondary: "#eaf1f7",
  secondaryForeground: "#0f2d52",
  muted: "#eef2f6",
  mutedForeground: "#55708f",
  accent: "#e8f4ec",
  accentForeground: "#1f5b23",
  success: "#2e7d32",
  successForeground: "#ffffff",
  destructive: "#b3261e",
  border: "#d9e2ec",
  input: "#cbd6e2",
  ring: "#1b6fa8",
};

const DARK_DEFAULT: ThemePalette = {
  background: "#0b1b2b",
  foreground: "#e8eef4",
  card: "#12293d",
  cardForeground: "#e8eef4",
  primary: "#5cb4e6",
  primaryForeground: "#06121e",
  secondary: "#1a3a52",
  secondaryForeground: "#e8eef4",
  muted: "#16324a",
  mutedForeground: "#9fb3c6",
  accent: "#17402a",
  accentForeground: "#b7e9c0",
  success: "#6cc76f",
  successForeground: "#06121e",
  destructive: "#ff6b60",
  // `globals.css` mélange le texte à du transparent pour ces deux bordures ;
  // la forme est reconnue par `isColorValueSafe` et conservée telle quelle.
  border: "color-mix(in oklab, #e8eef4 14%, transparent)",
  input: "color-mix(in oklab, #e8eef4 20%, transparent)",
  ring: "#5cb4e6",
};

const BRAND_DEFAULT: ThemeBrand = {
  navy: "#0f2d52",
  blue: "#2e8bc0",
  blueInk: "#1b6fa8",
  green: "#4caf50",
  greenInk: "#2e7d32",
  orange: "#f2994a",
  orangeInk: "#a8560c",
};

export const THEME_DEFAULTS: ThemeSettings = {
  light: LIGHT_DEFAULT,
  dark: DARK_DEFAULT,
  brand: BRAND_DEFAULT,
  radius: "0.75rem",
  headingFont: "Sora",
  bodyFont: "Inter",
};

/** Rayons proposés dans le formulaire — le champ n'est pas libre. */
export const RADIUS_CHOICES = [
  { value: "0rem", label: "Angles vifs (0)" },
  { value: "0.25rem", label: "Très légers" },
  { value: "0.375rem", label: "Légers" },
  { value: "0.5rem", label: "Moyens" },
  { value: "0.75rem", label: "Arrondis (origine ADEBES)" },
  { value: "1rem", label: "Très arrondis" },
  { value: "1.5rem", label: "Pilule" },
] as const;

/* ═══════════════════════════════════════════════════════════════════════════
 * Validation et assainissement des couleurs — §11.3
 * ═══════════════════════════════════════════════════════════════════════════ */

const HEX = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const OKLCH =
  /^oklch\(\s*[0-9]*\.?[0-9]+%?\s+[0-9]*\.?[0-9]+\s+[0-9]*\.?[0-9]+(?:\s*\/\s*[0-9]*\.?[0-9]+%?)?\s*\)$/;
const COLOR_MIX_TRANSPARENT =
  /^color-mix\(in oklab, #(?:[0-9a-fA-F]{6}) (?:100|[1-9]?[0-9])%, transparent\)$/;

export const RADIUS_PATTERN = /^(?:0|[0-9]*\.?[0-9]+)(?:rem|px)$/;

/**
 * La couleur est-elle une valeur RECONNUE et INOFFENSIVE ?
 *
 * Seules trois formes passent : hexadécimal (`#rgb`, `#rgba`, `#rrggbb`,
 * `#rrggbbaa`), `oklch(...)` à arguments numériques, et le
 * `color-mix(in oklab, #hex NN%, transparent)` que `globals.css` emploie pour
 * deux bordures du mode sombre. Tout le reste — un nom CSS, une chaîne libre,
 * `red;}body{display:none`, `url(...)`, un commentaire — est refusé : c'est ce
 * qui garantit que rien d'arbitraire ne sera écrit dans le `<style>` injecté.
 */
export function isColorValueSafe(valeur: string): boolean {
  if (typeof valeur !== "string" || valeur.length === 0 || valeur.length > 64) {
    return false;
  }
  return HEX.test(valeur) || OKLCH.test(valeur) || COLOR_MIX_TRANSPARENT.test(valeur);
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Contraste — WCAG 2.1, mesuré en direct (§11.4)
 * ═══════════════════════════════════════════════════════════════════════════ */

type Rgb = { r: number; g: number; b: number };

function hexToRgb(hex: string): Rgb | null {
  let corps = hex.slice(1);
  if (corps.length === 3 || corps.length === 4) {
    corps = corps
      .slice(0, 3)
      .split("")
      .map((c) => c + c)
      .join("");
  } else if (corps.length === 8) {
    corps = corps.slice(0, 6);
  } else if (corps.length !== 6) {
    return null;
  }
  const entier = Number.parseInt(corps, 16);
  if (Number.isNaN(entier)) return null;
  return {
    r: (entier >> 16) & 0xff,
    g: (entier >> 8) & 0xff,
    b: entier & 0xff,
  };
}

/** OKLCH → sRGB (0–255). Conversion standard OKLab → sRGB linéaire → gamma. */
function oklchToRgb(valeur: string): Rgb | null {
  const m = valeur.match(
    /^oklch\(\s*([0-9]*\.?[0-9]+)(%?)\s+([0-9]*\.?[0-9]+)\s+([0-9]*\.?[0-9]+)/,
  );
  if (!m) return null;
  let L = Number.parseFloat(m[1]!);
  if (m[2] === "%") L /= 100;
  const C = Number.parseFloat(m[3]!);
  const hDeg = Number.parseFloat(m[4]!);
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const bb = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * bb;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * bb;
  const s_ = L - 0.0894841775 * a - 1.291485548 * bb;

  const l = l_ * l_ * l_;
  const mm = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const lin = [
    4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s,
  ];

  const gamma = (u: number) => {
    const v = u <= 0.0031308 ? 12.92 * u : 1.055 * Math.pow(u, 1 / 2.4) - 0.055;
    return Math.max(0, Math.min(1, v));
  };

  return {
    r: Math.round(gamma(lin[0]!) * 255),
    g: Math.round(gamma(lin[1]!) * 255),
    b: Math.round(gamma(lin[2]!) * 255),
  };
}

/**
 * Couleur CSS → RGB, pour le seul calcul de contraste. Retourne `null` pour une
 * valeur non opaque (`color-mix(... transparent)`) : ces tokens (bordures) ne
 * font jamais partie d'un couple critique, l'appelant affiche alors « — ».
 */
export function parseColor(valeur: string): Rgb | null {
  if (valeur.startsWith("#")) return hexToRgb(valeur);
  if (valeur.startsWith("oklch(")) return oklchToRgb(valeur);
  return null;
}

function relativeLuminance({ r, g, b }: Rgb): number {
  const canal = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

/**
 * Ratio de contraste entre deux couleurs (1 → 21). Retourne `null` si l'une
 * des deux n'est pas une couleur opaque analysable.
 */
export function contrastRatio(a: string, b: string): number | null {
  const ra = parseColor(a);
  const rb = parseColor(b);
  if (!ra || !rb) return null;
  const la = relativeLuminance(ra);
  const lb = relativeLuminance(rb);
  const clair = Math.max(la, lb);
  const sombre = Math.min(la, lb);
  return (clair + 0.05) / (sombre + 0.05);
}

/** Seuil AA pour du texte normal. En dessous, l'enregistrement est bloqué. */
export const CONTRAST_AA = 4.5;

/**
 * Les couples texte/fond dont la lisibilité est NON NÉGOCIABLE (§11.4). Le
 * formulaire les affiche en direct et bloque l'enregistrement sous 4,5:1 ; le
 * schéma d'écriture rejoue la même vérification côté serveur.
 *
 * `fg` peut être un token de palette (`"foreground"`) ou une couleur littérale
 * (`"#ffffff"` — le blanc du texte sur un bouton de suppression).
 */
export type CriticalPair = {
  mode: "light" | "dark";
  bg: keyof ThemePalette;
  fg: keyof ThemePalette | string;
  label: string;
};

export const CRITICAL_PAIRS: readonly CriticalPair[] = [
  { mode: "light", bg: "background", fg: "foreground", label: "Texte principal sur le fond de page (clair)" },
  { mode: "light", bg: "primary", fg: "primaryForeground", label: "Texte sur le bouton principal (clair)" },
  { mode: "light", bg: "destructive", fg: "#ffffff", label: "Texte blanc sur un bouton de suppression (clair)" },
  { mode: "dark", bg: "background", fg: "foreground", label: "Texte principal sur le fond de page (sombre)" },
  { mode: "dark", bg: "primary", fg: "primaryForeground", label: "Texte sur le bouton principal (sombre)" },
  { mode: "dark", bg: "background", fg: "destructive", label: "Rouge d'alerte sur le fond de page (sombre)" },
];

function couleurDuCouple(theme: ThemeSettings, mode: "light" | "dark", ref: keyof ThemePalette | string): string {
  return ref.startsWith("#") || ref.startsWith("oklch(") ? ref : theme[mode][ref as keyof ThemePalette];
}

/**
 * Renvoie les couples critiques qui ÉCHOUENT (contraste < 4,5:1). Liste vide =
 * le thème peut être enregistré. Utilisé des deux côtés : rendu en direct dans
 * le formulaire, rejoué dans `theme.schema.ts`.
 */
export function couplesCritiquesEnEchec(
  theme: ThemeSettings,
): { pair: CriticalPair; ratio: number | null }[] {
  const echecs: { pair: CriticalPair; ratio: number | null }[] = [];
  for (const pair of CRITICAL_PAIRS) {
    const bg = couleurDuCouple(theme, pair.mode, pair.bg);
    const fg = couleurDuCouple(theme, pair.mode, pair.fg);
    const ratio = contrastRatio(bg, fg);
    if (ratio === null || ratio < CONTRAST_AA) echecs.push({ pair, ratio });
  }
  return echecs;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Construction du CSS injecté — §11.3
 * ═══════════════════════════════════════════════════════════════════════════ */

function valeurSure(brute: string, repli: string): string {
  return isColorValueSafe(brute) ? brute : repli;
}

function paletteEnVars(
  palette: ThemePalette,
  repli: ThemePalette,
): string {
  const decls = PALETTE_CSS_VARS.map(
    ([cle, css]) => `${css}:${valeurSure(palette[cle], repli[cle])}`,
  );
  // `--popover` suit toujours `--card` dans `globals.css`.
  decls.push(`--popover:${valeurSure(palette.card, repli.card)}`);
  decls.push(
    `--popover-foreground:${valeurSure(palette.cardForeground, repli.cardForeground)}`,
  );
  return decls.join(";");
}

/**
 * Thème → feuille de style servie DANS LE HTML INITIAL par `(site)/layout.tsx`.
 *
 * Chaque valeur repasse par `isColorValueSafe` ici même : si une ligne
 * corrompue arrivait de la base malgré le schéma d'écriture, c'est la valeur
 * d'origine ADEBES qui est émise, jamais la chaîne douteuse. Les polices ne
 * sont PAS gérées ici — `(site)/layout.tsx` ajoute `--font-*-runtime` à partir
 * de `src/lib/fonts.ts`.
 */
export function buildThemeCss(theme: ThemeSettings): string {
  const radius = RADIUS_PATTERN.test(theme.radius) ? theme.radius : THEME_DEFAULTS.radius;

  const brand = BRAND_CSS_VARS.map(
    ([cle, css]) => `${css}:${valeurSure(theme.brand[cle], THEME_DEFAULTS.brand[cle])}`,
  ).join(";");

  const racine = `:root{${paletteEnVars(theme.light, THEME_DEFAULTS.light)};${brand};--radius:${radius}}`;
  const sombre = `.dark{${paletteEnVars(theme.dark, THEME_DEFAULTS.dark)}}`;
  return `${racine}\n${sombre}`;
}

/**
 * Fusionne une valeur JSONB lue en base avec les valeurs d'origine. La ligne
 * du seed est `{}` : sans cette fusion, `theme.schema.ts` rejetterait un
 * document vide. Après le premier enregistrement, le document est complet et
 * la fusion est neutre.
 */
export function withThemeDefaults(partiel: unknown): ThemeSettings {
  const p = (partiel ?? {}) as Partial<ThemeSettings>;
  return {
    light: { ...THEME_DEFAULTS.light, ...(p.light ?? {}) },
    dark: { ...THEME_DEFAULTS.dark, ...(p.dark ?? {}) },
    brand: { ...THEME_DEFAULTS.brand, ...(p.brand ?? {}) },
    radius: p.radius ?? THEME_DEFAULTS.radius,
    headingFont: p.headingFont ?? THEME_DEFAULTS.headingFont,
    bodyFont: p.bodyFont ?? THEME_DEFAULTS.bodyFont,
  };
}
