import type { CreateStatRow, Stat, UpdateStat } from "../cms/entities/stat";
import type { StatReadPort, StatWritePort } from "../cms/ports/stat.port";
import type { ListFilter } from "../shared/pagination";

/**
 * Dépôt de chiffres clés en mémoire.
 *
 * Contrepartie du principe de substitution de Liskov (§7 du Rapport 1) : cette
 * implémentation et celle de Supabase sont interchangeables. Les cas d'usage
 * tournent sur celle-ci en test, sur l'autre en production, sans une ligne de
 * différence dans le domaine.
 *
 * ⚠️  Ce fichier ne doit RIEN importer d'autre que le domaine : ni Supabase, ni
 * Next.js, ni bibliothèque de test.
 *
 * ⚠️  `filtrer()` IGNORE `filter.status`, exactement comme le dépôt Supabase.
 * Les deux doivent se comporter pareil, y compris sur ce qu'ils ne font pas.
 *
 * ⚠️  LA RECHERCHE PORTE SUR `label` ET `note`, PAS SUR `value`. Le vrai dépôt
 * fait un `ilike` sur deux colonnes texte ; chercher « 30 » n'y trouve donc pas
 * le chiffre 30, et ne doit pas le trouver ici non plus. Un dépôt en mémoire
 * plus généreux que le vrai valide des cas d'usage qui échoueront en
 * production.
 */
export class InMemoryStatRepository implements StatReadPort, StatWritePort {
  private lignes: Stat[] = [];
  private compteur = 0;

  constructor(initiales: Stat[] = []) {
    this.lignes = initiales.map((stat) => ({ ...stat }));
  }

  // --- Lecture -------------------------------------------------------------

  async findAll(filter: ListFilter = {}): Promise<Stat[]> {
    let resultat = this.filtrer(filter);

    const colonne = filter.sortBy ?? "position";
    const sens = filter.sortDirection === "desc" ? -1 : 1;

    resultat = [...resultat].sort((a, b) => {
      const va = a[colonne as keyof Stat];
      const vb = b[colonne as keyof Stat];

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

    return resultat.map((stat) => ({ ...stat }));
  }

  async findById(id: string): Promise<Stat | null> {
    const trouve = this.lignes.find((stat) => stat.id === id);
    return trouve ? { ...trouve } : null;
  }

  async findByKey(key: string): Promise<Stat | null> {
    const trouve = this.lignes.find((stat) => stat.key === key);
    return trouve ? { ...trouve } : null;
  }

  async findVisible(limit = 50): Promise<Stat[]> {
    return this.lignes
      .filter((stat) => stat.isVisible)
      .sort((a, b) => a.position - b.position)
      .slice(0, limit)
      .map((stat) => ({ ...stat }));
  }

  async count(filter: ListFilter = {}): Promise<number> {
    return this.filtrer(filter).length;
  }

  // --- Écriture ------------------------------------------------------------

  async create(input: CreateStatRow): Promise<Stat> {
    this.compteur += 1;
    const maintenant = new Date().toISOString();

    const cree: Stat = {
      id: `mem-stat-${this.compteur}`,
      key: input.key,
      label: input.label,
      /*
        ⚠️  `input.value` est recopié TEL QUEL, `null` compris. Écrire
        `input.value ?? 0` ici passerait tous les tests de création et
        fabriquerait un chiffre — c'est précisément l'erreur que le dépôt en
        mémoire doit être incapable de commettre, puisque c'est lui qui sert à
        prouver que le domaine ne la commet pas.
      */
      value: input.value,
      suffix: input.suffix,
      icon: input.icon,
      note: input.note,
      toConfirm: input.toConfirm ?? false,
      position: input.position ?? this.lignes.length + 1,
      isVisible: input.isVisible ?? true,
      createdAt: maintenant,
      updatedAt: maintenant,
    };

    this.lignes.push(cree);
    return { ...cree };
  }

  async update(id: string, input: UpdateStat): Promise<Stat> {
    const index = this.lignes.findIndex((stat) => stat.id === id);
    if (index === -1) throw new Error(`Chiffre introuvable : ${id}`);

    /*
      ⚠️  `undefined` signifie « champ non transmis », `null` signifie
      « chiffre pas encore disponible ». Le filtre porte donc sur `undefined`
      SEUL — un `Boolean(v)` ou un `v != null` effacerait la possibilité même
      de repasser un chiffre à l'état inconnu, qui est la fonction principale
      de cet écran.
    */
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
    this.lignes = this.lignes.filter((stat) => stat.id !== id);
  }

  async reorder(orderedIds: string[]): Promise<void> {
    // Renumérotation de 1 à N, comme la fonction SQL `reorder_rows()`.
    orderedIds.forEach((id, index) => {
      const ligne = this.lignes.find((stat) => stat.id === id);
      if (ligne) ligne.position = index + 1;
    });
  }

  async setVisibility(id: string, isVisible: boolean): Promise<Stat> {
    return this.update(id, { isVisible });
  }

  // --- Interne -------------------------------------------------------------

  private filtrer(filter: ListFilter): Stat[] {
    let resultat = this.lignes;

    if (filter.search) {
      const q = filter.search.toLowerCase();
      resultat = resultat.filter(
        (stat) =>
          stat.label.toLowerCase().includes(q) ||
          (stat.note ?? "").toLowerCase().includes(q),
      );
    }

    return resultat;
  }
}
