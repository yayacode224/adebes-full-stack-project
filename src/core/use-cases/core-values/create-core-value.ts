import type { CoreValue, CreateCoreValue } from "../../cms/entities/core-value";
import type { CoreValueDeps } from "../../cms/ports/core-value.port";
import { ok, type Result } from "../../shared/result";

/**
 * Crée une valeur de l'association.
 *
 * Le cas d'usage de création le plus court du Lot 8 — plus court encore que
 * celui du Lot 8D, et pour une raison de plus : `core_values` n'a ni adresse
 * publique, ni clé étrangère, ni cycle éditorial. Il ne reste que le calcul de
 * la position.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  UNE VALEUR NAÎT VISIBLE — L'INVERSE DES QUATRE LOTS PRÉCÉDENTS
 * ---------------------------------------------------------------------------
 * `createTeamMember` écrit `status: 'draft'` EN DUR, et ignore ce qu'on lui
 * demande : c'était ce qui garantissait qu'aucune fiche ne puisse être mise en
 * ligne sans traverser la garde sur le nom.
 *
 * Il n'y a rien d'équivalent à garantir ici. Aucune permission `value:publish`
 * n'existe, aucune garde n'est à forcer, et la base elle-même écrit
 * `is_visible = true` par défaut. Naître en brouillon n'aurait donc protégé de
 * rien : cela aurait seulement imposé un second geste — invisible dans
 * l'interface, puisqu'il n'y a pas de bouton « Publier » sur cette collection —
 * pour arriver à l'état que tout le monde voulait.
 *
 * La valeur reçue est donc RESPECTÉE, avec `true` par défaut. C'est le schéma
 * de création qui le dit aussi (`.default(true)`), et les deux doivent rester
 * d'accord : ce cas d'usage est également appelable depuis un test ou un futur
 * importateur, où le schéma n'intervient pas.
 */
export async function createCoreValue(
  deps: CoreValueDeps,
  input: CreateCoreValue,
): Promise<Result<CoreValue>> {
  // La nouvelle valeur se place en fin de liste. `count()` plutôt qu'un
  // `max(position) + 1` : les positions sont renumérotées de 1 à N à chaque
  // réordonnancement, les deux valeurs coïncident donc toujours.
  const position = input.position ?? (await deps.read.count()) + 1;

  return ok(
    await deps.write.create({
      ...input,
      position,
      isVisible: input.isVisible ?? true,
    }),
  );
}
