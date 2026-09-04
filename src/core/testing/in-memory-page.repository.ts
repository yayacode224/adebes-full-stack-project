import type { ContentStatus } from "../cms/entities/content-status";
import type {
  CreatePage,
  CreatePageSection,
  Page,
  PageSection,
  PageWithSections,
  UpdatePage,
  UpdatePageSection,
} from "../cms/entities/page";
import type {
  PageReadPort,
  PageWritePort,
  SectionReadPort,
  SectionWritePort,
} from "../cms/ports/page.port";
import type { ListFilter } from "../shared/pagination";

/**
 * Dépôt de pages et de sections en mémoire.
 *
 * Contrepartie du principe de substitution de Liskov (§7 du Rapport 1) : cette
 * implémentation et celle de Supabase sont interchangeables.
 *
 * ⚠️  Ce fichier ne doit RIEN importer d'autre que le domaine : ni Supabase, ni
 * Next.js, ni bibliothèque de test.
 *
 * ⚠️  UNE SEULE CLASSE POUR LES QUATRE PORTS. Les quatre sont séparés dans
 * `page.port.ts` — pour les permissions et pour l'indépendance des écritures —
 * mais les tester exige un état PARTAGÉ : une section ajoutée par le port
 * d'écriture doit être vue par le port de lecture de pages, sans quoi
 * `setPageStatus()` ne verrait jamais les sections qu'il doit contrôler.
 *
 * C'est le cas le plus courant du patron : plusieurs interfaces, un seul
 * agrégat de données.
 */
export class InMemoryPageRepository implements PageReadPort, PageWritePort {
  private pages: Page[] = [];
  private sections: PageSection[] = [];
  private compteur = 0;

  constructor(pages: Page[] = [], sections: PageSection[] = []) {
    this.pages = pages.map((page) => ({ ...page }));
    this.sections = sections.map((section) => ({ ...section }));
  }

  // --- Lecture des pages ---------------------------------------------------

  async findAll(filter: ListFilter = {}): Promise<Page[]> {
    let resultat = [...this.pages];

    const recherche = filter.search?.trim().toLowerCase();
    if (recherche) {
      resultat = resultat.filter(
        (page) =>
          page.title.toLowerCase().includes(recherche) ||
          page.route.toLowerCase().includes(recherche),
      );
    }

    if (filter.status) {
      resultat = resultat.filter((page) => page.status === filter.status);
    }

    const colonne = (filter.sortBy ?? "title") as keyof Page;
    const sens = filter.sortDirection === "desc" ? -1 : 1;

    resultat.sort((a, b) => {
      const va = a[colonne];
      const vb = b[colonne];
      if (typeof va === "number" && typeof vb === "number") {
        return (va - vb) * sens;
      }
      return String(va).localeCompare(String(vb), "fr") * sens;
    });

    return resultat.map((page) => ({ ...page }));
  }

  async findById(id: string): Promise<Page | null> {
    const trouvee = this.pages.find((page) => page.id === id);
    return trouvee ? { ...trouvee } : null;
  }

  async findBySlug(slug: string): Promise<Page | null> {
    const trouvee = this.pages.find((page) => page.slug === slug);
    return trouvee ? { ...trouvee } : null;
  }

  async findByRoute(route: string): Promise<Page | null> {
    const trouvee = this.pages.find((page) => page.route === route);
    return trouvee ? { ...trouvee } : null;
  }

  async count(filter: ListFilter = {}): Promise<number> {
    return (await this.findAll({ ...filter, page: undefined, pageSize: undefined }))
      .length;
  }

  async findPublishedByRoute(route: string): Promise<PageWithSections | null> {
    const page = this.pages.find(
      (candidate) => candidate.route === route && candidate.status === "published",
    );
    if (!page) return null;

    return {
      ...page,
      sections: this.sections
        .filter((section) => section.pageId === page.id && section.isVisible)
        .sort((a, b) => a.position - b.position)
        .map((section) => ({ ...section })),
    };
  }

  async countSectionsByPage(): Promise<Map<string, number>> {
    const compte = new Map<string, number>();
    for (const section of this.sections) {
      compte.set(section.pageId, (compte.get(section.pageId) ?? 0) + 1);
    }
    return compte;
  }

  // --- Écriture des pages --------------------------------------------------

  async create(input: CreatePage): Promise<Page> {
    const maintenant = new Date().toISOString();
    const page: Page = {
      id: this.prochainId("page"),
      slug: input.slug ?? "",
      route: input.route ?? "",
      title: input.title,
      // Une page naît toujours en brouillon — voir `CreatePage`.
      status: "draft",
      isSystem: false,
      metaTitle: input.metaTitle ?? null,
      metaDescription: input.metaDescription ?? null,
      ogMediaId: input.ogMediaId ?? null,
      publishedAt: null,
      createdAt: maintenant,
      updatedAt: maintenant,
    };
    this.pages.push(page);
    return { ...page };
  }

  async update(id: string, input: UpdatePage): Promise<Page> {
    const index = this.pages.findIndex((page) => page.id === id);
    if (index === -1) throw new Error("Page introuvable.");

    const suivante: Page = {
      ...this.pages[index]!,
      ...retirerIndefinis(input),
      updatedAt: new Date().toISOString(),
    };
    this.pages[index] = suivante;
    return { ...suivante };
  }

  async delete(id: string): Promise<void> {
    // Cascade, comme la contrainte `on delete cascade` de la migration 0006.
    this.sections = this.sections.filter((section) => section.pageId !== id);
    this.pages = this.pages.filter((page) => page.id !== id);
  }

