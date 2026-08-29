/**
 * Habillage des champs du dashboard.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  POURQUOI CES CLASSES SONT ICI ET NON DANS `src/components/ui/`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Le §6.2 du Rapport 2 est explicite : le dimensionnement des champs du
 * dashboard se règle **au niveau des champs du dashboard, pas dans la
 * primitive partagée**. Toucher à `ui/input.tsx` modifierait aussi les
 * formulaires de contact et de bénévolat du site public, déjà recettés au
 * lot 0 — un lot ne casse pas la livraison d'un autre pour s'épargner une
 * constante.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  LES DEUX RÈGLES ENCODÉES ICI
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **`text-base` sous `md:`** (règle 7 du §12 du Rapport 1). En deçà de 16 px,
 * iOS Safari zoome automatiquement à la mise au point : la page se décale, le
 * champ sort de l'écran, et l'utilisateur doit dézoomer à chaque champ. La
 * primitive `Input` porte déjà `text-base md:text-sm` ; c'est répété ici pour
 * que la règle survive à une mise à jour de shadcn.
 *
 * **44 px de haut** (règle 4). `Input` est en `h-8` (32 px) et le déclencheur
 * de `Select` en `h-8` : les deux sont relevés. La règle ne se relâche pas sur
 * grand écran — « une tablette tactile de 1024 px reste un écran tactile ».
 *
 * Le déclencheur de `Select` porte sa hauteur via `data-[size=default]:h-8`,
 * un sélecteur d'attribut : un simple `h-11` perdrait l'arbitrage de
 * spécificité. L'override reprend donc la même forme.
 */

/** `Input` — texte, nombre, lien. */
export const CHAMP = "h-11 w-full text-base md:text-sm";

/** `Textarea` — la hauteur minimale prime, `field-sizing-content` fait le reste. */
export const CHAMP_MULTILIGNE = "min-h-24 w-full text-base md:text-sm";

/** `SelectTrigger` — voir la note sur la spécificité ci-dessus. */
export const CHAMP_SELECT =
  "w-full text-base data-[size=default]:h-11 md:text-sm";

/**
 * Cible de choix d'une grille (icône, teinte).
 *
 * `size-11` = 44 px exactement : ces pastilles sont les plus petites cibles
 * du formulaire, et donc celles qu'une régression de style toucherait en
 * premier.
 */
export const PASTILLE_CHOIX =
  "flex size-11 items-center justify-center rounded-lg border transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

/**
 * Cible tactile de 44 px pour une case à cocher — CORRECTIF DU LOT 8A.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  POURQUOI UN PSEUDO-ÉLÉMENT ET NON UN CONTENEUR DE 44 px
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * La primitive `Checkbox` de shadcn mesure **16 px**. Elle porte déjà une
 * extension de zone sensible (`after:-inset-x-3 after:-inset-y-2`), mais celle-ci
 * ne donne que 40 × 32 px : sous les 44 px imposés par la règle 4 du §12, et
 * mesuré comme tel par la recette du Lot 8A sur les trois cases du
 * `<DataTable>` (sélection de ligne et « tout sélectionner »).
 *
 * Envelopper la case dans un `<label>` de 44 px — ce que faisait déjà la vue
 * en cartes — agrandit la cible VISUELLE, mais un `<label>` autour d'un
 * `<button>` ne lui transmet pas le clic : la zone gagnée n'est pas cliquable.
 * Le pseudo-élément, lui, appartient au bouton : tout appui dessus l'active.
 *
 * `-inset-3.5` = −0,875 rem sur les quatre côtés → 16 + 2 × 14 = **44 px**
 * exactement, dans les deux dimensions, sans rien déplacer à l'écran.
 *
 * ⚠️  Défini ICI et non dans `ui/checkbox.tsx` : la primitive est partagée avec
 * les formulaires de contact et de bénévolat du site public, déjà recettés.
 * Même règle que pour la hauteur des champs — le dimensionnement du dashboard
 * se règle dans le dashboard.
 */
export const CIBLE_44 = "after:-inset-3.5";
