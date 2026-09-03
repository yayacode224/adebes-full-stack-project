import "server-only";

import { cache } from "react";

import type { AnnualReport } from "@/core/cms/entities/annual-report";
import type { AnnualReportReadPort } from "@/core/cms/ports/annual-report.port";
import { listPublishedAnnualReports } from "@/core/use-cases/annual-reports/list-annual-reports";
import { createPublicClient } from "@/infrastructure/supabase/clients/public";
import { SupabaseAnnualReportRepository } from "@/infrastructure/supabase/repositories/annual-report.repository";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LECTURE PUBLIQUE DES RAPPORTS ANNUELS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §11 du Rapport 1. C'est la seule porte par laquelle le site public lit les
 * rapports : aucune page de `src/app/(site)/` n'appelle un dépôt.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  CE QUE CE FICHIER REMPLACE : UNE LECTURE DE DISQUE, ELLE AUSSI
 * ---------------------------------------------------------------------------
 * `src/content/equipe.ts` exposait un tableau `rapports` dont chaque entrée
 * portait un chemin — `/documents/rapport-activite-2025.pdf` — et `/impact`
 * appelait `resolveMedia()` pour savoir si le fichier existait RÉELLEMENT dans
 * `public/documents/`. Ce dossier n'a jamais été créé : les deux lignes
 * s'affichaient donc en permanence avec la pastille « Bientôt disponible ».
 *
 * Le §8I : « le comportement actuel (lien masqué si le PDF est absent) est
 * conservé, la vérification portant désormais sur l'existence du média en
 * base ». Trois choses changent, et elles se tiennent :
 *
 *   1. **Les deux années ne sont plus calculées.** Elles étaient
 *      `new Date().getFullYear() - 1` et `- 2` : le site aurait promis un
 *      « Rapport d'activité 2026 » le 1er janvier prochain, sans que personne
 *      l'ait écrit. Elles sont figées en base depuis le seed du Lot 1, comme
 *      les chiffres de l'écart nº 23.
 *   2. **Déposer un PDF sur le serveur ne suffit plus.** Il faut le téléverser
 *      dans la médiathèque puis le rattacher au rapport. C'est un geste de
 *      plus, et c'est le prix du reste : un document catalogué porte son poids,
 *      son type réel, ses usages, et ne peut plus être supprimé par accident
 *      tant qu'un rapport pointe dessus.
 *   3. **Un rapport peut désormais être retiré du site**, ce qu'un tableau
 *      TypeScript ne permettait qu'en modifiant le code.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  ÉCART SIGNALÉ — CE FICHIER N'EST PAS ENCORE `'use cache'`
 * ---------------------------------------------------------------------------
 * Même situation qu'aux Lots 8A à 8H, pour la même raison : `'use cache'` est
 * une fonctionnalité de Cache Components, et le §0.4 du Rapport 2 écrit noir
 * sur blanc que `cacheComponents: true` n'est pas activé avant le Lot 15.
 *
 * ⚠️  Contrairement au Lot 8H, il n'y a RIEN à ajouter à la page : `/impact`
 * porte déjà `export const dynamic = "force-dynamic"` depuis le Lot 8G
 * (écart nº 131), posé pour les chiffres clés. La directive couvre la page
 * entière, donc aussi cette lecture — c'est la première fois de la série qu'une
 * bascule n'a pas à toucher au mode de rendu de sa page.
 *
 * **CE QUE LE LOT 15 AURA À FAIRE ICI** : `'use cache'` en première ligne,
 * `cacheTag(ETIQUETTE_DOCUMENTS)` et `cacheLife('days')`, puis retirer le
 * `force-dynamic` de `/impact` — en même temps que celui des chiffres, la page
 * n'en ayant qu'un.
 */

/** Étiquette de la collection entière. */
export const ETIQUETTE_DOCUMENTS = "cms:documents";

function port(): AnnualReportReadPort {
  return new SupabaseAnnualReportRepository(createPublicClient());
}

/**
 * Les rapports publiés, dans l'ordre d'affichage.
 *
 * `cache()` de React mémoïse sur la durée d'UN rendu — ce n'est PAS un cache
 * entre requêtes, il ne remplace pas `'use cache'`.
 *
 * ---------------------------------------------------------------------------
 * UNE LECTURE EN ÉCHEC NE VIDE PAS LA SECTION : ELLE LÈVE
 * ---------------------------------------------------------------------------
 * Même règle qu'aux huit lots précédents. Renvoyer `[]` en cas de panne ferait
 * disparaître la section en silence — exactement le rendu d'une association qui
 * n'a encore publié aucun rapport, qui est un état légitime. Les deux
 * situations produiraient le même écran et personne ne saurait laquelle s'est
 * produite. Sur la page qui promet la transparence, c'est la dernière chose à
 * laisser arriver. Next rend alors sa frontière d'erreur, ce qui est le
 * comportement voulu.
 */
export const getRapportsAnnuels = cache(async (): Promise<AnnualReport[]> => {
  const resultat = await listPublishedAnnualReports(port());
  if (!resultat.ok) throw resultat.error;
  return resultat.value;
});
