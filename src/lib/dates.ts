/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  DATES — UN SEUL FUSEAU DE RÉFÉRENCE POUR TOUT LE SITE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * `formatDate` vivait dans `src/content/actualites.ts`. Elle en est sortie au
 * Lot 8B, quand les pages ont cessé d'importer ce fichier ; le module de
 * contenu la ré-exporte, aucun import n'est cassé (patron de l'écart nº 6).
 *
 * ---------------------------------------------------------------------------
 * POURQUOI UN FUSEAU EXPLICITE, ET POURQUOI CELUI-LÀ
 * ---------------------------------------------------------------------------
 * Une date de publication est saisie dans le dashboard, stockée en
 * `timestamptz` et réaffichée sur le site. Trois machines interviennent, avec
 * trois fuseaux possibles : le navigateur de l'éditeur, le serveur de rendu
 * (UTC en production) et la base (UTC).
 *
 * Sans fuseau de référence commun, une date saisie « 20 août » par un éditeur
 * à Douala devient l'instant `2025-08-19T23:00:00Z`, que le serveur — en UTC —
 * réaffiche « 19 août ». C'est le bug classique des dates sans heure, et il
 * n'est PAS théorique : il décale d'un jour la moitié des publications.
 *
 * La réponse retenue est de choisir le fuseau ÉDITORIAL du site — celui de
 * l'association — et de l'employer aux deux bouts : à la saisie comme à
 * l'affichage. Ce n'est pas le fuseau du lecteur, et c'est voulu : « publié le
 * 20 août » est un fait daté à Douala, pas une heure locale à convertir.
 *
 * `Africa/Douala` est à UTC+1 toute l'année (WAT, sans heure d'été). Le
 * décalage est donc une constante, ce qui permet de construire un instant sans
 * embarquer de bibliothèque de fuseaux : `Intl` sait afficher, il ne sait pas
 * analyser.
 *
 * ⚠️  Si le site devait un jour servir une association dans un fuseau à heure
 * d'été, `DECALAGE_SITE` cesserait d'être juste et il faudrait passer par
 * `Intl.DateTimeFormat().formatToParts()` pour retrouver le décalage du jour.
 * La constante est isolée ici pour que ce changement tienne en un endroit.
 */

/** Fuseau éditorial du site — celui de l'association. */
export const FUSEAU_SITE = "Africa/Douala";

/** Décalage constant de `FUSEAU_SITE` (WAT, pas d'heure d'été). */
export const DECALAGE_SITE = "+01:00";

/** Décalage en minutes, pour l'arithmétique de `versDateSaisie`. */
const DECALAGE_MINUTES = 60;

/**
 * Date longue en français : « 20 août 2025 ».
 *
 * Signature et rendu identiques à la fonction d'origine de
 * `src/content/actualites.ts`, au fuseau explicite près — qui ne change aucune
 * des dates existantes, toutes seedées à 09:00 UTC.
 */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: FUSEAU_SITE,
  }).format(new Date(iso));
}

/** Date courte : « 20 août 2025 » → « 20 août 2025 » en abrégé (« 20 août »). */
export function formatDateCourte(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: FUSEAU_SITE,
  }).format(new Date(iso));
}

/**
 * Instant ISO → valeur d'un `<input type="date">` (« 2025-08-20 »).
 *
 * Les parties de date sont lues DANS le fuseau du site, pas dans celui de la
 * machine : c'est ce qui garantit que l'éditeur relit exactement la date qu'il
 * a saisie, où qu'il se trouve.
 *
 * Chaîne vide si l'instant est absent ou illisible — jamais « Invalid Date »
 * dans un champ de formulaire.
 */
export function versDateSaisie(iso: string | null | undefined): string {
  if (!iso) return "";

  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) return "";

  // Décalé puis lu en UTC : `getUTC*` d'un instant avancé de 60 minutes donne
  // les composantes de l'heure locale de Douala. Passer par `toLocaleString`
  // aurait obligé à ré-analyser une chaîne formatée.
  const local = new Date(instant.getTime() + DECALAGE_MINUTES * 60_000);

  const deuxChiffres = (n: number) => String(n).padStart(2, "0");
  return [
    local.getUTCFullYear(),
    deuxChiffres(local.getUTCMonth() + 1),
    deuxChiffres(local.getUTCDate()),
  ].join("-");
}

/**
 * Valeur d'un `<input type="date">` → instant ISO.
 *
 * ---------------------------------------------------------------------------
 * L'HEURE DU JOUR EST PRÉSERVÉE, JAMAIS INVENTÉE
 * ---------------------------------------------------------------------------
 * Les trois articles seedés sont datés à 09:00. Si corriger la date d'un
 * article ramenait son heure à minuit, une donnée aurait changé sans que
 * personne ne l'ait demandé — et la comparaison avant/après de la recette
 * deviendrait fausse.
 *
 * `instantPrecedent` fournit donc l'heure à conserver. En son absence — un
 * article neuf — l'instant est fixé à **minuit, heure de Douala** : c'est la
 * lecture littérale de « publié le 20 août », et non une heure choisie au
 * hasard.
 *
 * Renvoie `null` si la saisie est vide ou illisible.
 */
export function versInstantDepuisSaisie(
  dateSaisie: string,
  instantPrecedent?: string | null,
): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateSaisie)) return null;

  const heure = heureDuJour(instantPrecedent);
  const instant = new Date(`${dateSaisie}T${heure}${DECALAGE_SITE}`);

  return Number.isNaN(instant.getTime()) ? null : instant.toISOString();
}

/** « HH:MM:SS » de l'instant donné, dans le fuseau du site. Minuit à défaut. */
function heureDuJour(iso: string | null | undefined): string {
  if (!iso) return "00:00:00";

  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) return "00:00:00";

  const local = new Date(instant.getTime() + DECALAGE_MINUTES * 60_000);
  const deuxChiffres = (n: number) => String(n).padStart(2, "0");

  return [
    deuxChiffres(local.getUTCHours()),
    deuxChiffres(local.getUTCMinutes()),
    deuxChiffres(local.getUTCSeconds()),
  ].join(":");
}

/** L'instant est-il encore à venir ? Sert à annoncer une publication différée. */
export function estAVenir(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const instant = Date.parse(iso);
  return !Number.isNaN(instant) && instant > Date.now();
}
