"use server";

import type { MediaAsset, MediaUsage } from "@/core/cms/entities/media-asset";
import {
  mediaFilterSchema,
  mediaIdSchema,
  mediaIdsSchema,
  updateMediaSchema,
  uploadMediaSchema,
} from "@/core/cms/schemas/media.schema";
import type { Page } from "@/core/shared/pagination";
import { deleteMedia, listMediaUsages } from "@/core/use-cases/media/delete-media";
import { getMedia, getMediaByIds } from "@/core/use-cases/media/get-media";
import { listMedia, listMediaFolders } from "@/core/use-cases/media/list-media";
import { updateMedia } from "@/core/use-cases/media/update-media";
import { uploadMedia } from "@/core/use-cases/media/upload-media";

import { createAction } from "../action-kit/create-action";
import { RATE_LIMITS } from "../action-kit/rate-limit";
import { mediaDeps, mediaReadPort } from "../deps/media.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SERVER ACTIONS DE LA MÉDIATHÈQUE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Toutes passent par `createAction` — aucune exception (décision D3). Une
 * Server Action est une frontière publique : `televerserMediaAction` est
 * joignable par un POST direct, et sans le décorateur ce serait une API
 * d'upload ouverte.
 *
 * ---------------------------------------------------------------------------
 * DEUX LECTURES PASSENT AUSSI PAR LE DÉCORATEUR
 * ---------------------------------------------------------------------------
 * `listerMediasAction` et `listerUsagesMediaAction` ne mutent rien, mais elles
 * sont appelées DEPUIS LE NAVIGATEUR — la grille se recharge à chaque frappe
 * dans la recherche, et le `<MediaPicker>` parcourt la médiathèque sans
 * recharger la page. Ce sont donc des frontières publiques au même titre que
 * les autres, et elles exigent `media:read`.
 *
 * Elles n'ont ni `audit` (consulter n'est pas un événement) ni `invalidates`
 * (une lecture n'invalide rien).
 *
 * ---------------------------------------------------------------------------
 * ÉTIQUETTES DE CACHE (§11 du Rapport 1)
 * ---------------------------------------------------------------------------
 * `cms:media` pour la collection, `cms:media:<id>` pour l'élément. Les écrans
 * publics ne lisent pas encore la médiathèque (Lot 8 et suivants) ; les
 * étiquettes sont posées dès maintenant pour que la bascule du Lot 15 n'ait
 * pas à repasser sur ces actions.
 */

const ETIQUETTE_COLLECTION = "cms:media";

/* ═══════════════════════════════════════════════════════════════════════════
 * Lecture
 * ═══════════════════════════════════════════════════════════════════════════ */

export const listerMediasAction = createAction<
  typeof mediaFilterSchema,
  Page<MediaAsset>
>({
  permission: "media:read",
  input: mediaFilterSchema,
  handler: async ({ input }) => listMedia(await mediaReadPort(), input),
});

export const listerDossiersMediaAction = createAction<
  typeof mediaFilterSchema,
  string[]
>({
  permission: "media:read",
  // Aucune entrée n'est nécessaire, mais `createAction` exige un schéma :
  // celui de la liste est réutilisé, tous ses champs étant facultatifs.
  input: mediaFilterSchema,
  handler: async () => listMediaFolders(await mediaReadPort()),
});

/**
 * Un média par son identifiant.
 *
 * Sert au champ `media` d'un formulaire : la valeur enregistrée est un
 * `mediaId` (§7.3), et l'écran doit pouvoir en afficher la vignette sans que
 * chaque formulaire ait à charger toute la médiathèque.
 */
export const lireMediaAction = createAction<typeof mediaIdSchema, MediaAsset>({
  permission: "media:read",
  input: mediaIdSchema,
  handler: async ({ input }) => getMedia(await mediaReadPort(), input.id),
});

/**
 * Plusieurs médias par leurs identifiants.
 *
 * Sert au champ `media` en mode MULTIPLE (`galleryMediaIds`, §8A.2) : le
 * formulaire ne connaît que des identifiants et doit en afficher les
 * vignettes. Un appel par image ferait vingt-quatre allers-retours.
 *
 * ⚠️  La réponse peut être plus courte que la demande — un identifiant devenu
 * mort n'y figure pas. C'est ce qui permet à l'appelant de le SIGNALER au lieu
 * d'afficher une image cassée (invariant nº 2).
 */
export const lireMediasAction = createAction<typeof mediaIdsSchema, MediaAsset[]>({
  permission: "media:read",
  input: mediaIdsSchema,
  handler: async ({ input }) => getMediaByIds(await mediaReadPort(), input.ids),
});

export const listerUsagesMediaAction = createAction<
  typeof mediaIdSchema,
  MediaUsage[]
>({
  permission: "media:read",
  input: mediaIdSchema,
  handler: async ({ input }) => listMediaUsages(await mediaReadPort(), input.id),
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Écriture
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Téléverser un fichier.
 *
 * `media:create` — un éditeur téléverse (matrice du §9 : « Téléverser un
 * média » ✅ pour les trois rôles).
 *
 * La limitation de débit est celle du §16.1, déjà déclarée au Lot 4 :
 * 30 fichiers par heure et par adresse. Elle est ici pour la même raison que
 * sur les formulaires publics — un compte compromis ne doit pas pouvoir
 * remplir le bucket en une nuit — et elle laisse largement passer le cas
 * réel : le dépôt d'une série de photos après une action de terrain.
 */
export const televerserMediaAction = createAction<
  typeof uploadMediaSchema,
  MediaAsset
>({
  permission: "media:create",
  input: uploadMediaSchema,
  rateLimit: RATE_LIMITS.televersement,
  audit: {
    action: "media.create",
    entityType: "media",
    entityId: (media) => media.id,
  },
  invalidates: () => [ETIQUETTE_COLLECTION],
  handler: async ({ input, actor }) =>
    uploadMedia(await mediaDeps(), {
      file: input.file,
      /*
        Le nom d'origine sert à l'AFFICHAGE seulement : le fichier stocké porte
        un UUID (§3.5 du Rapport 2).

        Il vient du champ `filename` et non de `file.name` : la compression
        client reconstruit le fichier en WebP, et son `name` porte alors une
        extension que l'utilisateur n'a jamais vue. Repli sur `file.name` pour
        un appel qui ne le fournirait pas.
      */
      filename: input.filename ?? input.file.name,
      altText: input.altText,
      caption: input.caption,
      folder: input.folder,
      width: input.width,
      height: input.height,
      uploadedBy: actor?.id ?? null,
    }),
});

/**
 * Corriger la fiche d'un média.
 *
 * `media:update` — RÉSERVÉ AUX ADMINISTRATEURS. Ce n'est pas un oubli de la
 * matrice : un éditeur téléverse ses fichiers avec leur description, mais ne
 * réécrit pas celle des autres. La RLS dit la même chose
 * (`media_assets_admin_update`, migration 0009).
 */
export const mettreAJourMediaAction = createAction<
  typeof updateMediaSchema,
  MediaAsset
>({
  permission: "media:update",
  input: updateMediaSchema,
  audit: {
    action: "media.update",
    entityType: "media",
    entityId: (media) => media.id,
  },
  invalidates: (media) => [ETIQUETTE_COLLECTION, `cms:media:${media.id}`],
  handler: async ({ input }) => updateMedia(await mediaDeps(), input),
});

/**
 * Supprimer un média.
 *
 * `media:delete` — administrateurs seulement (matrice du §9 : « Supprimer un
 * média » ❌ pour l'éditeur), doublé par la RLS et par les politiques Storage
 * de la migration 0011.
 *
 * Le cas d'usage refuse la suppression tant qu'un usage BLOQUANT existe, et
 * renvoie la liste des usages non bloquants : l'interface peut alors dire
 * combien d'éléments viennent de perdre leur illustration.
 */
export const supprimerMediaAction = createAction<
  typeof mediaIdSchema,
  { id: string; usages: MediaUsage[] }
>({
  permission: "media:delete",
  input: mediaIdSchema,
  audit: {
    action: "media.delete",
    entityType: "media",
    entityId: (resultat) => resultat.id,
  },
  invalidates: (resultat) => [
    ETIQUETTE_COLLECTION,
    `cms:media:${resultat.id}`,
  ],
  handler: async ({ input }) => deleteMedia(await mediaDeps(), input.id),
});
