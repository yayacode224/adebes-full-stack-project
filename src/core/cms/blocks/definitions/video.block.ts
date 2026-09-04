import { z } from "zod";

import {
  DEFAUTS_ENTETE_ALIGNE,
  champsEntete,
  enteteAligneShape,
  mediaIdSchema,
  teinteSchema,
} from "../shared";
import type { BlockDefinition } from "../types";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  VIDÉO — `<VideoEmbed>`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Une vidéo YouTube ou Vimeo, précédée de son image d'aperçu.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  « AUCUNE VIDÉO » EST UN ÉTAT PRÉVU, PAS UNE ERREUR DE SAISIE
 * ---------------------------------------------------------------------------
 * C'est même l'état ACTUEL du site : la section vidéo de `/galerie` existe et
 * aucune vidéo n'a été fournie. `<VideoEmbed>` rend alors l'image d'aperçu
 * surmontée de la mention « Vidéo à venir — <titre> ».
 *
 * Le §1 du Rapport 1 en fait une règle : aucun lien mort. Un lecteur qui
 * n'ouvre rien serait un lien mort déguisé ; une mention honnête n'en est pas
 * un. C'est pourquoi `provider` porte une troisième valeur — `none` — plutôt
 * que d'être facultatif : l'absence de vidéo se DÉCLARE.
 *
 * ---------------------------------------------------------------------------
 * `videoId`, PAS UNE URL
 * ---------------------------------------------------------------------------
 * `<VideoEmbed>` compose lui-même l'URL d'intégration, et il le fait vers
 * `youtube-nocookie.com` — aucun cookie tiers n'est déposé tant que la vidéo
 * n'est pas lue. Accepter une URL complète aurait laissé coller un lien
 * `youtube.com` ordinaire et perdu cette garantie sans que rien ne le signale.
 *
 * L'identifiant est la fin de l'adresse : `https://youtu.be/dQw4w9WgXcQ` →
 * `dQw4w9WgXcQ`. L'aide du champ le dit, parce que personne ne le devine.
 */

const schema = z.object(
  {
    ...enteteAligneShape,
    provider: z.enum(["none", "youtube", "vimeo"], {
      message: "Choisissez une plateforme.",
    }),
    videoId: z
      .string("L'identifiant doit être du texte.")
      .trim()
      .max(60, "Cet identifiant est trop long (60 caractères maximum)."),
    /** Titre lu par les lecteurs d'écran, et repris par la mention « à venir ». */
    videoTitle: z
      .string("Le titre de la vidéo doit être du texte.")
      .trim()
      .max(120, "Ce titre est trop long (120 caractères maximum)."),
    posterMediaId: mediaIdSchema,
    tone: teinteSchema,
  },
  { message: "Contenu de bloc vidéo invalide." },
);

export type VideoContent = z.infer<typeof schema>;

export const videoBlock: BlockDefinition<typeof schema> = {
  type: "video",
  label: "Vidéo",
  description:
    "Une vidéo YouTube ou Vimeo, avec son image d'aperçu. Tant qu'aucune vidéo n'est fournie, l'aperçu annonce « vidéo à venir ».",
  category: "media",
  schema,
  defaults: {
    ...DEFAUTS_ENTETE_ALIGNE,
    provider: "none",
    videoId: "",
    videoTitle: "",
    posterMediaId: null,
    tone: "navy",
  },
  fields: [
    ...champsEntete(),
    {
      kind: "select",
      name: "provider",
      label: "Plateforme",
      options: [
        { value: "none", label: "Aucune vidéo pour l'instant" },
        { value: "youtube", label: "YouTube" },
        { value: "vimeo", label: "Vimeo" },
      ],
      required: true,
      hint: "« Aucune vidéo » affiche l'aperçu et la mention « vidéo à venir ». Rien n'est cassé.",
    },
    {
      kind: "text",
      name: "videoId",
      label: "Identifiant de la vidéo",
      maxLength: 60,
      hint: "La fin de l'adresse, pas l'adresse entière : pour https://youtu.be/dQw4w9WgXcQ, saisissez dQw4w9WgXcQ.",
    },
    {
      kind: "text",
      name: "videoTitle",
      label: "Titre de la vidéo",
      maxLength: 120,
      hint: "Lu par les lecteurs d'écran, et repris par la mention « vidéo à venir ».",
    },
    {
      kind: "media",
      name: "posterMediaId",
      label: "Image d'aperçu",
      accept: "image",
      hint: "Affichée avant la lecture. Sans elle, un aplat coloré tient la place.",
    },
    {
      kind: "tone",
      name: "tone",
      label: "Teinte de l'aplat",
      required: true,
    },
  ],
};
