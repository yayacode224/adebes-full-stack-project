import { z } from "zod";

import { ANNEE_MAX, ANNEE_MIN } from "../entities/annual-report";
import { CONTENT_STATUSES } from "../entities/content-status";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SCHÉMAS DE VALIDATION DES RAPPORTS ANNUELS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Partagés client et serveur, comme aux Lots 8A à 8H : la validation côté
 * client améliore le confort, celle côté serveur est la seule qui protège —
 * une Server Action est joignable par un POST direct, sans passer par le
 * formulaire.
 *
 * ---------------------------------------------------------------------------
 * LES MESSAGES FRANÇAIS SONT ÉCRITS AUX TROIS NIVEAUX — écarts nº 90 et nº 99
 * ---------------------------------------------------------------------------
 *   1. **Type** — `z.string("…")`, `z.number("…")`, `z.uuid("…")`. Sans lui, un
 *      champ ABSENT de la charge utile produit « Invalid input: expected
 *      number, received undefined ».
 *   2. **Forme** — `.min()`, `.max()`, `.int()`. Zod s'arrête au premier
 *      échec : il faut les deux.
 *   3. **Objet** — le `{ message: "…" }` en second argument de chaque
 *      `z.object`. Sans lui, `safeParse(null)` produit « Invalid input:
 *      expected object, received null », en anglais, et aucun champ n'est en
 *      cause.
 *
 * Cinquième lot consécutif à l'appliquer dès la première version (8D à 8I). Le
 * trou reste ouvert dans `programme.schema.ts`, `article.schema.ts` et
 * `testimonial.schema.ts` — Lot 16.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  PAS DE `slugSchema` — UN RAPPORT N'A PAS D'ADRESSE
 * ---------------------------------------------------------------------------
 * Il n'existe aucune page `/rapports/<slug>`, ni dans le site actuel ni dans
 * les 17 lots : un rapport est une LIGNE dans la section « Documents » de
 * `/impact`, avec un lien vers un PDF servi par Storage. Sixième collection du
 * Lot 8 sans adresse publique, après les témoignages, l'équipe, les valeurs, la
 * FAQ et la galerie.
 */

/* ═══════════════════════════════════════════════════════════════════════════
 * Les champs, un par un
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * L'année couverte.
 *
 * ⚠️  Quatre contraintes, et aucune n'est décorative :
 *
 *   * `z.number("…")` — sans le message de type, un champ vidé produit
 *     « Invalid input: expected number, received string » ;
 *   * `.int()` — la colonne est un `integer` ; « 2025,5 » échouerait en base ;
 *   * `.min(ANNEE_MIN)` / `.max(ANNEE_MAX)` — bornes FIXES (voir l'entité) qui
 *     arrêtent la faute de frappe. Sans elles, `20255` part en base et
 *     s'affiche sur la page qui promet la transparence.
 *
 * Le message des bornes NOMME les deux valeurs plutôt que de dire « année
 * invalide » : quelqu'un qui vient de taper quatre chiffres doit savoir ce
 * qu'on attend.
 */
const anneeSchema = z
  .number("Indiquez l'année couverte par le rapport, en quatre chiffres.")
  .int("L'année doit être un nombre entier.")
  .min(ANNEE_MIN, `L'année doit être comprise entre ${ANNEE_MIN} et ${ANNEE_MAX}.`)
  .max(ANNEE_MAX, `L'année doit être comprise entre ${ANNEE_MIN} et ${ANNEE_MAX}.`);

/**
 * Le titre affiché sur la page Impact.
 *
 * `.trim()` avant `.min()` : « &nbsp;&nbsp;&nbsp; » n'est pas un titre, et sans
 * le nettoyage préalable il en ferait un de trois caractères.
 */
const titreSchema = z
  .string("Le titre du rapport est obligatoire.")
  .trim()
  .min(3, "Le titre du rapport est obligatoire (3 caractères minimum).")
  .max(120, "Ce titre est trop long (120 caractères maximum).");

/**
 * Le PDF — ou son absence.
 *
 * ⚠️  `.nullable()`, et c'est LA différence avec le Lot 8H, où le média était
 * obligatoire. `null` est une valeur, pas un manque : un rapport en préparation
 * s'annonce sur le site sans lien de téléchargement, et c'est le comportement
 * que le §8I demande de conserver.
 *
 * Le message ne parle pas d'« identifiant » mais de document : c'est ce que
 * l'utilisateur a sous les yeux, et il n'écrira jamais d'UUID.
 */
const documentSchema = z
  .uuid("Choisissez un document PDF dans la médiathèque.")
  .nullable();

/* ═══════════════════════════════════════════════════════════════════════════
 * L'entité, telle qu'elle est lue
 * ═══════════════════════════════════════════════════════════════════════════ */

