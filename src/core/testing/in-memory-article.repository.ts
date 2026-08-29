import type {
  Article,
  ArticleCategory,
  CreateArticle,
  CreateArticleCategory,
  UpdateArticle,
  UpdateArticleCategory,
} from "../cms/entities/article";
import type {
  ArticleCategoryReadPort,
  ArticleCategoryWritePort,
  ArticleReadPort,
  ArticleWritePort,
} from "../cms/ports/article.port";
import type { ContentStatus } from "../cms/entities/content-status";
import type { ListFilter } from "../shared/pagination";

/**
 * Dépôts d'actualités en mémoire.
 *
 * Contrepartie du principe de substitution de Liskov (§7 du Rapport 1) : ces
 * implémentations et celles de Supabase sont interchangeables. Les cas d'usage
 * tournent sur celles-ci en test, sur les autres en production, sans une ligne
 * de différence dans le domaine.
 *
 * ⚠️  Ce fichier ne doit RIEN importer d'autre que le domaine : ni Supabase, ni
 * Next.js, ni bibliothèque de test. C'est ce qui lui permet de tourner partout,
 * y compris dans un simple script Node.
 */
export class InMemoryArticleRepository
  implements ArticleReadPort, ArticleWritePort
{
  private lignes: Article[] = [];
  private compteur = 0;

  constructor(initiales: Article[] = []) {
    this.lignes = initiales.map((a) => ({ ...a }));
  }

  // --- Lecture -------------------------------------------------------------

  async findAll(filter: ListFilter = {}): Promise<Article[]> {
    let resultat = this.filtrer(filter);

    const colonne = filter.sortBy ?? "publishedAt";
    const sens = filter.sortDirection === "desc" ? -1 : 1;

    resultat = [...resultat].sort((a, b) => {
      const va = a[colonne as keyof Article];
      const vb = b[colonne as keyof Article];

      // Les brouillons n'ont pas de date : ils passent APRÈS, quel que soit le
      // sens du tri — c'est le `nullsFirst: false` du dépôt Supabase.
      if (va === null && vb === null) return 0;
      if (va === null) return 1;
      if (vb === null) return -1;

      if (typeof va === "number" && typeof vb === "number") return (va - vb) * sens;
      return String(va).localeCompare(String(vb), "fr") * sens;
    });

    if (filter.page !== undefined || filter.pageSize !== undefined) {
      const taille = filter.pageSize ?? 20;
      const debut = ((filter.page ?? 1) - 1) * taille;
      resultat = resultat.slice(debut, debut + taille);
    }

    return resultat.map((a) => ({ ...a }));
  }

  async findBySlug(slug: string): Promise<Article | null> {
    const trouve = this.lignes.find((a) => a.slug === slug);
    return trouve ? { ...trouve } : null;
  }

  async findById(id: string): Promise<Article | null> {
    const trouve = this.lignes.find((a) => a.id === id);
    return trouve ? { ...trouve } : null;
  }

  async findPublished(limit = 100): Promise<Article[]> {
    const maintenant = Date.now();

    return this.lignes
      .filter(
        (a) =>
          a.status === "published" &&
          (a.publishedAt === null || Date.parse(a.publishedAt) <= maintenant),
      )
      .sort((a, b) => {
        const da = a.publishedAt ? Date.parse(a.publishedAt) : 0;
        const db = b.publishedAt ? Date.parse(b.publishedAt) : 0;
        return db - da;
      })
      .slice(0, limit)
      .map((a) => ({ ...a }));
  }

  async count(filter: ListFilter = {}): Promise<number> {
    return this.filtrer(filter).length;
  }

  async countByCategory(categoryId: string): Promise<number> {
    return this.lignes.filter((a) => a.categoryId === categoryId).length;
  }

  async listSlugs(): Promise<string[]> {
    return this.lignes.map((a) => a.slug);
  }

  // --- Écriture ------------------------------------------------------------

  async create(input: CreateArticle): Promise<Article> {
    this.compteur += 1;
    const maintenant = new Date().toISOString();

    const cree: Article = {
      id: `mem-article-${this.compteur}`,
      slug: input.slug ?? "",
      title: input.title,
      excerpt: input.excerpt,
      body: [...input.body],
      categoryId: input.categoryId ?? null,
      coverMediaId: input.coverMediaId ?? null,
      readingMinutes: input.readingMinutes ?? null,
      isPlaceholder: input.isPlaceholder,
      publishedAt: input.publishedAt ?? null,
      status: input.status ?? "draft",
      authorId: input.authorId ?? null,
      createdAt: maintenant,
      updatedAt: maintenant,
    };

    this.lignes.push(cree);
    return { ...cree };
  }

  async update(id: string, input: UpdateArticle): Promise<Article> {
    const index = this.lignes.findIndex((a) => a.id === id);
    if (index === -1) throw new Error(`Article introuvable : ${id}`);

    // `undefined` signifie « champ non transmis », pas « effacer ».
    const champs = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined),
    );

    this.lignes[index] = {
      ...this.lignes[index],
      ...champs,
      updatedAt: new Date().toISOString(),
    };
    return { ...this.lignes[index] };
  }

  async delete(id: string): Promise<void> {
    this.lignes = this.lignes.filter((a) => a.id !== id);
  }

  async setStatus(
    id: string,
    status: ContentStatus,
    publishedAt?: string | null,
  ): Promise<Article> {
    return publishedAt === undefined
      ? this.update(id, { status })
      : this.update(id, { status, publishedAt });
  }

  // --- Interne -------------------------------------------------------------

  private filtrer(filter: ListFilter): Article[] {
    let resultat = this.lignes;

    if (filter.status) {
      resultat = resultat.filter((a) => a.status === filter.status);
    }

    if (filter.search) {
      const q = filter.search.toLowerCase();
      resultat = resultat.filter(
        (a) =>
          a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q),
      );
    }

    return resultat;
  }
}

