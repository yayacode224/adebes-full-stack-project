"use client";

import { useSyncExternalStore } from "react";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LE SEUL ENDROIT DU DÉPÔT OÙ UN POINT DE RUPTURE EST LU EN JAVASCRIPT
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Règle 9 du §12 du Rapport 1 : « la responsivité est faite en CSS, pas en
 * JavaScript ». Une seule exception est assumée — le REMPLACEMENT d'un
 * composant par un autre (`Dialog` ⇄ `Sheet`), qu'aucune media query ne peut
 * exprimer puisqu'il faut monter deux arbres React différents.
 *
 * Ce fichier est cette exception, et il est vérifiable :
 *
 *     grep -rn "window.innerWidth\|matchMedia" src/ --include=*.ts --include=*.tsx
 *
 * ne doit renvoyer que ce fichier. Toute autre occurrence est une régression.
 *
 * ---------------------------------------------------------------------------
 * CE HOOK NE SERT PAS À FAIRE DE LA MISE EN PAGE
 * ---------------------------------------------------------------------------
 * Masquer, empiler, changer une largeur ou une colonne se fait en classes
 * Tailwind (`hidden lg:flex`, `grid-cols-1 md:grid-cols-3`). La coquille du
 * dashboard livrée au Lot 5 n'utilise donc PAS ce hook : sa barre latérale
 * fixe et son tiroir mobile sont deux blocs CSS, sans une ligne de JavaScript
 * de mise en page.
 *
 * Ses consommateurs, tous livrés au Lot 6 :
 *
 *   * `<FormModal>` — `Dialog` au-dessus de 1024 px, `Sheet` en dessous ;
 *   * `<DataTable>` — **tableau** au-dessus de 768 px, **liste de cartes** en
 *     dessous. Le §6.1 du Rapport 2 exige que la structure `<table>` ne soit
 *     PAS dans le DOM sous 768 px : rendre les deux formes et en masquer une
 *     doublerait le DOM et ferait tout lire deux fois aux lecteurs d'écran.
 *
 * ---------------------------------------------------------------------------
 * DEUX SEUILS, UN SEUL FICHIER
 * ---------------------------------------------------------------------------
 * La règle 9 nomme un ENDROIT unique, pas une requête unique. Le §12 lui-même
 * désigne 768, 1024 et 1280 comme les trois seuils qui portent une décision de
 * structure ; deux d'entre eux imposent un remplacement de composant, donc une
 * lecture en JavaScript. Les deux requêtes sont déclarées ici, ensemble, et le
 * `grep` de recette continue de ne renvoyer que ce fichier.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI `useSyncExternalStore` ET NON `useState` + `useEffect`
 * ---------------------------------------------------------------------------
 * La paire `useState`/`useEffect` oblige à choisir une valeur initiale, qui
 * sera fausse une fois sur deux, et impose un rendu supplémentaire à chaque
 * montage. `useSyncExternalStore` prend en charge les trois cas d'un coup :
 * l'instantané serveur, l'instantané client et l'abonnement aux changements
 * de taille — et React garantit l'absence de décalage d'hydratation.
 *
 * L'instantané serveur vaut `false` : mobile d'abord (règle 1). Un rendu
 * serveur qui parierait sur le bureau afficherait un `Dialog` puis le
 * remplacerait par un `Sheet` sur un téléphone — exactement le clignotement
 * que la règle 9 interdit.
 */

