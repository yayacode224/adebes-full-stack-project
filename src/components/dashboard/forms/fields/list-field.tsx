"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useController, useFormContext, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ReorderHandle,
  ReorderProvider,
  deplacer,
  useElementTriable,
} from "@/components/dashboard/shared/reorder";
import type { FieldDescriptor } from "@/core/cms/blocks/types";
import { cn } from "@/lib/utils";

import { CHAMP } from "../field-styles";
import { FieldControl } from "../field-control";
import { idDeChamp, useErreurDeChemin, type Descripteur } from "./basic-fields";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LISTE ORDONNABLE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Alimente `actions[]`, `publics[]`, `besoins[]` et `bullets[]` — les quatre
 * listes du contenu actuel, toutes des tableaux de chaînes.
 *
 * ---------------------------------------------------------------------------
 * DEUX FORMES, DÉTECTÉES PAR LE DESCRIPTEUR
 * ---------------------------------------------------------------------------
 *   * **Liste de valeurs simples** — `of` contient un seul descripteur dont le
 *     `name` est vide. Chaque élément est une chaîne, à l'adresse
 *     `<liste>.<index>`. C'est le cas des quatre listes ci-dessus.
 *   * **Liste d'objets** — `of` contient plusieurs descripteurs nommés. Chaque
 *     élément est un objet, à l'adresse `<liste>.<index>.<champ>`.
 *
 * La convention `name: ''` est le seul moyen d'exprimer « cet élément n'a pas
 * de sous-champ, il EST la valeur » avec le type du §10, qui exige un `name`.
 *
 * ---------------------------------------------------------------------------
 * `setValue` SUR LE TABLEAU ENTIER, PAS `useFieldArray`
 * ---------------------------------------------------------------------------
 * `useFieldArray` ajoute un `id` à chaque élément : sur un tableau de chaînes,
 * il enveloppe les valeurs et la donnée enregistrée ne ressemble plus à ce que
 * le schéma attend. Écrire le tableau entier fonctionne pour les deux formes,
 * et rend le réordonnancement trivial — c'est le même tableau qui part au
 * glisser-déposer et aux boutons « Monter / Descendre ».
 *
 * ---------------------------------------------------------------------------
 * IDENTIFIANTS DE TRI DÉRIVÉS DE L'INDEX
 * ---------------------------------------------------------------------------
 * Choix assumé. Un identifiant tiré du hasard demanderait un état parallèle à
 * resynchroniser à chaque `reset()` du formulaire — une source de bugs pour
 * un gain nul ici : l'ordre ne change jamais pendant un glissement, seulement
 * au dépôt, et les champs sont contrôlés (la valeur suit le tableau, pas le
 * nœud du DOM).
 */
