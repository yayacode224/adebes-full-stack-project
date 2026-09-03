"use client";

import { ArrowUpFromLine, Trash2, Undo2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  MENTION_SANS_DOCUMENT,
  type AnnualReport,
} from "@/core/cms/entities/annual-report";
import type { ContentStatus } from "@/core/cms/entities/content-status";
import type { MediaAsset } from "@/core/cms/entities/media-asset";
import { formaterPoids } from "@/lib/media-url";
import {
  changerStatutRapportAnnuelAction,
  supprimerRapportAnnuelAction,
} from "@/server/actions/annual-reports.actions";

import { StatusBadge } from "../feedback/status-badge";
import { PageHeader } from "../layout/page-header";
import { ConfirmDialog } from "../modals/confirm-dialog";
import { AnnualReportForm } from "./annual-report-form";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  L'ÉCRAN `/dashboard/documents/[id]`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Le formulaire, et autour de lui les décisions qui ne sont pas de la saisie :
 * publier, dépublier, supprimer.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  « VOIR SUR LE SITE » POINTE VERS UNE ANCRE, ET SANS RÉSERVE
 * ---------------------------------------------------------------------------
 * Récapitulatif des cinq lots qui ont eu à trancher cette question :
 *
 *   * Lot 8C — un témoignage n'apparaît que s'il fait partie des trois premiers
 *     publiés : pas de lien (écart nº 86) ;
 *   * Lot 8D — une fiche d'équipe publiée est toujours sur `/a-propos` : lien,
 *     mais rendu seulement sur une fiche publiée (écart nº 98) ;
 *   * Lot 8F — une question générale peut être en ligne et n'atteindre aucune
 *     page : lien conditionné à une lecture réelle ;
 *   * Lot 8H — `/galerie` affiche toutes les photos publiées : lien sans
 *     réserve (écart nº 149) ;
 *   * ici — **`/impact` affiche TOUS les rapports publiés, sans coupe**. Si le
 *     rapport est en ligne, il y est. Le lien tient, et rien n'a besoin d'être
 *     lu pour le savoir.
 *
 * L'ancre `#documents` est NOUVELLE : la section existait sans identifiant.
 * Sans elle, le lien atterrirait en haut d'une page longue, au-dessus des
 * chiffres, et il faudrait chercher. `/impact#chiffres` a été posée au Lot 8G
 * pour la même raison.
 *
 * Il n'est rendu que sur un rapport PUBLIÉ : sur un brouillon, il promettrait
 * une section où le rapport ne figure pas — un lien mort au sens de
 * l'invariant nº 2.
 *
 * ---------------------------------------------------------------------------
 * PUBLIER N'EST PAS ENREGISTRER
 * ---------------------------------------------------------------------------
 * Deux permissions distinctes (`document:update`, `document:publish`), deux cas
 * d'usage distincts, donc deux commandes distinctes à l'écran.
 */
