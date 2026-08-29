"use client";

import { ArrowUpFromLine, ShieldAlert, Trash2, Undo2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ContentStatus } from "@/core/cms/entities/content-status";
import type { Testimonial } from "@/core/cms/entities/testimonial";
import {
  changerStatutTemoignageAction,
  supprimerTemoignageAction,
} from "@/server/actions/testimonials.actions";

import { StatusBadge } from "../feedback/status-badge";
import { PageHeader } from "../layout/page-header";
import type { OptionDeReference } from "../forms/references-context";
import { ConfirmDialog } from "../modals/confirm-dialog";
import { TestimonialForm } from "./testimonial-form";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  L'ÉCRAN `/dashboard/temoignages/[id]`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Le formulaire, et autour de lui les décisions qui ne sont pas de la saisie :
 * publier, dépublier, supprimer.
 *
 * ---------------------------------------------------------------------------
 * PAS DE « VOIR SUR LE SITE », ET CE N'EST PAS UN OUBLI
 * ---------------------------------------------------------------------------
 * Un témoignage n'a pas de page à lui : il apparaît sur l'accueil, parmi les
 * trois premiers publiés. Un lien « Voir sur le site » pointant vers `/`
 * promettrait de montrer CE témoignage et mènerait, huit fois sur dix, à une
 * page où il ne figure pas — c'est l'invariant nº 2 (aucun lien mort) pris au
 * sens de sa raison d'être : un lien qui ne tient pas ce qu'il annonce.
 *
 * La position, elle, est rappelée : c'est la seule information qui dit si ce
 * témoignage est effectivement visible.
 *
 * ---------------------------------------------------------------------------
 * PUBLIER N'EST PAS ENREGISTRER
 * ---------------------------------------------------------------------------
 * Deux permissions distinctes (`testimonial:update`, `testimonial:publish`),
 * deux cas d'usage distincts, donc deux commandes distinctes à l'écran. Et sur
 * cette collection, une troisième condition qui n'est ni un droit ni un rôle :
 * l'accord de la personne. Le bouton « Publier » est désactivé sans lui, avec
 * le motif écrit à côté — pas caché, sinon son absence passerait pour une
 * panne.
 */
export function TestimonialEditeur({
  temoignage,
  programmes,
  visibleSurAccueil,
  peutModifier,
  peutPublier,
  peutSupprimer,
}: {
  temoignage: Testimonial;
  programmes: OptionDeReference[];
  /** Ce témoignage fait-il partie des trois affichés sur l'accueil ? */
  visibleSurAccueil: boolean;
  peutModifier: boolean;
  peutPublier: boolean;
  peutSupprimer: boolean;
}) {
  const router = useRouter();
  const [confirmationOuverte, setConfirmationOuverte] = useState(false);

  const enLigne = temoignage.status === "published";
  const publiable = temoignage.hasConsent;

  async function changerStatut(status: ContentStatus) {
    const resultat = await changerStatutTemoignageAction({
      id: temoignage.id,
      status,
    });

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 10000 });
      return;
    }

    toast.success(
      status === "published"
        ? "Le témoignage est en ligne."
        : "Le témoignage n'est plus visible sur le site.",
    );
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Témoignage de ${temoignage.authorName}`}
        description={description(temoignage, enLigne, visibleSurAccueil)}
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
                  disabled={!publiable}
                  /*
                    Le bouton reste PRÉSENT et désactivé plutôt que retiré : sa
                    disparition ne dirait pas pourquoi, et la phrase qui suit
                    n'aurait plus de sujet. `title` couvre la souris,
                    `aria-describedby` le lecteur d'écran.
                  */
                  title={
                    publiable
                      ? undefined
                      : "L'accord de la personne citée n'est pas enregistré."
                  }
                  aria-describedby={publiable ? undefined : "motif-non-publiable"}
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

      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={temoignage.status} />

        {!temoignage.hasConsent ? (
          <p
            id="motif-non-publiable"
            className={
              enLigne
                ? "inline-flex items-center gap-1.5 text-sm font-medium text-destructive"
                : "inline-flex items-center gap-1.5 text-sm text-muted-foreground"
            }
          >
            <ShieldAlert className="size-4 shrink-0" aria-hidden="true" />
            {enLigne
              ? "Ce témoignage est en ligne alors qu'aucun accord n'est enregistré."
              : "Mise en ligne impossible tant que l'accord de la personne n'est pas enregistré."}
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
      </div>

      {peutModifier ? (
        <TestimonialForm temoignage={temoignage} programmes={programmes} />
      ) : (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Vous n&apos;avez pas les droits pour modifier ce témoignage.{" "}
          <Link
            href="/dashboard/temoignages"
            className="font-medium text-primary underline underline-offset-2"
          >
            Revenir à la liste
          </Link>
        </p>
      )}

      <ConfirmDialog
        open={confirmationOuverte}
        onOpenChange={setConfirmationOuverte}
        title={`Supprimer le témoignage de ${temoignage.authorName} ?`}
        description="La citation disparaît du site et de la base. Cette action est définitive. Si ce témoignage était le seul à citer son programme, ce programme redevient supprimable."
        confirmLabel="Supprimer le témoignage"
        onConfirm={async () => {
          const resultat = await supprimerTemoignageAction({ id: temoignage.id });

          if (!resultat.ok) {
            toast.error(resultat.message, { duration: 10000 });
            return;
          }

          toast.success(`Le témoignage de ${temoignage.authorName} a été supprimé.`);
          router.push("/dashboard/temoignages");
        }}
      />
    </div>
  );
}

/**
 * La phrase d'état, qui distingue TROIS situations là où les autres écrans
 * n'en ont que deux.
 *
 * « Publié » et « visible » ne sont pas la même chose ici : l'accueil ne montre
 * que les trois premiers témoignages en ligne. Un quatrième témoignage publié
 * est bien en ligne — il n'est simplement affiché nulle part pour l'instant.
 * Laisser croire le contraire, c'est la confusion la plus coûteuse d'un CMS.
 */
function description(
  temoignage: Testimonial,
  enLigne: boolean,
  visibleSurAccueil: boolean,
): string {
  if (!enLigne) {
    return temoignage.hasConsent
      ? "Ce témoignage n'est pas encore visible sur le site. Publiez-le quand il est prêt."
      : "Ce témoignage n'est pas visible sur le site, et ne peut pas l'être tant que l'accord de la personne n'est pas enregistré.";
  }

  return visibleSurAccueil
    ? "Ce témoignage est en ligne et affiché sur la page d'accueil. Toute modification enregistrée y apparaît."
    : "Ce témoignage est en ligne, mais la page d'accueil n'affiche que les trois premiers : remontez-le dans la liste pour qu'il y figure.";
}
