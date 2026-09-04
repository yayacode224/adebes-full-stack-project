import type { PostgrestError } from "@supabase/supabase-js";

import { AppError } from "@/core/shared/errors";

/**
 * Traduction des erreurs PostgreSQL en erreurs métier affichables.
 *
 * Aucun message technique ne doit atteindre l'utilisateur : « duplicate key
 * value violates unique constraint "programmes_slug_key" » ne veut rien dire
 * pour la personne qui vient de saisir un programme.
 */

/**
 * SQLSTATE personnalisés de nos triggers (migration 0010).
 *
 * ⚠️  Vérifié en conditions réelles au Lot 1 : PostgREST remonte ces erreurs en
 * HTTP 400 avec `code` et `message` INTACTS. Exemple observé :
 *
 *   {"code":"ADB01","message":"Seuls un administrateur ou un super
 *    administrateur peuvent publier."}
 *
 * Ces messages sont déjà rédigés pour un utilisateur final, en français. Ils
 * sont donc transmis TELS QUELS, sans passer par la table de correspondance
 * générique — c'est le contrat écrit en tête de la migration 0010.
 */
const GUARD_CODES: Record<string, "FORBIDDEN" | "CONFLICT" | "NOT_FOUND"> = {
  ADB01: "FORBIDDEN", // publication refusée à un éditeur       (migration 0010)
  ADB02: "CONFLICT", //  dernier super administrateur actif      (migration 0010)
  ADB03: "CONFLICT", //  page système non supprimable            (migration 0010)
  ADB04: "FORBIDDEN", // table non autorisée au réordonnancement (migration 0012)
  ADB05: "FORBIDDEN", // droits insuffisants pour réordonner     (migration 0012)
  ADB06: "FORBIDDEN", // ajout de section refusé à un éditeur    (migration 0014)
  ADB07: "NOT_FOUND", // page absente à l'insertion de section   (migration 0014)
};

/**
 * Adjectif démonstratif correct devant un nom.
 *
 * « cet programme » est une faute que la recette du Lot 3 a fait apparaître
 * dans un message affiché à l'utilisateur. Composer une phrase française par
 * concaténation exige de choisir entre « ce » et « cet » selon l'initiale du
 * nom : voyelle ou h muet → « cet » (cet article, cet utilisateur), consonne →
 * « ce » (ce programme, ce média).
 *
 * Les noms de ce projet sont connus et sans h aspiré, l'heuristique sur la
 * première lettre suffit donc.
 */
function ce(nom: string): string {
  return /^[aeiouyéèêàâîïôöûü]/i.test(nom) ? `cet ${nom}` : `ce ${nom}`;
}

/** Capitalise l'initiale, pour un groupe placé en tête de phrase. */
function majuscule(texte: string): string {
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

export function mapPostgrestError(
  error: PostgrestError,
  contexte?: { ressource?: string },
): AppError {
  const quoi = contexte?.ressource ?? "élément";

  // 1. Nos propres gardes : le message de la base fait autorité.
  const garde = GUARD_CODES[error.code];
  if (garde) {
    return new AppError(garde, error.message, undefined, error);
  }

  // 2. Codes PostgreSQL et PostgREST standard (§3.3 du Rapport 2).
  switch (error.code) {
    case "23505": // unique_violation
      return new AppError(
        "CONFLICT",
        "Cette adresse est déjà utilisée.",
        { slug: "Cette adresse est déjà prise." },
        error,
      );

    case "23503": // foreign_key_violation
      return new AppError(
        "CONFLICT",
        `${majuscule(ce(quoi))} est utilisé ailleurs et ne peut pas être supprimé.`,
        undefined,
        error,
      );

    case "23502": // not_null_violation
      return new AppError(
        "VALIDATION",
        "Un champ obligatoire n'a pas été renseigné.",
        undefined,
        error,
      );

    case "23514": // check_violation
      return new AppError(
        "VALIDATION",
        "Une des valeurs saisies n'est pas autorisée.",
        undefined,
        error,
      );

    case "42501": // insufficient_privilege — refus RLS explicite
      return new AppError(
        "FORBIDDEN",
        "Vous n'avez pas les droits nécessaires.",
        undefined,
        error,
      );

    case "PGRST116": // aucune ligne alors qu'une seule était attendue
      return new AppError("NOT_FOUND", `${majuscule(ce(quoi))} n'existe plus.`, undefined, error);

    default:
      return new AppError(
        "UNEXPECTED",
        "Une erreur technique est survenue. Réessayez dans un instant.",
        undefined,
        error,
      );
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LE PIÈGE DE L'ÉCRITURE SILENCIEUSEMENT REFUSÉE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Découvert en conditions réelles au Lot 1, et ABSENT du §3.3 du Rapport 2.
 *
 * La RLS ne REJETTE pas une écriture non autorisée : elle la FILTRE. Mesuré
 * avec un compte éditeur sur la base réelle :
 *
 *   DELETE d'un programme par un éditeur  →  HTTP 204, 0 ligne supprimée
 *   PATCH des réglages par un éditeur     →  HTTP 204, aucun effet
 *
 * Aucune erreur n'est levée. Un repository qui se fierait au code HTTP
 * conclurait « suppression réussie », l'interface afficherait « Programme
 * supprimé » — et le programme serait toujours là au rechargement.
 *
 * La parade : toute écriture demande `.select()` (soit `Prefer:
 * return=representation`) et VÉRIFIE LES LIGNES RENVOYÉES. Zéro ligne signifie
 * « refusé ou introuvable », jamais « réussi ».
 *
 * C'est la raison d'être des deux fonctions ci-dessous. Aucune écriture de ce
 * dossier ne doit s'en passer.
 */

/** Écriture censée renvoyer exactement une ligne. */
export function requireOneRow<T>(
  lignes: T[] | null,
  contexte: { ressource: string; action: "modifier" | "supprimer" | "créer" },
): AppError | null {
  if (lignes && lignes.length > 0) return null;

  return new AppError(
    "FORBIDDEN",
    `Impossible de ${contexte.action} ${ce(contexte.ressource)} : soit il n'existe plus, ` +
      `soit vous n'avez pas les droits nécessaires.`,
  );
}

/** Suppression : mêmes règles, message adapté. */
export function requireDeleted<T>(
  lignes: T[] | null,
  ressource: string,
): AppError | null {
  return requireOneRow(lignes, { ressource, action: "supprimer" });
}
