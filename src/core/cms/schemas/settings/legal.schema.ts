import { z } from "zod";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SCHÉMA DU GROUPE DE RÉGLAGES « legal »
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §10.1 du Rapport 2. Reprise de `legal` (`src/lib/site-config.ts`).
 *
 * Les trois premiers champs acceptent une chaîne vide, pour la même raison
 * que `contact.streetAddress` : ils portent aujourd'hui le marqueur
 * `[À COMPLÉTER]`, retraduit par `update-legal-settings.ts` — voir ce fichier.
 *
 * `hostingProvider`, en revanche, n'a jamais été marqué à compléter : c'est un
 * fait, pas une donnée en attente (Vercel Inc., hébergeur réel du site), et il
 * reste obligatoire.
 */
export const legalSettingsSchema = z.object(
  {
    registrationNumber: z
      .string("Numéro d'enregistrement invalide.")
      .trim()
      .max(80, "Ce numéro est trop long (80 caractères maximum)."),
    registrationAuthority: z
      .string("Autorité d'enregistrement invalide.")
      .trim()
      .max(160, "Ce nom est trop long (160 caractères maximum)."),
    publicationDirector: z
      .string("Directeur de publication invalide.")
      .trim()
      .max(160, "Ce nom est trop long (160 caractères maximum)."),
    hostingProvider: z.object(
      {
        name: z
          .string("Le nom de l'hébergeur est obligatoire.")
          .trim()
          .min(1, "Le nom de l'hébergeur est obligatoire.")
          .max(160, "Ce nom est trop long (160 caractères maximum)."),
        address: z
          .string("L'adresse de l'hébergeur est obligatoire.")
          .trim()
          .min(1, "L'adresse de l'hébergeur est obligatoire.")
          .max(240, "Cette adresse est trop longue (240 caractères maximum)."),
        url: z
          .string("L'adresse du site de l'hébergeur est obligatoire.")
          .trim()
          .min(1, "L'adresse du site de l'hébergeur est obligatoire.")
          .url("Cette adresse ne semble pas être une URL valide."),
      },
      { message: "Coordonnées de l'hébergeur invalides." },
    ),
  },
  { message: "Réglages légaux invalides." },
);

export type LegalSettingsInput = z.infer<typeof legalSettingsSchema>;
