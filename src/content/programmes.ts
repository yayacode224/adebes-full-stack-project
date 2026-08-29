import {
  Accessibility,
  GraduationCap,
  HandHeart,
  Handshake,
  Leaf,
  Rocket,
  Sprout,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

import type { MediaTone } from "@/components/media/media-placeholder";

/**
 * Les 8 programmes de l'association.
 *
 * Chaque programme a sa propre page (`/programmes/[slug]`) : sur l'ancien site
 * les 8 liens « En savoir plus » pointaient vers `#` (constat #2 de l'audit) et
 * aucun programme n'était partageable ni indexable individuellement.
 *
 * Les résumés reprennent mot pour mot les descriptions fournies par
 * l'association. Les listes « actions » les déclinent en activités — elles
 * décrivent des intentions, jamais des résultats chiffrés : tout chiffre
 * d'impact doit être validé par ADEBES avant publication (voir
 * CONTENU-A-COMPLETER.md).
 */

export type Programme = {
  slug: string;
  title: string;
  /** Titre court pour les fils d'Ariane et les cartes étroites. */
  shortTitle: string;
  summary: string;
  icon: LucideIcon;
  tone: MediaTone;
  /** Ce que nous faisons. */
  actions: string[];
  /** À qui ce programme s'adresse. */
  publics: string[];
  /** Besoins concrets — alimente les CTA don / bénévolat de la page détail. */
  besoins: string[];
  /** Domaine proposé dans le formulaire de bénévolat. */
  benevolatLabel: string;
};

export const programmes: Programme[] = [
  {
    slug: "developpement-communautaire",
    title: "Développement communautaire",
    shortTitle: "Développement communautaire",
    summary:
      "Renforcer les capacités des communautés pour un développement autonome.",
    icon: Handshake,
    tone: "blue",
    actions: [
      "Renforcement des compétences locales par la formation",
      "Accompagnement des initiatives portées par les habitants eux-mêmes",
      "Appui à la structuration d'associations et de groupements de quartier",
      "Mise en relation des communautés avec les ressources disponibles",
    ],
    publics: [
      "Communautés de quartier de Douala et Yaoundé",
      "Villages et localités des régions de l'intérieur",
      "Groupements et associations locales",
    ],
    besoins: [
      "Financer une session de formation pour un groupement",
      "Animer un atelier de renforcement des capacités",
      "Mettre à disposition une expertise en gestion de projet",
    ],
    benevolatLabel: "Développement communautaire",
  },
  {
    slug: "education",
    title: "Éducation",
    shortTitle: "Éducation",
    summary:
      "Soutien scolaire, alphabétisation et bourses pour les enfants et les jeunes défavorisés.",
    icon: GraduationCap,
    tone: "navy",
    actions: [
      "Séances de soutien scolaire pour les élèves en difficulté",
      "Programmes d'alphabétisation pour les jeunes et les adultes",
      "Attribution de bourses aux élèves et étudiants défavorisés",
      "Distribution de fournitures et de manuels scolaires",
    ],
    publics: [
      "Enfants scolarisés en difficulté d'apprentissage",
      "Jeunes déscolarisés ou jamais scolarisés",
      "Adultes en situation d'illettrisme",
    ],
    besoins: [
      "Financer une année de scolarité pour un enfant",
      "Encadrer une séance de soutien scolaire",
      "Fournir des manuels et du matériel pédagogique",
    ],
    benevolatLabel: "Éducation et soutien scolaire",
  },
  {
    slug: "sante",
    title: "Santé",
    shortTitle: "Santé",
    summary:
      "Campagnes médicales et accès aux soins dans les zones rurales.",
    icon: Stethoscope,
    tone: "green",
    actions: [
      "Organisation de campagnes médicales en zone rurale",
      "Consultations et dépistages gratuits",
      "Sensibilisation à la prévention et à l'hygiène",
      "Orientation des patients vers les structures de soins adaptées",
    ],
    publics: [
      "Populations rurales éloignées des centres de santé",
      "Familles sans couverture médicale",
      "Personnes âgées et enfants en bas âge",
    ],
    besoins: [
      "Financer une campagne de dépistage",
      "Participer comme professionnel de santé bénévole",
      "Contribuer en matériel médical et en médicaments",
    ],
    benevolatLabel: "Santé et campagnes médicales",
  },
  {
    slug: "accompagnement-familles",
    title: "Accompagnement des familles",
    shortTitle: "Familles",
    summary:
      "Assistance sociale, aide alimentaire et soutien psychosocial aux familles fragilisées.",
    icon: HandHeart,
    tone: "orange",
    actions: [
      "Accompagnement social des familles en difficulté",
      "Distribution d'aide alimentaire",
      "Écoute et soutien psychosocial",
      "Orientation vers les dispositifs d'aide existants",
    ],
    publics: [
      "Familles en situation de précarité",
      "Parents isolés",
      "Foyers touchés par une rupture ou un deuil",
    ],
    besoins: [
      "Financer un colis alimentaire familial",
      "Assurer des permanences d'écoute",
      "Apporter une compétence en travail social ou en psychologie",
    ],
    benevolatLabel: "Accompagnement des familles",
  },
  {
    slug: "inclusion-sociale",
    title: "Inclusion sociale",
    shortTitle: "Inclusion",
    summary:
      "Intégration des personnes en situation de handicap et des personnes marginalisées.",
    icon: Accessibility,
    tone: "blue",
    actions: [
      "Accompagnement vers l'autonomie des personnes en situation de handicap",
      "Sensibilisation des communautés à la lutte contre les discriminations",
      "Appui à l'accès à l'éducation et à l'emploi",
      "Création d'espaces de rencontre et d'échange",
    ],
    publics: [
      "Personnes en situation de handicap et leurs familles",
      "Personnes marginalisées ou isolées socialement",
      "Communautés d'accueil à sensibiliser",
    ],
    besoins: [
      "Financer un dispositif d'aide à la mobilité",
      "Animer un atelier de sensibilisation",
      "Accompagner une personne dans ses démarches",
    ],
    benevolatLabel: "Inclusion sociale et handicap",
  },
  {
    slug: "protection-environnement",
    title: "Protection de l'environnement",
    shortTitle: "Environnement",
    summary:
      "Sensibilisation écologique, plantation d'arbres et initiatives vertes.",
    icon: Leaf,
    tone: "green",
    actions: [
      "Campagnes de sensibilisation écologique",
      "Opérations de plantation d'arbres",
      "Actions de salubrité et de gestion des déchets",
      "Accompagnement d'initiatives vertes portées par les jeunes",
    ],
    publics: [
      "Écoles et établissements scolaires",
      "Quartiers et communautés urbaines",
      "Groupes de jeunes engagés",
    ],
    besoins: [
      "Financer une opération de plantation",
      "Participer à une journée de salubrité",
      "Apporter du matériel (plants, outils, équipements)",
    ],
    benevolatLabel: "Protection de l'environnement",
  },
  {
    slug: "youth-empowerment",
    title: "Youth Empowerment",
    shortTitle: "Jeunesse",
    summary:
      "Formation professionnelle, leadership et entrepreneuriat des jeunes.",
    icon: Rocket,
    tone: "navy",
    actions: [
      "Ateliers de formation professionnelle",
      "Parcours de développement du leadership",
      "Accompagnement à la création d'activité",
      "Mise en relation avec des mentors et des partenaires",
    ],
    publics: [
      "Jeunes sans qualification professionnelle",
      "Jeunes porteurs d'un projet entrepreneurial",
      "Élèves et étudiants en fin de parcours",
    ],
    besoins: [
      "Financer une place en formation professionnelle",
      "Accompagner un jeune comme mentor",
      "Ouvrir un stage ou une opportunité d'emploi",
    ],
    benevolatLabel: "Jeunesse, formation et entrepreneuriat",
  },
  {
    slug: "women-empowerment",
    title: "Women's Empowerment",
    shortTitle: "Femmes",
    summary:
      "Autonomisation des femmes par la formation, l'artisanat et le soutien économique.",
    icon: Sprout,
    tone: "orange",
    actions: [
      "Formations professionnelles et techniques",
      "Ateliers d'artisanat et valorisation des savoir-faire",
      "Appui économique aux activités génératrices de revenus",
      "Groupes d'entraide et de partage d'expérience",
    ],
    publics: [
      "Femmes en recherche d'autonomie financière",
      "Mères de famille en situation de précarité",
      "Artisanes et petites entrepreneures",
    ],
    besoins: [
      "Financer un kit de démarrage d'activité",
      "Animer une formation ou un atelier",
      "Acheter et faire connaître les productions artisanales",
    ],
    benevolatLabel: "Autonomisation des femmes",
  },
];

/**
 * Chemins des visuels, dérivés du slug — voir la convention de nommage.
 *
 * ⚠️  Les deux fonctions ont DÉMÉNAGÉ au Lot 8A vers
 * `src/lib/programme-visuels.ts`, et ne sont plus que ré-exportées ici.
 *
 * Raison : les pages publiques lisent désormais les programmes en base et
 * n'importent plus ce fichier, mais elles ont toujours besoin du repli vers
 * `/public` tant qu'aucune couverture n'a été choisie dans la médiathèque.
 * Laisser ces fonctions dans un module de CONTENU les aurait fait disparaître
 * avec lui au Lot 15, alors qu'elles relèvent de la résolution de média.
 *
 * Le ré-export garde ce module autoportant : il reste la source du seed, et
 * aucun import existant n'est cassé (même patron que `MediaTone`, écart nº 6).
 */
export {
  coverParDefaut as programmeCover,
  galerieParDefaut as programmeGallery,
} from "@/lib/programme-visuels";

export function getProgramme(slug: string): Programme | undefined {
  return programmes.find((p) => p.slug === slug);
}

export const programmeSlugs = programmes.map((p) => p.slug);
