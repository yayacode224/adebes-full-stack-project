import { z } from "zod";

import { VERSIONED_ENTITY_TYPES } from "../entities/content-version";
import { pageSchema } from "./page.schema";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SCHÉMAS DE L'HISTORIQUE DE CONTENU
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Ces schémas ne valident PAS un instantané : le `snapshot` est écrit par le
 * serveur à partir d'une entité déjà validée, il ne transite jamais par un
 * formulaire. Ils valident les deux seules entrées venues du client — la
 * demande de liste et la demande de restauration.
 */

/** Désigne l'historique d'une entité — écran d'historique du dashboard. */
export const listVersionsSchema = z.object(
  {
    entityType: z.enum(VERSIONED_ENTITY_TYPES, {
      message: "Type de contenu inconnu.",
    }),
    entityId: z.uuid("Identifiant de contenu invalide."),
  },
  { message: "Demande d'historique invalide." },
);

/**
 * Désigne la version à restaurer.
 *
 * On ne transmet que l'identifiant de la LIGNE d'historique : l'entité cible,
 * son type et le contenu à réappliquer sont lus en base à partir de lui. Une
 * charge utile qui porterait le snapshot lui-même laisserait un appelant
 * réécrire n'importe quoi sous couvert de « restauration ».
 */
export const restoreVersionSchema = z.object(
  { versionId: z.uuid("Identifiant de version invalide.") },
  { message: "Demande de restauration invalide." },
);

export type ListVersionsInput = z.infer<typeof listVersionsSchema>;
export type RestoreVersionInput = z.infer<typeof restoreVersionSchema>;

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  FORME D'UN INSTANTANÉ DE PAGE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Une page n'a de sens qu'avec ses sections : l'instantané les embarque. Le
 * `content` d'une section reste `unknown` — c'est du JSONB, et le valider
 * imposerait de connaître ici les dix-sept formes de bloc. Seuls la position,
 * la visibilité et le rattachement sont typés, ce qui suffit à la restauration
 * (qui réécrit le contenu tel quel) et à la comparaison.
 *
 * L'instantané d'un ARTICLE, lui, se valide avec `articleSchema` directement :
 * un article n'a pas d'agrégat.
 */
export const pageSnapshotSchema = pageSchema.extend({
  sections: z.array(
    z.object({
      id: z.uuid(),
      pageId: z.uuid(),
      blockType: z.string(),
      position: z.number().int(),
      content: z.unknown(),
      isVisible: z.boolean(),
      createdAt: z.string(),
      updatedAt: z.string(),
    }),
  ),
});

export type PageSnapshot = z.infer<typeof pageSnapshotSchema>;
