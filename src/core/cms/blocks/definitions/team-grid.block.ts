import { z } from "zod";

import { DEFAUTS_ENTETE_ALIGNE, champsEntete, enteteAligneShape } from "../shared";
import type { BlockDefinition } from "../types";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ÉQUIPE — `<TeamMemberCard>`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Les fiches d'équipe publiées, dans l'ordre de `/dashboard/equipe`.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  CE BLOC EST AUJOURD'HUI VIDE SUR LE SITE, ET C'EST NORMAL
 * ---------------------------------------------------------------------------
 * Les trois fiches du seed sont en **brouillon** : elles portent des
 * `[À COMPLÉTER]` repris tels quels du contenu d'origine, et le Lot 8D a posé
 * une garde qui refuse de publier une fiche qui en contient encore.
 *
 * La section disparaît donc de `/a-propos` tant que personne n'a complété puis
 * publié une fiche. Ce n'est pas une panne du bloc : c'est l'invariant nº 1 du
 * projet — ne rien inventer — rendu visible. Une section « L'équipe » suivie de
 * trois cartes « [À COMPLÉTER] » serait pire que son absence.
 */

const schema = z.object(
  { ...enteteAligneShape },
  { message: "Contenu de bloc équipe invalide." },
);

export type TeamGridContent = z.infer<typeof schema>;

export const teamGridBlock: BlockDefinition<typeof schema> = {
  type: "team-grid",
  label: "Équipe",
  description:
    "Affiche les fiches d'équipe publiées. Une fiche en brouillon n'apparaît pas sur le site.",
  category: "mise-en-avant",
  collection: "Équipe",
  schema,
  defaults: { ...DEFAUTS_ENTETE_ALIGNE },
  fields: champsEntete(),
};
