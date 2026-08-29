/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LES VISUELS DE PROGRAMME LIVRÉS AVEC LE DÉPÔT — REPLI TRANSITOIRE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Ces deux fonctions vivaient dans `src/content/programmes.ts`. Elles en sont
 * sorties au Lot 8A, quand les pages ont cessé d'importer ce fichier ; le
 * module de contenu les ré-exporte, aucun import n'est cassé.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI ELLES SURVIVENT À LA BASCULE EN BASE
 * ---------------------------------------------------------------------------
 * Les huit programmes sont désormais lus en base, mais leur `cover_media_id`
 * y vaut `NULL` : `media_assets` est VIDE, aucun fichier éditorial n'a encore
 * été téléversé. Passer la page publique sur la base sans repli aurait donc
 * remplacé huit photographies réelles par huit `MediaPlaceholder` — une
 * régression visible, et la recette du §8A exige au contraire un rendu
 * « identique à l'actuel ».
 *
 * Le repli n'est ni un doublon ni une dette cachée, c'est une PRIORITÉ
 * déclarée, dans cet ordre :
 *
 *   1. le média choisi dans la médiathèque (`coverMediaId`), s'il existe ;
 *   2. à défaut, le fichier livré dans `/public`, résolu par `resolveMedia` ;
 *   3. à défaut, le `MediaPlaceholder`, comme aujourd'hui.
 *
 * Choisir une couverture depuis le dashboard fait donc basculer le visuel sans
 * qu'aucune ligne de code ne change — et c'est exactement le comportement que
 * `src/lib/media.ts` documente déjà pour `/public` : « le jour où le fichier
 * est déposé au bon chemin, l'image réelle apparaît sans toucher au code ».
 *
 * ⚠️  **À retirer au Lot 15**, §15.4 (« `src/lib/media.ts` est supprimé pour le
 * contenu CMS »), et seulement quand les visuels réels auront été téléversés
 * dans la médiathèque. Le supprimer avant, c'est vider les pages.
 */

/** Chemin du visuel de couverture livré dans `/public`, déduit du slug. */
export function coverParDefaut(slug: string): string {
  return `/images/programmes/${slug}/cover.jpeg`;
}

/** Les trois photos « Sur le terrain » livrées dans `/public`. */
export function galerieParDefaut(slug: string): string[] {
  return ["01", "02", "03"].map((n) => `/images/programmes/${slug}/${n}.jpeg`);
}
