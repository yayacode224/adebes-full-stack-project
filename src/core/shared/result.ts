/**
 * `Result` — le type de retour de tous les cas d'usage.
 *
 * Pourquoi pas des exceptions : une exception qui traverse la frontière
 * serveur/client de Next.js perd son type et, en production, son message —
 * React Server Components remplace le texte par un identifiant de résumé. Une
 * erreur métier qui doit s'afficher à l'utilisateur (« Cette adresse est déjà
 * prise. ») ne peut donc pas voyager en exception.
 *
 * Un `Result` est une valeur ordinaire : il se sérialise, il se teste, et le
 * compilateur oblige à traiter le cas d'échec avant de lire la valeur.
 *
 * Les exceptions restent employées pour ce qui n'est pas une erreur métier :
 * une panne réseau, un bug. Elles remontent alors à la frontière `createAction`
 * qui les transforme en `UNEXPECTED`.
 */

import type { AppError } from "./errors";

export type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

/**
 * Restreint le type à la branche succès.
 *
 * Utile là où TypeScript ne réduit pas seul, typiquement après un `filter`
 * ou dans une expression conditionnelle.
 */
export function isOk<T, E>(
  result: Result<T, E>,
): result is { ok: true; value: T } {
  return result.ok;
}

export function isErr<T, E>(
  result: Result<T, E>,
): result is { ok: false; error: E } {
  return !result.ok;
}

/**
 * Applique une transformation à la valeur d'un succès, laisse l'échec intact.
 *
 * Évite le `if (!r.ok) return r` répété dans les cas d'usage qui se contentent
 * d'adapter la forme du résultat.
 */
export function mapResult<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> {
  return result.ok ? { ok: true, value: fn(result.value) } : result;
}

/**
 * Extrait la valeur ou renvoie un repli.
 *
 * À n'employer que là où l'échec est réellement sans conséquence — une lecture
 * décorative, un compteur d'affichage. Partout ailleurs, l'échec doit être
 * traité explicitement.
 */
export function unwrapOr<T, E>(result: Result<T, E>, repli: T): T {
  return result.ok ? result.value : repli;
}
