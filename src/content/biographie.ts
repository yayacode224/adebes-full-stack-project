import { Globe, HeartPulse, type LucideIcon } from "lucide-react";

import type { MediaTone } from "@/components/media/media-placeholder";
import type { IconName } from "@/core/cms/entities/icon-name";

/**
 * Biographie de M. Tana TEBOH Taduis.
 *
 * Comme partout ailleurs sur ce site, **rien n'est inventé** : les éléments
 * ci-dessous reprennent strictement les informations fournies. Aucune date,
 * aucun mandat, aucun chiffre n'a été ajouté par déduction — ce qui manque est
 * signalé par `informationsAFournir`, affiché en clair sur la page plutôt que
 * comblé par une formule creuse.
 *
 * Les deux visuels référencent leur chemin définitif : tant que le fichier
 * n'est pas déposé, un emplacement s'affiche à sa place (voir `lib/media.ts`).
 */

export const biographie = {
  /** Nom tel qu'il doit apparaître partout : titre, métadonnées, données structurées. */
  name: "M. Tana TEBOH Taduis",
  /** Sans la civilité — pour les tournures où « M. » alourdit la phrase. */
  shortName: "Tana TEBOH Taduis",
  /** Qualité principale, reprise en `jobTitle` schema.org. */
  role: "Homme politique et opérateur économique",
  country: "Cameroun",

  /** Résumé d'une phrase, réutilisé en sous-titre de hero et en meta description. */
  resume:
    "Homme politique, opérateur économique camerounais investi dans l’agriculture, le bâtiment ainsi que les travaux publics",

  /** Corps de la présentation. Un paragraphe = une idée. */
  presentation: [
    // "M. Tana TEBOH Taduis est un homme politique camerounais. Opérateur économique, il investit dans l'agriculture ainsi que dans le bâtiment et les travaux publics deux secteurs qui font vivre des familles et façonnent durablement les territoires.",
    "En parallèle de ses activités économiques, il prend en charge des personnes malades par les soins traditionnels: le traitement à l'indigène, une pratique de proximité ancrée dans les savoirs locaux.",
    "Engagement public, investissement productif et action de terrain se rejoignent dans une même finalité : contribuer au développement du Cameroun.",
  ],

  /** Chemins définitifs des visuels, selon la convention de nommage du projet. */
  media: {
    cover: "/images/hero/hero-biographie.png",
    coverAlt: "M. Tana TEBOH Taduis lors d'une rencontre de terrain",
    /**
     * Cadrage du visuel de hero, propre à cette page.
     *
     * `hero-biographie.png` est un portrait en pied (1086 × 1448, ratio 3:4)
     * alors que le hero est une bande large et basse. `object-cover` recadre
     * donc sur une fine tranche horizontale : centrée par défaut, elle tombait
     * sur le torse et coupait la tête, sur mobile comme sur desktop.
     *
     * Le sujet occupe la verticale 6 % → 19 % de l'image : on ancre la tranche
     * à 6 % du haut, ce qui garde le visage entier avec un peu d'air au-dessus,
     * du plus petit mobile aux écrans 1920. Le header étant transparent en haut
     * des pages à hero, rien ne vient masquer le visage.
     *
     * Passé au `PageHero` via `imageClassName` : le réglage reste local à la
     * biographie et les autres pages, qui n'envoient pas cette prop, conservent
     * leur cadrage centré.
     */
    coverPosition: "object-[50%_6%]",
    portrait: "/images/biographie/portrait.png",
    portraitAlt: "Portrait de M. Tana TEBOH Taduis",
  },

  /**
   * Ce qui reste à fournir pour compléter la fiche. Affiché tel quel sur la
   * page : un parcours amputé de ses dates se repère bien mieux quand le
   * manque est écrit que lorsqu'il est masqué.
   */
  informationsAFournir: [
    "Parcours détaillé : formation, dates et étapes clés",
    "Fonctions et mandats politiques exercés, avec leurs dates",
    "Lien avec ADEBES : fonction exercée ou nature du soutien apporté",
  ],
} as const;

/**
 * Un domaine d'activité, rendu par `<ValueCard>`.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `icon` EST UN NOM DEPUIS LE LOT 8E, PAS UN COMPOSANT
 * ---------------------------------------------------------------------------
 * `<ValueCard>` sert deux collections sans rapport : les valeurs de
 * l'association, désormais en base (`core_values`), et les quatre domaines
 * ci-dessous, qui restent dans ce fichier — ils décrivent le parcours d'une
 * personne, pas du contenu éditorial, et ne figurent dans aucun lot du CMS.
 *
 * La carte ayant basculé sur la convention du projet — un NOM d'icône résolu
 * au rendu par `<ContentIcon>` —, ces quatre entrées la suivent. Le rendu est
 * identique : ce sont les mêmes icônes, désignées autrement.
 *
 * ⚠️  `engagementsBiographie`, plus bas, garde des COMPOSANTS. Ce n'est pas un
 * oubli : cette liste-là ne passe pas par `<ValueCard>`, elle est rendue par un
 * JSX écrit à la main dans `/biographie`. La convertir aurait été un
 * changement sans nécessité dans un lot qui ne la concerne pas.
 */
export type DomaineEngagement = {
  title: string;
  description: string;
  icon: IconName;
  tone: MediaTone;
};

/** Les quatre domaines d'activité, tels qu'énoncés. */
export const domainesEngagement: DomaineEngagement[] = [
  {
    title: "Engagement politique",
    description:
      "Homme politique, engagé dans la vie publique et le débat citoyen au Cameroun.",
    icon: "Landmark",
    tone: "navy",
  },
  {
    title: "Agriculture",
    description:
      "Investisseur dans le secteur agricole, moteur de production et d'emploi local.",
    icon: "Sprout",
    tone: "green",
  },
  {
    title: "Bâtiment et travaux publics",
    description:
      "Investisseur dans le bâtiment et les travaux publics, au service des infrastructures.",
    icon: "HardHat",
    tone: "blue",
  },
  {
    title: "Opérateur économique",
    description:
      "Acteur du tissu économique camerounais, à travers plusieurs secteurs d'activité.",
    icon: "Briefcase",
    tone: "orange",
  },
];

/** Les deux engagements qui dépassent le cadre strictement économique. */
export const engagementsBiographie = [
  {
    title: "Soins aux personnes malades",
    description:
      "Il prend en charge des personnes malades par les soins traditionnels: le traitement à l'indigène, selon les savoirs et la pharmacopée locale.",
    icon: HeartPulse,
  },
  {
    title: "Contribution au développement du pays",
    description:
      "Ses activités économiques comme son action de terrain concourent au développement du Cameroun.",
    icon: Globe,
  },
] satisfies { title: string; description: string; icon: LucideIcon }[];
