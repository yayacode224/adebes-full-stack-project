import type { StatDeps } from "../../cms/ports/stat.port";
import { AppError } from "../../shared/errors";
import { MAX_PAGE_SIZE } from "../../shared/pagination";
import { err, ok, type Result } from "../../shared/result";

/**
 * Supprime un chiffre clé.
 *
 * Réservée aux administrateurs (`stat:delete`, absent de la liste `editor`), et
 * la base dit la même chose : `stats_admin_delete` exige `app_can_publish()`.
 *
 * ---------------------------------------------------------------------------
 * RIEN NE RÉFÉRENCE UN CHIFFRE, ET IL NE RÉFÉRENCE RIEN
 * ---------------------------------------------------------------------------
 * `stats` est, avec `core_values`, l'une des deux tables les plus isolées du
 * schéma : pas de clé étrangère sortante — pas même un média — et aucune
 * entrante. La suppression n'a donc ni `on delete restrict` à redouter, ni
 * effet de bord à documenter.
 *
 * ⚠️  C'est aussi ce qui la rend DÉFINITIVE au sens plein : il n'existe ni
 * archive, ni corbeille, ni `status = 'archived'` où la ranger. Et une nuance
 * propre à cette collection s'y ajoute : **le chiffre supprimé emporte sa
 * précision** (`note`), c'est-à-dire la SOURCE qui le rendait vérifiable.
 * Retrouver « 30 projets » est facile ; retrouver d'où venait ce 30 l'est
 * beaucoup moins. La confirmation le dit.
 *
 * ⚠️  La clé technique, elle, redevient libre : supprimer « Projets menés »
 * permet de recréer un chiffre du même libellé. C'est cohérent — la contrainte
 * `unique` ne porte que sur les lignes existantes — mais cela signifie qu'une
 * suppression suivie d'une recréation produit une ligne NEUVE, avec un
 * identifiant différent, que rien ne relie à l'ancienne.
 */
export async function deleteStat(
  deps: StatDeps,
  id: string,
): Promise<Result<void>> {
  const existant = await deps.read.findById(id);
  if (!existant) {
    return err(new AppError("NOT_FOUND", "Ce chiffre n'existe plus."));
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
  const restants = await deps.read.findAll({
    pageSize: MAX_PAGE_SIZE,
    sortBy: "position",
    sortDirection: "asc",
  });
  if (restants.length > 0) {
    await deps.write.reorder(restants.map((stat) => stat.id));
  }

  return ok(undefined);
}
