"use client";

import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ArticleCategory } from "@/core/cms/entities/article";
import {
  creerCategorieAction,
  renommerCategorieAction,
  reordonnerCategoriesAction,
  supprimerCategorieAction,
} from "@/server/actions/article-categories.actions";

import { ConfirmDialog } from "../modals/confirm-dialog";
import { FormModal } from "../modals/form-modal";
import {
  ReorderHandle,
  ReorderProvider,
  useElementTriable,
} from "../shared/reorder";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  GESTION DES CATÉGORIES D'ACTUALITÉS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8B du Rapport 2 : « catégories gérables ». Le point était explicitement
 * laissé « à trancher au début du lot », comme `galleryMediaIds` l'avait été au
 * Lot 8A.
 *
 * ---------------------------------------------------------------------------
 * UNE MODALE, ET NON UN SECOND ÉCRAN
 * ---------------------------------------------------------------------------
 * Trois raisons, dans cet ordre d'importance :
 *
 *   1. **La navigation du §5.2 ne prévoit pas d'entrée « Catégories ».** Lui en
 *      ajouter une répéterait l'écart nº 25 (l'entrée « Valeurs ») sans que
 *      rien, cette fois, ne l'appelle : `/dashboard/valeurs` est un écran du
 *      §8E, une page de catégories n'existe nulle part dans les rapports. Un
 *      écran sans entrée de navigation serait livré inatteignable.
 *   2. **Une catégorie porte DEUX informations** — un libellé et un rang.
 *      L'écran de liste complet du Lot 6 (recherche, filtres, pagination,
 *      sélection multiple, colonnes) n'aurait rien à afficher.
 *   3. **On gère ses catégories en classant un article**, pas en soi. La
 *      commande vit donc là où le besoin naît : sur la liste des actualités,
 *      à côté de « Nouvel article ».
 *
 * ---------------------------------------------------------------------------
 * LES DROITS NE SONT PAS CEUX QU'ON ATTEND, ET LA BASE COMMANDE
 * ---------------------------------------------------------------------------
 * La RLS ouvre le RENOMMAGE et le RÉORDONNANCEMENT au personnel — éditeur
 * compris — mais réserve l'AJOUT et la SUPPRESSION aux administrateurs
 * (`app_can_publish()`, migration 0009). L'interface reproduit exactement ce
 * découpage, et l'explique : un éditeur ne voit ni « Ajouter » ni la corbeille,
 * et une phrase lui dit pourquoi. Une commande absente sans motif passe pour
 * une panne (§12).
 *
 * Le raisonnement sur le choix des permissions applicatives correspondantes est
 * dans `article-categories.actions.ts`.
 *
 * ---------------------------------------------------------------------------
 * L'ORDRE EST OPTIMISTE, LE RESTE NE L'EST PAS
 * ---------------------------------------------------------------------------
 * Un glisser-déposer doit répondre à l'œil immédiatement, sinon la ligne
 * « revient » et le geste paraît raté : la liste locale est donc réordonnée
 * avant l'appel, et REMISE EN PLACE si le serveur refuse. Un renommage ou une
 * suppression, eux, attendent la réponse — ils ne sont pas des gestes continus,
 * et une ligne qui disparaît puis réapparaît est plus déroutante qu'un demi-
 * seconde d'attente.
 */
