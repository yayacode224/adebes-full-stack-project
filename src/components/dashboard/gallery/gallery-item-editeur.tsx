"use client";

import { ArrowUpFromLine, Trash2, Undo2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ContentStatus } from "@/core/cms/entities/content-status";
import {
  CATEGORIE_ABSENTE,
  type GalleryCategory,
  type GalleryItem,
} from "@/core/cms/entities/gallery";
import type { MediaAsset } from "@/core/cms/entities/media-asset";
import {
  changerStatutElementGalerieAction,
  supprimerElementGalerieAction,
} from "@/server/actions/gallery.actions";

import { StatusBadge } from "../feedback/status-badge";
import { PageHeader } from "../layout/page-header";
import { ConfirmDialog } from "../modals/confirm-dialog";
import { GalleryItemForm } from "./gallery-item-form";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  L'ÉCRAN `/dashboard/galerie/[id]`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Le formulaire, et autour de lui les décisions qui ne sont pas de la saisie :
 * publier, dépublier, retirer.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  « VOIR SUR LE SITE » EXISTE ICI, ET SANS RÉSERVE
 * ---------------------------------------------------------------------------
 * C'est le cas le plus simple du Lot 8, et il vaut d'être dit après quatre lots
 * de nuances :
 *
 *   * Lot 8C — un témoignage n'apparaît que s'il fait partie des trois premiers
 *     publiés : pas de lien (écart nº 86) ;
 *   * Lot 8D — une fiche d'équipe publiée est toujours sur `/a-propos` : lien,
 *     mais rendu seulement sur une fiche publiée (écart nº 98) ;
 *   * Lot 8F — une question générale peut être en ligne et n'atteindre aucune
 *     page : lien conditionné à une lecture réelle ;
 *   * ici — **`/galerie` affiche TOUTES les photos publiées, sans coupe**. Si
 *     l'élément est en ligne, il y est. Le lien tient, et rien n'a besoin
 *     d'être lu pour le savoir.
 *
 * Il n'est rendu que sur un élément PUBLIÉ : sur un brouillon, il promettrait
 * une page où la photo ne figure pas — un lien mort au sens de l'invariant nº 2.
 *
 * ---------------------------------------------------------------------------
 * PUBLIER N'EST PAS ENREGISTRER
 * ---------------------------------------------------------------------------
 * Deux permissions distinctes (`gallery:update`, `gallery:publish`), deux cas
 * d'usage distincts, donc deux commandes distinctes à l'écran.
 */
