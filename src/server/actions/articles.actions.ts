"use server";

import type { Article } from "@/core/cms/entities/article";
import {
  articleIdSchema,
  createArticleSchema,
  setArticleStatusSchema,
  updateArticleSchema,
} from "@/core/cms/schemas/article.schema";
import { restoreVersionSchema } from "@/core/cms/schemas/content-version.schema";
import { createArticle } from "@/core/use-cases/articles/create-article";
import { deleteArticle } from "@/core/use-cases/articles/delete-article";
import { setArticleStatus } from "@/core/use-cases/articles/set-article-status";
import { updateArticle } from "@/core/use-cases/articles/update-article";
import { recordVersion } from "@/core/use-cases/versions/record-version";
import { restoreArticleVersion } from "@/core/use-cases/versions/restore-article-version";

import { createAction } from "../action-kit/create-action";
import { articleDeps } from "../deps/article.deps";
import { contentVersionDeps } from "../deps/content-version.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SERVER ACTIONS DES ACTUALITÉS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8B du Rapport 2, transposition du §8A.4. Les quatre passent par
 * `createAction` — aucune exception (décision D3). Une Server Action est une
 * frontière publique : sans le décorateur, `supprimerArticleAction` serait une
 * API de suppression ouverte, joignable par un POST direct.
 *
 * ---------------------------------------------------------------------------
 * ÉTIQUETTES DE CACHE
 * ---------------------------------------------------------------------------
 * Trois familles, et la troisième est celle qu'on oublie :
 *
 *   * `cms:articles` — la collection ;
 *   * `cms:article:<slug>` — la fiche ;
 *   * `cms:page:accueil` — la PAGE où un article apparaît sans être le sujet
 *     principal. L'accueil affiche les trois derniers articles : sans cette
 *     étiquette, il garderait l'ancien titre d'un article renommé.
 *
 * Le renommage d'une adresse invalide DEUX fiches : l'ancienne (qui doit cesser
 * de répondre) et la nouvelle. `invalidates` reçoit le résultat ET l'entrée, ce
 * qui permet de nommer les deux.
 *
 * ---------------------------------------------------------------------------
 * L'AUTEUR VIENT DE LA SESSION, JAMAIS DE LA CHARGE UTILE
 * ---------------------------------------------------------------------------
 * `createArticleSchema` omet `authorId`, et c'est le handler qui le renseigne
 * depuis `actor`. Un champ « auteur » qu'on peut remplir soi-même ne désigne
 * rien — et signer un article du nom d'un collègue est précisément ce que la
 * colonne existe pour empêcher.
 *
 * ⚠️  Ce nom n'est pas encore affiché : la RLS n'ouvre `profiles` qu'aux
 * administrateurs (écart nº 9), les noms arrivent avec l'annuaire du Lot 13.
 * La donnée est néanmoins écrite dès maintenant — la reconstituer après coup
 * serait impossible.
 */

const ETIQUETTE_COLLECTION = "cms:articles";

/**
 * Les pages composées où un article apparaît.
 *
 * Écrites en toutes lettres plutôt que déduites : le jour où un bloc
 * `actualites-grid` est ajouté à une troisième page (Lot 9), l'oubli doit se
 * voir ici, à la relecture, et non se produire silencieusement.
 */
const ETIQUETTES_PAGES = ["cms:page:accueil", "cms:page:actualites"] as const;

