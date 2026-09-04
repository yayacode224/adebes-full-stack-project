import Link from "next/link";

import { PageHero } from "@/components/layout/page-hero";
import { CmsImage } from "@/components/media/cms-image";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui-ext/breadcrumbs";
import type { PageHeroContent } from "@/core/cms/blocks/definitions/page-hero.block";
import { resoudreMedias } from "@/server/queries/media.query";

import type { ProprietesDeRendu } from "../types";

/**
 * Rendu du bloc « En-tête de page ».
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `image=""` N'EST PAS UN OUBLI
 * ---------------------------------------------------------------------------
 * `<PageHero>` accepte soit un chemin dans `/public` (`image`), soit un nœud
 * déjà rendu (`imageNode`) — et `imageNode` court-circuite entièrement
 * `image`. Le CMS étant du côté de la médiathèque, c'est toujours `imageNode`
 * qui est fourni ; `image` reste obligatoire dans la signature du composant,
 * héritée des neuf pages qui l'emploient encore avec un chemin en dur.
 *
 * Le supprimer de `<PageHero>` aurait demandé de migrer ces neuf pages dans le
 * même mouvement, sans rapport avec ce bloc.
 *
 * ---------------------------------------------------------------------------
 * SANS IMAGE, LE REPLI EST DÉJÀ CORRECT
 * ---------------------------------------------------------------------------
 * `<CmsImage>` rend son `<MediaPlaceholder>` à la teinte choisie dès que
 * l'asset manque — référence vide, média supprimé, variable d'environnement
 * absente. Le titre reste lisible par-dessus dans les trois cas : c'est
 * l'invariant nº 2 du projet, et il ne demande aucun code ici.
 */
export async function PageHeroRenderer({
  content,
  page,
}: ProprietesDeRendu<PageHeroContent>) {
  const medias = await resoudreMedias([content.mediaId]);
  const asset = content.mediaId ? medias.get(content.mediaId) : null;

  return (
    <PageHero
      eyebrow={content.eyebrow || undefined}
      title={content.title}
      subtitle={content.subtitle || undefined}
      tone={content.tone}
      image=""
      imageAlt=""
      imageNode={
        <CmsImage
          asset={asset}
          // L'image d'un hero est décorative : le titre porte l'information,
          // et un lecteur d'écran qui lit la description de la photo AVANT le
          // titre de la page dessert la compréhension.
          alt=""
          fill
          priority
          tone={content.tone}
          sizes="100vw"
        />
      }
      breadcrumb={
        content.showBreadcrumb ? (
          <Breadcrumbs
            tone="inverse"
            items={[
              { label: "Accueil", href: "/" },
              { label: page.title, href: page.route },
            ]}
          />
        ) : undefined
      }
      actions={
        content.ctaLabel && content.ctaHref ? (
          <Button asChild size="lg">
            <Link href={content.ctaHref}>{content.ctaLabel}</Link>
          </Button>
        ) : undefined
      }
    />
  );
}
