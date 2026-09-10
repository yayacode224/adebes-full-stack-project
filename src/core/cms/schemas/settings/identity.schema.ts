import { z } from "zod";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SCHÉMA DU GROUPE DE RÉGLAGES « identity »
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §10.1 du Rapport 2. Reprise de `siteConfig` (`src/lib/site-config.ts`).
 *
 * Un seul schéma, contrairement aux collections des Lots 8 : `site_settings`
 * n'a ni création ni suppression, seulement une MODIFICATION du document
 * entier — la ligne `("group" = 'identity')` existe depuis le seed et existera
 * toujours. Ce schéma sert donc à la fois de forme de LECTURE (le repository
 * le rejoue sur la valeur JSONB lue, §10 du Rapport 1, propriété nº 3) et de
 * forme d'ÉCRITURE et de FORMULAIRE — les trois coïncident, faute de champ à
 * retirer comme `id`/`createdAt` sur les collections.
 *
 * Aucun champ n'admet le marqueur `SETTINGS_TODO_MARKER` : contrairement à
 * `contact` et `legal`, aucune des huit informations d'identité n'était
 * marquée « [À COMPLÉTER] » sur l'ancien site — elles sont toutes déjà
 * connues.
 */
export const identitySettingsSchema = z.object(
  {
    name: z
      .string("Le nom est obligatoire.")
      .trim()
      .min(2, "Le nom est obligatoire.")
      .max(80, "Ce nom est trop long (80 caractères maximum)."),
    legalName: z
      .string("La raison sociale est obligatoire.")
      .trim()
      .min(2, "La raison sociale est obligatoire.")
      .max(160, "Cette raison sociale est trop longue (160 caractères maximum)."),
    motto: z
      .string("La devise est obligatoire.")
      .trim()
      .min(2, "La devise est obligatoire.")
      .max(160, "Cette devise est trop longue (160 caractères maximum)."),
    tagline: z
      .string("L'accroche est obligatoire.")
      .trim()
      .min(2, "L'accroche est obligatoire.")
      .max(160, "Cette accroche est trop longue (160 caractères maximum)."),
    description: z
      .string("La description est obligatoire.")
      .trim()
      .min(20, "Décrivez l'association en une phrase (20 caractères minimum).")
      .max(500, "Cette description est trop longue (500 caractères maximum)."),
    foundingYear: z
      .number("L'année de création est obligatoire.")
      .int("L'année de création doit être un nombre entier.")
      .min(1900, "Cette année ne semble pas correcte.")
      .max(2100, "Cette année ne semble pas correcte."),
    logoMediaId: z.uuid("Choisissez un logo dans la médiathèque.").nullable(),
    faviconMediaId: z.uuid("Choisissez une icône dans la médiathèque.").nullable(),
  },
  { message: "Réglages d'identité invalides." },
);

export type IdentitySettingsInput = z.infer<typeof identitySettingsSchema>;
