"use client";

import { Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { FAQAccordion } from "@/components/ui-ext/faq-accordion";
import type { FieldDescriptor } from "@/core/cms/blocks/types";
import {
  FAQ_TOPICS,
  FAQ_TOPIC_DESTINATIONS,
  FAQ_TOPIC_LABELS,
  type FaqItem,
  type FaqTopic,
} from "@/core/cms/entities/faq-item";
import {
  faqItemFormSchema,
  type FaqItemFormInput,
} from "@/core/cms/schemas/faq-item.schema";
import {
  creerQuestionAction,
  mettreAJourQuestionAction,
} from "@/server/actions/faq.actions";

import { SchemaForm } from "../forms/schema-form";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LE FORMULAIRE D'UNE QUESTION FRÉQUENTE — création et modification
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8F du Rapport 2. Un seul composant pour les deux écrans : les champs sont
 * les mêmes, seul l'appel de fin diffère. Deux formulaires auraient été deux
 * occasions de laisser diverger une contrainte de saisie.
 *
 * ---------------------------------------------------------------------------
 * QUATRE CHAMPS, DONT LE PREMIER `select` DU LOT 8
 * ---------------------------------------------------------------------------
 * `topic` est un `kind: "select"` — le type existait depuis le Lot 6 mais
 * aucune collection ne l'avait employé : les articles choisissent leur
 * catégorie dans une liste dynamique, les programmes leur teinte dans une
 * grille. Ici les trois options sont figées par une contrainte SQL, ce qui est
 * exactement le cas d'usage d'un `select`.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LE SUJET N'EST PAS UNE ÉTIQUETTE DE CLASSEMENT
 * ---------------------------------------------------------------------------
 * C'est le seul champ de cette collection dont la modification DÉPLACE la
 * question d'une page publique à une autre. Le `hint` du champ le dit, et
 * `<ConsequenceDuSujet>` le redit en nommant la page concernée à mesure qu'on
 * choisit — parce qu'un `hint` générique se lit une fois et ne se relit jamais.
 */

/** Les quatre champs du §8F, dans l'ordre de saisie. */
function champsQuestion(): readonly FieldDescriptor[] {
  return [
    {
      kind: "text",
      name: "question",
      label: "Question",
      required: true,
      maxLength: 200,
      placeholder: "Comment faire un don à ADEBES ?",
      hint: "Formulée comme un visiteur la poserait, pas comme l'association la classerait. C'est le texte que les moteurs de recherche affichent.",
    },
    {
      kind: "select",
      name: "topic",
      label: "Sujet",
      required: true,
      options: FAQ_TOPICS.map((topic) => ({
        value: topic,
        label: FAQ_TOPIC_LABELS[topic],
      })),
      hint: "Le sujet décide de la page où la question s'affiche. Le changer déplace la question d'une page à une autre.",
    },
    {
      kind: "textarea",
      name: "answer",
      label: "Réponse",
      required: true,
      maxLength: 2000,
      rows: 5,
      placeholder:
        "Plusieurs canaux sont possibles. Le plus direct reste WhatsApp, où un membre de l'équipe vous répond.",
      hint: "Un paragraphe, en texte simple. Si la réponse énumère des choses, mettez-les en puces ci-dessous plutôt que dans ce paragraphe.",
    },
    {
      kind: "list",
      name: "bullets",
      label: "Puces de la réponse",
      itemLabel: "puce",
      of: [{ kind: "text", name: "", label: "Puce" }],
      max: 12,
      hint: "Facultatives. Elles s'affichent sous le paragraphe, et font partie de la réponse déclarée aux moteurs de recherche — pas d'une décoration.",
    },
  ];
}

/** Les clés du formulaire — pour rattacher une erreur serveur au bon champ. */
const CLES_FORMULAIRE = [
  "question",
  "answer",
  "topic",
  "bullets",
] as const satisfies readonly (keyof FaqItemFormInput)[];

/**
 * Valeurs d'un formulaire vierge.
 *
 * `topic` doit partir sur une valeur valide — `""` n'est pas un `FaqTopic` et
 * le formulaire ne compilerait pas, et Radix refuse par ailleurs un
 * `<SelectItem value="">` (écart nº 71). « Général » est le choix qui
 * n'affirme rien : c'est le sujet des questions qui n'appartiennent ni aux
 * dons ni au bénévolat, et une question mal classée s'y repère.
 */
const VALEURS_VIERGES: FaqItemFormInput = {
  question: "",
  answer: "",
  topic: "general",
  bullets: [],
};

export function FaqItemForm({
  question,
}: {
  /** `undefined` = création. */
  question?: FaqItem;
}) {
  const router = useRouter();
  const creation = question === undefined;

  const valeurs: FaqItemFormInput = question
    ? {
        question: question.question,
        answer: question.answer,
        topic: question.topic,
        bullets: [...question.bullets],
      }
    : VALEURS_VIERGES;

  return (
    <SchemaForm<FaqItemFormInput>
      fields={champsQuestion()}
      schema={faqItemFormSchema}
      defaultValues={valeurs}
      submitLabel={
        creation ? "Créer la question" : "Enregistrer les modifications"
      }
      onSubmit={async (saisie, outils) => {
        const resultat = creation
          ? await creerQuestionAction(saisie)
          : await mettreAJourQuestionAction({ id: question.id, ...saisie });

        if (resultat.ok) {
          if (creation) {
            toast.success(
              "Question créée, en brouillon. Elle n'est pas encore visible sur le site.",
            );
            router.push(`/dashboard/faq/${resultat.data.id}`);
          } else {
            toast.success("Modifications enregistrées.");
            // Les données de la page viennent du rendu serveur : sans ce
            // rafraîchissement, l'en-tête garderait l'ancienne question.
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
        */
        for (const cle of CLES_FORMULAIRE) {
          const message = resultat.fieldErrors?.[cle];
          if (message) outils.setError(cle, { message });
        }

        return resultat.message;
      }}
    >
      <ConsequenceDuSujet sujetInitial={question?.topic} />
      <ApercuQuestion />
    </SchemaForm>
  );
}

/**
 * Ce que le sujet choisi implique, écrit à mesure qu'on le choisit.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI CE TEXTE EXISTE ALORS QUE LE CHAMP A DÉJÀ UN `hint`
 * ---------------------------------------------------------------------------
 * Le `hint` dit la règle générale (« le sujet décide de la page ») ; celui-ci
 * dit la conséquence PARTICULIÈRE du choix en cours, et il change quand le
 * choix change. C'est la différence entre une documentation et un retour.
 *
 * Sur une question EXISTANTE, il nomme en plus le déplacement : « elle quitte
 * la page X pour la page Y ». C'est l'information qui manque le plus au moment
 * de corriger un classement, et aucun autre élément de l'écran ne la porte —
 * la fiche affiche le sujet enregistré, pas celui qu'on est en train de
 * choisir.
 *
 * `<SchemaForm>` rend ses `children` À L'INTÉRIEUR de son `FormProvider` : ce
 * composant lit donc le formulaire par `useFormContext()`, sans qu'aucune prop
 * n'ait à traverser.
 */
function ConsequenceDuSujet({ sujetInitial }: { sujetInitial?: FaqTopic }) {
  const { control } = useFormContext<FaqItemFormInput>();
  const sujet = useWatch({ control, name: "topic" }) as FaqTopic | undefined;

  const choisi: FaqTopic = sujet ?? sujetInitial ?? "general";
  const deplacement =
    sujetInitial !== undefined && sujetInitial !== choisi ? sujetInitial : null;

  return (
    <div
      // `aria-live` : le texte change au choix du sujet. Sans annonce, une
      // personne au lecteur d'écran choisirait une option sans savoir que le
      // message en dessous vient d'être remplacé.
      aria-live="polite"
      className="flex gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm"
    >
      <Info
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <p className="text-muted-foreground">
        <span className="font-medium text-foreground">
          Une fois publiée, cette question apparaît sur{" "}
          {FAQ_TOPIC_DESTINATIONS[choisi]}.
        </span>{" "}
        {deplacement ? (
          <>
            En enregistrant, elle quittera {FAQ_TOPIC_DESTINATIONS[deplacement]}{" "}
            — le contenu est conservé, seule la page change.
          </>
        ) : (
          <>
            L&apos;accueil n&apos;affiche que les quatre premières questions de
            la liste, bénévolat exclu : la place dans l&apos;ordre compte autant
            que le sujet.
          </>
        )}
      </p>
    </div>
  );
}

/**
 * L'aperçu de l'accordéon, tel qu'il apparaîtra sur la page publique.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI C'EST LE VRAI `<FAQAccordion>` ET NON UNE MAQUETTE
 * ---------------------------------------------------------------------------
 * Même raison qu'au Lot 8E pour `<ValueCard>` : un aperçu réécrit à la main est
 * un aperçu qui MENT tôt ou tard. Ici c'est le composant lui-même, alimenté par
 * la saisie en cours — s'il change, l'aperçu change.
 *
 * Ce qu'il montre et que rien d'autre ne montre : **la façon dont le paragraphe
 * et les puces se composent**. Le formulaire les saisit dans deux champs
 * séparés, à deux endroits de l'écran ; la page publique les rend l'un sous
 * l'autre, dans un accordéon replié. C'est la seule occasion de voir si la
 * réponse se tient.
 *
 * ⚠️  Il est rendu DÉPLIÉ (`defaultValue`), contrairement à la page publique où
 * l'accordéon est fermé : un aperçu qui demande un clic pour montrer ce qu'on
 * vient de saisir ne serait pas un aperçu.
 */
function ApercuQuestion() {
  const { control } = useFormContext<FaqItemFormInput>();
  const saisie = useWatch({ control });

  const puces = (saisie.bullets ?? []).filter(
    (puce): puce is string => typeof puce === "string" && puce.trim().length > 0,
  );

  return (
    <section
      aria-labelledby="apercu-question"
      className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4"
    >
      <h2 id="apercu-question" className="text-sm font-medium text-foreground">
        Aperçu sur le site
      </h2>

      <p className="text-sm text-muted-foreground">
        Voici comment cette question apparaît dans l&apos;accordéon de la page
        publique, une fois dépliée. Le paragraphe et les puces forment une seule
        réponse.
      </p>

      {/*
        Le fond est celui de la page publique (`bg-background`), pas celui du
        bloc d'aperçu : les questions y sont posées sur du blanc, et un aperçu
        sur fond gris donnerait une idée fausse du contraste.
      */}
      <div className="rounded-lg border border-border bg-background px-4">
        <FAQAccordion
          defaultOuvert
          items={[
            {
              id: "apercu",
              question:
                saisie.question?.trim() || "La question apparaîtra ici.",
              answer:
                saisie.answer?.trim() ||
                "La réponse apparaîtra ici, sous la question.",
              bullets: puces,
            },
          ]}
        />
      </div>
    </section>
  );
}
