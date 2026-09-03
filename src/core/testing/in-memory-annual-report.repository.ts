import type {
  AnnualReport,
  CreateAnnualReport,
  UpdateAnnualReport,
} from "../cms/entities/annual-report";
import type { ContentStatus } from "../cms/entities/content-status";
import type {
  AnnualReportReadPort,
  AnnualReportWritePort,
} from "../cms/ports/annual-report.port";
import type { ListFilter } from "../shared/pagination";

/**
 * Dépôt de rapports annuels en mémoire.
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
 * ---------------------------------------------------------------------------
 * ⚠️  IL DOIT RESSEMBLER AU VRAI JUSQUE DANS CE QU'IL NE FAIT PAS
 * ---------------------------------------------------------------------------
 * Écarts nº 109, 132 et 141 : la recherche porte ici sur le TITRE et sur
 * l'ANNÉE écrite en chiffres, exactement comme le dépôt Supabase — pas sur
 * autre chose, pas sur plus de colonnes. Un dépôt de test plus généreux que le
 * vrai fait passer en vert des cas d'usage qui échoueront en production.
 *
 * ⚠️  Il n'impose PAS l'unicité de `year`, et c'est délibéré : la contrainte
 * vit en base (`unique`) et le refus utile vit dans le cas d'usage, qui
 * interroge `findByYear` AVANT d'écrire. Un dépôt en mémoire qui lèverait de
 * son côté rendrait indiscernables « le cas d'usage a fait son travail » et
 * « le dépôt a rattrapé son oubli » — c'est-à-dire exactement ce que la recette
 * doit distinguer.
 */
export class InMemoryAnnualReportRepository
  implements AnnualReportReadPort, AnnualReportWritePort
{
  private lignes: AnnualReport[] = [];
  private compteur = 0;

  constructor(initiales: AnnualReport[] = []) {
    this.lignes = initiales.map((rapport) => ({ ...rapport }));
  }

  // --- Lecture -------------------------------------------------------------

  async findAll(filter: ListFilter = {}): Promise<AnnualReport[]> {
    let resultat = this.filtrer(filter);

    const colonne = filter.sortBy ?? "position";
    const sens = filter.sortDirection === "desc" ? -1 : 1;

    resultat = [...resultat].sort((a, b) => {
      const va = a[colonne as keyof AnnualReport];
      const vb = b[colonne as keyof AnnualReport];

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

    return resultat.map((rapport) => ({ ...rapport }));
  }

  async findById(id: string): Promise<AnnualReport | null> {
    const trouve = this.lignes.find((rapport) => rapport.id === id);
    return trouve ? { ...trouve } : null;
  }

  async findByYear(year: number): Promise<AnnualReport | null> {
    const trouve = this.lignes.find((rapport) => rapport.year === year);
    return trouve ? { ...trouve } : null;
  }

  async findPublished(options: { limit?: number } = {}): Promise<AnnualReport[]> {
    const { limit = 100 } = options;

    return this.lignes
      .filter((rapport) => rapport.status === "published")
      .sort((a, b) => a.position - b.position)
      .slice(0, limit)
      .map((rapport) => ({ ...rapport }));
  }

  async count(filter: ListFilter = {}): Promise<number> {
    return this.filtrer(filter).length;
  }

  async countByMedia(mediaId: string): Promise<number> {
    return this.lignes.filter((rapport) => rapport.documentMediaId === mediaId)
      .length;
  }

  // --- Écriture ------------------------------------------------------------

  async create(input: CreateAnnualReport): Promise<AnnualReport> {
    this.compteur += 1;
    const maintenant = new Date().toISOString();

    const cree: AnnualReport = {
      id: `mem-annual-report-${this.compteur}`,
      year: input.year,
      title: input.title,
      documentMediaId: input.documentMediaId ?? null,
      position: input.position ?? this.lignes.length + 1,
      status: input.status ?? "draft",
      createdAt: maintenant,
      updatedAt: maintenant,
    };

    this.lignes.push(cree);
    return { ...cree };
  }

  async update(id: string, input: UpdateAnnualReport): Promise<AnnualReport> {
    const index = this.lignes.findIndex((rapport) => rapport.id === id);
    if (index === -1) throw new Error(`Rapport introuvable : ${id}`);

    /*
      `undefined` signifie « champ non transmis », pas « effacer ».

      ⚠️  Le filtre porte sur `undefined` et JAMAIS sur la véracité de la
      valeur : `documentMediaId: null` doit passer — c'est la seule façon de
      retirer un PDF. Un `.filter(([, v]) => v)` aurait rendu le retrait
      impossible, en silence, et le vrai dépôt fait la même distinction.
    */
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
    this.lignes = this.lignes.filter((rapport) => rapport.id !== id);
  }

  async reorder(orderedIds: string[]): Promise<void> {
    // Renumérotation de 1 à N, comme la fonction SQL `reorder_rows()`.
    orderedIds.forEach((id, index) => {
      const ligne = this.lignes.find((rapport) => rapport.id === id);
      if (ligne) ligne.position = index + 1;
    });
  }

  async setStatus(id: string, status: ContentStatus): Promise<AnnualReport> {
    return this.update(id, { status });
  }

  // --- Interne -------------------------------------------------------------

  private filtrer(filter: ListFilter): AnnualReport[] {
    let resultat = this.lignes;

    if (filter.status) {
      resultat = resultat.filter((rapport) => rapport.status === filter.status);
    }

    if (filter.search) {
      const q = filter.search.toLowerCase();
      resultat = resultat.filter(
        (rapport) =>
          rapport.title.toLowerCase().includes(q) ||
          String(rapport.year).includes(q),
      );
    }

    return resultat;
  }
}
