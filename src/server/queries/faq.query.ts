import "server-only";

import { cache } from "react";

import type { FaqItem, FaqTopic } from "@/core/cms/entities/faq-item";
import type { FaqItemReadPort } from "@/core/cms/ports/faq-item.port";
import {
  listFaqAccueil,
  listPublishedFaqItems,
} from "@/core/use-cases/faq-items/list-faq-items";
import { createPublicClient } from "@/infrastructure/supabase/clients/public";
import { SupabaseFaqItemRepository } from "@/infrastructure/supabase/repositories/faq-item.repository";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LECTURES PUBLIQUES DES QUESTIONS FRÉQUENTES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §11 du Rapport 1. C'est la seule porte par laquelle le site public lit la
 * FAQ : aucune page de `src/app/(site)/` n'appelle un dépôt.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  TROIS PAGES APPELLENT CE FICHIER — UN RECORD POUR LE PROJET
 * ---------------------------------------------------------------------------
 * L'accueil, « Faire un don » et « Devenir bénévole ». Le Lot 8E en avait deux,
 * les quatre lots précédents une seule chacun.
 *
 * Ce que cela change concrètement :
 *
 *   * `faq.actions.ts` invalide QUATRE étiquettes, dont deux nouvelles
 *     (`cms:page:don`, `cms:page:benevolat`) ;
 *   * `cache()` de React ne mutualise RIEN entre les trois pages — il mémoïse
 *     sur la durée d'UN rendu, et trois pages sont trois rendus. C'est une
 *     requête chacune, ce qui est correct et sans conséquence sur sept lignes ;
 *   * une régression sur cette lecture se voit sur les trois pages de
 *     conversion du site en même temps.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  CE QUE CETTE LECTURE ALIMENTE N'EST PAS SEULEMENT DU RENDU
 * ---------------------------------------------------------------------------
 * Chacune des trois pages émet un JSON-LD `FAQPage` construit à partir de ces
 * mêmes lignes. C'est le premier lot du projet dont la bascule touche des
 * données STRUCTURÉES : une question dépubliée disparaît de l'accordéon **et**
 * du balisage envoyé aux moteurs, et une réponse corrigée les corrige tous
 * les deux.
 *
 * La composition du texte de réponse — paragraphe **et** puces — est faite par
 * `texteReponse()`, dans l'entité. Voir son commentaire : c'est une correction
 * d'un balisage qui annonçait jusqu'ici une réponse tronquée.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  ÉCART SIGNALÉ — CE FICHIER N'EST PAS ENCORE `'use cache'`
 * ---------------------------------------------------------------------------
 * Même situation qu'aux Lots 8A à 8E, pour la même raison : `'use cache'` est
 * une fonctionnalité de Cache Components, et le §0.4 du Rapport 2 écrit noir
 * sur blanc que `cacheComponents: true` n'est pas activé avant le Lot 15. La
 * lecture est donc dynamique en attendant ; les trois pages portent déjà
 * `export const dynamic = "force-dynamic"` depuis les Lots 8A et 8E.
 *
 * **CE QUE LE LOT 15 AURA À FAIRE ICI** : `'use cache'` en première ligne de
 * chaque fonction, `cacheTag(ETIQUETTE_FAQ)` et `cacheLife('days')`.
 * L'étiquette est déjà posée, et `faq.actions.ts` l'invalide déjà.
 *
 * ⚠️  Piège propre à ce fichier pour le Lot 15 : `getFaqParSujet` prend un
 * ARGUMENT. Une fonction `'use cache'` mémorise par argument, mais l'étiquette
 * reste la même pour les trois sujets — c'est voulu : une question qui change
 * de sujet doit invalider les deux pages concernées, et une étiquette par
 * sujet laisserait l'ancienne page servir une liste périmée.
 *
 * ---------------------------------------------------------------------------
 * CE QUE CETTE LECTURE RENVOIE AUJOURD'HUI : LES SEPT QUESTIONS DU SEED
 * ---------------------------------------------------------------------------
 * Comme au Lot 8E, rien ne disparaît de la page publique : les sept lignes de
 * `faq_items` portent `status = 'published'` et un contenu réel, repris mot
 * pour mot de `src/content/faq.ts` (les valeurs interpolées à la construction —
 * téléphone, e-mail, numéro d'enregistrement — ayant été matérialisées par le
 * seed du Lot 1). Le rendu est donc identique pour les données migrées, ce que
 * la recette vérifie.
 */

/** Étiquette de la collection entière. */
export const ETIQUETTE_FAQ = "cms:faq";

function portPublic(): FaqItemReadPort {
  return new SupabaseFaqItemRepository(createPublicClient());
}

/**
 * Les questions publiées d'un sujet — « Faire un don », « Devenir bénévole ».
 *
 * `cache()` de React mémoïse sur la durée d'UN rendu — ce n'est PAS un cache
 * entre requêtes, il ne remplace pas `'use cache'`.
 *
 * ---------------------------------------------------------------------------
 * UNE LECTURE EN ÉCHEC NE VIDE PAS LA SECTION : ELLE LÈVE
 * ---------------------------------------------------------------------------
 * Même règle qu'aux cinq lots précédents. Renvoyer `[]` en cas de panne ferait
 * disparaître la section en silence — exactement le rendu d'un sujet sans
 * question publiée, qui est un état légitime. Les deux situations produiraient
 * le même écran et personne ne saurait laquelle s'est produite. Next rend alors
 * sa frontière d'erreur, ce qui est le comportement voulu.
 *
 * ⚠️  Ici la conséquence dépasse l'affichage : un `[]` silencieux publierait un
 * `FAQPage` VIDE, c'est-à-dire une déclaration fausse envoyée aux moteurs.
 */
export const getFaqParSujet = cache(
  async (topic: FaqTopic): Promise<FaqItem[]> => {
    const resultat = await listPublishedFaqItems(portPublic(), topic);
    if (!resultat.ok) throw resultat.error;
    return resultat.value;
  },
);

/**
 * Les questions que l'accueil affiche : les premières de tous les sujets sauf
 * le bénévolat.
 *
 * La règle vit dans l'entité (`selectionAccueil`), pas ici — l'écran du
 * dashboard doit pouvoir dire la même chose, et une règle recopiée dans deux
 * couches finit par diverger.
 */
export const getFaqAccueil = cache(async (): Promise<FaqItem[]> => {
  const resultat = await listFaqAccueil(portPublic());
  if (!resultat.ok) throw resultat.error;
  return resultat.value;
});
