import { z } from "zod";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SCHÉMA DU GROUPE DE RÉGLAGES « socials »
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §10.1 et §10.2 du Rapport 2. Reprise de `socials` (`src/lib/site-config.ts`,
 * `socialLink()`).
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `configured` EST UNE CASE À COCHER EXPLICITE, PAS UNE DÉDUCTION DE `href`
 * ---------------------------------------------------------------------------
 * Le §10.2 demande « une case explicite "ce compte n'existe pas encore", et
 * non un simple champ vide » — pour ne pas laisser un champ URL momentanément
 * vidé pendant une modification retirer silencieusement l'icône du pied de
 * page. Le formulaire (`socials-settings-form.tsx`) la formule à l'affirmative
 * (« Ce compte a été créé ») : l'effet — une icône grisée « bientôt » quand
 * elle est décochée, un vrai lien sinon — est identique, invariant nº 2 du
 * projet.
 *
 * `label` est un `z.literal` : ce n'est pas une saisie, c'est un nom de réseau
 * fixé par ce fichier. Le formulaire ne lui consacre aucun champ ; un POST
 * direct qui tenterait de le renommer serait rejeté ici, avant d'atteindre la
 * base.
 */

/**
 * `<L extends string>` — pas `labelFixe: string` — pour que TypeScript
 * retienne le LITTÉRAL passé à chaque appel (`"Facebook"`, …) plutôt que de
 * l'élargir en `string` : `SocialsSettings` (`site-settings.ts`) déclare
 * `facebook.label` comme le littéral `"Facebook"`, exactement pour rester
 * accordé avec ce que ce schéma infère.
 */
function socialLinkSchema<L extends string>(labelFixe: L) {
  return z
    .object(
      {
        label: z.literal(labelFixe, { message: "Nom de réseau invalide." }),
        href: z
          .string("Adresse invalide.")
          .trim()
          .max(300, "Cette adresse est trop longue (300 caractères maximum)."),
        configured: z.boolean("Choix invalide."),
      },
      { message: "Réseau social invalide." },
    )
    .refine((valeur) => !valeur.configured || valeur.href.length > 0, {
      message:
        'Indiquez l\'adresse du compte, ou décochez « Ce compte a été créé ».',
      path: ["href"],
    })
    .refine(
      (valeur) => valeur.href.length === 0 || /^https:\/\//i.test(valeur.href),
      {
        message: "Cette adresse doit être un lien sécurisé (https://).",
        path: ["href"],
      },
    );
}

export const socialsSettingsSchema = z.object(
  {
    facebook: socialLinkSchema("Facebook"),
    instagram: socialLinkSchema("Instagram"),
    tiktok: socialLinkSchema("TikTok"),
  },
  { message: "Réglages des réseaux sociaux invalides." },
);

export type SocialsSettingsInput = z.infer<typeof socialsSettingsSchema>;
