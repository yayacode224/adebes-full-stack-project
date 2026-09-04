import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { CmsImage } from "@/components/media/cms-image";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui-ext/reveal";
import { SectionHeading } from "@/components/ui-ext/section-heading";
import type { ImageTextContent } from "@/core/cms/blocks/definitions/image-text.block";
import { cn } from "@/lib/utils";
import { resoudreMedias } from "@/server/queries/media.query";

import type { ProprietesDeRendu } from "../types";

/**
 * Rendu du bloc « Image + texte ».
 *
 * ---------------------------------------------------------------------------
 * ⚠️  N'EMPLOIE PAS `<BlockSection>`, ET C'EST LE SEUL BLOC DE CONTENU DANS CE
 *     CAS
 * ---------------------------------------------------------------------------
 * `<BlockSection>` place l'en-tête AU-DESSUS du contenu. Ici, l'en-tête vit
 * DANS la colonne de texte, à côté de l'image — c'est ce que font déjà les
 * sections « Qui sommes-nous » de l'accueil et « Notre mission » de
 * `/a-propos`, et c'est ce qui distingue ce bloc d'un texte libre surmonté
 * d'une image.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  L'IMAGE PASSE AU-DESSUS SOUS `lg:`, QUEL QUE SOIT `imageSide`
 * ---------------------------------------------------------------------------
 * `order-first` / `lg:order-last` plutôt qu'une inversion de l'ordre du DOM :
 * l'ordre de LECTURE d'un lecteur d'écran suit le DOM, et il doit rester
 * « image, puis texte » dans les deux configurations. Inverser le DOM aurait
 * fait lire le texte avant l'image sur une moitié des sections, sans que rien
 * ne le signale visuellement.
 */
export async function ImageTextRenderer({
  content,
}: ProprietesDeRendu<ImageTextContent>) {
  const medias = await resoudreMedias([content.mediaId]);
  const asset = content.mediaId ? medias.get(content.mediaId) : null;

  const paragraphes = content.paragraphs.filter((texte) => texte.trim());
  const puces = content.bullets.filter((texte) => texte.trim());

  return (
    <section className="py-14 lg:py-20">
      <Container size="wide">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal
            className={cn(content.imageSide === "right" && "lg:order-last")}
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted">
              <CmsImage
                asset={asset}
                fill
                tone={content.tone}
                sizes="(min-width: 1024px) 45vw, 90vw"
              />
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <SectionHeading
              badge={content.badge || undefined}
              title={content.title}
              subtitle={content.subtitle || undefined}
            />

            {paragraphes.length > 0 ? (
              <div className="mt-6 flex flex-col gap-4 text-[0.95rem] leading-relaxed text-muted-foreground">
                {paragraphes.map((paragraphe, index) => (
                  <p key={index}>{paragraphe}</p>
                ))}
              </div>
            ) : null}

            {puces.length > 0 ? (
              <ul className="mt-6 flex flex-col gap-3">
                {puces.map((puce) => (
                  <li
                    key={puce}
                    className="flex gap-3 text-[0.95rem] leading-relaxed text-muted-foreground"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-green"
                    />
                    {puce}
                  </li>
                ))}
              </ul>
            ) : null}

            {content.ctaLabel && content.ctaHref ? (
              <Button asChild variant="outline" className="mt-7">
                <Link href={content.ctaHref}>
                  {content.ctaLabel}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            ) : null}
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
