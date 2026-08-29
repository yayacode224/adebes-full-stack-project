import type { ContentStatus } from "../cms/entities/content-status";
import type {
  CreateTestimonial,
  Testimonial,
  UpdateTestimonial,
} from "../cms/entities/testimonial";
import type {
  TestimonialReadPort,
  TestimonialWritePort,
} from "../cms/ports/testimonial.port";
import type { ListFilter } from "../shared/pagination";

/**
 * Dépôt de témoignages en mémoire.
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
export class InMemoryTestimonialRepository
  implements TestimonialReadPort, TestimonialWritePort
{
  private lignes: Testimonial[] = [];
  private compteur = 0;

  constructor(initiales: Testimonial[] = []) {
    this.lignes = initiales.map((t) => ({ ...t }));
  }

  // --- Lecture -------------------------------------------------------------

  async findAll(filter: ListFilter = {}): Promise<Testimonial[]> {
    let resultat = this.filtrer(filter);

    const colonne = filter.sortBy ?? "position";
    const sens = filter.sortDirection === "desc" ? -1 : 1;

    resultat = [...resultat].sort((a, b) => {
      const va = a[colonne as keyof Testimonial];
      const vb = b[colonne as keyof Testimonial];

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

    return resultat.map((t) => ({ ...t }));
  }

  async findById(id: string): Promise<Testimonial | null> {
    const trouve = this.lignes.find((t) => t.id === id);
    return trouve ? { ...trouve } : null;
  }

  async findPublished(limit = 100): Promise<Testimonial[]> {
    return this.lignes
      .filter((t) => t.status === "published")
      .sort((a, b) => a.position - b.position)
      .slice(0, limit)
      .map((t) => ({ ...t }));
  }

  async count(filter: ListFilter = {}): Promise<number> {
    return this.filtrer(filter).length;
  }

  async countByProgramme(programmeId: string): Promise<number> {
    return this.lignes.filter((t) => t.programmeId === programmeId).length;
  }

  // --- Écriture ------------------------------------------------------------

  async create(input: CreateTestimonial): Promise<Testimonial> {
    this.compteur += 1;
    const maintenant = new Date().toISOString();

    const cree: Testimonial = {
      id: `mem-testimonial-${this.compteur}`,
      quote: input.quote,
      authorName: input.authorName,
      authorRole: input.authorRole,
      programmeId: input.programmeId ?? null,
      photoMediaId: input.photoMediaId ?? null,
      hasConsent: input.hasConsent,
      position: input.position ?? this.lignes.length + 1,
      status: input.status ?? "draft",
      createdAt: maintenant,
      updatedAt: maintenant,
    };

    this.lignes.push(cree);
    return { ...cree };
  }

  async update(id: string, input: UpdateTestimonial): Promise<Testimonial> {
    const index = this.lignes.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Témoignage introuvable : ${id}`);

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
    this.lignes = this.lignes.filter((t) => t.id !== id);
  }

  async reorder(orderedIds: string[]): Promise<void> {
    // Renumérotation de 1 à N, comme la fonction SQL `reorder_rows()`.
    orderedIds.forEach((id, index) => {
      const ligne = this.lignes.find((t) => t.id === id);
      if (ligne) ligne.position = index + 1;
    });
  }

  async setStatus(id: string, status: ContentStatus): Promise<Testimonial> {
    return this.update(id, { status });
  }

  // --- Interne -------------------------------------------------------------

  private filtrer(filter: ListFilter): Testimonial[] {
    let resultat = this.lignes;

    if (filter.status) {
      resultat = resultat.filter((t) => t.status === filter.status);
    }

    if (filter.search) {
      const q = filter.search.toLowerCase();
      resultat = resultat.filter(
        (t) =>
          t.quote.toLowerCase().includes(q) ||
          t.authorName.toLowerCase().includes(q) ||
          t.authorRole.toLowerCase().includes(q),
      );
    }

    return resultat;
  }
}
