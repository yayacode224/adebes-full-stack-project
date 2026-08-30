"use client";

import { Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { GalleryGrid } from "@/components/galerie/gallery-grid";
import { CmsImage } from "@/components/media/cms-image";
import type { FieldDescriptor } from "@/core/cms/blocks/types";
import {
  CATEGORIE_ABSENTE,
  TEINTE_SANS_CATEGORIE,
  type GalleryCategory,
  type GalleryItem,
} from "@/core/cms/entities/gallery";
import type { MediaAsset } from "@/core/cms/entities/media-asset";
import {
  galleryItemFormSchema,
  SANS_CATEGORIE,
  type GalleryItemFormInput,
} from "@/core/cms/schemas/gallery.schema";
import { lireMediaAction } from "@/server/actions/media.actions";
import {
  creerElementGalerieAction,
  mettreAJourElementGalerieAction,
} from "@/server/actions/gallery.actions";

import { SchemaForm } from "../forms/schema-form";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LE FORMULAIRE D'UN ÉLÉMENT DE GALERIE — création et modification
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8H du Rapport 2. Un seul composant pour les deux écrans : les champs sont
 * les mêmes, seul l'appel de fin diffère. Deux formulaires auraient été deux
 * occasions de laisser diverger une contrainte de saisie.
 *
 * ---------------------------------------------------------------------------
 * DEUX CHAMPS — LE FORMULAIRE LE PLUS COURT DU LOT 8, ET C'EST NORMAL
 * ---------------------------------------------------------------------------
 * `gallery_items` ne porte que `media_id`, `category_id`, `position` et
 * `status` (migration 0005). Les deux premiers se saisissent, les deux autres
 * sont des décisions — la position se règle à la glissière sur la liste, le
 * statut par les boutons de publication.
 *
 * ⚠️  Il n'y a donc AUCUN champ de texte ici, et c'est le point que ce lot
 * apprend : **la description de la photo appartient au MÉDIA**, pas à sa place
 * dans la grille. Elle se corrige dans la médiathèque, une fois, et suit
 * l'image partout où elle est employée. Ajouter une légende propre à l'élément
 * aurait créé deux textes concurrents pour une même photo — exactement ce que
 * le §8H écarte en migrant `legendes.json` vers `media_assets.alt_text`.
 *
 * ⚠️  Le lien proposé sous l'aperçu pointe vers `/dashboard/mediatheque`, et
 * PAS vers une fiche de média : cette route n'existe pas — la médiathèque ouvre
 * ses fiches en modale (Lot 7). Promettre `/dashboard/mediatheque/<id>` aurait
 * produit un lien mort, ce que l'invariant nº 2 interdit. Le libellé dit donc
 * ce que le lien fait réellement.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  PREMIER APPELANT RÉEL DE `<MediaPicker>` HORS MÉDIATHÈQUE… ET LE SEUL À
 *     L'EXIGER
 * ---------------------------------------------------------------------------
 * Trois formulaires portent déjà un champ `media` (programme, article, équipe),
 * mais tous les trois l'ont FACULTATIF : sans photo, le rendu retombe sur
 * `MediaPlaceholder`. Ici, `media_id` est `not null` en base — un élément de
 * galerie sans image n'existe pas.
 *
 * C'est la leçon du point retenu nº 1 du Lot 8G appliquée à l'avance : un
 * composant n'est éprouvé que par un écran qui s'en sert vraiment, et « choisir
 * une image » n'a jamais encore été une condition d'enregistrement.
 */

/** Les deux champs du §8H, dans l'ordre de saisie. */
function champsElement(
  categories: readonly GalleryCategory[],
): readonly FieldDescriptor[] {
  return [
    {
      kind: "media",
      name: "mediaId",
      label: "Photo",
      accept: "image",
      required: true,
      hint: "Choisissez une image de la médiathèque. Sa description — celle que lisent les lecteurs d'écran et qui s'affiche sous la photo agrandie — est saisie dans la médiathèque, une seule fois, et suit l'image partout.",
    },
    {
      kind: "select",
      name: "categoryId",
      label: "Catégorie",
      required: true,
      options: [
        ...categories.map((categorie) => ({
          value: categorie.id,
          label: categorie.label,
        })),
        /*
          « Sans catégorie » est une OPTION, pas l'absence d'option.

          Radix refuse `<SelectItem value="">`, et surtout : une photo non
          classée est un état légitime — la colonne est nullable. Le dire
          explicitement vaut mieux que de laisser la liste sur son texte de
          remplacement, qu'on prend pour un oubli.
        */
        { value: SANS_CATEGORIE, label: CATEGORIE_ABSENTE },
      ],
      hint:
        categories.length === 0
          ? "Aucune catégorie n'existe pour l'instant. Créez-en depuis « Gérer les catégories », sur la liste de la galerie."
          : "Elle décide du bouton de filtre qui atteint cette photo, et de la teinte affichée si l'image ne peut pas être chargée.",
    },
  ];
}

/** Les clés du formulaire — pour rattacher une erreur serveur au bon champ. */
const CLES_FORMULAIRE = [
  "mediaId",
  "categoryId",
] as const satisfies readonly (keyof GalleryItemFormInput)[];

/**
 * Valeurs d'un formulaire vierge. Aucune n'est inventée : elles sont vides.
 *
 * `mediaId: ""` plutôt que `null` : `""` est la seule valeur « vide » que
 * react-hook-form sait porter (découverte nº 51), et `z.uuid()` la refuse avec
 * le message qui parle de photo.
 */
const VALEURS_VIERGES: GalleryItemFormInput = {
  mediaId: "",
  categoryId: SANS_CATEGORIE,
};

export function GalleryItemForm({
  element,
  categories,
}: {
  /** `undefined` = création. */
  element?: GalleryItem;
  categories: readonly GalleryCategory[];
}) {
  const router = useRouter();
  const creation = element === undefined;

  const valeurs: GalleryItemFormInput = element
    ? {
        mediaId: element.mediaId,
        categoryId: element.categoryId ?? SANS_CATEGORIE,
      }
    : VALEURS_VIERGES;

  return (
    <SchemaForm<GalleryItemFormInput>
      fields={champsElement(categories)}
      schema={galleryItemFormSchema}
      defaultValues={valeurs}
      submitLabel={
        creation ? "Ajouter à la galerie" : "Enregistrer les modifications"
      }
      onSubmit={async (saisie, outils) => {
        /*
          La sentinelle est retraduite ICI, au dernier moment.

          Le schéma ne peut pas le faire : il transformerait sa valeur, donc
          aurait un type d'entrée différent de son type de sortie, ce que
          `<SchemaForm>` refuse (écart nº 71).
        */
        const categoryId =
          saisie.categoryId === SANS_CATEGORIE ? null : saisie.categoryId;

        const resultat = creation
          ? await creerElementGalerieAction({
              mediaId: saisie.mediaId,
              categoryId,
            })
          : await mettreAJourElementGalerieAction({
              id: element.id,
              mediaId: saisie.mediaId,
              categoryId,
            });

        if (resultat.ok) {
          if (creation) {
            toast.success(
              "Photo ajoutée, en brouillon. Elle n'apparaît pas encore sur la galerie du site.",
            );
            router.push(`/dashboard/galerie/${resultat.data.id}`);
          } else {
            toast.success("Modifications enregistrées.");
            // Les données de la page viennent du rendu serveur : sans ce
            // rafraîchissement, l'en-tête garderait l'ancienne photo.
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
      <ApercuElement categories={categories} />
    </SchemaForm>
  );
}

/**
 * L'aperçu — la VRAIE grille publique, avec une seule photo.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI C'EST `<GalleryGrid>` ET NON UNE MAQUETTE
 * ---------------------------------------------------------------------------
 * Même raison qu'au Lot 8E pour `<ValueCard>` et au Lot 8F pour
 * `<FAQAccordion>` : un aperçu réécrit à la main est un aperçu qui MENT tôt ou
 * tard. Ici c'est le composant de la page publique, alimenté par la saisie en
 * cours — s'il change, l'aperçu change.
 *
 * ⚠️  Ce qu'il montre et que rien d'autre ne montre : **quel bouton de filtre
 * atteint cette photo**. Les boutons rendus sont « Tous » et, s'il y en a une,
 * la catégorie choisie. Choisir « Sans catégorie » fait disparaître le second —
 * la conséquence de l'écart devient visible au lieu d'être expliquée, et elle
 * l'est au moment exact où la décision se prend.
 *
 * Il montre aussi le TEXTE ALTERNATIF, en ouvrant la photo : c'est la seule
 * façon de vérifier que la description héritée de la médiathèque convient à cet
 * emploi.
 *
 * `<SchemaForm>` rend ses `children` À L'INTÉRIEUR de son `FormProvider` : ce
 * composant lit donc le formulaire par `useFormContext()`, sans qu'aucune prop
 * n'ait à traverser.
 */
function ApercuElement({
  categories,
}: {
  categories: readonly GalleryCategory[];
}) {
  const { control } = useFormContext<GalleryItemFormInput>();
  const saisie = useWatch({ control });

  const identifiant =
    typeof saisie.mediaId === "string" && saisie.mediaId ? saisie.mediaId : null;

  const [media, setMedia] = useState<MediaAsset | null>(null);
  const [introuvable, setIntrouvable] = useState<string | null>(null);

  /*
    L'état affiché est DÉRIVÉ de la valeur du champ, il n'est pas recopié.

    Même patron que `MediaField` (découverte nº 12) : `mediaAffiche` n'existe
    que si le média chargé correspond exactement à la valeur courante. Il ne
    peut donc pas montrer l'ancienne photo pendant que le champ porte déjà la
    nouvelle.
  */
  const mediaAffiche = identifiant && media?.id === identifiant ? media : null;

  useEffect(() => {
    if (!identifiant) return;
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

  const categorie = categories.find(
    (candidate) => candidate.id === saisie.categoryId,
  );
  const teinte = categorie?.tone ?? TEINTE_SANS_CATEGORIE;

  return (
    <section
      aria-labelledby="apercu-element-galerie"
      className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4"
    >
      <h2
        id="apercu-element-galerie"
        className="text-sm font-medium text-foreground"
      >
        Aperçu sur le site
      </h2>

      <p className="text-sm text-muted-foreground">
        La vignette telle qu&apos;elle apparaît dans la grille de la page
        Galerie. Cliquez dessus pour voir la photo agrandie et la description
        qui l&apos;accompagne.
      </p>

      {/*
        Le fond est celui de la page publique (`bg-background`), pas celui du
        bloc d'aperçu : la grille y est posée sur du blanc, et un aperçu sur
        fond gris donnerait une idée fausse du contraste.
      */}
      <div className="rounded-lg border border-border bg-background p-4">
        {mediaAffiche ? (
          <GalleryGrid
            categories={
              categorie ? [{ slug: categorie.id, label: categorie.label }] : []
            }
            entries={[
              {
                id: mediaAffiche.id,
                category: categorie?.id ?? "",
                categoryLabel: categorie?.label ?? CATEGORIE_ABSENTE,
                alt: mediaAffiche.altText,
                thumb: (
                  <CmsImage
                    asset={mediaAffiche}
                    fill
                    tone={teinte}
                    compactPlaceholder
                    sizes="200px"
                  />
                ),
                full: (
                  <CmsImage
                    asset={mediaAffiche}
                    fill
                    tone={teinte}
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    className="object-contain"
                  />
                ),
              },
            ]}
          />
        ) : (
          /*
            Aucune photo choisie : on le DIT, plutôt que de rendre une grille
            vide qu'on prendrait pour un défaut de chargement. C'est l'invariant
            nº 1 à l'échelle d'un aperçu — une absence ne doit pas ressembler à
            une donnée.
          */
          <p className="py-6 text-center text-sm text-muted-foreground">
            {identifiant
              ? "Chargement de la photo…"
              : "Choisissez une photo : l'aperçu montrera la vignette et le bouton de filtre qui l'atteint."}
          </p>
        )}
      </div>

      {mediaAffiche ? (
        <p className="text-sm text-muted-foreground">
          Description actuelle :{" "}
          <span className="text-foreground">
            « {mediaAffiche.altText} »
          </span>{" "}
          —{" "}
          <Link
            href="/dashboard/mediatheque"
            className="inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-2"
          >
            la corriger dans la médiathèque
          </Link>
        </p>
      ) : null}

      {mediaAffiche ? (
        <p className="flex gap-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            {saisie.categoryId === SANS_CATEGORIE ? (
              <>
                <span className="font-medium text-foreground">
                  Sans catégorie, cette photo n&apos;apparaîtra que dans
                  « Tous ».
                </span>{" "}
                Aucun bouton de filtre ne la sélectionne — elle reste visible,
                mais seulement dans la grille complète.
              </>
            ) : (
              <>
                <span className="font-medium text-foreground">
                  Le bouton « {categorie?.label ?? CATEGORIE_ABSENTE} » atteindra
                  cette photo.
                </span>{" "}
                Elle apparaît aussi dans « Tous ».
              </>
            )}
          </span>
        </p>
      ) : null}
    </section>
  );
}
