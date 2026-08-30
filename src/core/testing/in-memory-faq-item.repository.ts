import type { ContentStatus } from "../cms/entities/content-status";
import type {
  CreateFaqItem,
  FaqItem,
  FaqTopic,
  UpdateFaqItem,
} from "../cms/entities/faq-item";
import type {
  FaqItemReadPort,
  FaqItemWritePort,
} from "../cms/ports/faq-item.port";
import type { ListFilter } from "../shared/pagination";

/**
 * Dépôt de questions fréquentes en mémoire.
 *
 * Contrepartie du principe de substitution de Liskov (§7 du Rapport 1) : cette
 * implémentation et celle de Supabase sont interchangeables. Les cas d'usage
 * tournent sur celle-ci en test, sur l'autre en production, sans une ligne de
 * différence dans le domaine.
 *
 * ⚠️  Ce fichier ne doit RIEN importer d'autre que le domaine : ni Supabase, ni
 * Next.js, ni bibliothèque de test. C'est ce qui lui permet de tourner partout,
 * y compris dans un simple script Node.
 */
export class InMemoryFaqItemRepository
  implements FaqItemReadPort, FaqItemWritePort
{
  private lignes: FaqItem[] = [];
  private compteur = 0;

  constructor(initiales: FaqItem[] = []) {
    this.lignes = initiales.map((question) => ({
      ...question,
      // Le tableau est copié, pas partagé : sans cela, une modification des
      // puces d'une ligne rendue toucherait aussi les données de départ du
      // test, et l'échec serait imputé au cas d'usage.
      bullets: [...question.bullets],
    }));
  }

  // --- Lecture -------------------------------------------------------------

  async findAll(filter: ListFilter = {}): Promise<FaqItem[]> {
    let resultat = this.filtrer(filter);

    const colonne = filter.sortBy ?? "position";
    const sens = filter.sortDirection === "desc" ? -1 : 1;

    resultat = [...resultat].sort((a, b) => {
      const va = a[colonne as keyof FaqItem];
      const vb = b[colonne as keyof FaqItem];

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

    return resultat.map((question) => this.copie(question));
  }

  async findById(id: string): Promise<FaqItem | null> {
    const trouvee = this.lignes.find((question) => question.id === id);
    return trouvee ? this.copie(trouvee) : null;
  }

  async findPublished(
    options: { topic?: FaqTopic; limit?: number } = {},
  ): Promise<FaqItem[]> {
    const { topic, limit = 100 } = options;

    return this.lignes
      .filter((question) => question.status === "published")
      .filter((question) => topic === undefined || question.topic === topic)
      .sort((a, b) => a.position - b.position)
      .slice(0, limit)
      .map((question) => this.copie(question));
  }

  async count(filter: ListFilter = {}): Promise<number> {
    return this.filtrer(filter).length;
  }

  // --- Écriture ------------------------------------------------------------

  async create(input: CreateFaqItem): Promise<FaqItem> {
    this.compteur += 1;
    const maintenant = new Date().toISOString();

    const creee: FaqItem = {
      id: `mem-faq-item-${this.compteur}`,
      question: input.question,
      answer: input.answer,
      bullets: [...(input.bullets ?? [])],
      topic: input.topic,
      position: input.position ?? this.lignes.length + 1,
      status: input.status ?? "draft",
      createdAt: maintenant,
      updatedAt: maintenant,
    };

    this.lignes.push(creee);
    return this.copie(creee);
  }

  async update(id: string, input: UpdateFaqItem): Promise<FaqItem> {
    const index = this.lignes.findIndex((question) => question.id === id);
    if (index === -1) throw new Error(`Question introuvable : ${id}`);

    // `undefined` signifie « champ non transmis », pas « effacer ».
    const champs = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined),
    );

    this.lignes[index] = {
      ...this.lignes[index]!,
      ...champs,
      updatedAt: new Date().toISOString(),
    };
    return this.copie(this.lignes[index]!);
  }

  async delete(id: string): Promise<void> {
    this.lignes = this.lignes.filter((question) => question.id !== id);
  }

  async reorder(orderedIds: string[]): Promise<void> {
    // Renumérotation de 1 à N, comme la fonction SQL `reorder_rows()`.
    orderedIds.forEach((id, index) => {
      const ligne = this.lignes.find((question) => question.id === id);
      if (ligne) ligne.position = index + 1;
    });
  }

  async setStatus(id: string, status: ContentStatus): Promise<FaqItem> {
    return this.update(id, { status });
  }

  // --- Interne -------------------------------------------------------------

  private copie(question: FaqItem): FaqItem {
    return { ...question, bullets: [...question.bullets] };
  }

  private filtrer(filter: ListFilter): FaqItem[] {
    let resultat = this.lignes;

    if (filter.status) {
      resultat = resultat.filter((question) => question.status === filter.status);
    }

    if (filter.search) {
      const q = filter.search.toLowerCase();
      resultat = resultat.filter(
        (question) =>
          question.question.toLowerCase().includes(q) ||
          question.answer.toLowerCase().includes(q),
      );
    }

    return resultat;
  }
}
