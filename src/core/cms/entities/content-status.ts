/**
 * Le cycle éditorial (décision D8).
 *
 *   draft ──► in_review ──► published ──► archived
 *     ▲            │             │            │
 *     └────────────┴─────────────┴────────────┘   (retour possible en brouillon)
 *
 * Aligné sur l'énuméré PostgreSQL `public.content_status` (migration 0001).
 */

export const CONTENT_STATUSES = [
  "draft",
  "in_review",
  "published",
  "archived",
] as const;

export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export function isContentStatus(valeur: unknown): valeur is ContentStatus {
  return (
    typeof valeur === "string" &&
    (CONTENT_STATUSES as readonly string[]).includes(valeur)
  );
}

/**
 * Libellés du `<StatusBadge>` (Lot 6).
 *
 * ⚠️  Le badge affiche COULEUR **et** LIBELLÉ, jamais la couleur seule : une
 * information portée par la seule couleur est invisible pour une personne
 * daltonienne et pour un lecteur d'écran. Contrainte d'accessibilité du
 * projet, pas une préférence esthétique.
 */
export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  draft: "Brouillon",
  in_review: "À relire",
  published: "En ligne",
  archived: "Archivé",
};

/**
 * Transitions autorisées, et la permission qu'elles exigent.
 *
 * `null` = l'action de mise à jour ordinaire suffit (`<resource>:update`),
 * ce qui permet à un éditeur de soumettre son texte à relecture. Toutes les
 * autres transitions demandent `<resource>:publish`, réservé aux
 * administrateurs — et doublé en base par le trigger `guard_publish` (ADB01).
 */
export const STATUS_TRANSITIONS: Record<
  ContentStatus,
  { to: ContentStatus; requiresPublish: boolean }[]
> = {
  draft: [
    { to: "in_review", requiresPublish: false },
    { to: "published", requiresPublish: true },
    { to: "archived", requiresPublish: true },
  ],
  in_review: [
    { to: "draft", requiresPublish: false },
    { to: "published", requiresPublish: true },
    { to: "archived", requiresPublish: true },
  ],
  published: [
    { to: "draft", requiresPublish: true },
    { to: "archived", requiresPublish: true },
  ],
  archived: [
    { to: "draft", requiresPublish: true },
    { to: "published", requiresPublish: true },
  ],
};

export function canTransition(from: ContentStatus, to: ContentStatus): boolean {
  return STATUS_TRANSITIONS[from].some((t) => t.to === to);
}

/** La transition exige-t-elle la permission `publish` ? */
export function transitionRequiresPublish(
  from: ContentStatus,
  to: ContentStatus,
): boolean {
  return STATUS_TRANSITIONS[from].find((t) => t.to === to)?.requiresPublish ?? true;
}
