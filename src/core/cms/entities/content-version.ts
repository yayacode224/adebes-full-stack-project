/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  UNE VERSION DE CONTENU — l'historique restaurable (§12.2 du Rapport 2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Un CMS sans historique transforme la moindre erreur en perte définitive.
 * Chaque publication produit un instantané complet de l'entité, daté, signé,
 * et restaurable.
 *
 * ---------------------------------------------------------------------------
 * `entityType` / `entityId` SONT GÉNÉRIQUES, ET C'EST VOULU
 * ---------------------------------------------------------------------------
 * La table `content_versions` (migration 0008) ne porte aucune clé étrangère
 * vers les onze collections : une seule table les sert toutes, sans onze
 * colonnes nullables. Le prix est que rien en base ne garantit qu'un
 * `entityId` désigne une ligne existante — c'est au cas d'usage de restauration
 * de le vérifier, et il le fait.
 *
 * ---------------------------------------------------------------------------
 * `snapshot` EST `unknown`
 * ---------------------------------------------------------------------------
 * La colonne est du JSONB. Le typer `Record<string, unknown>` serait une
 * affirmation fausse — une écriture directe peut y mettre `null` ou `42` — et
 * forcerait chaque lecteur à revalider de toute façon. Chaque type d'entité
 * versionnée fournit son propre analyseur (`article` : `articleSchema`).
 *
 * ---------------------------------------------------------------------------
 * LE PÉRIMÈTRE DU LOT 12
 * ---------------------------------------------------------------------------
 * `article` et `page` sont les deux types versionnés livrés en référence. Les
 * six autres collections à cycle éditorial héritent déjà des transitions et de
 * la prévisualisation ; leur écran d'historique est un lot de suivi. La table,
 * elle, est déjà générique : les ajouter ne touchera pas ce fichier.
 */

/** Les types d'entité dont l'historique est câblé au dashboard. */
export const VERSIONED_ENTITY_TYPES = ["article", "page"] as const;

export type VersionedEntityType = (typeof VERSIONED_ENTITY_TYPES)[number];

export function isVersionedEntityType(
  valeur: unknown,
): valeur is VersionedEntityType {
  return (
    typeof valeur === "string" &&
    (VERSIONED_ENTITY_TYPES as readonly string[]).includes(valeur)
  );
}

export type ContentVersion = {
  id: string;
  entityType: string;
  entityId: string;
  /** 1 pour la première publication, incrémenté à chaque instantané suivant. */
  versionNumber: number;
  /** L'entité complète au moment de l'instantané. À analyser avant usage. */
  snapshot: unknown;
  /** Commentaire libre : « Publication », « Restauration de la version 3 ». */
  comment: string | null;
  createdBy: string | null;
  createdAt: string;
};

/**
 * Rétention : 20 versions par entité (§12.2 du Rapport 2).
 *
 * Au-delà, `recordVersion` purge les plus anciennes. Vingt instantanés d'un
 * article, c'est déjà plusieurs mois d'allers-retours éditoriaux ; garder tout
 * ferait grossir la table sans borne pour une valeur qui décroît vite avec
 * l'âge de la version.
 */
export const VERSION_RETENTION = 20;

/**
 * Ce qu'on demande pour créer un instantané. `versionNumber` n'y est pas : il
 * est calculé par le dépôt, qui seul connaît le dernier numéro attribué.
 */
export type CreateContentVersion = {
  entityType: VersionedEntityType;
  entityId: string;
  snapshot: unknown;
  comment: string | null;
  createdBy: string | null;
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  COMPARAISON CHAMP PAR CHAMP
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * L'écran d'historique montre, pour chaque version, ce qui la sépare de l'état
 * courant. La comparaison est faite sur des objets déjà analysés (un `Article`,
 * un `Page`), jamais sur le JSONB brut.
 *
 * ---------------------------------------------------------------------------
 * CE QUI EST IGNORÉ, ET POURQUOI
 * ---------------------------------------------------------------------------
 * `updatedAt` et `createdAt` changent à chaque écriture sans porter
 * d'information éditoriale : les afficher comme « modifiés » à chaque version
 * noierait les vrais changements. `id` est la cible, pas un champ.
 */
const CHAMPS_IGNORES = new Set(["id", "createdAt", "updatedAt"]);

export type FieldChange = {
  field: string;
  /** Rendu lisible de la valeur de la version. */
  before: string;
  /** Rendu lisible de la valeur courante. */
  after: string;
};

/**
 * Les champs qui diffèrent entre `version` (l'instantané) et `actuel` (l'état
 * en base). Tableau vide = la version est identique au contenu courant.
 *
 * `version` est `unknown` : l'appelant vient de le sortir d'un `snapshot`. On
 * ne compare que si les deux sont des objets ; sinon, on considère tout
 * différent en renvoyant une seule ligne « instantané illisible ».
 *
 * `only` restreint la comparaison à une liste de champs — utile pour une page,
 * dont l'instantané embarque un tableau `sections` qu'on ne veut pas diffuser
 * en bloc JSON.
 */
export function diffSnapshot(
  version: unknown,
  actuel: Record<string, unknown>,
  only?: readonly string[],
): FieldChange[] {
  if (typeof version !== "object" || version === null) {
    return [
      { field: "snapshot", before: "instantané illisible", after: "—" },
    ];
  }

  const instantane = version as Record<string, unknown>;
  const cles = only
    ? new Set(only)
    : new Set([...Object.keys(instantane), ...Object.keys(actuel)]);
  const changements: FieldChange[] = [];

  for (const cle of cles) {
    if (CHAMPS_IGNORES.has(cle)) continue;

    const avant = rendreValeur(instantane[cle]);
    const apres = rendreValeur(actuel[cle]);
    if (avant !== apres) {
      changements.push({ field: cle, before: avant, after: apres });
    }
  }

  return changements.sort((a, b) => a.field.localeCompare(b.field));
}

/** Représentation stable d'une valeur pour la comparaison ET l'affichage. */
function rendreValeur(valeur: unknown): string {
  if (valeur === null || valeur === undefined) return "—";
  if (typeof valeur === "string") return valeur;
  if (typeof valeur === "number" || typeof valeur === "boolean") {
    return String(valeur);
  }
  if (Array.isArray(valeur)) {
    if (valeur.length === 0) return "(vide)";
    if (valeur.every((v) => typeof v === "string")) {
      return (valeur as string[]).join("\n\n");
    }
    return JSON.stringify(valeur, null, 2);
  }
  return JSON.stringify(valeur, null, 2);
}
