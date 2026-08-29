/**
 * Matrice des permissions — traduction littérale du §9 du Rapport 1.
 *
 * ⚠️  RÈGLE DE CE FICHIER : les listes sont écrites EN TOUTES LETTRES, sans
 * génération par boucle, sans `RESOURCES.flatMap(...)`, sans raccourci.
 *
 * Ce fichier est long, et c'est le but. Une matrice de droits doit se relire
 * ligne à ligne pour être auditable : « est-ce qu'un éditeur peut supprimer un
 * programme ? » doit se répondre en cherchant `programme:delete` dans la liste
 * `editor`, pas en simulant mentalement une boucle. Le jour où quelqu'un
 * « factorise » ce fichier, plus personne ne saura dire qui peut quoi.
 *
 * C'est aussi ce qui rend vraie la propriété « Ouvert/fermé » du §7 : ajouter
 * un rôle est une ligne ici, et aucun autre fichier modifié.
 *
 * ---------------------------------------------------------------------------
 * ÉCART SIGNALÉ PAR RAPPORT AU §9 DU RAPPORT 1
 * ---------------------------------------------------------------------------
 * La liste `RESOURCES` du rapport omet `value` (les 4 valeurs de
 * l'association, table `core_values`, écran `/dashboard/valeurs` au Lot 8E).
 * Sans cette ressource, ce module n'aurait aucune permission à vérifier et
 * `createAction` ne pourrait pas le protéger. Elle est donc ajoutée ici, avec
 * les mêmes droits que `stat`, dont elle partage exactement la nature : une
 * petite liste structurante, modifiable par un éditeur mais dont l'ajout et la
 * suppression restent réservés.
 */

import type { UserRole } from "./roles";

export const RESOURCES = [
  "page",
  "section",
  "programme",
  "article",
  "gallery",
  "team",
  "testimonial",
  "faq",
  "stat",
  "value",
  "document",
  "media",
  "settings",
  "navigation",
  "theme",
  "user",
  "submission",
  "audit",
] as const;

export const ACTIONS = [
  "read",
  "create",
  "update",
  "delete",
  "publish",
  "reorder",
] as const;

export type Resource = (typeof RESOURCES)[number];
export type Action = (typeof ACTIONS)[number];

export type Permission = `${Resource}:${Action}`;

/**
 * ---------------------------------------------------------------------------
 * SUPER ADMINISTRATEUR — tous les droits, sans exception.
 *
 * Seul rôle habilité à changer le rôle d'un autre compte et à supprimer un
 * compte. La base double cette règle : le dernier super administrateur actif
 * ne peut être ni rétrogradé, ni désactivé, ni supprimé (trigger
 * `guard_last_super_admin`, migration 0010).
 * ---------------------------------------------------------------------------
 */
const SUPER_ADMIN_PERMISSIONS: readonly Permission[] = [
  // Pages et sections
  "page:read", "page:create", "page:update", "page:delete", "page:publish",
  "section:read", "section:create", "section:update", "section:delete", "section:reorder",

  // Collections éditoriales
  "programme:read", "programme:create", "programme:update", "programme:delete", "programme:publish", "programme:reorder",
  "article:read", "article:create", "article:update", "article:delete", "article:publish", "article:reorder",
  "gallery:read", "gallery:create", "gallery:update", "gallery:delete", "gallery:publish", "gallery:reorder",
  "team:read", "team:create", "team:update", "team:delete", "team:publish", "team:reorder",
  "testimonial:read", "testimonial:create", "testimonial:update", "testimonial:delete", "testimonial:publish", "testimonial:reorder",
  "faq:read", "faq:create", "faq:update", "faq:delete", "faq:publish", "faq:reorder",
  "document:read", "document:create", "document:update", "document:delete", "document:publish", "document:reorder",

  // Listes structurantes — pas de statut éditorial, donc pas de `publish`
  "stat:read", "stat:create", "stat:update", "stat:delete", "stat:reorder",
  "value:read", "value:create", "value:update", "value:delete", "value:reorder",

  // Médiathèque
  "media:read", "media:create", "media:update", "media:delete",

  // Configuration
  "settings:read", "settings:update",
  "navigation:read", "navigation:create", "navigation:update", "navigation:delete", "navigation:reorder",
  "theme:read", "theme:update",

  // Comptes
  "user:read", "user:create", "user:update", "user:delete",

  // Boîte de réception et journal
  "submission:read", "submission:update", "submission:delete",
  "audit:read",
];

