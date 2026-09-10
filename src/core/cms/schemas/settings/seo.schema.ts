import { z } from "zod";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SCHÉMA DU GROUPE DE RÉGLAGES « seo »
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §10.1 du Rapport 2. Reprise de `siteConfig.metaDescription` et des mots-clés
 * codés en dur dans `src/app/layout.tsx`.
 *
 * `keywords` est une liste de chaînes simples, comme `bullets[]` des blocs de
 * contenu (Lot 9) — même forme, `<ListField>` en mode « liste de chaînes »
 * (descripteur `of: [{ kind: 'text', name: '' }]`, déclaré dans le composant
 * de formulaire plutôt que dans `core/cms/blocks/shared.ts`, réservé aux
 * blocs).
 */
export const seoSettingsSchema = z.object(
  {
    metaDescription: z
      .string("La description est obligatoire.")
      .trim()
      .min(20, "Décrivez le site en une phrase (20 caractères minimum).")
      .max(300, "Cette description est trop longue (300 caractères maximum)."),
    keywords: z
      .array(
        z
          .string("Un mot-clé doit être du texte.")
          .trim()
          .min(1, "Un mot-clé ne peut pas être vide.")
          .max(60, "Ce mot-clé est trop long (60 caractères maximum)."),
        { message: "La liste de mots-clés est invalide." },
      )
      .max(20, "Vingt mots-clés au maximum."),
    ogMediaId: z.uuid("Choisissez une image dans la médiathèque.").nullable(),
    locale: z
      .string("La locale est obligatoire.")
      .trim()
      .regex(/^[a-z]{2}_[A-Z]{2}$/, "La locale doit être au format « fr_CM »."),
  },
  { message: "Réglages de référencement invalides." },
);

export type SeoSettingsInput = z.infer<typeof seoSettingsSchema>;
