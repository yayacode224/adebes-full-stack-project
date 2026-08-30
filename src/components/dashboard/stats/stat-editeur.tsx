"use client";

import { Eye, EyeOff, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  MENTION_VALEUR_ABSENTE,
  chiffreDisponible,
  type Stat,
} from "@/core/cms/entities/stat";
import {
  changerVisibiliteChiffreAction,
  supprimerChiffreAction,
} from "@/server/actions/stats.actions";

import { VisibilityBadge } from "../feedback/visibility-badge";
import { PageHeader } from "../layout/page-header";
import { ConfirmDialog } from "../modals/confirm-dialog";
import { StatForm } from "./stat-form";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  L'ÉCRAN `/dashboard/chiffres/[id]`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Le formulaire, et autour de lui les décisions qui ne sont pas de la saisie :
 * afficher, masquer, supprimer.
 *
 * ---------------------------------------------------------------------------
 * DEUX LIENS « VOIR SUR LE SITE » — comme au Lot 8E, et pour la même raison
 * ---------------------------------------------------------------------------
 * Un chiffre n'a pas de page à lui : il apparaît dans une bande, sur l'accueil
 * ET sur « Impact & transparence ». Un lien unique aurait fallu choisir laquelle
 * des deux, et aurait laissé croire que l'autre ne l'affiche pas.
 *
 * Les deux ne sont rendus que si le chiffre est AFFICHÉ. Sur un chiffre masqué,
 * ils promettraient une page où il ne figure pas — invariant nº 2 pris au sens
 * de sa raison d'être : un lien qui ne tient pas ce qu'il annonce.
 *
 * ⚠️  Ils portent `inline-flex min-h-11` : ce sont des CIBLES TACTILES, et
 * l'exception WCAG 2.5.8 pour les liens « au sein d'une phrase » n'est pas
 * invoquée ici (écart nº 112).
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LA CLÉ TECHNIQUE EST AFFICHÉE, EN LECTURE SEULE — voir l'écart nº 124
 * ---------------------------------------------------------------------------
 * Elle ne se saisit pas et ne se modifie pas. La montrer plutôt que la cacher
 * évite la surprise du jour où quelqu'un ouvre la base et découvre une colonne
 * dont l'interface n'a jamais parlé — et elle sera nécessaire au Lot 9, quand
 * un bloc de page désignera un chiffre par sa clé.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  IL N'Y A PAS DE BOUTON « PUBLIER » — ET PAS DE PERMISSION NON PLUS
 * ---------------------------------------------------------------------------
 * Cette collection n'a pas de cycle éditorial : `stat:publish` n'existe dans
 * aucun rôle. Afficher ou masquer relève de `stat:update`, la même permission
 * qui autorise à corriger le chiffre — donc ouverte à l'éditeur. C'est l'écart
 * nº 104 sur la seconde table qui le porte ; il est consigné, pas corrigé au
 * détour d'un lot de collection.
 */
