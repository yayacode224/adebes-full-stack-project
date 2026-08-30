import type {
  CoreValue,
  CreateCoreValue,
  UpdateCoreValue,
} from "../cms/entities/core-value";
import type {
  CoreValueReadPort,
  CoreValueWritePort,
} from "../cms/ports/core-value.port";
import type { ListFilter } from "../shared/pagination";

/**
 * Dépôt de valeurs en mémoire.
 *
 * Contrepartie du principe de substitution de Liskov (§7 du Rapport 1) : cette
 * implémentation et celle de Supabase sont interchangeables. Les cas d'usage
 * tournent sur celle-ci en test, sur l'autre en production, sans une ligne de
 * différence dans le domaine.
 *
 * ⚠️  Ce fichier ne doit RIEN importer d'autre que le domaine : ni Supabase, ni
 * Next.js, ni bibliothèque de test. C'est ce qui lui permet de tourner partout,
 * y compris dans un simple script Node.
 *
 * ⚠️  `filtrer()` IGNORE `filter.status`, exactement comme le dépôt Supabase.
 * Les deux doivent se comporter pareil, y compris sur ce qu'ils ne font pas :
 * si celui-ci filtrait sur un champ absent et renvoyait le vide, un cas d'usage
 * validé en mémoire se comporterait autrement en production.
 */
export class InMemoryCoreValueRepository
  implements CoreValueReadPort, CoreValueWritePort
{
  private lignes: CoreValue[] = [];
  private compteur = 0;

  constructor(initiales: CoreValue[] = []) {
    this.lignes = initiales.map((valeur) => ({ ...valeur }));
  }

  // --- Lecture -------------------------------------------------------------

  async findAll(filter: ListFilter = {}): Promise<CoreValue[]> {
    let resultat = this.filtrer(filter);

    const colonne = filter.sortBy ?? "position";
    const sens = filter.sortDirection === "desc" ? -1 : 1;

    resultat = [...resultat].sort((a, b) => {
      const va = a[colonne as keyof CoreValue];
      const vb = b[colonne as keyof CoreValue];

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

    return resultat.map((valeur) => ({ ...valeur }));
  }

  async findById(id: string): Promise<CoreValue | null> {
    const trouvee = this.lignes.find((valeur) => valeur.id === id);
    return trouvee ? { ...trouvee } : null;
  }

  async findVisible(limit = 50): Promise<CoreValue[]> {
    return this.lignes
      .filter((valeur) => valeur.isVisible)
      .sort((a, b) => a.position - b.position)
      .slice(0, limit)
      .map((valeur) => ({ ...valeur }));
  }

  async count(filter: ListFilter = {}): Promise<number> {
    return this.filtrer(filter).length;
  }

  // --- Écriture ------------------------------------------------------------

  async create(input: CreateCoreValue): Promise<CoreValue> {
    this.compteur += 1;
    const maintenant = new Date().toISOString();

    const creee: CoreValue = {
      id: `mem-core-value-${this.compteur}`,
      title: input.title,
      description: input.description,
      icon: input.icon,
      tone: input.tone,
      position: input.position ?? this.lignes.length + 1,
      isVisible: input.isVisible ?? true,
      createdAt: maintenant,
      updatedAt: maintenant,
    };

    this.lignes.push(creee);
    return { ...creee };
  }

  async update(id: string, input: UpdateCoreValue): Promise<CoreValue> {
    const index = this.lignes.findIndex((valeur) => valeur.id === id);
    if (index === -1) throw new Error(`Valeur introuvable : ${id}`);

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
    this.lignes = this.lignes.filter((valeur) => valeur.id !== id);
  }

  async reorder(orderedIds: string[]): Promise<void> {
    // Renumérotation de 1 à N, comme la fonction SQL `reorder_rows()`.
    orderedIds.forEach((id, index) => {
      const ligne = this.lignes.find((valeur) => valeur.id === id);
      if (ligne) ligne.position = index + 1;
    });
  }

  async setVisibility(id: string, isVisible: boolean): Promise<CoreValue> {
    return this.update(id, { isVisible });
  }

  // --- Interne -------------------------------------------------------------

  private filtrer(filter: ListFilter): CoreValue[] {
    let resultat = this.lignes;

    if (filter.search) {
      const q = filter.search.toLowerCase();
      resultat = resultat.filter(
        (valeur) =>
          valeur.title.toLowerCase().includes(q) ||
          valeur.description.toLowerCase().includes(q),
      );
    }

    return resultat;
  }
}
