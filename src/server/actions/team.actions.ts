"use server";

import type { TeamMember } from "@/core/cms/entities/team-member";
import {
  createTeamMemberSchema,
  reorderTeamMembersSchema,
  setTeamMemberStatusSchema,
  teamMemberIdSchema,
  updateTeamMemberSchema,
} from "@/core/cms/schemas/team-member.schema";
import { createTeamMember } from "@/core/use-cases/team-members/create-team-member";
import { deleteTeamMember } from "@/core/use-cases/team-members/delete-team-member";
import { reorderTeamMembers } from "@/core/use-cases/team-members/reorder-team-members";
import { setTeamMemberStatus } from "@/core/use-cases/team-members/set-team-member-status";
import { updateTeamMember } from "@/core/use-cases/team-members/update-team-member";

import { createAction } from "../action-kit/create-action";
import { teamMemberDeps } from "../deps/team-member.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SERVER ACTIONS DES MEMBRES DE L'ÉQUIPE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8D du Rapport 2. Les cinq passent par `createAction` — aucune exception
 * (décision D3). Une Server Action est une frontière publique : sans le
 * décorateur, `supprimerMembreEquipeAction` serait une API de suppression
 * ouverte, joignable par un POST direct sans jamais passer par le dashboard.
 *
 * ---------------------------------------------------------------------------
 * ÉTIQUETTES DE CACHE
 * ---------------------------------------------------------------------------
 * Deux, comme au Lot 8C et pour la même raison de fond : **un membre de
 * l'équipe n'a pas de page à lui**. Il n'existe donc aucune étiquette
 * `cms:membre:<slug>` à invalider — seulement la collection et la page
 * composée où l'équipe apparaît.
 *
 * ⚠️  `cms:page:a-propos` est une étiquette NOUVELLE : c'est le premier lot qui
 * fait lire la base à `/a-propos`. Elle est nommée en toutes lettres plutôt que
 * déduite, comme `cms:page:accueil` — le jour où un bloc « équipe » est ajouté
 * à une deuxième page (Lot 9), l'oubli doit se voir ici, à la relecture, et non
 * se produire silencieusement.
 *
 * ---------------------------------------------------------------------------
 * AUCUNE ACTION DE LECTURE ICI
 * ---------------------------------------------------------------------------
 * Comme aux Lots 8A et 8C : l'écran reçoit ses lignes du rendu serveur et les
 * filtre en mémoire (`<DataTable>`, §6.1). Ajouter une action de lecture serait
 * une frontière publique de plus sans usage.
 */

const ETIQUETTES = ["cms:equipe", "cms:page:a-propos"];

/* ═══════════════════════════════════════════════════════════════════════════
 * Création
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Créer une fiche de membre.
 *
 * La fiche naît en brouillon, sans exception : `createTeamMemberSchema` ne
 * transporte pas `status`, et le cas d'usage écrit `'draft'` en dur. C'est ce
 * qui garantit que toute mise en ligne passe par
 * `changerStatutMembreEquipeAction`, où l'on vérifie que le nom affiché en est
 * un.
 */
export const creerMembreEquipeAction = createAction<
  typeof createTeamMemberSchema,
  TeamMember
>({
  permission: "team:create",
  input: createTeamMemberSchema,
  audit: {
    action: "team_member.create",
    entityType: "team_member",
    entityId: (membre) => membre.id,
  },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) => createTeamMember(await teamMemberDeps(), input),
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Modification
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Modifier une fiche.
 *
 * `id` est retiré de la charge utile avant d'atteindre le cas d'usage
 * (écart nº 20) : il désigne la cible, il n'en fait pas partie.
 *
 * Le statut n'est pas modifiable ici — le cas d'usage le neutralise. Et
 * remettre « [À COMPLÉTER] » à la place du nom d'une fiche EN LIGNE est
 * refusé, avec le message qui dit quoi faire : dépublier d'abord.
 */
export const mettreAJourMembreEquipeAction = createAction<
  typeof updateTeamMemberSchema,
  TeamMember
>({
  permission: "team:update",
  input: updateTeamMemberSchema,
  audit: {
    action: "team_member.update",
    entityType: "team_member",
    entityId: (membre) => membre.id,
  },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) => {
    const { id, ...champs } = input;
    return updateTeamMember(await teamMemberDeps(), id, champs);
  },
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Publication
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Changer l'état éditorial.
 *
 * `team:publish` — absent de la liste `editor` (§9 du Rapport 1). La base dit
 * la même chose avec le trigger `guard_publish` (ADB01) : un éditeur qui
 * appellerait cette action par un POST direct serait refusé deux fois.
 *
 * ⚠️  Et une TROISIÈME barrière, propre à ce lot : le cas d'usage refuse la
 * mise en ligne d'une fiche dont le nom est encore le marqueur
 * « [À COMPLÉTER] ». Celle-là ne dépend d'aucun rôle — un super administrateur
 * y est soumis comme les autres, parce qu'elle ne protège pas le site contre
 * ses éditeurs mais le visiteur contre un gabarit affiché comme un contenu.
 */
export const changerStatutMembreEquipeAction = createAction<
  typeof setTeamMemberStatusSchema,
  TeamMember
>({
  permission: "team:publish",
  input: setTeamMemberStatusSchema,
  audit: {
    action: "team_member.publish",
    entityType: "team_member",
    entityId: (membre) => membre.id,
  },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) => setTeamMemberStatus(await teamMemberDeps(), input),
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Réordonnancement
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Réordonner la collection.
 *
 * `team:reorder` — ouvert à l'éditeur : réordonner n'est pas publier. La base
 * dit la même chose (`reorder_rows` exige `app_is_staff()`).
 *
 * Contrairement aux témoignages, l'ordre ne décide pas de ce qui est visible —
 * `/a-propos` affiche tous les membres publiés. Il décide de l'ordre de
 * lecture, qui se lit comme un organigramme.
 */
export const reordonnerMembresEquipeAction = createAction<
  typeof reorderTeamMembersSchema,
  { count: number }
>({
  permission: "team:reorder",
  input: reorderTeamMembersSchema,
  audit: { action: "team_member.reorder", entityType: "team_member" },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) => {
    const resultat = await reorderTeamMembers(
      await teamMemberDeps(),
      input.orderedIds,
    );
    return resultat.ok
      ? { ok: true as const, value: { count: input.orderedIds.length } }
      : resultat;
  },
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Suppression
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Supprimer une fiche.
 *
 * `team:delete` — administrateurs seulement, doublé par la RLS.
 *
 * Rien ne référence un membre de l'équipe : la suppression n'a aucun `on
 * delete restrict` à redouter. Sa photo, elle, reste dans la médiathèque —
 * elle peut servir ailleurs, et c'est `media_assets` qui décide de son sort.
 *
 * Le nom est lu AVANT la suppression : après, il n'existe plus, et le message
 * de confirmation ne pourrait plus nommer ce qui a disparu.
 */
export const supprimerMembreEquipeAction = createAction<
  typeof teamMemberIdSchema,
  { id: string; name: string }
>({
  permission: "team:delete",
  input: teamMemberIdSchema,
  audit: {
    action: "team_member.delete",
    entityType: "team_member",
    entityId: (resultat) => resultat.id,
  },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) => {
    const deps = await teamMemberDeps();

    const existant = await deps.read.findById(input.id);
    const name = existant?.name ?? "";

    const resultat = await deleteTeamMember(deps, input.id);
    return resultat.ok
      ? { ok: true as const, value: { id: input.id, name } }
      : resultat;
  },
});