export function ListField({
  name,
  champ,
}: {
  name: string;
  champ: Descripteur<"list">;
}) {
  const id = idDeChamp(name);
  const { setValue } = useFormContext();
  const erreur = useErreurDeChemin(name);

  const brut = useWatch({ name }) as unknown;
  const valeurs: unknown[] = Array.isArray(brut) ? brut : [];

  const simple = champ.of.length === 1 && champ.of[0]!.name === "";
  const ids = valeurs.map((_, index) => `${name}.${index}`);
  const plafondAtteint = champ.max !== undefined && valeurs.length >= champ.max;

  function ecrire(suivantes: unknown[]) {
    setValue(name, suivantes, { shouldDirty: true, shouldTouch: true });
  }

  function ajouter() {
    if (plafondAtteint) return;
    ecrire([...valeurs, simple ? "" : valeurDepart(champ.of)]);
  }

  function supprimer(index: number) {
    ecrire(valeurs.filter((_, position) => position !== index));
  }

  function reordonner(ordre: string[]) {
    // `ordre` contient les identifiants — donc les index d'origine. On
    // reconstruit le tableau dans le nouvel ordre.
    ecrire(ordre.map((identifiant) => valeurs[ids.indexOf(identifiant)]));
  }

  function decaler(index: number, direction: "haut" | "bas") {
    const suivant = deplacer(ids, ids[index]!, direction);
    if (suivant) reordonner(suivant);
  }

  return (
    <div className="flex flex-col gap-2">
      {/*
        `Field` n'enveloppe pas la liste : il associerait son `<label>` à un
        `id` unique, alors qu'une liste n'a pas un champ mais n éléments. Le
        libellé est donc un `<p>` et le groupe porte `aria-labelledby` —
        c'est la forme correcte pour un ensemble de contrôles.
      */}
      <p id={`${id}-label`} className="text-sm font-medium">
        {champ.label}
        {champ.required ? (
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="text-xs font-normal text-muted-foreground">
            {" "}
            (facultatif)
          </span>
        )}
      </p>

      {champ.hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {champ.hint}
        </p>
      ) : null}

      {valeurs.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
          Aucun{champ.itemLabel.endsWith("e") ? "e" : ""} {champ.itemLabel} pour
          l&apos;instant.
        </p>
      ) : (
        <ReorderProvider ids={ids} onReorder={reordonner}>
          <ul
            role="group"
            aria-labelledby={`${id}-label`}
            aria-describedby={champ.hint ? `${id}-hint` : undefined}
            className="flex flex-col gap-2"
          >
            {ids.map((identifiant, index) => (
              <ElementDeListe
                key={identifiant}
                identifiant={identifiant}
                index={index}
                total={valeurs.length}
                name={name}
                champ={champ}
                simple={simple}
                onSupprimer={() => supprimer(index)}
                onDecaler={(direction) => decaler(index, direction)}
              />
            ))}
          </ul>
        </ReorderProvider>
      )}

      <div className="flex flex-col gap-1">
        <Button
          type="button"
          variant="outline"
          onClick={ajouter}
          disabled={plafondAtteint}
          className="w-full sm:w-auto"
        >
          <Plus className="size-4" aria-hidden="true" />
          Ajouter {champ.itemLabel}
        </Button>

        {plafondAtteint ? (
          <p className="text-xs text-muted-foreground">
            Maximum atteint ({champ.max}).
          </p>
        ) : null}
      </div>

      {erreur ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {erreur}
        </p>
      ) : null}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Un élément
 * ═══════════════════════════════════════════════════════════════════════════ */

