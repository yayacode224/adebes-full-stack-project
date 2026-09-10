"use client";

import { Button } from "@/components/ui/button";
import type { FieldDescriptor } from "@/core/cms/blocks/types";
import type { NavigationItem, NavigationMenu } from "@/core/cms/entities/navigation-item";
import {
  navigationItemFormSchema,
  type NavigationItemFormInput,
} from "@/core/cms/schemas/navigation-item.schema";
import {
  creerEntreeNavigationAction,
  modifierEntreeNavigationAction,
} from "@/server/actions/navigation.actions";

import { FormModal } from "../modals/form-modal";
import { SchemaForm } from "../forms/schema-form";

/**
 * Création / modification d'une entrée de navigation.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LA BARRE D'ENREGISTREMENT DE `<SchemaForm>` FAIT OFFICE DE PIED DE MODALE
 * ---------------------------------------------------------------------------
 * Le pied dédié de `<FormModal>` (prop `footer`) suppose un bouton extérieur
 * capable de déclencher la soumission du `<form>` rendu par `<SchemaForm>` —
 * ce qui exigerait un identifiant partagé entre les deux composants, qu'aucun
 * des deux n'expose aujourd'hui : cette composition précise n'a encore aucun
 * appelant dans le projet. Plutôt que d'élargir l'API de deux composants
 * partagés par onze écrans pour ce seul formulaire de cinq champs, la barre
 * native de `<SchemaForm>` (`showSaveBar` par défaut) reste en place — elle
 * est `sticky bottom-0` dans le corps DÉFILANT de la modale
 * (`form-modal.tsx`), ce qui produit visuellement le même résultat.
 *
 * Conséquence assumée : la confirmation « Quitter sans enregistrer ? » de
 * `<FormModal>` (déclenchée par sa prop `isDirty`, que ce formulaire ne lui
 * transmet pas) ne se déclenche pas ici. Cinq champs courts, aucun champ
 * `richtext` ni média : la perte possible est faible, à la différence des
 * formulaires de contenu qui justifient cette garde ailleurs.
 */
function champs(menu: NavigationMenu): readonly FieldDescriptor[] {
  return [
    { kind: "text", name: "label", label: "Libellé", required: true, maxLength: 60 },
    {
      kind: "text",
      name: "href",
      label: "Lien",
      required: true,
      placeholder: menu === "main" ? "/programmes" : "/don",
      hint: "Une page du site commence par « / » ; un site externe commence par « https:// ».",
    },
    {
      kind: "textarea",
      name: "description",
      label: "Aide affichée dans le menu",
      rows: 2,
      maxLength: 160,
      hint: "Laissez vide pour n'afficher que le libellé.",
    },
    {
      kind: "boolean",
      name: "isExternal",
      label: "Lien externe",
      hint: "S'ouvre dans un nouvel onglet.",
    },
    {
      kind: "boolean",
      name: "isVisible",
      label: "Afficher dans le menu",
    },
  ];
}

const CLES_FORMULAIRE = [
  "label",
  "href",
  "description",
  "isExternal",
  "isVisible",
] as const satisfies readonly (keyof NavigationItemFormInput)[];

const VALEURS_VIERGES: NavigationItemFormInput = {
  label: "",
  href: "",
  description: null,
  isExternal: false,
  isVisible: true,
};

export function NavigationItemFormModal({
  open,
  onOpenChange,
  menu,
  entree,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (ouvert: boolean) => void;
  menu: NavigationMenu;
  /** `undefined` = création. */
  entree?: NavigationItem;
  /**
   * Reçoit l'entrée créée ou modifiée — pas seulement « ça a marché ».
   *
   * ⚠️  `router.refresh()` (appelé par l'appelant) ne suffit pas ici : il
   * revalide l'ARBRE SERVEUR, mais `<NavigationMenuList>` garde sa propre
   * copie de la liste dans un `useState`, initialisée une fois au montage —
   * une nouvelle valeur de prop après coup ne la remet pas à jour. Sans ce
   * paramètre, une création réussie (le bandeau le confirme, la base
   * l'enregistre) restait invisible dans la liste jusqu'au rechargement
   * manuel de la page — trouvé par la recette navigateur du Lot 10 en
   * conditions réelles, jamais par le typage ni par un appel direct au cas
   * d'usage.
   */
  onSaved: (entreeEnregistree: NavigationItem) => void;
}) {
  const creation = entree === undefined;

  const valeursInitiales: NavigationItemFormInput = entree
    ? {
        label: entree.label,
        href: entree.href,
        description: entree.description,
        isExternal: entree.isExternal,
        isVisible: entree.isVisible,
      }
    : VALEURS_VIERGES;

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={creation ? "Ajouter une entrée" : `Modifier « ${entree.label} »`}
      description="Elle apparaît dans l'en-tête et le pied de page du site public, à l'ordre choisi dans la liste."
    >
      <SchemaForm<NavigationItemFormInput>
        fields={champs(menu)}
        schema={navigationItemFormSchema}
        defaultValues={valeursInitiales}
        columns={1}
        submitLabel={creation ? "Ajouter" : "Enregistrer"}
        secondaryAction={
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
        }
        onSubmit={async (saisie, outils) => {
          const resultat = creation
            ? await creerEntreeNavigationAction({ ...saisie, menu })
            : await modifierEntreeNavigationAction({ id: entree.id, ...saisie });

          if (resultat.ok) {
            onOpenChange(false);
            onSaved(resultat.data);
            return;
          }

          for (const cle of CLES_FORMULAIRE) {
            const message = resultat.fieldErrors?.[cle];
            if (message) outils.setError(cle, { message });
          }

          return resultat.message;
        }}
      />
    </FormModal>
  );
}
