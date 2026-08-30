import type { ContentStatus } from "./content-status";
import type { MediaTone } from "./media-tone";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LA GALERIE — un élément, et la catégorie qui le classe
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8H du Rapport 2 : « assemblage médiathèque + catégorie · remplace la lecture
 * disque de `src/content/galerie.ts` ».
 *
 * ---------------------------------------------------------------------------
 * ⚠️  C'EST LA PREMIÈRE COLLECTION DU LOT 8 DONT LA SOURCE DE VÉRITÉ ÉTAIT UN
 *     DOSSIER, PAS UN TABLEAU TYPESCRIPT
 * ---------------------------------------------------------------------------
 * Les sept collections précédentes migraient un tableau littéral. Celle-ci
 * migrait un `fs.readdirSync(public/images/galerie)` et une convention de
 * nommage : `categorie-NN.jpg`, la catégorie étant le préfixe du fichier.
 *
 * Le §8H l'écrit : « la convention de nommage `categorie-NN.jpg` disparaît :
 * la catégorie devient une colonne. Le fichier `legendes.json` est migré vers
 * `media_assets.alt_text`. » Trois conséquences, et elles se tiennent :
 *
 *   1. **Un élément de galerie n'a pas de titre.** Il n'a même pas de champ de
 *      texte : `gallery_items` porte `media_id`, `category_id`, `position` et
 *      `status`, et rien d'autre (migration 0005). Ce qu'on lit à l'écran — le
 *      texte alternatif — appartient au MÉDIA, pas à l'élément. C'est ce qui
 *      donne son sens à la phrase du §8H sur `legendes.json` : la légende suit
 *      la photo, pas sa place dans la grille. Une même photo employée deux fois
 *      ne peut pas se décrire de deux façons.
 *   2. **`media_id` est `not null`.** Il n'existe donc pas d'élément de galerie
 *      « en attente d'image » : la photo précède l'élément, toujours. C'est la
 *      seule collection du Lot 8 dans ce cas — partout ailleurs le média est
 *      facultatif et le rendu retombe sur `MediaPlaceholder`.
 *   3. **La question du pont vers `/public` ne se pose PAS comme aux écarts
 *      nº 64, 75, 85 et 97.** Là-bas il s'agissait de garder un fichier affiché
 *      tant qu'aucun média n'était choisi. Ici, aucun élément n'existe tant
 *      qu'un média n'a pas été téléversé : un pont n'aurait rien à ponter. Les
 *      quatre photographies réelles ont donc été MIGRÉES — Storage,
 *      `media_assets`, puis `gallery_items` — plutôt que lues sur le disque.
 *
 * ---------------------------------------------------------------------------
 * LE GABARIT EST CELUI DES LOTS 8A–8D ET 8F, PAS CELUI DES LOTS 8E ET 8G
 * ---------------------------------------------------------------------------
 * Vérifié dans la migration 0005 plutôt que supposé : `gallery_items` porte une
 * colonne `status public.content_status not null default 'draft'`, un index
 * `(status, position)`, une politique publique `status = 'published'` (0009) et
 * le trigger `gallery_items_guard_publish` (0010). Cycle éditorial complet.
 *
 * `gallery_categories`, elle, n'a pas de statut : c'est une liste de libellés,
 * comme `article_categories` au Lot 8B.
 */

/* ═══════════════════════════════════════════════════════════════════════════
 * La catégorie
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Une catégorie de la galerie.
 *
 * Jumelle de `ArticleCategory` (Lot 8B) à une colonne près : `tone`. La teinte
 * n'est pas décorative — c'est elle qui donne sa couleur au `MediaPlaceholder`
 * affiché quand une image ne peut pas être chargée, et elle était déjà portée
 * par les quatre catégories du tableau TypeScript d'origine.
 */
export type GalleryCategory = {
  id: string;
  /** Adresse technique. Sert au rapprochement avec le seed, jamais à une URL. */
  slug: string;
  label: string;
  tone: MediaTone;
  position: number;
  createdAt: string;
  updatedAt: string;
};

