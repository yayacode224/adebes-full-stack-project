"use server";

import { redirect } from "next/navigation";

import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  traduireErreurAuth,
} from "@/core/cms/schemas/auth.schema";
import { AppError } from "@/core/shared/errors";
import { createServerClient } from "@/infrastructure/supabase/clients/server";
import { siteUrl } from "@/lib/site-config";

import { toActionResult, type ActionResult } from "../action-kit/action-result";
import { writeAuthAuditLog } from "../action-kit/audit";
import { checkRateLimit, RATE_LIMITS } from "../action-kit/rate-limit";
import { adresseAppelante } from "../action-kit/request-context";
import { getCurrentActor } from "../dal/session";

/**
 * Actions d'authentification.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI CES ACTIONS NE PASSENT PAS PAR `createAction`
 * ---------------------------------------------------------------------------
 * `createAction` appelle `getCurrentActor()` puis vérifie une permission. Or
 * ici il n'y a, par définition, pas encore d'acteur : c'est le but de
 * l'opération. Une `permission: null` fonctionnerait, mais le décorateur
 * n'apporterait que de la cérémonie sans garde utile.
 *
 * Ces actions appliquent donc à la main les deux protections qui les
 * concernent — limitation de débit et validation — et rien de plus. C'est la
 * seule exception à la règle « aucune mutation hors de createAction », et elle
 * est bornée à ce fichier.
 */

/** Aplatit les erreurs Zod, une seule par champ. */
function champsEnErreur(issues: { path: PropertyKey[]; message: string }[]) {
  const champs: Record<string, string> = {};
  for (const probleme of issues) {
    const chemin = probleme.path.join(".");
    if (chemin && !champs[chemin]) champs[chemin] = probleme.message;
  }
  return champs;
}

/** Connexion par e-mail et mot de passe. */
export async function signInAction(
  entree: unknown,
): Promise<ActionResult<{ suivant: string }>> {
  const ip = await adresseAppelante();
  const refus = await checkRateLimit({
    key: `${RATE_LIMITS.connexion.key}:${ip}`,
    max: RATE_LIMITS.connexion.max,
    windowSeconds: RATE_LIMITS.connexion.windowSeconds,
  });
  if (refus) return toActionResult(refus);

  const analyse = signInSchema.safeParse(entree);
  if (!analyse.success) {
    return toActionResult(
      new AppError(
        "VALIDATION",
        "Certains champs doivent être corrigés.",
        champsEnErreur(analyse.error.issues),
      ),
    );
  }

  const { email, password, suivant } = analyse.data;
  const supabase = await createServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    await writeAuthAuditLog({ actorId: null, action: "auth.login_failed", email });
    return toActionResult(
      new AppError("UNAUTHENTICATED", traduireErreurAuth(error?.message)),
    );
  }

  /*
   * Compte désactivé : la session vient d'être ouverte, il faut la refermer.
   *
   * Sans ce `signOut`, l'utilisateur repartirait avec un cookie valide. Le DAL
   * le renverrait à chaque page, et il tournerait en boucle entre la connexion
   * et le dashboard sans jamais comprendre pourquoi.
   */
  const { data: profil } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profil?.is_active) {
    await supabase.auth.signOut();
    await writeAuthAuditLog({
      actorId: data.user.id,
      action: "auth.login_failed",
      email,
    });
    return toActionResult(
      new AppError(
        "FORBIDDEN",
        "Votre accès a été désactivé. Contactez un administrateur.",
      ),
    );
  }

  await writeAuthAuditLog({ actorId: data.user.id, action: "auth.login", email });

  return { ok: true, data: { suivant: cheminDeRetour(suivant) } };
}

