import type { ListFilter } from "../../shared/pagination";
import type { ContentStatus } from "../entities/content-status";
import type {
  CreatePage,
  CreatePageSection,
  Page,
  PageSection,
  PageWithSections,
  UpdatePage,
  UpdatePageSection,
} from "../entities/page";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  PORTS DES PAGES ET DES SECTIONS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Même découpage lecture / écriture que dans toute la série 8 (principe I de
 * SOLID) : le rendu public reçoit un `PageReadPort` et rien d'autre.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  QUATRE PORTS ET NON DEUX — pages et sections sont deux agrégats
 * ---------------------------------------------------------------------------
 * La tentation était de n'en faire qu'un : une page « contient » ses sections,
 * et l'écran d'édition les manipule ensemble. Les séparer répond à une
 * contrainte concrète, pas à un principe :
 *
 *   * **les permissions divergent.** Un éditeur a `section:update` et
 *     `section:reorder` mais NI `section:create` NI `section:delete`, et il a
 *     `page:update` sans `page:publish`. Un port unique aurait exposé à chaque
 *     cas d'usage des méthodes que son appelant n'a pas le droit d'employer ;
 *   * **les écritures sont indépendantes.** Enregistrer le contenu d'une
 *     section ne touche pas la page. Les mêler aurait fait remonter un
 *     `updated_at` de page à chaque frappe.
 *
 * ---------------------------------------------------------------------------
 * `findByRoute` RENVOIE LA PAGE **ET** SES SECTIONS
 * ---------------------------------------------------------------------------
 * En une seule méthode, parce que le rendu public n'a jamais besoin de l'une
 * sans les autres et qu'une jointure vaut mieux que deux allers-retours sur le
 * chemin le plus chaud du site. C'est la seule méthode composite de ce
 * fichier : partout ailleurs, page et sections se lisent séparément.
 */

export interface PageReadPort {
  findAll(filter?: ListFilter): Promise<Page[]>;
  findById(id: string): Promise<Page | null>;
  findBySlug(slug: string): Promise<Page | null>;
  findByRoute(route: string): Promise<Page | null>;
  count(filter?: ListFilter): Promise<number>;
  /**
   * La page publiée servie à cette adresse, sections visibles comprises.
   *
   * Rend `null` si la page n'existe pas OU n'est pas publiée : la distinction
   * n'intéresse pas le visiteur, et la faire remonter aurait laissé deviner
   * l'existence d'un brouillon depuis l'extérieur.
   */
  findPublishedByRoute(route: string): Promise<PageWithSections | null>;
  /** Nombre de sections par page, pour la colonne « Sections » de la liste. */
  countSectionsByPage(): Promise<Map<string, number>>;
}

export interface PageWritePort {
  create(input: CreatePage): Promise<Page>;
  update(id: string, input: UpdatePage): Promise<Page>;
  /**
   * Supprime la page ET ses sections (cascade en base).
   *
   * ⚠️  Échoue sur une page système : le trigger `guard_system_page`
   * (migration 0010) lève, et le dépôt traduit son message. Le cas d'usage
   * refuse plus tôt et plus clairement, mais la garde de la base reste la
   * seule qu'un accès direct ne contourne pas.
   */
  delete(id: string): Promise<void>;
  setStatus(id: string, status: ContentStatus): Promise<Page>;
}

export interface SectionReadPort {
  findByPage(pageId: string): Promise<PageSection[]>;
  findById(id: string): Promise<PageSection | null>;
}

export interface SectionWritePort {
  create(input: CreatePageSection): Promise<PageSection>;
  update(id: string, input: UpdatePageSection): Promise<PageSection>;
  delete(id: string): Promise<void>;
  /** Réordonne les sections d'une page en UNE transaction (`reorder_rows`, §3.4). */
  reorder(orderedIds: string[]): Promise<void>;
  /**
   * Insère une section à une position donnée, en décalant les suivantes.
   *
   * Séparé de `create` parce que l'opération est transactionnelle : ajouter au
   * milieu suppose de renuméroter la queue de la liste. Un `create` suivi d'un
   * `reorder` aurait laissé, entre les deux, un état où deux sections portent
   * la même position — visible sur le site si la seconde écriture échoue.
   */
  insertAt(input: CreatePageSection, position: number): Promise<PageSection>;
}

/**
 * Regroupement de confort pour les cas d'usage.
 *
 * Quatre champs et non deux : un cas d'usage de section a besoin de lire la
 * page pour vérifier qu'elle existe et qu'elle n'est pas verrouillée, et un cas
 * d'usage de page a besoin des sections pour la garde de publication.
 */
export type PageDeps = {
  read: PageReadPort;
  write: PageWritePort;
  sectionRead: SectionReadPort;
  sectionWrite: SectionWritePort;
};
