import type { ListFilter } from "../../shared/pagination";
import type { ContentStatus } from "../entities/content-status";
import type {
  CreateProgramme,
  Programme,
  UpdateProgramme,
} from "../entities/programme";

/**
 * Ports du programme — la frontière entre le domaine et la persistance.
 *
 * Le domaine déclare ce dont il a besoin ; l'infrastructure fournit une
 * implémentation. `core/` ne sait pas que Supabase existe, et les cas d'usage
 * se testent avec un dépôt en mémoire, sans base de données.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI DEUX INTERFACES ET NON UNE SEULE
 * ---------------------------------------------------------------------------
 * Principe de ségrégation des interfaces (le « I » de SOLID) : une lecture
 * publique mise en cache reçoit un `ProgrammeReadPort` et rien d'autre. Elle
 * ne peut pas écrire — pas par convention ni par relecture, mais parce que le
 * type ne le permet pas.
 *
 * Avec un port unique, `getPublishedProgrammes()` recevrait un objet capable
 * de supprimer des programmes. Ça marcherait, jusqu'au jour où quelqu'un s'en
 * servirait.
 */

export interface ProgrammeReadPort {
  findAll(filter?: ListFilter): Promise<Programme[]>;
  findBySlug(slug: string): Promise<Programme | null>;
  findById(id: string): Promise<Programme | null>;
  count(filter?: ListFilter): Promise<number>;
  /** Tous les slugs existants — sert à garantir l'unicité à la création. */
  listSlugs(): Promise<string[]>;
}

export interface ProgrammeWritePort {
  create(input: CreateProgramme): Promise<Programme>;
  update(id: string, input: UpdateProgramme): Promise<Programme>;
  delete(id: string): Promise<void>;
  /**
   * Réordonne en UNE transaction.
   *
   * Un échec en cours de route laisserait des positions incohérentes — deux
   * programmes en position 3, aucun en position 5. L'implémentation Supabase
   * passe donc par la fonction SQL `reorder_rows()` appelée en RPC (§3.4 du
   * Rapport 2), et non par N requêtes successives.
   */
  reorder(orderedIds: string[]): Promise<void>;
  setStatus(id: string, status: ContentStatus): Promise<Programme>;
}

/**
 * Regroupement de confort pour les cas d'usage qui écrivent.
 *
 * Presque toute écriture doit d'abord lire — vérifier qu'un slug est libre,
 * qu'un élément existe, quelle est sa position. Ce type évite de répéter la
 * paire dans chaque signature, sans rendre pour autant un port d'écriture
 * accessible aux lectures publiques.
 */
export type ProgrammeDeps = {
  read: ProgrammeReadPort;
  write: ProgrammeWritePort;
};
