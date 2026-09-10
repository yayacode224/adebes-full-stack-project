"use client";

import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { NavigationItem, NavigationMenu } from "@/core/cms/entities/navigation-item";
import {
  changerVisibiliteEntreeNavigationAction,
  reordonnerNavigationAction,
  supprimerEntreeNavigationAction,
} from "@/server/actions/navigation.actions";

import { ConfirmDialog } from "../modals/confirm-dialog";
import {
  ReorderHandle,
  ReorderProvider,
  deplacer,
  useElementTriable,
} from "../shared/reorder";
import { NavigationItemFormModal } from "./navigation-item-form-modal";

/**
 * La liste réordonnable d'UN menu — §10.1 du Rapport 2.
 *
 * ---------------------------------------------------------------------------
 * UNE LISTE À LA MAIN, PAS `<DataTable>`
 * ---------------------------------------------------------------------------
 * Même choix que `CategoriesModal` (Lot 8B) : un menu compte de deux à huit
 * entrées, chacune avec deux informations affichées (libellé, lien) et deux
 * états (visible, externe). `<DataTable>` apporte recherche, filtres et
 * pagination qu'aucune de ces quantités ne justifie — c'est une liste
 * ordonnable, pas un tableau à explorer.
 *
 * ---------------------------------------------------------------------------
 * L'ORDRE EST OPTIMISTE
 * ---------------------------------------------------------------------------
 * Même raisonnement que `CategoriesModal` : un glisser-déposer qui attend la
 * réponse serveur avant de bouger paraît raté. La liste locale est réordonnée
 * tout de suite et REMISE EN PLACE si le serveur refuse.
 */
