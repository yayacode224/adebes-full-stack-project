"use client";

import { Eye, EyeOff, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { CoreValue } from "@/core/cms/entities/core-value";
import {
  changerVisibiliteValeurAction,
  supprimerValeurAction,
} from "@/server/actions/values.actions";

import { VisibilityBadge } from "../feedback/visibility-badge";
import { PageHeader } from "../layout/page-header";
import { ConfirmDialog } from "../modals/confirm-dialog";
import { ValueForm } from "./value-form";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  L'ÉCRAN `/dashboard/valeurs/[id]`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Le formulaire, et autour de lui les décisions qui ne sont pas de la saisie :
 * afficher, masquer, supprimer.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  DEUX LIENS « VOIR SUR LE SITE », ET C'EST LE SEUL ÉCRAN DANS CE CAS
 * ---------------------------------------------------------------------------
 * Une valeur n'a pas de page à elle : elle apparaît dans une grille, sur
 * l'accueil ET sur « Qui sommes-nous ». Un lien unique aurait fallu choisir
 * laquelle des deux, et aurait laissé croire que l'autre ne l'affiche pas.
 *
 * Les deux ne sont rendus que si la valeur est AFFICHÉE. Sur une valeur
 * masquée, ils promettraient une page où elle ne figure pas — invariant nº 2
 * pris au sens de sa raison d'être : un lien qui ne tient pas ce qu'il annonce.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  IL N'Y A PAS DE BOUTON « PUBLIER » — ET PAS DE PERMISSION NON PLUS
 * ---------------------------------------------------------------------------
 * Cette collection n'a pas de cycle éditorial : `value:publish` n'existe dans
 * aucun rôle. Afficher ou masquer relève de `value:update`, la même permission
 * qui autorise à corriger le texte — donc ouverte à l'éditeur.
 *
 * C'est un écart de pouvoir réel avec les quatre autres collections, où
 * dépublier est réservé aux administrateurs et doublé par le trigger
 * `guard_publish`. Il vient de la matrice et de la RLS, il est consigné, et il
 * ne se corrige pas au détour d'un lot de collection. Voir
 * `set-core-value-visibility.ts`.
 */
export function ValueEditeur({
  valeur,
  /**
   * Nombre de valeurs actuellement affichées sur le site, celle-ci comprise.
   *
   * Lu côté serveur par la page : c'est le seul moyen, depuis une fiche, de
   * savoir si la masquer viderait la section des deux pages. La fiche ne
   * connaît qu'elle-même.
   */
  visiblesTotal,
  peutModifier,
  peutSupprimer,
}: {
  valeur: CoreValue;
  visiblesTotal: number;
  peutModifier: boolean;
  peutSupprimer: boolean;
}) {
  const router = useRouter();
  const [confirmationOuverte, setConfirmationOuverte] = useState(false);
  const [masquageOuvert, setMasquageOuvert] = useState(false);

  const affichee = valeur.isVisible;
  const derniereAffichee = affichee && visiblesTotal === 1;

  async function changerVisibilite(isVisible: boolean) {
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
        ? "La valeur est de nouveau affichée sur les deux pages."
        : "La valeur n'apparaît plus sur l'accueil ni sur « Qui sommes-nous ».",
    );
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={valeur.title}
        description={
          affichee
            ? "Cette valeur est affichée sur la page d'accueil et sur « Qui sommes-nous ». Toute modification enregistrée y apparaît."
            : "Cette valeur n'apparaît sur aucune des deux pages. Son texte est conservé : il suffit de l'afficher pour la remettre en ligne, à sa place dans l'ordre."
        }
        actions={
          <>
            {peutModifier ? (
              affichee ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // Confirmation uniquement quand c'est la dernière : voir
                    // le même raisonnement dans `values-client.tsx`.
                    if (derniereAffichee) setMasquageOuvert(true);
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
        <VisibilityBadge isVisible={affichee} />

        {/*
          ---------------------------------------------------------------------
          LES DEUX LIENS « OÙ EST-ELLE ? » VIVENT ICI, PAS DANS L'EN-TÊTE
          ---------------------------------------------------------------------
          Ils y étaient, en boutons, et c'était une faute mesurée par la recette :
          quatre commandes dans l'en-tête faisaient **650 px de large**, et
          l'écran débordait horizontalement dès 640 px — c'est-à-dire au zoom
          200 %, exactement la situation où l'on a le plus besoin de lire.

          Les descendre ici corrige le débordement, mais ce n'est pas la seule
          raison de le faire : ce ne sont pas des commandes. Ils ne changent
          rien, ils DISENT où la valeur apparaît — la même information que le
          badge à côté, dont ils sont le complément naturel. En phrase plutôt
          qu'en boutons, ils tiennent sur une ligne et se lisent.

          Ils ne sont rendus que si la valeur est affichée : sur une valeur
          masquée, ils promettraient une page où elle ne figure pas.
        */}
        {affichee ? (
          <p className="flex flex-wrap items-center gap-x-1 text-sm text-muted-foreground">
            Visible sur
            {/*
              ⚠️  `inline-flex min-h-11` : ces liens sont des CIBLES TACTILES.

              Première version : de simples liens en ligne, mesurés à 56 × 17 et
              122 × 17 px par la recette — très en dessous des 44 px du §12. La
              tentation était d'inscrire dans le harnais l'exception WCAG 2.5.8
              pour les liens « au sein d'une phrase ». Se donner une dispense au
              moment où elle arrange le code qu'on vient d'écrire, c'est ne plus
              mesurer : les liens du pied de page, relevés à 22 px, attendent
              d'être corrigés au Lot 12 sous cette même règle.

              Ils sont donc conformes. La hauteur de ligne s'en trouve augmentée,
              ce qui est le prix — visible et assumé — d'une cible atteignable au
              pouce.
            */}
            <Link
              href="/#valeurs"
              className="inline-flex min-h-11 items-center px-1 font-medium text-primary underline underline-offset-2"
            >
              l&apos;accueil
            </Link>
            et sur
            <Link
              href="/a-propos#valeurs"
              className="inline-flex min-h-11 items-center px-1 font-medium text-primary underline underline-offset-2"
            >
              Qui sommes-nous
            </Link>
          </p>
        ) : null}

        {derniereAffichee ? (
          /*
            Dit AVANT le clic ce que la confirmation redira après. Le motif :
            sur une fiche, on ne voit pas la liste, et « c'est la dernière » est
            une information qu'aucun élément de cet écran ne porte autrement.
          */
          <p className="text-sm text-muted-foreground">
            C&apos;est la dernière valeur affichée : la masquer ferait
            disparaître la section « Nos valeurs » des deux pages.
          </p>
        ) : null}

        {!peutSupprimer ? (
          <p className="text-sm text-muted-foreground">
            La suppression est réservée aux administrateurs. Vous pouvez retirer
            cette valeur du site avec « Masquer », sans rien perdre.
          </p>
        ) : null}
      </div>

      {peutModifier ? (
        <ValueForm valeur={valeur} />
      ) : (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Vous n&apos;avez pas les droits pour modifier cette valeur.{" "}
          <Link
            href="/dashboard/valeurs"
            className="font-medium text-primary underline underline-offset-2"
          >
            Revenir à la liste
          </Link>
        </p>
      )}

      <ConfirmDialog
        open={masquageOuvert}
        onOpenChange={setMasquageOuvert}
        title={`Masquer « ${valeur.title} », la dernière valeur affichée ?`}
        description="La section « Nos valeurs » disparaîtra entièrement de la page d'accueil ET de « Qui sommes-nous ». Rien n'est perdu : la valeur reste dans la liste, à sa place, et il suffit de la réafficher."
        confirmLabel="Masquer quand même"
        onConfirm={async () => {
          await changerVisibilite(false);
          setMasquageOuvert(false);
        }}
      />

      <ConfirmDialog
        open={confirmationOuverte}
        onOpenChange={setConfirmationOuverte}
        title={`Supprimer « ${valeur.title} » ?`}
        description="La valeur disparaît des deux pages et de la base. Cette action est définitive — cette collection n'a pas d'archive. Pour la retirer du site en gardant son texte, utilisez « Masquer »."
        confirmLabel="Supprimer la valeur"
        onConfirm={async () => {
          const resultat = await supprimerValeurAction({ id: valeur.id });

          if (!resultat.ok) {
            toast.error(resultat.message, { duration: 10000 });
            return;
          }

          toast.success("La valeur a été supprimée.");
          router.push("/dashboard/valeurs");
        }}
      />
    </div>
  );
}
