import { z } from "zod";

import {
  DEFAUTS_ENTETE_ALIGNE,
  champLimite,
  champsEntete,
  enteteAligneShape,
  libelleLienSchema,
  lienSchema,
  limiteSchema,
} from "../shared";
import type { BlockDefinition } from "../types";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  APERÇU DE LA GALERIE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Les photos publiées, dans l'ordre de `/dashboard/galerie`. Deux usages :
 * la grille filtrable complète de `/galerie`, et un aperçu de quelques photos
 * sur une autre page.
 *
 * ---------------------------------------------------------------------------
 * `showFilters` DÉCIDE LEQUEL DES DEUX
 * ---------------------------------------------------------------------------
 * Avec filtres, le bloc rend la grille interactive de `/galerie` — un composant
 * client, avec ses onglets de catégorie. Sans filtres, il rend une grille
 * statique : c'est la forme qui convient à un aperçu de six photos posé au
 * milieu d'une page éditoriale, où une barre de filtres serait hors sujet.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `categorySlug` EST UNE CHAÎNE LIBRE, ET C'EST UN COMPROMIS ASSUMÉ
 * ---------------------------------------------------------------------------
 * Les catégories de galerie sont gérables depuis le dashboard : leur liste
 * n'est pas connue à la compilation, donc pas exprimable en `z.enum`. Le champ
 * est déclaré `kind: 'reference'` — `<SchemaForm>` va chercher les catégories
 * existantes et propose un vrai sélecteur — mais le SCHÉMA ne peut vérifier que
 * la forme.
 *
 * Le `Renderer` traite une catégorie inconnue comme « toutes » plutôt que de
 * rendre une grille vide : supprimer une catégorie depuis `/dashboard/galerie`
 * ne doit pas vider une section sans que rien ne le dise.
 */

const schema = z.object(
  {
    ...enteteAligneShape,
    /** Slug de catégorie, ou chaîne vide pour toutes les photos. */
    categorySlug: z
      .string("La catégorie doit être du texte.")
      .trim()
      .max(80, "Identifiant de catégorie trop long."),
    limit: limiteSchema,
    /** Rend la grille filtrable de `/galerie` plutôt qu'un aperçu figé. */
    showFilters: z.boolean("Choix invalide."),
    ctaLabel: libelleLienSchema,
    ctaHref: lienSchema,
  },
  { message: "Contenu d'aperçu de galerie invalide." },
);

export type GalleryPreviewContent = z.infer<typeof schema>;

export const galleryPreviewBlock: BlockDefinition<typeof schema> = {
  type: "gallery-preview",
  label: "Aperçu de la galerie",
  description:
    "Affiche les photos publiées de la galerie, avec ou sans filtres par catégorie.",
  category: "media",
  collection: "Galerie",
  schema,
  defaults: {
    ...DEFAUTS_ENTETE_ALIGNE,
    categorySlug: "",
    limit: null,
    showFilters: false,
    ctaLabel: "",
    ctaHref: "",
  },
  fields: [
    ...champsEntete(),
    {
      kind: "reference",
      name: "categorySlug",
      label: "Catégorie",
      resource: "gallery",
      hint: "Laissez vide pour afficher toutes les photos.",
    },
    champLimite("Cochez « pas de limite » pour afficher toutes les photos.", "Nombre de photos affichées"),
    {
      kind: "boolean",
      name: "showFilters",
      label: "Afficher les filtres par catégorie",
      hint: "À réserver à une page dédiée à la galerie. Sur une page éditoriale, un aperçu figé est plus lisible.",
    },
    {
      kind: "text",
      name: "ctaLabel",
      label: "Libellé du lien « voir tout »",
      maxLength: 60,
      hint: "Laissez vide pour ne pas afficher de lien.",
      placeholder: "Voir toute la galerie",
    },
    {
      kind: "link",
      name: "ctaHref",
      label: "Lien « voir tout »",
      hint: "En général /galerie.",
    },
  ],
};
