"use client";

import { Search } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { useController } from "react-hook-form";

import { Field } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { ICON_NAMES, ICONS, type IconName } from "@/components/ui-ext/icon-registry";
import {
  MEDIA_TONES,
  MEDIA_TONE_LABELS,
  type MediaTone,
} from "@/core/cms/entities/media-tone";
import { cn } from "@/lib/utils";

import { CHAMP, PASTILLE_CHOIX } from "../field-styles";
import { idDeChamp, type Descripteur } from "./basic-fields";

/**
 * Les deux grilles de choix : icône et teinte.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  POURQUOI DES BOUTONS RADIO NATIFS, ET NON DES `<button>`
 * ═══════════════════════════════════════════════════════════════════════════
 * Une grille de `<button>` oblige à réimplémenter à la main le groupe de
 * boutons radio : `role="radiogroup"`, `aria-checked`, déplacement aux
 * flèches, un seul point d'entrée dans l'ordre de tabulation. C'est
 * exactement ce que `<input type="radio">` fait déjà, correctement, dans tous
 * les lecteurs d'écran.
 *
 * Les entrées sont donc natives et en `sr-only` ; c'est le `<label>` associé
 * qui porte l'habillage, et le sélecteur `peer-checked:` qui montre l'état.
 * Le focus reste visible grâce à `peer-focus-visible:`.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  JAMAIS LA COULEUR SEULE
 * ═══════════════════════════════════════════════════════════════════════════
 * Chaque pastille de teinte porte son libellé en toutes lettres sous la
 * couleur, et chaque icône porte son nom en `aria-label`. Une grille de cinq
 * carrés colorés est indéchiffrable pour une personne daltonienne et muette
 * pour un lecteur d'écran.
 */

/* ═══════════════════════════════════════════════════════════════════════════
 * Icône
 * ═══════════════════════════════════════════════════════════════════════════ */

export function IconField({
  name,
  champ,
}: {
  name: string;
  champ: Descripteur<"icon">;
}) {
  const id = idDeChamp(name);
  const idRecherche = useId();
  const { field, fieldState } = useController({ name, defaultValue: "" });
  const [recherche, setRecherche] = useState("");

  const choisie = field.value as string;

  const visibles = useMemo(() => {
    const terme = normaliser(recherche);
    if (!terme) return ICON_NAMES;
    return ICON_NAMES.filter((nom) => normaliser(nom).includes(terme));
  }, [recherche]);

  return (
    <Field
      id={id}
      label={champ.label}
      required={champ.required}
      hint={champ.hint ?? "L'icône illustre l'entrée sur le site public."}
      error={fieldState.error?.message}
    >
      {/*
        La recherche est un champ à part, hors du groupe radio : la placer
        dedans mêlerait une saisie libre à un choix, et les flèches du clavier
        n'auraient plus de sens.
      */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id={idRecherche}
          type="search"
          value={recherche}
          onChange={(evenement) => setRecherche(evenement.target.value)}
          placeholder="Rechercher une icône…"
          aria-label="Rechercher une icône"
          className={cn(CHAMP, "pl-9")}
        />
      </div>

      {visibles.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Aucune icône ne correspond à «&nbsp;{recherche}&nbsp;».
        </p>
      ) : (
        <div
          role="radiogroup"
          aria-label={champ.label}
          /* 4 colonnes sous `sm:`, 8 au-delà (§6.2). Chaque cible fait 44 px. */
          className="grid max-h-56 grid-cols-4 gap-2 overflow-y-auto rounded-lg border border-border p-2 sm:grid-cols-6 lg:grid-cols-8"
        >
          {visibles.map((nom) => (
            <ChoixIcone
              key={nom}
              nom={nom}
              groupe={id}
              choisie={choisie === nom}
              onChoisir={() => field.onChange(nom)}
            />
          ))}
        </div>
      )}

      <p aria-live="polite" className="text-xs text-muted-foreground">
        {choisie ? `Icône choisie : ${choisie}` : "Aucune icône choisie."}
      </p>
    </Field>
  );
}

function ChoixIcone({
  nom,
  groupe,
  choisie,
  onChoisir,
}: {
  nom: IconName;
  groupe: string;
  choisie: boolean;
  onChoisir: () => void;
}) {
  // Accès par propriété, jamais par appel de fonction : la règle
  // `react-hooks/static-components` signale toute valeur de composant
  // renvoyée par un appel pendant le rendu.
  const Icone = ICONS[nom];

  return (
    <label
      className={cn(
        PASTILLE_CHOIX,
        "relative cursor-pointer border-border text-muted-foreground hover:bg-muted",
        "has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary",
        "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
      )}
    >
      <input
        type="radio"
        name={groupe}
        value={nom}
        checked={choisie}
        onChange={onChoisir}
        className="sr-only"
        // Le nom de l'icône EST son libellé accessible : sans lui, le lecteur
        // d'écran annonce vingt-deux boutons radio identiques.
        aria-label={nom}
      />
      <Icone className="size-5" aria-hidden="true" />
    </label>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Teinte
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Les cinq teintes de `public.media_tone`.
 *
 * Les couleurs affichées ici sont les teintes DÉCORATIVES du logo — elles ne
 * portent aucun texte, la règle de contraste AA ne s'y applique donc pas. Le
 * libellé, lui, est en `text-foreground` sur le fond de la carte.
 */
const APERCU_TEINTE: Record<MediaTone, string> = {
  navy: "bg-brand-navy",
  blue: "bg-brand-blue",
  green: "bg-brand-green",
  orange: "bg-brand-orange",
  neutral: "bg-muted-foreground/40",
};

export function ToneField({
  name,
  champ,
}: {
  name: string;
  champ: Descripteur<"tone">;
}) {
  const id = idDeChamp(name);
  const { field, fieldState } = useController({ name, defaultValue: "neutral" });
  const choisie = field.value as string;

  return (
    <Field
      id={id}
      label={champ.label}
      required={champ.required}
      hint={
        champ.hint ??
        "Teinte de la carte et du visuel de remplacement quand aucune photo n'est fournie."
      }
      error={fieldState.error?.message}
    >
      <div
        role="radiogroup"
        aria-label={champ.label}
        className="grid grid-cols-3 gap-2 sm:grid-cols-5"
      >
        {MEDIA_TONES.map((teinte) => (
          <label
            key={teinte}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-border p-2 transition-colors hover:bg-muted",
              "has-[:checked]:border-primary has-[:checked]:bg-primary/5",
              "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
            )}
          >
            <input
              type="radio"
              name={id}
              value={teinte}
              checked={choisie === teinte}
              onChange={() => field.onChange(teinte)}
              className="sr-only"
            />
            {/* 44 px de haut : la pastille est la cible tactile. */}
            <span
              aria-hidden="true"
              className={cn("h-11 w-full rounded-md", APERCU_TEINTE[teinte])}
            />
            {/* Le libellé est du TEXTE, pas un `title` : jamais la couleur seule. */}
            <span className="text-xs font-medium text-foreground">
              {MEDIA_TONE_LABELS[teinte]}
            </span>
          </label>
        ))}
      </div>
    </Field>
  );
}

/** Comparaison insensible à la casse et aux accents. */
function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}