/**
 * Les trois seuils lisibles en JavaScript, aux valeurs Tailwind par défaut.
 *
 * Aucun point de rupture personnalisé n'est introduit : le §12 l'interdit
 * explicitement (« sort du contrat et devient invisible à la relecture »).
 *
 * ⚠️  `xl` REJOINT LA LISTE AU LOT 9, ET LE FICHIER L'ANNONÇAIT DÉJÀ :
 * « le §12 lui-même désigne 768, 1024 ET 1280 comme les trois seuils qui
 * portent une décision de structure ». L'éditeur de pages (§9.3) est le
 * premier écran à en avoir besoin : sous 1280 px, les réglages de la page
 * vivent dans un `Sheet` ; au-delà, dans une troisième colonne inline. Les
 * monter TOUS LES DEUX à la fois — l'un caché en CSS — ferait coexister deux
 * formulaires indépendants sur la même donnée, et la saisie de l'un
 * disparaîtrait sans préavis si la fenêtre change de largeur pendant la
 * frappe. C'est exactement le risque que `<FormModal>` évite déjà entre
 * `Dialog` et `Sheet` ; l'éditeur de pages l'évite de la même façon.
 */
const REQUETES = {
  /** `md:` — le tableau redevient un tableau. */
  md: "(min-width: 768px)",
  /** `lg:` — la barre latérale devient persistante, la modale devient `Dialog`. */
  lg: "(min-width: 1024px)",
  /** `xl:` — l'éditeur de pages passe de deux zones + `Sheet` à trois zones. */
  xl: "(min-width: 1280px)",
} as const;

type Seuil = keyof typeof REQUETES;

/**
 * Une `MediaQueryList` par seuil, créée une seule fois.
 *
 * `getSnapshot` est appelé à chaque rendu : y construire un nouvel objet
 * ferait croire à React que la valeur change en permanence et provoquerait une
 * boucle de rendu. Les instances sont donc mémorisées au niveau du module.
 */
const listes = new Map<Seuil, MediaQueryList>();

function liste(seuil: Seuil): MediaQueryList {
  let requete = listes.get(seuil);
  if (!requete) {
    requete = window.matchMedia(REQUETES[seuil]);
    listes.set(seuil, requete);
  }
  return requete;
}

/**
 * Abonnements mémoïsés par seuil.
 *
 * `useSyncExternalStore` se réabonne dès que la fonction `subscribe` change
 * d'identité. La recréer à chaque rendu déclencherait un cycle
 * désabonnement / réabonnement par rendu — invisible, mais gratuit et évitable.
 */
const abonnements = new Map<Seuil, (auChangement: () => void) => () => void>();

function abonnement(seuil: Seuil) {
  let souscrire = abonnements.get(seuil);
  if (!souscrire) {
    souscrire = (auChangement: () => void) => {
      const requete = liste(seuil);
      requete.addEventListener("change", auChangement);
      return () => requete.removeEventListener("change", auChangement);
    };
    abonnements.set(seuil, souscrire);
  }
  return souscrire;
}

const instantanes = new Map<Seuil, () => boolean>();

function instantane(seuil: Seuil) {
  let lire = instantanes.get(seuil);
  if (!lire) {
    lire = () => liste(seuil).matches;
    instantanes.set(seuil, lire);
  }
  return lire;
}

/** Mobile d'abord : le rendu serveur ne suppose jamais un grand écran. */
function instantaneServeur(): boolean {
  return false;
}

/**
 * L'écran fait-il au moins la largeur de ce seuil ?
 *
 * À n'utiliser que pour choisir ENTRE DEUX COMPOSANTS. Pour masquer, empiler,
 * changer une largeur ou un nombre de colonnes, écrire une classe Tailwind.
 */
export function useMinWidth(seuil: Seuil): boolean {
  return useSyncExternalStore(
    abonnement(seuil),
    instantane(seuil),
    instantaneServeur,
  );
}

/** `true` à partir de 1024 px — `<FormModal>` rend alors un `Dialog`. */
export function useIsDesktop(): boolean {
  return useMinWidth("lg");
}

/** `true` à partir de 768 px — `<DataTable>` rend alors un vrai tableau. */
export function useIsTableViewport(): boolean {
  return useMinWidth("md");
}

/** `true` à partir de 1280 px — `<PageEditor>` rend alors trois zones inline. */
export function useIsWideEditor(): boolean {
  return useMinWidth("xl");
}
