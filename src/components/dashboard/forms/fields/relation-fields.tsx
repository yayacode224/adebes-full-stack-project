"use client";

import { ChevronLeft, ChevronRight, ImageOff, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useController } from "react-hook-form";

import { MediaPicker } from "@/components/dashboard/media/media-picker";
import { MediaThumbnail } from "@/components/dashboard/media/media-thumbnail";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  MEDIA_ACCEPT_LABELS,
  type MediaAsset,
} from "@/core/cms/entities/media-asset";
import { cn } from "@/lib/utils";
import { lireMediaAction, lireMediasAction } from "@/server/actions/media.actions";

import { CHAMP } from "../field-styles";
import { useOptionsDeReference } from "../references-context";
import { idDeChamp, type Descripteur } from "./basic-fields";

/**
 * Les champs qui pointent vers une autre donnée : média et référence.
 */

/* ═══════════════════════════════════════════════════════════════════════════
 * Média — branché sur `<MediaPicker>` au Lot 7
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Le champ de sélection d'un média.
 *
 * ---------------------------------------------------------------------------
 * CE QUI A CHANGÉ AU LOT 7, ET SURTOUT CE QUI N'A PAS CHANGÉ
 * ---------------------------------------------------------------------------
 * Le Lot 6 avait livré ici un emplacement provisoire — un bouton désactivé et
 * la mention « disponible prochainement » — parce que `<MediaPicker>` ne peut
 * pas exister avant la médiathèque qu'il parcourt.
 *
 * Le §7 imposait de le remplacer « sans toucher au descripteur, au nom du
 * champ ni à la forme de la valeur ». C'est ce qui a été fait : la valeur reste
 * **un identifiant de média, ou `null`** (§7.3 : « renvoie un `mediaId`, jamais
 * une URL »), et aucun `FieldDescriptor` des Lots 8 et suivants n'a à être
 * réécrit.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI LA VIGNETTE EST CHARGÉE ICI
 * ---------------------------------------------------------------------------
 * Le formulaire ne connaît qu'un identifiant. Afficher « 8f3c-4a… » à quelqu'un
 * qui veut vérifier quelle photo il a choisie ne sert à rien : le champ
 * résout donc l'identifiant en média (`lireMediaAction`) pour montrer l'image
 * et sa description.
 *
 * Une référence qui ne pointe plus sur rien est DITE — jamais rendue par une
 * image cassée ni par un cadre vide qui ressemblerait à « aucun choix ». C'est
 * l'invariant nº 2 du projet à l'échelle d'un champ de formulaire.
 */
