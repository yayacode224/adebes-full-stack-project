import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import type { Permission } from "@/core/rbac/permissions";
import { can } from "@/core/rbac/policy";
import { isUserRole, type Actor } from "@/core/rbac/roles";
import { createServerClient } from "@/infrastructure/supabase/clients/server";

/**
 * Data Access Layer — la DEUXIÈME barrière du §9 du Rapport 1.
 *
 * C'est ici que se prend la vraie décision d'autorisation. `proxy.ts` (barrière
 * 1) ne fait que rediriger vite sur la foi d'un cookie ; les politiques RLS
 * (barrière 3) protègent la base. Entre les deux, ce fichier est la garde
 * applicative, et la seule qui puisse afficher un message compréhensible.
 */

/**
 * L'utilisateur courant, ou `null`.
 *
 * ---------------------------------------------------------------------------
 * `auth.getUser()` ET NON `auth.getSession()`
 * ---------------------------------------------------------------------------
 * `getSession()` lit le cookie et en décode le contenu SANS le faire valider
 * par le serveur d'authentification. Un cookie forgé ou périmé passerait.
 * Pour une décision d'autorisation, seul `getUser()` fait foi : il vérifie le
 * jeton auprès de Supabase.
 *
 * ---------------------------------------------------------------------------
 * `cache()` de React
 * ---------------------------------------------------------------------------
 * Mémoïse sur la durée d'UN rendu. Le layout du dashboard, la barre latérale,
 * la barre supérieure et chaque page appellent tous cette fonction : sans
 * mémoïsation, une seule page produirait cinq allers-retours réseau
 * identiques. Le cache ne franchit pas la frontière d'une requête — deux
 * visiteurs ne partagent jamais un acteur.
 *
 * ---------------------------------------------------------------------------
 * `is_active` relu EN BASE à chaque rendu
 * ---------------------------------------------------------------------------
 * Le jeton de session reste valide plusieurs minutes après une désactivation.
 * Relire le profil est ce qui rend la désactivation effective à la requête
 * suivante, comme l'exige le §13.2 du Rapport 2 — plutôt que d'attendre
 * l'expiration du jeton.
 */
/**
 * Pourquoi il n'y a pas d'acteur.
 *
 * La distinction compte : « pas de session » et « compte désactivé » appellent
 * deux messages différents. Renvoyer les deux vers un écran de connexion muet
 * laisserait un utilisateur désactivé ressaisir son mot de passe indéfiniment
 * sans jamais comprendre que le problème n'est pas là.
 */
type ResolutionActeur =
  | { actor: Actor; raison: null }
  | { actor: null; raison: "aucune-session" | "compte-desactive" };

const resolveActor = cache(async (): Promise<ResolutionActeur> => {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { actor: null, raison: "aucune-session" };

  const { data: profil } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_active, avatar_media_id")
    .eq("id", user.id)
    .maybeSingle();

  // Pas de profil : le compte existe dans `auth.users` sans ligne dans
  // `profiles`. Le trigger `handle_new_user` rend le cas très improbable, mais
  // le traiter comme « non connecté » vaut mieux que de fabriquer un acteur
  // sans rôle.
  if (!profil) return { actor: null, raison: "aucune-session" };

  if (!profil.is_active) return { actor: null, raison: "compte-desactive" };

  // Le rôle vient de la base, mais il traverse une frontière non typée
  // (PostgREST). On le valide plutôt que de le forcer.
  if (!isUserRole(profil.role)) return { actor: null, raison: "aucune-session" };

  return {
    actor: {
      id: profil.id,
      email: profil.email,
      fullName: profil.full_name,
      role: profil.role,
      isActive: profil.is_active,
      avatarMediaId: profil.avatar_media_id,
    },
    raison: null,
  };
});

export const getCurrentActor = cache(async (): Promise<Actor | null> => {
  return (await resolveActor()).actor;
});

/**
 * Exige une session, sinon redirige vers la connexion.
 *
 * À utiliser dans les layouts et pages du dashboard. Le chemin courant est
 * transmis en `?suivant=` pour ramener l'utilisateur là où il allait après
 * s'être connecté — perdre sa destination à chaque expiration de session est
 * une des petites frictions qui font abandonner un back-office.
 */
export async function requireActor(suivant?: string): Promise<Actor> {
  const { actor, raison } = await resolveActor();
  if (actor) return actor;

  const parametres = new URLSearchParams();

  if (raison === "compte-desactive") {
    // Le compte existe et la session est valide, mais l'accès a été retiré.
    // Proposer `?suivant=` n'aurait aucun sens : se reconnecter ne changera
    // rien. On affiche le motif à la place.
    parametres.set("erreur", "compte-desactive");
  } else if (suivant) {
    parametres.set("suivant", suivant);
  }

  const requete = parametres.toString();
  redirect(`/connexion${requete ? `?${requete}` : ""}`);
}

/**
 * Exige une permission précise.
 *
 * ⚠️  Ne teste jamais le rôle (décision D6) : `can()` consulte la matrice, qui
 * est le seul endroit où la politique est écrite.
 *
 * La redirection porte un motif dans l'URL pour que le dashboard affiche un
 * message explicite. Renvoyer silencieusement à l'accueil laisserait
 * l'utilisateur croire à un bug.
 */
export async function requirePermission(permission: Permission): Promise<Actor> {
  const actor = await requireActor();
  if (!can(actor, permission)) {
    redirect("/dashboard?erreur=droits-insuffisants");
  }
  return actor;
}
