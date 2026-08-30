import "server-only";

import { cache } from "react";

import type { TeamMember } from "@/core/cms/entities/team-member";
import type { TeamMemberReadPort } from "@/core/cms/ports/team-member.port";
import { listPublishedTeamMembers } from "@/core/use-cases/team-members/list-team-members";
import { createPublicClient } from "@/infrastructure/supabase/clients/public";
import { SupabaseTeamMemberRepository } from "@/infrastructure/supabase/repositories/team-member.repository";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LECTURES PUBLIQUES DE L'ÉQUIPE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §11 du Rapport 1. C'est la seule porte par laquelle le site public lit
 * l'équipe : aucune page de `src/app/(site)/` n'appelle un dépôt.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  ÉCART SIGNALÉ — CE FICHIER N'EST PAS ENCORE `'use cache'`
 * ---------------------------------------------------------------------------
 * Même situation qu'aux Lots 8A à 8C, pour la même raison : `'use cache'` est
 * une fonctionnalité de Cache Components, et le §0.4 du Rapport 2 écrit noir
 * sur blanc que `cacheComponents: true` n'est pas activé avant le Lot 15. La
 * lecture est donc dynamique en attendant, et `/a-propos` porte désormais
 * `export const dynamic = "force-dynamic"`.
 *
 * **CE QUE LE LOT 15 AURA À FAIRE ICI** : `'use cache'` en première ligne de
 * la fonction, `cacheTag(ETIQUETTE_EQUIPE)` et `cacheLife('days')`.
 * L'étiquette est déjà posée, et `team.actions.ts` l'invalide déjà.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  CE QUE CETTE LECTURE RENVOIE AUJOURD'HUI : RIEN — ET C'EST EXACT
 * ---------------------------------------------------------------------------
 * Les TROIS lignes de `team_members` sont en `status = 'draft'` (seed du Lot
 * 1), donc invisibles pour la clé `anon`. La section « L'équipe » de
 * `/a-propos` ne s'affiche donc plus tant que les fiches ne sont pas
 * renseignées et publiées.
 *
 * Ce n'est pas une régression : c'est la donnée réelle qui remonte enfin
 * jusqu'à la page. Avant ce lot, `/a-propos` affichait trois cartes portant
 * « [À COMPLÉTER] » et le badge « Nom et photo à fournir » — un aveu
 * d'incomplétude adressé aux VISITEURS, sur la page dont l'audit (§4.9) dit
 * qu'elle est un signal de confiance pour un donateur. Ce rappel appartient au
 * dashboard, où quelqu'un peut agir ; il y est, en tête de
 * `/dashboard/equipe`.
 *
 * La marche à suivre est en une phrase : renseigner les trois noms, puis
 * publier les fiches. `setTeamMemberStatus` refuse la publication tant que le
 * nom est resté le marqueur, de sorte qu'aucune des deux moitiés ne peut être
 * oubliée.
 */

/** Étiquette de la collection entière. */
export const ETIQUETTE_EQUIPE = "cms:equipe";

function portPublic(): TeamMemberReadPort {
  return new SupabaseTeamMemberRepository(createPublicClient());
}

/**
 * Les membres de l'équipe publiés, dans l'ordre d'affichage.
 *
 * `cache()` de React mémoïse sur la durée d'UN rendu — ce n'est PAS un cache
 * entre requêtes, il ne remplace pas `'use cache'`.
 *
 * ---------------------------------------------------------------------------
 * UNE LECTURE EN ÉCHEC NE VIDE PAS LA SECTION : ELLE LÈVE
 * ---------------------------------------------------------------------------
 * Même règle qu'aux trois lots précédents, et elle compte particulièrement
 * ici : la section est déjà vide de façon légitime. « Il n'y a aucun membre
 * publié » et « on n'a pas pu les lire » produiraient exactement le même écran
 * si l'échec renvoyait `[]`, et personne ne saurait jamais lequel des deux
 * s'est produit. Next rend alors sa frontière d'erreur, ce qui est le
 * comportement voulu.
 */
export const getMembresEquipePublies = cache(async (): Promise<TeamMember[]> => {
  const resultat = await listPublishedTeamMembers(portPublic());
  if (!resultat.ok) throw resultat.error;
  return resultat.value;
});
