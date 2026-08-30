import "server-only";

import type {
  GalleryCategoryDeps,
  GalleryCategoryReadPort,
  GalleryItemDeps,
  GalleryItemReadPort,
} from "@/core/cms/ports/gallery.port";
import { createServerClient } from "@/infrastructure/supabase/clients/server";
import { SupabaseGalleryCategoryRepository } from "@/infrastructure/supabase/repositories/gallery-category.repository";
import { SupabaseGalleryItemRepository } from "@/infrastructure/supabase/repositories/gallery-item.repository";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  COMPOSITION DES DÉPENDANCES DE LA GALERIE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Gabarit de `article.deps.ts` (Lot 8B), qui est celui de `programme.deps.ts`
 * (écart nº 44) à deux dépôts. Les deux points qui se perdent en le recopiant :
 *
 *   1. **Le client est reconstruit à CHAQUE appel.** `createServerClient()` lit
 *      les cookies de LA requête en cours ; mémoriser l'objet au niveau du
 *      module le ferait fuiter d'un visiteur à l'autre.
 *   2. **Une page du dashboard demande le port de LECTURE seul.** Une page qui
 *      affiche une liste ne doit pas recevoir un objet capable de supprimer, et
 *      le type l'en empêche.
 *
 * Un seul client Supabase alimente les DEUX dépôts d'un même appel : ils
 * partagent la session, et en construire deux doublerait le travail pour rien.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  CE FICHIER N'EST PAS IMPORTABLE DEPUIS `src/server/queries/`
 * ---------------------------------------------------------------------------
 * Il importe `clients/server`, donc `next/headers`. La règle ESLint qui protège
 * `server/queries/**` interdit cet import direct ; l'atteindre par ricochet la
 * rendrait inopérante. La lecture publique compose ses propres dépôts, avec
 * `createPublicClient()`, dans `server/queries/gallery.query.ts`.
 */
export async function galleryItemDeps(): Promise<GalleryItemDeps> {
  const supabase = await createServerClient();

  const elements = new SupabaseGalleryItemRepository(supabase);
  const categories = new SupabaseGalleryCategoryRepository(supabase);

  return { read: elements, write: elements, categories };
}

/** Les dépendances de gestion des catégories. */
export async function galleryCategoryDeps(): Promise<GalleryCategoryDeps> {
  const supabase = await createServerClient();

  const categories = new SupabaseGalleryCategoryRepository(supabase);
  const elements = new SupabaseGalleryItemRepository(supabase);

  return { read: categories, write: categories, items: elements };
}

/** Le port de LECTURE seul — pour les pages du dashboard. */
export async function galleryItemReadPort(): Promise<GalleryItemReadPort> {
  return new SupabaseGalleryItemRepository(await createServerClient());
}

/** Idem pour les catégories : lire la liste ne donne pas le droit de l'écrire. */
export async function galleryCategoryReadPort(): Promise<GalleryCategoryReadPort> {
  return new SupabaseGalleryCategoryRepository(await createServerClient());
}
