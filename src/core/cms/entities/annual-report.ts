import type { ContentStatus } from "./content-status";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  UN RAPPORT ANNUEL — le document que l'association publie chaque année
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8I du Rapport 2, qui tient en une ligne : « rapports annuels PDF · année ·
 * le lien public n'apparaît que si le fichier existe ». C'est le DERNIER lot de
 * la série 8, et la neuvième collection.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  CE LOT RESSEMBLE AU 8H, ET C'EST EXACTEMENT LÀ QU'EST LE PIÈGE
 * ---------------------------------------------------------------------------
 * `annual_reports.document_media_id` est une référence de média en
 * `on delete restrict`, comme `gallery_items.media_id`. Mais elle est
 * **NULLABLE**, et toute la logique du Lot 8H tenait au fait que la sienne ne
 * l'était pas :
 *
 *   * Lot 8H — `media_id not null` : pas d'élément sans photo, garde de
 *     publication sur la photo, aucun repli, et un élément dont l'image ne se
 *     résout pas est RETIRÉ de la grille (écart nº 148) ;
 *   * ici — **un rapport sans PDF est un état NORMAL**, et c'est même celui des
 *     deux seules lignes qui existent. Le §8I l'écrit : « le comportement actuel
 *     (lien masqué si le PDF est absent) est conservé, la vérification portant
 *     désormais sur l'existence du média en base ».
 *
 * Recopier la garde du Lot 8H aurait produit une règle qui **empêche de publier
 * les deux seuls rapports existants**. Il n'y a donc AUCUNE garde de
 * publication sur le document — voir `set-annual-report-status.ts`, qui écrit
 * ce raisonnement en toutes lettres pour qu'on ne la « rétablisse » pas plus
 * tard en croyant réparer un oubli.
 *
 * ---------------------------------------------------------------------------
 * CE QUE LA PAGE PUBLIQUE FAISAIT, ET QUE CE FICHIER REPREND
 * ---------------------------------------------------------------------------
 * `src/content/equipe.ts` exposait un tableau `rapports` dont chaque entrée
 * portait un CHEMIN dans `/public/documents/`, et `/impact` testait la présence
 * réelle du fichier sur le disque (`resolveMedia`) pour décider entre un bouton
 * « Télécharger » et une pastille « Bientôt disponible ».
 *
 * La bascule remplace la lecture de disque par une référence en base. Le reste
 * est identique, y compris les deux mentions affichées : elles sont descendues
 * ici plutôt que recopiées, parce que **trois écrans les affichent désormais**
 * — la page publique, la liste du dashboard et la fiche — et que trois recopies
 * finissent par diverger (même raison qu'à `CATEGORIE_ABSENTE` au Lot 8H et à
 * `VALEUR_ABSENTE` au Lot 8G, écart nº 133).
 *
 * ---------------------------------------------------------------------------
 * LE GABARIT EST CELUI DES LOTS 8A–8D, 8F ET 8H
 * ---------------------------------------------------------------------------
 * Vérifié dans la migration plutôt que supposé : `annual_reports` porte
 * `status public.content_status not null default 'draft'` (0005), une politique
 * publique `status = 'published'` (0009), le trigger
 * `annual_reports_guard_publish` (0010) et figure dans la liste blanche de
 * `reorder_rows` (0012). Cycle éditorial complet — ce n'est PAS le gabarit à
 * visibilité binaire des Lots 8E et 8G.
 */

export type AnnualReport = {
  id: string;
  /**
   * L'année couverte par le rapport. `integer not null unique` en base.
   *
   * ⚠️  C'est le seul identifiant MÉTIER de cette collection : deux rapports
   * d'activité 2025 n'existent pas. L'unicité est vérifiée dans le cas d'usage
   * en plus de la base — voir `create-annual-report.ts` pour ce que la
   * traduction générique du 23505 aurait affiché à la place.
   */
  year: number;
  /**
   * Le titre affiché. `text not null`.
   *
   * Le site le rend TEL QUEL. Il n'est pas dérivé de l'année, contrairement à
   * `stats.key` (écart nº 124) : une clé technique que personne ne lit peut se
   * déduire, un texte affiché non — le déduire reviendrait à écrire du contenu
   * à la place de l'association.
   */
  title: string;
  /**
   * Le PDF, ou `null`.
   *
   * ⚠️  NULLABLE, et c'est la différence structurante avec le Lot 8H. Un
   * rapport en cours de préparation existe, se nomme et s'affiche — sans lien
   * de téléchargement. La colonne est en `on delete restrict` : tant que le
   * rapport pointe dessus, le fichier ne peut pas être supprimé de la
   * médiathèque, qui le signale déjà comme un usage BLOQUANT (Lot 7).
   */
  documentMediaId: string | null;
  position: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
};

/**
 * Champs saisis à la création.
 *
 * `status` est ABSENT — même raisonnement qu'aux Lots 8C, 8D, 8F et 8H : le
 * laisser dans le contrat d'entrée donnerait à un administrateur, qui passe le
 * trigger `guard_publish`, le moyen de mettre un rapport en ligne sans jamais
 * traverser `setAnnualReportStatus`.
 */
export type CreateAnnualReport = Omit<
  AnnualReport,
  "id" | "createdAt" | "updatedAt" | "position" | "status"
> & {
  position?: number;
  status?: ContentStatus;
};

/** Modification partielle. `id` identifie la cible, il n'est jamais modifiable. */
export type UpdateAnnualReport = Partial<
  Omit<AnnualReport, "id" | "createdAt" | "updatedAt">
>;