export const annualReportSchema = z.object(
  {
    id: z.uuid("Identifiant de rapport invalide."),
    year: anneeSchema,
    title: titreSchema,
    documentMediaId: documentSchema,
    position: z.number("Position invalide.").int().min(0),
    status: z.enum(CONTENT_STATUSES, { message: "Statut inconnu." }),
    createdAt: z.string("Date de création invalide."),
    updatedAt: z.string("Date de modification invalide."),
  },
  { message: "Rapport annuel invalide." },
);

/**
 * Création.
 *
 * ⚠️  `status` EST ABSENT, comme aux Lots 8C, 8D, 8F et 8H.
 *
 * Aux Lots 8A et 8B il restait facultatif : un `status: 'published'` envoyé par
 * un POST direct était arrêté plus loin par le trigger `guard_publish` (ADB01).
 * Cette porte donnerait ici à un ADMINISTRATEUR — qui, lui, passe le trigger —
 * le moyen de mettre un rapport en ligne sans jamais traverser
 * `setAnnualReportStatus`.
 *
 * `position` reste facultatif : elle est calculée, pas décidée.
 *
 * `documentMediaId` porte un `.default(null)` : déclarer le rapport avant
 * d'avoir le PDF est le cas COURANT — c'est même l'état des deux seules lignes
 * existantes.
 */
export const createAnnualReportSchema = annualReportSchema
  .omit({ id: true, createdAt: true, updatedAt: true, status: true })
  .extend({
    position: z.number("Position invalide.").int().min(0).optional(),
    documentMediaId: documentSchema.default(null),
  });

/** Modification partielle : seuls les champs envoyés sont validés. */
export const updateAnnualReportSchema = annualReportSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial()
  .extend({ id: z.uuid("Identifiant de rapport invalide.") });

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LE SCHÉMA DU FORMULAIRE — distinct des deux précédents
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Neuvième collection, même contrainte (écarts nº 50, 58, 71, 86, et ceux des
 * Lots 8E à 8H) : `<SchemaForm>` exige `z.ZodType<T, T>` — type d'ENTRÉE
 * identique au type de SORTIE. `createAnnualReportSchema` porte un `.default()`
 * et un `.optional()`, `updateAnnualReportSchema` est `.partial()` : les deux
 * ont entrée ≠ sortie.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `documentMediaId` RESTE `uuid | null` ICI — pas de sentinelle
 * ---------------------------------------------------------------------------
 * Différence avec le Lot 8H, où `categoryId` devenait une CHAÎNE portant la
 * sentinelle `SANS_CATEGORIE` (écart nº 71). Le détour n'était nécessaire que
 * parce que Radix refuse `<SelectItem value="">` : c'était une contrainte du
 * composant `<Select>`, pas du domaine.
 *
 * Ici le champ est un `media`, et `MediaField` porte NATIVEMENT `null` — c'est
 * la valeur que son bouton « Retirer » écrit. Il n'y a donc rien à contourner,
 * et inventer une sentinelle aurait ajouté une traduction dans les deux sens
 * pour aucun gain.
 */
export const annualReportFormSchema = z.object(
  {
    year: anneeSchema,
    title: titreSchema,
    documentMediaId: documentSchema,
  },
  { message: "Formulaire invalide." },
);

/** Désigne un rapport — suppression, publication, lecture d'une fiche. */
export const annualReportIdSchema = z.object(
  { id: z.uuid("Identifiant de rapport invalide.") },
  { message: "Identifiant de rapport invalide." },
);

/** Changement d'état éditorial — publication, dépublication, archivage. */
export const setAnnualReportStatusSchema = z.object(
  {
    id: z.uuid("Identifiant de rapport invalide."),
    status: z.enum(CONTENT_STATUSES, { message: "Statut inconnu." }),
  },
  { message: "Changement d’état invalide." },
);

/**
 * Réordonnancement.
 *
 * La liste est ENTIÈRE et dans le nouvel ordre — le cas d'usage refuse une
 * liste partielle. Ce schéma ne vérifie que la forme.
 */
export const reorderAnnualReportsSchema = z.object(
  {
    orderedIds: z
      .array(z.uuid("Identifiant de rapport invalide."), {
        message: "La liste des rapports à réordonner est absente.",
      })
      .min(1, "Aucun rapport à réordonner."),
  },
  { message: "Liste de réordonnancement invalide." },
);

export type AnnualReportInput = z.infer<typeof annualReportSchema>;
export type CreateAnnualReportInput = z.infer<typeof createAnnualReportSchema>;
export type UpdateAnnualReportInput = z.infer<typeof updateAnnualReportSchema>;
export type AnnualReportFormInput = z.infer<typeof annualReportFormSchema>;
