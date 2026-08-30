"use client";

import { ArrowUpFromLine, Trash2, Undo2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ContentStatus } from "@/core/cms/entities/content-status";
import {
  FAQ_ACCUEIL_MAX,
  FAQ_TOPIC_LABELS,
  type FaqItem,
  type FaqTopic,
} from "@/core/cms/entities/faq-item";
import {
  changerStatutQuestionAction,
  supprimerQuestionAction,
} from "@/server/actions/faq.actions";

import { StatusBadge } from "../feedback/status-badge";
import { PageHeader } from "../layout/page-header";
import { ConfirmDialog } from "../modals/confirm-dialog";
import { FaqItemForm } from "./faq-item-form";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  L'ÉCRAN `/dashboard/faq/[id]`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Le formulaire, et autour de lui les décisions qui ne sont pas de la saisie :
 * publier, dépublier, supprimer.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  « VOIR SUR LE SITE » DÉPEND DU SUJET **ET** DE LA POSITION
 * ---------------------------------------------------------------------------
 * C'est le cas le plus fin du Lot 8, et il vaut d'être écrit :
 *
 *   * une question de DONS publiée est toujours sur `/don` — le lien tient ;
 *   * une question de BÉNÉVOLAT publiée est toujours sur `/benevolat` ;
 *   * une question GÉNÉRALE publiée n'a **aucune page à elle**. Elle
 *     n'apparaît que si elle fait partie des quatre premières de l'accueil,
 *     bénévolat exclu. Sinon, elle est en ligne et invisible.
 *
 * Le lien vers l'accueil n'est donc rendu que si la question y figure
 * RÉELLEMENT — lu côté serveur par la page, jamais déduit d'une position
 * (les positions numérotent la collection entière, brouillons compris). C'est
 * l'écart nº 86 du Lot 8C, transposé : un lien qui promet de montrer CETTE
 * question et mène à une page où elle ne figure pas est un lien mort au sens de
 * l'invariant nº 2.
 *
 * Et quand une question générale publiée n'atteint rien, l'écran le DIT. C'est
 * la seule information que ni le badge d'état, ni le sujet, ni le formulaire ne
 * portent — et c'est celle qui explique pourquoi on ne la trouve nulle part.
 *
 * ---------------------------------------------------------------------------
 * PUBLIER N'EST PAS ENREGISTRER
 * ---------------------------------------------------------------------------
 * Deux permissions distinctes (`faq:update`, `faq:publish`), deux cas d'usage
 * distincts, donc deux commandes distinctes à l'écran.
 */

/** L'adresse publique de la page d'un sujet, avec son ancre. */
const ADRESSES_SUJET: Record<FaqTopic, { href: string; libelle: string } | null> =
  {
    don: { href: "/don#faq", libelle: "Faire un don" },
    benevolat: { href: "/benevolat#faq", libelle: "Devenir bénévole" },
    // « Général » n'a pas de page : la question n'atteint que l'accueil, et
    // seulement si elle est parmi les premières. Le lien correspondant est
    // rendu à part, sous condition.
    general: null,
  };

