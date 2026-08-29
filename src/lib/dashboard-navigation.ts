import {
  ChartNoAxesColumn,
  CircleHelp,
  FileText,
  FolderOpen,
  HeartHandshake,
  Images,
  Inbox,
  LayoutDashboard,
  LayoutTemplate,
  Menu,
  Newspaper,
  Palette,
  Quote,
  ScrollText,
  Settings,
  Sprout,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { Permission } from "@/core/rbac/permissions";
import { can } from "@/core/rbac/policy";
import type { Actor } from "@/core/rbac/roles";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  NAVIGATION DU DASHBOARD — DÉCLARATIVE, FILTRÉE PAR PERMISSIONS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §5.2 du Rapport 2. Ajouter un écran au dashboard, c'est ajouter UNE ligne
 * dans `DASHBOARD_NAVIGATION` — jamais toucher à la barre latérale.
 *
 * La règle non négociable du lot : **une entrée dont l'utilisateur n'a pas la
 * permission `read` n'est pas rendue.** Ni grisée, ni masquée en CSS. Un
 * éditeur ne doit pas savoir qu'un écran « Utilisateurs » existe.
 *
 * Le filtrage a lieu CÔTÉ SERVEUR (`navigationPourActeur`, appelée dans le
 * layout) : le tableau filtré est ce qui traverse la frontière vers la barre
 * latérale cliente. Filtrer côté client laisserait la liste complète dans la
 * charge utile RSC — invisible à l'œil, lisible dans l'onglet réseau.
 */

/* ═══════════════════════════════════════════════════════════════════════════
 * 1. Registre d'icônes de navigation
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️  CE REGISTRE N'EST PAS `components/ui-ext/icon-registry.ts`.
 *
 * Celui-là traduit une chaîne VENUE DE LA BASE (`programmes.icon`) en
 * composant, et sa liste `ICON_NAMES` alimente la grille de sélection
 * d'icônes du `<SchemaForm>` (Lot 6). Y verser « Réglages », « Journal
 * d'activité » ou « Utilisateurs » les proposerait à un éditeur en train de
 * choisir l'icône d'un programme — deux vocabulaires distincts dans une même
 * liste.
 *
 * Les deux registres restent donc séparés, avec la même contrainte
 * d'implémentation : un import statique par icône, jamais un import dynamique
 * par nom, qui embarquerait tout lucide-react dans le bundle.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI UN NOM ET NON LE COMPOSANT DIRECTEMENT
 * ---------------------------------------------------------------------------
 * Le layout est un Server Component et la barre latérale un Client Component.
 * Une fonction React ne franchit pas cette frontière : passer `icon:
 * LayoutDashboard` en prop lèverait une erreur de sérialisation. Le nom est
 * une chaîne, il passe ; la barre latérale le résout avec `getDashboardIcon`.
 */
export const DASHBOARD_ICONS = {
  LayoutDashboard,
  LayoutTemplate,
  HeartHandshake,
  Newspaper,
  Images,
  Users,
  Quote,
  CircleHelp,
  ChartNoAxesColumn,
  Sprout,
  FileText,
  FolderOpen,
  Inbox,
  Menu,
  Palette,
  Settings,
  UserCog,
  ScrollText,
} as const;

export type DashboardIconName = keyof typeof DASHBOARD_ICONS;

/**
 * Le registre est indexé DIRECTEMENT par l'appelant
 * (`DASHBOARD_ICONS[entree.icon]`), sans fonction d'accès.
 *
 * Ce n'est pas un raccourci. La règle `react-hooks/static-components` du
 * compilateur React signale toute valeur de composant RENVOYÉE PAR UN APPEL
 * DE FONCTION pendant le rendu — elle ne peut pas distinguer une consultation
 * de table d'une fabrique de composant, et une fabrique remonterait l'état à
 * chaque rendu. Un accès par propriété ne pose pas ce problème et passe le
 * lint sans désactivation locale.
 *
 * Pas de repli non plus, contrairement au registre de contenu : ces noms sont
 * écrits dans ce fichier, pas saisis en base. Un nom invalide est une erreur
 * de compilation, jamais une donnée à rattraper à l'exécution.
 *
 * Le type est réexporté pour les appelants qui déclarent une prop d'icône.
 */
export type DashboardIcon = LucideIcon;

/* ═══════════════════════════════════════════════════════════════════════════
 * 2. Groupes
 * ═══════════════════════════════════════════════════════════════════════════ */

export const DASHBOARD_NAV_GROUPS = [
  "contenu",
  "apparence",
  "administration",
] as const;

export type DashboardNavGroup = (typeof DASHBOARD_NAV_GROUPS)[number];

/** Intitulés des sections de la barre latérale. */
export const DASHBOARD_NAV_GROUP_LABELS: Record<DashboardNavGroup, string> = {
  contenu: "Contenu",
  apparence: "Apparence",
  administration: "Administration",
};

/* ═══════════════════════════════════════════════════════════════════════════
 * 3. Les entrées
 * ═══════════════════════════════════════════════════════════════════════════ */

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: DashboardIconName;
  /**
   * Permission `read` exigée pour que l'entrée soit rendue.
   *
   * ---------------------------------------------------------------------
   * ÉCART ASSUMÉ PAR RAPPORT AU §5.2 DU RAPPORT 2
   * ---------------------------------------------------------------------
   * Le rapport type ce champ `Permission` (non nullable). Aucune permission
   * de la matrice ne correspond pourtant à « voir l'accueil du dashboard » :
   * la liste `RESOURCES` ne décrit que des ressources de contenu. Faire
   * porter à l'accueil une permission empruntée — `page:read`, par exemple —
   * serait un mensonge de plus dans la matrice de droits, et le §9 du
   * Rapport 1 en fait le document de référence de l'audit.
   *
   * `null` signifie donc « visible par tout compte actif », et n'est employé
   * QUE par l'entrée « Tableau de bord ». Toute autre entrée porte une vraie
   * permission ; le jour où quelqu'un écrit `permission: null` ailleurs, il
   * doit s'en expliquer ici.
   */
  permission: Permission | null;
  group: DashboardNavGroup;
  /** Titre court affiché dans la barre supérieure sous 768 px. */
  shortLabel?: string;
};

