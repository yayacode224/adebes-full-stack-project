import type { ProgrammeDeps } from "../../cms/ports/programme.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Supprime un programme.
 *
 * La suppression est réservée aux administrateurs (`programme:delete`), et la
 * base la refuse aussi à un éditeur via la RLS.
 *
 * ⚠️  Un programme cité par un témoignage NE PEUT PAS être supprimé :
 * `testimonials.programme_id` est déclaré `on delete restrict` (migration
 * 0005). PostgreSQL lève alors 23503, que le repository traduit en
 * `CONFLICT` avec un message explicite — « Cet élément est utilisé ailleurs ».
 *
 * Le choix est délibéré : effacer silencieusement le témoignage en cascade
 * ferait disparaître une parole que quelqu'un a autorisé à publier.
 */
export async function deleteProgramme(
  deps: ProgrammeDeps,
  id: string,
): Promise<Result<void>> {
  const existant = await deps.read.findById(id);
  if (!existant) {
    return err(new AppError("NOT_FOUND", "Ce programme n'existe plus."));
  }

  await deps.write.delete(id);

  // Renumérotation immédiate : sans elle, les positions deviennent 1, 2, 4, 5
  // et le prochain `create` — qui calcule `count() + 1` — réutiliserait une
  // position déjà occupée.
  const restants = await deps.read.findAll();
  if (restants.length > 0) {
    await deps.write.reorder(restants.map((p) => p.id));
  }

  return ok(undefined);
}
