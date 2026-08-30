import type { ContentStatus } from "../cms/entities/content-status";
import type {
  CreateGalleryCategory,
  CreateGalleryItem,
  GalleryCategory,
  GalleryItem,
  UpdateGalleryCategory,
  UpdateGalleryItem,
} from "../cms/entities/gallery";
import type {
  GalleryCategoryReadPort,
  GalleryCategoryWritePort,
  GalleryItemReadPort,
  GalleryItemWritePort,
} from "../cms/ports/gallery.port";
import type { ListFilter } from "../shared/pagination";

/**
 * Dépôts de galerie en mémoire.
 *
 * Contrepartie du principe de substitution de Liskov (§7 du Rapport 1) : ces
 * implémentations et celles de Supabase sont interchangeables. Les cas d'usage
 * tournent sur celles-ci en test, sur les autres en production, sans une ligne
 * de différence dans le domaine.
 *
 * ⚠️  Ce fichier ne doit RIEN importer d'autre que le domaine : ni Supabase, ni
 * Next.js, ni bibliothèque de test. C'est ce qui lui permet de tourner partout,
 * y compris dans un simple script Node.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LA MÊME LIMITE DE RECHERCHE QUE LE VRAI DÉPÔT
 * ---------------------------------------------------------------------------
 * `filter.search` est **ignoré**, exactement comme dans
 * `gallery-item.repository.ts` — un élément de galerie ne porte aucun texte à
 * chercher (voir l'en-tête de ce dépôt). Un dépôt de test plus généreux que le
 * vrai valide des cas d'usage qui échoueront en production : c'est la leçon de
 * l'écart nº 132 (Lot 8G), et elle vaut aussi pour ce qu'un dépôt NE FAIT PAS.
 */
export class InMemoryGalleryItemRepository
  implements GalleryItemReadPort, GalleryItemWritePort
{
  private lignes: GalleryItem[] = [];
  private compteur = 0;

  constructor(initiaux: GalleryItem[] = []) {
    this.lignes = initiaux.map((element) => ({ ...element }));
  }

  // --- Lecture -------------------------------------------------------------

  async findAll(filter: ListFilter = {}): Promise<GalleryItem[]> {
    let resultat = this.filtrer(filter);

    const colonne = filter.sortBy ?? "position";
    const sens = filter.sortDirection === "desc" ? -1 : 1;

    resultat = [...resultat].sort((a, b) => {
      const va = a[colonne as keyof GalleryItem];
      const vb = b[colonne as keyof GalleryItem];

      if (typeof va === "number" && typeof vb === "number") {
        return (va - vb) * sens;
      }
      return String(va).localeCompare(String(vb), "fr") * sens;
    });

    if (filter.page !== undefined || filter.pageSize !== undefined) {
      const taille = filter.pageSize ?? 20;
      const debut = ((filter.page ?? 1) - 1) * taille;
      resultat = resultat.slice(debut, debut + taille);
    }

    return resultat.map((element) => ({ ...element }));
  }

  async findById(id: string): Promise<GalleryItem | null> {
    const trouve = this.lignes.find((element) => element.id === id);
    return trouve ? { ...trouve } : null;
  }

  async findPublished(options: { limit?: number } = {}): Promise<GalleryItem[]> {
    const { limit = 200 } = options;

    return this.lignes
      .filter((element) => element.status === "published")
      .sort((a, b) => a.position - b.position)
      .slice(0, limit)
      .map((element) => ({ ...element }));
  }

  async count(filter: ListFilter = {}): Promise<number> {
    return this.filtrer(filter).length;
  }

  async countByCategory(categoryId: string): Promise<number> {
    return this.lignes.filter((element) => element.categoryId === categoryId)
      .length;
  }

  async countByMedia(mediaId: string): Promise<number> {
    return this.lignes.filter((element) => element.mediaId === mediaId).length;
  }

  // --- Écriture ------------------------------------------------------------

  async create(input: CreateGalleryItem): Promise<GalleryItem> {
    this.compteur += 1;
    const maintenant = new Date().toISOString();

    const cree: GalleryItem = {
      id: `mem-gallery-item-${this.compteur}`,
      mediaId: input.mediaId,
      categoryId: input.categoryId ?? null,
      position: input.position ?? this.lignes.length + 1,
      status: input.status ?? "draft",
      createdAt: maintenant,
      updatedAt: maintenant,
    };

    this.lignes.push(cree);
    return { ...cree };
  }

  async update(id: string, input: UpdateGalleryItem): Promise<GalleryItem> {
    const index = this.lignes.findIndex((element) => element.id === id);
    if (index === -1) throw new Error(`Élément de galerie introuvable : ${id}`);

    // `undefined` signifie « champ non transmis », pas « effacer ».
    // ⚠️  `null` DOIT passer : c'est ainsi qu'on retire une catégorie.
    const champs = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined),
    );

    this.lignes[index] = {
      ...this.lignes[index]!,
      ...champs,
      updatedAt: new Date().toISOString(),
    };
    return { ...this.lignes[index]! };
  }

  async delete(id: string): Promise<void> {
    this.lignes = this.lignes.filter((element) => element.id !== id);
  }

  async reorder(orderedIds: string[]): Promise<void> {
    // Renumérotation de 1 à N, comme la fonction SQL `reorder_rows()`.
    orderedIds.forEach((id, index) => {
      const ligne = this.lignes.find((element) => element.id === id);
      if (ligne) ligne.position = index + 1;
    });
  }

  async setStatus(id: string, status: ContentStatus): Promise<GalleryItem> {
    return this.update(id, { status });
  }

  // --- Interne -------------------------------------------------------------

  private filtrer(filter: ListFilter): GalleryItem[] {
    let resultat = this.lignes;

    if (filter.status) {
      resultat = resultat.filter((element) => element.status === filter.status);
    }

    // `filter.search` est volontairement ignoré — voir l'en-tête de la classe.

    return resultat;
  }
}

