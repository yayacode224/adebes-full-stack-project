"use client";

import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
  type ScreenReaderInstructions,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  RÉORDONNANCEMENT — LE POINT LE PLUS FRAGILE EN MOBILE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Le §12 du Rapport 1 lui consacre une section entière et pose trois
 * exigences. Elles sont implémentées ICI, une seule fois, pour que le
 * `<DataTable>`, le champ `list` de `<SchemaForm>` et tout ce que les lots
 * suivants ajouteront en héritent sans les réécrire — et sans avoir
 * l'occasion d'en oublier une.
 *
 * ---------------------------------------------------------------------------
 * 1. CONTRAINTE D'ACTIVATION — 8 px de déplacement OU 200 ms de pression
 * ---------------------------------------------------------------------------
 * Sans elle, **tout défilement de la liste au doigt déclenche un
 * déplacement** : l'utilisateur croit faire défiler, il réordonne. C'est le
 * défaut le plus courant des listes triables sur téléphone.
 *
 * dnd-kit n'exprime pas « distance OU délai » sur un seul capteur : la
 * contrainte se déclare par type d'entrée, ce qui est de toute façon plus
 * juste. `MouseSensor` prend les 8 px (une souris ne « presse » pas),
 * `TouchSensor` prend les 200 ms avec 8 px de tolérance (un doigt ne vise pas
 * au pixel). `PointerSensor` n'est PAS utilisé : il traite les deux entrées
 * de la même façon et ne peut donc porter qu'une seule des deux contraintes.
 *
 * ---------------------------------------------------------------------------
 * 2. CLAVIER
 * ---------------------------------------------------------------------------
 * `KeyboardSensor` avec `sortableKeyboardCoordinates` : espace pour saisir,
 * flèches pour déplacer, espace pour déposer, Échap pour annuler. Les
 * annonces sont traduites ci-dessous — dnd-kit n'annonce qu'en anglais par
 * défaut, ce qui rend l'opération incompréhensible pour l'utilisateur visé.
 *
 * ---------------------------------------------------------------------------
 * 3. UNE ALTERNATIVE SANS GLISSER-DÉPOSER, OBLIGATOIRE
 * ---------------------------------------------------------------------------
 * « Monter » / « Descendre » dans le menu d'actions de chaque ligne. Ce n'est
 * pas un supplément : c'est le seul moyen fiable sur un petit écran, et le
 * seul praticable aux technologies d'assistance. Les appelants la rendent avec
 * `deplacer()` ci-dessous, qui garantit qu'elle produit exactement le même
 * résultat que le glisser-déposer.
 *
 * ---------------------------------------------------------------------------
 * NOTE DE DÉPENDANCE
 * ---------------------------------------------------------------------------
 * `CSS.Transform.toString()` de `@dnd-kit/utilities` n'est pas utilisé :
 * ce paquet n'est pas déclaré dans `package.json` (il n'arrive que comme
 * dépendance transitive de `@dnd-kit/sortable`). L'importer marcherait
 * aujourd'hui et casserait le jour où l'arbre des dépendances change. La
 * transformation tient en une ligne, elle est écrite à la main.
 */

/** Les mêmes capteurs pour toutes les listes triables du dashboard. */
function useCapteurs() {
  return useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
}

const INSTRUCTIONS: ScreenReaderInstructions = {
  draggable:
    "Pour réordonner cet élément, pressez la barre d'espace ou Entrée. " +
    "Utilisez ensuite les flèches haut et bas pour le déplacer, puis la barre " +
    "d'espace pour valider, ou Échap pour annuler.",
};

const ANNONCES: Announcements = {
  onDragStart: ({ active }) => `Élément ${active.id} saisi.`,
  onDragOver: ({ active, over }) =>
    over
      ? `Élément ${active.id} déplacé au-dessus de ${over.id}.`
      : `Élément ${active.id} hors de la liste.`,
  onDragEnd: ({ active, over }) =>
    over
      ? `Élément ${active.id} déposé à la place de ${over.id}.`
      : `Élément ${active.id} reposé à sa place.`,
  onDragCancel: ({ active }) =>
    `Déplacement annulé. Élément ${active.id} remis à sa place.`,
};

/**
 * Enveloppe une liste triable.
 *
 * `onReorder` reçoit le tableau d'identifiants DANS LE NOUVEL ORDRE. Il n'est
 * appelé que si l'ordre a effectivement changé : un dépôt au point de départ
 * ne doit pas déclencher d'écriture en base.
 */
