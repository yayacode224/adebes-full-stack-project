import "server-only";

import type { MediaDeps, MediaReadPort } from "@/core/cms/ports/media.port";
import { SupabaseStorage } from "@/infrastructure/storage/storage";
import { createServerClient } from "@/infrastructure/supabase/clients/server";
import { SupabaseMediaRepository } from "@/infrastructure/supabase/repositories/media.repository";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  COMPOSITION DES DÉPENDANCES DE LA MÉDIATHÈQUE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ---------------------------------------------------------------------------
 * POURQUOI CE DOSSIER EXISTE — écart signalé, à consigner dans REPRISE
 * ---------------------------------------------------------------------------
 * Le §8A.4 du Rapport 2 écrit `handler: ({ input }) => createProgramme(
 * programmeDeps(), input)` sans jamais dire OÙ vit `programmeDeps()`. Les
 * emplacements existants ne conviennent pas :
 *
 *   * `server/dal/` LIT, il ne décide pas (écart nº 29) — assembler des ports
 *     n'est pas une lecture ;
 *   * `server/actions/` conviendrait pour les écritures, mais les PAGES du
 *     dashboard en ont besoin aussi, et importer un fichier `"use server"`
 *     depuis un Server Component pour y récupérer une fabrique reviendrait à
 *     exposer une frontière publique de plus sans raison.
 *
 * `server/deps/` est donc créé pour ça : la racine de composition, côté
 * contrôleur, la seule couche qui a le droit de connaître à la fois `core/` et
 * `infrastructure/`. Les Lots 8A à 8I y ajouteront une fabrique par collection.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI LE CLIENT EST CRÉÉ À CHAQUE APPEL
 * ---------------------------------------------------------------------------
 * `createServerClient()` lit les cookies de LA requête en cours. Mémoriser
 * l'objet au niveau du module le ferait fuiter d'un visiteur à l'autre — la
 * faute la plus coûteuse possible dans un back-office. La fabrique est donc
 * asynchrone et sans cache : le coût est celui d'une construction d'objet,
 * pas d'un aller-retour réseau.
 */
export async function mediaDeps(): Promise<MediaDeps> {
  const supabase = await createServerClient();
  const repository = new SupabaseMediaRepository(supabase);

  return {
    read: repository,
    write: repository,
    storage: new SupabaseStorage(supabase),
  };
}

/**
 * Le port de LECTURE seul.
 *
 * Une page qui affiche une grille n'a aucune raison de recevoir un objet
 * capable de supprimer. C'est le « I » de SOLID appliqué à la racine de
 * composition, et pas seulement aux interfaces : le type ne le permet pas.
 */
export async function mediaReadPort(): Promise<MediaReadPort> {
  return new SupabaseMediaRepository(await createServerClient());
}
