import "server-only";

import { cache } from "react";

import type { MediaAsset } from "@/core/cms/entities/media-asset";
import { getMediaByIds } from "@/core/use-cases/media/get-media";
import { createPublicClient } from "@/infrastructure/supabase/clients/public";
import { SupabaseMediaRepository } from "@/infrastructure/supabase/repositories/media.repository";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  RÉSOLUTION PUBLIQUE DES MÉDIAS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Le contenu ne stocke que des identifiants (§7.3 : « renvoie un `mediaId`,
 * jamais une URL »). Le site public doit donc résoudre ces identifiants en
 * `MediaAsset` pour que `<CmsImage>` dispose de l'URL, du type MIME et surtout
 * du TEXTE ALTERNATIF, qui est saisi une seule fois, par la personne qui
 * connaît la photo.
 *
 * `media_assets` est en lecture publique (`media_assets_public_read`,
 * migration 0009) : le client anonyme suffit.
 *
 * Même écart que `programmes.query.ts` : pas encore `'use cache'`, faute de
 * `cacheComponents` avant le Lot 15. L'étiquette est néanmoins nommée ici et
 * déjà invalidée par `media.actions.ts`.
 */

export const ETIQUETTE_MEDIAS = "cms:media";

/**
 * Les médias correspondant à ces identifiants, indexés par identifiant.
 *
 * ⚠️  Un identifiant absent de la table est absent de la Map — il n'y a pas
 * d'entrée `undefined` à distinguer d'une entrée nulle. C'est ce qui rend
 * l'invariant nº 2 tenable au rendu : `<CmsImage asset={undefined}>` retombe
 * sur son `MediaPlaceholder` au lieu de produire une image cassée.
 *
 * Le retour est une Map plutôt qu'un tableau parce que l'appelant a un
 * identifiant en main, pas un rang : `parId.get(programme.coverMediaId)`.
 */
export const getMediasPublies = cache(
  async (cleIdentifiants: string): Promise<Map<string, MediaAsset>> => {
    const ids = cleIdentifiants.split(",").filter(Boolean);
    if (ids.length === 0) return new Map();

    const repository = new SupabaseMediaRepository(createPublicClient());
    const resultat = await getMediaByIds(repository, ids);

    /*
      Un échec de lecture des médias ne doit PAS casser la page.

      La différence avec `programmes.query.ts` est délibérée : sans les
      programmes il n'y a pas de page, alors que sans les visuels il reste le
      texte — et le repli sur `MediaPlaceholder` est précisément le
      comportement conçu pour ce cas. Faire tomber `/programmes` parce qu'une
      vignette manque serait une régression.
    */
    if (!resultat.ok) return new Map();

    return new Map(resultat.value.map((media) => [media.id, media]));
  },
);

/**
 * Confort d'appel : accepte des identifiants éventuellement `null`.
 *
 * La clé de mémoïsation est une CHAÎNE et non un tableau : `cache()` compare
 * ses arguments par référence, et un tableau reconstruit à chaque appel
 * relancerait la requête à chaque section de page.
 */
export function resoudreMedias(
  identifiants: readonly (string | null | undefined)[],
): Promise<Map<string, MediaAsset>> {
  const uniques = [...new Set(identifiants.filter((id): id is string => !!id))];
  return getMediasPublies(uniques.sort().join(","));
}
