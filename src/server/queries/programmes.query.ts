import "server-only";

import { cache } from "react";

import type { Programme } from "@/core/cms/entities/programme";
import type { ProgrammeReadPort } from "@/core/cms/ports/programme.port";
import {
  listPublishedProgrammes,
} from "@/core/use-cases/programmes/list-programmes";
import {
  getProgrammeBySlug,
  listBenevolatLabels,
} from "@/core/use-cases/programmes/get-programme";
import { createPublicClient } from "@/infrastructure/supabase/clients/public";
import { SupabaseProgrammeRepository } from "@/infrastructure/supabase/repositories/programme.repository";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LECTURES PUBLIQUES DES PROGRAMMES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8A.1 et §11 du Rapport 1. C'est la seule porte par laquelle le site public
 * lit les programmes : aucune page de `src/app/(site)/` n'appelle un dépôt.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  ÉCART SIGNALÉ — CE FICHIER N'EST PAS ENCORE `'use cache'`
 * ---------------------------------------------------------------------------
 * Le §8A.1 le décrit comme une « lecture publique `'use cache'` ». Ce n'est pas
 * réalisable au Lot 8A, et les deux rapports se contredisent sur ce point :
 *
 *   * le §0.4 du Rapport 2 écrit noir sur blanc « `cacheComponents: true`
 *     n'est **pas** activé maintenant — c'est le Lot 15 » ;
 *   * or la directive `'use cache'` est une fonctionnalité de Cache Components.
 *     Vérifié dans `node_modules/next/dist/docs/01-app/03-api-reference/
 *     01-directives/use-cache.md` : « `use cache` is a Cache Components
 *     feature. To enable it, add the `cacheComponents` option ». Sans le
 *     drapeau, la directive ne compile pas.
 *
 * Activer le drapeau ici reviendrait à faire le Lot 15 — qui rend le rendu
 * dynamique par défaut sur les 29 routes et exige une mesure de LCP avant/après
 * (§15.5). Ce lot-ci n'a pas ce périmètre.
 *
 * La lecture est donc DYNAMIQUE en attendant : les pages publiques concernées
 * portent `export const dynamic = "force-dynamic"`. C'est un coût de
 * performance assumé et borné dans le temps, préféré à l'inverse — des pages
 * figées au build, où un programme publié depuis le dashboard n'apparaîtrait
 * qu'au prochain déploiement, ce que la recette du §8A interdit explicitement.
 *
 * **CE QUE LE LOT 15 AURA À FAIRE ICI**, et rien d'autre :
 *
 *   1. `cacheComponents: true` dans `next.config.ts` ;
 *   2. ajouter `'use cache'` en première ligne de chaque fonction exportée,
 *      suivi de `cacheTag(...)` avec les étiquettes déjà nommées ci-dessous et
 *      de `cacheLife('days')` ;
 *   3. retirer les `export const dynamic` des pages de `src/app/(site)/`.
 *
 * Les étiquettes sont posées dès maintenant, et les Server Actions les
 * invalident déjà (`programmes.actions.ts`) : la bascule ne demandera pas de
 * repasser sur les écritures.
 *
 * ---------------------------------------------------------------------------
 * `createPublicClient()`, JAMAIS `createServerClient()`
 * ---------------------------------------------------------------------------
 * Une règle ESLint interdit l'import de `clients/server` dans ce dossier, et
 * elle vaut aussi par ricochet : ce fichier compose son propre dépôt au lieu de
 * passer par `server/deps/programme.deps.ts`, qui importe `clients/server`
 * — donc `next/headers`. Même raisonnement que le refus d'un barrel
 * `clients/index.ts` (écart nº 16) : une garde qu'un import indirect contourne
 * n'est plus une garde.
 *
 * Le client anonyme ne voit que le contenu publié (RLS). Le filtrage par statut
 * est malgré tout répété dans les cas d'usage : deux barrières indépendantes.
 */

/** Étiquette de la collection entière. */
export const ETIQUETTE_PROGRAMMES = "cms:programmes";

/** Étiquette d'une fiche — `cms:programme:education`. */
export function etiquetteProgramme(slug: string): string {
  return `cms:programme:${slug}`;
}

function portPublic(): ProgrammeReadPort {
  return new SupabaseProgrammeRepository(createPublicClient());
}

/**
 * Les programmes publiés, dans l'ordre d'affichage.
 *
 * `cache()` de React mémoïse sur la durée d'UN rendu. C'est ce qui permet à
 * `generateMetadata` et à la page de partager une seule requête (§8A.5), et à
 * l'accueil de ne pas interroger deux fois la base parce que deux sections
 * affichent des programmes.
 *
 * ⚠️  Ce n'est PAS un cache entre requêtes — il ne remplace pas `'use cache'`,
 * il ne fait que dédoublonner à l'intérieur d'un rendu.
 */
export const getProgrammesPublies = cache(async (): Promise<Programme[]> => {
  const resultat = await listPublishedProgrammes(portPublic());

  /*
    Une lecture en échec LÈVE plutôt que de renvoyer une liste vide.

    « Il n'y a aucun programme » et « on n'a pas pu les lire » ne sont pas la
    même information, et les confondre afficherait au visiteur une association
    sans aucune action — c'est l'invariant nº 1 à l'échelle d'une page. Next
    rend alors sa frontière d'erreur, ce qui est le comportement voulu.
  */
  if (!resultat.ok) throw resultat.error;
  return resultat.value;
});

/**
 * Un programme publié, par son adresse. `null` si l'adresse est inconnue.
 *
 * Le dépôt reçoit le client anonyme : un BROUILLON est invisible pour lui, la
 * RLS le filtre. Un slug de brouillon renvoie donc `null`, et la page appelle
 * `notFound()` — exactement le comportement attendu du §8A.5.
 */
export const getProgrammePublie = cache(
  async (slug: string): Promise<Programme | null> => {
    const resultat = await getProgrammeBySlug(portPublic(), slug);

    if (resultat.ok) return resultat.value;
    // `NOT_FOUND` est un cas normal — une adresse tapée à la main, un lien
    // périmé. Toute autre erreur est une panne et doit remonter.
    if (resultat.error.code === "NOT_FOUND") return null;
    throw resultat.error;
  },
);

/** Les adresses publiées — `generateStaticParams`, `sitemap.ts`. */
export async function getSlugsProgrammesPublies(): Promise<string[]> {
  return (await getProgrammesPublies()).map((programme) => programme.slug);
}

/**
 * Les domaines proposés par le formulaire de bénévolat.
 *
 * ⚠️  DÉPENDANCE DU §8A.2. `src/lib/schemas.ts` construisait cette liste depuis
 * `programmes.map(p => p.benevolatLabel)`, en statique. Un schéma Zod partagé
 * client/serveur ne pouvant pas être asynchrone, la liste est désormais lue
 * ici : le composant la reçoit en props depuis un Server Component, et
 * `submitVolunteer` la relit pour vérifier l'appartenance côté serveur.
 */
export const getLibellesBenevolat = cache(async (): Promise<string[]> => {
  const resultat = await listBenevolatLabels(portPublic());
  if (!resultat.ok) throw resultat.error;

  // Dédoublonnage : deux programmes peuvent porter le même libellé de
  // bénévolat sans que ce soit une erreur de saisie — « Santé » couvre deux
  // programmes. Une liste déroulante à doublons, elle, est un défaut.
  return [...new Set(resultat.value)];
});
