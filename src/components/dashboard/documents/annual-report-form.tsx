"use client";

import { Download, FileText, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  ANNEE_MAX,
  ANNEE_MIN,
  MENTION_AVEC_DOCUMENT,
  MENTION_SANS_DOCUMENT,
  PASTILLE_SANS_DOCUMENT,
  type AnnualReport,
} from "@/core/cms/entities/annual-report";
import {
  annualReportFormSchema,
  type AnnualReportFormInput,
} from "@/core/cms/schemas/annual-report.schema";
import type { FieldDescriptor } from "@/core/cms/blocks/types";
import type { MediaAsset } from "@/core/cms/entities/media-asset";
import { formaterPoids } from "@/lib/media-url";
import {
  creerRapportAnnuelAction,
  mettreAJourRapportAnnuelAction,
} from "@/server/actions/annual-reports.actions";
import { lireMediaAction } from "@/server/actions/media.actions";

import { SchemaForm } from "../forms/schema-form";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LE FORMULAIRE D'UN RAPPORT ANNUEL — création et modification
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8I du Rapport 2. Un seul composant pour les deux écrans : les champs sont
 * les mêmes, seul l'appel de fin diffère. Deux formulaires auraient été deux
 * occasions de laisser diverger une contrainte de saisie.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  PREMIER ÉCRAN DU PROJET À DEMANDER UN DOCUMENT, ET PAS UNE IMAGE
 * ---------------------------------------------------------------------------
 * `<MediaPicker>` sait faire les deux depuis le Lot 7 (`bucketPourAccept`
 * renvoie `documents` pour `accept: "document"`, bucket créé en migration 0011,
 * 20 Mo, `application/pdf` seul), mais **aucun écran réel ne l'avait jamais
 * exercé** : les quatre champs `media` livrés jusqu'ici — couverture de
 * programme, couverture d'article, photo d'équipe, photo de galerie — sont tous
 * en `accept: "image"`.
 *
 * C'est la leçon nº 1 du Lot 8H appliquée à un composant plutôt qu'à une table :
 * un chemin de code qu'aucune donnée n'atteint n'est pas éprouvé. Ce lot est
 * celui qui l'atteint.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LE TITRE N'EST PAS DÉRIVÉ DE L'ANNÉE — ET C'EST DÉLIBÉRÉ
 * ---------------------------------------------------------------------------
 * `src/content/equipe.ts` le composait : `Rapport d'activité ${year}`. La
 * tentation était de reproduire cette dérivation, sur le modèle de
 * `stats.key` (écart nº 124), dérivée du libellé et immuable.
 *
 * La différence est celle-ci : `key` est un identifiant TECHNIQUE que personne
 * ne lit, alors que `title` est **le texte affiché sur la page publique**.
 * Dériver un texte affiché, c'est écrire du contenu à la place de
 * l'association — la faute que l'invariant nº 1 interdit sur les chiffres et
 * que le Lot 8D interdit sur les noms. Le jour où un rapport s'appelle
 * « Rapport moral et financier 2026 », la dérivation aurait été un obstacle.
 *
 * Ce qui est fait à la place : un `placeholder` qui MONTRE la forme attendue —
 * il ne remplit rien, il n'est pas envoyé, et le champ reste obligatoire.
 */

/** Les trois champs du §8I, dans l'ordre de saisie. */
const CHAMPS: readonly FieldDescriptor[] = [
  {
    kind: "number",
    name: "year",
    label: "Année couverte",
    min: ANNEE_MIN,
    max: ANNEE_MAX,
    hint: "L'année sur laquelle porte le rapport. Un seul rapport par année : si celle-ci est déjà prise, c'est le rapport existant qu'il faut modifier.",
  },
  {
    kind: "text",
    name: "title",
    label: "Titre",
    required: true,
    maxLength: 120,
    placeholder: "Rapport d'activité 2026",
    hint: "Affiché tel quel sur la page Impact & transparence. Il n'est pas déduit de l'année : un rapport peut porter un autre nom.",
  },
  {
    kind: "media",
    name: "documentMediaId",
    label: "Fichier PDF",
    accept: "document",
    hint: "Facultatif. Sans fichier, le rapport reste annoncé sur le site avec la mention « En cours de préparation » — le bouton de téléchargement n'apparaît que lorsque le PDF est là.",
  },
];

/** Les clés du formulaire — pour rattacher une erreur serveur au bon champ. */
const CLES_FORMULAIRE = [
  "year",
  "title",
  "documentMediaId",
] as const satisfies readonly (keyof AnnualReportFormInput)[];

