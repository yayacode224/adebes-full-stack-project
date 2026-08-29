import "server-only";

import { CONTENT_STATUS_LABELS } from "@/core/cms/entities/content-status";
import { listProgrammes } from "@/core/use-cases/programmes/list-programmes";
import { MAX_PAGE_SIZE } from "@/core/shared/pagination";

import { programmeReadPort } from "../deps/programme.deps";

/**
 * Les programmes proposés par un champ `kind: "reference"`.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  POURQUOI CETTE FONCTION EXISTE
 * ═══════════════════════════════════════════════════════════════════════════
 * Écart nº 40 : le champ `reference` ne charge pas ses options, il les reçoit
 * de l'écran via `<ReferencesProvider>`. Deux écrans du Lot 8C en ont besoin
 * (`/nouveau` et `/[id]`), et les lots 8D et 9 en auront d'autres — le bloc
 * `programmes-grid` du registre en premier. Recopier la lecture dans chacun,
 * c'était accepter que l'un d'eux oublie un jour de trier, ou de borner sa
 * page.
 *
 * ---------------------------------------------------------------------------
 * LES BROUILLONS SONT PROPOSÉS, ET LEUR ÉTAT EST ÉCRIT
 * ---------------------------------------------------------------------------
 * `testimonials.programme_id` n'exige pas un programme publié : rattacher un
 * témoignage à un programme encore en préparation est légitime, c'est même
 * l'ordre naturel des choses quand on monte un programme et qu'on recueille
 * les premières paroles.
 *
 * Mais le taire serait trompeur : quelqu'un choisirait « Santé mentale » sans
 * savoir que ce programme n'est pas en ligne. Le `detail` porte donc le
 * libellé d'état — sauf pour les programmes publiés, où l'écrire sur chaque
 * ligne n'apprendrait rien et noierait les trois qui comptent.
 *
 * ---------------------------------------------------------------------------
 * LE TITRE COURT, PAS LE TITRE
 * ---------------------------------------------------------------------------
 * `shortTitle` existe précisément pour « les cartes étroites, où le titre
 * complet ne tient pas » (entité `Programme`). Une liste d'options de 224 px
 * de haut, sur une colonne de formulaire, est ce cas-là.
 *
 * ---------------------------------------------------------------------------
 * UN ÉCHEC DE LECTURE RENVOIE UNE LISTE VIDE, ET C'EST VOULU
 * ---------------------------------------------------------------------------
 * `undefined` et `[]` ne disent pas la même chose à `ReferenceField` :
 * `undefined` signifie « cette ressource n'est pas fournie sur cet écran » et
 * rend un état explicite, `[]` signifie « aucune option ». Ici, l'écran FOURNIT
 * bien la ressource ; c'est la lecture qui a échoué. Renvoyer `[]` affiche
 * « Aucun élément à associer pour l'instant », ce qui reste juste, et surtout
 * ne fait pas tomber l'écran d'édition d'un témoignage parce que la liste des
 * programmes n'a pas pu être lue — le témoignage, lui, est là et modifiable.
 */
export type OptionProgramme = {
  value: string;
  label: string;
  detail?: string;
};

export async function lireOptionsProgrammes(): Promise<OptionProgramme[]> {
  const resultat = await listProgrammes(await programmeReadPort(), {
    page: 1,
    pageSize: MAX_PAGE_SIZE,
    sortBy: "position",
    sortDirection: "asc",
  });

  if (!resultat.ok) return [];

  return resultat.value.items.map((programme) => ({
    value: programme.id,
    label: programme.shortTitle,
    detail:
      programme.status === "published"
        ? undefined
        : CONTENT_STATUS_LABELS[programme.status],
  }));
}