export function CategoriesModal({
  open,
  onOpenChange,
  categories: categoriesInitiales,
  peutCreer,
  peutRenommer,
  peutSupprimer,
  peutReordonner,
}: {
  open: boolean;
  onOpenChange: (ouvert: boolean) => void;
  categories: readonly ArticleCategory[];
  peutCreer: boolean;
  peutRenommer: boolean;
  peutSupprimer: boolean;
  peutReordonner: boolean;
}) {
  const router = useRouter();

  const [ordre, setOrdre] = useState<ArticleCategory[]>([...categoriesInitiales]);
  const [nouveau, setNouveau] = useState("");
  const [enCreation, setEnCreation] = useState(false);
  const [edition, setEdition] = useState<{ id: string; label: string } | null>(
    null,
  );
  const [aSupprimer, setASupprimer] = useState<ArticleCategory | null>(null);

  const enSaisie = edition !== null || nouveau.trim().length > 0;

  /* ---------------------------------------------------------------------- */
  /* Mutations                                                               */
  /* ---------------------------------------------------------------------- */

  async function ajouter() {
    const label = nouveau.trim();
    if (!label) return;

    setEnCreation(true);
    const resultat = await creerCategorieAction({ label });
    setEnCreation(false);

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 8000 });
      return;
    }

    setOrdre((actuel) => [...actuel, resultat.data]);
    setNouveau("");
    toast.success(`Catégorie « ${resultat.data.label} » ajoutée.`);
    router.refresh();
  }

  async function renommer(id: string, label: string) {
    const propre = label.trim();
    if (!propre) return;

    const resultat = await renommerCategorieAction({ id, label: propre });

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 8000 });
      return;
    }

    setOrdre((actuel) =>
      actuel.map((categorie) =>
        categorie.id === id ? { ...categorie, label: propre } : categorie,
      ),
    );
    setEdition(null);
    toast.success("Catégorie renommée.");
    router.refresh();
  }

  async function supprimer(categorie: ArticleCategory) {
    const resultat = await supprimerCategorieAction({ id: categorie.id });

    if (!resultat.ok) {
      /*
        Le cas courant : la catégorie sert encore. Le message NOMME le nombre
        d'articles concernés et dit quoi faire — il est donc affiché longtemps,
        parce qu'il demande une action, pas seulement un constat.
      */
      toast.error(resultat.message, { duration: 10000 });
      return;
    }

    setOrdre((actuel) => actuel.filter((c) => c.id !== categorie.id));
    toast.success(`Catégorie « ${categorie.label} » supprimée.`);
    router.refresh();
  }

  async function reordonner(nouvelOrdre: string[]) {
    const precedent = ordre;
    const parId = new Map(ordre.map((categorie) => [categorie.id, categorie]));

    const reorganise = nouvelOrdre
      .map((id) => parId.get(id))
      .filter((categorie): categorie is ArticleCategory => categorie !== undefined);

    setOrdre(reorganise);

    const resultat = await reordonnerCategoriesAction({ orderedIds: nouvelOrdre });

    if (!resultat.ok) {
      // Remise en place : l'ordre affiché ne doit jamais rester différent de
      // celui de la base, sans quoi le prochain déplacement partirait d'un état
      // que le serveur ne connaît pas.
      setOrdre(precedent);
      toast.error(resultat.message, { duration: 8000 });
      return;
    }

    router.refresh();
  }

  /* ---------------------------------------------------------------------- */
  /* Rendu                                                                   */
  /* ---------------------------------------------------------------------- */

  return (
    <>
      <FormModal
        open={open}
        onOpenChange={onOpenChange}
        title="Catégories des actualités"
        description="Elles alimentent la pastille des cartes et les boutons de filtre de la page Actualités. Leur ordre ici est celui des boutons."
        isDirty={enSaisie}
        footer={
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          {peutCreer ? (
            <form
              className="flex flex-col gap-2 sm:flex-row"
              onSubmit={(evenement) => {
                evenement.preventDefault();
                void ajouter();
              }}
            >
              <Input
                aria-label="Nom de la nouvelle catégorie"
                placeholder="Nouvelle catégorie"
                value={nouveau}
                maxLength={40}
                onChange={(evenement) => setNouveau(evenement.target.value)}
                className="h-11 text-base md:text-sm"
              />
              <Button type="submit" disabled={enCreation || !nouveau.trim()}>
                <Plus className="size-4" aria-hidden="true" />
                Ajouter
              </Button>
            </form>
          ) : (
            <p className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">
              L&apos;ajout et la suppression de catégories sont réservés aux
              administrateurs. Vous pouvez les renommer et changer leur ordre.
            </p>
          )}

          {ordre.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
              Aucune catégorie pour l&apos;instant. Les articles peuvent être
              publiés sans catégorie ; ils apparaîtront alors sans pastille.
            </p>
          ) : (
            <ReorderProvider
              ids={ordre.map((categorie) => categorie.id)}
              disabled={!peutReordonner}
              onReorder={(ids) => void reordonner(ids)}
            >
              <ul className="relative flex flex-col gap-1.5">
                {ordre.map((categorie) => (
                  <LigneCategorie
                    key={categorie.id}
                    categorie={categorie}
                    edition={edition?.id === categorie.id ? edition.label : null}
                    peutRenommer={peutRenommer}
                    peutSupprimer={peutSupprimer}
                    peutReordonner={peutReordonner}
                    onEditer={(label) => setEdition({ id: categorie.id, label })}
                    onAnnuler={() => setEdition(null)}
                    onValider={(label) => void renommer(categorie.id, label)}
                    onSupprimer={() => setASupprimer(categorie)}
                  />
                ))}
              </ul>
            </ReorderProvider>
          )}
        </div>
      </FormModal>

      <ConfirmDialog
        open={aSupprimer !== null}
        onOpenChange={(ouvert) => {
          if (!ouvert) setASupprimer(null);
        }}
        title={
          aSupprimer
            ? `Supprimer la catégorie « ${aSupprimer.label} » ?`
            : "Supprimer cette catégorie ?"
        }
        description="Le bouton de filtre correspondant disparaît de la page Actualités. Si des articles y sont encore rattachés, la suppression sera refusée et vous saurez combien il y en a."
        confirmLabel="Supprimer la catégorie"
        onConfirm={async () => {
          if (aSupprimer) await supprimer(aSupprimer);
          setASupprimer(null);
        }}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Une ligne
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * ⚠️  `<li>` en `relative` : la poignée de dnd-kit place l'élément saisi en
 * `position: relative` avec un `zIndex`, et le conteneur défilant de la modale
 * doit pouvoir le découper. Même famille que la découverte nº 22 — un descendant
 * positionné dont l'ancêtre ne l'est pas échappe à son `overflow`.
 */
function LigneCategorie({
  categorie,
  edition,
  peutRenommer,
  peutSupprimer,
  peutReordonner,
  onEditer,
  onAnnuler,
  onValider,
  onSupprimer,
}: {
  categorie: ArticleCategory;
  /** Le libellé en cours de saisie, ou `null` si la ligne n'est pas éditée. */
  edition: string | null;
  peutRenommer: boolean;
  peutSupprimer: boolean;
  peutReordonner: boolean;
  onEditer: (label: string) => void;
  onAnnuler: () => void;
  onValider: (label: string) => void;
  onSupprimer: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, style } =
    useElementTriable(categorie.id, !peutReordonner);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-1.5 py-1"
    >
      <ReorderHandle
        label={`Déplacer ${categorie.label}`}
        disabled={!peutReordonner}
        disabledReason={
          peutReordonner ? undefined : "vous n'avez pas les droits nécessaires"
        }
        setActivatorNodeRef={setActivatorNodeRef}
        attributes={attributes}
        listeners={listeners}
      />

      {edition === null ? (
        <>
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
            {categorie.label}
          </span>

          {peutRenommer ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11"
              aria-label={`Renommer ${categorie.label}`}
              onClick={() => onEditer(categorie.label)}
            >
              <Pencil className="size-4" aria-hidden="true" />
            </Button>
          ) : null}

          {peutSupprimer ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 text-destructive hover:text-destructive"
              aria-label={`Supprimer ${categorie.label}`}
              onClick={onSupprimer}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          ) : null}
        </>
      ) : (
        <>
          <Input
            autoFocus
            aria-label={`Nouveau nom de ${categorie.label}`}
            value={edition}
            maxLength={40}
            onChange={(evenement) => onEditer(evenement.target.value)}
            onKeyDown={(evenement) => {
              // Entrée valide, Échap annule : le réflexe attendu d'un champ
              // d'édition en ligne. Sans lui, seule la souris permet de sortir.
              if (evenement.key === "Enter") {
                evenement.preventDefault();
                onValider(edition);
              }
              if (evenement.key === "Escape") {
                evenement.preventDefault();
                onAnnuler();
              }
            }}
            className="h-11 min-w-0 flex-1 text-base md:text-sm"
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label="Enregistrer le nouveau nom"
            disabled={!edition.trim()}
            onClick={() => onValider(edition)}
          >
            <Check className="size-4" aria-hidden="true" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label="Annuler le renommage"
            onClick={onAnnuler}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </>
      )}
    </li>
  );
}
