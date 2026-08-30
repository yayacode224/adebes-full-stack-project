/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LA VISIBILITÉ — le pendant binaire du statut éditorial
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * `content-status.ts` décrit un cycle à quatre états, pour les collections qui
 * se rédigent, se relisent et se publient. Deux tables n'en ont pas et portent
 * un simple booléen `is_visible` : `core_values` (Lot 8E) et `stats`
 * (Lot 8G) — les deux « listes structurantes » du §9 du Rapport 1.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI CES LIBELLÉS VIVENT DANS LE DOMAINE
 * ---------------------------------------------------------------------------
 * Même raison que pour `CONTENT_STATUS_LABELS` : le domaine possède le
 * vocabulaire, la présentation l'affiche. Renommer « Sur le site » se fait à un
 * seul endroit, et le dashboard suit partout.
 *
 * ⚠️  Ce fichier est écrit au Lot 8E avec le Lot 8G en vue. Ce n'est pas de
 * l'anticipation gratuite : `stats` porte la MÊME colonne, avec la MÊME
 * sémantique et la même absence de `value:publish` / `stat:publish` dans la
 * matrice. Laisser le Lot 8G recopier deux chaînes aurait garanti qu'un jour
 * l'un dise « Masquée » et l'autre « Cachée ».
 *
 * ---------------------------------------------------------------------------
 * ⚠️  « MASQUÉE » N'EST PAS « BROUILLON »
 * ---------------------------------------------------------------------------
 * La distinction est le cœur du Lot 8E et elle doit s'entendre dans le mot. Un
 * brouillon n'a jamais été en ligne ; il est en cours. Une valeur masquée est
 * une valeur ACHEVÉE, qu'on a retirée du site — d'un clic, et qu'on y remet
 * d'un clic. Écrire « Brouillon » sur cette collection aurait laissé croire à
 * un travail inachevé et à un circuit de validation qui n'existe pas.
 *
 * Le féminin est assumé : les deux collections concernées listent une « valeur »
 * et une « statistique ».
 */

export const VISIBILITY_LABELS = {
  visible: "Sur le site",
  hidden: "Masquée",
} as const;

/** Libellé d'un booléen `is_visible`. */
export function libelleVisibilite(isVisible: boolean): string {
  return isVisible ? VISIBILITY_LABELS.visible : VISIBILITY_LABELS.hidden;
}
