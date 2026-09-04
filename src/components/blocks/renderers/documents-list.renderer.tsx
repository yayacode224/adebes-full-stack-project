import { Download, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui-ext/reveal";
import type { DocumentsListContent } from "@/core/cms/blocks/definitions/documents-list.block";
import {
  MENTION_AVEC_DOCUMENT,
  MENTION_SANS_DOCUMENT,
  PASTILLE_SANS_DOCUMENT,
} from "@/core/cms/entities/annual-report";
import { urlTelechargementMedia } from "@/lib/media-url";
import { cn } from "@/lib/utils";
import { getRapportsAnnuels } from "@/server/queries/annual-report.query";
import { resoudreMedias } from "@/server/queries/media.query";

import { BlockSection, PiedDeSection, enteteEstVide } from "../block-section";
import type { ProprietesDeRendu } from "../types";

/**
 * Rendu du bloc « Liste de documents ».
 *
 * ⚠️  UN RAPPORT SANS PDF RESTE LISTÉ, avec sa mention et sa pastille
 * « Bientôt disponible » au lieu du bouton. C'est l'état des DEUX rapports
 * actuellement en base (2025 et 2024) : `document_media_id` est nullable, il
 * n'y a donc aucune garde de publication (Lot 8I).
 *
 * Filtrer les rapports sans fichier aurait vidé la section entière et fait
 * disparaître l'engagement de transparence en même temps que les documents qui
 * le tiennent.
 *
 * Les trois libellés viennent de l'entité `AnnualReport`, pas d'ici : ils
 * décrivent l'état d'un rapport, pas un choix de mise en page.
 */
export async function DocumentsListRenderer({
  content,
}: ProprietesDeRendu<DocumentsListContent>) {
  const rapports = await getRapportsAnnuels();
  if (rapports.length === 0) return null;

  const documents = await resoudreMedias(
    rapports.map((rapport) => rapport.documentMediaId),
  );

  const lignes = rapports.map((rapport) => {
    const media = rapport.documentMediaId
      ? documents.get(rapport.documentMediaId)
      : undefined;

    return {
      id: rapport.id,
      title: rapport.title,
      href: media ? urlTelechargementMedia(media) : null,
    };
  });

  return (
    <BlockSection
      id="documents"
      entete={content}
      taille="default"
      espacement="page"
    >
      <ul
        className={cn(
          "flex flex-col gap-3",
          enteteEstVide(content) ? undefined : "mt-8",
        )}
      >
        {lignes.map((ligne, index) => (
          <Reveal as="li" key={ligne.id} delay={index * 0.06}>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <FileText className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="font-heading text-base font-semibold text-foreground">
                    {ligne.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ligne.href ? MENTION_AVEC_DOCUMENT : MENTION_SANS_DOCUMENT}
                  </p>
                </div>
              </div>

              {ligne.href ? (
                // `min-h-11` : cible tactile de 44 px (§12, règle 4). Un
                // `size="sm"` seul fait 32 px.
                <Button asChild variant="outline" size="sm" className="min-h-11">
                  <a href={ligne.href} download>
                    <Download className="size-4" aria-hidden="true" />
                    Télécharger
                    <span className="sr-only">
                      {" "}
                      le {ligne.title}, au format PDF
                    </span>
                  </a>
                </Button>
              ) : (
                <span className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground">
                  {PASTILLE_SANS_DOCUMENT}
                </span>
              )}
            </div>
          </Reveal>
        ))}
      </ul>

      <PiedDeSection
        texte={content.footerText}
        libelleLien={content.footerLinkLabel}
        href={content.footerHref}
        className="mt-6"
      />
    </BlockSection>
  );
}
