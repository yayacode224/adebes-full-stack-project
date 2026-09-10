/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  UNE ENTRÉE DU JOURNAL D'ACTIVITÉ (§13.3 du Rapport 2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Le journal est en LECTURE SEULE depuis le dashboard : aucune politique
 * d'`update` ni de `delete` n'est accordée sur `audit_logs` (migration 0009),
 * la purge passant par le cron (rétention 180 jours). Cette entité ne décrit
 * donc qu'une lecture.
 *
 * Le nom de l'auteur n'est PAS porté par l'entrée : le journal ne conserve
 * qu'un `actor_id`. L'écran le résout à part, contre l'annuaire déjà chargé
 * (patron de `getMediaByIds` : une jointure par ligne serait N requêtes). Un
 * `actor_id` à `null` — compte supprimé, `on delete set null` — s'affiche
 * « Compte supprimé » ; l'entrée, elle, demeure.
 */

/** Rétention du journal, en jours. Purge quotidienne par `/api/cron/purge`. */
export const AUDIT_RETENTION_DAYS = 180;

export type AuditEntry = {
  id: string;
  actorId: string | null;
  /** Verbe pointé : `programme.create`, `user.role_changed`, `auth.login_failed`. */
  action: string;
  entityType: string | null;
  entityId: string | null;
  /**
   * Différentiel des champs modifiés — affiché replié dans l'écran.
   *
   * `unknown` et non un type précis : la colonne est du JSONB alimenté par des
   * dizaines d'actions différentes, chacune avec sa forme. L'écran le rend en
   * JSON indenté ; il n'a pas à connaître sa structure.
   */
  diff: unknown;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
};

/**
 * Filtres de l'écran, tels qu'ils arrivent de l'URL (`?auteur=…&type=…`).
 *
 * Tous facultatifs : le journal s'affiche entier par défaut, borné par la
 * limite de lignes du repository. Les périodes sont des instants ISO.
 */
export type AuditFilters = {
  actorId?: string;
  entityType?: string;
  action?: string;
  from?: string;
  to?: string;
};

/**
 * ---------------------------------------------------------------------------
 * LIBELLÉS D'ACTIONS
 * ---------------------------------------------------------------------------
 * Le journal enregistre des verbes techniques (`article.status`). L'écran
 * affiche une phrase lisible. La liste ci-dessous couvre les actions connues ;
 * `libelleAction` retombe sur une reformulation générique pour toute action
 * non listée, plutôt que de masquer une ligne qu'elle ne reconnaît pas.
 *
 * Écrit en toutes lettres, sans génération : comme la matrice de permissions,
 * ce tableau doit se relire ligne à ligne.
 */
