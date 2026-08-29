import "server-only";

import { AppError } from "@/core/shared/errors";
import { createAdminClient } from "@/infrastructure/supabase/clients/admin";

/**
 * Limitation de débit.
 *
 * Usage autorisé nº 5 de `createAdminClient` — à ajouter aux quatre listés au
 * §3.1 du Rapport 2. La table `rate_limits` n'a volontairement AUCUNE politique
 * RLS (migration 0009) : un compteur que le client peut lire ou remettre à zéro
 * ne limite rien. Seul `service_role` l'atteint.
 *
 * Le comptage lui-même est fait par `consume_rate_limit()` (migration 0013),
 * atomique par construction.
 */
export async function checkRateLimit(input: {
  key: string;
  max: number;
  windowSeconds: number;
}): Promise<AppError | null> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase.rpc("consume_rate_limit", {
      p_key: input.key,
      p_max: input.max,
      p_window_seconds: input.windowSeconds,
    });

    if (error) {
      // Voir la note « ouvert en cas de panne » ci-dessous.
      console.error("[ADEBES] Limitation de débit indisponible", error);
      return null;
    }

    if (data === false) {
      const minutes = Math.ceil(input.windowSeconds / 60);
      return new AppError(
        "RATE_LIMITED",
        `Trop de tentatives. Patientez ${minutes} minute${minutes > 1 ? "s" : ""} avant de réessayer.`,
      );
    }

    return null;
  } catch (erreur) {
    console.error("[ADEBES] Limitation de débit indisponible", erreur);
    return null;
  }
}

/**
 * ---------------------------------------------------------------------------
 * CHOIX ASSUMÉ : OUVERT EN CAS DE PANNE (« fail open »)
 * ---------------------------------------------------------------------------
 * Si la base est injoignable, cette fonction LAISSE PASSER au lieu de bloquer.
 *
 * C'est un arbitrage, et il mérite d'être explicite. Fermer en cas de panne
 * (« fail closed ») transformerait une latence Supabase en panne totale du
 * site : plus personne ne pourrait envoyer un message de contact ni se
 * connecter. Ouvrir dégrade la protection anti-abus pendant l'incident, mais
 * les barrières qui comptent — session, permission, RLS — restent entières.
 *
 * Autrement dit : la limitation de débit protège du volume, pas de l'accès.
 * Ce n'est jamais elle qui empêche une action interdite.
 *
 * Si un abus réel se produisait pendant une panne, la parade est en amont
 * (pare-feu Vercel), pas ici.
 */

/**
 * Seuils du §16.1, réunis pour qu'ils se relisent d'un coup d'œil plutôt que
 * d'être disséminés dans les appels.
 */
export const RATE_LIMITS = {
  /** Connexion : 5 tentatives par quart d'heure et par IP. */
  connexion: { key: "connexion", max: 5, windowSeconds: 15 * 60 },
  /** Réinitialisation de mot de passe : 3 par heure. */
  motDePasseOublie: { key: "mot-de-passe-oublie", max: 3, windowSeconds: 60 * 60 },
  /** Formulaires publics du site : 5 par heure et par IP. */
  formulairePublic: { key: "formulaire", max: 5, windowSeconds: 60 * 60 },
  /** Téléversement : 30 par heure. */
  televersement: { key: "televersement", max: 30, windowSeconds: 60 * 60 },
} as const;
