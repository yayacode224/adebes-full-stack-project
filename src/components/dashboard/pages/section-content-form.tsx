"use client";

import type { z } from "zod";

import { fusionnerAvecDefauts, getBlockDefinition } from "@/core/cms/blocks/registry";
import type { PageSection } from "@/core/cms/entities/page";

import { SchemaForm } from "../forms/schema-form";
import type { OptionsDeReference } from "../forms/references-context";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LE FORMULAIRE DE CONTENU D'UNE SECTION — zone CENTRE de l'éditeur (§9.3)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * « `<SchemaForm>` généré depuis `fields` du bloc sélectionné. »
 *
 * C'est le point exact où la promesse du §10 du Rapport 1 se vérifie :
 * « Un bloc à douze champs coûte douze lignes de déclaration, pas trois cents
 * lignes de JSX. » Ce composant ne connaît AUCUN des dix-sept blocs par son
 * nom — il lit `fields` et `schema` de la définition, quelle qu'elle soit.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  L'UNIQUE ASSERTION DE TYPE DE CET ÉCRAN, ET ELLE EST SŒUR DE CELLE DU
 *     `SectionRenderer`
 * ---------------------------------------------------------------------------
 * `<SchemaForm>` exige `z.ZodType<T, T>` pour un `T` FIXE, choisi par
 * l'appelant. Ici, `T` dépend d'une VALEUR lue au clic — le type de bloc de la
 * section sélectionnée — ce que le système de types ne peut pas résoudre sans
 * assertion, pour la même raison que `BLOCK_RENDERERS[section.blockType]` en
 * réclamait une côté rendu.
 *
 * Elle est sûre pour la même raison aussi : la recette du Lot 9 vérifie que les
 * dix-sept schémas sont IDEMPOTENTS (entrée = sortie), ce qui est précisément
 * la condition que `z.ZodType<T, T>` exprime.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `key={section.id}` CÔTÉ APPELANT — PAS UNE OPTION DE CE COMPOSANT
 * ---------------------------------------------------------------------------
 * `useForm` de react-hook-form ne relit `defaultValues` qu'au MONTAGE. Passer
 * d'une section à l'autre sans changer la `key` laisserait le formulaire de la
 * section précédente affiché, avec les champs de la nouvelle qui ne
 * correspondent à rien. C'est `<PageEditor>` qui pose cette clé — documenté ici
 * parce que l'oubli est silencieux et se découvre seulement en cliquant vite
 * d'une section à l'autre.
 *
 * ---------------------------------------------------------------------------
 * `references` EST UN PROP, PAS LU PAR CONTEXTE
 * ---------------------------------------------------------------------------
 * `useOptionsDeReference()` n'a de sens qu'À L'INTÉRIEUR du `<SchemaForm>` qui
 * pose son propre `<ReferencesProvider>` — c'est ce que `relation-fields.tsx`
 * consulte. Ce composant-ci vit AU-DESSUS de ce provider, exactement comme
 * `<TestimonialForm>` reçoit ses `programmes` en prop plutôt que de les lire
 * par un hook. `<PageEditor>` fournit donc les options déjà résolues — par
 * exemple les catégories de galerie pour `gallery-preview`.
 *
 * ---------------------------------------------------------------------------
 * LES CHAMPS ABSENTS DU CONTENU SONT COMBLÉS PAR LES DÉFAUTS DU BLOC
 * ---------------------------------------------------------------------------
 * `fusionnerAvecDefauts()` — la même fonction que celle appliquée avant
 * validation par `parseContenu()` (§9.4). Une section squelette du seed
 * (`content: {}`) ouvre donc un formulaire aux champs VIDES, pas un formulaire
 * qui plante sur une valeur manquante.
 */
export function SectionContentForm({
  section,
  references,
  onSubmit,
}: {
  section: PageSection;
  references?: OptionsDeReference;
  onSubmit: (contenu: Record<string, unknown>) => Promise<string | void>;
}) {
  const definition = getBlockDefinition(section.blockType);

  if (!definition) {
    return (
      <div className="rounded-xl border border-dashed border-destructive/40 bg-destructive/5 p-6 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">
          Le type de bloc « {section.blockType} » n&apos;existe plus.
        </p>
        <p className="mt-1.5">
          Cette section ne peut plus être modifiée. Vous pouvez la supprimer
          depuis l&apos;arbre des sections.
        </p>
      </div>
    );
  }

  const valeurs = fusionnerAvecDefauts(definition, section.content);

  // Voir l'avertissement en tête de fichier : `T` dépend d'une valeur connue
  // au clic, que le système de types ne résout pas seul.
  const schema = definition.schema as z.ZodType<
    Record<string, unknown>,
    Record<string, unknown>
  >;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="font-heading text-sm font-semibold text-foreground">
          {definition.label}
        </p>
        <p className="text-xs text-muted-foreground">{definition.description}</p>
      </div>

      <SchemaForm<Record<string, unknown>>
        fields={definition.fields}
        schema={schema}
        defaultValues={valeurs}
        submitLabel="Enregistrer la section"
        references={references}
        onSubmit={async (saisie) => onSubmit(saisie)}
      />
    </div>
  );
}
