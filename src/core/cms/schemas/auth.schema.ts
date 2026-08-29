import { z } from "zod";

/**
 * Schémas d'authentification.
 *
 * Même style que `src/lib/schemas.ts` : messages en français, rédigés pour
 * être affichés tels quels sous le champ concerné.
 */

const email = z
  .string()
  .trim()
  .min(1, "L'adresse e-mail est obligatoire.")
  .email("Cette adresse e-mail ne semble pas valide.")
  // Les claviers mobiles capitalisent volontiers la première lettre ; les
  // adresses ne sont pas sensibles à la casse.
  .transform((v) => v.toLowerCase());

/**
 * Mot de passe : 12 caractères minimum (§4.1 du Rapport 2).
 *
 * Longueur plutôt que composition imposée. Exiger une majuscule, un chiffre et
 * un caractère spécial produit surtout des « Password1! » et des mots de passe
 * notés sur un papier ; douze caractères libres résistent mieux et se
 * retiennent.
 */
const motDePasse = z
  .string()
  .min(12, "Le mot de passe doit contenir au moins 12 caractères.")
  .max(72, "Le mot de passe ne peut pas dépasser 72 caractères.");

export const signInSchema = z.object({
  email,
  // À la connexion, on ne valide PAS la longueur : le mot de passe existant
  // peut être plus court, et « 12 caractères minimum » sous un champ de
  // connexion laisserait croire que c'est la raison de l'échec.
  password: z.string().min(1, "Le mot de passe est obligatoire."),
  /** Chemin de retour après connexion. Validé côté serveur avant redirection. */
  suivant: z.string().optional(),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    password: motDePasse,
    passwordConfirmation: z.string().min(1, "Confirmez le mot de passe."),
  })
  .refine((v) => v.password === v.passwordConfirmation, {
    message: "Les deux mots de passe ne correspondent pas.",
    // Sans ce chemin, l'erreur se rattache au formulaire entier et n'apparaît
    // sous aucun champ.
    path: ["passwordConfirmation"],
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * Traduction des messages de Supabase Auth (§4.1 du Rapport 2).
 *
 * Supabase répond en anglais et en jargon. « Invalid login credentials »
 * affiché tel quel à un bénévole camerounais n'est pas acceptable.
 *
 * ⚠️  Le message d'identifiants invalides ne distingue PAS « e-mail inconnu »
 * de « mot de passe faux ». C'est délibéré : préciser lequel des deux est
 * erroné permet d'énumérer les comptes existants.
 */
const MESSAGES_SUPABASE: { motif: RegExp; message: string }[] = [
  {
    motif: /invalid login credentials|invalid credentials/i,
    message: "E-mail ou mot de passe incorrect.",
  },
  {
    motif: /email not confirmed/i,
    message:
      "Votre compte n'est pas encore activé. Vérifiez votre boîte mail, y compris les indésirables.",
  },
  {
    motif: /email rate limit|over_email_send_rate_limit|too many requests/i,
    message: "Trop de tentatives. Patientez quelques minutes avant de réessayer.",
  },
  {
    motif: /token has expired|invalid.*token|expired/i,
    message:
      "Ce lien a expiré ou a déjà été utilisé. Demandez-en un nouveau.",
  },
  {
    motif: /same as the old password|new password should be different/i,
    message: "Choisissez un mot de passe différent de l'ancien.",
  },
  {
    motif: /password should be at least/i,
    message: "Le mot de passe doit contenir au moins 12 caractères.",
  },
  {
    motif: /user not found/i,
    message: "Aucun compte ne correspond à cette adresse.",
  },
];

export function traduireErreurAuth(message: string | undefined): string {
  if (!message) {
    return "La connexion a échoué. Réessayez dans un instant.";
  }
  const trouve = MESSAGES_SUPABASE.find((m) => m.motif.test(message));
  if (trouve) return trouve.message;

  // Message inconnu : on n'affiche PAS l'anglais brut de Supabase. Le détail
  // part au journal du serveur, l'utilisateur reçoit une phrase utilisable.
  return "La connexion a échoué. Réessayez dans un instant.";
}
