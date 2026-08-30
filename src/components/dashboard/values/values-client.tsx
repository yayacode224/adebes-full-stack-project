"use client";

import { Eye, EyeOff, Pencil, Plus, Trash2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { ContentIcon } from "@/components/ui-ext/content-icon";
import { Button } from "@/components/ui/button";
import type { CoreValue } from "@/core/cms/entities/core-value";
import { MEDIA_TONE_LABELS } from "@/core/cms/entities/media-tone";
import { VISIBILITY_LABELS } from "@/core/cms/entities/visibility";
import {
  changerVisibiliteValeurAction,
  reordonnerValeursAction,
  supprimerValeurAction,
} from "@/server/actions/values.actions";

import { DataTable } from "../data-table/data-table";
import type { Column } from "../data-table/types";
import { VisibilityBadge } from "../feedback/visibility-badge";
import { PageHeader } from "../layout/page-header";
import { ConfirmDialog } from "../modals/confirm-dialog";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  L'ÉCRAN `/dashboard/valeurs`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8E du Rapport 2, transposition du gabarit du §8A.3 : glissière de
 * réordonnancement · Icône · Titre · Explication · Teinte · État. Filtres :
 * état, teinte. Recherche : titre, explication. Actions groupées : afficher,
 * masquer, supprimer.
 *
 * ---------------------------------------------------------------------------
 * LE BANDEAU DIT CE QUE **DEUX** PAGES MONTRENT
 * ---------------------------------------------------------------------------
 * C'est la particularité de cette collection, et la raison d'être du bandeau.
 * Les quatre lots précédents alimentaient une page ; celui-ci en alimente deux —
 * l'accueil et « Qui sommes-nous ». Masquer une valeur la retire des deux d'un
 * seul geste, depuis un écran qui, lui, continue d'afficher ses quatre lignes.
 *
 * Le bandeau n'apparaît donc PAS en permanence : il se déclenche quand l'écran
 * et le site cessent de coïncider — au moins une valeur masquée — et il se
 * durcit quand il n'en reste plus aucune de visible, cas où la section entière
 * disparaît des deux pages.
 *
 * C'est la leçon du Lot 8D, appliquée à une collection où elle porte deux fois
 * plus loin : **un écran qui montre N lignes sans rien dire laisse croire que
 * le site en montre N aussi.**
 *
 * ---------------------------------------------------------------------------
 * ⚠️  « CRÉER » ET « SUPPRIMER » SONT RÉSERVÉS AUX ADMINISTRATEURS
 * ---------------------------------------------------------------------------
 * Première collection du Lot 8 dans ce cas : `value:create` est absent de la
 * liste `editor`, et la RLS dit la même chose (`core_values_admin_insert`).
 * Un éditeur peut corriger un texte et masquer une valeur, pas en ajouter.
 *
 * Le bouton n'est donc pas rendu — et le vide est EXPLIQUÉ plus bas plutôt que
 * laissé muet : une commande absente sans motif passe pour une panne (§12 du
 * Rapport 1).
 */

export function ValuesClient({
  valeurs: valeursInitiales,
  peutCreer,
  peutModifier,
  peutSupprimer,
  peutReordonner,
}: {
  valeurs: CoreValue[];
  peutCreer: boolean;
  peutModifier: boolean;
  peutSupprimer: boolean;
  peutReordonner: boolean;
}) {
  const router = useRouter();

  const [aSupprimer, setASupprimer] = useState<CoreValue | null>(null);
  const [aSupprimerEnLot, setASupprimerEnLot] = useState<string[] | null>(null);
  const [aMasquer, setAMasquer] = useState<CoreValue | null>(null);

  const visibles = valeursInitiales.filter((valeur) => valeur.isVisible);
  const masquees = valeursInitiales.filter((valeur) => !valeur.isVisible);

  /* ---------------------------------------------------------------------- */
  /* Mutations                                                               */
  /* ---------------------------------------------------------------------- */

  async function changerVisibilite(valeur: CoreValue, isVisible: boolean) {
    const resultat = await changerVisibiliteValeurAction({
      id: valeur.id,
      isVisible,
    });

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 10000 });
      return;
    }

    toast.success(
      isVisible
        ? `« ${valeur.title} » est de nouveau affichée sur le site.`
        : `« ${valeur.title} » n'apparaît plus sur l'accueil ni sur « Qui sommes-nous ».`,
    );
    router.refresh();
  }

  async function supprimer(valeur: CoreValue) {
    const resultat = await supprimerValeurAction({ id: valeur.id });

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 10000 });
      return;
    }

    toast.success(`« ${valeur.title} » a été supprimée.`);
    router.refresh();
  }

  /**
   * Actions groupées.
   *
   * Séquentielles et non parallèles : chaque suppression renumérote les
   * positions restantes (voir `deleteCoreValue`), et deux renumérotations
   * concurrentes produiraient un ordre que personne n'a voulu.
   */
  async function appliquerEnLot(
    ids: string[],
    traiter: (valeur: CoreValue) => Promise<boolean>,
    resume: (reussites: number, echecs: number) => string,
  ) {
    let reussites = 0;
    let echecs = 0;

    for (const id of ids) {
      const valeur = valeursInitiales.find((v) => v.id === id);
      if (!valeur) continue;
      if (await traiter(valeur)) reussites += 1;
      else echecs += 1;
    }

    if (echecs === 0) toast.success(resume(reussites, echecs));
    else toast.error(resume(reussites, echecs), { duration: 10000 });

    router.refresh();
  }

  /* ---------------------------------------------------------------------- */
  /* Colonnes                                                                */
  /* ---------------------------------------------------------------------- */

  const colonnes: Column<CoreValue>[] = [
    {
      key: "icon",
      header: "Icône",
      width: "4.5rem",
      cell: (valeur) => (
        /*
          44 px de côté : la colonne n'est pas cliquable, mais elle s'aligne sur
          la hauteur de ligne des autres et reste lisible au téléphone.

          Le NOM de l'icône est en `sr-only` plutôt qu'absent : sans lui, un
          lecteur d'écran annonce une cellule vide, et la colonne devient
          inutilisable pour vérifier qu'aucune valeur n'a gardé l'étoile de
          repli.
        */
        <span className="grid size-11 place-items-center rounded-xl bg-muted text-muted-foreground">
          <ContentIcon name={valeur.icon} className="size-5" />
          <span className="sr-only">{valeur.icon}</span>
        </span>
      ),
    },
    {
      key: "title",
      header: "Titre",
      sortable: true,
      sortValue: (valeur) => valeur.title,
      cell: (valeur) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-foreground">
            {valeur.title}
          </span>
          {/* L'explication en second, tronquée : sous 768 px, la carte n'affiche
              que la colonne primaire, et une valeur sans son énoncé ne se
              distingue pas d'une autre. */}
          <span className="line-clamp-2 text-xs text-muted-foreground">
            {valeur.description}
          </span>
        </span>
      ),
    },
    {
      key: "description",
      header: "Explication",
      hideOnMobile: true,
      cell: (valeur) => (
        <span className="line-clamp-2 text-muted-foreground">
          {valeur.description}
        </span>
      ),
    },
    {
      key: "tone",
      header: "Teinte",
      hideOnMobile: true,
      sortable: true,
      sortValue: (valeur) => MEDIA_TONE_LABELS[valeur.tone],
      // Le LIBELLÉ, pas une pastille de couleur : jamais la couleur seule.
      cell: (valeur) => (
        <span className="text-muted-foreground">
          {MEDIA_TONE_LABELS[valeur.tone]}
        </span>
      ),
    },
    {
      key: "isVisible",
      header: "État",
      sortable: true,
      // Les valeurs affichées d'abord : c'est l'ordre utile, « qu'est-ce que le
      // site montre ». Un tri booléen brut mettrait `false` en tête.
      sortValue: (valeur) => (valeur.isVisible ? 0 : 1),
      cell: (valeur) => <VisibilityBadge isVisible={valeur.isVisible} />,
    },
  ];

  /* ---------------------------------------------------------------------- */
  /* Rendu                                                                   */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Valeurs"
        description="Les principes de l'association, affichés sur la page d'accueil et sur « Qui sommes-nous ». Les deux pages lisent cette liste, dans cet ordre."
        actions={
          peutCreer ? (
            <Button asChild>
              <Link href="/dashboard/valeurs/nouveau">
                <Plus className="size-4" aria-hidden="true" />
                Nouvelle valeur
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* ------------------------------------------------------------------ */}
      {/* Ce que les DEUX pages montrent — pas ce que ce tableau contient     */}
      {/* ------------------------------------------------------------------ */}
      {masquees.length > 0 ? (
        <div
          role="status"
          className={
            visibles.length === 0
              ? "flex gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm"
              : "flex gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm"
          }
        >
          <TriangleAlert
            className={
              visibles.length === 0
                ? "mt-0.5 size-4 shrink-0 text-destructive"
                : "mt-0.5 size-4 shrink-0 text-muted-foreground"
            }
            aria-hidden="true"
          />
          <div className="flex flex-col gap-2 text-muted-foreground">
            {visibles.length === 0 ? (
              <p>
                <span className="font-medium text-foreground">
                  La section « Nos valeurs » n&apos;apparaît plus, ni sur
                  l&apos;accueil ni sur « Qui sommes-nous ».
                </span>{" "}
                Les {masquees.length} valeurs de cette liste sont masquées, et
                les deux pages masquent la section entière plutôt que
                d&apos;annoncer un contenu absent. Réaffichez-en au moins une
                pour la faire revenir.
              </p>
            ) : (
              <p>
                <span className="font-medium text-foreground">
                  {masquees.length === 1
                    ? "Une valeur de cette liste n'apparaît pas sur le site."
                    : `${masquees.length} valeurs de cette liste n'apparaissent pas sur le site.`}
                </span>{" "}
                L&apos;accueil et « Qui sommes-nous » en affichent{" "}
                {visibles.length === 1
                  ? "une seule"
                  : `${visibles.length} sur ${valeursInitiales.length}`}
                . Une valeur masquée conserve sa place dans l&apos;ordre et la
                retrouve si vous la réaffichez.
              </p>
            )}
          </div>
        </div>
      ) : null}

      {/*
        Le motif d'une commande absente, écrit une fois.

        Un éditeur qui ne trouve pas « Nouvelle valeur » doit lire pourquoi
        plutôt que conclure à une panne — d'autant que le bouton EXISTE sur les
        quatre autres collections, où la création lui est ouverte.
      */}
      {!peutCreer ? (
        <p className="text-sm text-muted-foreground">
          Ajouter ou supprimer une valeur est réservé aux administrateurs : ces
          entrées sont la charte de l&apos;association, pas un flux de contenu.
          Vous pouvez modifier leur texte, leur icône, leur teinte, leur ordre,
          et les retirer du site.
        </p>
      ) : null}

      <DataTable<CoreValue>
        data={valeursInitiales}
        columns={colonnes}
        getRowId={(valeur) => valeur.id}
        primaryColumnKey="title"
        badgeColumnKey="isVisible"
        itemLabel="valeur"
        emptyState={{
          title: "Aucune valeur pour l'instant",
          description:
            "La section « Nos valeurs » n'apparaît ni sur l'accueil ni sur « Qui sommes-nous » tant que cette liste est vide.",
          action: peutCreer ? (
            <Button asChild>
              <Link href="/dashboard/valeurs/nouveau">
                <Plus className="size-4" aria-hidden="true" />
                Nouvelle valeur
              </Link>
            </Button>
          ) : undefined,
        }}
        search={{
          placeholder: "Rechercher une valeur…",
          keys: ["title", "description"],
        }}
        filters={[
          {
            key: "isVisible",
            label: "État",
            options: [
              { value: "visible", label: VISIBILITY_LABELS.visible },
              { value: "hidden", label: VISIBILITY_LABELS.hidden },
            ],
            match: (valeur, choix) =>
              choix === "visible" ? valeur.isVisible : !valeur.isVisible,
          },
          {
            key: "tone",
            label: "Teinte",
            options: Object.entries(MEDIA_TONE_LABELS).map(([value, label]) => ({
              value,
              label,
            })),
            match: (valeur, choix) => valeur.tone === choix,
          },
        ]}
        pagination={{ pageSize: 10 }}
        reorder={
          peutReordonner
            ? {
                onReorder: async (ordre) => {
                  const resultat = await reordonnerValeursAction({
                    orderedIds: ordre,
                  });

                  // `<DataTable>` remet l'ordre du serveur et le dit si cette
                  // promesse échoue : c'est son contrat, on le respecte.
                  if (!resultat.ok) throw new Error(resultat.message);

                  router.refresh();
                },
              }
            : undefined
        }
        selection={
          peutModifier || peutSupprimer
            ? {
                actions: [
                  ...(peutModifier
                    ? [
                        { key: "afficher", label: "Afficher", icon: Eye },
                        { key: "masquer", label: "Masquer", icon: EyeOff },
                      ]
                    : []),
                  ...(peutSupprimer
                    ? [
                        {
                          key: "supprimer",
                          label: "Supprimer",
                          icon: Trash2,
                          variant: "destructive" as const,
                        },
                      ]
                    : []),
                ],
                onBulk: (ids, action) => {
                  if (action.key === "supprimer") {
                    setASupprimerEnLot(ids);
                    return;
                  }

                  const cible = action.key === "afficher";

                  void appliquerEnLot(
                    ids,
                    async (valeur) => {
                      const resultat = await changerVisibiliteValeurAction({
                        id: valeur.id,
                        isVisible: cible,
                      });
                      return resultat.ok;
                    },
                    (reussites, echecs) => {
                      const verbe = cible ? "affichée" : "masquée";
                      if (echecs > 0) {
                        return `${reussites} traitée${reussites > 1 ? "s" : ""}, ${echecs} refusée${echecs > 1 ? "s" : ""}. Ouvrez les valeurs concernées pour connaître le motif.`;
                      }
                      /*
                        Masquer en lot est le geste qui peut vider les deux
                        pages sans qu'on s'en rende compte : le résumé le dit
                        au lieu de se contenter de compter. Le décompte est
                        calculé sur l'état AVANT rafraîchissement, d'où la
                        soustraction plutôt qu'une relecture.
                      */
                      const restantes = cible
                        ? visibles.length + reussites
                        : visibles.length - reussites;

                      return restantes <= 0
                        ? `${reussites} valeur${reussites > 1 ? "s" : ""} ${verbe}${reussites > 1 ? "s" : ""}. La section « Nos valeurs » n'apparaît plus sur aucune des deux pages.`
                        : `${reussites} valeur${reussites > 1 ? "s" : ""} ${verbe}${reussites > 1 ? "s" : ""}.`;
                    },
                  );
                },
              }
            : undefined
        }
        rowActions={(valeur) => [
          {
            label: peutModifier ? "Modifier" : "Ouvrir la valeur",
            icon: Pencil,
            onSelect: () => router.push(`/dashboard/valeurs/${valeur.id}`),
          },
          ...(peutModifier
            ? [
                valeur.isVisible
                  ? {
                      label: "Masquer",
                      icon: EyeOff,
                      onSelect: () => {
                        /*
                          Confirmation UNIQUEMENT pour la dernière visible.

                          Masquer est réversible d'un clic : demander
                          confirmation à chaque fois userait la confirmation
                          jusqu'à ce qu'on la valide sans lire — et elle ne
                          servirait plus le jour où elle compte. Elle compte
                          ici : c'est le geste qui fait disparaître la section
                          de deux pages publiques.
                        */
                        if (visibles.length === 1 && valeur.isVisible) {
                          setAMasquer(valeur);
                          return;
                        }
                        void changerVisibilite(valeur, false);
                      },
                    }
                  : {
                      label: "Afficher",
                      icon: Eye,
                      onSelect: () => void changerVisibilite(valeur, true),
                    },
              ]
            : []),
          ...(peutSupprimer
            ? [
                {
                  label: "Supprimer",
                  icon: Trash2,
                  variant: "destructive" as const,
                  onSelect: () => setASupprimer(valeur),
                },
              ]
            : []),
        ]}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Confirmations — elles NOMMENT la conséquence (§6.4)                 */}
      {/* ------------------------------------------------------------------ */}

      <ConfirmDialog
        open={aMasquer !== null}
        onOpenChange={(ouvert) => {
          if (!ouvert) setAMasquer(null);
        }}
        title={
          aMasquer
            ? `Masquer « ${aMasquer.title} », la dernière valeur affichée ?`
            : "Masquer la dernière valeur affichée ?"
        }
        description="La section « Nos valeurs » disparaîtra entièrement de la page d'accueil ET de « Qui sommes-nous ». Rien n'est perdu : la valeur reste dans cette liste, à sa place, et il suffit de la réafficher."
        confirmLabel="Masquer quand même"
        onConfirm={async () => {
          if (aMasquer) await changerVisibilite(aMasquer, false);
          setAMasquer(null);
        }}
      />

      <ConfirmDialog
        open={aSupprimer !== null}
        onOpenChange={(ouvert) => {
          if (!ouvert) setASupprimer(null);
        }}
        title={
          aSupprimer
            ? `Supprimer « ${aSupprimer.title} » ?`
            : "Supprimer cette valeur ?"
        }
        /*
          La différence masquer / supprimer est écrite : c'est la seule
          collection sans archive où la ranger, et « définitive » y est littéral.
        */
        description="La valeur disparaît des deux pages et de la base. Cette action est définitive — cette collection n'a pas d'archive. Pour la retirer du site en gardant son texte, utilisez « Masquer »."
        confirmLabel="Supprimer la valeur"
        onConfirm={async () => {
          if (aSupprimer) await supprimer(aSupprimer);
          setASupprimer(null);
        }}
      />

      <ConfirmDialog
        open={aSupprimerEnLot !== null}
        onOpenChange={(ouvert) => {
          if (!ouvert) setASupprimerEnLot(null);
        }}
        title={
          aSupprimerEnLot
            ? `Supprimer ${aSupprimerEnLot.length} valeur${aSupprimerEnLot.length > 1 ? "s" : ""} ?`
            : "Supprimer ces valeurs ?"
        }
        description="Les valeurs disparaissent des deux pages et de la base. Cette action est définitive — cette collection n'a pas d'archive. Pour les retirer du site en gardant leur texte, utilisez « Masquer »."
        confirmLabel="Supprimer"
        onConfirm={async () => {
          const ids = aSupprimerEnLot ?? [];
          setASupprimerEnLot(null);

          await appliquerEnLot(
            ids,
            async (valeur) => {
              const resultat = await supprimerValeurAction({ id: valeur.id });
              return resultat.ok;
            },
            (reussites, echecs) =>
              echecs === 0
                ? `${reussites} valeur${reussites > 1 ? "s" : ""} supprimée${reussites > 1 ? "s" : ""}.`
                : `${reussites} supprimée${reussites > 1 ? "s" : ""}, ${echecs} conservée${echecs > 1 ? "s" : ""}. Ouvrez les valeurs concernées pour connaître le motif.`,
          );
        }}
      />
    </div>
  );
}