/**
 * Dépôt de catégories de galerie en mémoire.
 *
 * L'ordre rendu par `findAll` est `position` puis `label`, exactement comme le
 * dépôt Supabase : deux catégories partageant une position se départagent par
 * leur nom, sans quoi l'ordre varierait d'un appel à l'autre.
 */
export class InMemoryGalleryCategoryRepository
  implements GalleryCategoryReadPort, GalleryCategoryWritePort
{
  private lignes: GalleryCategory[] = [];
  private compteur = 0;

  constructor(initiales: GalleryCategory[] = []) {
    this.lignes = initiales.map((categorie) => ({ ...categorie }));
  }

  async findAll(): Promise<GalleryCategory[]> {
    return [...this.lignes]
      .sort(
        (a, b) =>
          a.position - b.position || a.label.localeCompare(b.label, "fr"),
      )
      .map((categorie) => ({ ...categorie }));
  }

  async findById(id: string): Promise<GalleryCategory | null> {
    const trouvee = this.lignes.find((categorie) => categorie.id === id);
    return trouvee ? { ...trouvee } : null;
  }

  async findBySlug(slug: string): Promise<GalleryCategory | null> {
    const trouvee = this.lignes.find((categorie) => categorie.slug === slug);
    return trouvee ? { ...trouvee } : null;
  }

  async create(input: CreateGalleryCategory): Promise<GalleryCategory> {
    this.compteur += 1;
    const maintenant = new Date().toISOString();

    const creee: GalleryCategory = {
      id: `mem-gallery-category-${this.compteur}`,
      slug: input.slug ?? `categorie-${this.compteur}`,
      label: input.label,
      tone: input.tone ?? "neutral",
      position: input.position ?? this.lignes.length + 1,
      createdAt: maintenant,
      updatedAt: maintenant,
    };

    this.lignes.push(creee);
    return { ...creee };
  }

  async update(
    id: string,
    input: UpdateGalleryCategory,
  ): Promise<GalleryCategory> {
    const index = this.lignes.findIndex((categorie) => categorie.id === id);
    if (index === -1) throw new Error(`Catégorie introuvable : ${id}`);

    const champs = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined),
    );

    this.lignes[index] = {
      ...this.lignes[index]!,
      ...champs,
      updatedAt: new Date().toISOString(),
    };
    return { ...this.lignes[index]! };
  }

  async delete(id: string): Promise<void> {
    this.lignes = this.lignes.filter((categorie) => categorie.id !== id);
  }

  async reorder(orderedIds: string[]): Promise<void> {
    orderedIds.forEach((id, index) => {
      const ligne = this.lignes.find((categorie) => categorie.id === id);
      if (ligne) ligne.position = index + 1;
    });
  }
}
