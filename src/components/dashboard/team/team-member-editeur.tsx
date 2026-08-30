"use client";

import { ArrowUpFromLine, Trash2, TriangleAlert, Undo2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ContentStatus } from "@/core/cms/entities/content-status";
import { estNomAFournir, type TeamMember } from "@/core/cms/entities/team-member";
import {
  changerStatutMembreEquipeAction,
  supprimerMembreEquipeAction,
} from "@/server/actions/team.actions";

import { StatusBadge } from "../feedback/status-badge";
import { PageHeader } from "../layout/page-header";
import { ConfirmDialog } from "../modals/confirm-dialog";
import { TeamMemberForm } from "./team-member-form";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  L'ÉCRAN `/dashboard/equipe/[id]`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Le formulaire, et autour de lui les décisions qui ne sont pas de la saisie :
 * publier, dépublier, supprimer.
 *
 * ---------------------------------------------------------------------------
 * « VOIR SUR LE SITE » POINTE VERS `/a-propos`, ET C'EST LÉGITIME ICI
 * ---------------------------------------------------------------------------
 * Différence avec le Lot 8C, où le lien avait été écarté : un témoignage
 * n'apparaît sur l'accueil que s'il fait partie des trois premiers publiés, de
 * sorte qu'un lien « Voir sur le site » aurait mené huit fois sur dix à une
 * page où il ne figurait pas. Ici, `/a-propos` affiche TOUS les membres
 * publiés : si la fiche est en ligne, elle y est.
 *
 * Le lien n'est donc rendu QUE lorsqu'elle est publiée. Sur un brouillon, il
 * promettrait une page où la fiche ne figure pas — invariant nº 2 pris au sens
 * de sa raison d'être : un lien qui ne tient pas ce qu'il annonce.
 *
 * ---------------------------------------------------------------------------
 * PUBLIER N'EST PAS ENREGISTRER
 * ---------------------------------------------------------------------------
 * Deux permissions distinctes (`team:update`, `team:publish`), deux cas
 * d'usage distincts, donc deux commandes distinctes à l'écran. Et sur cette
 * collection, une troisième condition qui n'est ni un droit ni un rôle : le
 * nom doit en être un. Le bouton « Publier » est désactivé sans lui, avec le
 * motif écrit à côté — pas caché, sinon son absence passerait pour une panne.
 */
export function TeamMemberEditeur({
  membre,
  peutModifier,
  peutPublier,
  peutSupprimer,
}: {
  membre: TeamMember;
  peutModifier: boolean;
  peutPublier: boolean;
  peutSupprimer: boolean;
}) {
  const router = useRouter();
  const [confirmationOuverte, setConfirmationOuverte] = useState(false);

  const enLigne = membre.status === "published";
  const nomAFournir = estNomAFournir(membre.name);

  async function changerStatut(status: ContentStatus) {
    const resultat = await changerStatutMembreEquipeAction({
      id: membre.id,
      status,
    });

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 10000 });
      return;
    }

    toast.success(
      status === "published"
        ? "La fiche est en ligne."
        : "La fiche n'est plus visible sur le site.",
    );
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={nomAFournir ? "Fiche à compléter" : membre.name}
        description={description(enLigne, nomAFournir)}
        actions={
          <>
            {enLigne ? (
              <Button asChild variant="outline">
                <Link href="/a-propos#equipe">Voir sur le site</Link>
              </Button>
            ) : null}

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
                  disabled={nomAFournir}
                  /*
                    Le bouton reste PRÉSENT et désactivé plutôt que retiré : sa
                    disparition ne dirait pas pourquoi, et la phrase qui suit
                    n'aurait plus de sujet. `title` couvre la souris,
                    `aria-describedby` le lecteur d'écran.
                  */
                  title={
                    nomAFournir
                      ? "Le nom de la personne est encore « [À COMPLÉTER] »."
                      : undefined
                  }
                  aria-describedby={
                    nomAFournir ? "motif-non-publiable" : undefined
                  }
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
        <StatusBadge status={membre.status} />

        {nomAFournir ? (
          <p
            id="motif-non-publiable"
            className={
              enLigne
                ? "inline-flex items-center gap-1.5 text-sm font-medium text-destructive"
                : "inline-flex items-center gap-1.5 text-sm text-muted-foreground"
            }
          >
            <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
            {enLigne
              ? "Cette fiche est en ligne alors que le nom de la personne n'est pas renseigné."
              : "Mise en ligne impossible tant que le nom de la personne n'est pas renseigné."}
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
        <TeamMemberForm membre={membre} />
      ) : (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Vous n&apos;avez pas les droits pour modifier cette fiche.{" "}
          <Link
            href="/dashboard/equipe"
            className="font-medium text-primary underline underline-offset-2"
          >
            Revenir à la liste
          </Link>
        </p>
      )}

      <ConfirmDialog
        open={confirmationOuverte}
        onOpenChange={setConfirmationOuverte}
        title={
          nomAFournir
            ? "Supprimer cette fiche ?"
            : `Supprimer la fiche de ${membre.name} ?`
        }
        description="La fiche disparaît du site et de la base. Cette action est définitive. La photo, elle, reste dans la médiathèque : elle peut servir ailleurs."
        confirmLabel="Supprimer la fiche"
        onConfirm={async () => {
          const resultat = await supprimerMembreEquipeAction({ id: membre.id });

          if (!resultat.ok) {
            toast.error(resultat.message, { duration: 10000 });
            return;
          }

          toast.success("La fiche a été supprimée.");
          router.push("/dashboard/equipe");
        }}
      />
    </div>
  );
}

/**
 * La phrase d'état.
 *
 * Deux situations seulement, là où le Lot 8C en distinguait trois : `/a-propos`
 * affiche TOUS les membres publiés, il n'y a donc pas d'écart entre « publié »
 * et « visible » à dissiper. La nuance porte ici sur ce qui BLOQUE la
 * publication.
 */
function description(enLigne: boolean, nomAFournir: boolean): string {
  if (enLigne) {
    return "Cette fiche est en ligne sur la page « Qui sommes-nous ». Toute modification enregistrée y apparaît.";
  }

  return nomAFournir
    ? "Cette fiche n'est pas visible sur le site, et ne peut pas l'être tant que le nom de la personne n'est pas renseigné. Tout le reste — fonction, biographie, photo — peut être préparé dès maintenant."
    : "Cette fiche n'est pas encore visible sur le site. Publiez-la quand elle est prête.";
}
