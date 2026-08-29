"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";

import type { FieldDescriptor } from "@/core/cms/blocks/types";
import type { Programme } from "@/core/cms/entities/programme";
import {
  programmeFormSchema,
  type ProgrammeFormInput,
} from "@/core/cms/schemas/programme.schema";
import { slugify } from "@/core/shared/slug";
import { siteUrl } from "@/lib/site-config";
import {
  creerProgrammeAction,
  mettreAJourProgrammeAction,
} from "@/server/actions/programmes.actions";

import { SchemaForm } from "../forms/schema-form";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LE FORMULAIRE D'UN PROGRAMME — création et modification
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8A.2 du Rapport 2. Un seul composant pour les deux écrans : les champs sont
 * les mêmes, seul l'appel de fin diffère. Deux formulaires auraient été deux
 * occasions de laisser diverger une contrainte de saisie.
 *
 * ---------------------------------------------------------------------------
 * AUCUN JSX DE FORMULAIRE N'EST ÉCRIT ICI
 * ---------------------------------------------------------------------------
 * Douze descripteurs et `<SchemaForm>`. C'est la propriété nº 2 du §10 du
 * Rapport 1, et elle apporte gratuitement ce qu'on oublie en écrivant un
 * formulaire à la main : libellé associé, `role="alert"`, `aria-describedby`,
 * champs à 44 px, `text-base` sous `md:`, barre d'enregistrement collante
 * au-dessus de la zone sûre. Tout cela est recetté depuis le Lot 6.
 *
 * ---------------------------------------------------------------------------
 * VOCABULAIRE MÉTIER, PAS TECHNIQUE (§12 du Rapport 1)
 * ---------------------------------------------------------------------------
 * « Adresse de la page », pas « slug ». « Ce que nous faisons », pas
 * « actions[] ». Les libellés reprennent mot pour mot les titres de section de
 * la page publique : la personne qui remplit ce formulaire voit où chaque
 * champ atterrira.
 */

/** Les douze champs du §8A.2, dans l'ordre de saisie. */
const CHAMPS_PROGRAMME: readonly FieldDescriptor[] = [
  {
    kind: "text",
    name: "title",
    label: "Titre du programme",
    required: true,
    maxLength: 120,
    placeholder: "Éducation",
    hint: "Le titre affiché en haut de la page du programme et sur les cartes.",
  },
  {
    kind: "text",
    name: "slug",
    label: "Adresse de la page",
    required: true,
    maxLength: 80,
    hint: "Proposée automatiquement à partir du titre. Vous pouvez la corriger tant que le programme n'est pas en ligne : la modifier ensuite casse les liens déjà partagés.",
  },
  {
    kind: "text",
    name: "shortTitle",
    label: "Titre court",
    required: true,
    maxLength: 40,
    placeholder: "Éducation",
    hint: "Utilisé dans le fil d'Ariane et sur les cartes étroites, où le titre complet ne tient pas.",
  },
  {
    kind: "textarea",
    name: "summary",
    label: "Résumé",
    required: true,
    maxLength: 300,
    rows: 3,
    hint: "Une à deux phrases. C'est ce texte qui apparaît sous le titre, sur les cartes et dans les résultats de recherche Google.",
  },
  {
    kind: "icon",
    name: "icon",
    label: "Icône",
    required: true,
    hint: "Affichée sur la carte du programme et dans la colonne « Comment soutenir ».",
  },
  {
    kind: "tone",
    name: "tone",
    label: "Teinte",
    required: true,
    hint: "Colore l'en-tête de la page du programme.",
  },
  {
    kind: "text",
    name: "benevolatLabel",
    label: "Domaine de bénévolat",
    required: true,
    maxLength: 80,
    placeholder: "Éducation et soutien scolaire",
    hint: "⚠️ Ce libellé alimente la liste déroulante du formulaire de bénévolat. Il n'apparaît que si le programme est en ligne.",
  },
  {
    kind: "list",
    name: "actions",
    label: "Ce que nous faisons",
    itemLabel: "action",
    of: [{ kind: "text", name: "", label: "Action" }],
    required: true,
    max: 20,
    hint: "Les activités concrètes menées dans le cadre de ce programme. Des intentions, jamais des résultats chiffrés non validés.",
  },
  {
    kind: "list",
    name: "publics",
    label: "À qui ce programme s'adresse",
    itemLabel: "public",
    of: [{ kind: "text", name: "", label: "Public" }],
    required: true,
    max: 20,
  },
  {
    kind: "list",
    name: "besoins",
    label: "Comment soutenir ce programme",
    itemLabel: "besoin",
    of: [{ kind: "text", name: "", label: "Besoin" }],
    required: true,
    max: 20,
    hint: "Chaque ligne devient une façon concrète d'aider, à côté des boutons « Faire un don » et « Devenir bénévole ».",
  },
  {
    kind: "media",
    name: "coverMediaId",
    label: "Image de couverture",
    accept: "image",
    hint: "Affichée en haut de la page et sur la carte du programme. Tant qu'aucune image n'est choisie, le site conserve le visuel actuel.",
  },
  {
    kind: "media",
    name: "galleryMediaIds",
    label: "Photos « Sur le terrain »",
    accept: "image",
    multiple: true,
    max: 24,
    hint: "La galerie de la page du programme. Elles s'affichent dans l'ordre choisi ici.",
  },
];

