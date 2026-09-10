import { z } from "zod";

import {
  couplesCritiquesEnEchec,
  isColorValueSafe,
  RADIUS_PATTERN,
  THEME_FONT_IDS,
  type ThemeSettings,
} from "@/core/cms/entities/theme-settings";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SCHÉMA DU GROUPE DE RÉGLAGES « theme » — §11 du Rapport 2
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Comme les cinq schémas du Lot 10 : une seule forme sert de LECTURE (rejouée
 * par le mappeur sur la valeur JSONB), d'ÉCRITURE et de contrat d'entrée de la
 * Server Action. `site_settings` n'a ni création ni suppression — seulement une
 * modification du document entier.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  DEUX NIVEAUX DE VALIDATION DES COULEURS
 * ---------------------------------------------------------------------------
 *   1. `couleurSure` — assainissement : chaque champ n'accepte QUE `#hex`,
 *      `oklch(...)` ou le `color-mix(... transparent)` de `globals.css`. C'est
 *      ce qui empêche `red;}body{display:none` d'atteindre le `<style>`
 *      injecté (§11.3).
 *   2. `.superRefine` — contraste : les couples critiques (§11.4) doivent
 *      rester au-dessus de 4,5:1. Le formulaire le vérifie déjà en direct et
 *      bloque le bouton ; ceci est le filet côté serveur, rejoué par
 *      `createAction` — une Server Action est une frontière publique, la
 *      vérification client n'est jamais une garantie.
 */

const couleurSure = z
  .string("Cette couleur est obligatoire.")
  .trim()
  .refine(isColorValueSafe, {
    message: "Utilisez une couleur hexadécimale (#1B6FA8) ou oklch(...).",
  });

const paletteSchema = z.object(
  {
    background: couleurSure,
    foreground: couleurSure,
    card: couleurSure,
    cardForeground: couleurSure,
    primary: couleurSure,
    primaryForeground: couleurSure,
    secondary: couleurSure,
    secondaryForeground: couleurSure,
    muted: couleurSure,
    mutedForeground: couleurSure,
    accent: couleurSure,
    accentForeground: couleurSure,
    success: couleurSure,
    successForeground: couleurSure,
    destructive: couleurSure,
    border: couleurSure,
    input: couleurSure,
    ring: couleurSure,
  },
  { message: "Palette de couleurs invalide." },
);

const brandSchema = z.object(
  {
    navy: couleurSure,
    blue: couleurSure,
    blueInk: couleurSure,
    green: couleurSure,
    greenInk: couleurSure,
    orange: couleurSure,
    orangeInk: couleurSure,
  },
  { message: "Couleurs de marque invalides." },
);

export const themeSettingsSchema = z
  .object(
    {
      light: paletteSchema,
      dark: paletteSchema,
      brand: brandSchema,
      radius: z
        .string("Le rayon des angles est obligatoire.")
        .trim()
        .regex(RADIUS_PATTERN, "Le rayon doit être exprimé en rem ou px (ex. 0.75rem)."),
      headingFont: z.enum(THEME_FONT_IDS, {
        message: "Choisissez une police de titre dans la liste.",
      }),
      bodyFont: z.enum(THEME_FONT_IDS, {
        message: "Choisissez une police de texte dans la liste.",
      }),
    },
    { message: "Réglages de thème invalides." },
  )
  .superRefine((theme, ctx) => {
    for (const { pair, ratio } of couplesCritiquesEnEchec(theme as ThemeSettings)) {
      const cible =
        typeof pair.fg === "string" && (pair.fg.startsWith("#") || pair.fg.startsWith("oklch("))
          ? pair.bg
          : (pair.fg as string);
      ctx.addIssue({
        code: "custom",
        path: [pair.mode, cible],
        message:
          ratio === null
            ? `Contraste incalculable pour « ${pair.label} » : choisissez des couleurs opaques.`
            : `Contraste insuffisant pour « ${pair.label} » : ${ratio.toFixed(2)}:1, il faut au moins 4,5:1.`,
      });
    }
  });

export type ThemeSettingsInput = z.infer<typeof themeSettingsSchema>;