  async setStatus(id: string, status: ContentStatus): Promise<Page> {
    const index = this.pages.findIndex((page) => page.id === id);
    if (index === -1) throw new Error("Page introuvable.");

    const actuelle = this.pages[index]!;
    const suivante: Page = {
      ...actuelle,
      status,
      /*
        `published_at` est posé à la PREMIÈRE publication et jamais recalculé —
        même règle qu'aux neuf collections de la série 8. Une page dépubliée
        puis republiée garde sa date d'origine : c'est celle qui a du sens pour
        un lecteur, pas celle du dernier aller-retour éditorial.
      */
      publishedAt:
        status === "published"
          ? (actuelle.publishedAt ?? new Date().toISOString())
          : actuelle.publishedAt,
      updatedAt: new Date().toISOString(),
    };
    this.pages[index] = suivante;
    return { ...suivante };
  }

  // --- Lecture des sections ------------------------------------------------

  async findByPage(pageId: string): Promise<PageSection[]> {
    return this.sections
      .filter((section) => section.pageId === pageId)
      .sort((a, b) => a.position - b.position)
      .map((section) => ({ ...section }));
  }

  async findSectionById(id: string): Promise<PageSection | null> {
    const trouvee = this.sections.find((section) => section.id === id);
    return trouvee ? { ...trouvee } : null;
  }

  // --- Écriture des sections -----------------------------------------------

  async createSection(input: CreatePageSection): Promise<PageSection> {
    const maintenant = new Date().toISOString();
    const section: PageSection = {
      id: this.prochainId("section"),
      pageId: input.pageId,
      blockType: input.blockType,
      position:
        input.position ??
        (await this.findByPage(input.pageId)).length + 1,
      content: input.content ?? {},
      isVisible: input.isVisible ?? true,
      createdAt: maintenant,
      updatedAt: maintenant,
    };
    this.sections.push(section);
    return { ...section };
  }

  async updateSection(
    id: string,
    input: UpdatePageSection,
  ): Promise<PageSection> {
    const index = this.sections.findIndex((section) => section.id === id);
    if (index === -1) throw new Error("Section introuvable.");

    const suivante: PageSection = {
      ...this.sections[index]!,
      ...retirerIndefinis(input),
      updatedAt: new Date().toISOString(),
    };
    this.sections[index] = suivante;
    return { ...suivante };
  }

  async deleteSection(id: string): Promise<void> {
    this.sections = this.sections.filter((section) => section.id !== id);
  }

  async reorder(orderedIds: string[]): Promise<void> {
    orderedIds.forEach((id, rang) => {
      const section = this.sections.find((candidate) => candidate.id === id);
      if (section) section.position = rang + 1;
    });
  }

  async insertAt(
    input: CreatePageSection,
    position: number,
  ): Promise<PageSection> {
    // Décalage des suivantes AVANT l'insertion : c'est ce que fait la fonction
    // SQL, et l'ordre des deux gestes est ce qui évite deux lignes à la même
    // position à mi-chemin.
    for (const section of this.sections) {
      if (section.pageId === input.pageId && section.position >= position) {
        section.position += 1;
      }
    }
    return this.createSection({ ...input, position });
  }

  private prochainId(prefixe: string): string {
    this.compteur += 1;
    // Forme d'UUID : les schémas Zod du projet valident `z.uuid()`, et un
    // identifiant de test qui ne passe pas la validation ferait échouer des
    // scénarios qui n'ont rien à voir avec ce qu'ils testent.
    const suffixe = String(this.compteur).padStart(12, "0");
    const bloc = prefixe === "page" ? "1111" : "2222";
    return `00000000-0000-4000-8${bloc.slice(1)}-${suffixe}`;
  }
}

/**
 * Retire les clés à `undefined` d'une modification partielle.
 *
 * Sans cela, `{ ...ligne, ...input }` écraserait un champ existant par
 * `undefined` dès qu'une clé est présente mais non renseignée — ce que
 * `Partial<T>` autorise et que PostgREST, lui, ne fait pas.
 */
function retirerIndefinis<T extends object>(input: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(input).filter(([, valeur]) => valeur !== undefined),
  ) as Partial<T>;
}

/**
 * ⚠️  ADAPTATEURS DE NOMS — deux ports déclarent `findById`, `create`,
 * `update` et `delete`.
 *
 * `PageReadPort.findById` et `SectionReadPort.findById` ne peuvent pas
 * coexister sur une même classe : ils portent le même nom et des types de
 * retour différents. La classe ci-dessus implémente donc les méthodes de page
 * sous leur nom et celles de section sous un nom préfixé
 * (`findSectionById`, `createSection`…), et ces deux fabriques rendent les
 * objets conformes aux interfaces.
 *
 * C'est le prix de la séparation des ports, et il est payé ici — dans le double
 * de test — plutôt que dans le domaine.
 */
export function sectionReadPort(depot: InMemoryPageRepository): SectionReadPort {
  return {
    findByPage: (pageId) => depot.findByPage(pageId),
    findById: (id) => depot.findSectionById(id),
  };
}

export function sectionWritePort(
  depot: InMemoryPageRepository,
): SectionWritePort {
  return {
    create: (input) => depot.createSection(input),
    update: (id, input) => depot.updateSection(id, input),
    delete: (id) => depot.deleteSection(id),
    reorder: (ids) => depot.reorder(ids),
    insertAt: (input, position) => depot.insertAt(input, position),
  };
}
