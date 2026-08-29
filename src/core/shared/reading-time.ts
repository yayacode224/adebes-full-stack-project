/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  TEMPS DE LECTURE — 200 MOTS / MINUTE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8B du Rapport 2 : « temps de lecture **calculé** (200 mots/min) et
 * modifiable ». Les deux moitiés comptent — la valeur est PROPOSÉE, jamais
 * imposée : un article dense se lit plus lentement qu'un communiqué, et la
 * personne qui l'a écrit le sait mieux qu'une division.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI CETTE FONCTION VIT DANS `core/shared/`
 * ---------------------------------------------------------------------------
 * Elle est appelée des DEUX côtés de la frontière : par le formulaire du
 * dashboard, qui propose la valeur pendant la saisie, et par le cas d'usage de
 * création, qui la calcule quand le formulaire ne l'a pas fournie. Une fonction
 * pure, sans dépendance — même raisonnement que `slugify` et
 * `detectMimeType` (écart nº 47).
 *
 * ---------------------------------------------------------------------------
 * CE QU'ELLE NE FAIT PAS
 * ---------------------------------------------------------------------------
 * Elle ne renvoie jamais `0`. Un article qui compte trois mots se lit en
 * « moins d'une minute », ce que le site écrit « 1 min » — mais `0 min de
 * lecture` affirmerait qu'il n'y a rien à lire. C'est l'invariant nº 1
 * appliqué à un chiffre calculé : une valeur invraisemblable est pire que pas
 * de valeur, et l'absence a d'ailleurs sa propre représentation (`null`).
 */

/** Vitesse de lecture retenue par le §8B. */
export const MOTS_PAR_MINUTE = 200;

/**
 * Compte les mots d'un ensemble de paragraphes.
 *
 * Un « mot » est une suite de caractères non blancs : c'est l'approximation
 * usuelle, et elle vaut pour le français comme pour l'anglais. Les paragraphes
 * vides ne comptent pas.
 */
export function compterMots(paragraphes: readonly string[]): number {
  return paragraphes.reduce((total, paragraphe) => {
    const mots = paragraphe.trim().split(/\s+/).filter(Boolean);
    return total + mots.length;
  }, 0);
}

/**
 * Le temps de lecture estimé, en minutes entières.
 *
 * `null` quand il n'y a rien à lire : un corps vide n'a pas de temps de
 * lecture, et « 1 min » sur un article sans texte serait un chiffre inventé.
 */
export function tempsDeLecture(paragraphes: readonly string[]): number | null {
  const mots = compterMots(paragraphes);
  if (mots === 0) return null;

  // Arrondi au supérieur, plancher à 1 : voir l'en-tête.
  return Math.max(1, Math.ceil(mots / MOTS_PAR_MINUTE));
}