export function GalleryItemEditeur({
  element,
  media,
  categories,
  peutModifier,
  peutPublier,
  peutSupprimer,
}: {
  element: GalleryItem;
  /** La photo, résolue côté serveur. `null` si la référence n'a rien rendu. */
  media: MediaAsset | null;
  categories: GalleryCategory[];
  peutModifier: boolean;
  peutPublier: boolean;
  peutSupprimer: boolean;
}) {
  const router = useRouter();
  const [confirmationOuverte, setConfirmationOuverte] = useState(false);

  const enLigne = element.status === "published";
  const categorie = element.categoryId
    ? categories.find((candidate) => candidate.id === element.categoryId)
    : undefined;

  /*
    Le titre de l'écran est la DESCRIPTION de la photo.

    C'est le seul texte qu'un élément de galerie possède — et il ne lui
    appartient même pas, il vient du média. Quand elle manque, on ne fabrique
    pas de titre : on nomme le fichier, et à défaut on le dit. Inventer
    « Élément nº 3 » aurait donné un nom à une chose qui n'en a pas.
  */
  const titre =
    media?.altText || media?.filename || "Photo introuvable";

  async function changerStatut(status: ContentStatus) {
    const resultat = await changerStatutElementGalerieAction({
      id: element.id,
      status,
    });

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 10000 });
      return;
    }

    toast.success(
      status === "published"
        ? "La photo est en ligne."
        : "La photo n'est plus visible sur le site.",
    );
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={titre}
        description={description(enLigne, categorie?.label)}
        actions={
          <>
            {peutPublier ? (
              enLigne ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void changerStatut("draft")}
                >
                  <Undo2 className="size-4" aria-hidden="true" />
                  Dépublier
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => void changerStatut("published")}
                >
                  <ArrowUpFromLine className="size-4" aria-hidden="true" />
                  Publier
                </Button>
              )
            ) : null}

            {peutSupprimer ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmationOuverte(true)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Retirer
              </Button>
            ) : null}
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <StatusBadge status={element.status} />

        <span className="text-sm text-muted-foreground">
          Catégorie : {categorie?.label ?? CATEGORIE_ABSENTE}
        </span>

        {/*
          ---------------------------------------------------------------------
          LE LIEN « OÙ EST-ELLE ? » VIT ICI, PAS DANS L'EN-TÊTE
          ---------------------------------------------------------------------
          Écart nº 112, établi au Lot 8E et repris tel quel : quatre commandes
          dans l'en-tête faisaient déborder l'écran dès 640 px, c'est-à-dire au
          zoom 200 %. Et surtout, ce n'est pas une commande : il ne change rien,
          il DIT où la photo apparaît.

          ⚠️  `inline-flex min-h-11` : c'est une CIBLE TACTILE, et la règle 4
          du §12 ne connaît pas d'exception pour un lien « au sein d'une
          phrase ».
        */}
        {enLigne ? (
          <p className="flex flex-wrap items-center gap-x-1 text-sm text-muted-foreground">
            Visible sur
            <Link
              href="/galerie"
              className="inline-flex min-h-11 items-center px-1 font-medium text-primary underline underline-offset-2"
            >
              la page Galerie
            </Link>
          </p>
        ) : null}

        {enLigne && !element.categoryId ? (
          /*
            En ligne, visible, et pourtant hors de tout filtre. L'état est
            légitime — il n'y a rien à corriger si la photo n'appartient à
            aucune catégorie — mais il n'est porté par aucun autre élément de
            l'écran : le badge dit « En ligne », et il a raison.
          */
          <p className="text-sm text-muted-foreground">
            Cette photo est en ligne mais n&apos;appartient à aucune catégorie :
            elle n&apos;apparaît que dans « Tous », et aucun bouton de filtre ne
            l&apos;atteint. Classez-la ci-dessous pour la rendre filtrable.
          </p>
        ) : null}

        {!peutPublier ? (
          /*
            Dire POURQUOI le bouton n'est pas là. Une commande absente sans
            explication passe pour une panne (§12 du Rapport 1).
          */
          <p className="text-sm text-muted-foreground">
            La mise en ligne est réservée aux administrateurs. Vos modifications
            sont enregistrées et leur seront soumises.
          </p>
        ) : null}

        {!media ? (
          <p className="text-sm font-medium text-destructive">
            La photo associée n&apos;a pas pu être chargée. Choisissez-en une
            autre ci-dessous.
          </p>
        ) : null}
      </div>

      {peutModifier ? (
        <GalleryItemForm element={element} categories={categories} />
      ) : (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Vous n&apos;avez pas les droits pour modifier cet élément.{" "}
          <Link
            href="/dashboard/galerie"
            className="font-medium text-primary underline underline-offset-2"
          >
            Revenir à la liste
          </Link>
        </p>
      )}

      <ConfirmDialog
        open={confirmationOuverte}
        onOpenChange={setConfirmationOuverte}
        title={`Retirer « ${titre} » de la galerie ?`}
        description="La photo disparaît de la grille du site. Le FICHIER, lui, reste dans la médiathèque et peut être réutilisé ailleurs — pour le supprimer définitivement, passez par la médiathèque. Pour retirer la photo du site en gardant l'élément, utilisez « Dépublier »."
        confirmLabel="Retirer de la galerie"
        onConfirm={async () => {
          const resultat = await supprimerElementGalerieAction({ id: element.id });

          if (!resultat.ok) {
            toast.error(resultat.message, { duration: 10000 });
            return;
          }

          toast.success(
            "La photo a été retirée de la galerie. Le fichier reste dans la médiathèque.",
          );
          router.push("/dashboard/galerie");
        }}
      />
    </div>
  );
}

/**
 * La phrase d'état.
 *
 * Deux situations seulement, là où les Lots 8C, 8D et 8F en avaient trois :
 * « publiée » et « visible » coïncident sur cette collection, puisque la page
 * ne coupe rien.
 */
function description(enLigne: boolean, categorie: string | undefined): string {
  if (!enLigne) {
    return "Cette photo n'est pas visible sur le site. Publiez-la quand elle est prête : elle apparaîtra alors dans la grille de la page Galerie.";
  }

  return categorie
    ? `Cette photo est en ligne sur la page Galerie, dans « Tous » et sous le filtre « ${categorie} ».`
    : "Cette photo est en ligne sur la page Galerie, dans « Tous » uniquement.";
}