export function AnnualReportEditeur({
  rapport,
  media,
  peutModifier,
  peutPublier,
  peutSupprimer,
}: {
  rapport: AnnualReport;
  /** Le PDF, résolu côté serveur. `null` si aucun, ou si la référence n'a rien rendu. */
  media: MediaAsset | null;
  peutModifier: boolean;
  peutPublier: boolean;
  peutSupprimer: boolean;
}) {
  const router = useRouter();
  const [confirmationOuverte, setConfirmationOuverte] = useState(false);

  const enLigne = rapport.status === "published";

  /**
   * Trois états, pas deux — et les confondre serait la faute de cet écran.
   *
   *   * `absent` — aucun PDF rattaché. État NORMAL, celui des deux rapports
   *     seedés : le site annonce « En cours de préparation ».
   *   * `present` — le PDF est là et se résout.
   *   * `introuvable` — la référence existe mais la lecture n'a rien rendu.
   *     C'est un DÉFAUT, et il ne doit pas se lire comme le premier cas.
   */
  const document: "absent" | "present" | "introuvable" =
    rapport.documentMediaId === null ? "absent" : media ? "present" : "introuvable";

  async function changerStatut(status: ContentStatus) {
    const resultat = await changerStatutRapportAnnuelAction({
      id: rapport.id,
      status,
    });

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 10000 });
      return;
    }

    toast.success(
      status === "published"
        ? document === "present"
          ? "Le rapport est en ligne, avec son PDF téléchargeable."
          : "Le rapport est en ligne, annoncé « En cours de préparation »."
        : "Le rapport n'est plus visible sur le site.",
    );
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={rapport.title}
        description={description(enLigne, document, rapport.year)}
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
                Supprimer
              </Button>
            ) : null}
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <StatusBadge status={rapport.status} />

        <span className="text-sm tabular-nums text-muted-foreground">
          Année {rapport.year}
        </span>

        {media ? (
          <span className="text-sm text-muted-foreground">
            {media.filename} · {formaterPoids(media.sizeBytes)}
          </span>
        ) : null}

        {/*
          ---------------------------------------------------------------------
          LE LIEN « OÙ EST-IL ? » VIT ICI, PAS DANS L'EN-TÊTE
          ---------------------------------------------------------------------
          Écart nº 112, établi au Lot 8E et repris tel quel : quatre commandes
          dans l'en-tête faisaient déborder l'écran dès 640 px, c'est-à-dire au
          zoom 200 %. Et surtout, ce n'est pas une commande : il ne change rien,
          il DIT où le rapport apparaît.

          ⚠️  `inline-flex min-h-11` : c'est une CIBLE TACTILE, et la règle 4
          du §12 ne connaît pas d'exception pour un lien « au sein d'une
          phrase ».
        */}
        {enLigne ? (
          <p className="flex flex-wrap items-center gap-x-1 text-sm text-muted-foreground">
            Visible sur
            <Link
              href="/impact#documents"
              className="inline-flex min-h-11 items-center px-1 font-medium text-primary underline underline-offset-2"
            >
              la page Impact
            </Link>
          </p>
        ) : null}

        {enLigne && document === "absent" ? (
          /*
            En ligne, visible, et sans fichier à télécharger. L'état est
            LÉGITIME — c'est celui que le site affiche aujourd'hui pour ses deux
            rapports — mais il n'est porté par aucun autre élément de l'écran :
            le badge dit « En ligne », et il a raison.

            ⚠️  Ce n'est pas un avertissement. Le ton compte : la publication
            n'a pas été refusée, et il n'y a rien à corriger tant que le PDF
            n'existe pas.
          */
          <p className="text-sm text-muted-foreground">
            Ce rapport est annoncé sur le site avec la mention «{" "}
            {MENTION_SANS_DOCUMENT} ». Le bouton de téléchargement apparaîtra dès
            qu&apos;un PDF lui sera rattaché ci-dessous.
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

        {document === "introuvable" ? (
          <p className="text-sm font-medium text-destructive">
            Le PDF associé n&apos;a pas pu être chargé. Le bouton de
            téléchargement n&apos;apparaîtra pas sur le site : choisissez un
            autre fichier ci-dessous.
          </p>
        ) : null}
      </div>

      {peutModifier ? (
        <AnnualReportForm rapport={rapport} />
      ) : (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Vous n&apos;avez pas les droits pour modifier ce rapport.{" "}
          <Link
            href="/dashboard/documents"
            className="font-medium text-primary underline underline-offset-2"
          >
            Revenir à la liste
          </Link>
        </p>
      )}

      <ConfirmDialog
        open={confirmationOuverte}
        onOpenChange={setConfirmationOuverte}
        title={`Supprimer « ${rapport.title} » ?`}
        description="Le rapport disparaît de la page Impact et du dashboard. Le FICHIER PDF, lui, reste dans la médiathèque et peut être réutilisé ailleurs — pour le supprimer définitivement, passez par la médiathèque. Pour retirer le rapport du site en le gardant ici, utilisez « Dépublier »."
        confirmLabel="Supprimer le rapport"
        onConfirm={async () => {
          const resultat = await supprimerRapportAnnuelAction({ id: rapport.id });

          if (!resultat.ok) {
            toast.error(resultat.message, { duration: 10000 });
            return;
          }

          toast.success(
            "Le rapport a été supprimé. Le fichier reste dans la médiathèque.",
          );
          router.push("/dashboard/documents");
        }}
      />
    </div>
  );
}

/**
 * La phrase d'état.
 *
 * Quatre situations, là où le Lot 8H en avait deux : « publié » et
 * « téléchargeable » ne coïncident pas sur cette collection, et c'est toute la
 * particularité du lot.
 */
function description(
  enLigne: boolean,
  document: "absent" | "present" | "introuvable",
  annee: number,
): string {
  if (!enLigne) {
    return document === "present"
      ? `Ce rapport ${annee} n'est pas visible sur le site. Publiez-le quand il est prêt : son PDF sera alors téléchargeable depuis la page Impact.`
      : `Ce rapport ${annee} n'est pas visible sur le site. Vous pouvez le publier sans PDF : il sera annoncé « ${MENTION_SANS_DOCUMENT} », et le fichier pourra être rattaché plus tard.`;
  }

  if (document === "present") {
    return `Ce rapport ${annee} est en ligne sur la page Impact, et son PDF est téléchargeable.`;
  }

  if (document === "introuvable") {
    return `Ce rapport ${annee} est en ligne, mais son PDF n'a pas pu être chargé : la page Impact l'affiche sans bouton de téléchargement.`;
  }

  return `Ce rapport ${annee} est en ligne sur la page Impact, annoncé « ${MENTION_SANS_DOCUMENT} », sans lien de téléchargement.`;
}
