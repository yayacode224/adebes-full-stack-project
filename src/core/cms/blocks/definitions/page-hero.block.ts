import { z } from "zod";

import { lienSchema, mediaIdSchema, sousTitreSchema, teinteSchema, titreSchema } from "../shared";
import type { BlockDefinition } from "../types";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  EN-TÊTE DE PAGE — `<PageHero>`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Le grand visuel plein cadre qui ouvre neuf des dix pages éditoriales. Seul
 * l'accueil fait exception : il rend `<HomeHero>`, un composant plus riche
 * (double appel à l'action, ruban de confiance) qui n'est pas paramétrable et
 * ne le devient pas ici.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `title` EST LE `<h1>` DE LA PAGE
 * ---------------------------------------------------------------------------
 * `<PageHero>` rend son titre en `<h1>`, et une page n'en a qu'un. Deux blocs
 * « En-tête de page » sur la même page produiraient deux `<h1>` — une faute
 * d'accessibilité que rien dans le rendu ne signale. L'écran de l'éditeur
 * l'interdit à l'ajout ; ce fichier ne peut pas le faire, un schéma ne voyant
 * que sa propre section.
 *
 * ---------------------------------------------------------------------------
 * L'IMAGE VIENT DE LA MÉDIATHÈQUE, PAS DE `/public`
 * ---------------------------------------------------------------------------
 * Les neuf pages actuelles passent un chemin en dur (`/images/hero/…`). Le bloc
 * porte un `mediaId` : c'est la seule forme éditable depuis le dashboard. La
 * migration du Lot 9.5 téléverse les visuels de hero dans le bucket `media`,
 * comme le Lot 8H l'a fait pour les photos de la galerie.
 *
 * `mediaId` à `null` n'est pas une panne : `<CmsImage>` rend son
 * `<MediaPlaceholder>` à la teinte choisie, et le titre reste lisible par-dessus
 * (invariant nº 2 — aucune image cassée).
 */

const schema = z.object(
  {
    /** Sur-titre vert au-dessus du `<h1>` : « Impact & transparence ». */
    eyebrow: z
      .string("Le sur-titre doit être du texte.")
      .trim()
      .max(60, "Ce sur-titre est trop long (60 caractères maximum)."),
    title: titreSchema,
    subtitle: sousTitreSchema,
    mediaId: mediaIdSchema,
    tone: teinteSchema,
    /**
     * Fil d'Ariane affiché sous le sur-titre.
     *
     * Booléen et non une liste de liens : le fil se DÉDUIT de la route de la
     * page, et le saisir à la main garantissait qu'il finirait par contredire
     * l'URL après un renommage.
     */
    showBreadcrumb: z.boolean("Choix invalide."),
    /** Bouton principal, masqué tant que son libellé est vide. */
    ctaLabel: z
      .string("Le libellé du bouton doit être du texte.")
      .trim()
      .max(60, "Ce libellé est trop long (60 caractères maximum)."),
    ctaHref: lienSchema,
  },
  { message: "Contenu d'en-tête de page invalide." },
);

export type PageHeroContent = z.infer<typeof schema>;

export const pageHeroBlock: BlockDefinition<typeof schema> = {
  type: "page-hero",
  label: "En-tête de page",
  description:
    "Le grand visuel qui ouvre la page, avec son titre principal. Une seule fois par page, tout en haut.",
  category: "contenu",
  schema,
  defaults: {
    eyebrow: "",
    title: "",
    subtitle: "",
    mediaId: null,
    tone: "navy",
    showBreadcrumb: false,
    ctaLabel: "",
    ctaHref: "",
  },
  fields: [
    {
      kind: "text",
      name: "eyebrow",
      label: "Sur-titre",
      maxLength: 60,
      hint: "Court texte vert au-dessus du titre. Laissez vide pour ne pas l'afficher.",
      placeholder: "Impact & transparence",
    },
    {
      kind: "text",
      name: "title",
      label: "Titre principal",
      required: true,
      maxLength: 120,
      hint: "C'est le titre principal de la page, celui que lisent les moteurs de recherche.",
    },
    {
      kind: "textarea",
      name: "subtitle",
      label: "Sous-titre",
      maxLength: 300,
      rows: 3,
    },
    {
      kind: "media",
      name: "mediaId",
      label: "Image de fond",
      accept: "image",
      hint: "Sans image, un aplat coloré est affiché à la place. Le titre reste lisible dans les deux cas.",
    },
    {
      kind: "tone",
      name: "tone",
      label: "Teinte",
      required: true,
      hint: "Couleur de l'aplat affiché tant qu'aucune image n'est choisie.",
    },
    {
      kind: "boolean",
      name: "showBreadcrumb",
      label: "Afficher le fil d'Ariane",
      hint: "« Accueil › Nom de la page », déduit de l'adresse de la page.",
    },
    {
      kind: "text",
      name: "ctaLabel",
      label: "Libellé du bouton",
      maxLength: 60,
      hint: "Laissez vide pour ne pas afficher de bouton.",
    },
    {
      kind: "link",
      name: "ctaHref",
      label: "Lien du bouton",
    },
  ],
};
