import type { ContentStatus } from "./content-status";

/**
 * Un témoignage — la parole d'une personne, citée sur le site.
 *
 * Reprise du type `Temoignage` de `src/content/temoignages.ts`, avec les
 * différences imposées par le passage en base :
 *
 *   1. `programmeSlug` devient `programmeId` : la base référence une clé
 *      primaire, pas une adresse. Le lien est en `on delete restrict`, ce qui
 *      fait qu'un programme cité ne peut pas être supprimé (migration 0005).
 *   2. La photo est un identifiant de média, plus un chemin de fichier.
 *      `temoignagePhoto(id)` disparaît — voir l'en-tête de
 *      `src/components/cards/testimonial-card.tsx` pour le raisonnement
 *      complet, qui n'est pas le même que celui des programmes.
 *   3. `hasConsent` apparaît. Il n'existait pas dans le tableau TypeScript
 *      parce qu'aucune des trois entrées n'est une vraie citation ; en base,
 *      c'est la trace de l'accord écrit exigé par le §8C.
 *   4. `placeholder` DISPARAÎT. La table n'a pas de colonne équivalente
 *      (migration 0005), contrairement à `articles.is_placeholder`. Les trois
 *      entrées actuelles portent `placeholder: false` : le badge « Témoignage
 *      à recueillir » n'est affiché nulle part aujourd'hui, et le rendu reste
 *      donc identique.
 *
 * ---------------------------------------------------------------------------
 * `hasConsent` N'EST PAS UN CHAMP COMME LES AUTRES
 * ---------------------------------------------------------------------------
 * C'est la seule règle du projet qui protège quelqu'un d'extérieur à
 * l'association. Elle est écrite en toutes lettres dans
 * `src/content/temoignages.ts` : « une citation n'est publiée que si la
 * personne l'a réellement prononcée et a donné son accord — pour le texte
 * comme pour la photo ».
 *
 * Elle est appliquée par `setTestimonialStatus`, qui refuse la publication
 * sans accord, et par `updateTestimonial`, qui refuse de retirer l'accord d'un
 * témoignage encore en ligne. Ni l'une ni l'autre n'est une vérification
 * d'interface : le formulaire est un confort, ces deux cas d'usage sont la
 * règle.
 */
export type Testimonial = {
  id: string;
  /** La citation. Courte — deux phrases suffisent. */
  quote: string;
  /** Prénom, ou prénom + initiale. Jamais un nom complet sans accord écrit. */
  authorName: string;
  /** Rôle : bénéficiaire, bénévole, partenaire… */
  authorRole: string;
  /** Programme concerné, pour relier le témoignage à une page. */
  programmeId: string | null;
  photoMediaId: string | null;
  /** Accord écrit de la personne citée. Sans lui, pas de mise en ligne. */
  hasConsent: boolean;
  position: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
};

/** Champs saisis à la création. Le reste est calculé ou par défaut. */
export type CreateTestimonial = Omit<
  Testimonial,
  "id" | "createdAt" | "updatedAt" | "position" | "status"
> & {
  position?: number;
  status?: ContentStatus;
};

/** Modification partielle. `id` identifie la cible, il n'est jamais modifiable. */
export type UpdateTestimonial = Partial<
  Omit<Testimonial, "id" | "createdAt" | "updatedAt">
>;
