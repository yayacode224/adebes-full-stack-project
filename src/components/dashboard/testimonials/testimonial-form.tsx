"use client";

import { ShieldCheck, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";

import type { FieldDescriptor } from "@/core/cms/blocks/types";
import type { Testimonial } from "@/core/cms/entities/testimonial";
import {
  testimonialFormSchema,
  type TestimonialFormInput,
} from "@/core/cms/schemas/testimonial.schema";
import {
  creerTemoignageAction,
  mettreAJourTemoignageAction,
} from "@/server/actions/testimonials.actions";

import type { OptionDeReference } from "../forms/references-context";
import { SchemaForm } from "../forms/schema-form";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LE FORMULAIRE D'UN TÉMOIGNAGE — création et modification
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8C du Rapport 2. Un seul composant pour les deux écrans : les champs sont
 * les mêmes, seul l'appel de fin diffère. Deux formulaires auraient été deux
 * occasions de laisser diverger une contrainte de saisie.
 *
 * ---------------------------------------------------------------------------
 * AUCUN JSX DE FORMULAIRE N'EST ÉCRIT ICI
 * ---------------------------------------------------------------------------
 * Six descripteurs et `<SchemaForm>`. C'est la propriété nº 2 du §10 du
 * Rapport 1, et elle apporte gratuitement ce qu'on oublie en écrivant un
 * formulaire à la main : libellé associé, `role="alert"`, `aria-describedby`,
 * champs à 44 px, `text-base` sous `md:`, barre d'enregistrement collante
 * au-dessus de la zone sûre.
 *
 * La seule chose écrite à la main est l'AVERTISSEMENT DE CONSENTEMENT, et ce
 * n'est pas un champ : c'est une explication. Elle est rendue en `children`,
 * juste au-dessus de la barre d'enregistrement — donc immédiatement après la
 * case qu'elle explique, et sous les yeux au moment d'enregistrer.
 *
 * ---------------------------------------------------------------------------
 * LES PROGRAMMES SONT FOURNIS PAR L'ÉCRAN
 * ---------------------------------------------------------------------------
 * Écart nº 40 : le champ `reference` ne charge pas ses options, il les reçoit
 * du contexte `<ReferencesProvider>` que `<SchemaForm>` installe. La page les a
 * déjà lues côté serveur ; les redemander depuis le navigateur serait un
 * aller-retour pour huit lignes.
 */

/** Les six champs du §8C, dans l'ordre de saisie. */
function champsTemoignage(): readonly FieldDescriptor[] {
  return [
    {
      kind: "textarea",
      name: "quote",
      label: "Citation",
      required: true,
      maxLength: 500,
      rows: 4,
      hint: "Les mots de la personne, sans les réécrire. Deux phrases suffisent : ce qui a changé, et grâce à quoi.",
    },
    {
      kind: "text",
      name: "authorName",
      label: "Prénom",
      required: true,
      maxLength: 80,
      placeholder: "Aminata",
      hint: "Prénom seul, ou prénom et initiale. Jamais un nom complet sans accord écrit sur ce point précis.",
    },
    {
      kind: "text",
      name: "authorRole",
      label: "Rôle",
      required: true,
      maxLength: 120,
      placeholder: "Bénéficiaire du programme Éducation",
      hint: "Ce qui situe la personne : bénéficiaire, bénévole, partenaire. Affiché sous son prénom.",
    },
    {
      kind: "reference",
      name: "programmeId",
      label: "Programme concerné",
      resource: "programme",
      hint: "Facultatif. Relie le témoignage à un programme. Tant qu'un témoignage y est rattaché, ce programme ne peut pas être supprimé.",
    },
    {
      kind: "media",
      name: "photoMediaId",
      label: "Photo de la personne",
      accept: "image",
      hint: "Facultative, et soumise au même accord que la citation. Sans photo, un emplacement coloré s'affiche à sa place — jamais une image d'une autre personne.",
    },
    {
      kind: "boolean",
      name: "hasConsent",
      label:
        "La personne a donné son accord écrit pour la publication de cette citation",
      hint: "Sans cette case, le témoignage peut être enregistré en brouillon mais ne peut pas être mis en ligne.",
    },
  ];
}

/** Les clés du formulaire — pour rattacher une erreur serveur au bon champ. */
const CLES_FORMULAIRE = [
  "quote",
  "authorName",
  "authorRole",
  "programmeId",
  "photoMediaId",
  "hasConsent",
] as const satisfies readonly (keyof TestimonialFormInput)[];

/** Valeurs d'un formulaire vierge. Aucune n'est inventée : elles sont vides. */
const VALEURS_VIERGES: TestimonialFormInput = {
  quote: "",
  authorName: "",
  authorRole: "",
  programmeId: null,
  photoMediaId: null,
  hasConsent: false,
};

export function TestimonialForm({
  temoignage,
  programmes,
}: {
  /** `undefined` = création. */
  temoignage?: Testimonial;
  /** Les programmes sélectionnables, déjà lus par l'écran. */
  programmes: OptionDeReference[];
}) {
  const router = useRouter();
  const creation = temoignage === undefined;

  const valeurs: TestimonialFormInput = temoignage
    ? {
        quote: temoignage.quote,
        authorName: temoignage.authorName,
        authorRole: temoignage.authorRole,
        programmeId: temoignage.programmeId,
        photoMediaId: temoignage.photoMediaId,
        hasConsent: temoignage.hasConsent,
      }
    : VALEURS_VIERGES;

  return (
    <SchemaForm<TestimonialFormInput>
      fields={champsTemoignage()}
      schema={testimonialFormSchema}
      defaultValues={valeurs}
      references={{ programme: programmes }}
      submitLabel={
        creation ? "Créer le témoignage" : "Enregistrer les modifications"
      }
      onSubmit={async (saisie, outils) => {
        const resultat = creation
          ? await creerTemoignageAction(saisie)
          : await mettreAJourTemoignageAction({ id: temoignage.id, ...saisie });

        if (resultat.ok) {
          if (creation) {
            toast.success(
              "Témoignage créé, en brouillon. Il n'est pas encore visible sur le site.",
            );
            router.push(`/dashboard/temoignages/${resultat.data.id}`);
          } else {
            toast.success("Modifications enregistrées.");
            // Les données de la page viennent du rendu serveur : sans ce
            // rafraîchissement, l'en-tête garderait l'ancien prénom.
            router.refresh();
          }
          return;
        }

        /*
          Erreur de champ → sous le champ concerné ; erreur générale →
          bandeau en tête de formulaire.

          Les clés sont parcourues depuis la liste connue plutôt que depuis la
          réponse : `setError` attend un chemin du formulaire, et une clé venue
          du serveur n'en est pas un tant qu'on ne l'a pas vérifiée.
        */
        for (const cle of CLES_FORMULAIRE) {
          const message = resultat.fieldErrors?.[cle];
          if (message) outils.setError(cle, { message });
        }

        return resultat.message;
      }}
    >
      <AvertissementConsentement />
    </SchemaForm>
  );
}

/**
 * L'avertissement de consentement du §8C.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI IL CHANGE DE TEXTE PLUTÔT QUE DE DISPARAÎTRE
 * ---------------------------------------------------------------------------
 * Un avertissement qui s'efface une fois la case cochée récompense le fait de
 * cocher. Ici, il reste : il rappelle simplement ce qui a été attesté, et à
 * quoi cela engage. C'est aussi ce qui rend l'état lisible d'un coup d'œil
 * quand on rouvre une fiche des mois plus tard.
 *
 * `<SchemaForm>` rend ses `children` À L'INTÉRIEUR de son `FormProvider` : ce
 * composant lit donc le formulaire par `useFormContext()`, sans qu'aucune prop
 * n'ait à traverser.
 */
function AvertissementConsentement() {
  const { control } = useFormContext<TestimonialFormInput>();
  const accord = useWatch({ control, name: "hasConsent" });

  const Icone = accord ? ShieldCheck : TriangleAlert;

  return (
    <div
      // `aria-live` : la bascule de la case change ce texte. Sans annonce, une
      // personne au lecteur d'écran cocherait sans savoir que le message
      // au-dessus vient d'être remplacé.
      aria-live="polite"
      className={
        accord
          ? "flex gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm"
          : "flex gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm"
      }
    >
      <Icone
        className={
          accord
            ? "mt-0.5 size-4 shrink-0 text-muted-foreground"
            : "mt-0.5 size-4 shrink-0 text-destructive"
        }
        aria-hidden="true"
      />

      {accord ? (
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">Accord enregistré.</span>{" "}
          Ce témoignage peut être mis en ligne. Si la personne revient sur son
          accord, dépubliez d&apos;abord le témoignage, puis décochez la case.
        </p>
      ) : (
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">
            Aucune citation n&apos;est publiée sans l&apos;accord de la personne.
          </span>{" "}
          Vous pouvez enregistrer ce témoignage en brouillon dès maintenant, mais
          il ne pourra pas être mis en ligne tant que la case ci-dessus
          n&apos;est pas cochée. L&apos;accord porte sur le texte{" "}
          <em>et</em> sur la photo.
        </p>
      )}
    </div>
  );
}
