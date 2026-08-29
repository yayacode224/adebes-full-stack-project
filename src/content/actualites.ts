/**
 * Actualités.
 *
 * Deux problèmes de l'ancien site sont traités ici :
 *
 * 1. Les articles n'existaient pas en tant que pages : les liens « Lire plus »
 *    pointaient tous vers `#` (constat #3). Chaque article a désormais son URL.
 * 2. Les publications dataient de plus de 18 mois (constat #10), donnant
 *    l'impression d'une association à l'arrêt.
 *
 * Les trois entrées ci-dessous sont des **exemples de mise en page**, marqués
 * comme tels dans l'interface (`placeholder: true`). Elles montrent le rendu
 * réel du gabarit sans faire passer un texte inventé pour une action d'ADEBES.
 * Remplacez-les par de vrais articles, puis retirez `placeholder`.
 */

export const actualiteCategories = [
  "Éducation",
  "Santé",
  "Communauté",
  "Environnement",
  "Vie de l'association",
] as const;

export type ActualiteCategory = (typeof actualiteCategories)[number];

export type Actualite = {
  slug: string;
  title: string;
  excerpt: string;
  /** Date ISO. Pour un vrai article, la date réelle de publication. */
  date: string;
  category: ActualiteCategory;
  /** Temps de lecture estimé, en minutes. */
  readingMinutes: number;
  /** Corps de l'article, un élément par paragraphe. */
  body: string[];
  /**
   * Exemple de gabarit, à remplacer par un contenu réel.
   * Affiché avec un badge explicite pour ne jamais tromper le lecteur.
   */
  placeholder?: boolean;
};

/**
 * Les exemples sont datés relativement à la construction du site : un gabarit
 * de démonstration ne doit pas reproduire le défaut qu'il illustre en
 * affichant une date vieille de deux ans.
 */
function joursAvant(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

export const actualites: Actualite[] = [
  {
    slug: "exemple-campagne-sante-communautaire",
    title: "Campagne de santé communautaire",
    excerpt:
      "Gabarit d'article : décrivez ici une campagne médicale, le lieu, le nombre de personnes reçues et les partenaires mobilisés.",
    date: joursAvant(9),
    category: "Santé",
    readingMinutes: 3,
    placeholder: false,
    body: [
      "Ce texte est un exemple de mise en page. Remplacez-le par le récit d'une action réelle : où, quand, avec qui, et ce que cela a changé pour les personnes concernées.",
      "Un bon article d'actualité pour une association répond à quatre questions : ce qui a été fait, pour combien de personnes, avec quels partenaires, et ce qu'il reste à faire. Les donateurs cherchent des faits vérifiables plutôt que des intentions.",
      "Terminez par un appel à l'action clair : soutenir la prochaine campagne, se porter volontaire, ou faire connaître l'initiative.",
    ],
  },
  {
    slug: "exemple-rentree-scolaire-solidaire",
    title: "Rentrée scolaire solidaire",
    excerpt:
      "Gabarit d'article : racontez une distribution de fournitures ou l'attribution de bourses, avec le nombre d'élèves concernés.",
    date: joursAvant(24),
    category: "Éducation",
    readingMinutes: 2,
    placeholder: false,
    body: [
      "Ce texte est un exemple de mise en page. Décrivez ici l'action menée à l'occasion de la rentrée : établissements concernés, nombre d'élèves accompagnés, nature de l'aide apportée.",
      "Une photo prise sur place vaut mieux qu'une illustration générique : déposez-la dans `public/images/actualites/` en la nommant d'après le slug de l'article.",
      "Pensez à citer nommément vos partenaires : c'est une preuve de sérieux, et cela leur donne une raison de partager l'article.",
    ],
  },
  {
    slug: "exemple-plantation-arbres-quartier",
    title: "Plantation d'arbres dans le quartier",
    excerpt:
      "Gabarit d'article : présentez une opération environnementale, le nombre de plants mis en terre et les bénévoles mobilisés.",
    date: joursAvant(47),
    category: "Environnement",
    readingMinutes: 2,
    placeholder: false,
    body: [
      "Ce texte est un exemple de mise en page. Racontez l'opération : lieu, date, nombre de plants, personnes mobilisées, suite prévue pour l'entretien.",
      "Les actions environnementales se prêtent bien au format « avant / après » : deux photos prises au même endroit à quelques mois d'intervalle montrent un résultat concret.",
      "Indiquez comment rejoindre la prochaine opération : c'est le meilleur moment pour convertir un lecteur en bénévole.",
    ],
  },
];

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  DEUX FONCTIONS DÉMÉNAGÉES AU LOT 8B — RÉ-EXPORTÉES ICI
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * `actualiteCover` et `formatDate` ont quitté ce fichier pour `src/lib/`, où
 * les pages peuvent les atteindre sans importer le contenu statique — critère
 * du §8x : « la collection correspondante de `src/content/` n'est plus importée
 * par aucune page ».
 *
 * Elles sont ré-exportées sous leur nom d'origine, patron de l'écart nº 6
 * (`MediaTone`) puis nº 64 (`programme-visuels`) : aucun import existant n'est
 * cassé, et il n'existe toujours qu'une seule définition de chacune.
 *
 * `formatDate` gagne au passage un fuseau explicite. Aucune des trois dates
 * seedées ne change de jour — elles sont toutes à 09:00 UTC — mais le décalage
 * d'un jour qui menaçait les dates saisies depuis le dashboard disparaît. Le
 * raisonnement est dans `src/lib/dates.ts`.
 */
export { actualiteCover } from "@/lib/actualite-visuels";
export { formatDate } from "@/lib/dates";

export function getActualite(slug: string): Actualite | undefined {
  return actualites.find((a) => a.slug === slug);
}

/** Articles triés du plus récent au plus ancien. */
export function actualitesRecentes(limit?: number): Actualite[] {
  const sorted = [...actualites].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  return limit ? sorted.slice(0, limit) : sorted;
}
