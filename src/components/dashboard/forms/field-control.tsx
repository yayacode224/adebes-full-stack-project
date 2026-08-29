"use client";

import type { FieldDescriptor } from "@/core/cms/blocks/types";

import {
  BooleanField,
  NumberField,
  RichTextField,
  SelectField,
  TextField,
  TextareaField,
} from "./fields/basic-fields";
import { IconField, ToneField } from "./fields/choice-fields";
import { DateField } from "./fields/date-field";
import { ListField } from "./fields/list-field";
import {
  MediaField,
  MediaMultiField,
  ReferenceField,
} from "./fields/relation-fields";

/**
 * L'aiguillage : un `kind` → un composant.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI UN `switch` EXHAUSTIF ET NON UNE TABLE
 * ---------------------------------------------------------------------------
 * Une table `Record<FieldKind, ComponentType>` ne peut pas transmettre à
 * chaque composant son descripteur RESTREINT : elle les typerait tous
 * `FieldDescriptor`, et chacun devrait revérifier son `kind` à l'exécution.
 * Le `switch` rétrécit l'union une fois pour toutes, à la compilation.
 *
 * Le `default` renvoie un membre `never` : ajouter une variante à
 * `FieldDescriptor` sans l'aiguiller ici **casse la compilation**. C'est ce
 * qui garantit qu'aucun champ déclaré ne finira silencieusement non rendu —
 * la panne la plus difficile à repérer dans un formulaire généré, puisqu'elle
 * ne produit aucune erreur, juste un champ absent.
 *
 * ---------------------------------------------------------------------------
 * `name` N'EST PAS `champ.name`
 * ---------------------------------------------------------------------------
 * C'est le CHEMIN react-hook-form, qui peut être imbriqué : `titre`,
 * `actions.0`, `blocs.2.titre`. Un champ de liste construit ce chemin pour ses
 * éléments ; le champ, lui, ne sait pas où il est monté.
 */
export function FieldControl({
  champ,
  name,
}: {
  champ: FieldDescriptor;
  /** Chemin RHF complet. Par défaut, le nom déclaré par le descripteur. */
  name?: string;
}) {
  const chemin = name ?? champ.name;

  switch (champ.kind) {
    case "text":
    case "link":
      return <TextField name={chemin} champ={champ} />;
    case "textarea":
      return <TextareaField name={chemin} champ={champ} />;
    case "richtext":
      return <RichTextField name={chemin} champ={champ} />;
    case "number":
      return <NumberField name={chemin} champ={champ} />;
    case "boolean":
      return <BooleanField name={chemin} champ={champ} />;
    case "date":
      return <DateField name={chemin} champ={champ} />;
    case "select":
      return <SelectField name={chemin} champ={champ} />;
    case "icon":
      return <IconField name={chemin} champ={champ} />;
    case "tone":
      return <ToneField name={chemin} champ={champ} />;
    case "media":
      // Deux composants, deux formes de valeur (`string | null` contre
      // `string[]`). L'aiguillage se fait ici, où le descripteur est déjà lu :
      // le porter dans `MediaField` y aurait mis deux comportements.
      return champ.multiple ? (
        <MediaMultiField name={chemin} champ={champ} />
      ) : (
        <MediaField name={chemin} champ={champ} />
      );
    case "reference":
      return <ReferenceField name={chemin} champ={champ} />;
    case "list":
      return <ListField name={chemin} champ={champ} />;
    default: {
      // Si cette ligne cesse de compiler, une variante de `FieldDescriptor`
      // vient d'être ajoutée sans composant correspondant.
      const jamais: never = champ;
      throw new Error(
        `Type de champ non pris en charge : ${JSON.stringify(jamais)}`,
      );
    }
  }
}
