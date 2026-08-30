"use client";

import { ExternalLink } from "lucide-react";
import { useController, useFormContext } from "react-hook-form";

import { Field, fieldAria } from "@/components/forms/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { FieldDescriptor, FieldKind } from "@/core/cms/blocks/types";

import { CHAMP, CHAMP_MULTILIGNE, CHAMP_SELECT, CIBLE_44 } from "../field-styles";

/**
 * Les champs simples de `<SchemaForm>`.
 *
 * Tous suivent le même patron, et c'est ce patron qui compte :
 *
 *   1. `useController` — la valeur transite par react-hook-form, y compris
 *      quand elle vaut `null` ou un tableau, ce que `register` gère mal ;
 *   2. `Field` + `fieldAria` de `src/components/forms/field.tsx` —
 *      **l'accessibilité n'est jamais réécrite** : libellé associé,
 *      `role="alert"`, icône ET texte pour l'erreur, `aria-describedby`
 *      cohérent. Le §6.2 l'exige, et il a raison : trois formulaires écrits à
 *      la main, c'est trois occasions d'oublier le `htmlFor`.
 *
 * ---------------------------------------------------------------------------
 * CHAQUE COMPOSANT REÇOIT SON DESCRIPTEUR DÉJÀ RESTREINT
 * ---------------------------------------------------------------------------
 * `champ: Descripteur<'text' | 'link'>` plutôt que `FieldDescriptor` suivi
 * d'une vérification à l'exécution. Le `switch` de `field-control.tsx` fait le
 * rétrécissement une fois pour toutes, et TypeScript garantit qu'aucun
 * composant ne reçoit un descripteur qu'il ne sait pas rendre — sans qu'aucun
 * `throw` ne coure avant un hook, ce que les règles de React interdisent.
 */

/** Le membre de l'union correspondant à ces `kind`. */
export type Descripteur<K extends FieldKind> = Extract<
  FieldDescriptor,
  { kind: K }
>;

type Proprietes<K extends FieldKind> = {
  /** Chemin react-hook-form : `titre`, `actions.0`, `blocs.2.titre`. */
  name: string;
  champ: Descripteur<K>;
};

