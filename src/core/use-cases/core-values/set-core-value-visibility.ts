import type { CoreValue } from "../../cms/entities/core-value";
import type { CoreValueDeps } from "../../cms/ports/core-value.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  AFFICHER OU RETIRER UNE VALEUR DU SITE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * L'équivalent de `setProgrammeStatus` / `setTeamMemberStatus` pour une
 * collection sans cycle éditorial. Deux états, pas quatre.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  CE CAS D'USAGE N'EST PAS PROTÉGÉ PAR `value:publish` — IL N'EXISTE PAS
 * ---------------------------------------------------------------------------
 * La matrice (§9 du Rapport 1, `core/rbac/permissions.ts`) ne contient aucune
 * entrée `value:publish`, pour aucun rôle. La Server Action correspondante
 * exige donc `value:update`, que l'éditeur possède.
 *
 * **Un éditeur peut donc retirer une valeur de deux pages publiques, alors
 * qu'il ne peut dépublier aucun programme, aucun article et aucune fiche
 * d'équipe.** Ce n'est pas un oubli de ma part : c'est ce que disent la matrice
 * ET la RLS (`core_values_staff_update`, migration 0009), indépendamment l'une
 * de l'autre, et le trigger `guard_publish` ne couvre pas cette table faute de
 * colonne `status`.
 *
 * Le raisonnement derrière est défendable — une liste structurante se corrige,
 * elle ne se soumet pas à relecture — mais l'écart de pouvoir mérite d'être
 * écrit noir sur blanc plutôt que découvert. Il est consigné dans le fichier de
 * reprise. **Le corriger serait une décision de produit, pas une correction de
 * défaut**, et elle toucherait la matrice ET une migration : hors périmètre
 * d'un lot de collection.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  MASQUER LA DERNIÈRE VALEUR VISIBLE EST **AUTORISÉ** — POURQUOI
 * ---------------------------------------------------------------------------
 * C'est la question de ce lot, et elle mérite mieux qu'un réflexe.
 *
 * Les faits : la section « Nos valeurs » est lue par DEUX pages — l'accueil et
 * « Qui sommes-nous ». Masquer la dernière valeur visible la fait disparaître
 * des deux d'un seul geste, depuis un écran qui, lui, affiche toujours ses
 * quatre lignes. C'est exactement la confusion que le Lot 8D a nommée : croire
 * que le tableau montre ce que le site montre.
 *
 * La tentation était donc de REFUSER, comme `setTeamMemberStatus` refuse de
 * publier un marqueur. Trois raisons de ne pas le faire :
 *
 *   1. **Ce ne serait pas la même règle.** Au Lot 8D, l'état interdit était
 *      FAUX : « [À COMPLÉTER] » affiché comme un nom est un mensonge sur la
 *      page. Ici, l'état est seulement VIDE — et une section vide qui disparaît
 *      est le comportement établi du site depuis le Lot 8B (actualités,
 *      témoignages, équipe). Interdire le vide sur cette collection et pas sur
 *      les autres serait une incohérence, pas une protection.
 *   2. **Ce serait inventer une contrainte que ni la base ni le métier ne
 *      portent.** Aucune migration n'exige au moins une valeur visible. Le
 *      §8E du Rapport 2 dit « 4 par défaut », pas « 4 au minimum ». Le projet
 *      a déjà refusé ce raccourci pour les homonymes au Lot 8D.
 *   3. **Le geste est trivialement réversible**, contrairement à une
 *      suppression : il suffit de réafficher. Bloquer un aller-retour sans
 *      perte, c'est traiter la personne qui administre le site comme une
 *      menace.
 *
 * Ce qui est fait à la place, et qui répond au vrai risque — ne pas savoir :
 *
 *   * l'écran de liste porte un bandeau qui dit ce que **les deux pages**
 *     affichent, pas ce que le tableau contient ;
 *   * la confirmation de masquage nomme la conséquence quand c'est la
 *     dernière ;
 *   * la fiche l'écrit avant que le bouton ne soit cliqué.
 *
 * Signaler plutôt que masquer, et informer plutôt qu'interdire. C'est la même
 * ligne que depuis le Lot 8B.
 */
export async function setCoreValueVisibility(
  deps: CoreValueDeps,
  input: { id: string; isVisible: boolean },
): Promise<Result<CoreValue>> {
  const existante = await deps.read.findById(input.id);
  if (!existante) {
    return err(new AppError("NOT_FOUND", "Cette valeur n'existe plus."));
  }

  /*
    Idempotence explicite : réafficher une valeur déjà affichée n'écrit rien.

    Sans ce court-circuit, l'action passerait quand même — la base accepte
    parfaitement d'écrire `true` sur `true` — mais elle produirait une entrée
    d'audit décrivant un changement qui n'a pas eu lieu, et déplacerait
    `updated_at`. Le journal doit raconter ce qui s'est passé, pas ce qu'on a
    cliqué. Le cas est courant : deux onglets ouverts, ou une action groupée
    appliquée à une sélection déjà dans l'état voulu.
  */
  if (existante.isVisible === input.isVisible) {
    return ok(existante);
  }

  return ok(await deps.write.setVisibility(existante.id, input.isVisible));
}