/**
 * Valeurs d'un formulaire vierge.
 *
 * ⚠️  `year: ANNEE_MIN` serait absurde et `year: 0` serait refusé au premier
 * coup d'œil de Zod. Le champ part donc de l'année la plus BASSE acceptée…
 * non : il part vide.
 *
 * `NumberField` porte `defaultValue: champ.nullable ? null : 0` et rend `""`
 * pour toute valeur non numérique — un `0` initial afficherait « 0 » dans la
 * case, que l'utilisateur devrait effacer. On passe donc une chaîne vide,
 * exactement ce que le champ produit quand on le vide à la main, et Zod répond
 * avec le message de type qui dit quoi faire. Aucune année n'est proposée :
 * proposer « 2026 » aurait été inventer la réponse.
 */
const VALEURS_VIERGES = {
  year: "" as unknown as number,
  title: "",
  documentMediaId: null,
} satisfies Record<keyof AnnualReportFormInput, unknown> as AnnualReportFormInput;

export function AnnualReportForm({ rapport }: { rapport?: AnnualReport }) {
  const router = useRouter();
  const creation = rapport === undefined;

  const valeurs: AnnualReportFormInput = rapport
    ? {
        year: rapport.year,
        title: rapport.title,
        documentMediaId: rapport.documentMediaId,
      }
    : VALEURS_VIERGES;

  return (
    <SchemaForm<AnnualReportFormInput>
      fields={CHAMPS}
      schema={annualReportFormSchema}
      defaultValues={valeurs}
      submitLabel={
        creation ? "Enregistrer le rapport" : "Enregistrer les modifications"
      }
      onSubmit={async (saisie, outils) => {
        const resultat = creation
          ? await creerRapportAnnuelAction({
              year: saisie.year,
              title: saisie.title,
              documentMediaId: saisie.documentMediaId,
            })
          : await mettreAJourRapportAnnuelAction({
              id: rapport.id,
              year: saisie.year,
              title: saisie.title,
              documentMediaId: saisie.documentMediaId,
            });

        if (resultat.ok) {
          if (creation) {
            toast.success(
              "Rapport enregistré, en brouillon. Il n'apparaît pas encore sur la page Impact.",
            );
            router.push(`/dashboard/documents/${resultat.data.id}`);
          } else {
            toast.success("Modifications enregistrées.");
            // Les données de la page viennent du rendu serveur : sans ce
            // rafraîchissement, l'en-tête garderait l'ancien titre.
            router.refresh();
          }
          return;
        }

        /*
          Erreur de champ → sous le champ concerné ; erreur générale → bandeau
          en tête de formulaire.

          Les clés sont parcourues depuis la liste connue plutôt que depuis la
          réponse : `setError` attend un chemin du formulaire, et une clé venue
          du serveur n'en est pas un tant qu'on ne l'a pas vérifiée.

          ⚠️  C'est ici que se joue le conflit d'année : `createAnnualReport`
          renvoie `fieldErrors.year`, et sans ce rattachement le message
          apparaîtrait en tête du formulaire, loin du champ à corriger.
        */
        for (const cle of CLES_FORMULAIRE) {
          const message = resultat.fieldErrors?.[cle];
          if (message) outils.setError(cle, { message });
        }

        return resultat.message;
      }}
    >
      <ApercuRapport />
    </SchemaForm>
  );
}

/**
 * L'aperçu — la ligne telle qu'elle apparaîtra dans la section Documents.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI CELUI-CI EST REDESSINÉ, ALORS QUE LES LOTS 8E, 8F ET 8H NE L'ONT PAS
 * FAIT
 * ---------------------------------------------------------------------------
 * Ces trois lots rendaient le VRAI composant public (`<ValueCard>`,
 * `<FAQAccordion>`, `<GalleryGrid>`), et c'était la bonne décision : un aperçu
 * réécrit à la main est un aperçu qui ment tôt ou tard.
 *
 * ⚠️  Ici, il n'y a AUCUN composant à réutiliser. La section Documents de
 * `/impact` n'a jamais été extraite : ses lignes sont écrites en clair dans
 * `src/app/(site)/impact/page.tsx`, entre le `<SectionHeading>` et le
 * paragraphe de contact. L'extraire en composant partagé aurait été le geste
 * juste, et il est hors périmètre de ce lot — la page publique n'est pas un
 * client, elle ne peut donc pas recevoir un composant qui lit un formulaire.
 *
 * Ce qui est fait à la place, et qui borne le risque : les deux mentions et la
 * pastille viennent du DOMAINE (`MENTION_AVEC_DOCUMENT`,
 * `MENTION_SANS_DOCUMENT`, `PASTILLE_SANS_DOCUMENT`), pas de chaînes recopiées.
 * Si la page publique change de vocabulaire, l'aperçu change avec elle. Ce qui
 * reste dupliqué, ce sont les classes de mise en forme — visible d'un coup
 * d'œil, et sans conséquence sur ce que le rapport DIT.
 *
 * ⚠️  Ce qu'il montre et que rien d'autre ne montre : **la bascule entre les
 * deux états**. Retirer le PDF fait disparaître le bouton « Télécharger » et
 * remplace « Format PDF » par « En cours de préparation », au moment exact où
 * la décision se prend.
 *
 * `<SchemaForm>` rend ses `children` À L'INTÉRIEUR de son `FormProvider` : ce
 * composant lit donc le formulaire par `useFormContext()`, sans qu'aucune prop
 * n'ait à traverser.
 */