/** Dépôt de catégories en mémoire. */
export class InMemoryArticleCategoryRepository
  implements ArticleCategoryReadPort, ArticleCategoryWritePort
{
  private lignes: ArticleCategory[] = [];
  private compteur = 0;

  constructor(initiales: ArticleCategory[] = []) {
    this.lignes = initiales.map((c) => ({ ...c }));
  }

  async findAll(): Promise<ArticleCategory[]> {
    return [...this.lignes]
      .sort((a, b) => a.position - b.position || a.label.localeCompare(b.label, "fr"))
      .map((c) => ({ ...c }));
  }

  async findById(id: string): Promise<ArticleCategory | null> {
    const trouve = this.lignes.find((c) => c.id === id);
    return trouve ? { ...trouve } : null;
  }

  async findBySlug(slug: string): Promise<ArticleCategory | null> {
    const trouve = this.lignes.find((c) => c.slug === slug);
    return trouve ? { ...trouve } : null;
  }

  async create(input: CreateArticleCategory): Promise<ArticleCategory> {
    this.compteur += 1;
    const maintenant = new Date().toISOString();

    const creee: ArticleCategory = {
      id: `mem-cat-${this.compteur}`,
      slug: input.slug ?? "",
      label: input.label,
      position: input.position ?? this.lignes.length + 1,
      createdAt: maintenant,
      updatedAt: maintenant,
    };

    this.lignes.push(creee);
    return { ...creee };
  }

  async update(
    id: string,
    input: UpdateArticleCategory,
  ): Promise<ArticleCategory> {
    const index = this.lignes.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`Catégorie introuvable : ${id}`);

    const champs = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined),
    );

    this.lignes[index] = {
      ...this.lignes[index],
      ...champs,
      updatedAt: new Date().toISOString(),
    };
    return { ...this.lignes[index] };
  }

  async delete(id: string): Promise<void> {
    this.lignes = this.lignes.filter((c) => c.id !== id);
  }

  async reorder(orderedIds: string[]): Promise<void> {
    // Renumérotation de 1 à N, comme la fonction SQL `reorder_rows()`.
    orderedIds.forEach((id, index) => {
      const ligne = this.lignes.find((c) => c.id === id);
      if (ligne) ligne.position = index + 1;
    });
  }
}
