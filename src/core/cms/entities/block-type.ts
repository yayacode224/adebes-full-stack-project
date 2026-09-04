/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LES 17 TYPES DE BLOCS — la liste, sans les schémas ni les rendus
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §10 du Rapport 1, tableau « Les blocs de la version 1 ». Aucun bloc n'est
 * inventé : chacun est dérivé d'une section qui existe DÉJÀ sur le site public,
 * relevée au §1 du Rapport 1.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI CETTE LISTE VIT SÉPARÉE DU REGISTRE
 * ---------------------------------------------------------------------------
 * Même raison qu'`icon-name.ts` au Lot 8E : une liste de CHAÎNES n'a aucune
 * dépendance, alors que le registre en a dix-sept (un schéma Zod par bloc). Un
 * schéma qui a besoin de connaître les types de blocs — celui d'une section de
 * page, par exemple — importe ce fichier et rien d'autre, sans embarquer les
 * dix-sept définitions.
 *
 * La liste est aussi ce que la BASE contient : `page_sections.block_type` est
 * une colonne `text` (migration 0006), pas un énuméré PostgreSQL. C'était le
 * bon choix — ajouter un bloc ne doit demander aucune migration SQL (§10,
 * propriété nº 1) — mais il déplace la garantie ici : c'est `isBlockType()` qui
 * décide si une chaîne lue en base désigne un bloc connu.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  UN TYPE RETIRÉ DE CETTE LISTE ORPHELINE DES SECTIONS EN BASE
 * ---------------------------------------------------------------------------
 * Les 30 sections squelettes du seed portent déjà sept de ces valeurs. Retirer
 * une entrée ne casse rien au rendu — `SectionRenderer` ignore un bloc inconnu
 * (§9.4) — mais les sections concernées deviennent invisibles ET inéditables.
 * Le retrait d'un bloc est donc une opération de migration de contenu, jamais
 * une simple suppression de ligne ici.
 */

export const BLOCK_TYPES = [
  "page-hero",
  "rich-text",
  "image-text",
  "stats-grid",
  "values-grid",
  "programmes-grid",
  "news-grid",
  "testimonials",
  "team-grid",
  "faq",
  "cta-banner",
  "gallery-preview",
  "video",
  "documents-list",
  "contact-info",
  "donation-options",
  "feature-list",
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export function isBlockType(valeur: unknown): valeur is BlockType {
  return (
    typeof valeur === "string" && (BLOCK_TYPES as readonly string[]).includes(valeur)
  );
}

/**
 * Les quatre familles du sélecteur de blocs (§10 du Rapport 1).
 *
 * Elles n'ont aucun effet sur le rendu : elles regroupent les cartes de la
 * modale d'ajout. Une personne qui cherche « comment mettre un bouton de don »
 * ouvre « Conversion » et trouve les trois blocs qui en relèvent, plutôt que de
 * parcourir dix-sept vignettes.
 */
export const BLOCK_CATEGORIES = [
  "contenu",
  "mise-en-avant",
  "conversion",
  "media",
] as const;

export type BlockCategory = (typeof BLOCK_CATEGORIES)[number];

export const BLOCK_CATEGORY_LABELS: Record<BlockCategory, string> = {
  contenu: "Contenu",
  "mise-en-avant": "Mise en avant",
  conversion: "Conversion",
  media: "Médias",
};

/**
 * Aide affichée sous chaque famille dans le sélecteur.
 *
 * Le §9.3 exige qu'« un utilisateur non technique comprenne ce qu'il ajoute
 * avant de l'ajouter ». La description du bloc l'explique ; celle de la famille
 * lui dit où chercher.
 */
export const BLOCK_CATEGORY_HINTS: Record<BlockCategory, string> = {
  contenu: "Du texte que vous rédigez vous-même.",
  "mise-en-avant": "Affiche automatiquement une collection déjà saisie ailleurs.",
  conversion: "Invite le visiteur à agir : don, bénévolat, contact.",
  media: "Images et vidéos.",
};
