import {
  Clapperboard,
  FileText,
  Gem,
  Grid3x3,
  HandCoins,
  HelpCircle,
  Images,
  LayoutPanelTop,
  ListChecks,
  MailPlus,
  Megaphone,
  Newspaper,
  PanelTop,
  Quote,
  TrendingUp,
  Type,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { BlockType } from "@/core/cms/entities/block-type";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  L'ICÔNE DE CHAQUE BLOC DANS LE SÉLECTEUR
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ---------------------------------------------------------------------------
 * POURQUOI CE FICHIER EST SÉPARÉ DU REGISTRE DE RENDUS
 * ---------------------------------------------------------------------------
 * Le sélecteur de blocs et l'arbre des sections sont des composants CLIENT du
 * dashboard. Les `Renderer`, eux, lisent la base : ce sont des Server
 * Components, et leurs modules importent `server-only`.
 *
 * Réunir les deux dans un seul registre aurait rendu ce registre inatteignable
 * depuis le dashboard — l'import de `server-only` fait échouer la compilation
 * dès qu'un composant client le tire, directement ou par ricochet. Les icônes
 * vivent donc à part, dans un module qui n'importe que `lucide-react`.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  CE NE SONT PAS LES ICÔNES DE `ICON_NAMES`
 * ---------------------------------------------------------------------------
 * `core/cms/entities/icon-name.ts` porte les 22 icônes du CONTENU — celles
 * qu'un rédacteur choisit pour une valeur, un programme ou une puce. Celles-ci
 * décrivent un OUTIL, jamais un contenu, et n'ont aucune raison d'apparaître
 * dans le sélecteur d'icônes d'un formulaire.
 *
 * Les mêler aurait fait apparaître « Bandeau » et « Colonnes » dans la grille
 * d'icônes d'une valeur de l'association.
 *
 * ⚠️  `Record<BlockType, LucideIcon>` : ajouter un bloc sans lui donner
 * d'icône casse la compilation. Même verrou qu'entre `ICON_NAMES` et `ICONS`.
 */
export const BLOCK_ICONS: Record<BlockType, LucideIcon> = {
  "page-hero": PanelTop,
  "rich-text": Type,
  "image-text": LayoutPanelTop,
  "stats-grid": TrendingUp,
  "values-grid": Gem,
  "programmes-grid": Grid3x3,
  "news-grid": Newspaper,
  testimonials: Quote,
  "team-grid": Users,
  faq: HelpCircle,
  "cta-banner": Megaphone,
  "gallery-preview": Images,
  video: Clapperboard,
  "documents-list": FileText,
  "contact-info": MailPlus,
  "donation-options": HandCoins,
  "feature-list": ListChecks,
};
