/**
 * L'état rétracté de la barre latérale, partagé entre le serveur et le client.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI CE FICHIER EXISTE SÉPARÉMENT
 * ---------------------------------------------------------------------------
 * `dashboard-shell.tsx` porte `"use client"`. Un module client est remplacé, à
 * la compilation, par un proxy de références : le layout (Server Component) qui
 * en importerait une constante ne recevrait pas la chaîne mais un objet
 * `client.reference`, et le cookie serait cherché sous un nom absurde. Le
 * réglage vit donc dans un module neutre, importable des deux côtés.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI UN COOKIE ET NON `localStorage`
 * ---------------------------------------------------------------------------
 * Écart assumé au §5.3 du Rapport 2, justifié en tête de `dashboard-shell.tsx` :
 * `localStorage` n'est lisible qu'après hydratation, ce qui ferait sauter la
 * barre de 264 px à 72 px à chaque chargement. Un cookie est lu pendant le
 * rendu serveur.
 */

/** Portée `path=/dashboard` : ce réglage ne concerne aucune route publique. */
export const COOKIE_BARRE_LATERALE = "adebes_barre_laterale";

/**
 * La barre doit-elle être rendue rétractée ?
 *
 * Toute valeur autre que `"1"` — cookie absent, vidé, ou écrit par une version
 * antérieure — vaut « déployée ». C'est le repli sûr : un utilisateur qui
 * retrouve sa barre déployée comprend tout de suite ; une barre réduite à des
 * icônes sans qu'il l'ait demandé ressemble à une panne.
 */
export function estRepliee(valeurCookie: string | undefined): boolean {
  return valeurCookie === "1";
}
