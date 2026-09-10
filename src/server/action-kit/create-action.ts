import "server-only";

import { updateTag } from "next/cache";
import type { z } from "zod";

import type { Permission } from "@/core/rbac/permissions";
import { can } from "@/core/rbac/policy";
import type { Actor } from "@/core/rbac/roles";
import { AppError, toAppError } from "@/core/shared/errors";
import type { Result } from "@/core/shared/result";
import type { Json } from "@/infrastructure/supabase/database.types";

import { getCurrentActor } from "../dal/session";
import { actionOk, toActionResult, type ActionResult } from "./action-result";
import { writeAuditLog } from "./audit";
import { checkRateLimit } from "./rate-limit";
import { adresseAppelante } from "./request-context";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  createAction — LE DÉCORATEUR OBLIGATOIRE DE TOUTE MUTATION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️  AUCUNE Server Action de ce projet ne s'écrit en dehors de cette fonction.
 *
 * POURQUOI CE N'EST PAS NÉGOCIABLE (décision D3)
 *
 * Une Server Action est une FRONTIÈRE PUBLIQUE NON AUTHENTIFIÉE PAR DÉFAUT.
 * Next.js lui attribue un identifiant et l'expose : elle est joignable par une
 * requête POST directe, sans jamais passer par le formulaire, sans JavaScript,
 * depuis n'importe où. Écrire `export async function supprimerProgramme(id)`
 * sans garde revient à publier une API de suppression ouverte.
 *
 * Ce décorateur impose, dans cet ordre et sans exception possible :
 *
 *   1. limitation de débit   → RATE_LIMITED
 *   2. session vérifiée      → UNAUTHENTICATED   (si permission ≠ null)
 *   3. permission            → FORBIDDEN
 *   4. validation de l'entrée→ VALIDATION + fieldErrors
 *   5. exécution du handler  → Result<T, AppError>
 *   6. journal d'audit       → si succès et audit configuré
 *   7. invalidation de cache → updateTag(...)
 *   8. ActionResult<T> sérialisable
 *
 * L'ordre compte. Valider avant d'authentifier révélerait la forme attendue
 * des données à un appelant non identifié ; journaliser avant d'exécuter
 * inscrirait des actions qui ont échoué.
 */
