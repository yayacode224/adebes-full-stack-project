"use client";

import { ArrowUpFromLine, ExternalLink, Trash2, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ContentStatus } from "@/core/cms/entities/content-status";
import type { Page } from "@/core/cms/entities/page";
import {
  changerStatutPageAction,
  supprimerPageAction,
} from "@/server/actions/pages.actions";

import { StatusBadge } from "../feedback/status-badge";
import { ConfirmDialog } from "../modals/confirm-dialog";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LA BARRE D'ACTION DE LA PAGE — Enregistrer / Prévisualiser / Publier
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * « Commune aux trois onglets et reste fixe en bas sur mobile. Elle ne doit
 * jamais dépendre de l'onglet affiché. » (§9.3)
 *
 * ---------------------------------------------------------------------------
 * ⚠️  « ENREGISTRER » N'EST PAS UN BOUTON DE CETTE BARRE — ET C'EST UN ÉCART
 *     ASSUMÉ AU LIBELLÉ LITTÉRAL DU §9.3
 * ---------------------------------------------------------------------------
 * Rien dans les onglets « Sections » n'a besoin d'être enregistré : ajouter,
 * réordonner, masquer, dupliquer, supprimer s'écrivent immédiatement par
 * Server Action (§9.3, recette : « fonctionne et persiste »). Ce qui reste à
 * enregistrer explicitement — le contenu d'une section, les réglages de page —
 * est saisi dans un `<SchemaForm>`, et le §6.2 lui impose DÉJÀ sa propre barre
 * d'enregistrement collante (« sticky bottom-0 … bouton pleine largeur »).
 *
 * Superposer une SECONDE barre « Enregistrer » qui devrait deviner quel
 * formulaire est monté pour le soumettre à sa place aurait dupliqué ce que
 * `<SchemaForm>` fait déjà, avec un risque réel de désynchronisation (deux
 * boutons, un seul état `isDirty`). Cette barre-ci porte donc ce qui n'a AUCUN
 * autre bouton pour le faire : la décision éditoriale (publier), la
 * vérification (prévisualiser), et la suppression. C'est elle qui reste
 * IDENTIQUE d'un onglet à l'autre, comme demandé — la barre de sauvegarde d'un
 * `<SchemaForm>`, elle, n'apparaît que sur l'onglet qui en contient un.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  « VOIR SUR LE SITE » VÉRIFIE DEUX CONDITIONS, PAS UNE
 * ---------------------------------------------------------------------------
 * Le lien n'est proposé que si la page est PUBLIÉE **et** SYSTÈME. Une page
 * créée depuis ce dashboard n'a, avant le Lot 15, aucune route dynamique qui la
 * sert — voir l'avertissement de `create-page.ts`. Lui offrir un lien mènerait
 * à une 404 depuis le dashboard lui-même, ce que l'invariant nº 2 interdit
 * autant depuis le site que depuis l'outil qui le compose.
 */
export function PageActionBar({
  page,
  peutPublier,
  peutSupprimer,
}: {
  page: Page;
  peutPublier: boolean;
  peutSupprimer: boolean;
}) {
  const router = useRouter();
  const [confirmationOuverte, setConfirmationOuverte] = useState(false);

  const enLigne = page.status === "published";
  const previsualisable = enLigne && page.isSystem;

  async function changerStatut(status: ContentStatus) {
    const resultat = await changerStatutPageAction({ id: page.id, status });

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 10000 });
      return;
    }

    toast.success(
      status === "published"
        ? "La page est en ligne."
        : "La page n'est plus visible sur le site.",
    );
    router.refresh();
  }

  async function supprimer() {
    const resultat = await supprimerPageAction({ id: page.id });

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 10000 });
      return;
    }

    toast.success(`« ${resultat.data.title} » a été supprimée.`);
    router.push("/dashboard/pages");
  }

  return (
    <>
      {/*
        `sticky bottom-0` sous `lg:` avec `env(safe-area-inset-bottom)`, comme
        la barre d'enregistrement du §6.2 — même raisonnement : sur téléphone,
        cette barre ne doit jamais exiger de défiler jusqu'en bas.
      */}
      <div
        className={
          "flex flex-wrap items-center gap-3 border-b border-border bg-background py-3 " +
          "max-lg:sticky max-lg:bottom-0 max-lg:z-10 max-lg:border-b-0 max-lg:border-t max-lg:pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
        }
      >
        <StatusBadge status={page.status} />

        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          {previsualisable ? (
            <Button asChild variant="outline" className="min-h-11">
              <a href={page.route} target="_blank" rel="noreferrer noopener">
                <ExternalLink className="size-4" aria-hidden="true" />
                Voir sur le site
              </a>
            </Button>
          ) : null}

          {peutPublier ? (
            enLigne ? (
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={() => void changerStatut("draft")}
              >
                <Undo2 className="size-4" aria-hidden="true" />
                Dépublier
              </Button>
            ) : (
              <Button
                type="button"
                className="min-h-11"
                onClick={() => void changerStatut("published")}
              >
                <ArrowUpFromLine className="size-4" aria-hidden="true" />
                Publier
              </Button>
            )
          ) : null}

          {peutSupprimer && !page.isSystem ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => setConfirmationOuverte(true)}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Supprimer
            </Button>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={confirmationOuverte}
        onOpenChange={setConfirmationOuverte}
        title={`Supprimer « ${page.title} » ?`}
        description={`L'adresse ${page.route} ne répondra plus, et son contenu sera perdu. Cette suppression est définitive. Pour la retirer du site sans rien perdre, dépubliez-la plutôt.`}
        confirmLabel="Supprimer la page"
        variant="destructive"
        onConfirm={supprimer}
      />
    </>
  );
}