/**
 * ---------------------------------------------------------------------------
 * ADMINISTRATEUR — tout, SAUF toucher aux rôles et supprimer un compte.
 *
 * Il peut inviter (`user:create`) et consulter l'annuaire (`user:read`), mais
 * ni promouvoir, ni rétrograder, ni supprimer. C'est ce qui empêche un
 * administrateur de s'octroyer les droits qu'il n'a pas — la règle de sûreté
 * « un utilisateur ne peut jamais s'attribuer une permission qu'il ne possède
 * pas déjà » (§9 du Rapport 1).
 *
 * Différence avec la liste ci-dessus : `user:update` et `user:delete` absents.
 * ---------------------------------------------------------------------------
 */
const ADMIN_PERMISSIONS: readonly Permission[] = [
  "page:read", "page:create", "page:update", "page:delete", "page:publish",
  "section:read", "section:create", "section:update", "section:delete", "section:reorder",

  "programme:read", "programme:create", "programme:update", "programme:delete", "programme:publish", "programme:reorder",
  "article:read", "article:create", "article:update", "article:delete", "article:publish", "article:reorder",
  "gallery:read", "gallery:create", "gallery:update", "gallery:delete", "gallery:publish", "gallery:reorder",
  "team:read", "team:create", "team:update", "team:delete", "team:publish", "team:reorder",
  "testimonial:read", "testimonial:create", "testimonial:update", "testimonial:delete", "testimonial:publish", "testimonial:reorder",
  "faq:read", "faq:create", "faq:update", "faq:delete", "faq:publish", "faq:reorder",
  "document:read", "document:create", "document:update", "document:delete", "document:publish", "document:reorder",

  "stat:read", "stat:create", "stat:update", "stat:delete", "stat:reorder",
  "value:read", "value:create", "value:update", "value:delete", "value:reorder",

  "media:read", "media:create", "media:update", "media:delete",

  "settings:read", "settings:update",
  "navigation:read", "navigation:create", "navigation:update", "navigation:delete", "navigation:reorder",
  "theme:read", "theme:update",

  // Invite et consulte, mais ne modifie ni ne supprime aucun compte.
  "user:read", "user:create",

  "submission:read", "submission:update", "submission:delete",
  "audit:read",
];

/**
 * ---------------------------------------------------------------------------
 * ÉDITEUR — rédige et corrige. Ne publie pas, ne supprime pas, ne configure pas.
 *
 * Les quatre absences structurantes, à vérifier d'un coup d'œil :
 *
 *   1. AUCUN `:publish`  — la mise en ligne appartient à un administrateur.
 *      Doublé en base par le trigger `guard_publish` (ADB01).
 *   2. AUCUN `:delete`   — y compris `media:delete` et `submission:delete`.
 *   3. AUCUNE ressource `settings`, `navigation`, `theme`, `audit`, `user` —
 *      ces entrées ne sont même pas rendues dans la barre latérale (Lot 5).
 *   4. `section:create` et `section:delete` absents : un éditeur REMPLIT une
 *      section existante, il ne COMPOSE pas la page. `section:update` et
 *      `section:reorder` lui restent ouverts, ce qui correspond exactement aux
 *      politiques RLS de `page_sections` (migration 0009).
 *
 * `stat:create` et `value:create` sont également absents : ces listes sont
 * structurantes, un éditeur en corrige les valeurs mais n'en ajoute pas
 * d'entrée. Là encore, la RLS dit la même chose.
 * ---------------------------------------------------------------------------
 */
const EDITOR_PERMISSIONS: readonly Permission[] = [
  // Pages : consulte et corrige le contenu, ne crée ni ne supprime de page.
  "page:read", "page:update",
  "section:read", "section:update", "section:reorder",

  // Collections : crée et modifie, sans publier ni supprimer.
  "programme:read", "programme:create", "programme:update", "programme:reorder",
  "article:read", "article:create", "article:update", "article:reorder",
  "gallery:read", "gallery:create", "gallery:update", "gallery:reorder",
  "team:read", "team:create", "team:update", "team:reorder",
  "testimonial:read", "testimonial:create", "testimonial:update", "testimonial:reorder",
  "faq:read", "faq:create", "faq:update", "faq:reorder",
  "document:read", "document:create", "document:update", "document:reorder",

  // Listes structurantes : corrige une valeur, n'ajoute pas d'entrée.
  "stat:read", "stat:update", "stat:reorder",
  "value:read", "value:update", "value:reorder",

  // Médiathèque : téléverse, ne supprime pas.
  "media:read", "media:create",

  // Boîte de réception : lit et traite, ne supprime pas.
  "submission:read", "submission:update",
];

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  super_admin: SUPER_ADMIN_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
  editor: EDITOR_PERMISSIONS,
};
