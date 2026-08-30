import type { Metadata } from "next";

import { GalleryGrid } from "@/components/galerie/gallery-grid";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { CmsImage } from "@/components/media/cms-image";
import { VideoEmbed } from "@/components/media/video-embed";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { CTABanner } from "@/components/ui-ext/cta-banner";
import { Reveal } from "@/components/ui-ext/reveal";
import { SectionHeading } from "@/components/ui-ext/section-heading";
import {
  categoriesAffichees,
  libelleDeLaCategorie,
  teinteDeLElement,
} from "@/core/cms/entities/gallery";
import {
  getCategoriesGalerie,
  getElementsGalerie,
} from "@/server/queries/gallery.query";
import { resoudreMedias } from "@/server/queries/media.query";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /galerie — BASCULÉE SUR LA BASE (§8H)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ---------------------------------------------------------------------════
 * CE QUE CETTE PAGE FAISAIT AVANT, ET QUI DISPARAÎT
 * ---------------------------------------------------------------------════
 * `getGalerieItems()` lisait `public/images/galerie/` au moment du BUILD,
 * déduisait la catégorie du préfixe du nom de fichier (`education-01.jpeg`) et
 * cherchait les légendes dans un `legendes.json` facultatif — absent, en
 * pratique, ce qui faisait GÉNÉRER les textes alternatifs (« Action ADEBES —
 * éducation (photo 1) »).
 *
 * Les quatre photographies réelles ont été migrées : téléversées dans Storage,
 * cataloguées dans `media_assets` avec **exactement le texte alternatif qui
 * était affiché**, puis rattachées à leur catégorie par un `gallery_items`
 * publié. Le rendu est donc identique pour les données migrées, ce que la
 * recette vérifie — et il devient corrigeable depuis le dashboard, ce qui
 * n'était pas le cas.
 *
 * ---------------------------------------------------------------------════
 * ⚠️  `force-dynamic` — SECONDE PAGE ENTIÈREMENT STATIQUE QUE LE CMS CONVERTIT
 * ---------------------------------------------------------------------════
 * Comme `/impact` au Lot 8G (écart nº 131), et pour la même raison : cette page
 * ne lisait RIEN de la base avant ce lot. Sans la directive, la grille serait
 * prérendue au build et ajouter une photo depuis le dashboard ne changerait
 * rien jusqu'au prochain déploiement.
 *
 * L'étiquette `cms:page:galerie` est nouvelle. Voir `gallery.query.ts` pour ce
 * que le Lot 15 aura à faire ici — trois gestes, déjà listés.
 *
 * ---------------------------------------------------------------------════
 * TROIS DÉCISIONS D'AFFICHAGE, TOUTES PRISES DANS LE DOMAINE
 * ---------------------------------------------------------------------════
 *   1. **Les boutons de filtre ne montrent que les catégories EMPLOYÉES**
 *      (`categoriesAffichees`). `gallery_categories` est lisible sans
 *      condition : rendre un bouton par ligne donnerait un filtre menant à une
 *      grille vide, cul-de-sac que le visiteur prend pour une panne.
 *   2. **Une photo sans catégorie reste visible**, dans « Tous » seulement
 *      (`apparaitDansUnFiltre`). Elle n'est ni masquée — ce serait perdre du
 *      contenu — ni dotée d'un bouton « Sans catégorie », qui exposerait au
 *      visiteur une lacune de classement interne.
 *   3. **La section entière disparaît si aucune photo n'est publiée.** Règle
 *      établie depuis le Lot 8B : une grille vide surmontée de boutons de
 *      filtre annoncerait un contenu absent.
 *
 * ⚠️  La section VIDÉO, elle, ne dépend pas de la galerie et reste inchangée :
 * `<VideoEmbed source={null}>` rend son affiche et n'appelle rien. Elle
 * appartient au Lot 9 (blocs de page), pas à celui-ci.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Galerie",
  description:
    "Photos et vidéos des actions d'ADEBES au Cameroun : éducation, santé, développement communautaire et protection de l'environnement.",
  alternates: { canonical: "/galerie" },
  openGraph: {
    title: "Galerie · ADEBES",
    description: "Les actions d'ADEBES en images.",
    url: "/galerie",
  },
};