export function StatEditeur({
  chiffre,
  /**
   * Nombre de chiffres actuellement affichés sur le site, celui-ci compris.
   *
   * Lu côté serveur par la page : c'est le seul moyen, depuis une fiche, de
   * savoir si le masquer viderait la bande des deux pages. La fiche ne connaît
   * qu'elle-même.
   */
  visiblesTotal,
  peutModifier,
  peutSupprimer,
}: {
  chiffre: Stat;
  visiblesTotal: number;
  peutModifier: boolean;
  peutSupprimer: boolean;
}) {
  const router = useRouter();
  const [confirmationOuverte, setConfirmationOuverte] = useState(false);
  const [masquageOuvert, setMasquageOuvert] = useState(false);

  const affiche = chiffre.isVisible;
  const dernierAffiche = affiche && visiblesTotal === 1;
  const renseigne = chiffreDisponible(chiffre);

  async function changerVisibilite(isVisible: boolean) {
    const resultat = await changerVisibiliteChiffreAction({
      id: chiffre.id,
      isVisible,
    });

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 10000 });
      return;
    }

    toast.success(
      isVisible
        ? "Le chiffre est de nouveau affiché sur les deux pages."
        : "Le chiffre n'apparaît plus sur l'accueil ni sur « Impact ».",
    );
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={chiffre.label}
        description={
          affiche
            ? "Ce chiffre est affiché sur la page d'accueil et sur « Impact & transparence ». Toute modification enregistrée y apparaît."
            : "Ce chiffre n'apparaît sur aucune des deux pages. Sa valeur et sa précision sont conservées : il suffit de l'afficher pour le remettre en ligne, à sa place dans l'ordre."
        }
        actions={
          <>
            {peutModifier ? (
              affiche ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // Confirmation uniquement quand c'est le dernier : voir
                    // le même raisonnement dans `stats-client.tsx`.
                    if (dernierAffiche) setMasquageOuvert(true);
                    else void changerVisibilite(false);
                  }}
                >
                  <EyeOff className="size-4" aria-hidden="true" />
                  Masquer
                </Button>
              ) : (
                <Button type="button" onClick={() => void changerVisibilite(true)}>
                  <Eye className="size-4" aria-hidden="true" />
                  Afficher sur le site
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
        <VisibilityBadge isVisible={affiche} />

        {/*
          ---------------------------------------------------------------------
          LES DEUX LIENS « OÙ EST-IL ? » VIVENT ICI, PAS DANS L'EN-TÊTE
          ---------------------------------------------------------------------
          Écart nº 112, appliqué d'emblée : quatre commandes dans l'en-tête
          faisaient déborder l'écran dès 640 px au Lot 8E, c'est-à-dire au zoom
          200 %. Ce ne sont d'ailleurs pas des commandes — ils ne changent rien,
          ils DISENT où le chiffre apparaît, ce qui en fait le complément
          naturel du badge à côté.
        */}
        {affiche ? (
          <p className="flex flex-wrap items-center gap-x-1 text-sm text-muted-foreground">
            Visible sur
            <Link
              href="/#chiffres"
              className="inline-flex min-h-11 items-center px-1 font-medium text-primary underline underline-offset-2"
            >
              l&apos;accueil
            </Link>
            et sur
            <Link
              href="/impact#chiffres"
              className="inline-flex min-h-11 items-center px-1 font-medium text-primary underline underline-offset-2"
            >
              Impact &amp; transparence
            </Link>
          </p>
        ) : null}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Ce que le site affiche AUJOURD'HUI à la place de ce chiffre         */}
      {/* ------------------------------------------------------------------ */}
      {affiche && !renseigne ? (
        /*
          Dit à quoi ressemble la carte en ce moment. Sur une fiche, on ne voit
          pas le site — et « — » est un état qu'on peut avoir laissé là il y a
          six mois sans s'en souvenir.

          ⚠️  Le ton est celui d'un CONSTAT, pas d'un reproche : c'est un état
          voulu, et la seule faute possible serait d'inventer un chiffre pour
          faire disparaître ce message.
        */
        <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            Les deux pages affichent «&nbsp;—&nbsp;» à la place de ce chiffre.
          </span>{" "}
          {MENTION_VALEUR_ABSENTE}. C&apos;est un état voulu : mieux vaut un
          tiret qu&apos;un nombre approximatif. Décochez « Ce chiffre n&apos;est
          pas encore disponible », ci-dessous, le jour où la valeur est
          consolidée.
        </p>
      ) : null}

      {affiche && renseigne && chiffre.toConfirm ? (
        <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            Ce chiffre est marqué « à revalider ».
          </span>{" "}
          Il est affiché tel quel sur les deux pages, sans mention particulière :
          le marqueur est interne. Après vérification, décochez la case en bas du
          formulaire.
        </p>
      ) : null}

      {dernierAffiche ? (
        /*
          Dit AVANT le clic ce que la confirmation redira après. Le motif : sur
          une fiche, on ne voit pas la liste, et « c'est le dernier » est une
          information qu'aucun élément de cet écran ne porte autrement.
        */
        <p className="text-sm text-muted-foreground">
          C&apos;est le dernier chiffre affiché : le masquer ferait disparaître
          la bande de chiffres des deux pages.
        </p>
      ) : null}

      {!peutSupprimer ? (
        <p className="text-sm text-muted-foreground">
          La suppression est réservée aux administrateurs. Vous pouvez retirer ce
          chiffre du site avec « Masquer », sans rien perdre.
        </p>
      ) : null}

      {peutModifier ? (
        <StatForm chiffre={chiffre} />
      ) : (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Vous n&apos;avez pas les droits pour modifier ce chiffre.{" "}
          <Link
            href="/dashboard/chiffres"
            className="font-medium text-primary underline underline-offset-2"
          >
            Revenir à la liste
          </Link>
        </p>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* L'identifiant technique — affiché, jamais modifiable (écart nº 124) */}
      {/* ------------------------------------------------------------------ */}
      <p className="text-xs text-muted-foreground">
        Identifiant technique :{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
          {chiffre.key}
        </code>{" "}
        — fixé à la création à partir du libellé, il ne change plus. Il
        n&apos;apparaît nulle part sur le site ; il sert à désigner ce chiffre de
        façon stable, même si son libellé est reformulé.
      </p>

      <ConfirmDialog
        open={masquageOuvert}
        onOpenChange={setMasquageOuvert}
        title={`Masquer « ${chiffre.label} », le dernier chiffre affiché ?`}
        description="La bande de chiffres disparaîtra entièrement de la page d'accueil ET de « Impact & transparence ». Rien n'est perdu : le chiffre reste dans la liste, à sa place, et il suffit de le réafficher. Si c'est sa valeur qui n'est plus sûre, cochez plutôt « Ce chiffre n'est pas encore disponible » : la carte reste, avec « — »."
        confirmLabel="Masquer quand même"
        onConfirm={async () => {
          await changerVisibilite(false);
          setMasquageOuvert(false);
        }}
      />

      <ConfirmDialog
        open={confirmationOuverte}
        onOpenChange={setConfirmationOuverte}
        title={`Supprimer « ${chiffre.label} » ?`}
        description="Le chiffre disparaît des deux pages et de la base, avec la précision qui indiquait sa source. Cette action est définitive — cette collection n'a pas d'archive. Pour le retirer du site en gardant sa valeur, utilisez « Masquer »."
        confirmLabel="Supprimer le chiffre"
        onConfirm={async () => {
          const resultat = await supprimerChiffreAction({ id: chiffre.id });

          if (!resultat.ok) {
            toast.error(resultat.message, { duration: 10000 });
            return;
          }

          toast.success("Le chiffre a été supprimé.");
          router.push("/dashboard/chiffres");
        }}
      />
    </div>
  );
}