/** Création d'une catégorie. `position` est calculée en fin de liste. */
export type CreateGalleryCategory = {
  label: string;
  /** Facultatif : dérivé du libellé s'il est absent. */
  slug?: string;
  tone?: MediaTone;
  position?: number;
};

export type UpdateGalleryCategory = Partial<
  Pick<GalleryCategory, "label" | "slug" | "tone" | "position">
>;

/**
 * La teinte d'un élément sans catégorie.
 *
 * `neutral` est la valeur par défaut de la colonne `gallery_categories.tone`
 * (migration 0005) et la seule des cinq qui n'affirme rien. Un élément non
 * classé ne doit pas emprunter la couleur d'une catégorie à laquelle il
 * n'appartient pas.
 */
export const TEINTE_SANS_CATEGORIE: MediaTone = "neutral";

/**
 * Ce qu'on écrit à la place d'un libellé de catégorie absent.
 *
 * ⚠️  Descendu dans le domaine pour la même raison que `VALEUR_ABSENTE` au
 * Lot 8G (écart nº 133) : quatre endroits l'affichent — la colonne du tableau,
 * la fiche, le filtre du formulaire et le bandeau de la liste. Quatre recopies
 * auraient fini par diverger, et une case vide se lit comme un défaut de
 * chargement plutôt que comme une absence décidée.
 */
export const CATEGORIE_ABSENTE = "Sans catégorie";

/* ═══════════════════════════════════════════════════════════════════════════
 * L'élément
 * ═══════════════════════════════════════════════════════════════════════════ */

export type GalleryItem = {
  id: string;
  /**
   * La photo. `not null` en base, avec `on delete restrict`.
   *
   * ⚠️  C'est la seule référence obligatoire vers un média de tout le projet.
   * Supprimer le média est refusé par PostgreSQL tant que l'élément existe —
   * la médiathèque le signale déjà comme un usage BLOQUANT (Lot 7).
   */
  mediaId: string;
  /**
   * La catégorie, ou `null`.
   *
   * La colonne est nullable (migration 0005) et le reste : un élément sans
   * catégorie est un état légitime, pas une erreur de saisie. Ce qu'il implique
   * est réel et se dit — voir `apparaitDansUnFiltre()`.
   */
  categoryId: string | null;
  position: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
};

/**
 * Champs saisis à la création.
 *
 * `status` est ABSENT — même raisonnement qu'aux Lots 8C, 8D et 8F (écarts
 * nº 83, 94 et celui du Lot 8F) : le laisser dans le contrat d'entrée
 * donnerait à un administrateur, qui passe le trigger `guard_publish`, le moyen
 * de mettre une photo en ligne sans jamais traverser `setGalleryItemStatus`.
 */
export type CreateGalleryItem = Omit<
  GalleryItem,
  "id" | "createdAt" | "updatedAt" | "position" | "status"
> & {
  position?: number;
  status?: ContentStatus;
};

/** Modification partielle. `id` identifie la cible, il n'est jamais modifiable. */
export type UpdateGalleryItem = Partial<
  Omit<GalleryItem, "id" | "createdAt" | "updatedAt">
>;

/* ═══════════════════════════════════════════════════════════════════════════
 * Ce que le site montre
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Cet élément peut-il être atteint par un bouton de filtre de `/galerie` ?
 *
 * ---------------------------------------------------------------------------
 * ⚠️  UN ÉLÉMENT SANS CATÉGORIE EST VISIBLE, MAIS SEULEMENT DANS « TOUS »
 * ---------------------------------------------------------------------------
 * La grille publique porte un bouton par catégorie, plus « Tous ». Un élément
 * non classé apparaît donc dans la grille non filtrée et disparaît dès qu'un
 * filtre est choisi — état parfaitement cohérent, et invisible depuis le
 * dashboard si personne ne l'écrit.
 *
 * Les deux autres voies ont été écartées :
 *
 *   * **un bouton « Sans catégorie » sur la page publique** exposerait au
 *     visiteur une lacune de classement interne, qui ne le regarde pas ;
 *   * **rendre la catégorie obligatoire au formulaire** inventerait une
 *     contrainte que la base ne porte pas et interdirait d'enregistrer un
 *     brouillon avant d'avoir décidé du classement — c'est la faute que le
 *     Lot 8D a refusé de commettre (écart nº 93 : un brouillon a le droit
 *     d'être incomplet).
 *
 * Ce qui est fait à la place, doctrine des Lots 8E et 8F : **informer plutôt
 * qu'interdire**. La colonne « Catégorie » de la liste écrit « Sans catégorie »
 * en toutes lettres, le bandeau les compte, et la fiche dit la conséquence.
 */
