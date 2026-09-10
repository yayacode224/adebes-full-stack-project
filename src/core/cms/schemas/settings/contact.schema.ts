import { z } from "zod";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SCHÉMA DU GROUPE DE RÉGLAGES « contact »
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §10.1 du Rapport 2. Reprise de `contact` (`src/lib/site-config.ts`).
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `streetAddress` ET `postalCode` ACCEPTENT UNE CHAÎNE VIDE
 * ---------------------------------------------------------------------------
 * Les deux portent aujourd'hui le marqueur `[À COMPLÉTER]` en base. Obliger
 * l'utilisateur à retaper ce marqueur au clavier serait absurde ; le formulaire
 * (`contact-settings-form.tsx`) affiche donc un champ VIDE pour une valeur qui
 * vaut le marqueur, et le cas d'usage `update-contact-settings.ts` retraduit un
 * champ laissé vide en marqueur à l'écriture. Ce schéma ne voit donc jamais le
 * marqueur lui-même : juste une chaîne, éventuellement vide.
 *
 * ---------------------------------------------------------------------------
 * LE TÉLÉPHONE SECONDAIRE — validation croisée
 * ---------------------------------------------------------------------------
 * §10.2 du Rapport 2 : « le champ n'est activé que si un numéro RÉELLEMENT
 * distinct est saisi ». L'audit avait relevé un second numéro dont le lien
 * pointait en réalité vers le premier (constat nº 5) — cette validation existe
 * pour ne pas réintroduire exactement ce défaut depuis le dashboard.
 *
 * La comparaison porte sur les chiffres seuls (`replace(/\D/g, "")`) : un même
 * numéro écrit `+237 680 67 89 39` et `+237680678939` doit être détecté comme
 * identique, pas seulement une égalité de chaîne caractère à caractère.
 */

const numeroE164 = z
  .string("Ce numéro est obligatoire.")
  .trim()
  .regex(/^\+[1-9]\d{6,14}$/, "Ce numéro doit être au format international (+237680678939).");

function chiffres(valeur: string): string {
  return valeur.replace(/\D/g, "");
}

export const contactSettingsSchema = z
  .object(
    {
      city: z
        .string("La ville est obligatoire.")
        .trim()
        .min(1, "La ville est obligatoire.")
        .max(80, "Ce nom de ville est trop long (80 caractères maximum)."),
      country: z
        .string("Le pays est obligatoire.")
        .trim()
        .min(1, "Le pays est obligatoire.")
        .max(80, "Ce nom de pays est trop long (80 caractères maximum)."),
      streetAddress: z
        .string("Adresse invalide.")
        .trim()
        .max(200, "Cette adresse est trop longue (200 caractères maximum)."),
      postalCode: z
        .string("Code postal invalide.")
        .trim()
        .max(20, "Ce code postal est trop long (20 caractères maximum)."),
      region: z
        .string("La région est obligatoire.")
        .trim()
        .min(1, "La région est obligatoire.")
        .max(80, "Ce nom de région est trop long (80 caractères maximum)."),
      email: z
        .string("L'adresse e-mail est obligatoire.")
        .trim()
        .min(1, "L'adresse e-mail est obligatoire.")
        .email("Cette adresse e-mail ne semble pas valide."),
      phoneE164: numeroE164,
      phoneDisplay: z
        .string("Le téléphone affiché est obligatoire.")
        .trim()
        .min(1, "Le téléphone affiché est obligatoire.")
        .max(40, "Ce numéro affiché est trop long (40 caractères maximum)."),
      secondaryPhoneE164: z
        .string("Numéro secondaire invalide.")
        .trim()
        .max(40, "Ce numéro est trop long (40 caractères maximum)")
        .nullable(),
      secondaryPhoneDisplay: z
        .string("Téléphone secondaire affiché invalide.")
        .trim()
        .max(40, "Ce numéro affiché est trop long (40 caractères maximum).")
        .nullable(),
      openingHours: z
        .string("Les horaires sont obligatoires.")
        .trim()
        .min(1, "Les horaires sont obligatoires.")
        .max(120, "Ces horaires sont trop longs (120 caractères maximum)."),
      openingHoursSpec: z
        .string("Le format technique des horaires est obligatoire.")
        .trim()
        .min(1, "Le format technique des horaires est obligatoire.")
        .max(60, "Ce format est trop long (60 caractères maximum)."),
      geo: z.object(
        {
          latitude: z
            .number("La latitude est obligatoire.")
            .min(-90, "Latitude invalide.")
            .max(90, "Latitude invalide."),
          longitude: z
            .number("La longitude est obligatoire.")
            .min(-180, "Longitude invalide.")
            .max(180, "Longitude invalide."),
        },
        { message: "Coordonnées GPS invalides." },
      ),
    },
    { message: "Réglages de contact invalides." },
  )
  .refine(
    (valeurs) =>
      !valeurs.secondaryPhoneE164 ||
      chiffres(valeurs.secondaryPhoneE164) !== chiffres(valeurs.phoneE164),
    {
      message:
        "Le numéro secondaire doit être différent du numéro principal — sinon, laissez-le vide.",
      path: ["secondaryPhoneE164"],
    },
  )
  .refine(
    (valeurs) => !valeurs.secondaryPhoneE164 === !valeurs.secondaryPhoneDisplay,
    {
      message:
        "Renseignez à la fois le numéro secondaire et sa version affichée, ou laissez les deux vides.",
      path: ["secondaryPhoneDisplay"],
    },
  );

export type ContactSettingsInput = z.infer<typeof contactSettingsSchema>;
