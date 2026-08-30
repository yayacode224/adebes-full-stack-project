import { TODO } from "@/lib/site-config";

/**
 * Équipe et gouvernance.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  ⚠️  `equipe` N'EST PLUS IMPORTÉ PAR AUCUNE PAGE DEPUIS LE LOT 8D
 * ═══════════════════════════════════════════════════════════════════════════
 * Les membres de l'équipe viennent de la base (`server/queries/team.query.ts`)
 * et se gèrent dans `/dashboard/equipe`. Le tableau reste — comme
 * `programmes.ts`, `actualites.ts` et `temoignages.ts` — pour sa valeur de
 * référence : c'est ici qu'est écrite la règle « aucun nom n'est inventé », que
 * `setTeamMemberStatus` applique désormais en refusant de publier une fiche
 * dont le nom est resté « [À COMPLÉTER] ». Il sera retiré au Lot 16.
 *
 * `membrePhoto()` n'a plus d'appelant, et ce n'est pas un oubli : sa convention
 * de nommage est indexée sur l'identifiant de CE tableau, qui n'existe plus en
 * base. Le raisonnement complet est dans l'en-tête de
 * `src/components/cards/team-member-card.tsx`. Les trois fichiers
 * `equipe-*.jpeg` restent dans `public/images/a-propos/` : pour les réutiliser,
 * les téléverser dans la médiathèque et les choisir dans le champ « Photo ».
 *
 * ⚠️  `rapports`, EN REVANCHE, EST TOUJOURS UTILISÉ par `/impact`. Il migrera
 * vers la table `annual_reports` à son propre lot ; ne pas supprimer ce fichier
 * avant.
 *
 * ---------------------------------------------------------------------------
 * L'audit note (§4.9) l'absence totale d'information institutionnelle. Pour un
 * donateur, savoir qui dirige l'association est un signal de confiance au moins
 * aussi fort qu'un chiffre d'impact.
 *
 * Les fiches ci-dessous sont des emplacements : aucun nom n'est inventé.
 */

export type MembreEquipe = {
  id: string;
  name: string;
  role: string;
  /** Une phrase : parcours ou domaine de responsabilité. */
  bio?: string;
  placeholder?: boolean;
};

export const equipe: MembreEquipe[] = [
  {
    id: "direction",
    name: TODO,
    role: "Président·e / Direction",
    bio: "Responsable de la stratégie générale et de la représentation de l'association.",
    placeholder: true,
  },
  {
    id: "programmes",
    name: TODO,
    role: "Coordination des programmes",
    bio: "Pilote la mise en œuvre des 8 programmes sur le terrain.",
    placeholder: true,
  },
  {
    id: "terrain",
    name: TODO,
    role: "Coordination terrain et bénévoles",
    bio: "Organise les interventions et l'accompagnement des bénévoles.",
    placeholder: true,
  },
];

export function membrePhoto(id: string): string {
  return `/images/a-propos/equipe-${id}.jpeg`;
}

/** Documents téléchargeables proposés sur la page Impact & transparence. */
export type RapportAnnuel = {
  year: number;
  title: string;
  /** Chemin dans /public/documents/ — le lien n'apparaît que si le PDF existe. */
  file: string;
};

export const rapports: RapportAnnuel[] = [
  {
    year: new Date().getFullYear() - 1,
    title: `Rapport d'activité ${new Date().getFullYear() - 1}`,
    file: `/documents/rapport-activite-${new Date().getFullYear() - 1}.pdf`,
  },
  {
    year: new Date().getFullYear() - 2,
    title: `Rapport d'activité ${new Date().getFullYear() - 2}`,
    file: `/documents/rapport-activite-${new Date().getFullYear() - 2}.pdf`,
  },
];
