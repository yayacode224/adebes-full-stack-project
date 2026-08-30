import type { ContentStatus } from "./content-status";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  UNE QUESTION FRÉQUENTE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Reprise du type `FaqItem` de `src/content/faq.ts`, avec les différences
 * imposées par le passage en base :
 *
 *   1. `bullets` n'est plus FACULTATIF (`bullets?: string[]`) mais un tableau
 *      toujours présent, éventuellement vide. La colonne est
 *      `text[] not null default '{}'` (migration 0005), et l'absence se dit
 *      par la longueur — comme `Article.body` au Lot 8B (écart nº 74). Deux
 *      façons d'exprimer « pas de puces » (`undefined` et `[]`) auraient
 *      obligé chaque composant à traiter deux cas pour un seul état.
 *   2. `position` apparaît : le tableau TypeScript avait un ordre implicite,
 *      la base le rend explicite et modifiable depuis le dashboard.
 *   3. `status` apparaît. `faq_items` porte bien un cycle éditorial complet
 *      (migration 0005, RLS 0009, `guard_publish` 0010) : le gabarit est
 *      celui des Lots 8A–8D, pas celui du Lot 8E.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  CE CONTENU N'EST PAS SEULEMENT AFFICHÉ : IL EST DÉCLARÉ AUX MOTEURS
 * ---------------------------------------------------------------------------
 * Chacune des trois pages qui rendent une FAQ émet un JSON-LD `FAQPage`
 * (`faqJsonLd`, `src/components/seo/json-ld.tsx`). C'est ce qui distingue
 * cette collection des cinq précédentes : une question publiée ne se contente
 * pas d'apparaître dans un accordéon, elle affirme à Google que l'association
 * répond ceci à cette question-là.
 *
 * Deux conséquences, toutes deux traitées ici plutôt que dans les pages :
 *
 *   * `texteReponse()` compose la réponse ENTIÈRE — le paragraphe **et** les
 *     puces. C'est la règle des données structurées de Google : le balisage
 *     doit contenir ce que le visiteur lit. Voir le commentaire de la
 *     fonction ;
 *   * `selectionAccueil()` dit exactement ce que l'accueil affiche, une seule
 *     fois, plutôt que de laisser la règle se recopier entre la page publique
 *     et l'écran du dashboard qui doit l'expliquer.
 */

/**
 * Les trois sujets, dans l'ordre de la contrainte SQL.
 *
 * ⚠️  Cette liste double une contrainte réelle de la base :
 * `check (topic in ('don', 'benevolat', 'general'))` (migration 0005). C'est
 * la différence avec `ICON_NAMES` (écart nº 101), dont la colonne est un
 * `text` libre : ici, une valeur hors liste est refusée par PostgreSQL, et la
 * recette le mesure plutôt que de le supposer.
 *
 * Elle vit malgré tout dans le domaine, et pour la même raison qu'au Lot 8E :
 * c'est ce qui permet à `z.enum(FAQ_TOPICS)` d'exister. Sans elle, le schéma
 * validerait par `z.string()` et le refus n'arriverait qu'au niveau SQL, sous
 * la forme d'un message PostgreSQL en anglais.
 */
export const FAQ_TOPICS = ["don", "benevolat", "general"] as const;

export type FaqTopic = (typeof FAQ_TOPICS)[number];

export function isFaqTopic(valeur: unknown): valeur is FaqTopic {
  return (
    typeof valeur === "string" && (FAQ_TOPICS as readonly string[]).includes(valeur)
  );
}

/**
 * Libellés du dashboard — filtres, colonne « Sujet », formulaire.
 *
 * Courts : ils servent d'options de filtre et de valeurs de colonne, où une
 * phrase serait tronquée. Ce que chaque sujet IMPLIQUE est dit par
 * `FAQ_TOPIC_DESTINATIONS` ci-dessous.
 */
export const FAQ_TOPIC_LABELS: Record<FaqTopic, string> = {
  don: "Dons",
  benevolat: "Bénévolat",
  general: "Général",
};

/**
 * Où une question publiée apparaît, selon son sujet.
 *
 * ⚠️  Le sujet n'est pas une étiquette de classement : c'est **le seul champ
 * qui décide de la page où la question s'affiche**. Le changer déplace la
 * question d'une page à une autre, ce qu'aucun autre champ de ce lot ne fait
 * et ce qu'aucune collection précédente n'avait.
 *
 * Les phrases sont écrites au présent de ce qui EST affiché, sans URL : les
 * adresses appartiennent à la présentation, pas au domaine.
 *
 * `don` mentionne deux pages parce que c'est la réalité de l'accueil, qui
 * affiche les premières questions de tous les sujets **sauf** le bénévolat —
 * voir `selectionAccueil()`.
 */
export const FAQ_TOPIC_DESTINATIONS: Record<FaqTopic, string> = {
  don: "la page « Faire un don », et l'accueil si elle est parmi les premières",
  benevolat: "la page « Devenir bénévole »",
  general: "l'accueil, si elle est parmi les premières",
};

