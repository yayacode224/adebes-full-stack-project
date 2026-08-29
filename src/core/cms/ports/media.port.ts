import type {
  CreateMediaAsset,
  MediaAsset,
  MediaBucket,
  MediaFilter,
  MediaUsage,
  UpdateMediaAsset,
} from "../entities/media-asset";

/**
 * Ports de la médiathèque.
 *
 * Même découpage que `programme.port.ts` (ségrégation des interfaces), avec
 * une troisième interface propre à ce module : le STOCKAGE.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI UN PORT DE STOCKAGE SÉPARÉ DU DÉPÔT
 * ---------------------------------------------------------------------------
 * Un téléversement touche DEUX systèmes : le bucket (l'octet) et la table
 * `media_assets` (le catalogue). Ce sont deux ressources distinctes, sans
 * transaction commune — et c'est justement ce que le cas d'usage doit gérer :
 * si l'inscription au catalogue échoue APRÈS l'écriture du fichier, il faut
 * retirer le fichier, sinon le bucket accumule des orphelins que personne ne
 * voit ni ne peut supprimer depuis le dashboard.
 *
 * Cette compensation est une règle métier. Elle a donc sa place dans un cas
 * d'usage, ce qui suppose que le domaine puisse commander les deux systèmes —
 * donc deux ports.
 */

export interface MediaReadPort {
  findAll(filter?: MediaFilter): Promise<MediaAsset[]>;
  findById(id: string): Promise<MediaAsset | null>;
  /** Plusieurs médias d'un coup — évite N requêtes pour une grille de vignettes. */
  findByIds(ids: string[]): Promise<MediaAsset[]>;
  count(filter?: MediaFilter): Promise<number>;
  /** Dossiers existants, dédoublonnés et triés — alimente le filtre. */
  listFolders(): Promise<string[]>;
  /**
   * Où ce média est-il employé ?
   *
   * §7 du Rapport 2 : « Supprimer un média utilisé affiche la liste des usages
   * et demande confirmation. » Sans cette lecture, l'utilisateur supprime à
   * l'aveugle et découvre le trou sur le site public.
   */
  findUsages(id: string): Promise<MediaUsage[]>;
}

export interface MediaWritePort {
  create(input: CreateMediaAsset): Promise<MediaAsset>;
  update(id: string, input: UpdateMediaAsset): Promise<MediaAsset>;
  delete(id: string): Promise<void>;
}

/**
 * Le stockage des octets.
 *
 * Aucune méthode ne renvoie d'URL : la résolution en URL appartient à la
 * présentation (`src/lib/media-url.ts`), et le §7.3 en fait une propriété du
 * système — « renvoie un mediaId, jamais une URL ».
 */
export interface MediaStoragePort {
  /**
   * Fabrique le chemin de destination : `<dossier>/<uuid>.<ext>`.
   *
   * ⚠️  Le nom d'origine n'est JAMAIS réutilisé (§3.5 du Rapport 2), et
   * l'extension est déduite du type MIME réel, jamais de celle reçue.
   */
  buildPath(input: {
    bucket: MediaBucket;
    mimeType: string;
    folder?: string | null;
  }): string;

  upload(input: {
    bucket: MediaBucket;
    path: string;
    file: Blob | ArrayBuffer;
    mimeType: string;
  }): Promise<{ path: string }>;

  remove(bucket: MediaBucket, paths: string[]): Promise<void>;
}

/** Regroupement de confort — voir `ProgrammeDeps` pour le raisonnement. */
export type MediaDeps = {
  read: MediaReadPort;
  write: MediaWritePort;
  storage: MediaStoragePort;
};
