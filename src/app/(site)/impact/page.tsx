import { Download, FileText, MapPin, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { StatCard } from "@/components/cards/stat-card";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { CTABanner } from "@/components/ui-ext/cta-banner";
import { Reveal } from "@/components/ui-ext/reveal";
import { SectionHeading } from "@/components/ui-ext/section-heading";
import {
  MENTION_AVEC_DOCUMENT,
  MENTION_SANS_DOCUMENT,
  PASTILLE_SANS_DOCUMENT,
} from "@/core/cms/entities/annual-report";
import { urlTelechargementMedia } from "@/lib/media-url";
import { contact } from "@/lib/site-config";
import { getRapportsAnnuels } from "@/server/queries/annual-report.query";
import { resoudreMedias } from "@/server/queries/media.query";
import { getChiffresAffiches } from "@/server/queries/stats.query";

/**
 * ⚠️  `force-dynamic` — TRANSITOIRE, À RETIRER AU LOT 15.
 *
 * Cette page était entièrement STATIQUE avant le Lot 8G : tout son contenu
 * venait de `src/content/`. La section « Nos chiffres » lit la base depuis ce
 * lot-là, et la section « Rapports d'activité » depuis le Lot 8I.
 *
 * Sans cette directive, `/impact` serait prérendue au build : corriger le
 * nombre de bénéficiaires depuis le dashboard laisserait l'ancienne valeur sur
 * la page qui promet la transparence, jusqu'au prochain déploiement — et les
 * étiquettes `cms:page:impact` qu'invalident `stats.actions.ts` **et**
 * `annual-reports.actions.ts` ne serviraient à rien.
 *
 * ⚠️  Une seule directive pour DEUX collections : le Lot 8I n'a rien eu à
 * ajouter ici, et c'est le premier de la série dans ce cas. Au Lot 15, la
 * retirer libérera les deux lectures ensemble — ne pas la supprimer en ne
 * pensant qu'à l'une.
 *
 * Le raisonnement complet, et la marche à suivre au Lot 15, sont dans les
 * en-têtes de `stats.query.ts` et de `annual-report.query.ts`.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Impact & transparence",
  description:
    "Les chiffres d'ADEBES, l'utilisation des dons et les rapports d'activité téléchargeables. La transparence est ce qui rend un don possible.",
  alternates: { canonical: "/impact" },
  openGraph: {
    title: "Impact & transparence · ADEBES",
    description: "Nos chiffres, nos engagements, nos rapports d'activité.",
    url: "/impact",
  },
};

const engagements = [
  {
    title: "Chaque don est affecté",
    description:
      "Un don est rattaché à un programme identifié. Vous pouvez préciser lequel au moment de votre contact.",
  },
  {
    title: "Un rapport sur demande",
    description:
      "Tout donateur peut demander le détail de l'utilisation de son don. La demande se fait par e-mail ou WhatsApp.",
  },
  {
    title: "Des chiffres vérifiables",
    description:
      "Nous ne publions que des chiffres issus de nos rapports d'activité. Un chiffre non consolidé n'est pas affiché.",
  },
  {
    title: "Aucune collecte cachée",
    description:
      "Le site ne collecte aucune donnée à votre insu. Les seules informations reçues sont celles que vous nous transmettez volontairement.",
  },
];

export default async function ImpactPage() {
  /*
    ═══════════════════════════════════════════════════════════════════════════
     LES RAPPORTS VIENNENT DE LA BASE AU LOT 8I
    ═══════════════════════════════════════════════════════════════════════════

    Avant : un tableau `rapports` de `src/content/equipe.ts`, dont chaque entrée
    portait un CHEMIN (`/documents/rapport-activite-2025.pdf`) et dont les
    années étaient CALCULÉES (`getFullYear() - 1` et `- 2`). La disponibilité se
    testait avec `resolveMedia()`, c'est-à-dire une lecture du disque : le
    dossier `public/documents/` n'ayant jamais existé, les deux lignes
    s'affichaient en permanence avec la pastille « Bientôt disponible ».

    Après : `annual_reports`, et la vérification porte sur l'existence du média
    EN BASE — c'est mot pour mot ce que demande le §8I.

    ⚠️  Le comportement visible est le MÊME, et c'est le critère de recette du
    §8x. Ce qui change est ailleurs : les années ne bougeront plus toutes
    seules au 1er janvier, et déposer un PDF se fait depuis le dashboard.
  */
  const rapports = await getRapportsAnnuels();

  /*
    Les PDF, résolus en une seule requête.

    ⚠️  `resoudreMedias` accepte les `null` et les écarte : c'est le cas
    COURANT ici, contrairement à `/galerie` où la référence est obligatoire.
    Avec zéro identifiant, elle ne fait aucune requête.
  */
  const documents = await resoudreMedias(
    rapports.map((rapport) => rapport.documentMediaId),
  );

  /*
    Un rapport n'est proposé au téléchargement que si son PDF existe RÉELLEMENT.

    ⚠️  Le test porte sur le média RÉSOLU, pas sur `documentMediaId !== null` :
    une référence qui ne rend rien — média supprimé hors dashboard, lecture
    partielle — produirait sinon un bouton « Télécharger » sans fichier
    derrière, c'est-à-dire le lien mort que l'invariant nº 2 interdit.

    ⚠️  Et un rapport dont le PDF ne se résout pas reste AFFICHÉ, avec sa
    mention « En cours de préparation ». C'est l'inverse de ce que fait
    `/galerie` (écart nº 148, où l'élément est retiré), et la différence est
    réelle : dans une grille de photos, une case vide n'a aucun sens ; ici, la
    ligne porte un TITRE et une ANNÉE qui restent une information vraie et
    utile. La règle du Lot 8H n'était pas générale, elle était propre aux
    mosaïques.
  */
  const rapportsAffiches = rapports.map((rapport) => {
    const media = rapport.documentMediaId
      ? documents.get(rapport.documentMediaId)
      : undefined;

    return {
      id: rapport.id,
      year: rapport.year,
      title: rapport.title,
      /** L'URL de téléchargement, ou `null` — jamais une chaîne vide. */
      href: media ? urlTelechargementMedia(media) : null,
    };
  });

  /*
    Les chiffres clés viennent de la base au Lot 8G.

    C'est la même lecture que celle de l'accueil — même fonction, même ordre,
    mêmes cartes. La seule différence est ici : chaque carte est SUIVIE DE SA
    PRÉCISION (`note`), ce que l'accueil n'affiche pas.

    ⚠️  LES CHIFFRES NON FOURNIS SONT DANS CETTE LISTE. C'est encore plus vrai
    ici qu'à l'accueil : le sous-titre de la section promet que « les chiffres
    en attente de consolidation sont signalés plutôt qu'arrondis au hasard ».
    Une carte à « — » suivie de sa note est exactement ce que cette phrase
    annonce ; la masquer la rendrait fausse.
  */
  const chiffres = await getChiffresAffiches();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { label: "Accueil", href: "/" },
          { label: "Impact & transparence", href: "/impact" },
        ])}
      />

      <PageHero
        eyebrow="Impact & transparence"
        title="Ce que votre soutien permet"
        subtitle="Une association qui vit de la générosité du public doit rendre des comptes. Voici nos chiffres, nos engagements et nos documents."
        image="/images/hero/hero-impact.jpeg"
        imageAlt="Bénéficiaires d'un programme d'ADEBES au Cameroun"
        tone="navy"
      />

      {/* --- Chiffres --- */}
      {/*
        ⚠️  SECTION CONDITIONNELLE depuis le Lot 8G, et l'ancre `#chiffres` est
        nouvelle (destination des liens « Voir sur le site » de
        `/dashboard/chiffres/[id]`).

        La condition suit la règle établie depuis le Lot 8B. Elle compte
        particulièrement ici : le titre « Nos chiffres » suivi d'une grille vide
        annoncerait un contenu absent sur la page qui promet la transparence.

        La clé de liste est l'IDENTIFIANT, pas la clé technique (écart nº 114).
      */}
      {chiffres.length > 0 ? (
        <section id="chiffres" className="py-14 lg:py-20">
          <Container size="wide">
            <Reveal>
              <SectionHeading
                title="Nos chiffres"
                subtitle="Chaque valeur est accompagnée de sa source. Les chiffres en attente de consolidation sont signalés plutôt qu'arrondis au hasard."
              />
            </Reveal>

            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {chiffres.map((stat, index) => (
                <Reveal as="li" key={stat.id} delay={index * 0.06}>
                  <div className="flex h-full flex-col">
                    <StatCard stat={stat} />
                    {stat.note ? (
                      <p className="mt-2 px-1 text-xs leading-relaxed text-muted-foreground">
                        {stat.note}
                      </p>
                    ) : null}
                  </div>
                </Reveal>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      {/* --- Engagements --- */}
      <section className="bg-card py-14 lg:py-20">
        <Container size="wide">
          <Reveal>
            <SectionHeading
              badge="Nos engagements"
              title="Quatre règles que nous nous imposons"
              align="center"
            />
          </Reveal>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {engagements.map((engagement, index) => (
              <Reveal as="li" key={engagement.title} delay={index * 0.06}>
                <div className="flex h-full gap-4 rounded-2xl border border-border bg-background p-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-green/12 text-brand-green-ink dark:text-brand-green">
                    <ShieldCheck className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-heading text-base font-semibold text-foreground">
                      {engagement.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {engagement.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      {/* --- Rapports --- */}
      {/*
        ⚠️  SECTION CONDITIONNELLE depuis le Lot 8I, et l'ancre `#documents` est
        nouvelle (destination des liens « Voir sur le site » de
        `/dashboard/documents/[id]`).

        La condition suit la règle établie depuis le Lot 8B, et elle compte
        particulièrement ici : le sous-titre AFFIRME que « les rapports validés
        sont désormais téléchargeables directement ici ». Rendu au-dessus d'une
        liste vide, il serait faux — et faux sur la page qui promet la
        transparence, ce qui est le pire endroit du site pour l'être.

        ⚠️  LE PARAGRAPHE DE CONTACT DISPARAÎT AVEC LA SECTION, et c'est
        assumé : il répond à « vous voulez le détail d'un don ? », question que
        posent les rapports eux-mêmes. La même adresse reste atteignable à deux
        endroits de cette page — l'engagement « Un rapport sur demande », juste
        au-dessus, et le pied de page. Rien n'est perdu, et une phrase de
        contact orpheline sous un titre sans contenu aurait été le troisième
        état, celui que personne n'a voulu.

        La clé de liste est l'IDENTIFIANT, pas l'année (écart nº 114) : deux
        rapports de même année sont interdits par la base, mais une clé de liste
        ne doit pas dépendre d'une contrainte qui pourrait être contournée.
      */}
      {rapportsAffiches.length > 0 ? (
        <section id="documents" className="py-14 lg:py-20">
          <Container size="default">
            <Reveal>
              <SectionHeading
                badge="Documents"
                title="Rapports d'activité"
                subtitle="L'ancien site promettait un rapport envoyé sur demande sans rien publier. Les rapports validés sont désormais téléchargeables directement ici."
              />
            </Reveal>

            <ul className="mt-8 flex flex-col gap-3">
              {rapportsAffiches.map((rapport, index) => (
                <Reveal as="li" key={rapport.id} delay={index * 0.06}>
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <FileText className="size-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-heading text-base font-semibold text-foreground">
                          {rapport.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {rapport.href
                            ? MENTION_AVEC_DOCUMENT
                            : MENTION_SANS_DOCUMENT}
                        </p>
                      </div>
                    </div>

                    {rapport.href ? (
                      /*
                        ⚠️  `min-h-11` s'ajoute à `size="sm"` : un bouton `sm`
                        fait 36 px, sous les 44 px de la règle 4 du §12. C'est
                        le correctif du Lot 8H sur les filtres de `/galerie`
                        (écart nº 147), appliqué à la seule commande de cette
                        section — la règle ne connaît pas d'exception pour un
                        bouton « petit par choix esthétique ».

                        ⚠️  L'attribut `download` est CONSERVÉ bien qu'il soit
                        inopérant sur une autre origine : il ne coûte rien et
                        redeviendra exact si les fichiers passent un jour par
                        notre domaine. Ce qui fait réellement le travail est le
                        `?download=` de l'URL — voir `urlTelechargementMedia`.
                      */
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="min-h-11"
                      >
                        <a href={rapport.href} download>
                          <Download className="size-4" aria-hidden="true" />
                          Télécharger
                          <span className="sr-only">
                            {" "}
                            le {rapport.title}, au format PDF
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

            <Reveal delay={0.1}>
              <p className="mt-6 text-sm text-muted-foreground">
                Vous souhaitez le détail de l&apos;utilisation d&apos;un don ?{" "}
                <a
                  href={`mailto:${contact.email}`}
                  className="inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 hover:underline"
                >
                  {contact.email}
                </a>
              </p>
            </Reveal>
          </Container>
        </section>
      ) : null}

      {/* --- Zones d'intervention --- */}
      <section className="border-t border-border bg-card py-14 lg:py-20">
        <Container size="default">
          <Reveal>
            <SectionHeading
              badge="Où nous agissons"
              title="Nos zones d'intervention"
              align="center"
            />
          </Reveal>

          <ul className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
            {[
              {
                name: "Douala",
                detail: "Siège de l'association et actions urbaines",
              },
              { name: "Yaoundé", detail: "Programmes éducatifs et sociaux" },
              {
                name: "Régions de l'intérieur",
                detail: "Campagnes de santé et actions rurales",
              },
            ].map((zone, index) => (
              <Reveal as="li" key={zone.name} delay={index * 0.06}>
                <div className="flex h-full flex-col items-center gap-2 rounded-2xl border border-border bg-background p-5 text-center">
                  <MapPin
                    className="size-5 text-brand-green-ink dark:text-brand-green"
                    aria-hidden="true"
                  />
                  <p className="font-heading text-base font-semibold text-foreground">
                    {zone.name}
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {zone.detail}
                  </p>
                </div>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={0.12}>
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Voir le détail par programme sur la page{" "}
              <Link
                href="/programmes"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Nos programmes
              </Link>
              .
            </p>
          </Reveal>
        </Container>
      </section>

      <CTABanner
        title="La transparence appelle la confiance"
        subtitle="Et la confiance permet d'agir. Soutenez un programme, ou venez voir par vous-même."
      />
    </>
  );
}