/** Identifiant DOM stable et valide, dérivé du chemin RHF. */
export function idDeChamp(name: string): string {
  return `champ-${name.replace(/[.[\]]/g, "-")}`;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Texte, lien
 * ═══════════════════════════════════════════════════════════════════════════ */

export function TextField({ name, champ }: Proprietes<"text" | "link">) {
  const id = idDeChamp(name);
  const { field, fieldState } = useController({ name, defaultValue: "" });
  const valeur = typeof field.value === "string" ? field.value : "";

  const maxLength = champ.kind === "text" ? champ.maxLength : undefined;

  /*
    Avertissement — pas une erreur — sur un lien externe. L'auteur a peut-être
    voulu pointer une page du site, peut-être un site tiers. On l'informe, on
    ne l'empêche pas : le §12 demande de l'aide contextuelle, pas des règles
    arbitraires.
  */
  const lienExterne =
    champ.kind === "link" && /^https?:\/\//i.test(valeur.trim());

  const aide =
    champ.hint ??
    (champ.kind === "link"
      ? "Une adresse interne commence par « / » (ex. /programmes), une adresse externe par « https:// »."
      : undefined);

  return (
    <Field
      id={id}
      label={champ.label}
      required={champ.required}
      hint={aide}
      error={fieldState.error?.message}
    >
      <Input
        type="text"
        inputMode={champ.kind === "link" ? "url" : undefined}
        placeholder={champ.kind === "text" ? champ.placeholder : undefined}
        maxLength={maxLength}
        className={CHAMP}
        {...fieldAria(id, !!fieldState.error, !!aide)}
        {...field}
        value={valeur}
        onChange={(evenement) => field.onChange(evenement.target.value)}
      />

      {maxLength ? <Compteur longueur={valeur.length} max={maxLength} /> : null}

      {lienExterne ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
          Lien externe : il s&apos;ouvrira dans un nouvel onglet.
        </p>
      ) : null}
    </Field>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Zone de texte
 * ═══════════════════════════════════════════════════════════════════════════ */

export function TextareaField({ name, champ }: Proprietes<"textarea">) {
  const id = idDeChamp(name);
  const { field, fieldState } = useController({ name, defaultValue: "" });
  const valeur = typeof field.value === "string" ? field.value : "";

  return (
    <Field
      id={id}
      label={champ.label}
      required={champ.required}
      hint={champ.hint}
      error={fieldState.error?.message}
    >
      <Textarea
        rows={champ.rows ?? 4}
        maxLength={champ.maxLength}
        placeholder={champ.placeholder}
        className={CHAMP_MULTILIGNE}
        {...fieldAria(id, !!fieldState.error, !!champ.hint)}
        {...field}
        value={valeur}
        onChange={(evenement) => field.onChange(evenement.target.value)}
      />

      {champ.maxLength ? (
        <Compteur longueur={valeur.length} max={champ.maxLength} />
      ) : null}
    </Field>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Texte riche — version 1 : un paragraphe par ligne, stocké en `string[]`
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Aucun éditeur WYSIWYG.
 *
 * `Actualite.body` et les corps de programmes sont déjà des `string[]` — un
 * paragraphe par entrée. Une zone de texte qui découpe sur les retours à la
 * ligne produit exactement cette forme, sans embarquer d'éditeur riche ni son
 * nettoyage HTML. C'est ce que le §6.2 appelle « v1 » ; le jour où le gras et
 * les liens seront nécessaires, la donnée n'aura pas à être migrée.
 */
export function RichTextField({ name, champ }: Proprietes<"richtext">) {
  const id = idDeChamp(name);
  const { field, fieldState } = useController({ name, defaultValue: [] });

  const paragraphes: string[] = Array.isArray(field.value)
    ? (field.value as string[])
    : [];
  const texte = paragraphes.join("\n\n");

  const aide =
    champ.hint ??
    "Laissez une ligne vide entre deux paragraphes. Chaque paragraphe est affiché séparément sur le site.";

  return (
    <Field
      id={id}
      label={champ.label}
      required={champ.required}
      hint={aide}
      error={fieldState.error?.message}
    >
      <Textarea
        rows={8}
        className={CHAMP_MULTILIGNE}
        {...fieldAria(id, !!fieldState.error, true)}
        {...field}
        value={texte}
        onChange={(evenement) =>
          field.onChange(decouperEnParagraphes(evenement.target.value))
        }
      />

      <p className="text-xs text-muted-foreground">
        {paragraphes.length} paragraphe{paragraphes.length > 1 ? "s" : ""}
      </p>
    </Field>
  );
}

/** Découpe sur les retours à la ligne, ignore les lignes vides. */
function decouperEnParagraphes(texte: string): string[] {
  return texte
    .split(/\r?\n/)
    .map((ligne) => ligne.trim())
    .filter(Boolean);
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Nombre — et la case « pas encore disponible »
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * ⚠️  INVARIANT Nº 1 DU PROJET, RENDU SAISISSABLE
 *
 * « Aucun chiffre fabriqué : une valeur absente est `NULL`, affichée “—”,
 * jamais `0`. » Sans la case ci-dessous, la seule façon pour un éditeur de
 * dire « on ne connaît pas encore ce chiffre » serait de taper `0` — qui
 * affirme le contraire, et que le site afficherait comme une donnée réelle.
 *
 * C'est le cas de `stats.beneficiaires`, à `NULL` en base depuis le seed
 * (Lot 1) précisément parce que personne n'a fourni le nombre.
 *
 * Quand la case est cochée, le champ est désactivé et vidé : on ne peut pas
 * enregistrer « inconnu » et « 4 200 » en même temps.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  CORRECTION DU LOT 8G — DÉCOCHER NE REMET PLUS `0` (écart nº 126)
 * ---------------------------------------------------------------------------
 * Ce champ a été écrit au Lot 6 et n'avait **jamais eu d'appelant** avant le
 * Lot 8G. L'exercer a fait apparaître un défaut réel :
 *
 *     onCheckedChange={(coche) => field.onChange(coche === true ? null : 0)}
 *
 * Décocher « pas encore disponible » écrivait `0` dans le champ. Enregistrer
 * sans rien taper de plus publiait donc un zéro que personne n'avait décidé —
 * exactement ce que la case existe pour empêcher, dans le geste même qui
 * l'annule.
 *
 * Décocher produit maintenant un champ VIDE, et le schéma dit quoi faire :
 * « Indiquez un chiffre, ou cochez “Ce chiffre n'est pas encore disponible” ».
 * Deux issues, toutes les deux honnêtes ; aucune valeur par défaut.
 *
 * ⚠️  CONSÉQUENCE SUR LE TEST D'ÉTAT, et c'est là que le défaut se cachait :
 * `null` (« pas disponible ») et « champ vide » (« pas encore saisi ») ne
 * peuvent plus être confondus. `inconnu = value === null || value === undefined`
 * laissait la case cochée et le champ désactivé sur un champ simplement vidé —
 * il n'y avait donc plus aucun moyen d'y taper quoi que ce soit. Le test porte
 * désormais sur `null` SEUL.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  POURQUOI LE CHAMP VIDE EST `""` ET NON `undefined`
 * ---------------------------------------------------------------------------
 * Première version du correctif : `field.onChange(undefined)`. **Elle ne
 * fonctionnait pas**, et la recette navigateur l'a montrée avant qu'elle
 * n'atteigne un utilisateur — la case refusait tout simplement de se décocher.
 *
 * La cause est dans react-hook-form : `useController` résout sa valeur par
 * `get(valeurs, nom, défaut)`, et `get` substitue le DÉFAUT dès que la valeur
 * lue est `undefined`. Écrire `undefined` dans le formulaire est donc
 * indiscernable de « ce champ n'a jamais été touché » : la bibliothèque
 * relisait aussitôt `null`, la case se recochait toute seule, et le champ
 * restait désactivé.
 *
 * `""` est la seule valeur « vide » que RHF sait porter — et elle convient
 * exactement : c'est ce que rend un `<input>` vidé, et `z.number("…")` la
 * refuse avec le message qui nomme les deux issues. Le message de TYPE du
 * schéma n'est donc pas un ornement : **c'est lui qui rend ce correctif
 * possible** (acquis de l'écart nº 90).
 *
 * ⚠️  Un champ `number` NON nullable doit donc, lui aussi, porter un
 * `z.number("…")` avec un message français dans son schéma : sans lui, un champ
 * vidé produit « Invalid input: expected number, received string ».
 */
export function NumberField({ name, champ }: Proprietes<"number">) {
  const id = idDeChamp(name);
  const { field, fieldState } = useController({
    name,
    defaultValue: champ.nullable ? null : 0,
  });

  /** « L'utilisateur a déclaré que ce chiffre n'existe pas encore. » */
  const indisponible = champ.nullable === true && field.value === null;
  const valeur = typeof field.value === "number" ? String(field.value) : "";

  return (
    <Field
      id={id}
      label={champ.label}
      hint={champ.hint}
      error={fieldState.error?.message}
      // `required` est faux dès que `null` est une valeur légitime.
      required={!champ.nullable}
    >
      <div className="flex items-center gap-2">
        <Input
          type="number"
          inputMode="numeric"
          min={champ.min}
          max={champ.max}
          className={CHAMP}
          {...fieldAria(id, !!fieldState.error, !!champ.hint)}
          {...field}
          disabled={indisponible}
          value={valeur}
          onChange={(evenement) => {
            const brut = evenement.target.value;
            /*
              Champ vidé → `""`, dans TOUS les cas. Voir l'en-tête : ni `null`
              (qui cocherait la case toute seule en pleine saisie), ni
              `undefined` (que react-hook-form ravale). C'est Zod qui dit quoi
              faire, avec le message qui nomme les deux issues.
            */
            if (brut === "") {
              field.onChange("");
              return;
            }
            const nombre = Number(brut);
            field.onChange(Number.isNaN(nombre) ? "" : nombre);
          }}
        />

        {champ.unit ? (
          <span className="shrink-0 text-sm text-muted-foreground">
            {champ.unit}
          </span>
        ) : null}
      </div>

      {champ.nullable ? (
        <label
          htmlFor={`${id}-inconnu`}
          className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-muted-foreground"
        >
          {/*
            `CIBLE_44` — CORRECTIF HORS PÉRIMÈTRE DU LOT 8B.

            La primitive `Checkbox` mesure 16 px et sa zone sensible native
            40 × 32 px : sous les 44 px de la règle 4 du §12. Le `<label>` en
            `min-h-11` agrandit la cible VISUELLE, mais un label autour d'un
            `<button>` Radix ne lui transmet pas le clic — la zone gagnée n'est
            pas cliquable. C'est exactement le défaut corrigé au Lot 8A sur les
            cases du `<DataTable>` (écart nº 65b).

            Il dormait ici depuis le Lot 6 : aucun écran livré n'avait encore de
            champ `number` nullable ni de champ `boolean`. Le Lot 8B en apporte
            deux (« Exemple de mise en page », « Pas de date »), et le Lot 8G en
            fera le cœur de son écran.
          */}
          <Checkbox
            id={`${id}-inconnu`}
            className={CIBLE_44}
            checked={indisponible}
            /*
              ⚠️  Champ VIDE en décochant, JAMAIS `0` — écart nº 126. Voir
              l'en-tête : la version précédente publiait un zéro non décidé dans
              le geste même qui annule la case censée l'empêcher.
            */
            onCheckedChange={(coche) => field.onChange(coche === true ? null : "")}
          />
          Ce chiffre n&apos;est pas encore disponible
        </label>
      ) : null}

      {indisponible ? (
        <p className="text-xs text-muted-foreground">
          Le site affichera «&nbsp;—&nbsp;» à la place de ce chiffre.
        </p>
      ) : null}
    </Field>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Booléen
 * ═══════════════════════════════════════════════════════════════════════════ */

export function BooleanField({ name, champ }: Proprietes<"boolean">) {
  const id = idDeChamp(name);
  const { field, fieldState } = useController({ name, defaultValue: false });

  return (
    <div className="flex flex-col gap-1.5">
      {/*
        Une case à cocher n'utilise pas `Field` : son libellé est à DROITE et
        c'est le `<label>` entier qui doit être cliquable. Reproduire `Field`
        ici mettrait un libellé au-dessus et une case orpheline en dessous.
        Le `role="alert"` de l'erreur, lui, est conservé à l'identique.
      */}
      <label
        htmlFor={id}
        className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-medium"
      >
        {/* `CIBLE_44` : voir la note du champ `number` ci-dessus. */}
        <Checkbox
          id={id}
          className={CIBLE_44}
          checked={field.value === true}
          onCheckedChange={(coche) => field.onChange(coche === true)}
          aria-describedby={champ.hint ? `${id}-hint` : undefined}
          aria-invalid={fieldState.error ? true : undefined}
        />
        {champ.label}
      </label>

      {champ.hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {champ.hint}
        </p>
      ) : null}

      {fieldState.error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {fieldState.error.message}
        </p>
      ) : null}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Liste déroulante
 * ═══════════════════════════════════════════════════════════════════════════ */

export function SelectField({ name, champ }: Proprietes<"select">) {
  const id = idDeChamp(name);
  const { field, fieldState } = useController({ name, defaultValue: "" });

  return (
    <Field
      id={id}
      label={champ.label}
      required={champ.required}
      hint={champ.hint}
      error={fieldState.error?.message}
    >
      <Select
        value={typeof field.value === "string" ? field.value : ""}
        onValueChange={field.onChange}
      >
        <SelectTrigger
          className={CHAMP_SELECT}
          {...fieldAria(id, !!fieldState.error, !!champ.hint)}
        >
          <SelectValue placeholder="Choisir…" />
        </SelectTrigger>

        <SelectContent>
          {champ.options.map((option) => (
            /* `min-h-11` : les éléments shadcn sont en `py-1` (≈ 28 px). */
            <SelectItem
              key={option.value}
              value={option.value}
              className="min-h-11"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Compteur de caractères
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * `aria-live="polite"` et non `assertive` : le compteur ne doit pas
 * interrompre la frappe à chaque caractère. Il n'est annoncé que lorsque
 * l'utilisateur marque une pause. La bascule de couleur à 90 % est doublée
 * d'un passage en gras — jamais la couleur seule.
 */
function Compteur({ longueur, max }: { longueur: number; max: number }) {
  const proche = longueur > max * 0.9;

  return (
    <p
      aria-live="polite"
      className={
        proche
          ? "text-right text-xs font-semibold text-brand-orange-ink dark:text-brand-orange"
          : "text-right text-xs text-muted-foreground"
      }
    >
      {longueur} / {max} caractères
    </p>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Accès au contexte, pour les champs composés
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Récupère l'erreur attachée à un chemin, y compris imbriqué
 * (`actions.2.label`).
 *
 * `formState.errors` est un objet en arbre, pas une table plate : une
 * recherche par clé littérale ne trouverait jamais l'erreur d'un élément de
 * liste.
 */
export function useErreurDeChemin(chemin: string): string | undefined {
  const { formState } = useFormContext();

  let courant: unknown = formState.errors;
  for (const segment of chemin.split(".")) {
    if (courant === null || typeof courant !== "object") return undefined;
    courant = (courant as Record<string, unknown>)[segment];
  }

  if (courant !== null && typeof courant === "object" && "message" in courant) {
    const message = (courant as { message?: unknown }).message;
    return typeof message === "string" ? message : undefined;
  }

  return undefined;
}