function ElementDeListe({
  identifiant,
  index,
  total,
  name,
  champ,
  simple,
  onSupprimer,
  onDecaler,
}: {
  identifiant: string;
  index: number;
  total: number;
  name: string;
  champ: Descripteur<"list">;
  simple: boolean;
  onSupprimer: () => void;
  onDecaler: (direction: "haut" | "bas") => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, style, isDragging } =
    useElementTriable(identifiant);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        // `flex-wrap` : voir le bloc de commentaire des commandes ci-dessous.
        "flex flex-wrap items-start gap-1 rounded-lg border border-border bg-card p-1.5",
        isDragging && "shadow-lg ring-1 ring-primary/40",
      )}
    >
      <ReorderHandle
        label={`Déplacer ${champ.itemLabel} ${index + 1}`}
        setActivatorNodeRef={setActivatorNodeRef}
        attributes={attributes}
        listeners={listeners}
        className="mt-0.5"
      />

      {/*
        `basis-48` fixe la largeur À PARTIR DE LAQUELLE la ligne se coupe : en
        dessous de ~12 rem pour la saisie, les commandes passent à la ligne
        suivante plutôt que d'écraser le champ.
      */}
      <div className="min-w-0 flex-1 basis-48 py-0.5">
        {simple ? (
          <ValeurSimple
            name={`${name}.${index}`}
            libelle={`${champ.itemLabel} ${index + 1}`}
          />
        ) : (
          <div className="flex flex-col gap-3 pt-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {champ.itemLabel} {index + 1}
            </p>
            {champ.of.map((sousChamp) => (
              <FieldControl
                key={sousChamp.name}
                champ={sousChamp}
                name={`${name}.${index}.${sousChamp.name}`}
              />
            ))}
          </div>
        )}
      </div>

      {/*
        ═══════════════════════════════════════════════════════════════════════
         LES COMMANDES DE LA LIGNE — CORRIGÉES AU LOT 8A
        ═══════════════════════════════════════════════════════════════════════

        L'ALTERNATIVE SANS GLISSER-DÉPOSER est exigée par le §12. Deux boutons
        visibles plutôt qu'un menu : sur une liste de trois éléments, un menu
        déroulant coûte deux appuis là où un bouton en coûte un — et l'action
        reste atteignable au clavier sans ouvrir quoi que ce soit.

        ⚠️  CE QUI A CHANGÉ, ET POURQUOI.

        « Monter » et « Descendre » étaient EMPILÉS et faisaient 32 px
        (`size-8`). La recette du Lot 8A les a mesurés aux cinq largeurs : sous
        les 44 px de la règle 4 du §12, qui nomme précisément « les poignées de
        glisser-déposer » et les commandes de ligne. Le défaut ne pouvait pas
        se voir avant : c'est le premier écran réel à employer un champ `list`.

        Trois réponses ont été écartées :

          * les empiler en 44 px → une ligne de 88 px de haut, soit un
            formulaire deux fois plus long pour trois listes ;
          * agrandir la zone sensible par un pseudo-élément, comme pour les
            cases à cocher → les deux boutons étant collés, leurs zones se
            CHEVAUCHERAIENT et un appui deviendrait imprévisible ;
          * les cacher dans un menu → deux appuis au lieu d'un, et la raison
            d'être de ces boutons disparaît.

        La réponse retenue est de les mettre CÔTE À CÔTE en 44 px, avec les
        autres commandes, et de laisser le groupe passer À LA LIGNE quand la
        largeur manque (`flex-wrap` sur l'élément). Rien n'est masqué, rien
        n'est déplacé dans un menu, et la ligne ne grandit que là où c'est
        nécessaire — ce que le §12 demande explicitement (« elle doit être
        déplacée, pas supprimée »).
      */}
      <div className="ml-auto flex shrink-0 items-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={index === 0}
          aria-label={`Monter ${champ.itemLabel} ${index + 1}`}
          onClick={() => onDecaler("haut")}
        >
          <ChevronUp className="size-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={index === total - 1}
          aria-label={`Descendre ${champ.itemLabel} ${index + 1}`}
          onClick={() => onDecaler("bas")}
        >
          <ChevronDown className="size-4" aria-hidden="true" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive"
          aria-label={`Supprimer ${champ.itemLabel} ${index + 1}`}
          onClick={onSupprimer}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </li>
  );
}

/**
 * Un élément de liste simple : une chaîne, sans sous-champ.
 *
 * Pas de `<Field>` ici : il rendrait un `<label>` visible par élément
 * (« Action », « Action », « Action »…) et un « (facultatif) » sous chacun.
 * Le libellé est porté par `aria-label`, qui numérote — ce dont le lecteur
 * d'écran a besoin, et que l'œil lit déjà dans l'ordre de la liste.
 */
function ValeurSimple({ name, libelle }: { name: string; libelle: string }) {
  const { field, fieldState } = useController({ name, defaultValue: "" });

  return (
    <>
      <Input
        aria-label={libelle}
        aria-invalid={fieldState.error ? true : undefined}
        className={CHAMP}
        {...field}
        value={typeof field.value === "string" ? field.value : ""}
        onChange={(evenement) => field.onChange(evenement.target.value)}
      />
      {fieldState.error ? (
        <p role="alert" className="mt-1 text-xs font-medium text-destructive">
          {fieldState.error.message}
        </p>
      ) : null}
    </>
  );
}

/** Élément neuf d'une liste d'objets : chaque sous-champ à sa valeur vide. */
function valeurDepart(champs: readonly FieldDescriptor[]): Record<string, unknown> {
  const element: Record<string, unknown> = {};

  for (const champ of champs) {
    switch (champ.kind) {
      case "number":
        element[champ.name] = champ.nullable ? null : 0;
        break;
      case "boolean":
        element[champ.name] = false;
        break;
      case "richtext":
        element[champ.name] = [];
        break;
      case "list":
        element[champ.name] = [];
        break;
      case "media":
        element[champ.name] = null;
        break;
      case "reference":
        element[champ.name] = champ.multiple ? [] : null;
        break;
      default:
        element[champ.name] = "";
    }
  }

  return element;
}