export function apparaitDansUnFiltre(item: GalleryItem): boolean {
  return item.categoryId !== null;
}

/**
 * Les catégories qui ont au moins un élément publié, dans leur ordre.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI LA PAGE PUBLIQUE NE MONTRE PAS TOUTES LES CATÉGORIES
 * ---------------------------------------------------------------------------
 * `gallery_categories` est en lecture publique SANS condition
 * (`using (true)`, migration 0009) : les quatre lignes sont lisibles même si
 * aucune photo ne les emploie. Rendre un bouton pour chacune donnerait un
 * filtre qui mène à une grille vide — un cul-de-sac que le visiteur prend pour
 * une panne, et le jumeau exact de la section vide que les Lots 8B à 8G font
 * disparaître plutôt que d'annoncer un contenu absent.
 *
 * ⚠️  La parité avec le site actuel est conservée et a été vérifiée, pas
 * supposée : les quatre catégories portent chacune une photo migrée, donc les
 * quatre boutons sont rendus, comme aujourd'hui.
 *
 * Reçoit les éléments PUBLIÉS — c'est le contrat de `findPublished`. Cette
 * fonction ne filtre pas sur le statut : le faire ici masquerait un dépôt qui
 * renverrait des brouillons.
 */
export function categoriesAffichees(
  publies: readonly GalleryItem[],
  categories: readonly GalleryCategory[],
): GalleryCategory[] {
  const employees = new Set(
    publies
      .map((item) => item.categoryId)
      .filter((id): id is string => id !== null),
  );

  return categories.filter((categorie) => employees.has(categorie.id));
}

/**
 * La teinte d'un élément : celle de sa catégorie, ou la neutre.
 *
 * Le tableau TypeScript d'origine faisait déjà porter la teinte par la
 * CATÉGORIE et non par la photo (`galerieCategories`, `content/galerie.ts`).
 * La règle est reprise telle quelle plutôt que déplacée sur `gallery_items`,
 * qui n'a de toute façon pas de colonne pour l'accueillir.
 */
export function teinteDeLElement(
  item: GalleryItem,
  categories: readonly GalleryCategory[],
): MediaTone {
  if (!item.categoryId) return TEINTE_SANS_CATEGORIE;

  const categorie = categories.find((c) => c.id === item.categoryId);
  return categorie?.tone ?? TEINTE_SANS_CATEGORIE;
}

/**
 * Le libellé de la catégorie d'un élément, ou `CATEGORIE_ABSENTE`.
 *
 * ⚠️  Une catégorie introuvable rend le même libellé qu'une catégorie absente,
 * et c'est volontaire : `category_id` est en `on delete restrict`, une
 * référence morte n'est donc pas atteignable par la base. Si elle l'était
 * malgré tout — lecture partielle, migration à venir — écrire « Sans
 * catégorie » reste vrai du point de vue de l'utilisateur, alors qu'un
 * identifiant brut à l'écran ne dirait rien à personne.
 */
export function libelleDeLaCategorie(
  item: GalleryItem,
  categories: readonly GalleryCategory[],
): string {
  if (!item.categoryId) return CATEGORIE_ABSENTE;

  const categorie = categories.find((c) => c.id === item.categoryId);
  return categorie?.label ?? CATEGORIE_ABSENTE;
}
