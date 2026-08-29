import "server-only";

import { cache } from "react";

import type { Testimonial } from "@/core/cms/entities/testimonial";
import type { TestimonialReadPort } from "@/core/cms/ports/testimonial.port";
import { listPublishedTestimonials } from "@/core/use-cases/testimonials/list-testimonials";
import { createPublicClient } from "@/infrastructure/supabase/clients/public";
import { SupabaseTestimonialRepository } from "@/infrastructure/supabase/repositories/testimonial.repository";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LECTURES PUBLIQUES DES TÉMOIGNAGES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §11 du Rapport 1. C'est la seule porte par laquelle le site public lit les
 * témoignages : aucune page de `src/app/(site)/` n'appelle un dépôt.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  ÉCART SIGNALÉ — CE FICHIER N'EST PAS ENCORE `'use cache'`
 * ---------------------------------------------------------------------------
 * Même situation qu'aux Lots 8A et 8B, pour la même raison : `'use cache'` est
 * une fonctionnalité de Cache Components, et le §0.4 du Rapport 2 écrit noir
 * sur blanc que `cacheComponents: true` n'est pas activé avant le Lot 15. La
 * lecture est donc dynamique en attendant, et l'accueil porte
 * `export const dynamic = "force-dynamic"`.
 *
 * **CE QUE LE LOT 15 AURA À FAIRE ICI** : `'use cache'` en première ligne de
 * la fonction, `cacheTag(ETIQUETTE_TEMOIGNAGES)` et `cacheLife('days')`.
 * L'étiquette est déjà posée, et `testimonials.actions.ts` l'invalide déjà.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  CETTE LECTURE NE FILTRE PAS SUR `hasConsent` — ET C'EST UNE DÉCISION
 * ---------------------------------------------------------------------------
 * C'est le point le plus délicat du Lot 8C, alors voici l'état des faits.
 *
 * Les TROIS témoignages du seed (migration/seed du Lot 1) sont en base avec
 * `status = 'published'` **et** `has_consent = false`. Ce ne sont pas des
 * citations : leur texte est « Emplacement réservé au témoignage d'un
 * bénéficiaire… », leur auteur s'appelle « Prénom ». Ils reprennent à
 * l'identique les trois entrées de `src/content/temoignages.ts`, qui les
 * décrit comme « des gabarits explicitement marqués, jamais de fausses paroles
 * attribuées à de vraies personnes ».
 *
 * Filtrer ici sur `hasConsent` VIDERAIT donc la section « Témoignages » de la
 * page d'accueil — trois cartes remplacées par rien — alors que la recette des
 * lots 8x exige que « le rendu public soit identique à l'actuel pour les
 * données migrées ». Et cela au nom d'une règle qui protège des personnes
 * réelles, dont aucune n'est ici concernée.
 *
 * La règle est donc appliquée là où elle mord vraiment, EN AMONT :
 *
 *   * `setTestimonialStatus` refuse toute mise en ligne sans accord — aucun
 *     rôle n'y échappe, super administrateur compris ;
 *   * `updateTestimonial` refuse de retirer l'accord d'un témoignage en ligne,
 *     et refuse d'en réécrire la citation tant qu'aucun accord n'est
 *     enregistré. C'est cette seconde règle qui empêche un gabarit publié de
 *     devenir, par simple modification, une vraie citation non autorisée ;
 *   * l'écran `/dashboard/temoignages` signale toute ligne en ligne sans
 *     accord, avec le nombre concerné en tête de page.
 *
 * Autrement dit : la porte d'entrée est fermée, et l'état hérité est SIGNALÉ
 * plutôt que masqué. Masquer ces trois lignes du site sans rien dire aurait
 * laissé croire à une panne ; les faire disparaître de la base aurait été
 * inventer du contenu (invariant nº 1).
 */

/** Étiquette de la collection entière. */
export const ETIQUETTE_TEMOIGNAGES = "cms:temoignages";

function portPublic(): TestimonialReadPort {
  return new SupabaseTestimonialRepository(createPublicClient());
}

/**
 * Les témoignages publiés, dans l'ordre d'affichage.
 *
 * `cache()` de React mémoïse sur la durée d'UN rendu — ce n'est PAS un cache
 * entre requêtes, il ne remplace pas `'use cache'`.
 *
 * ---------------------------------------------------------------------------
 * UNE LECTURE EN ÉCHEC NE VIDE PAS LA SECTION : ELLE LÈVE
 * ---------------------------------------------------------------------------
 * Même règle que pour les programmes et les articles. « Il n'y a aucun
 * témoignage » et « on n'a pas pu les lire » ne sont pas la même information,
 * et les confondre afficherait une page amputée sans que personne le sache.
 * Next rend alors sa frontière d'erreur, ce qui est le comportement voulu.
 */
export const getTemoignagesPublies = cache(async (): Promise<Testimonial[]> => {
  const resultat = await listPublishedTestimonials(portPublic());
  if (!resultat.ok) throw resultat.error;
  return resultat.value;
});
