"use client";

import type { Article } from "@/core/cms/entities/article";
import type { ContentVersion } from "@/core/cms/entities/content-version";
import { restaurerVersionArticleAction } from "@/server/actions/articles.actions";

import { VersionHistory } from "../versions/version-history";

/**
 * Enveloppe cliente de `<VersionHistory>` pour l'article : elle lie l'action de
 * restauration à la signature générique du composant. Les libellés de champs
 * sont ceux du formulaire d'article.
 */
const CHAMPS: { key: keyof Article; label: string }[] = [
  { key: "title", label: "Titre" },
  { key: "slug", label: "Adresse" },
  { key: "excerpt", label: "Chapô" },
  { key: "body", label: "Corps" },
  { key: "categoryId", label: "Catégorie" },
  { key: "coverMediaId", label: "Couverture" },
  { key: "readingMinutes", label: "Temps de lecture" },
  { key: "isPlaceholder", label: "Exemple de mise en page" },
  { key: "publishedAt", label: "Date de parution" },
  { key: "status", label: "État éditorial" },
];

export function ArticleHistorique({
  article,
  versions,
  peutRestaurer,
}: {
  article: Article;
  versions: ContentVersion[];
  peutRestaurer: boolean;
}) {
  return (
    <VersionHistory
      versions={versions}
      courant={article as unknown as Record<string, unknown>}
      champs={CHAMPS.map((c) => ({ key: c.key as string, label: c.label }))}
      entiteNom="l'article"
      cibleTitre={article.title}
      peutRestaurer={peutRestaurer}
      restaurer={(versionId) => restaurerVersionArticleAction({ versionId })}
      noteRestauration="La restauration remet le texte, la catégorie, la couverture et l'adresse. Elle ne modifie ni l'état éditorial (« En ligne », « Brouillon »…), ni la date de parution : ce sont des décisions distinctes."
    />
  );
}
