import { CmsImage } from "@/components/media/cms-image";
import { VideoEmbed, type VideoSource } from "@/components/media/video-embed";
import { Reveal } from "@/components/ui-ext/reveal";
import type { VideoContent } from "@/core/cms/blocks/definitions/video.block";
import { cn } from "@/lib/utils";
import { resoudreMedias } from "@/server/queries/media.query";

import { BlockSection, enteteEstVide } from "../block-section";
import type { ProprietesDeRendu } from "../types";

/**
 * Rendu du bloc « Vidéo ».
 *
 * ⚠️  « Aucune vidéo » N'EST PAS UNE ERREUR : c'est l'état actuel de la
 * section vidéo de `/galerie`. `<VideoEmbed>` affiche alors l'aperçu surmonté
 * de « Vidéo à venir — <titre> ». Le §1 du Rapport 1 en fait une règle : un
 * lecteur qui n'ouvre rien serait un lien mort, une mention honnête n'en est
 * pas un.
 *
 * ⚠️  L'aperçu est passé en `posterNode` — le chemin `/public` de
 * `<VideoEmbed>` ne sait pas lire la médiathèque. Sans cette échappatoire
 * (ajoutée au composant par ce lot), ce rendu aurait dû recomposer à la main
 * la mention « Vidéo à venir », qui aurait alors existé en deux exemplaires
 * libres de diverger.
 */
export async function VideoRenderer({ content }: ProprietesDeRendu<VideoContent>) {
  const medias = await resoudreMedias([content.posterMediaId]);
  const poster = content.posterMediaId
    ? medias.get(content.posterMediaId)
    : null;

  const source: VideoSource =
    content.provider === "none" || !content.videoId
      ? null
      : { provider: content.provider, id: content.videoId };

  // Le titre lu par les lecteurs d'écran, et repris par la mention « à venir ».
  // Trois replis en cascade : jamais de mention « Vidéo à venir — » orpheline.
  const titre = content.videoTitle || content.title || "Vidéo";

  return (
    <BlockSection entete={content} taille="default" espacement="page">
      <Reveal delay={0.08}>
        <div className={cn(enteteEstVide(content) ? undefined : "mt-8")}>
          <VideoEmbed
            source={source}
            title={titre}
            tone={content.tone}
            posterNode={
              <CmsImage
                asset={poster}
                // Aperçu décoratif : le titre de la vidéo porte l'information,
                // et il est annoncé juste à côté.
                alt=""
                fill
                kind="video"
                tone={content.tone}
                sizes="(min-width: 1024px) 60vw, 100vw"
                placeholderLabel={titre}
              />
            }
          />
        </div>
      </Reveal>
    </BlockSection>
  );
}
