import type { BlockCategory, BlockType } from "../entities/block-type";
import { BLOCK_CATEGORIES, BLOCK_TYPES, isBlockType } from "../entities/block-type";
import { contactInfoBlock } from "./definitions/contact-info.block";
import { ctaBannerBlock } from "./definitions/cta-banner.block";
import { documentsListBlock } from "./definitions/documents-list.block";
import { donationOptionsBlock } from "./definitions/donation-options.block";
import { faqBlock } from "./definitions/faq.block";
import { featureListBlock } from "./definitions/feature-list.block";
import { galleryPreviewBlock } from "./definitions/gallery-preview.block";
import { imageTextBlock } from "./definitions/image-text.block";
import { newsGridBlock } from "./definitions/news-grid.block";
import { pageHeroBlock } from "./definitions/page-hero.block";
import { programmesGridBlock } from "./definitions/programmes-grid.block";
import { richTextBlock } from "./definitions/rich-text.block";
import { statsGridBlock } from "./definitions/stats-grid.block";
import { teamGridBlock } from "./definitions/team-grid.block";
import { testimonialsBlock } from "./definitions/testimonials.block";
import { valuesGridBlock } from "./definitions/values-grid.block";
import { videoBlock } from "./definitions/video.block";
import type { BlockDefinition } from "./types";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LE REGISTRE DE BLOCS — moitié domaine
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §10 du Rapport 1 : « c'est ce qui distingue un CMS d'une collection de
 * formulaires CRUD ». Les dix-sept définitions, agrégées.
 *
 * ---------------------------------------------------------------------------
 * `Record<BlockType, …>` EST LE VERROU DU LOT
 * ---------------------------------------------------------------------------
 * Le type de cette constante n'est pas décoratif : ajouter une valeur à
 * `BLOCK_TYPES` sans ajouter son entrée ici **casse la compilation**. Le
 * registre de présentation (`src/components/blocks/registry.tsx`) porte le même
 * verrou pour l'icône et le `Renderer`.
 *
 * C'est ce qui rend vraie la promesse de la recette : « ajouter un 18ᵉ bloc ne
 * demande qu'un fichier + une entrée de registre ». Pas parce que la
 * documentation le dit, mais parce que TypeScript refuse tout état
 * intermédiaire.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `satisfies` ET NON UNE ANNOTATION DE TYPE — LA NUANCE EST STRUCTURANTE
 * ---------------------------------------------------------------------------
 * Écrire `const BLOCK_DEFINITIONS: Record<BlockType, BlockDefinition> = {…}`
 * aurait ÉLARGI chaque entrée à `BlockDefinition`, dont le schéma est
 * `z.ZodType` : `z.infer` n'en tire alors plus que `unknown`, et le lien entre
 * un bloc et la forme de son contenu serait perdu à la sortie du registre.
 *
 * `satisfies` vérifie la même chose — les dix-sept clés, la forme de chaque
 * valeur — **en conservant le type précis de chacune**. C'est ce qui permet au
 * registre de présentation (`src/components/blocks/registry.tsx`) de se
 * déclarer ainsi :
 *
 *     Renderer: (props: { content: z.infer<(typeof BLOCK_DEFINITIONS)[T]["schema"]> }) => …
 *
 * autrement dit : **un `Renderer` qui n'attend pas exactement le contenu de
 * SON bloc ne compile pas.** Sans `satisfies`, les dix-sept rendus auraient
 * reçu `unknown` et chacun aurait dû se re-typer par une assertion — dix-sept
 * endroits où une erreur de branchement passe inaperçue.
 */

export const BLOCK_DEFINITIONS = {
  "page-hero": pageHeroBlock,
  "rich-text": richTextBlock,
  "image-text": imageTextBlock,
  "stats-grid": statsGridBlock,
  "values-grid": valuesGridBlock,
  "programmes-grid": programmesGridBlock,
  "news-grid": newsGridBlock,
  testimonials: testimonialsBlock,
  "team-grid": teamGridBlock,
  faq: faqBlock,
  "cta-banner": ctaBannerBlock,
  "gallery-preview": galleryPreviewBlock,
  video: videoBlock,
  "documents-list": documentsListBlock,
  "contact-info": contactInfoBlock,
  "donation-options": donationOptionsBlock,
  "feature-list": featureListBlock,
} satisfies Record<BlockType, BlockDefinition>;

