import { z } from "zod";

import { NAVIGATION_MENUS } from "../entities/navigation-item";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SCHÉMAS DE VALIDATION DE LA NAVIGATION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §10.1 du Rapport 2. Reprise de `src/lib/navigation.ts` (`NavItem`).
 *
 * ---------------------------------------------------------------------------
 * `href` : NI `z.url()` NI VIDE — UN CHEMIN INTERNE, LE PLUS SOUVENT
 * ---------------------------------------------------------------------------
 * Les 12 entrées migrées au seed sont toutes des chemins relatifs (`/don`,
 * `/a-propos`) : une URL absolue exigerait `https://…`, que la quasi-totalité
 * des liens de ce site n'ont pas. Le champ accepte donc soit un chemin
 * commençant par `/`, soit une URL absolue — ce que couvre `isExternal`, qui
 * décide de l'ouverture dans un nouvel onglet, jamais de la forme du lien.
 *
 * ---------------------------------------------------------------------------
 * `menu` EST ABSENT DE `updateNavigationItemSchema`
 * ---------------------------------------------------------------------------
 * Comme `UpdateNavigationItem` (entité) : déplacer une entrée d'un menu à un
 * autre n'est pas une fonctionnalité de ce lot — chaque écran affiche et
 * réordonne UN menu à la fois (§10.1). Le champ reste immuable après création,
 * exactement comme `menu` sur `page_sections` n'existe pas parce qu'une
 * section n'appartient qu'à une page.
 */

const hrefSchema = z
  .string("Le lien est obligatoire.")
  .trim()
  .min(1, "Le lien est obligatoire.")
  .max(300, "Ce lien est trop long (300 caractères maximum).")
  .refine(
    (valeur) => valeur.startsWith("/") || /^https?:\/\//i.test(valeur),
    "Ce lien doit commencer par « / » (page du site) ou par « http:// » / « https:// ».",
  );

const labelSchema = z
  .string("Le libellé est obligatoire.")
  .trim()
  .min(1, "Le libellé est obligatoire.")
  .max(60, "Ce libellé est trop long (60 caractères maximum).");

/** `null` → aucune aide ; `""` n'est jamais stocké (voir le mapper). */
const descriptionSchema = z
  .string("Description invalide.")
  .trim()
  .max(160, "Cette description est trop longue (160 caractères maximum).")
  .nullable();

export const navigationItemSchema = z.object(
  {
    id: z.uuid("Identifiant de navigation invalide."),
    menu: z.enum(NAVIGATION_MENUS, { message: "Menu inconnu." }),
    label: labelSchema,
    href: hrefSchema,
    description: descriptionSchema,
    parentId: z.uuid("Identifiant de parent invalide.").nullable(),
    position: z.number("Position invalide.").int().min(0),
    isExternal: z.boolean("Choix invalide."),
    isVisible: z.boolean("Choix invalide."),
    createdAt: z.string("Date de création invalide."),
    updatedAt: z.string("Date de modification invalide."),
  },
  { message: "Entrée de navigation invalide." },
);

/**
 * Création. `parentId` est omis : aucun écran de ce lot ne propose de choisir
 * un parent (voir l'avertissement de `navigation-item.ts`). `position` est
 * calculée. `isVisible` naît à `true` — une entrée qu'on vient d'ajouter au
 * menu est, par définition, une entrée qu'on veut y voir.
 */
export const createNavigationItemSchema = navigationItemSchema
  .omit({ id: true, parentId: true, createdAt: true, updatedAt: true })
  .extend({
    position: z.number("Position invalide.").int().min(0).optional(),
    isExternal: z.boolean("Choix invalide.").default(false),
    isVisible: z.boolean("Choix invalide.").default(true),
  });

/** Modification partielle. `menu` n'y figure pas — voir l'avertissement ci-dessus. */
export const updateNavigationItemSchema = navigationItemSchema
  .omit({ id: true, menu: true, parentId: true, createdAt: true, updatedAt: true })
  .partial()
  .extend({ id: z.uuid("Identifiant de navigation invalide.") });

/**
 * Le schéma du FORMULAIRE — distinct des deux précédents pour la raison des
 * écarts nº 50, 58, 71 et 86 : `<SchemaForm>` exige une entrée identique à la
 * sortie, que `.default(...)` et `.partial()` ne garantissent pas.
 *
 * `menu` n'y figure pas non plus : le formulaire vit dans l'onglet d'un menu
 * déjà choisi, qui le fournit en dehors de la saisie.
 */
export const navigationItemFormSchema = z.object(
  {
    label: navigationItemSchema.shape.label,
    href: navigationItemSchema.shape.href,
    description: navigationItemSchema.shape.description,
    isExternal: navigationItemSchema.shape.isExternal,
    isVisible: navigationItemSchema.shape.isVisible,
  },
  { message: "Formulaire de navigation invalide." },
);

/** Désigne une entrée — suppression, lecture d'une fiche. */
export const navigationItemIdSchema = z.object(
  { id: z.uuid("Identifiant de navigation invalide.") },
  { message: "Identifiant de navigation invalide." },
);

/** Affichage ou retrait du menu, sans toucher au reste du contenu. */
export const setNavigationItemVisibilitySchema = z.object(
  {
    id: z.uuid("Identifiant de navigation invalide."),
    isVisible: z.boolean("Choix invalide."),
  },
  { message: "Changement de visibilité invalide." },
);

/**
 * Réordonnancement — D'UN SEUL MENU À LA FOIS.
 *
 * `menu` est transmis pour que le cas d'usage vérifie que CHAQUE identifiant
 * de la liste appartient bien à ce menu (voir l'avertissement de
 * `navigation-item.ts` sur `reorder_rows()`, qui n'a aucune notion de menu).
 * Ce schéma ne vérifie que la forme ; l'appartenance est une règle métier,
 * donc du ressort du cas d'usage.
 */
export const reorderNavigationItemsSchema = z.object(
  {
    menu: z.enum(NAVIGATION_MENUS, { message: "Menu inconnu." }),
    orderedIds: z
      .array(z.uuid("Identifiant de navigation invalide."), {
        message: "La liste des entrées à réordonner est absente.",
      })
      .min(1, "Aucune entrée à réordonner."),
  },
  { message: "Liste de réordonnancement invalide." },
);

export type NavigationItemInput = z.infer<typeof navigationItemSchema>;
export type CreateNavigationItemInput = z.infer<typeof createNavigationItemSchema>;
export type UpdateNavigationItemInput = z.infer<typeof updateNavigationItemSchema>;
export type NavigationItemFormInput = z.infer<typeof navigationItemFormSchema>;
