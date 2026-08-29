"use client";

import { CalendarClock } from "lucide-react";
import { useController } from "react-hook-form";

import { Field, fieldAria } from "@/components/forms/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  estAVenir,
  formatDate,
  versDateSaisie,
  versInstantDepuisSaisie,
} from "@/lib/dates";

import { CHAMP, CIBLE_44 } from "../field-styles";
import { idDeChamp, type Descripteur } from "./basic-fields";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  CHAMP DE DATE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Le douzième `kind` de `FieldDescriptor`, ajouté au Lot 8B (voir le
 * commentaire du descripteur pour le raisonnement).
 *
 * ---------------------------------------------------------------------------
 * `<input type="date">` NATIF, PAS UN CALENDRIER MAISON
 * ---------------------------------------------------------------------------
 * Le sélecteur natif est celui que la personne connaît déjà, il est traduit,
 * accessible au clavier, et sur téléphone il ouvre la roue de dates du système
 * plutôt qu'une grille de 7 × 5 cases de 24 px. Un calendrier React aurait
 * demandé de réimplémenter tout cela — et la règle des 44 px avec.
 *
 * ---------------------------------------------------------------------------
 * LA VALEUR DU FORMULAIRE EST UN INSTANT, PAS UNE DATE
 * ---------------------------------------------------------------------------
 * `field.value` est une chaîne ISO complète (« 2025-08-20T08:00:00.000Z »),
 * parce que c'est ce que la colonne `timestamptz` contient et ce que le schéma
 * valide. Le `<input>`, lui, ne connaît que « 2025-08-20 ».
 *
 * La conversion aller-retour vit dans `src/lib/dates.ts` et préserve **l'heure
 * du jour existante** : corriger la date d'un article seedé à 09:00 ne doit pas
 * le ramener à minuit. Une donnée qu'on n'a pas demandé à changer ne change
 * pas.
 *
 * ---------------------------------------------------------------------------
 * LA DATE À VENIR EST ANNONCÉE
 * ---------------------------------------------------------------------------
 * §8B : « la RLS filtre déjà `published_at <= now()`, donc une date future ne
 * fuit pas — mais l'écran doit le DIRE, sinon l'utilisateur croira sa
 * publication ratée. » Le champ signale l'échéance ; l'écran de l'article, qui
 * seul sait ce que « publier » veut dire pour lui, en tire la phrase complète.
 */
export function DateField({
  name,
  champ,
}: {
  name: string;
  champ: Descripteur<"date">;
}) {
  const id = idDeChamp(name);
  const { field, fieldState } = useController({
    name,
    defaultValue: champ.nullable ? null : "",
  });

  const instant = typeof field.value === "string" ? field.value : null;
  const sansDate = !instant;
  const saisie = versDateSaisie(instant);

  return (
    <Field
      id={id}
      label={champ.label}
      // `required` est faux dès que l'absence de date est une réponse
      // légitime : l'astérisque promettrait une obligation qui n'existe pas.
      required={champ.nullable ? false : champ.required}
      hint={champ.hint}
      error={fieldState.error?.message}
    >
      <Input
        type="date"
        className={CHAMP}
        {...fieldAria(id, !!fieldState.error, !!champ.hint)}
        {...field}
        disabled={champ.nullable ? sansDate : false}
        value={saisie}
        onChange={(evenement) => {
          const brut = evenement.target.value;

          if (!brut) {
            // Champ vidé : `null` si le champ l'autorise, sinon la chaîne vide,
            // pour que Zod annonce « La date est obligatoire » plutôt que de
            // recevoir une valeur illisible.
            field.onChange(champ.nullable ? null : "");
            return;
          }

          field.onChange(versInstantDepuisSaisie(brut, instant));
        }}
      />

      {champ.nullable ? (
        <label
          htmlFor={`${id}-sans-date`}
          className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-muted-foreground"
        >
          <Checkbox
            id={`${id}-sans-date`}
            className={CIBLE_44}
            checked={sansDate}
            onCheckedChange={(coche) =>
              /*
                Décoché : on ne devine PAS une date. Le champ redevient
                saisissable et vide — proposer « aujourd'hui » écrirait une
                information que personne n'a donnée.
              */
              field.onChange(coche === true ? null : "")
            }
          />
          Pas de date pour l&apos;instant
        </label>
      ) : null}

      {instant && !fieldState.error ? (
        <p className="text-xs text-muted-foreground">
          {estAVenir(instant) ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
              <CalendarClock className="size-3.5 shrink-0" aria-hidden="true" />
              À venir : {formatDate(instant)}
            </span>
          ) : (
            formatDate(instant)
          )}
        </p>
      ) : null}
    </Field>
  );
}
