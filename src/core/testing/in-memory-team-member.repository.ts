import type { ContentStatus } from "../cms/entities/content-status";
import type {
  CreateTeamMember,
  TeamMember,
  UpdateTeamMember,
} from "../cms/entities/team-member";
import type {
  TeamMemberReadPort,
  TeamMemberWritePort,
} from "../cms/ports/team-member.port";
import type { ListFilter } from "../shared/pagination";

/**
 * Dépôt de membres de l'équipe en mémoire.
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
export class InMemoryTeamMemberRepository
  implements TeamMemberReadPort, TeamMemberWritePort
{
  private lignes: TeamMember[] = [];
  private compteur = 0;

  constructor(initiales: TeamMember[] = []) {
    this.lignes = initiales.map((membre) => ({ ...membre }));
  }

  // --- Lecture -------------------------------------------------------------

  async findAll(filter: ListFilter = {}): Promise<TeamMember[]> {
    let resultat = this.filtrer(filter);

    const colonne = filter.sortBy ?? "position";
    const sens = filter.sortDirection === "desc" ? -1 : 1;

    resultat = [...resultat].sort((a, b) => {
      const va = a[colonne as keyof TeamMember];
      const vb = b[colonne as keyof TeamMember];

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

    return resultat.map((membre) => ({ ...membre }));
  }

  async findById(id: string): Promise<TeamMember | null> {
    const trouve = this.lignes.find((membre) => membre.id === id);
    return trouve ? { ...trouve } : null;
  }

  async findPublished(limit = 100): Promise<TeamMember[]> {
    return this.lignes
      .filter((membre) => membre.status === "published")
      .sort((a, b) => a.position - b.position)
      .slice(0, limit)
      .map((membre) => ({ ...membre }));
  }

  async count(filter: ListFilter = {}): Promise<number> {
    return this.filtrer(filter).length;
  }

  // --- Écriture ------------------------------------------------------------

  async create(input: CreateTeamMember): Promise<TeamMember> {
    this.compteur += 1;
    const maintenant = new Date().toISOString();

    const cree: TeamMember = {
      id: `mem-team-member-${this.compteur}`,
      name: input.name,
      role: input.role,
      bio: input.bio ?? null,
      photoMediaId: input.photoMediaId ?? null,
      position: input.position ?? this.lignes.length + 1,
      status: input.status ?? "draft",
      createdAt: maintenant,
      updatedAt: maintenant,
    };

    this.lignes.push(cree);
    return { ...cree };
  }

  async update(id: string, input: UpdateTeamMember): Promise<TeamMember> {
    const index = this.lignes.findIndex((membre) => membre.id === id);
    if (index === -1) throw new Error(`Membre introuvable : ${id}`);

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
    this.lignes = this.lignes.filter((membre) => membre.id !== id);
  }

  async reorder(orderedIds: string[]): Promise<void> {
    // Renumérotation de 1 à N, comme la fonction SQL `reorder_rows()`.
    orderedIds.forEach((id, index) => {
      const ligne = this.lignes.find((membre) => membre.id === id);
      if (ligne) ligne.position = index + 1;
    });
  }

  async setStatus(id: string, status: ContentStatus): Promise<TeamMember> {
    return this.update(id, { status });
  }

  // --- Interne -------------------------------------------------------------

  private filtrer(filter: ListFilter): TeamMember[] {
    let resultat = this.lignes;

    if (filter.status) {
      resultat = resultat.filter((membre) => membre.status === filter.status);
    }

    if (filter.search) {
      const q = filter.search.toLowerCase();
      resultat = resultat.filter(
        (membre) =>
          membre.name.toLowerCase().includes(q) ||
          membre.role.toLowerCase().includes(q) ||
          (membre.bio ?? "").toLowerCase().includes(q),
      );
    }

    return resultat;
  }
}
