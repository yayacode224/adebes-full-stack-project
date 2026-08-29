/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LES VISUELS D'ARTICLE LIVRÉS AVEC LE DÉPÔT — REPLI TRANSITOIRE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Jumeau exact de `src/lib/programme-visuels.ts` (écart nº 64), pour les
 * actualités. La fonction vivait dans `src/content/actualites.ts` ; elle en est
 * sortie au Lot 8B, quand les pages ont cessé d'importer ce fichier. Le module
 * de contenu la ré-exporte, aucun import n'est cassé.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI ELLE SURVIT À LA BASCULE EN BASE
 * ---------------------------------------------------------------------------
 * Les trois articles sont désormais lus en base, mais leur `cover_media_id` y
 * vaut `NULL` : `media_assets` est VIDE, aucun fichier éditorial n'a encore été
 * téléversé. Basculer sans repli aurait remplacé trois photographies réelles —
 * livrées dans `public/images/actualites/` — par trois aplats de couleur, alors
 * que la recette du §8x exige un rendu « identique à l'actuel ».
 *
 * Le repli est une PRIORITÉ déclarée, dans cet ordre :
 *
 *   1. le média choisi dans la médiathèque (`coverMediaId`), s'il existe ;
 *   2. à défaut, le fichier livré dans `/public`, résolu par `resolveMedia` ;
 *   3. à défaut, le `MediaPlaceholder`, comme aujourd'hui.
 *
 * ⚠️  DIFFÉRENCE AVEC LES PROGRAMMES, ET ELLE COMPTE : un programme créé depuis
 * le dashboard aura toujours un fichier `/public` correspondant, puisque les
 * huit sont ceux du dépôt. Un ARTICLE créé depuis le dashboard, lui, n'en aura
 * jamais — la convention `<slug>-cover.jpeg` ne vaut que pour les trois
 * articles d'origine. `resolveMedia` renvoie alors `null` et `<MediaImage>`
 * rend son `MediaPlaceholder` : c'est le comportement attendu, et c'est
 * précisément pourquoi le champ « Image de couverture » du formulaire dit
 * qu'aucune image n'a été choisie plutôt que de laisser croire à un défaut.
 *
 * ⚠️  **À retirer au Lot 15**, §15.4, et seulement quand les visuels réels
 * auront été téléversés dans la médiathèque.
 */

/** Chemin du visuel de couverture livré dans `/public`, déduit du slug. */
export function actualiteCover(slug: string): string {
  return `/images/actualites/${slug}-cover.jpeg`;
}
