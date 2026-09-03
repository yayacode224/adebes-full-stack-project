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
 * ⚠️  `rapports` N'EST PLUS IMPORTÉ NON PLUS DEPUIS LE LOT 8I.
 *
 * Les rapports d'activité viennent de la table `annual_reports`
 * (`server/queries/annual-report.query.ts`) et se gèrent dans
 * `/dashboard/documents`. Le tableau ci-dessous reste pour sa valeur de
 * référence, comme le reste du fichier, et sera retiré au Lot 16.
 *
 * ⚠️  DEUX CHOSES QU'IL FAISAIT ET QUI NE SE FONT PLUS :
 *
 *   1. **Les années étaient CALCULÉES** — `getFullYear() - 1` et `- 2`. Le site
 *      aurait donc promis un « Rapport d'activité 2026 » le 1er janvier
 *      prochain, sans que personne l'ait écrit ni qu'aucun document existe.
 *      Elles sont figées en base depuis le seed du Lot 1, comme les chiffres de
 *      l'écart nº 23.
 *   2. **Déposer un PDF dans `public/documents/` ne fait PLUS rien.** C'était
 *      la promesse du champ `file` : le lien apparaissait dès que le fichier
 *      était présent au bon chemin. La marche à suivre est désormais :
 *      Médiathèque → téléverser le PDF, puis Documents → rattacher le fichier
 *      au rapport. Un geste de plus, et c'est le prix du reste — un document
 *      catalogué porte son poids, son type réel et ses usages, et ne peut plus
 *      être supprimé par accident tant qu'un rapport pointe dessus.
 *
 * Ce dossier `public/documents/` n'a d'ailleurs jamais existé : les deux
 * rapports s'affichaient en permanence avec la pastille « Bientôt disponible ».
 *
 * ---------------------------------------------------------------------------
 * PLUS AUCUN EXPORT DE CE FICHIER N'EST IMPORTÉ PAR UNE PAGE. Le Lot 16 peut le
 * supprimer entièrement.
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