/** Les clés du formulaire — pour rattacher une erreur serveur au bon champ. */
const CLES_FORMULAIRE = [
  "title",
  "slug",
  "shortTitle",
  "summary",
  "icon",
  "tone",
  "benevolatLabel",
  "actions",
  "publics",
  "besoins",
  "coverMediaId",
  "galleryMediaIds",
] as const satisfies readonly (keyof ProgrammeFormInput)[];

/** Valeurs d'un formulaire vierge. Aucune n'est inventée : elles sont vides. */
const VALEURS_VIERGES: ProgrammeFormInput = {
  title: "",
  slug: "",
  shortTitle: "",
  summary: "",
  icon: "Sparkles",
  tone: "blue",
  benevolatLabel: "",
  actions: [""],
  publics: [""],
  besoins: [""],
  coverMediaId: null,
  galleryMediaIds: [],
};

export function ProgrammeForm({
  programme,
}: {
  /** `undefined` = création. */
  programme?: Programme;
}) {
  const router = useRouter();
  const creation = programme === undefined;

  const valeurs: ProgrammeFormInput = programme
    ? {
        title: programme.title,
        slug: programme.slug,
        shortTitle: programme.shortTitle,
        summary: programme.summary,
        icon: programme.icon,
        tone: programme.tone,
        benevolatLabel: programme.benevolatLabel,
        actions: programme.actions,
        publics: programme.publics,
        besoins: programme.besoins,
        coverMediaId: programme.coverMediaId,
        galleryMediaIds: programme.galleryMediaIds,
      }
    : VALEURS_VIERGES;

  return (
    <SchemaForm<ProgrammeFormInput>
      fields={CHAMPS_PROGRAMME}
      schema={programmeFormSchema}
      defaultValues={valeurs}
      submitLabel={creation ? "Créer le programme" : "Enregistrer les modifications"}
      onSubmit={async (saisie, outils) => {
        const resultat = creation
          ? await creerProgrammeAction(saisie)
          : await mettreAJourProgrammeAction({ id: programme.id, ...saisie });

        if (resultat.ok) {
          if (creation) {
            toast.success(
              "Programme créé, en brouillon. Il n'est pas encore visible sur le site.",
            );
            router.push(`/dashboard/programmes/${resultat.data.id}`);
          } else {
            toast.success("Modifications enregistrées.");
            // Les données de la page viennent du rendu serveur : sans ce
            // rafraîchissement, l'en-tête garderait l'ancien titre.
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
      <AdressePublique creation={creation} />
    </SchemaForm>
  );
}

/**
 * L'aperçu d'adresse du §12, et la proposition automatique du §8A.2.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI CE COMPOSANT EXISTE PLUTÔT QU'UNE OPTION DE `<SchemaForm>`
 * ---------------------------------------------------------------------------
 * Dériver un champ d'un autre est un besoin de CE formulaire, pas du
 * générateur : le seul cas du projet est « adresse déduite du titre ».
 * Ajouter une option `derivedFrom` au descripteur aurait chargé un contrat
 * partagé par quinze écrans pour un usage unique.
 *
 * `<SchemaForm>` rend ses `children` À L'INTÉRIEUR de son `FormProvider` : ce
 * composant lit donc le formulaire par `useFormContext()`, sans qu'aucune prop
 * n'ait à traverser.
 *
 * ---------------------------------------------------------------------------
 * L'ADRESSE N'EST PROPOSÉE QUE TANT QUE PERSONNE N'Y A TOUCHÉ
 * ---------------------------------------------------------------------------
 * Deux garde-fous, et le second est le plus important :
 *
 *   1. en MODIFICATION, jamais : réécrire l'adresse d'un programme publié
 *      parce qu'on corrige une faute dans son titre casserait les liens
 *      entrants et le référencement ;
 *   2. en CRÉATION, plus dès que l'utilisateur a modifié l'adresse à la main.
 *      Sans cela, corriger l'adresse puis reprendre le titre écraserait la
 *      correction, sans que personne comprenne pourquoi.
 */
function AdressePublique({ creation }: { creation: boolean }) {
  const { control, setValue } = useFormContext<ProgrammeFormInput>();

  const titre = useWatch({ control, name: "title" });
  const adresse = useWatch({ control, name: "slug" });

  /**
   * La dernière adresse que CE composant a proposée, ou `null` quand il a
   * cessé de proposer.
   *
   * Comparer la valeur courante à sa propre proposition est plus fiable que
   * d'interroger l'état « modifié » de react-hook-form : `dirtyFields` n'est
   * calculé que si un composant s'y est abonné, et `<SchemaForm>` ne s'abonne
   * qu'à `isDirty`. Une garde qui dépend d'un abonnement ailleurs est une
   * garde qu'on casse sans s'en apercevoir.
   */
  const derniereProposition = useRef<string | null>(creation ? "" : null);

  useEffect(() => {
    if (!creation || derniereProposition.current === null) return;

    // L'adresse ne correspond plus à ce qu'on avait proposé : quelqu'un l'a
    // saisie à la main. On se retire définitivement.
    if (adresse !== derniereProposition.current) {
      derniereProposition.current = null;
      return;
    }

    const propose = slugify(titre ?? "");
    if (propose === adresse) return;

    derniereProposition.current = propose;
    // `shouldDirty: false` : une valeur PROPOSÉE n'est pas une modification de
    // l'utilisateur. La marquer comme telle ferait annoncer « modifications
    // non enregistrées » à un formulaire vierge où personne n'a rien touché.
    setValue("slug", propose, { shouldDirty: false });
  }, [adresse, creation, setValue, titre]);

  return (
    <p className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2.5 text-sm">
      <span className="text-muted-foreground">Adresse publique : </span>
      {/*
        `break-all` : une adresse longue doit revenir à la ligne à
        l'intérieur de son encadré, jamais élargir la page (règle 2 du §12).
      */}
      <span className="break-all font-medium text-foreground">
        {apercuAdresse(adresse)}
      </span>
    </p>
  );
}

/** L'URL telle qu'elle apparaîtra, sans protocole — plus lisible. */
function apercuAdresse(slug: string | undefined): string {
  const domaine = siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `${domaine}/programmes/${slug || "…"}`;
}
