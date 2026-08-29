import { TODO } from "@/lib/site-config";

/**
 * Équipe et gouvernance.
 *
 * L'audit note (§4.9) l'absence totale d'information institutionnelle. Pour un
 * donateur, savoir qui dirige l'association est un signal de confiance au moins
 * aussi fort qu'un chiffre d'impact.
 *
 * Les fiches ci-dessous sont des emplacements : aucun nom n'est inventé.
 * Remplacez `name` et `role`, déposez la photo correspondante dans
 * `public/images/a-propos/` sous la forme `equipe-prenom-nom.jpg`, puis retirez
 * `placeholder`.
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