/** Les dix-sept définitions, dans l'ordre de `BLOCK_TYPES`. */
export const BLOCK_LIST: readonly BlockDefinition[] = BLOCK_TYPES.map(
  (type) => BLOCK_DEFINITIONS[type],
);

/**
 * La définition d'un type lu en base, ou `null` s'il n'est plus connu.
 *
 * Renvoie `null` plutôt que de lever : `page_sections.block_type` est une
 * colonne `text`, elle peut contenir le nom d'un bloc retiré d'une version
 * antérieure. La page doit s'afficher sans lui (§16 du Rapport 1), pas tomber.
 */
export function getBlockDefinition(type: string): BlockDefinition | null {
  return isBlockType(type) ? BLOCK_DEFINITIONS[type] : null;
}

/** Les blocs d'une famille, pour les colonnes du sélecteur de blocs. */
export function blocsDeCategorie(categorie: BlockCategory): BlockDefinition[] {
  return BLOCK_LIST.filter((bloc) => bloc.category === categorie);
}

/** Les familles non vides, dans l'ordre déclaré. Aucune n'est vide aujourd'hui. */
export function categoriesNonVides(): BlockCategory[] {
  return BLOCK_CATEGORIES.filter(
    (categorie) => blocsDeCategorie(categorie).length > 0,
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  VALIDATION D'UN CONTENU DE SECTION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Le point de passage obligé entre le JSONB de `page_sections.content` et le
 * `Renderer`. Deux appelants : le rendu public (§9.4) et l'écran d'édition.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LA FUSION AVEC LES DÉFAUTS PRÉCÈDE LA VALIDATION, ET CE N'EST PAS UN
 *     ASSOUPLISSEMENT
 * ---------------------------------------------------------------------------
 * Sans elle, les **30 sections squelettes du seed** — qui portent `content =
 * '{}'` (écart nº 15) — échoueraient toutes à la validation et disparaîtraient
 * des dix pages éditoriales d'un coup. Le lot serait alors « livré » avec un
 * site vidé.
 *
 * La nuance qui compte : la fusion comble les champs ABSENTS, elle ne corrige
 * pas les champs FAUX. Un `content` portant `title: 42` échoue toujours, et la
 * section n'est pas rendue — c'est exactement ce que la recette du lot vérifie
 * en corrompant volontairement une ligne en base.
 *
 * La fusion est de surface, et délibérément : une fusion profonde aurait
 * complété les éléments d'une liste à moitié saisie, produisant des cartes
 * fantômes qu'aucun formulaire n'a jamais remplies.
 */
export type ResultatContenu =
  | { ok: true; contenu: unknown }
  | { ok: false; raison: "bloc-inconnu" | "contenu-invalide"; message: string };

function estObjet(valeur: unknown): valeur is Record<string, unknown> {
  return typeof valeur === "object" && valeur !== null && !Array.isArray(valeur);
}

/** Complète un contenu partiel par les valeurs par défaut du bloc. */
export function fusionnerAvecDefauts(
  definition: BlockDefinition,
  brut: unknown,
): Record<string, unknown> {
  const defauts = definition.defaults as Record<string, unknown>;
  return estObjet(brut) ? { ...defauts, ...brut } : { ...defauts };
}

export function parseContenu(type: string, brut: unknown): ResultatContenu {
  const definition = getBlockDefinition(type);
  if (!definition) {
    return {
      ok: false,
      raison: "bloc-inconnu",
      message: `Le type de bloc « ${type} » n'existe plus dans le registre.`,
    };
  }

  const analyse = definition.schema.safeParse(
    fusionnerAvecDefauts(definition, brut),
  );
  if (!analyse.success) {
    return {
      ok: false,
      raison: "contenu-invalide",
      message: `Le contenu de ce bloc « ${definition.label} » n'est pas valide et n'a pas été affiché.`,
    };
  }

  return { ok: true, contenu: analyse.data };
}
