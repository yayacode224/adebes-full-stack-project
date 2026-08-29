/**
 * Teintes des visuels et des cartes.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI CE TYPE A DÉMÉNAGÉ ICI
 * ---------------------------------------------------------------------------
 * Le §2.5 du Rapport 2 demande de réutiliser `MediaTone` depuis
 * `src/components/media/media-placeholder.tsx` et de « ne pas le redéfinir ».
 * Mais le §4 interdit à `core/` d'importer `@/components` — règle vérifiée par
 * ESLint, et à juste titre : le domaine ne dépend pas du rendu.
 *
 * Les deux consignes sont contradictoires tant que le type vit dans la couche
 * présentation. La résolution respecte l'esprit des deux : le type DESCEND
 * dans le domaine, là où il aurait dû être dès le départ — c'est une donnée du
 * contenu, pas une notion de rendu — et `media-placeholder.tsx` le
 * ré-exporte. Aucun import existant n'est cassé, et il n'existe toujours
 * qu'une seule définition.
 *
 * Elle doit rester alignée sur l'énuméré PostgreSQL `public.media_tone`
 * (migration 0001).
 */

export const MEDIA_TONES = ["navy", "blue", "green", "orange", "neutral"] as const;

export type MediaTone = (typeof MEDIA_TONES)[number];

export function isMediaTone(valeur: unknown): valeur is MediaTone {
  return (
    typeof valeur === "string" && (MEDIA_TONES as readonly string[]).includes(valeur)
  );
}

/** Libellés des 5 pastilles du sélecteur de teinte (`kind: 'tone'`, Lot 6). */
export const MEDIA_TONE_LABELS: Record<MediaTone, string> = {
  navy: "Bleu nuit",
  blue: "Bleu",
  green: "Vert",
  orange: "Orange",
  neutral: "Neutre",
};