export function NavigationMenuList({
  menu,
  entrees: entreesInitiales,
  peutCreer,
  peutModifier,
  peutSupprimer,
  peutReordonner,
}: {
  menu: NavigationMenu;
  entrees: NavigationItem[];
  peutCreer: boolean;
  peutModifier: boolean;
  peutSupprimer: boolean;
  peutReordonner: boolean;
}) {
  const router = useRouter();

  const [ordre, setOrdre] = useState<NavigationItem[]>([...entreesInitiales]);
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [enEdition, setEnEdition] = useState<NavigationItem | undefined>(undefined);
  const [aSupprimer, setASupprimer] = useState<NavigationItem | null>(null);

  const ids = ordre.map((entree) => entree.id);

  function ouvrirCreation() {
    setEnEdition(undefined);
    setModaleOuverte(true);
  }

  function ouvrirEdition(entree: NavigationItem) {
    setEnEdition(entree);
    setModaleOuverte(true);
  }

  /**
   * Fusionne l'entrée créée ou modifiée dans la liste LOCALE.
   *
   * `router.refresh()` seul ne suffit pas : voir l'avertissement de
   * `navigation-item-form-modal.tsx`. La création s'ajoute en fin de liste
   * locale — sa position réelle (calculée par `createNavigationItem`) est
   * déjà correcte puisque la liste locale reflète fidèlement l'ordre en
   * base au moment où la modale s'est ouverte.
   */
  function apresEnregistrement(entreeEnregistree: NavigationItem) {
    const creation = enEdition === undefined;
    setOrdre((actuel) =>
      creation
        ? [...actuel, entreeEnregistree]
        : actuel.map((item) => (item.id === entreeEnregistree.id ? entreeEnregistree : item)),
    );
    toast.success(creation ? "Entrée ajoutée." : "Entrée modifiée.");
    router.refresh();
  }

  async function changerVisibilite(entree: NavigationItem, isVisible: boolean) {
    const resultat = await changerVisibiliteEntreeNavigationAction({
      id: entree.id,
      isVisible,
    });

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 8000 });
      return;
    }

    setOrdre((actuel) =>
      actuel.map((item) => (item.id === entree.id ? { ...item, isVisible } : item)),
    );
    toast.success(
      isVisible
        ? `« ${entree.label} » est de nouveau affichée dans le menu.`
        : `« ${entree.label} » n'apparaît plus dans le menu.`,
    );
    router.refresh();
  }

  async function supprimer(entree: NavigationItem) {
    const resultat = await supprimerEntreeNavigationAction({ id: entree.id });

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 8000 });
      return;
    }

    setOrdre((actuel) => actuel.filter((item) => item.id !== entree.id));
    toast.success(`« ${entree.label} » a été supprimée.`);
    router.refresh();
  }

  async function reordonner(nouvelOrdre: string[]) {
    const precedent = ordre;
    const parId = new Map(ordre.map((entree) => [entree.id, entree]));

    setOrdre(
      nouvelOrdre
        .map((id) => parId.get(id))
        .filter((entree): entree is NavigationItem => entree !== undefined),
    );

    const resultat = await reordonnerNavigationAction({ menu, orderedIds: nouvelOrdre });

    if (!resultat.ok) {
      setOrdre(precedent);
      toast.error(resultat.message, { duration: 8000 });
      return;
    }

    router.refresh();
  }

  function decaler(index: number, direction: "haut" | "bas") {
    const suivant = deplacer(ids, ids[index]!, direction);
    if (suivant) void reordonner(suivant);
  }

  return (
    <div className="flex flex-col gap-4">
      {peutCreer ? (
        <Button type="button" onClick={ouvrirCreation} className="w-full sm:w-auto">
          <Plus className="size-4" aria-hidden="true" />
          Ajouter une entrée
        </Button>
      ) : (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">
          Ajouter, supprimer et réordonner ce menu sont réservés aux
          administrateurs.
        </p>
      )}

      {ordre.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
          Ce menu est vide : rien ne s&apos;affiche à son emplacement sur le
          site.
        </p>
      ) : (
        <ReorderProvider
          ids={ids}
          disabled={!peutReordonner}
          onReorder={(nouvelOrdre) => void reordonner(nouvelOrdre)}
        >
          <ul className="relative flex flex-col gap-2">
            {ordre.map((entree, index) => (
              <LigneNavigation
                key={entree.id}
                entree={entree}
                index={index}
                total={ordre.length}
                peutModifier={peutModifier}
                peutSupprimer={peutSupprimer}
                peutReordonner={peutReordonner}
                onEditer={() => ouvrirEdition(entree)}
                onChangerVisibilite={(visible) => void changerVisibilite(entree, visible)}
                onSupprimer={() => setASupprimer(entree)}
                onDecaler={(direction) => decaler(index, direction)}
              />
            ))}
          </ul>
        </ReorderProvider>
      )}

      <NavigationItemFormModal
        open={modaleOuverte}
        onOpenChange={setModaleOuverte}
        menu={menu}
        entree={enEdition}
        onSaved={apresEnregistrement}
      />

      <ConfirmDialog
        open={aSupprimer !== null}
        onOpenChange={(ouvert) => {
          if (!ouvert) setASupprimer(null);
        }}
        title={
          aSupprimer ? `Supprimer « ${aSupprimer.label} » ?` : "Supprimer cette entrée ?"
        }
        description="L'entrée disparaît du menu sur le site public. Cette action est définitive."
        confirmLabel="Supprimer l'entrée"
        onConfirm={async () => {
          if (aSupprimer) await supprimer(aSupprimer);
          setASupprimer(null);
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Une ligne
 * ═══════════════════════════════════════════════════════════════════════════ */

function LigneNavigation({
  entree,
  index,
  total,
  peutModifier,
  peutSupprimer,
  peutReordonner,
  onEditer,
  onChangerVisibilite,
  onSupprimer,
  onDecaler,
}: {
  entree: NavigationItem;
  index: number;
  total: number;
  peutModifier: boolean;
  peutSupprimer: boolean;
  peutReordonner: boolean;
  onEditer: () => void;
  onChangerVisibilite: (isVisible: boolean) => void;
  onSupprimer: () => void;
  onDecaler: (direction: "haut" | "bas") => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, style, isDragging } =
    useElementTriable(entree.id, !peutReordonner);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={
        isDragging
          ? "flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-card p-1.5 shadow-lg ring-1 ring-primary/40"
          : "flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-card p-1.5"
      }
    >
      <ReorderHandle
        label={`Déplacer ${entree.label}`}
        disabled={!peutReordonner}
        disabledReason={
          peutReordonner ? undefined : "vous n'avez pas les droits nécessaires"
        }
        setActivatorNodeRef={setActivatorNodeRef}
        attributes={attributes}
        listeners={listeners}
      />

      <div className="min-w-0 flex-1 basis-48 px-1">
        <p className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
          {entree.label}
          {!entree.isVisible ? (
            <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-normal text-muted-foreground">
              Masquée
            </span>
          ) : null}
          {entree.isExternal ? (
            <ArrowRight className="size-3 shrink-0 text-muted-foreground" aria-hidden="true" />
          ) : null}
        </p>
        <p className="truncate text-xs text-muted-foreground">{entree.href}</p>
      </div>

      <div className="ml-auto flex shrink-0 flex-wrap items-center">
        {peutModifier ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11"
              aria-label={
                entree.isVisible
                  ? `Masquer ${entree.label}`
                  : `Afficher ${entree.label}`
              }
              onClick={() => onChangerVisibilite(!entree.isVisible)}
            >
              {entree.isVisible ? (
                <Eye className="size-4" aria-hidden="true" />
              ) : (
                <EyeOff className="size-4" aria-hidden="true" />
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11"
              aria-label={`Modifier ${entree.label}`}
              onClick={onEditer}
            >
              <Pencil className="size-4" aria-hidden="true" />
            </Button>
          </>
        ) : null}

        {peutSupprimer ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 text-destructive hover:text-destructive"
            aria-label={`Supprimer ${entree.label}`}
            onClick={onSupprimer}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        ) : null}

        {peutReordonner ? (
          <span className="flex">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11"
              disabled={index === 0}
              aria-label={`Monter ${entree.label}`}
              onClick={() => onDecaler("haut")}
            >
              <ChevronUp className="size-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11"
              disabled={index === total - 1}
              aria-label={`Descendre ${entree.label}`}
              onClick={() => onDecaler("bas")}
            >
              <ChevronDown className="size-4" aria-hidden="true" />
            </Button>
          </span>
        ) : null}
      </div>
    </li>
  );
}
