import { z } from "zod";

import {
  DEFAUTS_ENTETE,
  champLimite,
  champsEntete,
  enteteShape,
  libelleLienSchema,
  lienSchema,
  limiteSchema,
} from "../shared";
import type { BlockDefinition } from "../types";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  DERNIÈRES ACTUALITÉS — `<NewsCard>`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Jumeau du bloc « Grille de programmes », à une règle près qui vient du
 * Lot 8B : `getArticlesPublies()` rend déjà la liste **triée du plus récent au
 * plus ancien ET filtrée sur les dates échues**. Un article programmé pour le
 * mois prochain n'apparaît donc pas, sans qu'aucune condition ne soit répétée
 * ici ni dans le `Renderer`.
 *
 * `limit` vaut 3 sur l'accueil (une ligne pleine en `lg:grid-cols-3`) et `null`
 * sur `/actualites`.
 */

const schema = z.object(
  {
    ...enteteShape,
    limit: limiteSchema,
    ctaLabel: libelleLienSchema,
    ctaHref: lienSchema,
  },
  { message: "Contenu de grille d'actualités invalide." },
);

export type NewsGridContent = z.infer<typeof schema>;

export const newsGridBlock: BlockDefinition<typeof schema> = {
  type: "news-grid",
  label: "Dernières actualités",
  description:
    "Affiche les actualités publiées, de la plus récente à la plus ancienne. Une actualité datée du futur n'apparaît qu'à sa date.",
  category: "mise-en-avant",
  collection: "Actualités",
  schema,
  defaults: {
    ...DEFAUTS_ENTETE,
    limit: 3,
    ctaLabel: "",
    ctaHref: "",
  },
  fields: [
    ...champsEntete({ sansAlignement: true }),
    champLimite(
      "Cochez « pas de limite » pour afficher toutes les actualités publiées. Trois cartes tiennent sur une ligne.",
    ),
    {
      kind: "text",
      name: "ctaLabel",
      label: "Libellé du lien « voir tout »",
      maxLength: 60,
      hint: "Laissez vide pour ne pas afficher de lien.",
      placeholder: "Toutes les actualités",
    },
    {
      kind: "link",
      name: "ctaHref",
      label: "Lien « voir tout »",
      hint: "En général /actualites.",
    },
  ],
};
