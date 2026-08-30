import type { CoreValueDeps } from "../../cms/ports/core-value.port";
import { AppError } from "../../shared/errors";
import { MAX_PAGE_SIZE } from "../../shared/pagination";
import { err, ok, type Result } from "../../shared/result";

/**
 * Supprime une valeur de l'association.
 *
 * Réservée aux administrateurs (`value:delete`, absent de la liste `editor`),
 * et la base dit la même chose : `core_values_admin_delete` exige
 * `app_can_publish()`.
 *
 * ---------------------------------------------------------------------------
 * RIEN NE RÉFÉRENCE UNE VALEUR, ET ELLE NE RÉFÉRENCE RIEN
 * ---------------------------------------------------------------------------
 * `core_values` est la table la plus isolée du schéma : pas de clé étrangère
 * sortante — pas même un média, contrairement aux membres de l'équipe — et
 * aucune entrante. La suppression n'a donc ni `on delete restrict` à redouter,
 * ni effet de bord à documenter.
 *
 * ⚠️  C'est aussi ce qui la rend DÉFINITIVE au sens plein : il n'existe ni
 * archive, ni corbeille, ni `status = 'archived'` où la ranger. Masquer une
 * valeur se défait d'un clic ; la supprimer ne se défait pas. C'est la
 * différence que la confirmation doit dire, et elle la dit.
 */
export async function deleteCoreValue(
  deps: CoreValueDeps,
  id: string,
): Promise<Result<void>> {
  const existante = await deps.read.findById(id);
  if (!existante) {
    return err(new AppError("NOT_FOUND", "Cette valeur n'existe plus."));
  }

  await deps.write.delete(id);

  /*
    Renumérotation immédiate : sans elle, les positions deviennent 1, 2, 4 et le
    prochain `create` — qui calcule `count() + 1` — réutiliserait une position
    déjà occupée.

    ⚠️  Le filtre est EXPLICITE, et ce n'est pas de la décoration :
    `normalizeFilter` ramène une taille de page absente à 20. Un `findAll()` nu
    renverrait donc les 20 premières lignes, et `reorder_rows` renumérotant
    seulement celles-là recréerait exactement les collisions qu'on vient
    d'éviter. La borne haute est `MAX_PAGE_SIZE`. Défaut trouvé au Lot 8C.
  */
  const restantes = await deps.read.findAll({
    pageSize: MAX_PAGE_SIZE,
    sortBy: "position",
    sortDirection: "asc",
  });
  if (restantes.length > 0) {
    await deps.write.reorder(restantes.map((valeur) => valeur.id));
  }

  return ok(undefined);
}