/* ═══════════════════════════════════════════════════════════════════════════
 * Bornes de l'année
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Les deux bornes acceptées pour `year`.
 *
 * ⚠️  FIXES, et surtout pas calculées à partir de la date du jour.
 *
 * `new Date().getFullYear() + 1` aurait été tentant, et faux pour deux
 * raisons : la valeur serait figée au démarrage du serveur (un processus qui
 * tourne au passage de l'année validerait selon l'année précédente), et l'écart
 * nº 23 a déjà tranché cette question pour les chiffres de l'accueil — une
 * valeur qui change toute seule au 1er janvier est un défaut, pas une
 * fonctionnalité.
 *
 * Ce que ces bornes protègent réellement : la faute de frappe. `20255` est
 * refusé par un message français au lieu de partir en base, où la colonne
 * `integer` l'accepterait sans broncher et où l'accueil afficherait
 * « Rapport d'activité 20255 ». Elles n'expriment aucune politique éditoriale :
 * un rapport daté de l'année prochaine reste enregistrable, parce qu'un
 * document se prépare avant l'année qu'il couvre ne soit finie.
 */
export const ANNEE_MIN = 2000;
export const ANNEE_MAX = 2100;

/* ═══════════════════════════════════════════════════════════════════════════
 * Ce que le site affiche
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Ce rapport propose-t-il un fichier à télécharger ?
 *
 * ⚠️  Répond sur la RÉFÉRENCE, pas sur le fichier. Savoir si le média se résout
 * vraiment demande une lecture de `media_assets` : c'est le travail de la page,
 * qui compose les deux (voir `/impact`). Le domaine dit ce qu'il sait.
 *
 * C'est la transposition exacte de ce que faisait `resolveMedia(rapport.file)`
 * avant la bascule — le §8I : « la vérification portant désormais sur
 * l'existence du média en base ».
 */
export function aUnDocument(rapport: AnnualReport): boolean {
  return rapport.documentMediaId !== null;
}

/**
 * La mention affichée sous le titre, dans les deux cas.
 *
 * Reprise LITTÉRALE des deux chaînes de `/impact` avant la bascule : « Format
 * PDF » quand le fichier est là, « En cours de préparation » sinon. Les
 * reformuler aurait changé le rendu public d'un lot dont le critère de recette
 * est justement « le rendu public est identique à l'actuel ».
 */
export const MENTION_AVEC_DOCUMENT = "Format PDF";
export const MENTION_SANS_DOCUMENT = "En cours de préparation";

/**
 * Le libellé de la pastille qui remplace le bouton de téléchargement.
 *
 * Repris à l'identique lui aussi. C'est l'invariant nº 2 rendu visible : plutôt
 * qu'un bouton qui ne mène nulle part, on dit que le document n'est pas encore
 * là.
 */
export const PASTILLE_SANS_DOCUMENT = "Bientôt disponible";

/**
 * L'ordre d'affichage suit-il les années, de la plus récente à la plus
 * ancienne ?
 *
 * ---------------------------------------------------------------------------
 * POURQUOI CETTE FONCTION EXISTE ALORS QU'AUCUNE RÈGLE NE L'IMPOSE
 * ---------------------------------------------------------------------------
 * `annual_reports` porte À LA FOIS une `position` réordonnable et une `year`,
 * et c'est la seule collection du projet dans ce cas. Les deux peuvent donc se
 * contredire, et rien en base ne l'empêche.
 *
 * Le site rendait ses rapports du plus récent au plus ancien, parce que le
 * tableau TypeScript était écrit dans cet ordre. Un nouveau rapport créé depuis
 * le dashboard se place en FIN de liste (`count() + 1`, comme les huit autres
 * collections) : le rapport 2026 ajouté après coup se retrouverait donc APRÈS
 * 2024, ce qui n'est pas faux mais n'est certainement pas voulu.
 *
 * Deux voies étaient ouvertes :
 *
 *   1. **Trier d'office par année décroissante** et retirer le
 *      réordonnancement. Écarté : la matrice du §9 déclare `document:reorder`,
 *      la migration 0012 inscrit `annual_reports` dans sa liste blanche, et
 *      supprimer une capacité que deux documents d'autorité prévoient
 *      demanderait mieux qu'une préférence.
 *   2. **Garder la position, et DIRE quand elle s'écarte des années.** C'est ce
 *      qui est fait — doctrine des Lots 8E à 8H : informer plutôt
 *      qu'interdire. L'écran de liste affiche le constat et propose le geste ;
 *      il ne réordonne rien tout seul.
 *
 * Reçoit la liste DANS SON ORDRE D'AFFICHAGE (celui des positions). Une liste
 * de zéro ou un élément est trivialement ordonnée.
 */
export function ordreSuitLesAnnees(rapports: readonly AnnualReport[]): boolean {
  for (let index = 1; index < rapports.length; index += 1) {
    if (rapports[index]!.year > rapports[index - 1]!.year) return false;
  }
  return true;
}

/**
 * Les années présentes plus d'une fois.
 *
 * ⚠️  La base l'interdit (`year integer not null unique`), et cette fonction
 * n'est donc PAS une garde : elle sert à décrire une liste déjà lue, dans les
 * cas où l'unicité aurait été contournée — un import direct, une restauration
 * partielle. Elle rend un tableau vide en fonctionnement normal, et c'est
 * exactement ce que la recette vérifie.
 */
export function anneesEnDoublon(rapports: readonly AnnualReport[]): number[] {
  const vues = new Set<number>();
  const doublons = new Set<number>();

  for (const rapport of rapports) {
    if (vues.has(rapport.year)) doublons.add(rapport.year);
    else vues.add(rapport.year);
  }

  return [...doublons].sort((a, b) => b - a);
}