export function ReorderProvider({
  ids,
  onReorder,
  disabled = false,
  children,
}: {
  ids: string[];
  onReorder: (ordre: string[]) => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  const capteurs = useCapteurs();

  function terminer(evenement: DragEndEvent) {
    const { active, over } = evenement;
    if (!over || active.id === over.id) return;

    const depuis = ids.indexOf(String(active.id));
    const vers = ids.indexOf(String(over.id));
    if (depuis === -1 || vers === -1) return;

    onReorder(arrayMove(ids, depuis, vers));
  }

  return (
    <DndContext
      sensors={disabled ? undefined : capteurs}
      collisionDetection={closestCenter}
      onDragEnd={terminer}
      /*
        Contraint au seul axe vertical et au conteneur parent : une ligne qui
        part en diagonale hors du tableau donne l'impression que l'élément est
        perdu, et sur mobile elle déclenche le défilement horizontal que la
        règle 2 interdit.
      */
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      accessibility={{
        announcements: ANNONCES,
        screenReaderInstructions: INSTRUCTIONS,
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

/** État et attributs d'un élément triable. */
export function useElementTriable(id: string, disabled = false) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style: CSSProperties = {
    // Écrit à la main plutôt qu'avec `@dnd-kit/utilities` — voir la note de
    // dépendance en tête de fichier.
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
    // L'élément saisi passe au-dessus de ses voisins, sinon il glisse
    // « sous » eux et disparaît par intermittence.
    zIndex: isDragging ? 20 : undefined,
    position: isDragging ? "relative" : undefined,
  };

  return { attributes, listeners, setNodeRef, setActivatorNodeRef, style, isDragging };
}

/**
 * Poignée de déplacement.
 *
 * 44 px de cible (`size-11`) : le §12 nomme explicitement les poignées de
 * glisser-déposer parmi les éléments qu'une réduction de taille rend
 * inutilisables.
 *
 * `touch-none` est indispensable : sans lui, le navigateur interprète le geste
 * comme un défilement et dnd-kit ne reçoit jamais les événements.
 */
export function ReorderHandle({
  label,
  disabled = false,
  disabledReason,
  setActivatorNodeRef,
  attributes,
  listeners,
  className,
}: {
  /** Nomme la ligne concernée : « Déplacer Éducation ». */
  label: string;
  disabled?: boolean;
  /** Expliqué à l'utilisateur plutôt que laissé muet. */
  disabledReason?: string;
  setActivatorNodeRef?: (element: HTMLElement | null) => void;
  /*
    Les types viennent de dnd-kit plutôt que d'un `Record<string, unknown>` :
    `DraggableAttributes` n'a pas de signature d'index, et la version large
    aurait obligé à une conversion à chaque appel.
  */
  attributes?: DraggableAttributes;
  listeners?: DraggableSyntheticListeners;
  className?: string;
}) {
  return (
    <button
      type="button"
      ref={setActivatorNodeRef}
      disabled={disabled}
      aria-label={disabled && disabledReason ? `${label} — ${disabledReason}` : label}
      title={disabled ? disabledReason : undefined}
      className={cn(
        "flex size-11 shrink-0 touch-none items-center justify-center rounded-md text-muted-foreground transition-colors",
        disabled
          ? "cursor-not-allowed opacity-40"
          : "cursor-grab hover:bg-muted hover:text-foreground active:cursor-grabbing",
        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
      {...(disabled ? {} : attributes)}
      {...(disabled ? {} : listeners)}
    >
      <GripVertical className="size-4" aria-hidden="true" />
    </button>
  );
}

/**
 * Déplacement d'un cran, pour les boutons « Monter » / « Descendre ».
 *
 * Renvoie `null` quand le déplacement est impossible (déjà en tête ou en
 * queue) : l'appelant désactive alors l'entrée de menu au lieu de proposer une
 * action sans effet.
 */
export function deplacer(
  ids: string[],
  id: string,
  direction: "haut" | "bas",
): string[] | null {
  const depuis = ids.indexOf(id);
  if (depuis === -1) return null;

  const vers = direction === "haut" ? depuis - 1 : depuis + 1;
  if (vers < 0 || vers >= ids.length) return null;

  return arrayMove(ids, depuis, vers);
}
