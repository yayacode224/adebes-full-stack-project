import "server-only";

import { cache } from "react";

import type { CoreValue } from "@/core/cms/entities/core-value";
import type { CoreValueReadPort } from "@/core/cms/ports/core-value.port";
import { listVisibleCoreValues } from "@/core/use-cases/core-values/list-core-values";
import { createPublicClient } from "@/infrastructure/supabase/clients/public";
import { SupabaseCoreValueRepository } from "@/infrastructure/supabase/repositories/core-value.repository";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LECTURES PUBLIQUES DES VALEURS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §11 du Rapport 1. C'est la seule porte par laquelle le site public lit les
 * valeurs : aucune page de `src/app/(site)/` n'appelle un dépôt.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  DEUX PAGES APPELLENT CETTE FONCTION, ET C'EST UNE PREMIÈRE
 * ---------------------------------------------------------------------------
 * L'accueil et « Qui sommes-nous » rendent la même grille. Les quatre
 * collections précédentes n'alimentaient qu'une page de liste chacune.
 *
 * Ce que cela change concrètement :
 *
 *   * `values.actions.ts` invalide TROIS étiquettes, pas deux ;
 *   * `cache()` de React ne mutualise RIEN entre les deux pages — il mémoïse
 *     sur la durée d'UN rendu, et les deux pages sont deux rendus. C'est une
 *     requête chacune, ce qui est correct et sans conséquence sur quatre
 *     lignes ;
 *   * une régression sur cette lecture se voit sur les deux pages les plus
 *     visitées du site en même temps.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  ÉCART SIGNALÉ — CE FICHIER N'EST PAS ENCORE `'use cache'`
 * ---------------------------------------------------------------------------
 * Même situation qu'aux Lots 8A à 8D, pour la même raison : `'use cache'` est
 * une fonctionnalité de Cache Components, et le §0.4 du Rapport 2 écrit noir
 * sur blanc que `cacheComponents: true` n'est pas activé avant le Lot 15. La
 * lecture est donc dynamique en attendant ; les deux pages portent déjà
 * `export const dynamic = "force-dynamic"` depuis les Lots 8A et 8D.
 *
 * **CE QUE LE LOT 15 AURA À FAIRE ICI** : `'use cache'` en première ligne de la
 * fonction, `cacheTag(ETIQUETTE_VALEURS)` et `cacheLife('days')`. L'étiquette
 * est déjà posée, et `values.actions.ts` l'invalide déjà.
 *
 * ---------------------------------------------------------------------------
 * CE QUE CETTE LECTURE RENVOIE AUJOURD'HUI : LES QUATRE VALEURS DU SEED
 * ---------------------------------------------------------------------------
 * Contrairement au Lot 8D, rien ne disparaît de la page publique : les quatre
 * lignes de `core_values` portent `is_visible = true` et un contenu réel, repris
 * mot pour mot de `src/content/valeurs.ts`. Le rendu est donc identique à
 * l'octet près pour les données migrées, ce que la recette vérifie.
 *
 * La section disparaîtrait s'il ne restait aucune valeur visible — même règle
 * que pour les actualités, les témoignages et l'équipe. Ce n'est pas le cas
 * aujourd'hui, et le dashboard le dit si cela le devient.
 */

/** Étiquette de la collection entière. */
export const ETIQUETTE_VALEURS = "cms:valeurs";

function portPublic(): CoreValueReadPort {
  return new SupabaseCoreValueRepository(createPublicClient());
}

/**
 * Les valeurs affichées, dans l'ordre choisi au dashboard.
 *
 * `cache()` de React mémoïse sur la durée d'UN rendu — ce n'est PAS un cache
 * entre requêtes, il ne remplace pas `'use cache'`.
 *
 * ---------------------------------------------------------------------------
 * UNE LECTURE EN ÉCHEC NE VIDE PAS LA SECTION : ELLE LÈVE
 * ---------------------------------------------------------------------------
 * Même règle qu'aux quatre lots précédents. Renvoyer `[]` en cas de panne
 * ferait disparaître la section en silence — exactement le rendu d'une
 * collection entièrement masquée, qui est un état légitime. Les deux
 * situations produiraient le même écran et personne ne saurait laquelle s'est
 * produite. Next rend alors sa frontière d'erreur, ce qui est le comportement
 * voulu.
 */
export const getValeursAffichees = cache(async (): Promise<CoreValue[]> => {
  const resultat = await listVisibleCoreValues(portPublic());
  if (!resultat.ok) throw resultat.error;
  return resultat.value;
});
