"use client";

import { useRouter } from "next/navigation";
import { useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { StatCard } from "@/components/cards/stat-card";
import type { FieldDescriptor } from "@/core/cms/blocks/types";
import { VALEUR_MAX, type Stat } from "@/core/cms/entities/stat";
import {
  statFormSchema,
  type StatFormInput,
} from "@/core/cms/schemas/stat.schema";
import {
  creerChiffreAction,
  mettreAJourChiffreAction,
} from "@/server/actions/stats.actions";

import { SchemaForm } from "../forms/schema-form";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LE FORMULAIRE D'UN CHIFFRE CLÉ — création et modification
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8G du Rapport 2. Un seul composant pour les deux écrans : les champs sont
 * les mêmes, seul l'appel de fin diffère. Deux formulaires auraient été deux
 * occasions de laisser diverger une contrainte de saisie.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  C'EST LE PREMIER APPELANT DE `kind: "number"` — ET IL EXISTE DEPUIS LE
 *     LOT 6
 * ---------------------------------------------------------------------------
 * Le champ, sa case « Ce chiffre n'est pas encore disponible » et sa cible de
 * 44 px (écart nº 78) ont été écrits au Lot 6 et n'ont jamais eu d'appelant.
 * Ce lot ne le réécrit pas, il l'exerce — et l'exercice a trouvé un défaut réel
 * (écart nº 126) : décocher la case réintroduisait un `0`.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LE CHAMP `key` N'EXISTE PAS — voir l'écart nº 124
 * ---------------------------------------------------------------------------
 * L'identifiant technique est dérivé du libellé à la création et immuable
 * ensuite. Il ne se saisit donc pas. Il est AFFICHÉ, en lecture seule, sur la
 * fiche (`stat-editeur.tsx`) — cacher entièrement une donnée qui existe serait
 * une surprise le jour où quelqu'un ouvre la base.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  PAS DE CHAMP « AFFICHER SUR LE SITE »
 * ---------------------------------------------------------------------------
 * `isVisible` est absent de `statFormSchema`, comme au Lot 8E (écart nº 108) :
 * retirer un chiffre du site est une décision, pas une saisie.
 *
 * `toConfirm`, EN REVANCHE, Y EST. La distinction n'est pas arbitraire : « ce
 * chiffre est à revalider » qualifie la donnée qu'on vient de taper, au même
 * titre que la précision qui l'accompagne. C'est même le seul moment où l'on
 * sait le dire — au moment où l'on recopie un nombre dont on n'est pas sûr.
 *
 * ---------------------------------------------------------------------------
 * L'APERÇU EST LE VRAI COMPOSANT, PAS UNE IMITATION
 * ---------------------------------------------------------------------------
 * Voir `<ApercuChiffre>` en bas de ce fichier. Il compte double ici : c'est lui
 * qui montre, avant enregistrement, que cocher la case produit « — » et non
 * « 0 ».
 */

/** Les six champs du §8G, dans l'ordre de saisie. */
function champsChiffre(): readonly FieldDescriptor[] {
  return [
    {
      kind: "text",
      name: "label",
      label: "Libellé",
      required: true,
      maxLength: 80,
      placeholder: "Bénéficiaires accompagnés",
      hint: "Ce que le visiteur lit sous le chiffre. Il sert aussi à fabriquer l'identifiant technique, à la création seulement.",
    },
    {
      /*
        ⚠️  LE CHAMP DU LOT.

        `nullable: true` fait apparaître la case « Ce chiffre n'est pas encore
        disponible ». Sans elle, la seule façon de dire « on ne connaît pas
        encore ce chiffre » serait de taper `0` — qui affirme le contraire, et
        que le site afficherait comme une donnée réelle.

        `min: 0` et `max` sont ceux du schéma : les attributs HTML aident la
        saisie au clavier numérique, la validation Zod est ce qui protège.
      */
      kind: "number",
      name: "value",
      label: "Chiffre",
      nullable: true,
      min: 0,
      max: VALEUR_MAX,
      hint: "Laissez la case cochée tant que le chiffre n'a pas été consolidé : le site affichera « — ». Ne saisissez jamais 0 pour dire « je ne sais pas ».",
    },
    {
      kind: "text",
      name: "suffix",
      label: "Suffixe",
      maxLength: 8,
      placeholder: "+",
      hint: "Accolé au chiffre, sans espace : « 30+ », « 80% ». Laissez vide s'il n'y en a pas.",
    },
    {
      kind: "icon",
      name: "icon",
      label: "Icône",
      required: true,
      hint: "Affichée au-dessus du chiffre. Elle est décorative : le libellé reste lisible sans elle.",
    },
    {
      kind: "textarea",
      name: "note",
      label: "Précision",
      maxLength: 300,
      rows: 2,
      placeholder:
        "Chiffre issu du rapport d'activité 2025, périmètre Douala et Yaoundé.",
      hint: "Affichée sous la carte sur la page « Impact & transparence », jamais sur l'accueil. C'est elle qui rend le chiffre vérifiable — la page promet que chaque valeur est accompagnée de sa source.",
    },
    {
      kind: "boolean",
      name: "toConfirm",
      label: "Ce chiffre doit encore être validé par l'association",
      hint: "Signal interne : il n'apparaît pas sur le site. Le tableau des chiffres compte les lignes concernées, pour qu'aucune ne soit oubliée.",
    },
  ];
}

/** Les clés du formulaire — pour rattacher une erreur serveur au bon champ. */
const CLES_FORMULAIRE = [
  "label",
  "value",
  "suffix",
  "icon",
  "note",
  "toConfirm",
] as const satisfies readonly (keyof StatFormInput)[];

/**
 * Valeurs d'un formulaire vierge.
 *
 * ⚠️  `value: null` — LE CHIFFRE NAÎT INCONNU, ET C'EST LA SEULE VALEUR DE
 * DÉPART HONNÊTE.
 *
 * `0` aurait été le défaut « naturel » d'un champ numérique, et il aurait
 * suffi d'enregistrer sans y toucher pour publier un zéro que personne n'a
 * voulu. `null` oblige à décocher la case pour saisir un chiffre : le geste est
 * explicite, et l'état intermédiaire — « la carte existe, le chiffre viendra »
 * — est exactement celui de `beneficiaires` aujourd'hui.
 *
 * `Sparkles` est l'icône de REPLI du registre, celle qui signifie « aucune
 * icône choisie » : c'est la seule qui n'affirme rien (même raisonnement qu'au
 * Lot 8E).
 */
const VALEURS_VIERGES: StatFormInput = {
  label: "",
  value: null,
  suffix: "",
  icon: "Sparkles",
  note: "",
  toConfirm: false,
};

export function StatForm({
  chiffre,
}: {
  /** `undefined` = création. */
  chiffre?: Stat;
}) {
  const router = useRouter();
  const creation = chiffre === undefined;

  const valeursInitiales: StatFormInput = chiffre
    ? {
        label: chiffre.label,
        value: chiffre.value,
        // `null` → `""` : un `<input>` ne sait pas afficher `null`, et React
        // avertirait sur un champ contrôlé passant de `null` à une chaîne.
        suffix: chiffre.suffix ?? "",
        icon: chiffre.icon,
        note: chiffre.note ?? "",
        toConfirm: chiffre.toConfirm,
      }
    : VALEURS_VIERGES;

  return (
    <SchemaForm<StatFormInput>
      fields={champsChiffre()}
      schema={statFormSchema}
      defaultValues={valeursInitiales}
      submitLabel={creation ? "Créer le chiffre" : "Enregistrer les modifications"}
      onSubmit={async (saisie, outils) => {
        /*
          ---------------------------------------------------------------------
          LA CONVERSION `"" → null`, FAITE À UN SEUL ENDROIT
          ---------------------------------------------------------------------
          Les colonnes `suffix` et `note` sont nullables ; le formulaire
          manipule des chaînes, parce que c'est ce que rend un `<input>`.
          `null` (« pas de suffixe ») et `""` (« suffixe vide ») décriraient la
          même chose avec deux valeurs différentes. Même traitement qu'au
          Lot 8D pour la biographie d'un membre.

          ⚠️  `value` N'EST PAS CONCERNÉ. Son `null` est une INTENTION, pas une
          chaîne vide, et il est transmis tel quel. Le glisser dans la même
          normalisation — par exemple avec un `|| null` — reviendrait à
          transformer un vrai `0` en « chiffre non disponible ».
        */
        const charge = {
          label: saisie.label,
          value: saisie.value,
          suffix: saisie.suffix.trim() || null,
          icon: saisie.icon,
          note: saisie.note.trim() || null,
          toConfirm: saisie.toConfirm,
        };

        const resultat = creation
          ? await creerChiffreAction(charge)
          : await mettreAJourChiffreAction({ id: chiffre.id, ...charge });

        if (resultat.ok) {
          if (creation) {
            toast.success(
              saisie.value === null
                ? "Chiffre créé. La carte apparaît sur l'accueil et sur « Impact », avec « — » à la place du chiffre."
                : "Chiffre créé. La carte apparaît sur l'accueil et sur « Impact ».",
            );
            router.push(`/dashboard/chiffres/${resultat.data.id}`);
          } else {
            toast.success("Modifications enregistrées.");
            // Les données de la page viennent du rendu serveur : sans ce
            // rafraîchissement, l'en-tête garderait l'ancien libellé.
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
      <ApercuChiffre />
    </SchemaForm>
  );
}

/**
 * L'aperçu de la carte, telle qu'elle apparaîtra sur les deux pages.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI C'EST LE VRAI `<StatCard>` ET NON UNE MAQUETTE
 * ---------------------------------------------------------------------------
 * Un aperçu réécrit à la main est un aperçu qui MENT tôt ou tard. Ici c'est le
 * composant lui-même, alimenté par les valeurs en cours de saisie.
 *
 * ⚠️  Sur cette collection, il fait plus que rassurer sur une mise en page :
 * **il montre l'invariant nº 1 à l'œuvre.** Cocher « pas encore disponible »
 * remplace le chiffre par « — » sous les yeux de la personne qui saisit, avant
 * tout enregistrement. C'est la démonstration que le site ne va pas afficher
 * « 0 » — et c'est plus convaincant qu'une phrase d'aide qui le promettrait.
 *
 * La précision (`note`) est rendue SOUS la carte, comme sur `/impact`, avec la
 * même classe typographique — et l'aperçu dit que l'accueil, lui, ne l'affiche
 * pas. Sans cela, on croirait la précision visible partout.
 *
 * `<SchemaForm>` rend ses `children` À L'INTÉRIEUR de son `FormProvider` : ce
 * composant lit donc le formulaire par `useFormContext()`, sans qu'aucune prop
 * n'ait à traverser.
 */
function ApercuChiffre() {
  const { control } = useFormContext<StatFormInput>();
  const saisie = useWatch({ control });

  const precision = saisie.note?.trim() ?? "";

  /*
    ⚠️  TROIS ÉTATS À L'ÉCRAN, PAS DEUX.

    Le champ `number` porte un état de plus que la donnée : « vide, et pas
    encore déclaré indisponible » — ce que produit le fait de décocher la case
    sans avoir encore tapé (écart nº 126). Le formulaire refuse cet état à
    l'enregistrement ; l'aperçu, lui, doit le DIRE plutôt que de montrer une
    carte que rien ne permet d'obtenir.

    `typeof === "number"` et non un `??` : `0` est falsy, et le confondre avec
    l'absence est exactement la faute que ce lot existe pour empêcher.
  */
  const chiffreSaisi = typeof saisie.value === "number" ? saisie.value : null;
  const enAttenteDeSaisie = saisie.value !== null && chiffreSaisi === null;

  return (
    <section
      aria-labelledby="apercu-chiffre"
      className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4"
    >
      <h2 id="apercu-chiffre" className="text-sm font-medium text-foreground">
        Aperçu de la carte
      </h2>

      <p className="text-sm text-muted-foreground">
        Voici comment ce chiffre apparaît sur la page d&apos;accueil et sur
        « Impact &amp; transparence ». La précision, en dessous, n&apos;est
        affichée que sur « Impact ».
      </p>

      {/*
        La largeur est bornée à celle d'une colonne de la grille publique
        (`lg:grid-cols-4`) : un aperçu pleine largeur donnerait une idée fausse
        de la place dont dispose le libellé, qui est précisément ce qu'on
        cherche à vérifier — « Années au service des communautés » tient sur
        trois lignes.
      */}
      <div className="flex max-w-xs flex-col">
        <StatCard
          stat={{
            label: saisie.label?.trim() || "Libellé du chiffre",
            value: chiffreSaisi,
            suffix: saisie.suffix?.trim() || null,
            icon: saisie.icon ?? "Sparkles",
          }}
        />

        {enAttenteDeSaisie ? (
          <p className="mt-2 px-1 text-xs leading-relaxed text-muted-foreground">
            Champ vide : saisissez un chiffre, ou cochez « Ce chiffre n&apos;est
            pas encore disponible ». Tant que ni l&apos;un ni l&apos;autre
            n&apos;est fait, la carte ne peut pas être enregistrée.
          </p>
        ) : null}

        {precision ? (
          <p className="mt-2 px-1 text-xs leading-relaxed text-muted-foreground">
            {precision}
          </p>
        ) : null}
      </div>
    </section>
  );
}