/**
 * ---------------------------------------------------------------------------
 * ÉCART SIGNALÉ PAR RAPPORT AU §5.2 DU RAPPORT 2 : l'entrée « Valeurs »
 * ---------------------------------------------------------------------------
 * Le tableau du §5.2 ne la mentionne pas, exactement comme la liste
 * `RESOURCES` du §9 omettait la ressource `value` (écart nº 5, déjà consigné
 * dans `core/rbac/permissions.ts`). Les deux oublis vont ensemble : sans
 * entrée de navigation, l'écran `/dashboard/valeurs` du Lot 8E serait livré
 * inatteignable autrement qu'en tapant son URL.
 *
 * Elle est placée avec `stat` — même nature, mêmes droits : une petite liste
 * structurante qu'un éditeur corrige mais n'étend pas.
 * ---------------------------------------------------------------------------
 *
 * L'ordre du tableau est celui de l'affichage. Les groupes se suivent :
 * l'ordre des entrées à l'intérieur d'un groupe est celui d'usage
 * (le contenu quotidien d'abord, la configuration ensuite), pas l'alphabet.
 */
export const DASHBOARD_NAVIGATION: readonly DashboardNavItem[] = [
  // ----- Contenu -----------------------------------------------------------
  {
    label: "Tableau de bord",
    shortLabel: "Accueil",
    href: "/dashboard",
    icon: "LayoutDashboard",
    permission: null,
    group: "contenu",
  },
  {
    label: "Pages",
    href: "/dashboard/pages",
    icon: "LayoutTemplate",
    permission: "page:read",
    group: "contenu",
  },
  {
    label: "Programmes",
    href: "/dashboard/programmes",
    icon: "HeartHandshake",
    permission: "programme:read",
    group: "contenu",
  },
  {
    label: "Actualités",
    href: "/dashboard/actualites",
    icon: "Newspaper",
    permission: "article:read",
    group: "contenu",
  },
  {
    label: "Galerie",
    href: "/dashboard/galerie",
    icon: "Images",
    permission: "gallery:read",
    group: "contenu",
  },
  {
    label: "Équipe",
    href: "/dashboard/equipe",
    icon: "Users",
    permission: "team:read",
    group: "contenu",
  },
  {
    label: "Témoignages",
    href: "/dashboard/temoignages",
    icon: "Quote",
    permission: "testimonial:read",
    group: "contenu",
  },
  {
    label: "Questions fréquentes",
    shortLabel: "Questions",
    href: "/dashboard/faq",
    icon: "CircleHelp",
    permission: "faq:read",
    group: "contenu",
  },
  {
    label: "Chiffres clés",
    href: "/dashboard/chiffres",
    icon: "ChartNoAxesColumn",
    permission: "stat:read",
    group: "contenu",
  },
  {
    label: "Valeurs",
    href: "/dashboard/valeurs",
    icon: "Sprout",
    permission: "value:read",
    group: "contenu",
  },
  {
    label: "Documents",
    href: "/dashboard/documents",
    icon: "FileText",
    permission: "document:read",
    group: "contenu",
  },
  {
    label: "Médiathèque",
    href: "/dashboard/mediatheque",
    icon: "FolderOpen",
    permission: "media:read",
    group: "contenu",
  },
  {
    label: "Messages",
    href: "/dashboard/messages",
    icon: "Inbox",
    permission: "submission:read",
    group: "contenu",
  },

  // ----- Apparence ---------------------------------------------------------
  //
  // Les deux vivent sous `/dashboard/reglages/` (§5 du Rapport 1) tout en
  // apparaissant dans leur propre groupe : l'URL suit le modèle de données,
  // la navigation suit la tâche de l'utilisateur.
  {
    label: "Navigation",
    href: "/dashboard/reglages/navigation",
    icon: "Menu",
    permission: "navigation:read",
    group: "apparence",
  },
  {
    label: "Thème",
    href: "/dashboard/reglages/theme",
    icon: "Palette",
    permission: "theme:read",
    group: "apparence",
  },

  // ----- Administration ----------------------------------------------------
  {
    label: "Réglages",
    href: "/dashboard/reglages",
    icon: "Settings",
    permission: "settings:read",
    group: "administration",
  },
  {
    label: "Utilisateurs",
    href: "/dashboard/utilisateurs",
    icon: "UserCog",
    permission: "user:read",
    group: "administration",
  },
  {
    label: "Journal d'activité",
    shortLabel: "Journal",
    href: "/dashboard/journal",
    icon: "ScrollText",
    permission: "audit:read",
    group: "administration",
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
 * 4. Filtrage et résolution
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Les entrées visibles par cet acteur.
 *
 * À appeler CÔTÉ SERVEUR. `can()` est la seule autorité (décision D6) : ce
 * fichier ne compare jamais un rôle.
 */
export function navigationPourActeur(
  actor: Actor | null | undefined,
): DashboardNavItem[] {
  return DASHBOARD_NAVIGATION.filter(
    (entree) => entree.permission === null || can(actor, entree.permission),
  );
}

/** Les entrées d'un groupe, dans l'ordre de déclaration. */
export function entreesDuGroupe(
  entrees: readonly DashboardNavItem[],
  groupe: DashboardNavGroup,
): DashboardNavItem[] {
  return entrees.filter((entree) => entree.group === groupe);
}

/**
 * Une entrée couvre-t-elle ce chemin ?
 *
 * `/dashboard` est traité en correspondance EXACTE : sans cette exception, il
 * serait préfixe de toutes les autres routes et resterait éternellement actif.
 * C'est la même règle que `isActivePath` applique à `/` sur le site public.
 */
function couvre(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * L'entrée active — la PLUS PROFONDE qui couvre le chemin.
 *
 * Sur `/dashboard/reglages/navigation`, « Réglages » et « Navigation »
 * couvrent toutes deux le chemin. Sans ce choix, les deux s'allumeraient et
 * l'utilisateur ne saurait plus où il est.
 */
export function entreeActive(
  pathname: string,
  entrees: readonly DashboardNavItem[],
): DashboardNavItem | null {
  let active: DashboardNavItem | null = null;

  for (const entree of entrees) {
    if (!couvre(pathname, entree.href)) continue;
    if (!active || entree.href.length > active.href.length) active = entree;
  }

  return active;
}

export type FilArianeEtape = { label: string; href: string };

/**
 * Le fil d'Ariane, construit à partir des entrées visibles.
 *
 * Il n'est jamais fabriqué depuis les segments d'URL : `/dashboard/programmes/
 * 8f3c-…` produirait une étape « 8f3c-… ». Seules les entrées de navigation
 * réellement déclarées deviennent des étapes ; un segment plus profond (un
 * identifiant, un onglet) n'en produit aucune.
 *
 * Conséquence assumée au Lot 5 : sur un écran de détail, la dernière étape est
 * la collection (« Programmes »), pas l'élément. Les écrans métier des Lots 8
 * et suivants, qui seuls connaissent le titre de l'élément, l'ajouteront par
 * leur `<PageHeader>`.
 */
export function filAriane(
  pathname: string,
  entrees: readonly DashboardNavItem[],
): FilArianeEtape[] {
  const etapes: FilArianeEtape[] = [
    { label: "Tableau de bord", href: "/dashboard" },
  ];

  const couvrantes = entrees
    .filter(
      (entree) => entree.href !== "/dashboard" && couvre(pathname, entree.href),
    )
    // Du plus court au plus long : « Réglages » avant « Navigation ».
    .sort((a, b) => a.href.length - b.href.length);

  for (const entree of couvrantes) {
    etapes.push({ label: entree.label, href: entree.href });
  }

  return etapes;
}