export const AUDIT_ACTION_LABELS: Record<string, string> = {
  // Authentification
  "auth.login": "Connexion",
  "auth.logout": "Déconnexion",
  "auth.login_failed": "Échec de connexion",
  "auth.password_reset": "Mot de passe redéfini",

  // Comptes
  "user.invite": "Invitation d'un compte",
  "user.role_changed": "Changement de rôle",
  "user.activation": "Activation / désactivation d'un compte",
  "user.delete": "Suppression d'un compte",

  // Contenu éditorial — création / modification / statut / suppression
  "programme.create": "Création d'un programme",
  "programme.update": "Modification d'un programme",
  "programme.status": "Changement d'état d'un programme",
  "programme.delete": "Suppression d'un programme",
  "programme.reorder": "Réordonnancement des programmes",
  "article.create": "Création d'un article",
  "article.update": "Modification d'un article",
  "article.status": "Changement d'état d'un article",
  "article.delete": "Suppression d'un article",
  "article.restore_version": "Restauration d'une version d'article",
  "article_category.create": "Création d'une catégorie d'actualités",
  "article_category.update": "Renommage d'une catégorie d'actualités",
  "article_category.delete": "Suppression d'une catégorie d'actualités",
  "article_category.reorder": "Réordonnancement des catégories d'actualités",
  "team_member.create": "Création d'une fiche d'équipe",
  "team_member.update": "Modification d'une fiche d'équipe",
  "team_member.status": "Changement d'état d'une fiche d'équipe",
  "team_member.delete": "Suppression d'une fiche d'équipe",
  "team_member.reorder": "Réordonnancement de l'équipe",
  "testimonial.create": "Création d'un témoignage",
  "testimonial.update": "Modification d'un témoignage",
  "testimonial.status": "Changement d'état d'un témoignage",
  "testimonial.delete": "Suppression d'un témoignage",
  "testimonial.reorder": "Réordonnancement des témoignages",
  "faq_item.create": "Création d'une question fréquente",
  "faq_item.update": "Modification d'une question fréquente",
  "faq_item.status": "Changement d'état d'une question fréquente",
  "faq_item.delete": "Suppression d'une question fréquente",
  "faq_item.reorder": "Réordonnancement des questions fréquentes",
  "gallery_item.create": "Ajout à la galerie",
  "gallery_item.update": "Modification d'un élément de galerie",
  "gallery_item.status": "Changement d'état d'un élément de galerie",
  "gallery_item.delete": "Retrait d'un élément de galerie",
  "gallery_item.reorder": "Réordonnancement de la galerie",
  "gallery_category.create": "Création d'une catégorie de galerie",
  "gallery_category.update": "Renommage d'une catégorie de galerie",
  "gallery_category.delete": "Suppression d'une catégorie de galerie",
  "gallery_category.reorder": "Réordonnancement des catégories de galerie",
  "annual_report.create": "Ajout d'un document",
  "annual_report.update": "Modification d'un document",
  "annual_report.status": "Changement d'état d'un document",
  "annual_report.delete": "Suppression d'un document",
  "annual_report.reorder": "Réordonnancement des documents",
  "core_value.update": "Modification d'une valeur",
  "core_value.reorder": "Réordonnancement des valeurs",
  "stat.create": "Ajout d'un chiffre clé",
  "stat.update": "Modification d'un chiffre clé",
  "stat.delete": "Suppression d'un chiffre clé",
  "stat.reorder": "Réordonnancement des chiffres clés",

  // Pages et sections
  "page.create": "Création d'une page",
  "page.update": "Modification d'une page",
  "page.status": "Changement d'état d'une page",
  "page.delete": "Suppression d'une page",
  "page.restore_version": "Restauration d'une version de page",
  "section.create": "Ajout d'une section",
  "section.update": "Modification d'une section",
  "section.delete": "Suppression d'une section",
  "section.reorder": "Réordonnancement des sections",

  // Médiathèque
  "media.create": "Téléversement d'un média",
  "media.update": "Modification d'un média",
  "media.delete": "Suppression d'un média",

  // Configuration
  "settings.update": "Modification des réglages",
  "settings.update_theme": "Modification du thème",
  "navigation_item.create": "Ajout à la navigation",
  "navigation_item.update": "Modification de la navigation",
  "navigation_item.delete": "Retrait de la navigation",
  "navigation_item.reorder": "Réordonnancement de la navigation",

  // Boîte de réception
  "submission.update": "Traitement d'un message reçu",
  "submission.delete": "Suppression d'un message reçu",
};

/**
 * Libellés des types d'entité, pour le filtre « type d'entité » de l'écran.
 *
 * La liste couvre les `entity_type` réellement écrits par le projet
 * (`entityType` des `createAction` + `"auth"` des événements de connexion). Un
 * type absent de la table s'affiche tel quel — comme pour les actions.
 */
export const AUDIT_ENTITY_TYPE_LABELS: Record<string, string> = {
  auth: "Authentification",
  user: "Compte",
  article: "Article",
  article_category: "Catégorie d'actualités",
  programme: "Programme",
  team_member: "Fiche d'équipe",
  testimonial: "Témoignage",
  faq_item: "Question fréquente",
  gallery_item: "Élément de galerie",
  gallery_category: "Catégorie de galerie",
  annual_report: "Document",
  core_value: "Valeur",
  stat: "Chiffre clé",
  page: "Page",
  page_section: "Section de page",
  media: "Média",
  site_settings: "Réglages",
  navigation_item: "Entrée de navigation",
  submission: "Message reçu",
};

/** Le libellé d'un type d'entité, ou le type brut s'il est inconnu. */
export function libelleTypeEntite(type: string): string {
  return AUDIT_ENTITY_TYPE_LABELS[type] ?? type;
}

/** La phrase lisible d'une action, avec repli générique pour l'inconnu. */
export function libelleAction(action: string): string {
  const connu = AUDIT_ACTION_LABELS[action];
  if (connu) return connu;

  // Repli : « objet · verbe » lisible plutôt que le code brut. Un point sépare
  // l'entité du verbe dans toutes nos actions.
  const point = action.indexOf(".");
  if (point === -1) return action;
  const objet = action.slice(0, point).replace(/_/g, " ");
  const verbe = action.slice(point + 1).replace(/_/g, " ");
  return `${objet} — ${verbe}`;
}

/** Un événement d'authentification n'a pas d'entité de contenu à afficher. */
export function estEvenementAuth(action: string): boolean {
  return action.startsWith("auth.");
}
