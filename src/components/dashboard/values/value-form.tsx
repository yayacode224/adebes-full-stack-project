"use client";

import { useRouter } from "next/navigation";
import { useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { ValueCard } from "@/components/cards/value-card";
import type { FieldDescriptor } from "@/core/cms/blocks/types";
import type { CoreValue } from "@/core/cms/entities/core-value";
import {
  coreValueFormSchema,
  type CoreValueFormInput,
} from "@/core/cms/schemas/core-value.schema";
import {
  creerValeurAction,
  mettreAJourValeurAction,
} from "@/server/actions/values.actions";

import { SchemaForm } from "../forms/schema-form";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LE FORMULAIRE D'UNE VALEUR — création et modification
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8E du Rapport 2. Un seul composant pour les deux écrans : les champs sont
 * les mêmes, seul l'appel de fin diffère. Deux formulaires auraient été deux
 * occasions de laisser diverger une contrainte de saisie.
 *
 * ---------------------------------------------------------------------------
 * QUATRE CHAMPS, DONT DEUX QUI NE SE SAISISSENT PAS AU CLAVIER
 * ---------------------------------------------------------------------------
 * `icon` et `tone` sont des grilles de boutons radio natifs (`choice-fields.tsx`,
 * Lot 6). C'est leur deuxième appelant après le formulaire des programmes — et
 * le premier où **les deux valeurs sont contraintes de bout en bout** :
 * `z.enum(ICON_NAMES)` et `z.enum(MEDIA_TONES)` côté schéma, `IconName` et
 * `MediaTone` côté entité. Aucune chaîne libre ne subsiste dans cette
 * collection.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  PAS DE CHAMP « AFFICHER SUR LE SITE »
 * ---------------------------------------------------------------------------
 * `isVisible` est absent de `coreValueFormSchema`, délibérément. Retirer une
 * valeur du site est une décision, pas une saisie : elle se prend depuis
 * l'en-tête de la fiche ou depuis la liste, avec sa propre entrée d'audit.
 *
 * Une case à cocher au milieu de quatre champs de texte se coche par
 * distraction — et celle-là aurait retiré la valeur de DEUX pages publiques en
 * même temps que d'une correction d'orthographe.
 *
 * ---------------------------------------------------------------------------
 * L'APERÇU EST LE VRAI COMPOSANT, PAS UNE IMITATION
 * ---------------------------------------------------------------------------
 * Voir `<ApercuValeur>` en bas de ce fichier.
 */

/** Les quatre champs du §8E, dans l'ordre de saisie. */
function champsValeur(): readonly FieldDescriptor[] {
  return [
    {
      kind: "text",
      name: "title",
      label: "Titre",
      required: true,
      maxLength: 60,
      placeholder: "Solidarité",
      hint: "Un ou deux mots. C'est le principe lui-même, pas sa description.",
    },
    {
      kind: "textarea",
      name: "description",
      label: "Explication",
      required: true,
      maxLength: 200,
      rows: 2,
      placeholder: "L'union fait la force : chaque geste compte.",
      hint: "Une phrase, affichée sous le titre sur les deux pages. Obligatoire : un principe sans énoncé n'en est pas un.",
    },
    {
      kind: "icon",
      name: "icon",
      label: "Icône",
      required: true,
      hint: "Affichée au-dessus du titre, dans une pastille de la teinte choisie.",
    },
    {
      kind: "tone",
      name: "tone",
      label: "Teinte",
      required: true,
      hint: "Colore la pastille de l'icône. Elle est décorative : le titre reste lisible quelle que soit la teinte.",
    },
  ];
}

/** Les clés du formulaire — pour rattacher une erreur serveur au bon champ. */
const CLES_FORMULAIRE = [
  "title",
  "description",
  "icon",
  "tone",
] as const satisfies readonly (keyof CoreValueFormInput)[];

/**
 * Valeurs d'un formulaire vierge.
 *
 * ⚠️  Les deux champs à énumération ne peuvent pas être vides : `""` n'est ni un
 * `IconName` ni un `MediaTone`, et le formulaire ne compilerait pas. Il faut
 * donc choisir un point de départ, et ce choix est du contenu — d'où la règle
 * « ne rien inventer » qui s'applique :
 *
 *   * `Sparkles` est l'icône de REPLI du registre, celle qui signifie
 *     précisément « aucune icône choisie ». C'est la seule qui n'affirme rien ;
 *   * `neutral` est la teinte sans couleur de marque, pour la même raison.
 *
 * Une valeur créée sans y toucher est donc visiblement générique, et se repère
 * dans la liste. Pré-remplir avec `HeartHandshake` et `blue` aurait produit une
 * carte plausible que personne n'aurait pensé à corriger.
 */
const VALEURS_VIERGES: CoreValueFormInput = {
  title: "",
  description: "",
  icon: "Sparkles",
  tone: "neutral",
};

export function ValueForm({
  valeur,
}: {
  /** `undefined` = création. */
  valeur?: CoreValue;
}) {
  const router = useRouter();
  const creation = valeur === undefined;

  const valeursInitiales: CoreValueFormInput = valeur
    ? {
        title: valeur.title,
        description: valeur.description,
        icon: valeur.icon,
        tone: valeur.tone,
      }
    : VALEURS_VIERGES;

  return (
    <SchemaForm<CoreValueFormInput>
      fields={champsValeur()}
      schema={coreValueFormSchema}
      defaultValues={valeursInitiales}
      submitLabel={creation ? "Créer la valeur" : "Enregistrer les modifications"}
      onSubmit={async (saisie, outils) => {
        const resultat = creation
          ? await creerValeurAction(saisie)
          : await mettreAJourValeurAction({ id: valeur.id, ...saisie });

        if (resultat.ok) {
          if (creation) {
            toast.success(
              "Valeur créée. Elle est affichée sur l'accueil et sur « Qui sommes-nous ».",
            );
            router.push(`/dashboard/valeurs/${resultat.data.id}`);
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
        */
        for (const cle of CLES_FORMULAIRE) {
          const message = resultat.fieldErrors?.[cle];
          if (message) outils.setError(cle, { message });
        }

        return resultat.message;
      }}
    >
      <ApercuValeur />
    </SchemaForm>
  );
}

/**
 * L'aperçu de la carte, tel qu'il apparaîtra sur les deux pages.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI C'EST LE VRAI `<ValueCard>` ET NON UNE MAQUETTE
 * ---------------------------------------------------------------------------
 * Un aperçu réécrit à la main est un aperçu qui MENT tôt ou tard : le jour où
 * la carte publique change de typographie ou de pastille, la copie reste, et
 * elle promet un rendu qui n'existe plus. Ici c'est le composant lui-même,
 * alimenté par les valeurs en cours de saisie — s'il change, l'aperçu change.
 *
 * C'est ce qui justifie l'aperçu sur CETTE collection alors qu'aucune autre
 * n'en a : `icon` et `tone` sont choisis dans deux grilles séparées, et rien,
 * avant l'enregistrement, ne montrait le résultat de leur combinaison. On
 * choisissait une icône et une couleur sans jamais les voir ensemble.
 *
 * `<SchemaForm>` rend ses `children` À L'INTÉRIEUR de son `FormProvider` : ce
 * composant lit donc le formulaire par `useFormContext()`, sans qu'aucune prop
 * n'ait à traverser.
 */
function ApercuValeur() {
  const { control } = useFormContext<CoreValueFormInput>();
  const saisie = useWatch({ control });

  return (
    <section
      aria-labelledby="apercu-valeur"
      className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4"
    >
      <h2
        id="apercu-valeur"
        className="text-sm font-medium text-foreground"
      >
        Aperçu de la carte
      </h2>

      <p className="text-sm text-muted-foreground">
        Voici comment cette valeur apparaît sur la page d&apos;accueil et sur
        « Qui sommes-nous ». Les deux pages affichent exactement la même carte.
      </p>

      {/*
        La largeur est bornée à celle d'une colonne de la grille publique
        (`lg:grid-cols-4` dans un conteneur large) : un aperçu pleine largeur
        donnerait une idée fausse de la place dont dispose le texte, qui est
        précisément ce qu'on cherche à vérifier.
      */}
      <div className="max-w-xs">
        <ValueCard
          valeur={{
            title: saisie.title?.trim() || "Titre de la valeur",
            description:
              saisie.description?.trim() ||
              "L'explication apparaîtra ici, sous le titre.",
            icon: saisie.icon ?? "Sparkles",
            tone: saisie.tone ?? "neutral",
          }}
        />
      </div>
    </section>
  );
}
