import type { Programme } from "../../cms/entities/programme";
import type { ProgrammeReadPort } from "../../cms/ports/programme.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/** Récupère un programme par son adresse — page publique `/programmes/[slug]`. */
export async function getProgrammeBySlug(
  read: ProgrammeReadPort,
  slug: string,
): Promise<Result<Programme>> {
  const programme = await read.findBySlug(slug);
  if (!programme) {
    return err(new AppError("NOT_FOUND", "Ce programme n'existe pas ou n'est plus en ligne."));
  }
  return ok(programme);
}

/** Récupère un programme par son identifiant — écran d'édition du dashboard. */
export async function getProgrammeById(
  read: ProgrammeReadPort,
  id: string,
): Promise<Result<Programme>> {
  const programme = await read.findById(id);
  if (!programme) {
    return err(new AppError("NOT_FOUND", "Ce programme n'existe plus."));
  }
  return ok(programme);
}

/**
 * Les libellés de bénévolat des programmes publiés.
 *
 * ⚠️  DÉPENDANCE À NE PAS PERDRE DE VUE (§8A.2 du Rapport 2).
 *
 * `src/lib/schemas.ts` construit aujourd'hui les domaines du formulaire de
 * bénévolat depuis `programmes.map(p => p.benevolatLabel)`, en statique. Une
 * fois les programmes en base, cette liste devient dynamique.
 *
 * Un schéma Zod partagé client/serveur ne pouvant pas être asynchrone, la
 * solution retenue est : `domain: z.string().min(1)` côté schéma, et
 * vérification d'appartenance à CETTE liste dans la Server Action. Le
 * composant reçoit la liste en props depuis un Server Component.
 */
export async function listBenevolatLabels(
  read: ProgrammeReadPort,
): Promise<Result<string[]>> {
  const programmes = await read.findAll({
    status: "published",
    sortBy: "position",
    sortDirection: "asc",
    pageSize: 100,
  });
  return ok(programmes.map((p) => p.benevolatLabel).filter(Boolean));
}
