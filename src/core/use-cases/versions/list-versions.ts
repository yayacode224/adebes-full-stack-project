import type { ContentVersion } from "../../cms/entities/content-version";
import type { ContentVersionReadPort } from "../../cms/ports/content-version.port";
import type { VersionedEntityType } from "../../cms/entities/content-version";
import { ok, type Result } from "../../shared/result";

/**
 * L'historique d'une entité, de la version la plus récente à la plus ancienne
 * — écran d'historique du dashboard.
 *
 * ⚠️  Ne reçoit qu'un `ContentVersionReadPort`. Consulter l'historique ne donne
 * pas le droit d'y écrire (§7 du Rapport 1, principe I).
 *
 * Une liste vide n'est pas une erreur : une entité jamais publiée n'a pas
 * d'instantané, et l'écran l'affiche comme tel.
 */
export async function listVersions(
  read: ContentVersionReadPort,
  entityType: VersionedEntityType,
  entityId: string,
): Promise<Result<ContentVersion[]>> {
  return ok(await read.listForEntity(entityType, entityId));
}
