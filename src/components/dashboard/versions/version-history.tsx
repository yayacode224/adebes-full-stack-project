"use client";

import { History, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  diffSnapshot,
  type ContentVersion,
  type FieldChange,
} from "@/core/cms/entities/content-version";
import type { ActionResult } from "@/server/action-kit/action-result";
import { formatDateHeure } from "@/lib/dates";

import { EmptyState } from "../feedback/empty-state";
import { ConfirmDialog } from "../modals/confirm-dialog";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ÉCRAN D'HISTORIQUE DES VERSIONS (§12.2 du Rapport 2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * « Liste des versions, auteur, date, commentaire, comparaison champ par champ
 * avec la version courante, restauration. »
 *
 * Générique : le même composant sert l'article et la page. Ce qui change d'une
 * entité à l'autre est passé en props — les libellés de champs, le nom de
 * l'entité, la liste des champs comparés, et l'action de restauration.
 *
 * ---------------------------------------------------------------------------
 * LA COMPARAISON SE FAIT CONTRE L'ÉTAT COURANT
 * ---------------------------------------------------------------------------
 * Chaque version est diffusée face à `courant` (l'entité telle qu'elle est
 * maintenant), pas face à la version précédente : la question de l'éditeur est
 * « qu'est-ce que restaurer cette version changerait ? ».
 */
export function VersionHistory({
  versions,
  courant,
  champs,
  entiteNom,
  cibleTitre,
  peutRestaurer,
  restaurer,
  noteRestauration,
}: {
  versions: ContentVersion[];
  /** L'entité courante, pour la comparaison. */
  courant: Record<string, unknown>;
  /** Champs comparés et affichés, dans l'ordre : clé technique → libellé. */
  champs: { key: string; label: string }[];
  /** « l'article », « la page » — pour les phrases. */
  entiteNom: string;
  /** Le titre de l'entité, pour la confirmation. */
  cibleTitre: string;
  peutRestaurer: boolean;
  restaurer: (versionId: string) => Promise<ActionResult<unknown>>;
  /** Précision affichée sous le bouton de restauration (limites, pour la page). */
  noteRestauration?: string;
}) {
  const router = useRouter();
  const [ouverte, setOuverte] = useState<string | null>(null);
  const [aRestaurer, setARestaurer] = useState<ContentVersion | null>(null);

  const libelles = new Map(champs.map((c) => [c.key, c.label]));
  const clesComparees = champs.map((c) => c.key);

  if (versions.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Aucune version enregistrée"
        description={`Un instantané de ${entiteNom} est créé à chaque publication. Publiez une première fois pour ouvrir l'historique.`}
      />
    );
  }

  async function confirmerRestauration() {
    if (!aRestaurer) return;
    const version = aRestaurer;

    const resultat = await restaurer(version.id);
    setARestaurer(null);

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 10000 });
      return;
    }

    toast.success(
      `Version ${version.versionNumber} restaurée. Le contenu a été remis en place.`,
    );
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <ol data-versions className="flex flex-col gap-3">
        {versions.map((version) => {
          const changements = diffSnapshot(
            version.snapshot,
            courant,
            clesComparees,
          );
          const estOuverte = ouverte === version.id;

          return (
            <li
              key={version.id}
              className="rounded-lg border border-border bg-card"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-foreground">
                    <span>Version {version.versionNumber}</span>
                    {version.comment ? (
                      <span className="font-normal text-muted-foreground">
                        · {version.comment}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDateHeure(version.createdAt)}
                    {version.createdBy ? "" : " · auteur inconnu"}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setOuverte(estOuverte ? null : version.id)
                    }
                    aria-expanded={estOuverte}
                  >
                    {changements.length === 0
                      ? "Identique à l'actuel"
                      : estOuverte
                        ? "Masquer les écarts"
                        : `${changements.length} écart${changements.length > 1 ? "s" : ""}`}
                  </Button>

                  {peutRestaurer ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setARestaurer(version)}
                    >
                      <RotateCcw className="size-4" aria-hidden="true" />
                      Restaurer
                    </Button>
                  ) : null}
                </div>
              </div>

              {estOuverte ? (
                <div className="border-t border-border p-4">
                  {changements.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Cette version est identique au contenu actuel de{" "}
                      {entiteNom}.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-3">
                      {changements.map((changement) => (
                        <ChangeRow
                          key={changement.field}
                          changement={changement}
                          libelle={
                            libelles.get(changement.field) ?? changement.field
                          }
                        />
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      {noteRestauration && peutRestaurer ? (
        <p className="text-xs text-muted-foreground">{noteRestauration}</p>
      ) : null}

      <ConfirmDialog
        open={aRestaurer !== null}
        onOpenChange={(o) => {
          if (!o) setARestaurer(null);
        }}
        title={
          aRestaurer
            ? `Restaurer la version ${aRestaurer.versionNumber} de « ${cibleTitre} » ?`
            : ""
        }
        description="Le contenu actuel sera remplacé par celui de cette version. L'état actuel est d'abord enregistré comme nouvelle version : cette restauration reste réversible."
        confirmLabel="Restaurer cette version"
        variant="default"
        onConfirm={confirmerRestauration}
      />
    </div>
  );
}

/** Une ligne de la comparaison : libellé, valeur de la version, valeur actuelle. */
function ChangeRow({
  changement,
  libelle,
}: {
  changement: FieldChange;
  libelle: string;
}) {
  return (
    <li className="grid gap-1 sm:grid-cols-[10rem_1fr]">
      <span className="pt-1 text-sm font-medium text-foreground">{libelle}</span>
      <span className="grid gap-1.5 text-sm">
        <span className="rounded-md border border-dashed border-border bg-muted/40 px-2 py-1 whitespace-pre-wrap text-muted-foreground">
          <span className="mr-1.5 text-xs font-semibold uppercase tracking-wide">
            Version
          </span>
          {changement.before}
        </span>
        <span className="rounded-md border border-border bg-background px-2 py-1 whitespace-pre-wrap text-foreground">
          <span className="mr-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Actuel
          </span>
          {changement.after}
        </span>
      </span>
    </li>
  );
}
