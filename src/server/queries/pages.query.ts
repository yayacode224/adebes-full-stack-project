import "server-only";

import { cache } from "react";

import type { PageWithSections } from "@/core/cms/entities/page";
import type { PageReadPort } from "@/core/cms/ports/page.port";
import { getPagePubliee } from "@/core/use-cases/pages/get-page";
import { createPublicClient } from "@/infrastructure/supabase/clients/public";
import { SupabasePageRepository } from "@/infrastructure/supabase/repositories/page.repository";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LECTURES PUBLIQUES DES PAGES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §11 du Rapport 1. C'est la seule porte par laquelle le site public lit une
 * page composée : aucune page de `src/app/(site)/` n'appelle un dépôt.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  ÉCART SIGNALÉ — CE FICHIER N'EST PAS ENCORE `'use cache'`
 * ---------------------------------------------------------------------------
 * Même situation qu'aux Lots 8A à 8I, pour la même raison : `'use cache'` est
 * une fonctionnalité de Cache Components, et le §0.4 du Rapport 2 écrit noir
 * sur blanc que `cacheComponents: true` n'est pas activé avant le Lot 15.
 *
 * **CE QUE LE LOT 15 AURA À FAIRE ICI** : `'use cache'` en première ligne de la
 * fonction, `cacheTag(...etiquettesDePage(slug))` et `cacheLife('days')`. Les
 * étiquettes sont déjà posées, et `pages.actions.ts` les invalide déjà.
 */

/** L'étiquette de la collection entière — la liste du dashboard. */
export const ETIQUETTE_PAGES = "cms:pages";

/**
 * Les étiquettes touchées par une écriture sur une page.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  DEUX ÉTIQUETTES, ET LA SECONDE EST CELLE QUI COMPTE
 * ---------------------------------------------------------------------------
 * `cms:pages` couvre la liste du dashboard. `cms:page:<slug>` couvre la page
 * PUBLIQUE — c'est la convention que les neuf lots de la série 8 emploient déjà
 * (`cms:page:accueil`, `cms:page:a-propos`), et c'est ce qui fait qu'un
 * changement de contenu se voit sur le site.
 *
 * ⚠️  Un slug VIDE ne produit pas `cms:page:` — une étiquette tronquée
 * n'invalide rien et ressemble pourtant à une invalidation. Le cas est
 * atteignable : la suppression d'une page dont la lecture préalable a échoué.
 *
 * ⚠️  CE QUE CETTE FONCTION NE PEUT PAS SAVOIR, et qui doit être surveillé au
 * Lot 15 : une section peut lire une COLLECTION (programmes, actualités…). Un
 * changement dans cette collection doit invalider les pages qui la portent —
 * c'est aujourd'hui l'affaire des actions de la collection, qui nomment leurs
 * pages en dur. Le jour où un bloc « Grille de programmes » est ajouté à une
 * page que `programmes.actions.ts` ne connaît pas, l'invalidation manquera.
 * Le Lot 15 devra dériver ces étiquettes de `page_sections`, pas d'une liste
 * écrite à la main.
 */
export function etiquettesDePage(slug: string): string[] {
  return slug ? [ETIQUETTE_PAGES, `cms:page:${slug}`] : [ETIQUETTE_PAGES];
}

function portPublic(): PageReadPort {
  return new SupabasePageRepository(createPublicClient());
}

/**
 * La page publiée servie à cette adresse, sections visibles comprises.
 *
 * `cache()` de React mémoïse sur la durée d'UN rendu — ce n'est PAS un cache
 * entre requêtes, il ne remplace pas `'use cache'`. Il évite en revanche la
 * double lecture d'une page qui compose à la fois ses métadonnées
 * (`generateMetadata`) et son corps.
 *
 * ---------------------------------------------------------------------------
 * REND `null` PLUTÔT QUE DE LEVER, ET C'EST L'INVERSE DES NEUF COLLECTIONS
 * ---------------------------------------------------------------------------
 * Les lectures de collection lèvent en cas d'échec, parce qu'une liste vide et
 * une panne produiraient le même écran. Ici, l'appelant est une page qui doit
 * répondre 404 lorsque l'adresse n'existe pas : `null` est une réponse
 * ATTENDUE, pas un échec.
 *
 * La distinction est portée par le dépôt, qui lève toujours sur une erreur
 * réelle (`mapPostgrestError`). `null` ne signifie donc que « aucune page
 * publiée à cette adresse ».
 */
export const getPagePublique = cache(
  async (route: string): Promise<PageWithSections | null> => {
    const resultat = await getPagePubliee(portPublic(), route);
    if (resultat.ok) return resultat.value;

    // `NOT_FOUND` est la réponse normale d'une adresse inconnue ou d'un
    // brouillon. Toute autre erreur est une panne et doit remonter.
    if (resultat.error.code === "NOT_FOUND") return null;
    throw resultat.error;
  },
);