export function FaqItemEditeur({
  question,
  surAccueil,
  peutModifier,
  peutPublier,
  peutSupprimer,
}: {
  question: FaqItem;
  /**
   * Cette question figure-t-elle parmi celles que l'accueil affiche ?
   *
   * Lu côté serveur par la page, à partir de la sélection réelle
   * (`selectionAccueil`) et non d'une comparaison de position : les positions
   * numérotent la collection ENTIÈRE, brouillons compris.
   */
  surAccueil: boolean;
  peutModifier: boolean;
  peutPublier: boolean;
  peutSupprimer: boolean;
}) {
  const router = useRouter();
  const [confirmationOuverte, setConfirmationOuverte] = useState(false);

  const enLigne = question.status === "published";
  const pageDuSujet = ADRESSES_SUJET[question.topic];
  const invisible = enLigne && pageDuSujet === null && !surAccueil;

  async function changerStatut(status: ContentStatus) {
    const resultat = await changerStatutQuestionAction({
      id: question.id,
      status,
    });

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 10000 });
      return;
    }

    toast.success(
      status === "published"
        ? "La question est en ligne."
        : "La question n'est plus visible sur le site.",
    );
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={question.question}
        description={description(enLigne, question.topic, surAccueil)}
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
        <StatusBadge status={question.status} />

        <span className="text-sm text-muted-foreground">
          Sujet : {FAQ_TOPIC_LABELS[question.topic]}
        </span>

        {/*
          ---------------------------------------------------------------------
          LES LIENS « OÙ EST-ELLE ? » VIVENT ICI, PAS DANS L'EN-TÊTE
          ---------------------------------------------------------------------
          Écart nº 112, établi au Lot 8E et repris tel quel : quatre commandes
          dans l'en-tête faisaient déborder l'écran dès 640 px, c'est-à-dire au
          zoom 200 %. Et surtout, ce ne sont pas des commandes : ils ne changent
          rien, ils DISENT où la question apparaît.

          ⚠️  `inline-flex min-h-11` : ce sont des CIBLES TACTILES, et la règle 4
          du §12 ne connaît pas d'exception pour un lien « au sein d'une
          phrase ». Se donner une dispense au moment où elle arrange le code
          qu'on vient d'écrire, c'est cesser de mesurer.
        */}
        {enLigne && (pageDuSujet || surAccueil) ? (
          <p className="flex flex-wrap items-center gap-x-1 text-sm text-muted-foreground">
            Visible sur
            {pageDuSujet ? (
              <Link
                href={pageDuSujet.href}
                className="inline-flex min-h-11 items-center px-1 font-medium text-primary underline underline-offset-2"
              >
                {pageDuSujet.libelle}
              </Link>
            ) : null}
            {pageDuSujet && surAccueil ? "et sur" : null}
            {surAccueil ? (
              <Link
                href="/#faq"
                className="inline-flex min-h-11 items-center px-1 font-medium text-primary underline underline-offset-2"
              >
                l&apos;accueil
              </Link>
            ) : null}
          </p>
        ) : null}

        {invisible ? (
          /*
            Publiée, valide, et nulle part. L'état est légitime — il n'y a rien
            à corriger si la question est une réserve — mais il n'est porté par
            aucun autre élément de l'écran : le badge dit « En ligne », le sujet
            dit « Général », et l'un comme l'autre sont exacts.
          */
          <p className="text-sm text-muted-foreground">
            Cette question est en ligne mais n&apos;apparaît sur aucune page :
            le sujet « Général » n&apos;a pas de page à lui, et l&apos;accueil
            n&apos;affiche que les {FAQ_ACCUEIL_MAX} premières questions de la
            liste. Remontez-la depuis la liste pour la faire apparaître.
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
        <FaqItemForm question={question} />
      ) : (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Vous n&apos;avez pas les droits pour modifier cette question.{" "}
          <Link
            href="/dashboard/faq"
            className="font-medium text-primary underline underline-offset-2"
          >
            Revenir à la liste
          </Link>
        </p>
      )}

      <ConfirmDialog
        open={confirmationOuverte}
        onOpenChange={setConfirmationOuverte}
        title={`Supprimer « ${question.question} » ?`}
        description="La question et sa réponse disparaissent du site et de la base. Cette action est définitive. Pour la retirer du site en gardant son texte, utilisez « Dépublier »."
        confirmLabel="Supprimer la question"
        onConfirm={async () => {
          const resultat = await supprimerQuestionAction({ id: question.id });

          if (!resultat.ok) {
            toast.error(resultat.message, { duration: 10000 });
            return;
          }

          toast.success("La question a été supprimée.");
          router.push("/dashboard/faq");
        }}
      />
    </div>
  );
}

/**
 * La phrase d'état.
 *
 * Trois situations, comme au Lot 8C — et pour une raison de même nature :
 * « publiée » et « visible » ne coïncident pas sur cette collection.
 */
function description(
  enLigne: boolean,
  topic: FaqTopic,
  surAccueil: boolean,
): string {
  if (!enLigne) {
    return "Cette question n'est pas visible sur le site. Publiez-la quand la réponse est prête : elle apparaîtra alors dans l'accordéon de sa page, et dans les données envoyées aux moteurs de recherche.";
  }

  if (topic === "general" && !surAccueil) {
    return "Cette question est en ligne, mais elle n'atteint aucune page : « Général » n'a pas de page dédiée et elle n'est pas parmi les premières de l'accueil.";
  }

  const pages =
    topic === "don"
      ? "la page « Faire un don »"
      : topic === "benevolat"
        ? "la page « Devenir bénévole »"
        : "l'accueil";

  return surAccueil && topic !== "general"
    ? `Cette question est en ligne sur ${pages} et sur l'accueil. Toute modification enregistrée y apparaît, ainsi que dans les données envoyées aux moteurs de recherche.`
    : `Cette question est en ligne sur ${pages}. Toute modification enregistrée y apparaît, ainsi que dans les données envoyées aux moteurs de recherche.`;
}
