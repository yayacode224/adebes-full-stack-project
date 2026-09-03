import type {
  AnnualReport,
  CreateAnnualReport,
  UpdateAnnualReport,
} from "@/core/cms/entities/annual-report";

import type { Tables, TablesInsert, TablesUpdate } from "../database.types";

/**
 * Conversion entre la ligne SQL et l'entité de domaine.
 *
 * ⚠️  C'est le SEUL endroit du dépôt où l'on passe de `snake_case` à
 * `camelCase`. Aucun composant, aucun cas d'usage, aucune page ne doit jamais
 * voir `document_media_id` ni `created_at`.
 *
 * ---------------------------------------------------------------------------
 * AUCUN REPLI ICI — même constat qu'au Lot 8H (écart nº 142)
 * ---------------------------------------------------------------------------
 * Les mappers des Lots 8E et 8F en portaient un, parce que leur colonne était
 * un `text` que le générateur de types ne savait pas contraindre
 * (`core_values.icon` libre, `faq_items.topic` sous `check`).
 *
 * `annual_reports.status` est un **énuméré PostgreSQL** (`content_status`,
 * migration 0001), que le générateur SAIT lire : `database.types.ts` le type
 * `Database["public"]["Enums"]["content_status"]`, c'est-à-dire exactement le
 * type du domaine. `year` et `position` sont des `integer`, `title` un `text`
 * `not null`. Il n'y a donc rien à convertir, et un repli ajouté « par
 * prudence » serait du code mort qu'aucune recette ne pourrait exercer.
 */

/** SQL → domaine. */
export function toAnnualReport(row: Tables<"annual_reports">): AnnualReport {
  return {
    id: row.id,
    year: row.year,
    title: row.title,
    documentMediaId: row.document_media_id,
    position: row.position,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Domaine → SQL, à la création. */
export function toAnnualReportInsert(
  input: CreateAnnualReport,
): TablesInsert<"annual_reports"> {
  return {
    year: input.year,
    title: input.title,
    document_media_id: input.documentMediaId ?? null,
    position: input.position ?? 0,
    status: input.status ?? "draft",
  };
}

/**
 * Domaine → SQL, à la mise à jour.
 *
 * ⚠️  Seuls les champs RÉELLEMENT transmis sont inclus.
 *
 * `undefined` signifie « champ non modifié », pas « effacer ». Construire
 * l'objet en une fois écraserait de `null` tous les champs absents de la charge
 * utile — c'est le bug classique du PATCH, et il se traduirait ici par des
 * rapports qui perdent leur PDF parce qu'on a corrigé leur titre.
 *
 * ⚠️  `document_media_id: null` DOIT passer, et c'est le point délicat de ce
 * fichier : c'est la seule façon d'exprimer « ce PDF était le mauvais fichier ».
 * Le test porte donc sur `!== undefined`, jamais sur la véracité de la valeur —
 * un `if (input.documentMediaId)` aurait rendu le retrait impossible, en
 * silence. C'est le jumeau du piège de `category_id` au Lot 8H et de
 * `stat.value` au Lot 8G, où `0` est falsy.
 *
 * ⚠️  Et `year: 0` ne doit pas non plus être avalé. La valeur est refusée bien
 * avant par le schéma (`min(2000)`), mais un `if (input.year)` serait faux pour
 * la même raison : le mapper ne juge pas la valeur, il transmet ce qu'on lui
 * donne.
 */
export function toAnnualReportUpdate(
  input: UpdateAnnualReport,
): TablesUpdate<"annual_reports"> {
  const row: TablesUpdate<"annual_reports"> = {};

  if (input.year !== undefined) row.year = input.year;
  if (input.title !== undefined) row.title = input.title;
  if (input.documentMediaId !== undefined) {
    row.document_media_id = input.documentMediaId;
  }
  if (input.position !== undefined) row.position = input.position;
  if (input.status !== undefined) row.status = input.status;

  return row;
}
