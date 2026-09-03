import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { AnnualReportEditeur } from "@/components/dashboard/documents/annual-report-editeur";
import type { AnnualReport } from "@/core/cms/entities/annual-report";
import type { MediaAsset } from "@/core/cms/entities/media-asset";
import { annualReportIdSchema } from "@/core/cms/schemas/annual-report.schema";
import { can } from "@/core/rbac/policy";
import { getAnnualReportById } from "@/core/use-cases/annual-reports/get-annual-report";
import { getMediaByIds } from "@/core/use-cases/media/get-media";
import { requirePermission } from "@/server/dal/session";
import { annualReportReadPort } from "@/server/deps/annual-report.deps";
import { mediaReadPort } from "@/server/deps/media.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /dashboard/documents/[id]
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ---------------------------------------------------------------------------
 * L'IDENTIFIANT EST VALIDÉ AVANT D'ÊTRE ENVOYÉ EN BASE
 * ---------------------------------------------------------------------------
 * Il vient de l'URL, donc de n'importe qui. Sans cette vérification,
 * `/dashboard/documents/bonjour` produirait une erreur PostgREST 22P02
 * (« invalid input syntax for type uuid ») remontée en écran d'erreur
 * technique, là où la réponse juste est une 404 — la même que pour un rapport
 * réellement supprimé.
 *
 * ---------------------------------------------------------------------------
 * `params` EST UNE PROMESSE (Next.js 16, §15 du Rapport 1)
 * ---------------------------------------------------------------------------
 * `const { id } = await params`. C'est la règle nº 3 des contraintes
 * anti-hallucination, et elle vaut aussi dans `generateMetadata`.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LE TITRE DE L'ONGLET VIENT DU RAPPORT — pas du média, contrairement au
 *     Lot 8H
 * ---------------------------------------------------------------------------
 * Un élément de galerie ne porte aucun texte : son onglet devait résoudre la
 * photo pour se nommer. Un rapport, lui, a un `title` `not null`. La lecture du
 * PDF n'est donc PAS nécessaire à `generateMetadata`, et elle n'y est pas
 * faite : une requête de moins sur chaque affichage de la fiche.
 */

/**
 * La lecture du rapport, mémoïsée sur la durée d'UN rendu.
 *
 * `generateMetadata` et la page demandent le même rapport : sans `cache()`,
 * chaque affichage produirait deux requêtes identiques.
 */
const lireRapport = cache(
  async (identifiant: string): Promise<AnnualReport | null> => {
    const analyse = annualReportIdSchema.safeParse({ id: identifiant });
    if (!analyse.success) return null;

    const resultat = await getAnnualReportById(
      await annualReportReadPort(),
      analyse.data.id,
    );

    if (resultat.ok) return resultat.value;
    // `NOT_FOUND` est un cas normal : un lien rouvert après une suppression.
    // Toute autre erreur est une panne et doit remonter telle quelle.
    if (resultat.error.code === "NOT_FOUND") return null;
    throw resultat.error;
  },
);

/**
 * Le PDF.
 *
 * Un échec renvoie `null` plutôt que de lever : le rapport reste modifiable
 * sans son fichier, et l'écran DIT que le PDF n'a pas pu être chargé. Faire
 * tomber la page parce qu'un document manque serait une régression — c'est la
 * règle posée par `media.query.ts` au Lot 7, transposée au dashboard.
 *
 * ⚠️  `null` en entrée est le cas COURANT ici, et il ne déclenche aucune
 * requête : les deux rapports existants n'ont pas de PDF.
 */
async function lireDocument(mediaId: string | null): Promise<MediaAsset | null> {
  if (!mediaId) return null;

  const resultat = await getMediaByIds(await mediaReadPort(), [mediaId]);
  if (!resultat.ok) return null;
  return resultat.value[0] ?? null;
}

export async function generateMetadata(
  props: PageProps<"/dashboard/documents/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;

  // La garde d'accès protège la DONNÉE, pas seulement l'affichage : sans elle,
  // le titre de l'onglet révélerait le nom d'un rapport en brouillon à un
  // compte non autorisé.
  await requirePermission("document:read");

  const rapport = await lireRapport(id);
  if (!rapport) return { title: "Rapport introuvable" };

  return { title: rapport.title };
}

export default async function RapportAnnuelPage(
  props: PageProps<"/dashboard/documents/[id]">,
) {
  const { id } = await props.params;
  const actor = await requirePermission("document:read");

  const rapport = await lireRapport(id);
  if (!rapport) notFound();

  const media = await lireDocument(rapport.documentMediaId);

  return (
    <AnnualReportEditeur
      rapport={rapport}
      media={media}
      peutModifier={can(actor, "document:update")}
      peutPublier={can(actor, "document:publish")}
      peutSupprimer={can(actor, "document:delete")}
    />
  );
}
