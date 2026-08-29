import type { MediaAsset, MediaFilter } from "../../cms/entities/media-asset";
import type { MediaReadPort } from "../../cms/ports/media.port";
import { ok, type Result } from "../../shared/result";
import { toPage, type Page } from "../../shared/pagination";

/**
 * Liste paginée de la médiathèque.
 *
 * Reçoit un `MediaReadPort` et rien d'autre : une liste ne doit pas pouvoir
 * supprimer (ségrégation des interfaces). Le `<MediaPicker>` appelle ce même
 * cas d'usage que l'écran `/dashboard/mediatheque` — deux vues, une seule
 * règle de lecture.
 *
 * Les deux requêtes partent ensemble : `count` ne dépend pas de `findAll`, et
 * les enchaîner doublerait la latence de la grille sur une connexion mobile.
 */
export async function listMedia(
  read: MediaReadPort,
  filter: MediaFilter = {},
): Promise<Result<Page<MediaAsset>>> {
  const [items, total] = await Promise.all([
    read.findAll(filter),
    read.count(filter),
  ]);

  return ok(toPage(items, total, filter));
}

/**
 * Les dossiers existants, pour alimenter le filtre.
 *
 * Séparé de la liste : la grille se recharge à chaque frappe dans la
 * recherche, les dossiers non. Les fusionner ferait payer une requête de plus
 * à chaque caractère saisi.
 */
export async function listMediaFolders(
  read: MediaReadPort,
): Promise<Result<string[]>> {
  return ok(await read.listFolders());
}
