import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  proxy.ts — PREMIÈRE BARRIÈRE, PUREMENT OPTIMISTE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️  NEXT.JS 16 : le fichier s'appelle `proxy.ts` et la fonction `proxy`.
 * Ce n'est plus `middleware.ts` / `middleware()`. Le runtime est Node.js et
 * n'est pas configurable — `edge` n'est pas supporté.
 *
 * ---------------------------------------------------------------------------
 * CE FICHIER NE SÉCURISE RIEN
 * ---------------------------------------------------------------------------
 * Il rend le site agréable : il évite d'afficher le squelette du dashboard à
 * quelqu'un qui va de toute façon être renvoyé vers la connexion. C'est du
 * confort, pas de la sécurité.
 *
 * La vraie garde applicative est le DAL (`src/server/dal/session.ts`), qui
 * relit le rôle EN BASE. La dernière est la RLS. Quiconque contourne ce
 * fichier ne gagne rien : il tombe sur les deux suivantes.
 *
 * ---------------------------------------------------------------------------
 * AUCUNE REQUÊTE BASE ICI. JAMAIS.
 * ---------------------------------------------------------------------------
 * `proxy` s'exécute sur CHAQUE requête, y compris les préchargements de
 * navigation que Next.js déclenche au survol d'un lien. Une requête SQL à cet
 * endroit multiplierait la charge par le nombre de liens survolés et
 * ralentirait tout le site.
 *
 * `supabase.auth.getUser()` ci-dessous ne touche pas notre base : il valide le
 * jeton auprès du service d'authentification, ce que le rafraîchissement de
 * session impose de toute façon.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  // Sans configuration Supabase, le site public doit continuer de fonctionner :
  // seul le dashboard est concerné. Échouer ici casserait les 29 routes
  // publiques pour une variable d'environnement manquante.
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        // Les cookies rafraîchis sont écrits sur la requête ET sur la réponse :
        // sur la requête pour que le rendu qui suit voie la session à jour,
        // sur la réponse pour que le navigateur la conserve.
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  /*
   * Rafraîchissement de la session — INDISPENSABLE.
   *
   * Un Server Component ne peut pas écrire de cookie : le `catch` vide de
   * `clients/server.ts` avale silencieusement la tentative. Sans cet appel
   * ici, le jeton d'accès expirerait au bout d'une heure et l'utilisateur
   * serait déconnecté en pleine saisie.
   *
   * `getUser()` et non `getSession()` : seul le premier valide réellement le
   * jeton.
   */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const chemin = request.nextUrl.pathname;
  const versDashboard = chemin === "/dashboard" || chemin.startsWith("/dashboard/");
  const versConnexion = chemin === "/connexion";

  // Dashboard sans session → connexion, en conservant la destination.
  if (versDashboard && !user) {
    const cible = request.nextUrl.clone();
    cible.pathname = "/connexion";
    cible.search = "";
    cible.searchParams.set("suivant", chemin + request.nextUrl.search);
    return NextResponse.redirect(cible);
  }

  // Déjà connecté sur l'écran de connexion → dashboard.
  //
  // On ne vérifie ici NI le rôle NI `is_active` : les deux exigeraient une
  // requête base. Un compte désactivé sera renvoyé par le DAL, avec le message
  // qui convient.
  if (versConnexion && user) {
    const cible = request.nextUrl.clone();
    cible.pathname = "/dashboard";
    cible.search = "";
    return NextResponse.redirect(cible);
  }

  return response;
}

export const config = {
  /*
   * Exclut les ressources statiques et les fichiers servis tels quels.
   *
   * Faire tourner l'authentification sur chaque image ou PDF n'apporterait
   * rien et ajouterait une latence à chaque élément d'une page.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|documents|.*\\.(?:svg|png|jpg|jpeg|webp|avif|gif|pdf|ico|txt|xml|webmanifest)$).*)",
  ],
};
