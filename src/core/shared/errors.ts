/**
 * Erreurs métier typées.
 *
 * ⚠️  RÈGLE DE CE FICHIER — le `message` d'une `AppError` est destiné à être
 * AFFICHÉ TEL QUEL à un utilisateur non technique, en français, sans jargon.
 *
 *   ✅ « Cette adresse est déjà utilisée par un autre programme. »
 *   ❌ « unique constraint violation on programmes_slug_key »
 *
 * Le détail technique va dans `cause`, qui n'est jamais affiché mais reste
 * disponible pour le journal.
 */

export type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "STORAGE"
  | "UNEXPECTED";

export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    /** Message affichable à un utilisateur non technique, en français. */
    message: string,
    /**
     * Erreurs rattachées à un champ précis du formulaire. La clé est le nom du
     * champ tel que `react-hook-form` le connaît, ce qui permet à l'interface
     * de placer le message sous le bon champ plutôt qu'en tête de formulaire.
     */
    readonly fieldErrors?: Record<string, string>,
    /** Cause technique — journalisée, jamais affichée. */
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Fabriques nommées.
 *
 * Elles portent un message par défaut correct, ce qui évite que chaque appelant
 * réinvente sa formulation — et qu'on se retrouve avec quinze façons de dire
 * « vous n'avez pas les droits ».
 */
export const errors = {
  unauthenticated: (message = "Vous devez être connecté pour effectuer cette action.") =>
    new AppError("UNAUTHENTICATED", message),

  forbidden: (message = "Vous n'avez pas les droits nécessaires pour cette action.") =>
    new AppError("FORBIDDEN", message),

  notFound: (message = "Cet élément n'existe plus.") =>
    new AppError("NOT_FOUND", message),

  validation: (message: string, fieldErrors?: Record<string, string>) =>
    new AppError("VALIDATION", message, fieldErrors),

  conflict: (message: string, fieldErrors?: Record<string, string>) =>
    new AppError("CONFLICT", message, fieldErrors),

  rateLimited: (
    message = "Trop de tentatives. Patientez quelques minutes avant de réessayer.",
  ) => new AppError("RATE_LIMITED", message),

  storage: (message = "Le fichier n'a pas pu être enregistré.", cause?: unknown) =>
    new AppError("STORAGE", message, undefined, cause),

  unexpected: (
    message = "Une erreur technique est survenue. Réessayez dans un instant.",
    cause?: unknown,
  ) => new AppError("UNEXPECTED", message, undefined, cause),
} as const;

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}

/**
 * Ramène n'importe quoi à une `AppError`.
 *
 * Sert de filet à la frontière (`createAction`) : une exception inattendue ne
 * doit jamais fuiter son message technique vers l'interface, mais elle ne doit
 * pas non plus faire disparaître l'information — d'où la conservation en
 * `cause`.
 */
export function toAppError(value: unknown): AppError {
  if (isAppError(value)) return value;
  return errors.unexpected(undefined, value);
}
