import type { BlockType } from "./block-type";
import type { ContentStatus } from "./content-status";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  UNE PAGE ÉDITORIALE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * La Famille B du Rapport 1. Une page n'est pas une collection : elle n'a ni
 * carte, ni page de détail, ni grille. Ce qu'elle a, c'est une **suite
 * ordonnée de sections**, chacune portant le contenu d'un bloc du registre.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `route` EST LA CLÉ RÉELLE, `slug` NE L'EST PAS
 * ---------------------------------------------------------------------------
 * Les deux colonnes existent (migration 0006) et il faut savoir laquelle sert à
 * quoi, sous peine de chercher longtemps :
 *
 *   * `route` est le chemin servi — `/`, `/a-propos`, `/mentions-legales`.
 *     C'est par lui que le rendu public retrouve une page ;
 *   * `slug` est un identifiant technique — `accueil`, `a-propos`. Il sert au
 *     rapprochement avec le seed et aux étiquettes de cache
 *     (`cms:page:accueil`). **Il n'apparaît dans aucune URL.**
 *
 * Le cas qui tranche : la page d'accueil a `slug = 'accueil'` et `route = '/'`.
 * Aucune règle ne dérive l'un de l'autre.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `isSystem` — DOUZE PAGES QUE LE CODE CONNAÎT PAR LEUR NOM
 * ---------------------------------------------------------------------------
 * Les douze pages du seed sont `is_system = true`. Elles correspondent à un
 * fichier de route sous `src/app/(site)/` : supprimer la ligne ne supprimerait
 * pas la page — elle continuerait de répondre, vide de ses sections, avec son
 * en-tête et son pied de page.
 *
 * Le trigger `guard_system_page` (migration 0010) refuse donc la suppression au
 * niveau de la BASE, message français compris. L'applicatif le refuse aussi,
 * plus tôt et plus clairement, mais la garde qui compte est celle qu'un accès
 * direct ne peut pas contourner.
 *
 * Une page créée depuis le dashboard, elle, porte `is_system = false` et se
 * supprime normalement.
 */
export type Page = {
  id: string;
  /** Identifiant technique. Jamais dans une URL — voir l'avertissement ci-dessus. */
  slug: string;
  /** Le chemin servi : `/`, `/a-propos`. C'est la clé de lecture publique. */
  route: string;
  title: string;
  status: ContentStatus;
  /** Page adossée à un fichier de route : non supprimable. */
  isSystem: boolean;
  /** Balise `<title>`. Vide = le titre de la page est employé. */
  metaTitle: string | null;
  metaDescription: string | null;
  /** Image de partage sur les réseaux sociaux. */
  ogMediaId: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Une section : un bloc du registre, posé à une position sur une page.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `content` EST `unknown`, ET DÉLIBÉRÉMENT
 * ---------------------------------------------------------------------------
 * La colonne est du JSONB : la base n'en garantit rien d'autre que « c'est du
 * JSON ». Le typer `Record<string, unknown>` aurait été une affirmation fausse
 * — un `content` peut valoir `null`, `42` ou `"bonjour"` après une écriture
 * directe — et `unknown` force chaque lecteur à passer par `parseContenu()`,
 * qui est le seul endroit où la forme est établie.
 *
 * C'est la même discipline que le `Json` de `database.types.ts`, appliquée un
 * étage plus haut.
 */
export type PageSection = {
  id: string;
  pageId: string;
  /**
   * Le type de bloc.
   *
   * Typé `string` et non `BlockType` : la colonne est du `text`, et une section
   * peut porter le nom d'un bloc retiré du registre. Prétendre le contraire
   * aurait fait mentir le type au premier retrait de bloc.
   * `getBlockDefinition()` fait la conversion, et rend `null` le cas échéant.
   */
  blockType: string;
  position: number;
  /** Contenu JSONB brut. À valider par `parseContenu()` avant tout usage. */
  content: unknown;
  /** Masquée du site public, mais conservée dans le dashboard. */
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Une page et ses sections, dans l'ordre. La forme que lit le rendu public. */
export type PageWithSections = Page & {
  sections: PageSection[];
};

/**
 * Création d'une page.
 *
 * ⚠️  `status` EST ABSENT DU CONTRAT, comme aux Lots 8C et 8D : une page ne
 * peut pas naître publiée. Elle doit traverser `setPageStatus()`, donc la
 * permission `page:publish` et le trigger `guard_publish`. Le laisser ici
 * aurait offert un chemin de publication qui ne passe par aucune garde.
 *
 * `isSystem` est absent pour une raison différente : **rien ne doit pouvoir
 * créer une page système depuis le dashboard.** Une page système est adossée à
 * un fichier de route, ce qu'aucun formulaire ne sait produire. Seul le seed en
 * pose.
 */
export type CreatePage = {
  title: string;
  /** Dérivée du titre si absente. */
  slug?: string;
  /** Dérivée du slug si absente : `/mon-titre`. */
  route?: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogMediaId?: string | null;
};

export type UpdatePage = Partial<
  Pick<
    Page,
    "title" | "slug" | "route" | "metaTitle" | "metaDescription" | "ogMediaId"
  >
>;

/**
 * Ajout d'une section.
 *
 * `content` est facultatif : à l'ajout depuis le sélecteur de blocs, ce sont
 * les `defaults` de la définition qui sont écrits. Une section fraîchement
 * ajoutée est donc immédiatement valide et immédiatement rendue — vide, mais
 * pas cassée.
 *
 * `position` est facultatif : calculée en fin de liste, comme partout ailleurs
 * dans ce projet.
 */
export type CreatePageSection = {
  pageId: string;
  blockType: BlockType;
  content?: unknown;
  position?: number;
  isVisible?: boolean;
};

export type UpdatePageSection = {
  content?: unknown;
  isVisible?: boolean;
};

/**
 * Le marqueur des champs restant à compléter, repris du contenu d'origine.
 *
 * Identique à celui du Lot 8D (fiches d'équipe). Une page dont une section
 * contient encore ce marqueur ne peut pas être publiée — voir
 * `set-page-status.ts`.
 */
export const MARQUEUR_A_COMPLETER = "[À COMPLÉTER]";

/**
 * Cherche le marqueur dans un contenu JSONB, quelle que soit sa profondeur.
 *
 * Récursive parce que le contenu d'un bloc l'est : `feature-list` porte ses
 * marqueurs dans `items[].description`, deux niveaux sous la racine. Une
 * recherche à plat n'aurait rien trouvé sur le bloc qui en contient le plus.
 */
export function contientMarqueur(valeur: unknown): boolean {
  if (typeof valeur === "string") return valeur.includes(MARQUEUR_A_COMPLETER);
  if (Array.isArray(valeur)) return valeur.some(contientMarqueur);
  if (typeof valeur === "object" && valeur !== null) {
    return Object.values(valeur).some(contientMarqueur);
  }
  return false;
}