export type FaqItem = {
  id: string;
  /** La question, telle qu'elle est posée par un visiteur. */
  question: string;
  /** La réponse en texte simple. Un paragraphe, jamais du HTML. */
  answer: string;
  /**
   * Les puces qui complètent la réponse. Vide, aucune liste n'est rendue.
   *
   * ⚠️  Elles font partie de la réponse, pas de sa décoration : les quatre
   * canaux de don sont ici, pas dans `answer`. Voir `texteReponse()`.
   */
  bullets: string[];
  topic: FaqTopic;
  position: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
};

/** Champs saisis à la création. Le reste est calculé ou par défaut. */
export type CreateFaqItem = Omit<
  FaqItem,
  "id" | "createdAt" | "updatedAt" | "position" | "status"
> & {
  position?: number;
  status?: ContentStatus;
};

/** Modification partielle. `id` identifie la cible, il n'est jamais modifiable. */
export type UpdateFaqItem = Partial<Omit<FaqItem, "id" | "createdAt" | "updatedAt">>;

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LA RÉPONSE ENTIÈRE, POUR LE JSON-LD
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Ce que `<FAQAccordion>` affiche, c'est le paragraphe SUIVI des puces. Ce que
 * `faqJsonLd` déclarait jusqu'ici, c'est le paragraphe SEUL.
 *
 * L'écart n'est pas théorique et il se voit sur la première question du site :
 * « Comment faire un don à ADEBES ? » répond « Plusieurs canaux sont
 * possibles… » puis énumère les quatre canaux en puces. Le balisage envoyé aux
 * moteurs annonçait donc une réponse qui **ne contient aucun des quatre
 * canaux** — une réponse tronquée présentée comme complète.
 *
 * Les consignes de Google sur `FAQPage` sont explicites : le contenu balisé
 * doit être celui que le visiteur voit sur la page. Composer les deux est donc
 * une correction, pas un enrichissement.
 *
 * ⚠️  Et c'est ce lot qui rend la question urgente : jusqu'ici les puces
 * étaient figées dans un fichier TypeScript relu à chaque commit. Elles
 * deviennent saisissables depuis le dashboard, où rien n'empêchera — ni ne
 * devrait empêcher — de mettre l'essentiel de la réponse en puces. Le
 * balisage doit suivre le contenu, pas l'inverse.
 *
 * La forme retenue est la plus littérale possible : le paragraphe, puis une
 * puce par ligne. Pas de HTML — `acceptedAnswer.text` accepte du texte simple,
 * et y injecter du balisage exposerait le contenu de la base dans un champ
 * qu'aucun composant React n'échappe.
 */
export function texteReponse(item: Pick<FaqItem, "answer" | "bullets">): string {
  const puces = item.bullets
    .map((puce) => puce.trim())
    .filter((puce) => puce.length > 0);

  if (puces.length === 0) return item.answer.trim();

  return [item.answer.trim(), ...puces.map((puce) => `• ${puce}`)].join("\n");
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  CE QUE L'ACCUEIL AFFICHE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Règle reprise à l'identique de `src/app/(site)/page.tsx` avant ce lot :
 *
 * ```ts
 * const faqAccueil = faq.filter((item) => item.topic !== "benevolat").slice(0, 4);
 * ```
 *
 * Elle est descendue ici pour une raison précise : **le dashboard doit pouvoir
 * la dire**. Une question `general` en dixième position est publiée, valide, et
 * n'apparaît nulle part — l'accueil ne montre que les quatre premières et
 * `general` n'a pas de page à lui. C'est l'équivalent, pour cette collection,
 * du témoignage publié hors des trois premiers (Lot 8C, écart nº 86) : un état
 * légitime, invisible, et qu'il faut SIGNALER plutôt que laisser découvrir.
 *
 * Recopier la règle dans l'écran de liste l'aurait fait diverger le jour où la
 * page d'accueil change de coupe. Ici, les deux lisent la même fonction.
 *
 * ⚠️  L'exclusion porte sur le bénévolat et non sur une liste de sujets
 * « autorisés » : ajouter un quatrième sujet un jour le ferait apparaître sur
 * l'accueil par défaut, ce qui est le comportement attendu d'une FAQ générale.
 * La contrainte SQL rend d'ailleurs l'ajout impossible sans migration.
 */
export const FAQ_ACCUEIL_MAX = 4;

/** Ce sujet peut-il apparaître sur l'accueil ? */
export function estAffichableSurAccueil(topic: FaqTopic): boolean {
  return topic !== "benevolat";
}

/**
 * Les questions que l'accueil affiche, dans l'ordre.
 *
 * Reçoit les questions PUBLIÉES, déjà triées par position — c'est le contrat
 * de `findPublished`. Cette fonction ne trie pas : elle sélectionne. Trier ici
 * masquerait un dépôt qui renverrait un ordre faux.
 */
export function selectionAccueil(
  publiees: FaqItem[],
  max = FAQ_ACCUEIL_MAX,
): FaqItem[] {
  return publiees
    .filter((item) => estAffichableSurAccueil(item.topic))
    .slice(0, max);
}
