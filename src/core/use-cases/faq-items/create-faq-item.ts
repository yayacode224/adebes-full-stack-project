import type { CreateFaqItem, FaqItem } from "../../cms/entities/faq-item";
import type { FaqItemDeps } from "../../cms/ports/faq-item.port";
import { ok, type Result } from "../../shared/result";

/**
 * Crée une question fréquente.
 *
 * Deux règles, et rien d'autre : ce fichier ne sait ni ce qu'est une requête
 * HTTP, ni ce qu'est Supabase. Il se teste avec un dépôt en mémoire.
 *
 * ---------------------------------------------------------------------------
 * LA POSITION EST GLOBALE, PAS PROPRE AU SUJET
 * ---------------------------------------------------------------------------
 * `count()` compte TOUTES les questions, tous sujets confondus, comme le fait
 * le seed du Lot 1 : les sept lignes portent les positions 1 à 7 alors
 * qu'elles se répartissent sur trois sujets.
 *
 * C'est cohérent avec `reorder_rows`, qui renumérote la table entière de 1 à N
 * sans connaître les sujets, et avec l'écran de liste, qui présente une seule
 * liste ordonnable. Une numérotation par sujet aurait produit trois questions
 * en position 1, et un réordonnancement global les aurait aussitôt écrasées.
 *
 * Conséquence assumée, et dite à l'écran : l'ordre est celui de la LISTE
 * ENTIÈRE ; à l'intérieur d'une page publique, seules les positions relatives
 * comptent.
 *
 * ---------------------------------------------------------------------------
 * AUCUN DOUBLON N'EST REFUSÉ
 * ---------------------------------------------------------------------------
 * Ni sur la question, ni sur le couple question + sujet. La base ne porte
 * aucune unicité, et deux questions identiques sur deux sujets différents
 * s'affichent sur deux pages différentes — c'est un cas légitime (« Comment
 * nous contacter ? » a sa place dans les deux FAQ).
 *
 * Deux questions identiques sur le MÊME sujet, en revanche, produiraient deux
 * entrées identiques dans le même JSON-LD `FAQPage`. Ce n'est pas interdit
 * ici — inventer une contrainte que ni la base ni le métier ne portent est la
 * faute que le Lot 8D a explicitement refusé de commettre — mais l'écran de
 * liste le SIGNALE. Informer plutôt qu'interdire, quand l'état est réversible
 * d'un clic.
 */
export async function createFaqItem(
  deps: FaqItemDeps,
  input: CreateFaqItem,
): Promise<Result<FaqItem>> {
  // 1. La nouvelle question se place en fin de liste. `count()` plutôt qu'un
  //    `max(position) + 1` : les positions sont renumérotées de 1 à N à chaque
  //    réordonnancement, les deux valeurs coïncident donc toujours.
  const position = input.position ?? (await deps.read.count()) + 1;

  return ok(
    await deps.write.create({
      ...input,
      position,
      /*
        2. Une question naît TOUJOURS en brouillon.

        `'draft'` en dur, et non `input.status ?? 'draft'` comme aux Lots 8A et
        8B : la valeur reçue est ignorée, quelle qu'elle soit. C'est ce qui
        garantit que toute mise en ligne traverse `setFaqItemStatus` — seul
        endroit où l'on vérifie qu'il y a bien une question ET une réponse
        avant de les déclarer aux moteurs de recherche. Le schéma de création
        ne transporte déjà plus `status`, mais ce cas d'usage est aussi
        appelable depuis un test ou un futur importateur, et la règle ne doit
        pas dépendre de qui appelle.
      */
      status: "draft",
    }),
  );
}
