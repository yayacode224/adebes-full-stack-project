import type { ListFilter } from "../../shared/pagination";
import type { ContentStatus } from "../entities/content-status";
import type {
  CreateTestimonial,
  Testimonial,
  UpdateTestimonial,
} from "../entities/testimonial";
import type { ProgrammeReadPort } from "./programme.port";

/**
 * Ports du témoignage — la frontière entre le domaine et la persistance.
 *
 * Même découpage lecture / écriture qu'aux Lots 8A et 8B (principe I de
 * SOLID) : une lecture publique reçoit un `TestimonialReadPort` et rien
 * d'autre. Elle ne peut pas écrire — pas par convention, mais parce que le
 * type ne le permet pas.
 *
 * ---------------------------------------------------------------------------
 * `reorder` EST BIEN LÀ, CONTRAIREMENT AU LOT 8B
 * ---------------------------------------------------------------------------
 * `testimonials` porte une colonne `position` (migration 0005) et
 * `reorder_rows` l'accepte dans sa liste blanche (migration 0012) : le
 * réordonnancement s'applique donc à la collection elle-même, comme pour les
 * programmes. C'est `articles` qui faisait exception, faute de `position` — un
 * fil d'actualités s'ordonne par date.
 */

export interface TestimonialReadPort {
  findAll(filter?: ListFilter): Promise<Testimonial[]>;
  findById(id: string): Promise<Testimonial | null>;
  count(filter?: ListFilter): Promise<number>;
  /**
   * Les témoignages publiés, dans l'ordre d'affichage.
   *
   * Séparé de `findAll({ status: 'published' })` pour la même raison qu'au Lot
   * 8B : la règle d'affichage public est UNE règle, et elle vit dans le dépôt
   * plutôt que d'être recopiée par chaque appelant.
   */
  findPublished(limit?: number): Promise<Testimonial[]>;
  /**
   * Combien de témoignages citent ce programme.
   *
   * Sert à expliquer AVANT d'agir pourquoi un programme ne pourra pas être
   * supprimé, plutôt que de laisser la base répondre 23503 après coup.
   */
  countByProgramme(programmeId: string): Promise<number>;
}

export interface TestimonialWritePort {
  create(input: CreateTestimonial): Promise<Testimonial>;
  update(id: string, input: UpdateTestimonial): Promise<Testimonial>;
  delete(id: string): Promise<void>;
  /** Réordonne en UNE transaction — `reorder_rows()` en RPC (§3.4). */
  reorder(orderedIds: string[]): Promise<void>;
  setStatus(id: string, status: ContentStatus): Promise<Testimonial>;
}

/**
 * Regroupement de confort pour les cas d'usage qui écrivent.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI `programmes` EST DANS CE TYPE
 * ---------------------------------------------------------------------------
 * Même raison qu'`ArticleDeps.categories` au Lot 8B : la création vérifie que
 * le programme cité EXISTE avant d'écrire. Sans cette lecture, un identifiant
 * inconnu — un POST direct, un programme supprimé entre l'affichage du
 * formulaire et l'envoi — atteindrait la contrainte de clé étrangère, et
 * PostgreSQL lèverait 23503. Or `mapPostgrestError` traduit ce code par « Ce
 * témoignage est utilisé ailleurs et ne peut pas être supprimé » : le message
 * juste pour une SUPPRESSION refusée, absurde pour une création.
 *
 * C'est un port de LECTURE : les témoignages ne modifient jamais un programme.
 */
export type TestimonialDeps = {
  read: TestimonialReadPort;
  write: TestimonialWritePort;
  programmes: ProgrammeReadPort;
};