export function MediaField({
  name,
  champ,
}: {
  name: string;
  champ: Descripteur<"media">;
}) {
  const id = idDeChamp(name);
  const { field, fieldState } = useController({ name, defaultValue: null });
  const identifiant = typeof field.value === "string" ? field.value : null;

  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [media, setMedia] = useState<MediaAsset | null>(null);
  /** L'identifiant dont la résolution a ÉCHOUÉ, s'il y en a un. */
  const [introuvable, setIntrouvable] = useState<string | null>(null);

  const libelles = MEDIA_ACCEPT_LABELS[champ.accept];

  /*
    L'état affiché est DÉRIVÉ de la valeur du champ, il n'est pas recopié.

    Une première version remettait `media` à `null` dans l'effet quand la
    valeur changeait. La règle `react-hooks/set-state-in-effect` du compilateur
    React la refuse — et elle a raison : un `setState` synchrone dans un effet
    provoque un rendu de plus, et surtout il crée un instant où le champ vaut
    déjà le nouvel identifiant pendant que la vignette montre encore l'ancien
    fichier.

    Ici, `mediaAffiche` ne peut pas mentir : il n'existe que si le média chargé
    correspond exactement à la valeur courante. L'effet ne fait plus qu'une
    chose — aller chercher ce qui manque — et n'écrit qu'à l'arrivée de la
    réponse, hors du corps de l'effet.
  */
  const mediaAffiche = identifiant && media?.id === identifiant ? media : null;

  const resolution: "inactive" | "encours" | "introuvable" = !identifiant
    ? "inactive"
    : mediaAffiche
      ? "inactive"
      : introuvable === identifiant
        ? "introuvable"
        : "encours";

  useEffect(() => {
    if (!identifiant) return;
    // Déjà résolu, ou déjà su introuvable : ne pas relancer la requête à
    // chaque rendu du formulaire.
    if (media?.id === identifiant || introuvable === identifiant) return;

    let abandonne = false;

    void lireMediaAction({ id: identifiant }).then((resultat) => {
      if (abandonne) return;

      if (resultat.ok) setMedia(resultat.data);
      else setIntrouvable(identifiant);
    });

    return () => {
      abandonne = true;
    };
  }, [identifiant, introuvable, media?.id]);

  return (
    <Field
      id={id}
      label={champ.label}
      required={champ.required}
      hint={champ.hint}
      error={fieldState.error?.message}
    >
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center">
        {/* Aperçu */}
        <span className="size-16 shrink-0 overflow-hidden rounded-md">
          {mediaAffiche ? (
            <MediaThumbnail asset={mediaAffiche} sizes="64px" />
          ) : (
            <span
              aria-hidden="true"
              className="flex size-full items-center justify-center bg-muted text-muted-foreground"
            >
              <ImageOff className="size-6" />
            </span>
          )}
        </span>

        {/* État */}
        <div className="min-w-0 flex-1" aria-live="polite">
          {mediaAffiche ? (
            <>
              <p className="truncate text-sm font-medium text-foreground">
                {mediaAffiche.filename}
              </p>
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {mediaAffiche.altText}
              </p>
            </>
          ) : resolution === "encours" ? (
            <p className="text-sm text-muted-foreground">Chargement du fichier…</p>
          ) : resolution === "introuvable" ? (
            /*
              Le champ contient un identifiant, mais le fichier n'existe plus —
              il a été supprimé de la médiathèque. On le DIT, et on n'efface pas
              la valeur d'autorité : ce serait modifier le contenu sans que
              personne l'ait demandé.
            */
            <p className="text-sm font-medium text-destructive">
              Le fichier associé n&apos;existe plus. Choisissez-en un autre.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun{libelles.feminin ? "e" : ""} {libelles.singulier}{" "}
              sélectionné{libelles.feminin ? "e" : ""}.
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={() => setModaleOuverte(true)}>
            {identifiant ? "Changer…" : "Choisir…"}
          </Button>

          {identifiant ? (
            <Button type="button" variant="ghost" onClick={() => field.onChange(null)}>
              Retirer
            </Button>
          ) : null}
        </div>
      </div>

      <MediaPicker
        open={modaleOuverte}
        onOpenChange={setModaleOuverte}
        accept={champ.accept}
        valeur={identifiant}
        // La vignette suit la valeur du champ : il n'y a rien d'autre à
        // remettre à jour ici, `mediaAffiche` étant dérivé de `field.value`.
        onChoisir={(mediaId) => field.onChange(mediaId)}
      />
    </Field>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Média — sélection MULTIPLE (Lot 8A)
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Le champ de sélection de plusieurs médias — `galleryMediaIds` (§8A.2).
 *
 * ---------------------------------------------------------------------------
 * POURQUOI UN COMPOSANT DISTINCT ET NON UN DRAPEAU DANS `MediaField`
 * ---------------------------------------------------------------------------
 * Les deux n'ont ni la même valeur (`string | null` contre `string[]`), ni le
 * même état, ni les mêmes commandes : une galerie s'ORDONNE, un visuel de
 * couverture non. Les fondre dans un seul composant aurait produit une suite
 * de conditionnelles autour de chaque `useState`, et deux comportements dans
 * un fichier qu'on relit comme un seul.
 *
 * L'aiguillage se fait dans `field-control.tsx`, au même endroit que tous les
 * autres — c'est là que le `kind` est déjà lu.
 *
 * ---------------------------------------------------------------------------
 * L'ORDRE EST CELUI DU CHAMP, PAS CELUI DE LA GRILLE
 * ---------------------------------------------------------------------------
 * `<MediaPicker>` renvoie la sélection sans ordre voulu — sa grille est triée
 * par date d'ajout. La réconciliation est faite ici : les images déjà
 * présentes gardent leur rang, les nouvelles s'ajoutent à la suite, les
 * décochées disparaissent. Sans cela, retirer une image en réordonnerait
 * silencieusement onze autres.
 *
 * ⚠️  Réordonnancement par « Monter » / « Descendre », pas par glisser-déposer :
 * c'est l'exigence nº 3 du §12 (« une alternative sans glisser-déposer est
 * obligatoire »), et sur une galerie de six vignettes elle suffit à elle
 * seule. Chaque bouton fait 44 px.
 */
export function MediaMultiField({
  name,
  champ,
}: {
  name: string;
  champ: Descripteur<"media">;
}) {
  const id = idDeChamp(name);
  const { field, fieldState } = useController({ name, defaultValue: [] });

  const identifiants = useMemo(
    () => (Array.isArray(field.value) ? (field.value as string[]) : []),
    [field.value],
  );

  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [medias, setMedias] = useState<MediaAsset[]>([]);
  /** Les identifiants dont la résolution a été TENTÉE, réussie ou non. */
  const [resolus, setResolus] = useState<ReadonlySet<string>>(new Set());

  const libelles = MEDIA_ACCEPT_LABELS[champ.accept];

  /*
    Même règle qu'au champ simple (découverte de terrain nº 12) : l'effet
    synchronise avec l'extérieur, il ne recopie pas la valeur du champ dans un
    état. `parId` est DÉRIVÉ, il ne peut donc pas montrer l'image d'un
    identifiant qui vient d'être retiré.
  */
  const parId = useMemo(
    () => new Map(medias.map((media) => [media.id, media])),
    [medias],
  );

  /*
    Les identifiants restant à résoudre, sous une forme STABLE.

    Un tableau recalculé à chaque rendu relancerait l'effet indéfiniment : la
    dépendance est donc la chaîne, qui ne change que si la liste change
    réellement.
  */
  const aResoudre = identifiants
    .filter((identifiant) => !resolus.has(identifiant))
    .join(",");

  useEffect(() => {
    if (!aResoudre) return;

    const demandes = aResoudre.split(",");
    let abandonne = false;

    void lireMediasAction({ ids: demandes }).then((resultat) => {
      if (abandonne) return;

      // Les identifiants demandés sont marqués résolus même en échec : sans
      // cela, une référence morte relancerait la requête à chaque rendu.
      setResolus((precedents) => new Set([...precedents, ...demandes]));

      if (resultat.ok) {
        setMedias((precedents) => [
          ...precedents.filter(
            (media) => !resultat.data.some((nouveau) => nouveau.id === media.id),
          ),
          ...resultat.data,
        ]);
      }
    });

    return () => {
      abandonne = true;
    };
  }, [aResoudre]);

  function deplacer(index: number, sens: -1 | 1) {
    const cible = index + sens;
    if (cible < 0 || cible >= identifiants.length) return;

    const suivant = [...identifiants];
    [suivant[index], suivant[cible]] = [suivant[cible]!, suivant[index]!];
    field.onChange(suivant);
  }

  function retirer(identifiant: string) {
    field.onChange(identifiants.filter((autre) => autre !== identifiant));
  }

  return (
    <Field
      id={id}
      label={champ.label}
      required={champ.required}
      hint={champ.hint}
      error={fieldState.error?.message}
    >
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3">
        {identifiants.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">
            Aucune {libelles.singulier} pour l&apos;instant.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {identifiants.map((identifiant, index) => {
              const media = parId.get(identifiant);
              const perdu = !media && resolus.has(identifiant);

              return (
                <li
                  key={identifiant}
                  className="flex flex-col overflow-hidden rounded-lg border border-border"
                >
                  <span className="block">
                    {media ? (
                      <MediaThumbnail
                        asset={media}
                        sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 20vw"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="flex aspect-square w-full items-center justify-center bg-muted text-muted-foreground"
                      >
                        <ImageOff className="size-6" />
                      </span>
                    )}
                  </span>

                  <span className="px-2 pt-1.5">
                    {/*
                      Une référence morte est DITE. La retirer d'office
                      modifierait le contenu sans que personne l'ait demandé.
                    */}
                    <span
                      className={cn(
                        "line-clamp-2 text-xs",
                        perdu
                          ? "font-medium text-destructive"
                          : "text-muted-foreground",
                      )}
                    >
                      {perdu
                        ? "Fichier introuvable — retirez-le."
                        : (media?.altText ?? "Chargement…")}
                    </span>
                  </span>

                  <span className="mt-1 flex justify-between gap-1 p-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={index === 0}
                      aria-label={`Déplacer l'image ${index + 1} vers la gauche`}
                      onClick={() => deplacer(index, -1)}
                    >
                      <ChevronLeft className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={index === identifiants.length - 1}
                      aria-label={`Déplacer l'image ${index + 1} vers la droite`}
                      onClick={() => deplacer(index, 1)}
                    >
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Retirer l'image ${index + 1}`}
                      onClick={() => retirer(identifiant)}
                    >
                      <X className="size-4" aria-hidden="true" />
                    </Button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button type="button" variant="outline" onClick={() => setModaleOuverte(true)}>
            {identifiants.length === 0
              ? `Choisir des ${libelles.pluriel}…`
              : "Modifier la sélection…"}
          </Button>

          <p aria-live="polite" className="text-xs text-muted-foreground">
            {identifiants.length === 0
              ? "L'ordre d'affichage sur le site suivra l'ordre choisi ici."
              : `${identifiants.length} ${identifiants.length > 1 ? libelles.pluriel : libelles.singulier}, dans l'ordre d'affichage.`}
          </p>
        </div>
      </div>

      <MediaPicker
        open={modaleOuverte}
        onOpenChange={setModaleOuverte}
        accept={champ.accept}
        multiple
        valeur={identifiants}
        max={champ.max}
        onChoisir={(choisis) => {
          const retenus = new Set(choisis);
          // Les présents gardent leur rang, les nouveaux passent à la suite.
          const conserves = identifiants.filter((identifiant) =>
            retenus.has(identifiant),
          );
          const ajoutes = choisis.filter(
            (identifiant) => !identifiants.includes(identifiant),
          );
          field.onChange([...conserves, ...ajoutes]);
        }}
      />
    </Field>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Référence vers une autre entité
 * ═══════════════════════════════════════════════════════════════════════════ */

export function ReferenceField({
  name,
  champ,
}: {
  name: string;
  champ: Descripteur<"reference">;
}) {
  const id = idDeChamp(name);
  const { field, fieldState } = useController({
    name,
    defaultValue: champ.multiple ? [] : null,
  });
  const [recherche, setRecherche] = useState("");

  const options = useOptionsDeReference(champ.resource);

  const visibles = useMemo(() => {
    if (!options) return [];
    const terme = normaliser(recherche);
    if (!terme) return options;
    return options.filter((option) =>
      normaliser(`${option.label} ${option.detail ?? ""}`).includes(terme),
    );
  }, [options, recherche]);

  const selection = champ.multiple
    ? new Set(Array.isArray(field.value) ? (field.value as string[]) : [])
    : new Set(typeof field.value === "string" ? [field.value] : []);

  function basculer(valeur: string) {
    if (!champ.multiple) {
      // Re-cliquer sur l'entrée déjà choisie la désélectionne : sans cela, un
      // champ facultatif devient impossible à vider une fois rempli.
      field.onChange(selection.has(valeur) ? null : valeur);
      return;
    }
    const suivante = new Set(selection);
    if (suivante.has(valeur)) suivante.delete(valeur);
    else suivante.add(valeur);
    field.onChange([...suivante]);
  }

  /*
    Ressource non fournie : on le DIT. Une liste vide ferait croire qu'aucune
    entrée n'existe — c'est l'invariant nº 1 transposé aux relations : ne
    jamais laisser une absence de donnée passer pour une donnée.
  */
  if (!options) {
    return (
      <Field
        id={id}
        label={champ.label}
        required={champ.required}
        hint={champ.hint}
        error={fieldState.error?.message}
      >
        <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          La liste des éléments à associer n&apos;est pas disponible sur cet
          écran.
        </p>
      </Field>
    );
  }

  return (
    <Field
      id={id}
      label={champ.label}
      required={champ.required}
      hint={champ.hint}
      error={fieldState.error?.message}
    >
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={recherche}
          onChange={(evenement) => setRecherche(evenement.target.value)}
          placeholder="Rechercher…"
          aria-label={`Rechercher dans ${champ.label.toLowerCase()}`}
          className={cn(CHAMP, "pl-9")}
        />
      </div>

      {visibles.length === 0 ? (
        <p className="py-3 text-center text-sm text-muted-foreground">
          {recherche
            ? `Aucun résultat pour « ${recherche} ».`
            : "Aucun élément à associer pour l'instant."}
        </p>
      ) : (
        <ul
          role={champ.multiple ? "group" : "radiogroup"}
          aria-label={champ.label}
          className="max-h-56 divide-y divide-border overflow-y-auto rounded-lg border border-border"
        >
          {visibles.map((option) => (
            <li key={option.value}>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 px-3 py-2 transition-colors hover:bg-muted has-[:checked]:bg-primary/5">
                {champ.multiple ? (
                  <Checkbox
                    checked={selection.has(option.value)}
                    onCheckedChange={() => basculer(option.value)}
                  />
                ) : (
                  <input
                    type="radio"
                    name={id}
                    checked={selection.has(option.value)}
                    /*
                      `onChange` est requis par React sur une entrée contrôlée,
                      mais c'est `onClick` qui permet la désélection : un
                      bouton radio déjà coché n'émet pas `change` au second
                      clic.
                    */
                    onChange={() => undefined}
                    onClick={() => basculer(option.value)}
                    className="size-4 shrink-0 accent-primary"
                  />
                )}

                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {option.label}
                  </span>
                  {option.detail ? (
                    <span className="truncate text-xs text-muted-foreground">
                      {option.detail}
                    </span>
                  ) : null}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}

      <p aria-live="polite" className="text-xs text-muted-foreground">
        {selection.size === 0
          ? "Aucune sélection."
          : `${selection.size} élément${selection.size > 1 ? "s" : ""} sélectionné${selection.size > 1 ? "s" : ""}.`}
      </p>
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