/**
 * Valide le paramètre `?suivant=`.
 *
 * ⚠️  Sans ce filtrage, `/connexion?suivant=https://site-malveillant.example`
 * ferait du formulaire de connexion un tremplin de REDIRECTION OUVERTE : un
 * lien d'apparence légitime, hébergé sur le domaine d'ADEBES, qui expédie
 * l'utilisateur ailleurs juste après qu'il a saisi son mot de passe.
 *
 * Seuls les chemins internes du dashboard sont acceptés. `//evil.example` est
 * rejeté explicitement : c'est une URL protocole-relatif, que le navigateur
 * suit vers l'extérieur bien qu'elle commence par une barre oblique.
 */
function cheminDeRetour(suivant: string | undefined): string {
  if (!suivant) return "/dashboard";
  if (!suivant.startsWith("/") || suivant.startsWith("//")) return "/dashboard";
  if (!suivant.startsWith("/dashboard")) return "/dashboard";
  return suivant;
}

/** Déconnexion. */
export async function signOutAction(): Promise<never> {
  const actor = await getCurrentActor();
  const supabase = await createServerClient();

  await supabase.auth.signOut();

  if (actor) {
    await writeAuthAuditLog({
      actorId: actor.id,
      action: "auth.logout",
      email: actor.email,
    });
  }

  redirect("/connexion");
}

/** Demande de réinitialisation de mot de passe. */
export async function requestPasswordResetAction(
  entree: unknown,
): Promise<ActionResult<null>> {
  const ip = await adresseAppelante();
  const refus = await checkRateLimit({
    key: `${RATE_LIMITS.motDePasseOublie.key}:${ip}`,
    max: RATE_LIMITS.motDePasseOublie.max,
    windowSeconds: RATE_LIMITS.motDePasseOublie.windowSeconds,
  });
  if (refus) return toActionResult(refus);

  const analyse = forgotPasswordSchema.safeParse(entree);
  if (!analyse.success) {
    return toActionResult(
      new AppError("VALIDATION", "Cette adresse e-mail ne semble pas valide.", {
        email: "Adresse invalide.",
      }),
    );
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(analyse.data.email, {
    redirectTo: `${siteUrl}/reinitialiser-mot-de-passe`,
  });

  if (error) {
    console.error("[ADEBES] Envoi du lien de réinitialisation impossible", error);
  }

  /*
   * ⚠️  ON RÉPOND TOUJOURS « ENVOYÉ », même si l'adresse est inconnue ou si
   * l'envoi a échoué.
   *
   * Répondre « aucun compte ne correspond » permettrait à n'importe qui
   * d'énumérer les comptes existants en essayant des adresses. Le message est
   * donc formulé pour rester vrai dans les deux cas.
   */
  return {
    ok: true,
    data: null,
    message:
      "Si un compte existe pour cette adresse, un e-mail contenant un lien de réinitialisation vient d'être envoyé.",
  };
}

/** Définition d'un nouveau mot de passe, depuis le lien reçu par e-mail. */
export async function resetPasswordAction(
  entree: unknown,
): Promise<ActionResult<null>> {
  const analyse = resetPasswordSchema.safeParse(entree);
  if (!analyse.success) {
    return toActionResult(
      new AppError(
        "VALIDATION",
        "Certains champs doivent être corrigés.",
        champsEnErreur(analyse.error.issues),
      ),
    );
  }

  const supabase = await createServerClient();

  // La session de récupération a été ouverte par le lien de l'e-mail. Sans
  // elle, `updateUser` n'a aucun compte à modifier.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return toActionResult(
      new AppError(
        "UNAUTHENTICATED",
        "Ce lien a expiré ou a déjà été utilisé. Demandez-en un nouveau.",
      ),
    );
  }

  const { error } = await supabase.auth.updateUser({ password: analyse.data.password });

  if (error) {
    return toActionResult(new AppError("VALIDATION", traduireErreurAuth(error.message)));
  }

  await writeAuthAuditLog({
    actorId: user.id,
    action: "auth.password_reset",
    email: user.email,
  });

  return { ok: true, data: null, message: "Votre mot de passe a été mis à jour." };
}
