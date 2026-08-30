import { ArrowRight, Building, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { TeamMemberCard } from "@/components/cards/team-member-card";
import { ValueCard } from "@/components/cards/value-card";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { MediaImage } from "@/components/media/media-image";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { CTABanner } from "@/components/ui-ext/cta-banner";
import { Reveal } from "@/components/ui-ext/reveal";
import { SectionHeading } from "@/components/ui-ext/section-heading";
import { accorde, enLettres } from "@/lib/nombres";
import { legal, siteConfig } from "@/lib/site-config";
import { resoudreMedias } from "@/server/queries/media.query";
import { getMembresEquipePublies } from "@/server/queries/team.query";
import { getValeursAffichees } from "@/server/queries/values.query";

export const metadata: Metadata = {
  title: "Qui sommes-nous",
  description:
    "ADEBES, association camerounaise à but non lucratif : mission, valeurs, équipe et gouvernance. Une action de terrain menée avec les communautés de Douala, Yaoundé et des régions de l'intérieur.",
  alternates: { canonical: "/a-propos" },
  openGraph: {
    title: "Qui sommes-nous · ADEBES",
    description: "Mission, valeurs, équipe et gouvernance de l'association.",
    url: "/a-propos",
  },
};

/**
 * ⚠️  `force-dynamic` — TRANSITOIRE, À RETIRER AU LOT 15.
 *
 * La section « L'équipe » lit désormais la base. Sans cette directive, la page
 * serait prérendue au build : publier une fiche depuis le dashboard ne
 * changerait rien tant qu'un déploiement n'aurait pas eu lieu — et
 * l'étiquette `cms:page:a-propos` que les Server Actions invalident déjà ne
 * servirait à rien.
 *
 * Le raisonnement complet, et la marche à suivre au Lot 15, sont dans
 * l'en-tête de `src/server/queries/team.query.ts`.
 */
export const dynamic = "force-dynamic";

export default async function AProposPage() {
  /*
    L'équipe vient de la base au Lot 8D.

    `getMembresEquipePublies()` rend TOUS les membres en ligne, triés par
    position — l'ordre choisi dans le dashboard, qui se lit comme un
    organigramme. Aucune coupe n'est faite ici, contrairement à l'accueil pour
    les témoignages : la grille est en `lg:grid-cols-3` et absorbe une équipe
    de n'importe quelle taille.

    ⚠️  Cette liste est VIDE aujourd'hui : les trois fiches sont en brouillon.
    C'est la donnée réelle, et la section ci-dessous disparaît en conséquence.
    Le pourquoi est dans `server/queries/team.query.ts`.
  */
  const membres = await getMembresEquipePublies();

  /*
    Les valeurs viennent de la base au Lot 8E.

    ⚠️  C'est exactement la même lecture que sur l'accueil, qui rend exactement
    la même grille. `cache()` de React ne mutualise rien entre les deux : il
    mémoïse sur la durée d'UN rendu, et les deux pages sont deux rendus. C'est
    une requête chacune, sans conséquence sur quatre lignes.
  */
  const valeurs = await getValeursAffichees();

  const portraits = await resoudreMedias(
    membres.map((membre) => membre.photoMediaId),
  );

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { label: "Accueil", href: "/" },
          { label: "Qui sommes-nous", href: "/a-propos" },
        ])}
      />

      <PageHero
        eyebrow="Qui sommes-nous"
        title="Une association née du terrain"
        subtitle={siteConfig.description}
        image="/images/hero/hero-a-propos.jpeg"
        imageAlt="Membres et bénévoles d'ADEBES au Cameroun"
        tone="navy"
      />

      {/* --- Mission --- */}
      <section className="py-14 lg:py-20">
        <Container size="wide">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <SectionHeading
                badge="Notre mission"
                title="Agir avec les communautés, pas à leur place"
                subtitle="ADEBES est une organisation camerounaise à but non lucratif qui intervient dans l'éducation, la santé, l'inclusion sociale et le développement communautaire."
              />

              <div className="mt-6 flex flex-col gap-4 text-[0.95rem] leading-relaxed text-muted-foreground">
                <p>
                  Nous intervenons principalement à Douala et Yaoundé, ainsi que
                  dans les régions de l&apos;intérieur du Cameroun, là où les
                  besoins identifiés avec les habitants ne trouvent pas de
                  réponse.
                </p>
                <p>
                  Nos huit programmes sont complémentaires : soutenir la
                  scolarité d&apos;un enfant a peu de sens si sa famille n&apos;a
                  pas accès aux soins, et former une femme à un métier suppose
                  qu&apos;elle dispose d&apos;un capital de départ. C&apos;est
                  cette articulation qui fait notre méthode.
                </p>
              </div>

              <Button asChild variant="outline" className="mt-7">
                <Link href="/programmes">
                  Découvrir nos 8 programmes
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-muted">
                  <MediaImage
                    src="/images/a-propos/histoire-01.jpeg"
                    alt="Action de terrain menée par ADEBES auprès d'une communauté"
                    fill
                    tone="blue"
                    sizes="(min-width: 1024px) 22vw, 45vw"
                  />
                </div>
                <div className="relative mt-8 aspect-[3/4] overflow-hidden rounded-2xl bg-muted">
                  <MediaImage
                    src="/images/a-propos/histoire-02.jpeg"
                    alt="Bénévoles d'ADEBES lors d'une distribution de matériel"
                    fill
                    tone="green"
                    sizes="(min-width: 1024px) 22vw, 45vw"
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/*
        --- Valeurs ---

        La section entière disparaît s'il ne reste aucune valeur affichée —
        même règle que la section « L'équipe » ci-dessous et que l'accueil.
        Ce n'est pas le cas aujourd'hui : les quatre valeurs du seed sont
        visibles et portent un contenu réel.

        ⚠️  LE TITRE COMPTE CE QU'IL SURMONTE, ET LE NOMBRE EST DÉSORMAIS
        DÉRIVÉ. Il était écrit en dur — « Quatre principes » — ce qui était
        vrai tant que la liste vivait dans un fichier TypeScript modifié dans
        le même commit. La liste étant maintenant modifiable depuis le
        dashboard, le titre serait devenu faux à la première valeur ajoutée ou
        masquée. Le raisonnement complet est dans `src/lib/nombres.ts`.

        Avec les quatre valeurs migrées, le rendu est identique au caractère
        près.

        ⚠️  `id="valeurs"` : l'ancre visée par « Voir sur « Qui sommes-nous » »
        depuis la fiche du dashboard.
      */}
      {valeurs.length > 0 ? (
        <section id="valeurs" className="bg-card py-14 lg:py-20">
          <Container size="wide">
            <Reveal>
              <SectionHeading
                badge="Nos valeurs"
                title={`${enLettres(valeurs.length, { capitale: true })} ${accorde(valeurs.length, "principe appliqué", "principes, appliqués")} au quotidien`}
                align="center"
              />
            </Reveal>

            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {valeurs.map((valeur, index) => (
                <Reveal as="li" key={valeur.id} delay={index * 0.06}>
                  <ValueCard valeur={valeur} className="h-full" />
                </Reveal>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      {/*
        --- Équipe ---

        La section entière disparaît s'il n'y a aucun membre en ligne. Même
        règle qu'à l'accueil pour les témoignages et les actualités : un titre
        « Celles et ceux qui portent l'association » suivi du vide serait pire
        que son absence — il annoncerait un contenu manquant, sur la page dont
        l'audit (§4.9) dit qu'elle est un signal de confiance pour un donateur.

        ⚠️  C'EST LE CAS AUJOURD'HUI : les trois fiches sont en brouillon, et
        cette section ne s'affiche donc plus. Ce qui disparaît avec elle, ce
        sont trois cartes portant « [À COMPLÉTER] » et le badge « Nom et photo
        à fournir » — un aveu d'incomplétude adressé aux VISITEURS. Ce rappel
        n'a pas été supprimé, il a changé de destinataire : il est en tête de
        `/dashboard/equipe`, où quelqu'un peut agir. Renseigner les trois noms
        puis publier les fiches ramène la section.

        L'ancre `#equipe` est pointée par le bouton « Voir sur le site » de la
        fiche du dashboard, qui n'est rendu que sur une fiche publiée — donc
        seulement quand cette section existe (invariant nº 2).
      */}
      {membres.length > 0 ? (
        <section id="equipe" className="py-14 lg:py-20">
          <Container size="wide">
            <Reveal>
              <SectionHeading
                badge="L'équipe"
                title="Celles et ceux qui portent l'association"
                subtitle="Savoir qui dirige une association est un signal de confiance au moins aussi important qu'un chiffre d'impact."
              />
            </Reveal>

            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {membres.map((membre, index) => (
                <Reveal as="li" key={membre.id} delay={index * 0.06}>
                  <TeamMemberCard
                    membre={membre}
                    photo={
                      membre.photoMediaId
                        ? portraits.get(membre.photoMediaId)
                        : null
                    }
                  />
                </Reveal>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      {/* --- Gouvernance --- */}
      <section className="border-t border-border bg-card py-14 lg:py-20">
        <Container size="default">
          <Reveal>
            <SectionHeading
              badge="Gouvernance"
              title="Statut et transparence"
              subtitle="Les informations légales complètes figurent dans les mentions légales et sur la page Impact."
            />
          </Reveal>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Reveal>
              <div className="flex h-full gap-4 rounded-2xl border border-border bg-background p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Building className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-heading text-base font-semibold text-foreground">
                    Statut juridique
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    Association camerounaise à but non lucratif.
                    <br />
                    Numéro d&apos;enregistrement : {legal.registrationNumber}
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="flex h-full gap-4 rounded-2xl border border-border bg-background p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-green/12 text-brand-green-ink dark:text-brand-green">
                  <ShieldCheck className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-heading text-base font-semibold text-foreground">
                    Redevabilité
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    Rapports d&apos;activité publiés et chiffres sourcés sur la{" "}
                    <Link
                      href="/impact"
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      page Impact &amp; transparence
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <CTABanner
        title="Vous partagez nos valeurs ?"
        subtitle="Il y a autant de façons d'aider que de programmes. Commencez par celle qui vous ressemble."
      />
    </>
  );
}