export function createAction<TInput extends z.ZodType, TOutput>(config: {
  /**
   * Permission exigée.
   *
   * `null` signifie « action volontairement publique » — les formulaires de
   * contact et de bénévolat du site. Ce n'est pas un raccourci pour « je
   * verrai plus tard » : une action publique DOIT porter une `rateLimit`.
   *
   * ---------------------------------------------------------------------------
   * UNE FONCTION QUAND LA PERMISSION DÉPEND DE L'ENTRÉE (§12.1 du Rapport 2)
   * ---------------------------------------------------------------------------
   * Le changement d'état éditorial est le seul cas : `draft → in_review` est
   * ouvert à l'éditeur (`<resource>:update`), toute autre transition exige
   * `<resource>:publish`. La fonction reçoit l'entrée BRUTE — non encore
   * validée, l'étape de permission précédant celle de validation. Elle doit
   * donc être défensive et, au moindre doute, exiger la permission la plus
   * forte : un appelant qui triche sur la forme se verra de toute façon
   * refuser à l'étape 4.
   */
  permission: Permission | null | ((entree: unknown) => Permission | null);

  /** Schéma de validation. Rejoué côté serveur, jamais délégué au client. */
  input: TInput;

  /** Étiquettes de cache à invalider après succès. */
  invalidates?: (result: TOutput, input: z.infer<TInput>) => string[];

  /** Écriture au journal d'audit. */
  audit?: {
    action: string;
    entityType: string;
    entityId?: (result: TOutput) => string | undefined;
    /**
     * Différentiel des champs modifiés, affiché replié dans l'écran Journal
     * (§13.3 du Rapport 2).
     *
     * Par défaut, l'entrée VALIDÉE de l'action est enregistrée telle quelle :
     * pour la quasi-totalité des mutations, la charge utile EST la liste des
     * champs changés et leur nouvelle valeur. Une action ne fournit ce
     * résolveur que si elle veut un différentiel plus parlant — typiquement
     * `{ de, vers }` pour un changement de rôle, que l'entrée seule ne dit pas.
     *
     * Le résultat est aplati en JSON sérialisable avant écriture : une `Date`,
     * une fonction ou un `File` qui s'y glisserait ne casse pas l'insertion.
     */
    diff?: (result: TOutput, input: z.infer<TInput>) => unknown;
  };

  /** Limitation de débit — obligatoire en pratique si `permission` est `null`. */
  rateLimit?: { max: number; windowSeconds: number; key?: string };

  handler: (ctx: {
    input: z.infer<TInput>;
    actor: Actor | null;
  }) => Promise<Result<TOutput, AppError>>;
}): (input: unknown) => Promise<ActionResult<TOutput>> {
  return async function executer(entree: unknown): Promise<ActionResult<TOutput>> {
    try {
      // ---------------------------------------------------------------- 1 ---
      // Limitation de débit, AVANT toute autre chose : une attaque par force
      // brute ne doit pas pouvoir déclencher une requête base par tentative.
      if (config.rateLimit) {
        const ip = await adresseAppelante();
        const refus = await checkRateLimit({
          key: `${config.rateLimit.key ?? "action"}:${ip}`,
          max: config.rateLimit.max,
          windowSeconds: config.rateLimit.windowSeconds,
        });
        if (refus) return toActionResult(refus);
      }

      // La permission peut dépendre de l'entrée (changement d'état éditorial) :
      // on la résout AVANT la vérification de session, à partir de la charge
      // utile brute.
      const permissionRequise =
        typeof config.permission === "function"
          ? config.permission(entree)
          : config.permission;

      // ---------------------------------------------------------------- 2 ---
      // Session. `getCurrentActor` est mémoïsé : cet appel ne coûte rien si la
      // page a déjà identifié l'utilisateur.
      const actor = await getCurrentActor();

      if (permissionRequise !== null && !actor) {
        return toActionResult(
          new AppError(
            "UNAUTHENTICATED",
            "Votre session a expiré. Reconnectez-vous pour continuer.",
          ),
        );
      }

      // ---------------------------------------------------------------- 3 ---
      // Permission. Jamais un test de rôle (décision D6).
      if (permissionRequise !== null && !can(actor, permissionRequise)) {
        return toActionResult(
          new AppError(
            "FORBIDDEN",
            "Vous n'avez pas les droits nécessaires pour cette action.",
          ),
        );
      }

      // ---------------------------------------------------------------- 4 ---
      // Validation. `safeParse` et non `parse` : une entrée invalide est un cas
      // courant, pas une panne.
      const analyse = config.input.safeParse(entree);
      if (!analyse.success) {
        return toActionResult(
          new AppError(
            "VALIDATION",
            "Certains champs doivent être corrigés.",
            champsEnErreur(analyse.error),
          ),
        );
      }
      const donnees = analyse.data as z.infer<TInput>;

      // ---------------------------------------------------------------- 5 ---
      const resultat = await config.handler({ input: donnees, actor });
      if (!resultat.ok) return toActionResult(resultat.error);

      // ---------------------------------------------------------------- 6 ---
      // Audit après succès seulement. Un échec n'a pas modifié l'état.
      //
      // L'écriture du journal ne doit JAMAIS faire échouer l'action : la
      // mutation est déjà committée en base, renvoyer une erreur ferait croire
      // à l'utilisateur qu'elle n'a pas eu lieu.
      if (config.audit && actor) {
        try {
          const brut = config.audit.diff
            ? config.audit.diff(resultat.value, donnees)
            : donnees;

          await writeAuditLog({
            actorId: actor.id,
            action: config.audit.action,
            entityType: config.audit.entityType,
            entityId: config.audit.entityId?.(resultat.value),
            diff: enJsonSur(brut),
          });
        } catch (erreur) {
          console.error("[ADEBES] Écriture du journal d'audit impossible", erreur);
        }
      }

      // ---------------------------------------------------------------- 7 ---
      // Invalidation. `updateTag` — et non `revalidateTag` — parce qu'on est
      // dans une Server Action : il expire immédiatement et la requête
      // suivante attend la donnée fraîche. L'éditeur voit son changement tout
      // de suite, ce qui est la sémantique voulue pour un CMS.
      //
      // (En Route Handler, `updateTag` n'est pas disponible : il faut
      // `revalidateTag(tag, 'max')`, le second argument étant obligatoire en
      // Next.js 16.)
      if (config.invalidates) {
        for (const etiquette of config.invalidates(resultat.value, donnees)) {
          updateTag(etiquette);
        }
      }

      // ---------------------------------------------------------------- 8 ---
      return actionOk(resultat.value);
    } catch (erreur) {
      // Filet de sécurité : une exception inattendue ne doit jamais remonter
      // telle quelle au client — son message peut contenir du détail technique,
      // et React la remplacerait de toute façon par un identifiant opaque en
      // production.
      const appError = toAppError(erreur);
      if (appError.code === "UNEXPECTED") {
        console.error("[ADEBES] Erreur inattendue dans une Server Action", erreur);
      }
      return toActionResult(appError);
    }
  };
}

/**
 * Aplatit une valeur quelconque en JSON sérialisable, pour la colonne `diff`
 * (JSONB) du journal d'audit.
 *
 * `JSON.stringify` puis `JSON.parse` élimine ce qui ne survit pas à la
 * sérialisation (`Date`, fonction, `File`, référence circulaire) : le journal
 * ne doit jamais faire échouer une mutation déjà committée. En dernier
 * recours, `null` — une entrée sans différentiel vaut mieux qu'une action
 * refusée.
 */
function enJsonSur(valeur: unknown): Json {
  try {
    return JSON.parse(JSON.stringify(valeur ?? null));
  } catch {
    return null;
  }
}

/**
 * Aplatit les erreurs Zod en `{ champ: message }`.
 *
 * Seule la PREMIÈRE erreur par champ est conservée : afficher trois messages
 * sous un même champ n'aide personne, et l'utilisateur corrige de toute façon
 * une chose à la fois.
 *
 * Les chemins imbriqués sont joints par des points (`geo.latitude`), ce qui
 * correspond à la notation attendue par `react-hook-form`.
 */
function champsEnErreur(error: z.ZodError): Record<string, string> {
  const champs: Record<string, string> = {};
  for (const probleme of error.issues) {
    const chemin = probleme.path.join(".");
    if (chemin && !champs[chemin]) {
      champs[chemin] = probleme.message;
    }
  }
  return champs;
}
