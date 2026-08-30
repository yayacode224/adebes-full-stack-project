import type { GalleryItem } from "../../cms/entities/gallery";
import type { GalleryItemReadPort } from "../../cms/ports/gallery.port";
import {
  normalizeFilter,
  toPage,
  type ListFilter,
  type Page,
} from "../../shared/pagination";
import { ok, type Result } from "../../shared/result";

/**
 * Liste paginée des éléments de galerie, pour le dashboard.
 *
 * ⚠️  Ne reçoit qu'un `GalleryItemReadPort` — pas les deux. Une lecture ne peut
 * structurellement pas écrire (§7 du Rapport 1, principe I).
 */
export async function listGalleryItems(
  read: GalleryItemReadPort,
  filter: ListFilter = {},
): Promise<Result<Page<GalleryItem>>> {
  const normalise = normalizeFilter(filter);
  const [items, total] = await Promise.all([
    read.findAll(normalise),
    read.count(normalise),
  ]);
  return ok(toPage(items, total, normalise));
}

/**
 * Les éléments publiés, dans l'ordre d'affichage — ce que rend `/galerie`.
 *
 * ---------------------------------------------------------------------------
 * LA GRILLE ENTIÈRE EST CHARGÉE, ET LE FILTRE VIT DANS LE NAVIGATEUR
 * ---------------------------------------------------------------------------
 * Contrairement au Lot 8F, dont la lecture publique prend un sujet en
 * paramètre : la page de la FAQ des dons n'affiche QUE les questions de dons,
 * alors que `/galerie` affiche tout et laisse le visiteur restreindre d'un
 * clic, sans rechargement (`<GalleryGrid>`, conservé du site actuel).
 *
 * Filtrer côté serveur aurait imposé un aller-retour par bouton pressé et cassé
 * la visionneuse, qui circule d'une photo à l'autre **dans la sélection en
 * cours**.
 *
 * Le filtrage par statut est répété dans le dépôt alors que la RLS l'impose
 * déjà à la clé `anon` : les deux barrières sont indépendantes, et cette
 * fonction doit rester correcte même appelée avec un client authentifié.
 */
export async function listPublishedGalleryItems(
  read: GalleryItemReadPort,
  limit = 200,
): Promise<Result<GalleryItem[]>> {
  return ok(await read.findPublished({ limit }));
}
