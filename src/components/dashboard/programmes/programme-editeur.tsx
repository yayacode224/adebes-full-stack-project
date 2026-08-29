"use client";

import { ArrowUpFromLine, ExternalLink, Trash2, Undo2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ContentStatus } from "@/core/cms/entities/content-status";
import type { Programme } from "@/core/cms/entities/programme";
import {
  changerStatutProgrammeAction,
  supprimerProgrammeAction,
} from "@/server/actions/programmes.actions";

import { StatusBadge } from "../feedback/status-badge";
import { PageHeader } from "../layout/page-header";
import { ConfirmDialog } from "../modals/confirm-dialog";
import { ProgrammeForm } from "./programme-form";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  L'ÉCRAN `/dashboard/programmes/[id]`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Le formulaire, et autour de lui les décisions qui ne sont pas de la saisie :
 * publier, dépublier, supprimer, aller voir le résultat.
 *
 * ---------------------------------------------------------------------------
 * PUBLIER N'EST PAS ENREGISTRER
 * ---------------------------------------------------------------------------
 * Deux permissions distinctes (`programme:update` et `programme:publish`),
 * deux cas d'usage distincts, donc deux commandes distinctes à l'écran. Un
 * bouton « Enregistrer et publier » aurait fait publier un éditeur par
 * mégarde — ou plutôt le lui aurait fait tenter, puisque la base l'aurait
 * refusé (trigger `guard_publish`, ADB01) après lui avoir laissé croire le
 * contraire.
 *
 * `<PageHeader>` reçoit l'action primaire en PREMIER : sur téléphone, les
 * boutons sont empilés pleine largeur et le pouce atteint le haut de la pile
 * avant le bas.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI L'ÉTAT EST RAPPELÉ ICI
 * ---------------------------------------------------------------------------
 * « Enregistré » et « en ligne » sont deux choses différentes, et c'est la
 * confusion la plus fréquente dans un CMS : quelqu'un corrige une faute, voit
 * « Modifications enregistrées » et croit le site à jour alors que le
 * programme est en brouillon. Le `<StatusBadge>` et sa phrase d'explication
 * sont là pour ça.
 */
export function ProgrammeEditeur({
  programme,
  peutModifier,
  peutPublier,
  peutSupprimer,
}: {
  programme: Programme;
  peutModifier: boolean;
  peutPublier: boolean;
  peutSupprimer: boolean;
}) {
  const router = useRouter();
  const [confirmationOuverte, setConfirmationOuverte] = useState(false);

  const enLigne = programme.status === "published";

  async function changerStatut(status: ContentStatus) {
    const resultat = await changerStatutProgrammeAction({
      id: programme.id,
      status,
    });

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 8000 });
      return;
    }

    toast.success(
      status === "published"
        ? "Le programme est en ligne."
        : "Le programme n'est plus visible sur le site.",
    );
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={programme.title}
        description={
          enLigne
            ? "Ce programme est visible sur le site. Toute modification enregistrée y apparaît."
            : "Ce programme n'est pas encore visible sur le site. Publiez-le quand il est prêt."
        }
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
                <Button type="button" onClick={() => void changerStatut("published")}>
                  <ArrowUpFromLine className="size-4" aria-hidden="true" />
                  Publier
                </Button>
              )
            ) : null}

            {enLigne ? (
              <Button asChild variant="outline">
                <a
                  href={`/programmes/${programme.slug}`}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <ExternalLink className="size-4" aria-hidden="true" />
                  Voir sur le site
                </a>
              </Button>
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
        <StatusBadge status={programme.status} />
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
        <ProgrammeForm programme={programme} />
      ) : (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Vous n&apos;avez pas les droits pour modifier ce programme.{" "}
          <Link
            href="/dashboard/programmes"
            className="font-medium text-primary underline underline-offset-2"
          >
            Revenir à la liste
          </Link>
        </p>
      )}

      <ConfirmDialog
        open={confirmationOuverte}
        onOpenChange={setConfirmationOuverte}
        title={`Supprimer « ${programme.title} » ?`}
        description="Le programme et sa page disparaissent du site. Cette action est définitive. Si un témoignage y est rattaché, la suppression sera refusée et vous serez prévenu."
        confirmLabel="Supprimer le programme"
        onConfirm={async () => {
          const resultat = await supprimerProgrammeAction({ id: programme.id });

          if (!resultat.ok) {
            toast.error(resultat.message, { duration: 10000 });
            return;
          }

          toast.success(`« ${programme.title} » a été supprimé.`);
          router.push("/dashboard/programmes");
        }}
      />
    </div>
  );
}