export default async function GaleriePage() {
  const [elements, categories] = await Promise.all([
    getElementsGalerie(),
    getCategoriesGalerie(),
  ]);

  /*
    Les photos, résolues en une seule requête.

    `resoudreMedias` mémoïse sur la chaîne des identifiants triés : deux
    sections de la même page qui demanderaient les mêmes médias n'en feraient
    qu'une (§7.4, Lot 7).
  */
  const medias = await resoudreMedias(elements.map((element) => element.mediaId));

  /*
    Un élément dont la photo n'a pas pu être résolue n'est pas rendu.

    ⚠️  C'est le seul endroit du site où l'on RETIRE un contenu plutôt que de le
    remplacer par un `MediaPlaceholder`, et il faut dire pourquoi : dans une
    grille de photos, une vignette de repli n'est pas un contenu dégradé, c'est
    une case vide au milieu d'une mosaïque — et la visionneuse l'ouvrirait en
    grand sur rien. Ailleurs (carte de programme, portrait), le repli accompagne
    un TEXTE qui, lui, reste porteur.

    L'état est très improbable — `media_id` est `not null` avec
    `on delete restrict` — et il est signalé dans le dashboard, où quelqu'un
    peut agir.
  */
  const affichables = elements.filter((element) => medias.has(element.mediaId));

  const filtres = categoriesAffichees(affichables, categories);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { label: "Accueil", href: "/" },
          { label: "Galerie", href: "/galerie" },
        ])}
      />

      <PageHero
        eyebrow="Galerie"
        title="Nos actions en images"
        subtitle="Des photos prises sur le terrain, classées par domaine d'intervention."
        image="/images/hero/hero-galerie.jpeg"
        imageAlt="Moment de terrain lors d'une action d'ADEBES"
        tone="green"
      />

      {affichables.length > 0 ? (
        <section id="galerie" className="py-14 lg:py-20">
          <Container size="wide">
            <GalleryGrid
              /*
                La clé d'un filtre est l'IDENTIFIANT de la catégorie, plus son
                `slug`.

                Le slug reste unique et lisible, mais il est MODIFIABLE depuis
                la base, alors que l'identifiant ne l'est pas — et c'est lui que
                porte `gallery_items.category_id`. Faire correspondre les deux
                côtés sur la même valeur évite une table de correspondance dont
                la seule justification serait esthétique.
              */
              categories={filtres.map((categorie) => ({
                slug: categorie.id,
                label: categorie.label,
              }))}
              entries={affichables.map((element) => {
                const media = medias.get(element.mediaId)!;
                const teinte = teinteDeLElement(element, categories);

                return {
                  id: element.id,
                  // `""` pour un élément sans catégorie : aucun bouton ne porte
                  // cette valeur, il n'apparaît donc que dans « Tous ». C'est la
                  // règle `apparaitDansUnFiltre()` rendue par la donnée
                  // elle-même, sans condition supplémentaire dans la grille.
                  category: element.categoryId ?? "",
                  categoryLabel: libelleDeLaCategorie(element, categories),
                  alt: media.altText,
                  thumb: (
                    <CmsImage
                      asset={media}
                      fill
                      tone={teinte}
                      compactPlaceholder
                      sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 45vw"
                      className="transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    />
                  ),
                  full: (
                    <CmsImage
                      asset={media}
                      fill
                      tone={teinte}
                      sizes="(min-width: 1024px) 60vw, 100vw"
                      className="object-contain"
                    />
                  ),
                };
              })}
            />
          </Container>
        </section>
      ) : null}

      {/* --- Vidéo --- */}
      <section className="border-t border-border bg-card py-14 lg:py-20">
        <Container size="default">
          <Reveal>
            <SectionHeading
              badge="Vidéo"
              title="ADEBES en mouvement"
              subtitle="Les vidéos sont hébergées sur une plateforme externe et chargées uniquement au clic : aucune donnée mobile n'est consommée avant que vous ne lanciez la lecture."
              align="center"
            />
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mx-auto mt-10 max-w-3xl">
              <VideoEmbed
                // Renseignez ici l'identifiant de la vidéo une fois publiée :
                // { provider: "youtube", id: "xxxxxxxxxxx" }
                source={null}
                title="Présentation d'ADEBES"
                poster="/images/galerie/video-poster.jpg"
                posterAlt="Image d'aperçu de la vidéo de présentation d'ADEBES"
                tone="navy"
              />
            </div>
          </Reveal>
        </Container>
      </section>

      <CTABanner
        title="Ces images vous parlent ?"
        subtitle="Elles représentent des actions concrètes, financées par des dons et menées par des bénévoles."
      />
    </>
  );
}
