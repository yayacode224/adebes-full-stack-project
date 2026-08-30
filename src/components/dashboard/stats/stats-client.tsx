"use client";

import {
  CircleAlert,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { ContentIcon } from "@/components/ui-ext/content-icon";
import { Button } from "@/components/ui/button";
import {
  MENTION_VALEUR_ABSENTE,
  chiffreDisponible,
  libelleValeur,
  type Stat,
} from "@/core/cms/entities/stat";
import { VISIBILITY_LABELS } from "@/core/cms/entities/visibility";
import {
  changerVisibiliteChiffreAction,
  reordonnerChiffresAction,
  supprimerChiffreAction,
} from "@/server/actions/stats.actions";

import { DataTable } from "../data-table/data-table";
import type { Column } from "../data-table/types";
import { VisibilityBadge } from "../feedback/visibility-badge";
import { PageHeader } from "../layout/page-header";
import { ConfirmDialog } from "../modals/confirm-dialog";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  L'ÉCRAN `/dashboard/chiffres`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8G du Rapport 2, sur le gabarit du §8E : glissière de réordonnancement ·
 * Icône · Libellé · Chiffre · État. Filtres : état, disponibilité du chiffre,
 * à revalider. Recherche : libellé, précision. Actions groupées : afficher,
 * masquer, supprimer.
 *
 * ---------------------------------------------------------------------------
 * DEUX BANDEAUX, POUR DEUX QUESTIONS DIFFÉRENTES
 * ---------------------------------------------------------------------------
 *   1. **« ce que les deux pages montrent »** — repris du Lot 8E, et pour la
 *      même raison : un écran qui affiche N lignes sans rien dire laisse croire
 *      que le site en montre N aussi. Il se déclenche dès qu'un chiffre est
 *      masqué, et se durcit quand il n'en reste aucun de visible.
 *
 *   2. **« ce qui reste à consolider »** — propre à cette collection. Il compte
 *      les chiffres non fournis (`value = null`, affichés « — » sur le site) et
 *      les chiffres à revalider (`to_confirm`). Ce sont deux états HONNÊTES, ce
 *      n'est donc pas un avertissement : c'est une liste de tâches, adressée à
 *      qui peut agir.
 *
 * ⚠️  Le second ne se transforme JAMAIS en incitation à remplir. Le libellé dit
 * « à fournir », pas « manquant » ni « incomplet » : un chiffre absent est un
 * état légitime, et la seule faute possible ici serait d'en inventer un pour
 * faire disparaître un bandeau.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  « CRÉER » ET « SUPPRIMER » SONT RÉSERVÉS AUX ADMINISTRATEURS
 * ---------------------------------------------------------------------------
 * `stat:create` est absent de la liste `editor`, et la RLS dit la même chose
 * (`stats_admin_insert`). Un éditeur peut corriger un chiffre, sa précision,
 * son ordre, et le retirer du site ; il ne peut pas en ajouter.
 *
 * Le bouton n'est donc pas rendu — et le vide est EXPLIQUÉ plus bas plutôt que
 * laissé muet : une commande absente sans motif passe pour une panne (§12 du
 * Rapport 1).
 */

export function StatsClient({
  chiffres: chiffresInitiaux,
  peutCreer,
  peutModifier,
  peutSupprimer,
  peutReordonner,
}: {
  chiffres: Stat[];
  peutCreer: boolean;
  peutModifier: boolean;
  peutSupprimer: boolean;
  peutReordonner: boolean;
}) {
  const router = useRouter();

  const [aSupprimer, setASupprimer] = useState<Stat | null>(null);
  const [aSupprimerEnLot, setASupprimerEnLot] = useState<string[] | null>(null);
  const [aMasquer, setAMasquer] = useState<Stat | null>(null);

  const visibles = chiffresInitiaux.filter((stat) => stat.isVisible);
  const masques = chiffresInitiaux.filter((stat) => !stat.isVisible);

  // Les deux relevés du second bandeau, comptés sur les chiffres RÉELLEMENT
  // affichés : un chiffre masqué n'a rien à consolider tant qu'il ne revient
  // pas en ligne.
  const aFournir = visibles.filter((stat) => !chiffreDisponible(stat));
  const aRevalider = visibles.filter((stat) => stat.toConfirm);

  /*
    ---------------------------------------------------------------------------
    LES LIBELLÉS EN DOUBLE — SIGNALÉS, JAMAIS INTERDITS (doctrine de l'écart
    nº 115, trouvée ici par la recette : D08)
    ---------------------------------------------------------------------------
    La contrainte `unique` de la base porte sur la CLÉ technique, pas sur le
    libellé — et les quatre clés du seed ne sont même pas dérivées de leurs
    libellés. Deux cartes « Projets menés » sont donc atteignables, et elles
    seraient indiscernables sur l'accueil comme sur `/impact`.

    Ni la base ni le métier ne portent d'unicité sur le libellé : l'inventer
    serait la faute que le Lot 8D a nommée. Les deux lignes concernées sont donc
    MARQUÉES — les deux, pas seulement la seconde, qui n'est pas plus fautive
    que la première.

    La comparaison ignore la casse et les espaces de bord : « Projets menés » et
    « projets menés  » sont le même libellé pour un visiteur.
  */
  const normaliser = (label: string) => label.trim().toLocaleLowerCase("fr");
  const occurrences = new Map<string, number>();
  for (const stat of chiffresInitiaux) {
    const cle = normaliser(stat.label);
    occurrences.set(cle, (occurrences.get(cle) ?? 0) + 1);
  }
  const enDouble = new Set(
    [...occurrences.entries()].filter(([, n]) => n > 1).map(([cle]) => cle),
  );
  const lignesEnDouble = chiffresInitiaux.filter((stat) =>
    enDouble.has(normaliser(stat.label)),
  );

  /* ---------------------------------------------------------------------- */
  /* Mutations                                                               */
  /* ---------------------------------------------------------------------- */

  async function changerVisibilite(stat: Stat, isVisible: boolean) {
    const resultat = await changerVisibiliteChiffreAction({
      id: stat.id,
      isVisible,
    });

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 10000 });
      return;
    }

    toast.success(
      isVisible
        ? `« ${stat.label} » est de nouveau affiché sur le site.`
        : `« ${stat.label} » n'apparaît plus sur l'accueil ni sur « Impact ».`,
    );
    router.refresh();
  }

  async function supprimer(stat: Stat) {
    const resultat = await supprimerChiffreAction({ id: stat.id });

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 10000 });
      return;
    }

    toast.success(`« ${stat.label} » a été supprimé.`);
    router.refresh();
  }

  /**
   * Actions groupées.
   *
   * Séquentielles et non parallèles : chaque suppression renumérote les
   * positions restantes (voir `deleteStat`), et deux renumérotations
   * concurrentes produiraient un ordre que personne n'a voulu.
   */
  async function appliquerEnLot(
    ids: string[],
    traiter: (stat: Stat) => Promise<boolean>,
    resume: (reussites: number, echecs: number) => string,
  ) {
    let reussites = 0;
    let echecs = 0;

    for (const id of ids) {
      const stat = chiffresInitiaux.find((c) => c.id === id);
      if (!stat) continue;
      if (await traiter(stat)) reussites += 1;
      else echecs += 1;
    }

    if (echecs === 0) toast.success(resume(reussites, echecs));
    else toast.error(resume(reussites, echecs), { duration: 10000 });

    router.refresh();
  }

  /* ---------------------------------------------------------------------- */
  /* Colonnes                                                                */
  /* ---------------------------------------------------------------------- */

  const colonnes: Column<Stat>[] = [
    {
      key: "icon",
      header: "Icône",
      width: "4.5rem",
      cell: (stat) => (
        /*
          Le NOM de l'icône est en `sr-only` plutôt qu'absent : sans lui, un
          lecteur d'écran annonce une cellule vide, et la colonne devient
          inutilisable pour vérifier qu'aucun chiffre n'a gardé l'étoile de
          repli.
        */
        <span className="grid size-11 place-items-center rounded-xl bg-muted text-muted-foreground">
          <ContentIcon name={stat.icon} className="size-5" />
          <span className="sr-only">{stat.icon}</span>
        </span>
      ),
    },
    {
      key: "label",
      header: "Libellé",
      sortable: true,
      sortValue: (stat) => stat.label,
      cell: (stat) => (
        <span className="flex min-w-0 flex-col">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium text-foreground">
              {stat.label}
            </span>
            {enDouble.has(normaliser(stat.label)) ? (
              /*
                Marqué sur les DEUX lignes. Bordure tiretée sans fond et
                `text-muted-foreground` : la paire mesurée à 4,9:1 de
                `<StatusBadge>` (état `archived`). Aucune couleur composée ici.
              */
              <span className="inline-flex shrink-0 items-center rounded-full border border-dashed border-border px-2 py-0.5 text-xs font-medium whitespace-nowrap text-muted-foreground">
                Libellé en double
              </span>
            ) : null}
          </span>
          {/* La précision en second, tronquée : sous 768 px, la carte n'affiche
              que la colonne primaire, et un chiffre sans sa source ne se
              vérifie pas. */}
          <span className="line-clamp-2 text-xs text-muted-foreground">
            {stat.note ?? "Aucune précision"}
          </span>
        </span>
      ),
    },
    {
      /*
        ═══════════════════════════════════════════════════════════════════════
         LA COLONNE DU LOT
        ═══════════════════════════════════════════════════════════════════════
        Elle affiche « — » exactement comme le site, par `libelleValeur()` —
        la MÊME fonction que l'aperçu et la fiche, pour que le dashboard ne
        puisse pas dire autre chose que la carte publique.

        ⚠️  Le tiret est doublé d'une MENTION en toutes lettres. Seul, il
        pourrait passer pour une colonne vide, un défaut d'affichage, ou une
        donnée en cours de chargement — trois lectures qui mènent à « il faut
        remplir ça », c'est-à-dire à inventer un chiffre. La mention dit ce
        qu'il est : un état voulu.

        ⚠️  Le tri est sur la valeur BRUTE, pas sur son libellé : un tri
        alphabétique classerait « 30+ » avant « 8 ». `null` est envoyé en fin
        de liste croissante — le même comportement que PostgreSQL, pour que le
        tri du tableau et celui du dépôt ne se contredisent pas.
      */
      key: "value",
      header: "Chiffre",
      sortable: true,
      sortValue: (stat) => stat.value ?? Number.POSITIVE_INFINITY,
      cell: (stat) =>
        chiffreDisponible(stat) ? (
          <span className="font-medium tabular-nums text-foreground">
            {libelleValeur(stat)}
          </span>
        ) : (
          <span className="flex min-w-0 flex-col">
            <span
              className="font-medium text-muted-foreground"
              aria-hidden="true"
            >
              {libelleValeur(stat)}
            </span>
            <span className="text-xs text-muted-foreground">
              {MENTION_VALEUR_ABSENTE}
            </span>
          </span>
        ),
    },
    {
      key: "toConfirm",
      header: "À revalider",
      hideOnMobile: true,
      sortable: true,
      // Les chiffres à revalider d'abord : c'est l'ordre utile, « qu'est-ce
      // qui reste à faire ».
      sortValue: (stat) => (stat.toConfirm ? 0 : 1),
      cell: (stat) =>
        stat.toConfirm ? (
          /*
            La paire « outline + teinte orange » de `<StatusBadge>` (état
            `in_review`), où elle a été MESURÉE : #a8560c sur la surface →
            4,9:1, et 4,7:1 sur une ligne de tableau. Aucune couleur n'est
            composée ici — voir la règle de l'écart nº 43.
          */
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-orange-ink/40 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-brand-orange-ink dark:border-brand-orange/50 dark:text-brand-orange">
            <span
              aria-hidden="true"
              className="size-1.5 shrink-0 rounded-full border-2 border-brand-orange-ink bg-transparent dark:border-brand-orange"
            />
            À revalider
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "isVisible",
      header: "État",
      sortable: true,
      // Les chiffres affichés d'abord : c'est l'ordre utile, « qu'est-ce que le
      // site montre ». Un tri booléen brut mettrait `false` en tête.
      sortValue: (stat) => (stat.isVisible ? 0 : 1),
      cell: (stat) => <VisibilityBadge isVisible={stat.isVisible} />,
    },
  ];

  /* ---------------------------------------------------------------------- */
  /* Rendu                                                                   */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Chiffres clés"
        description="Les cartes chiffrées de la page d'accueil et de « Impact & transparence ». Les deux pages lisent cette liste, dans cet ordre."
        actions={
          peutCreer ? (
            <Button asChild>
              <Link href="/dashboard/chiffres/nouveau">
                <Plus className="size-4" aria-hidden="true" />
                Nouveau chiffre
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* ------------------------------------------------------------------ */}
      {/* 1. Ce que les DEUX pages montrent — pas ce que ce tableau contient  */}
      {/* ------------------------------------------------------------------ */}
      {masques.length > 0 ? (
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
                  La bande de chiffres n&apos;apparaît plus, ni sur
                  l&apos;accueil ni sur « Impact &amp; transparence ».
                </span>{" "}
                Les {masques.length} chiffres de cette liste sont masqués, et les
                deux pages masquent la section entière plutôt que d&apos;annoncer
                un contenu absent. Réaffichez-en au moins un pour la faire
                revenir.
              </p>
            ) : (
              <p>
                <span className="font-medium text-foreground">
                  {masques.length === 1
                    ? "Un chiffre de cette liste n'apparaît pas sur le site."
                    : `${masques.length} chiffres de cette liste n'apparaissent pas sur le site.`}
                </span>{" "}
                L&apos;accueil et « Impact » en affichent{" "}
                {visibles.length === 1
                  ? "un seul"
                  : `${visibles.length} sur ${chiffresInitiaux.length}`}
                . Un chiffre masqué conserve sa place dans l&apos;ordre et la
                retrouve si vous le réaffichez.
              </p>
            )}
          </div>
        </div>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* 2. Ce qui reste à consolider — une liste de tâches, pas une alerte  */}
      {/* ------------------------------------------------------------------ */}
      {aFournir.length > 0 || aRevalider.length > 0 || lignesEnDouble.length > 0 ? (
        <div
          role="status"
          className="flex gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm"
        >
          <CircleAlert
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <div className="flex flex-col gap-2 text-muted-foreground">
            {aFournir.length > 0 ? (
              <p>
                <span className="font-medium text-foreground">
                  {aFournir.length === 1
                    ? "Un chiffre en ligne n'a pas encore été fourni"
                    : `${aFournir.length} chiffres en ligne n'ont pas encore été fournis`}
                </span>{" "}
                : le site affiche «&nbsp;—&nbsp;» à leur place, avec la mention.
                C&apos;est un état voulu, pas une panne — il vaut mieux
                qu&apos;un chiffre approximatif. Renseignez-les quand les
                rapports d&apos;activité les donnent.
              </p>
            ) : null}

            {aRevalider.length > 0 ? (
              <p>
                <span className="font-medium text-foreground">
                  {aRevalider.length === 1
                    ? "Un chiffre en ligne est marqué « à revalider »"
                    : `${aRevalider.length} chiffres en ligne sont marqués « à revalider »`}
                </span>{" "}
                : ils sont affichés tels quels sur le site, sans mention
                particulière. Vérifiez-les, puis décochez la case sur leur fiche.
              </p>
            ) : null}

            {lignesEnDouble.length > 0 ? (
              <p>
                <span className="font-medium text-foreground">
                  {lignesEnDouble.length} lignes portent le même libellé.
                </span>{" "}
                Elles sont marquées ci-dessous. Ce n&apos;est pas interdit — rien
                n&apos;impose des libellés distincts — mais deux cartes
                identiques ne se distinguent pas l&apos;une de l&apos;autre sur
                l&apos;accueil ni sur « Impact ».
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/*
        Le motif d'une commande absente, écrit une fois.

        Un éditeur qui ne trouve pas « Nouveau chiffre » doit lire pourquoi
        plutôt que conclure à une panne.
      */}
      {!peutCreer ? (
        <p className="text-sm text-muted-foreground">
          Ajouter ou supprimer un chiffre est réservé aux administrateurs : ces
          cartes sont la vitrine chiffrée de l&apos;association, pas un flux de
          contenu. Vous pouvez modifier leur valeur, leur libellé, leur
          précision, leur ordre, et les retirer du site.
        </p>
      ) : null}

      <DataTable<Stat>
        data={chiffresInitiaux}
        columns={colonnes}
        getRowId={(stat) => stat.id}
        primaryColumnKey="label"
        badgeColumnKey="isVisible"
        itemLabel="chiffre"
        emptyState={{
          title: "Aucun chiffre pour l'instant",
          description:
            "La bande de chiffres n'apparaît ni sur l'accueil ni sur « Impact & transparence » tant que cette liste est vide.",
          action: peutCreer ? (
            <Button asChild>
              <Link href="/dashboard/chiffres/nouveau">
                <Plus className="size-4" aria-hidden="true" />
                Nouveau chiffre
              </Link>
            </Button>
          ) : undefined,
        }}
        /*
          ⚠️  La recherche porte sur le libellé et la précision, PAS sur le
          chiffre : le dépôt Supabase a la même limite (un `ilike` sur deux
          colonnes texte), et un filtre client plus généreux ferait diverger les
          deux le jour où la collection passera au filtrage serveur.
        */
        search={{
          placeholder: "Rechercher un chiffre…",
          keys: ["label", "note"],
        }}
        filters={[
          {
            key: "isVisible",
            label: "État",
            options: [
              { value: "visible", label: VISIBILITY_LABELS.visible },
              { value: "hidden", label: VISIBILITY_LABELS.hidden },
            ],
            match: (stat, choix) =>
              choix === "visible" ? stat.isVisible : !stat.isVisible,
          },
          {
            key: "value",
            label: "Chiffre",
            options: [
              { value: "renseigne", label: "Renseigné" },
              { value: "a-fournir", label: "À fournir" },
            ],
            match: (stat, choix) =>
              choix === "renseigne"
                ? chiffreDisponible(stat)
                : !chiffreDisponible(stat),
          },
          {
            key: "toConfirm",
            label: "Fiabilité",
            options: [
              { value: "a-revalider", label: "À revalider" },
              { value: "valide", label: "Validé" },
            ],
            match: (stat, choix) =>
              choix === "a-revalider" ? stat.toConfirm : !stat.toConfirm,
          },
        ]}
        pagination={{ pageSize: 10 }}
        reorder={
          peutReordonner
            ? {
                onReorder: async (ordre) => {
                  const resultat = await reordonnerChiffresAction({
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
                    async (stat) => {
                      const resultat = await changerVisibiliteChiffreAction({
                        id: stat.id,
                        isVisible: cible,
                      });
                      return resultat.ok;
                    },
                    (reussites, echecs) => {
                      const verbe = cible ? "affiché" : "masqué";
                      if (echecs > 0) {
                        return `${reussites} traité${reussites > 1 ? "s" : ""}, ${echecs} refusé${echecs > 1 ? "s" : ""}. Ouvrez les chiffres concernés pour connaître le motif.`;
                      }
                      /*
                        Masquer en lot est le geste qui peut vider les deux
                        pages sans qu'on s'en rende compte : le résumé le dit
                        au lieu de se contenter de compter. Le décompte est
                        calculé sur l'état AVANT rafraîchissement, d'où la
                        soustraction plutôt qu'une relecture.
                      */
                      const restants = cible
                        ? visibles.length + reussites
                        : visibles.length - reussites;

                      return restants <= 0
                        ? `${reussites} chiffre${reussites > 1 ? "s" : ""} ${verbe}${reussites > 1 ? "s" : ""}. La bande de chiffres n'apparaît plus sur aucune des deux pages.`
                        : `${reussites} chiffre${reussites > 1 ? "s" : ""} ${verbe}${reussites > 1 ? "s" : ""}.`;
                    },
                  );
                },
              }
            : undefined
        }
        rowActions={(stat) => [
          {
            label: peutModifier ? "Modifier" : "Ouvrir le chiffre",
            icon: Pencil,
            onSelect: () => router.push(`/dashboard/chiffres/${stat.id}`),
          },
          ...(peutModifier
            ? [
                stat.isVisible
                  ? {
                      label: "Masquer",
                      icon: EyeOff,
                      onSelect: () => {
                        /*
                          Confirmation UNIQUEMENT pour le dernier visible.

                          Masquer est réversible d'un clic : demander
                          confirmation à chaque fois userait la confirmation
                          jusqu'à ce qu'on la valide sans lire — et elle ne
                          servirait plus le jour où elle compte. Elle compte
                          ici : c'est le geste qui fait disparaître la bande de
                          chiffres de deux pages publiques.
                        */
                        if (visibles.length === 1 && stat.isVisible) {
                          setAMasquer(stat);
                          return;
                        }
                        void changerVisibilite(stat, false);
                      },
                    }
                  : {
                      label: "Afficher",
                      icon: Eye,
                      onSelect: () => void changerVisibilite(stat, true),
                    },
              ]
            : []),
          ...(peutSupprimer
            ? [
                {
                  label: "Supprimer",
                  icon: Trash2,
                  variant: "destructive" as const,
                  onSelect: () => setASupprimer(stat),
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
            ? `Masquer « ${aMasquer.label} », le dernier chiffre affiché ?`
            : "Masquer le dernier chiffre affiché ?"
        }
        /*
          La confirmation rappelle l'AUTRE geste, celui qui répond au vrai
          besoin dans neuf cas sur dix : « ce chiffre n'est plus sûr ». Masquer
          retire la carte entière et laisse croire que l'association ne suit
          plus l'indicateur ; cocher « pas encore disponible » la garde en place
          avec « — ».
        */
        description="La bande de chiffres disparaîtra entièrement de la page d'accueil ET de « Impact & transparence ». Rien n'est perdu : le chiffre reste dans cette liste, à sa place, et il suffit de le réafficher. Si c'est sa valeur qui n'est plus sûre, cochez plutôt « Ce chiffre n'est pas encore disponible » sur sa fiche : la carte reste, avec « — »."
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
            ? `Supprimer « ${aSupprimer.label} » ?`
            : "Supprimer ce chiffre ?"
        }
        /*
          La différence masquer / supprimer est écrite, et la perte de la
          PRÉCISION est nommée : c'est elle qui rendait le chiffre vérifiable,
          et c'est ce qu'on remarque le moins en supprimant.
        */
        description="Le chiffre disparaît des deux pages et de la base, avec la précision qui indiquait sa source. Cette action est définitive — cette collection n'a pas d'archive. Pour le retirer du site en gardant sa valeur, utilisez « Masquer »."
        confirmLabel="Supprimer le chiffre"
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
            ? `Supprimer ${aSupprimerEnLot.length} chiffre${aSupprimerEnLot.length > 1 ? "s" : ""} ?`
            : "Supprimer ces chiffres ?"
        }
        description="Les chiffres disparaissent des deux pages et de la base, avec les précisions qui indiquaient leur source. Cette action est définitive — cette collection n'a pas d'archive. Pour les retirer du site en gardant leur valeur, utilisez « Masquer »."
        confirmLabel="Supprimer"
        onConfirm={async () => {
          const ids = aSupprimerEnLot ?? [];
          setASupprimerEnLot(null);

          await appliquerEnLot(
            ids,
            async (stat) => {
              const resultat = await supprimerChiffreAction({ id: stat.id });
              return resultat.ok;
            },
            (reussites, echecs) =>
              echecs === 0
                ? `${reussites} chiffre${reussites > 1 ? "s" : ""} supprimé${reussites > 1 ? "s" : ""}.`
                : `${reussites} supprimé${reussites > 1 ? "s" : ""}, ${echecs} conservé${echecs > 1 ? "s" : ""}. Ouvrez les chiffres concernés pour connaître le motif.`,
          );
        }}
      />
    </div>
  );
}
