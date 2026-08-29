import type { AppError, ErrorCode } from "@/core/shared/errors";

/**
 * Résultat d'une Server Action, tel que le client le reçoit.
 *
 * Prolonge le `FormResult` déjà présent dans `src/app/actions/forms.ts` —
 * même esprit, forme généralisée avec une donnée typée.
 *
 * ⚠️  Ce type doit rester SÉRIALISABLE. Une Server Action traverse la
 * frontière serveur → client : une instance de classe, une `Date`, une
 * fonction ou une `Error` n'y survivent pas. `AppError` est donc converti en
 * objet plat avant d'être renvoyé, et c'est le rôle de `toActionResult`.
 */
export type ActionResult<T> =
  | { ok: true; data: T; message?: string }
  | {
      ok: false;
      code: ErrorCode;
      message: string;
      fieldErrors?: Record<string, string>;
    };

export function actionOk<T>(data: T, message?: string): ActionResult<T> {
  return { ok: true, data, message };
}

/**
 * Convertit une `AppError` en résultat sérialisable.
 *
 * `cause` n'est délibérément PAS transmise : elle contient l'erreur technique
 * d'origine — requête SQL, nom de contrainte, parfois des valeurs. Elle a sa
 * place dans le journal du serveur, jamais dans la réponse envoyée au
 * navigateur.
 */
export function toActionResult(error: AppError): ActionResult<never> {
  return {
    ok: false,
    code: error.code,
    message: error.message,
    fieldErrors: error.fieldErrors,
  };
}
