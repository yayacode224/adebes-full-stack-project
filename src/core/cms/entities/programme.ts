import type { ContentStatus } from "./content-status";
import type { MediaTone } from "./media-tone";

/**
 * Un programme d'intervention de l'association.
 *
 * Reprise fidèle du type `Programme` de `src/content/programmes.ts`, avec
 * trois différences imposées par le passage en base :
 *
 *   1. `icon` est une CHAÎNE (« GraduationCap ») et non un composant React.
 *      Le composant est retrouvé au rendu par `getIcon()`
 *      (`src/components/ui-ext/icon-registry.ts`).
 *   2. Les visuels sont des identifiants de médias, pas des chemins de
 *      fichiers. `programmeCover(slug)` disparaît : l'image est choisie dans la
 *      médiathèque, elle n'est plus déduite d'une convention de nommage.
 *   3. `id`, `position`, `status` et les horodatages apparaissent — ils
 *      n'existaient pas dans un tableau TypeScript ordonné à la main.
 *
 * Toutes les propriétés sont en `camelCase` : la forme SQL (`snake_case`,
 * `cover_media_id`) ne franchit jamais la frontière du mapper.
 */
export type Programme = {
  id: string;
  /** Adresse de la page : `/programmes/<slug>`. Unique. */
  slug: string;
  title: string;
  /** Titre court pour les fils d'Ariane et les cartes étroites. */
  shortTitle: string;
  summary: string;
  /** Nom d'icône lucide, résolu côté présentation. */
  icon: string;
  tone: MediaTone;
  /** « Ce que nous faisons ». */
  actions: string[];
  /** « À qui ce programme s'adresse ». */
  publics: string[];
  /** Besoins concrets — alimentent les CTA don / bénévolat de la page détail. */
  besoins: string[];
  /** ⚠️ Alimente la liste déroulante du formulaire de bénévolat. */
  benevolatLabel: string;
  coverMediaId: string | null;
  galleryMediaIds: string[];
  /** Corps long optionnel, en paragraphes. `null` tant qu'il n'est pas rédigé. */
  body: string[] | null;
  position: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
};

/** Champs saisis à la création. Le reste est calculé ou par défaut. */
export type CreateProgramme = Omit<
  Programme,
  "id" | "createdAt" | "updatedAt" | "position" | "status" | "slug"
> & {
  /** Facultatif : dérivé du titre s'il est absent. */
  slug?: string;
  position?: number;
  status?: ContentStatus;
};

/** Modification partielle. `id` identifie la cible, il n'est jamais modifiable. */
export type UpdateProgramme = Partial<Omit<Programme, "id" | "createdAt" | "updatedAt">>;
