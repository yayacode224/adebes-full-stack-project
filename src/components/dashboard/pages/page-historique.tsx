"use client";

import type { ContentVersion } from "@/core/cms/entities/content-version";
import type { Page } from "@/core/cms/entities/page";
import { restaurerVersionPageAction } from "@/server/actions/pages.actions";

import { VersionHistory } from "../versions/version-history";

/**
 * Enveloppe cliente de `<VersionHistory>` pour la page.
 *
 * ⚠️  La comparaison porte sur les RÉGLAGES de la page. L'instantané embarque
 * aussi les sections, et la restauration remet leur contenu, mais l'afficher
 * champ par champ ici demanderait de comparer dix-sept formes de bloc — c'est
 * le versionnage section par section, un lot de suivi. La note sous la liste le
 * dit.
 */
const CHAMPS: { key: keyof Page; label: string }[] = [
  { key: "title", label: "Titre" },
  { key: "metaTitle", label: "Titre de référencement" },
  { key: "metaDescription", label: "Description de référencement" },
  { key: "ogMediaId", label: "Image de partage" },
  { key: "status", label: "État éditorial" },
  { key: "publishedAt", label: "Date de publication" },
];

export function PageHistorique({
  page,
  sectionsCount,
  versions,
  peutRestaurer,
}: {
  page: Page;
  sectionsCount: number;
  versions: ContentVersion[];
  peutRestaurer: boolean;
}) {
  return (
    <VersionHistory
      versions={versions}
      courant={page as unknown as Record<string, unknown>}
      champs={CHAMPS.map((c) => ({ key: c.key as string, label: c.label }))}
      entiteNom="la page"
      cibleTitre={page.title}
      peutRestaurer={peutRestaurer}
      restaurer={(versionId) => restaurerVersionPageAction({ versionId })}
      noteRestauration={`La comparaison ci-dessus porte sur les réglages de la page. La restauration remet aussi le contenu et la visibilité des ${sectionsCount} section${sectionsCount > 1 ? "s" : ""} encore présentes ; elle ne recrée pas une section supprimée, ne retire pas une section ajoutée depuis, et ne rétablit pas l'ordre.`}
    />
  );
}
