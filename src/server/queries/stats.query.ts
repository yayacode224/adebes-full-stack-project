import "server-only";

import { cache } from "react";

import type { Stat } from "@/core/cms/entities/stat";
import type { StatReadPort } from "@/core/cms/ports/stat.port";
import { listVisibleStats } from "@/core/use-cases/stats/list-stats";
import { createPublicClient } from "@/infrastructure/supabase/clients/public";
import { SupabaseStatRepository } from "@/infrastructure/supabase/repositories/stat.repository";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LECTURES PUBLIQUES DES CHIFFRES CLÉS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §11 du Rapport 1. C'est la seule porte par laquelle le site public lit les
 * chiffres : aucune page de `src/app/(site)/` n'appelle un dépôt.
 *
 * ---------------------------------------------------------------------------
 * DEUX PAGES APPELLENT CETTE FONCTION — comme au Lot 8E
 * ---------------------------------------------------------------------------
 * L'accueil et `/impact` rendent la même liste, dans le même ordre. Elles n'en
 * font pas le même usage :
 *
 *   * l'accueil rend les cartes SEULES, en grille de 2 puis 4 colonnes ;
 *   * `/impact` rend chaque carte SUIVIE DE SA PRÉCISION (`note`), sous le
 *     titre « Nos chiffres » et le sous-titre qui annonce « chaque valeur est
 *     accompagnée de sa source ».
 *
 * C'est la même donnée, lue une fois par page. `stats.actions.ts` invalide donc
 * TROIS étiquettes, dont `cms:page:impact` qui est NOUVELLE.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  ÉCART SIGNALÉ — CE FICHIER N'EST PAS ENCORE `'use cache'`
 * ---------------------------------------------------------------------------
 * Même situation qu'aux Lots 8A à 8F, pour la même raison : `'use cache'` est
 * une fonctionnalité de Cache Components, et le §0.4 du Rapport 2 écrit noir
 * sur blanc que `cacheComponents: true` n'est pas activé avant le Lot 15. La
 * lecture est donc dynamique en attendant ; les deux pages portent
 * `export const dynamic = "force-dynamic"` — l'accueil depuis le Lot 8A,
 * `/impact` depuis CE lot, qui est le premier à y lire la base.
 *
 * **CE QUE LE LOT 15 AURA À FAIRE ICI** : `'use cache'` en première ligne de la
 * fonction, `cacheTag(ETIQUETTE_CHIFFRES)` et `cacheLife('days')`. L'étiquette
 * est déjà posée, et `stats.actions.ts` l'invalide déjà.
 *
 * ---------------------------------------------------------------------------
 * CE QUE CETTE LECTURE RENVOIE AUJOURD'HUI : LES QUATRE CHIFFRES DU SEED
 * ---------------------------------------------------------------------------
 * Les quatre lignes portent `is_visible = true` et un contenu repris mot pour
 * mot de `src/content/stats.ts`. **`beneficiaires` porte `value = NULL`**, et
 * elle est renvoyée comme les autres : la carte affiche « — » et sa mention,
 * exactement comme aujourd'hui.
 *
 * ⚠️  DEUX CHIFFRES ÉTAIENT CALCULÉS À CHAQUE BUILD et sont désormais STOCKÉS —
 * le seed du Lot 1 l'écrit déjà, ce lot le rend visible et corrigeable :
 *
 *   * `programmes` valait `programmes.length`, figé à 8 ;
 *   * `annees` valait « année courante − 2020 », figé à 6 (2026) — il ne
 *     s'incrémentera plus au 1ᵉʳ janvier.
 *
 * Ce n'est pas une régression introduite ici : c'est le prix, connu, de rendre
 * un contenu modifiable. Le dashboard le signale plutôt que de le taire —
 * `annees` porte `to_confirm = true` et l'écran compte les chiffres à
 * revalider.
 */

/** Étiquette de la collection entière. */
export const ETIQUETTE_CHIFFRES = "cms:chiffres";

function portPublic(): StatReadPort {
  return new SupabaseStatRepository(createPublicClient());
}

/**
 * Les chiffres affichés, dans l'ordre choisi au dashboard.
 *
 * `cache()` de React mémoïse sur la durée d'UN rendu — ce n'est PAS un cache
 * entre requêtes, il ne remplace pas `'use cache'`.
 *
 * ---------------------------------------------------------------------------
 * UNE LECTURE EN ÉCHEC NE VIDE PAS LA SECTION : ELLE LÈVE
 * ---------------------------------------------------------------------------
 * Même règle qu'aux cinq lots précédents. Renvoyer `[]` en cas de panne ferait
 * disparaître la section en silence — exactement le rendu d'une collection
 * entièrement masquée, qui est un état légitime. Les deux situations
 * produiraient le même écran et personne ne saurait laquelle s'est produite.
 *
 * ⚠️  Elle vaut doublement ici : sur une page qui s'appelle « Impact &
 * transparence », une section de chiffres qui disparaît sans rien dire est
 * précisément ce que la page promet de ne pas faire.
 */
export const getChiffresAffiches = cache(async (): Promise<Stat[]> => {
  const resultat = await listVisibleStats(portPublic());
  if (!resultat.ok) throw resultat.error;
  return resultat.value;
});
