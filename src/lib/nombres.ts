/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LES NOMBRES ÉCRITS EN TOUTES LETTRES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ---------------------------------------------------------------------------
 * POURQUOI CE FICHIER EXISTE — UN DÉFAUT TROUVÉ AU LOT 8E
 * ---------------------------------------------------------------------------
 * La section « Nos valeurs » de `/a-propos` portait ce titre, écrit en dur :
 *
 *     « Quatre principes, appliqués au quotidien »
 *
 * Tant que les valeurs vivaient dans un tableau TypeScript, le titre et la
 * liste changeaient dans le même commit et ne pouvaient pas se contredire.
 *
 * Le Lot 8E met la liste en base et la rend modifiable depuis le dashboard :
 * **le titre devient une affirmation que la page n'a plus aucun moyen de
 * tenir.** Ajouter une cinquième valeur, ou en masquer une, laisse la page
 * annoncer « Quatre » au-dessus d'une grille qui en compte trois ou cinq — un
 * chiffre faux affiché comme un fait, sur la page que l'audit (§4.9) décrit
 * comme un signal de confiance pour un donateur. C'est exactement l'invariant
 * nº 1, dans sa forme la plus discrète : personne ne le remarquerait avant un
 * visiteur.
 *
 * Les deux issues envisagées :
 *
 *   1. **Retirer le nombre du titre** (« Les principes qui nous guident »).
 *      Simple, mais le critère de recette des lots 8x exige un rendu IDENTIQUE
 *      pour les données migrées — cela l'aurait rompu sans nécessité.
 *   2. **Dériver le nombre de la liste réellement affichée**, et c'est ce qui
 *      est fait. Avec les quatre valeurs du seed, le titre rend « Quatre
 *      principes, appliqués au quotidien » — au caractère près. Et il reste
 *      vrai quoi qu'il advienne.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LA MÊME QUESTION SE POSERA AU LOT 8F ET AU LOT 8G
 * ---------------------------------------------------------------------------
 * Tout titre de section qui compte ce qu'il surmonte devient faux dès que la
 * liste devient modifiable. `/programmes` annonce « Huit domaines
 * d'intervention » et l'accueil « Voir les 8 programmes » : les deux sont dans
 * ce cas depuis le Lot 8A, avec huit programmes en base et aucun moyen de
 * garantir qu'ils resteront huit. **Consigné, non corrigé ici** — les toucher
 * exigerait de rejouer la recette du Lot 8A, et la règle du projet est de ne
 * pas modifier un lot livré sans la rejouer.
 */

/**
 * Les nombres de 0 à 12, en toutes lettres.
 *
 * La borne n'est pas arbitraire : au-delà, une section de page d'accueil ne
 * compte plus, elle énumère. Un titre « Dix-sept principes » ne se lit pas —
 * c'est le chiffre qui devient l'information, et le chiffre s'écrit en
 * chiffres. `enLettres()` bascule donc sur la forme numérique au-delà.
 */
const EN_LETTRES = [
  "zéro",
  "un",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
  "dix",
  "onze",
  "douze",
] as const;

/**
 * Écrit un petit nombre en toutes lettres, en chiffres au-delà de douze.
 *
 * `capitale` met la première lettre en majuscule — un titre commence par une
 * majuscule, et « quatre principes » en début de phrase serait fautif.
 */
export function enLettres(n: number, options?: { capitale?: boolean }): string {
  const entier = Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;

  const mot = entier < EN_LETTRES.length ? EN_LETTRES[entier] : String(entier);

  return options?.capitale ? mot.charAt(0).toUpperCase() + mot.slice(1) : mot;
}

/**
 * Accorde un nom au pluriel selon un décompte.
 *
 * Le pluriel français commence à DEUX : « un principe », « zéro principe »,
 * « deux principes ». C'est l'erreur classique d'un `n > 0 ? "s" : ""`, et
 * elle se voit — « 0 principes » dans un titre de section a l'air d'un défaut
 * de calcul.
 */
export function accorde(n: number, singulier: string, pluriel: string): string {
  return Math.abs(n) >= 2 ? pluriel : singulier;
}
