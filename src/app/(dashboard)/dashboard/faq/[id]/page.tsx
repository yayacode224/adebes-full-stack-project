import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { FaqItemEditeur } from "@/components/dashboard/faq/faq-item-editeur";
import type { FaqItem } from "@/core/cms/entities/faq-item";
import { faqItemIdSchema } from "@/core/cms/schemas/faq-item.schema";
import { can } from "@/core/rbac/policy";
import { getFaqItemById } from "@/core/use-cases/faq-items/get-faq-item";
import { listFaqAccueil } from "@/core/use-cases/faq-items/list-faq-items";
import { requirePermission } from "@/server/dal/session";
import { faqItemReadPort } from "@/server/deps/faq-item.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /dashboard/faq/[id]
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ---------------------------------------------------------------------------
 * L'IDENTIFIANT EST VALIDÉ AVANT D'ÊTRE ENVOYÉ EN BASE
 * ---------------------------------------------------------------------------
 * Il vient de l'URL, donc de n'importe qui. Sans cette vérification,
 * `/dashboard/faq/bonjour` produirait une erreur PostgREST 22P02 (« invalid
 * input syntax for type uuid ») remontée en écran d'erreur technique, là où la
 * réponse juste est une 404 — la même que pour une question réellement
 * supprimée.
 *
 * ---------------------------------------------------------------------------
 * `params` EST UNE PROMESSE (Next.js 16, §15 du Rapport 1)
 * ---------------------------------------------------------------------------
 * `const { id } = await params`. C'est la règle nº 3 des contraintes
 * anti-hallucination, et elle vaut aussi dans `generateMetadata`.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  UNE SECONDE LECTURE, ET ELLE N'EST PAS FACULTATIVE
 * ---------------------------------------------------------------------------
 * La fiche doit savoir si CETTE question figure parmi celles que l'accueil
 * affiche. Ce n'est pas déductible de sa position : les positions numérotent la
 * collection ENTIÈRE, brouillons compris, alors que l'accueil compte les quatre
 * premières PUBLIÉES hors bénévolat. Une question en position 5 peut donc être
 * sur l'accueil, et une en position 3 ne pas y être.
 *
 * La sélection est donc LUE (`listFaqAccueil`, qui applique la fonction du
 * domaine), jamais recalculée à partir d'un nombre. C'est le même raisonnement
 * qu'au Lot 8C pour les trois témoignages de l'accueil (écart nº 86).
 */

/**
 * La lecture, mémoïsée sur la durée d'UN rendu.
 *
 * `generateMetadata` et la page demandent la même question : sans `cache()`,
 * chaque affichage produirait deux requêtes identiques.
 */
const lireQuestion = cache(async (identifiant: string): Promise<FaqItem | null> => {
  const analyse = faqItemIdSchema.safeParse({ id: identifiant });
  if (!analyse.success) return null;

  const resultat = await getFaqItemById(await faqItemReadPort(), analyse.data.id);

  if (resultat.ok) return resultat.value;
  // `NOT_FOUND` est un cas normal : un lien rouvert après une suppression.
  // Toute autre erreur est une panne et doit remonter telle quelle.
  if (resultat.error.code === "NOT_FOUND") return null;
  throw resultat.error;
});

export async function generateMetadata(
  props: PageProps<"/dashboard/faq/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;

  // La garde d'accès protège la DONNÉE, pas seulement l'affichage : sans elle,
  // le titre de l'onglet révélerait le libellé d'une question en brouillon à un
  // compte non autorisé.
  await requirePermission("faq:read");

  const question = await lireQuestion(id);

  if (!question) return { title: "Question introuvable" };

  return { title: question.question };
}

export default async function QuestionPage(
  props: PageProps<"/dashboard/faq/[id]">,
) {
  const { id } = await props.params;
  const actor = await requirePermission("faq:read");

  const question = await lireQuestion(id);
  if (!question) notFound();

  /*
    La sélection de l'accueil, LUE et non déduite.

    Un échec ne justifie pas d'écran d'erreur : la fiche reste parfaitement
    utilisable sans savoir si la question est sur l'accueil, et le lien
    correspondant n'est simplement pas proposé. Ne pas promettre est moins
    grave que promettre à tort (invariant nº 2).
  */
  const accueil = await listFaqAccueil(await faqItemReadPort());
  const surAccueil = accueil.ok
    ? accueil.value.some((affichee) => affichee.id === question.id)
    : false;

  return (
    <FaqItemEditeur
      question={question}
      surAccueil={surAccueil}
      peutModifier={can(actor, "faq:update")}
      peutPublier={can(actor, "faq:publish")}
      peutSupprimer={can(actor, "faq:delete")}
    />
  );
}