/** Toutes les étiquettes touchées par une mutation portant sur ces slugs. */
function etiquettes(...slugs: (string | undefined)[]): string[] {
  const uniques = [...new Set(slugs.filter((slug): slug is string => !!slug))];
  return [
    ETIQUETTE_COLLECTION,
    ...ETIQUETTES_PAGES,
    ...uniques.map((slug) => `cms:article:${slug}`),
  ];
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Création
 * ═══════════════════════════════════════════════════════════════════════════ */

export const creerArticleAction = createAction<typeof createArticleSchema, Article>({
  permission: "article:create",
  input: createArticleSchema,
  audit: {
    action: "article.create",
    entityType: "article",
    entityId: (article) => article.id,
  },
  invalidates: (article) => etiquettes(article.slug),
  handler: async ({ input, actor }) =>
    createArticle(await articleDeps(), {
      ...input,
      // `actor` ne peut pas être nul ici : `permission` n'est pas `null`, donc
      // `createAction` a déjà refusé une requête sans session (étape 2).
      authorId: actor?.id ?? null,
    }),
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Modification
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Modifier un article.
 *
 * `id` est retiré de la charge utile avant d'atteindre le cas d'usage (écart
 * nº 20) : il désigne la cible, il n'en fait pas partie.
 *
 * Le statut n'est pas modifiable ici — c'est `changerStatutArticleAction` qui
 * s'en charge, et le cas d'usage le neutralise de toute façon. Un formulaire
 * qui renverrait l'entité complète ne doit pas publier par effet de bord.
 */
export const mettreAJourArticleAction = createAction<
  typeof updateArticleSchema,
  Article
>({
  permission: "article:update",
  input: updateArticleSchema,
  audit: {
    action: "article.update",
    entityType: "article",
    entityId: (article) => article.id,
  },
  /*
    L'ANCIENNE adresse est invalidée en plus de la nouvelle : après un
    renommage, `/actualites/ancien-slug` doit cesser de répondre depuis le
    cache, sans quoi deux adresses serviraient la même page.
  */
  invalidates: (article, input) => etiquettes(article.slug, input.slug),
  handler: async ({ input }) => {
    const { id, ...champs } = input;
    return updateArticle(await articleDeps(), id, champs);
  },
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Publication
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Changer l'état éditorial (§12.1 du Rapport 2).
 *
 * ---------------------------------------------------------------------------
 * LA PERMISSION DÉPEND DE LA TRANSITION DEMANDÉE
 * ---------------------------------------------------------------------------
 *   * `draft → in_review` — un éditeur soumet son texte à relecture. C'est un
 *     geste de rédaction : `article:update` suffit.
 *   * toute autre cible (`published`, `archived`, retour en `draft`) —
 *     `article:publish`, absent de la liste `editor` (§9 du Rapport 1), et
 *     doublé en base par le trigger `articles_guard_publish` (ADB01).
 *
 * Le résolveur ne voit que la CIBLE, pas l'état de départ : il ouvre donc à
 * l'éditeur la seule cible « À relire », et exige `article:publish` pour tout
 * le reste. Un éditeur qui voudrait retirer sa propre soumission repasse par un
 * administrateur — arbitrage assumé, la précision totale demanderait de lire
 * l'état courant avant la garde de permission.
 *
 * ---------------------------------------------------------------------------
 * PUBLIER = UN INSTANTANÉ DE VERSION (§12.2)
 * ---------------------------------------------------------------------------
 * Après une transition RÉUSSIE vers `published`, le handler enregistre un
 * instantané complet dans `content_versions`, puis purge au-delà de 20. Cet
 * enregistrement ne peut jamais faire échouer la publication : elle est déjà
 * committée. Une panne de l'instantané est journalisée, pas propagée — même
 * discipline que le journal d'audit.
 *
 * Une seule action pour toutes les transitions plutôt qu'une par état : autant
 * d'occasions en moins d'oublier une étiquette de cache.
 */
export const changerStatutArticleAction = createAction<
  typeof setArticleStatusSchema,
  Article
>({
  permission: (entree) =>
    (entree as { status?: string } | null)?.status === "in_review"
      ? "article:update"
      : "article:publish",
  input: setArticleStatusSchema,
  audit: {
    action: "article.status",
    entityType: "article",
    entityId: (article) => article.id,
  },
  invalidates: (article) => etiquettes(article.slug),
  handler: async ({ input, actor }) => {
    const resultat = await setArticleStatus(await articleDeps(), input);

    if (resultat.ok && resultat.value.status === "published") {
      try {
        await recordVersion(await contentVersionDeps(), {
          entityType: "article",
          entityId: resultat.value.id,
          snapshot: resultat.value,
          comment: "Publication",
          createdBy: actor?.id ?? null,
        });
      } catch (erreur) {
        console.error(
          "[ADEBES] Instantané de version impossible après publication d'un article",
          erreur,
        );
      }
    }

    return resultat;
  },
});

/**
 * Restaurer un article dans l'état d'une version antérieure (§12.2).
 *
 * `article:update` — restaurer un contenu, c'est le modifier ; ce n'est ni
 * publier ni dépublier (`restoreArticleVersion` laisse `status` et
 * `publishedAt` intacts). Un éditeur peut donc récupérer un texte qu'il a
 * abîmé, sur un article même publié, sans jamais toucher à sa mise en ligne.
 *
 * La restauration produit elle-même un nouvel instantané : elle est réversible.
 */
export const restaurerVersionArticleAction = createAction<
  typeof restoreVersionSchema,
  Article
>({
  permission: "article:update",
  input: restoreVersionSchema,
  audit: {
    action: "article.restore_version",
    entityType: "article",
    entityId: (article) => article.id,
  },
  invalidates: (article) => etiquettes(article.slug),
  handler: async ({ input, actor }) =>
    restoreArticleVersion(
      {
        versions: await contentVersionDeps(),
        articles: await articleDeps(),
      },
      input.versionId,
      actor?.id ?? null,
    ),
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Suppression
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Supprimer un article.
 *
 * `article:delete` — administrateurs seulement, doublé par la RLS
 * (`articles_admin_delete`).
 *
 * Le slug est lu AVANT la suppression : après, il n'existe plus, et
 * l'étiquette `cms:article:<slug>` resterait dans le cache pour toujours.
 */
export const supprimerArticleAction = createAction<
  typeof articleIdSchema,
  { id: string; slug: string }
>({
  permission: "article:delete",
  input: articleIdSchema,
  audit: {
    action: "article.delete",
    entityType: "article",
    entityId: (resultat) => resultat.id,
  },
  invalidates: (resultat) => etiquettes(resultat.slug),
  handler: async ({ input }) => {
    const deps = await articleDeps();

    const existant = await deps.read.findById(input.id);
    const slug = existant?.slug ?? "";

    const resultat = await deleteArticle(deps, input.id);
    return resultat.ok
      ? { ok: true as const, value: { id: input.id, slug } }
      : resultat;
  },
});
