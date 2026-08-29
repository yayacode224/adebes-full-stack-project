import type { ContentStatus } from "../cms/entities/content-status";
import type {
  CreateProgramme,
  Programme,
  UpdateProgramme,
} from "../cms/entities/programme";
import type {
  ProgrammeReadPort,
  ProgrammeWritePort,
} from "../cms/ports/programme.port";
import type { ListFilter } from "../shared/pagination";

/**
 * Dépôt de programmes en mémoire.
 *
 * C'est la contrepartie du principe de substitution de Liskov (§7 du
 * Rapport 1) : cette implémentation et `SupabaseProgrammeRepository` sont
 * interchangeables. Les cas d'usage tournent sur celle-ci en test, sur l'autre
 * en production, sans une ligne de différence dans le domaine.
 *
 * Sans elle, tester `createProgramme` exigerait une base PostgreSQL, des
 * migrations, un nettoyage entre chaque test — et personne n'écrirait de test.
 *
 * ⚠️  Ce fichier ne doit RIEN importer d'autre que le domaine : ni Supabase,
 * ni Next.js, ni bibliothèque de test. C'est ce qui lui permet de tourner
 * partout, y compris dans un simple script Node.
 */
export class InMemoryProgrammeRepository
  implements ProgrammeReadPort, ProgrammeWritePort
{
  private lignes: Programme[] = [];
  private compteur = 0;

  constructor(initiales: Programme[] = []) {
    this.lignes = initiales.map((p) => ({ ...p }));
  }

  // --- Lecture -------------------------------------------------------------

  async findAll(filter: ListFilter = {}): Promise<Programme[]> {
    let resultat = this.filtrer(filter);

    const colonne = filter.sortBy ?? "position";
    const sens = filter.sortDirection === "desc" ? -1 : 1;
    resultat = [...resultat].sort((a, b) => {
      const va = a[colonne as keyof Programme];
      const vb = b[colonne as keyof Programme];
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * sens;
      return String(va).localeCompare(String(vb), "fr") * sens;
    });

    // La pagination n'est appliquée que si elle est demandée : les cas d'usage
    // internes (réordonnancement, renumérotation) ont besoin de la liste
    // complète.
    if (filter.page !== undefined || filter.pageSize !== undefined) {
      const taille = filter.pageSize ?? 20;
      const debut = ((filter.page ?? 1) - 1) * taille;
      resultat = resultat.slice(debut, debut + taille);
    }

    return resultat.map((p) => ({ ...p }));
  }

  async findBySlug(slug: string): Promise<Programme | null> {
    const trouve = this.lignes.find((p) => p.slug === slug);
    return trouve ? { ...trouve } : null;
  }

  async findById(id: string): Promise<Programme | null> {
    const trouve = this.lignes.find((p) => p.id === id);
    return trouve ? { ...trouve } : null;
  }

  async count(filter: ListFilter = {}): Promise<number> {
    return this.filtrer(filter).length;
  }

  async listSlugs(): Promise<string[]> {
    return this.lignes.map((p) => p.slug);
  }

  // --- Écriture ------------------------------------------------------------

  async create(input: CreateProgramme): Promise<Programme> {
    this.compteur += 1;
    const maintenant = new Date().toISOString();
    const cree: Programme = {
      id: `mem-${this.compteur}`,
      slug: input.slug ?? "",
      title: input.title,
      shortTitle: input.shortTitle,
      summary: input.summary,
      icon: input.icon,
      tone: input.tone,
      actions: [...input.actions],
      publics: [...input.publics],
      besoins: [...input.besoins],
      benevolatLabel: input.benevolatLabel,
      coverMediaId: input.coverMediaId ?? null,
      galleryMediaIds: [...(input.galleryMediaIds ?? [])],
      body: input.body ?? null,
      position: input.position ?? this.lignes.length + 1,
      status: input.status ?? "draft",
      createdAt: maintenant,
      updatedAt: maintenant,
    };
    this.lignes.push(cree);
    return { ...cree };
  }

  async update(id: string, input: UpdateProgramme): Promise<Programme> {
    const index = this.lignes.findIndex((p) => p.id === id);
    if (index === -1) throw new Error(`Programme introuvable : ${id}`);

    // `undefined` signifie « champ non transmis », pas « effacer ». Sans ce
    // filtrage, une mise à jour partielle écraserait de `undefined` tous les
    // champs absents — le bug classique du PATCH.
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
    this.lignes = this.lignes.filter((p) => p.id !== id);
  }

  async reorder(orderedIds: string[]): Promise<void> {
    // Renumérotation de 1 à N, comme la fonction SQL `reorder_rows()`.
    orderedIds.forEach((id, index) => {
      const ligne = this.lignes.find((p) => p.id === id);
      if (ligne) ligne.position = index + 1;
    });
  }

  async setStatus(id: string, status: ContentStatus): Promise<Programme> {
    return this.update(id, { status });
  }

  // --- Interne -------------------------------------------------------------

  private filtrer(filter: ListFilter): Programme[] {
    let resultat = this.lignes;

    if (filter.status) {
      resultat = resultat.filter((p) => p.status === filter.status);
    }

    if (filter.search) {
      const q = filter.search.toLowerCase();
      resultat = resultat.filter(
        (p) =>
          p.title.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q),
      );
    }

    return resultat;
  }
}