function ApercuRapport() {
  const { control } = useFormContext<AnnualReportFormInput>();
  const saisie = useWatch({ control });

  const identifiant =
    typeof saisie.documentMediaId === "string" && saisie.documentMediaId
      ? saisie.documentMediaId
      : null;

  const [media, setMedia] = useState<MediaAsset | null>(null);
  const [introuvable, setIntrouvable] = useState<string | null>(null);

  /*
    L'état affiché est DÉRIVÉ de la valeur du champ, il n'est pas recopié.

    Même patron que `MediaField` (découverte nº 12) : `mediaAffiche` n'existe
    que si le média chargé correspond exactement à la valeur courante. Il ne
    peut donc pas montrer l'ancien fichier pendant que le champ porte déjà le
    nouveau.
  */
  const mediaAffiche = identifiant && media?.id === identifiant ? media : null;

  useEffect(() => {
    if (!identifiant) return;
    if (media?.id === identifiant || introuvable === identifiant) return;

    let abandonne = false;

    void lireMediaAction({ id: identifiant }).then((resultat) => {
      if (abandonne) return;

      if (resultat.ok) setMedia(resultat.data);
      else setIntrouvable(identifiant);
    });

    return () => {
      abandonne = true;
    };
  }, [identifiant, introuvable, media?.id]);

  const titre =
    typeof saisie.title === "string" && saisie.title.trim()
      ? saisie.title.trim()
      : null;

  /*
    Le document est-il réellement là ?

    ⚠️  `identifiant !== null` ne suffit PAS : un identifiant qui ne se résout
    pas donnerait un bouton « Télécharger » sans fichier derrière — un lien
    mort, ce que l'invariant nº 2 interdit. C'est exactement la vérification que
    la page publique fait de son côté, et l'aperçu doit la refaire pour ne pas
    promettre autre chose qu'elle.
  */
  const telechargeable = mediaAffiche !== null;

  return (
    <section
      aria-labelledby="apercu-rapport-annuel"
      className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4"
    >
      <h2 id="apercu-rapport-annuel" className="text-sm font-medium text-foreground">
        Aperçu sur le site
      </h2>

      <p className="text-sm text-muted-foreground">
        La ligne telle qu&apos;elle apparaîtra dans la section « Rapports
        d&apos;activité » de la page Impact &amp; transparence, une fois le
        rapport publié.
      </p>

      {/*
        Le fond est celui de la page publique (`bg-background`), pas celui du
        bloc d'aperçu : la ligne y est posée sur une carte, et un aperçu sur
        fond gris donnerait une idée fausse du contraste.
      */}
      <div className="rounded-lg border border-border bg-background p-4">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <FileText className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="font-heading text-base font-semibold text-foreground">
                {titre ?? (
                  /*
                    Invariant nº 1 à l'échelle d'un aperçu : une absence est
                    DITE, jamais rendue par une ligne vide qu'on prendrait pour
                    un défaut d'affichage.
                  */
                  <span className="font-normal text-muted-foreground">
                    Saisissez un titre : c&apos;est lui qui s&apos;affichera ici.
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {identifiant && !mediaAffiche
                  ? introuvable === identifiant
                    ? "Le fichier associé n'existe plus."
                    : "Chargement du fichier…"
                  : telechargeable
                    ? MENTION_AVEC_DOCUMENT
                    : MENTION_SANS_DOCUMENT}
              </p>
            </div>
          </div>

          {telechargeable ? (
            /*
              Un vrai `<Button>`, mais SANS lien : l'aperçu montre la forme du
              bouton, il ne propose pas de télécharger depuis le dashboard. Un
              `<a>` ici aurait ouvert le PDF au premier clic distrait, en
              quittant un formulaire non enregistré.
            */
            <Button type="button" variant="outline" size="sm" disabled>
              <Download className="size-4" aria-hidden="true" />
              Télécharger
            </Button>
          ) : (
            <span className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground">
              {PASTILLE_SANS_DOCUMENT}
            </span>
          )}
        </div>
      </div>

      {mediaAffiche ? (
        <p className="flex gap-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            <span className="font-medium text-foreground">
              Le visiteur téléchargera « {mediaAffiche.filename} »
            </span>{" "}
            ({formaterPoids(mediaAffiche.sizeBytes)}). C&apos;est le nom
            d&apos;origine du fichier, celui qui se retrouvera dans ses
            téléchargements.
          </span>
        </p>
      ) : (
        <p className="flex gap-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            <span className="font-medium text-foreground">
              Sans PDF, le rapport reste annoncé.
            </span>{" "}
            C&apos;est un état normal : il indique qu&apos;un document est en
            préparation, sans proposer de lien qui ne mènerait nulle part.
          </span>
        </p>
      )}
    </section>
  );
}
