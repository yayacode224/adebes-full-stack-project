"use client";

import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GalleryCategory } from "@/core/cms/entities/gallery";
import {
  MEDIA_TONES,
  MEDIA_TONE_LABELS,
  type MediaTone,
} from "@/core/cms/entities/media-tone";
import {
  creerCategorieGalerieAction,
  renommerCategorieGalerieAction,
  reordonnerCategoriesGalerieAction,
  supprimerCategorieGalerieAction,
} from "@/server/actions/gallery-categories.actions";

import { ConfirmDialog } from "../modals/confirm-dialog";
import { FormModal } from "../modals/form-modal";
import {
  ReorderHandle,
  ReorderProvider,
  useElementTriable,
} from "../shared/reorder";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  GESTION DES CATÉGORIES DE LA GALERIE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8H : « la catégorie devient une colonne ». Même forme qu'au Lot 8B pour les
 * actualités, et pour les trois mêmes raisons (écart nº 69) :
 *
 *   1. **La navigation du §5.2 ne prévoit pas d'entrée « Catégories ».** Un
 *      écran sans entrée de navigation serait livré inatteignable — l'écart
 *      nº 25 (l'entrée « Valeurs ») existait parce qu'un écran du §8E
 *      l'exigeait ; rien de tel ici.
 *   2. **Une catégorie porte TROIS informations** — un libellé, une teinte et
 *      un rang. L'écran de liste complet du Lot 6 (recherche, filtres,
 *      pagination, sélection multiple) n'aurait rien à afficher.
 *   3. **On gère ses catégories en classant une photo**, pas en soi. La
 *      commande vit donc là où le besoin naît : sur la liste de la galerie, à
 *      côté de « Ajouter une photo ».
 *
 * ---------------------------------------------------------------------------
 * LA DIFFÉRENCE AVEC LE LOT 8B : LA TEINTE SE CHOISIT ICI
 * ---------------------------------------------------------------------------
 * `gallery_categories.tone` n'existe pas sur `article_categories`. Elle n'est
 * pas décorative : c'est la couleur du bloc affiché à la place d'une photo qui
 * ne peut pas être chargée. Aucun autre écran ne permettrait de la corriger, et
 * les quatre catégories d'origine la portaient déjà dans le tableau TypeScript.
 *
 * Le sélecteur est un `<select>` NATIF, et c'est délibéré : cette modale rend
 * déjà une liste ordonnable dans un conteneur défilant, et y superposer le
 * menu flottant de Radix — lui-même dans un `Dialog` ou un `Sheet` selon la
 * largeur — empile trois couches de portail pour cinq options figées. Le
 * `<select>` du système est plus court, plus accessible au clavier, et il est
 * la commande que le téléphone rend le mieux.
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
 * dans `gallery-categories.actions.ts`.
 *
 * ---------------------------------------------------------------------------
 * L'ORDRE EST OPTIMISTE, LE RESTE NE L'EST PAS
 * ---------------------------------------------------------------------------
 * Un glisser-déposer doit répondre à l'œil immédiatement, sinon la ligne
 * « revient » et le geste paraît raté : la liste locale est donc réordonnée
 * avant l'appel, et REMISE EN PLACE si le serveur refuse. Un renommage ou une
 * suppression, eux, attendent la réponse.
 */
export function GalleryCategoriesModal({
  open,
  onOpenChange,
  categories: categoriesInitiales,
  comptesParCategorie,
  peutCreer,
  peutRenommer,
  peutSupprimer,
  peutReordonner,
}: {
  open: boolean;
  onOpenChange: (ouvert: boolean) => void;
  categories: readonly GalleryCategory[];
  /**
   * Combien de photos chaque catégorie classe, brouillons compris.
   *
   * Affiché sur la ligne : supprimer une catégorie employée est refusé par la
   * base, et le dire AVANT le clic vaut mieux que de le découvrir après.
   */
  comptesParCategorie: Record<string, number>;
  peutCreer: boolean;
  peutRenommer: boolean;
  peutSupprimer: boolean;
  peutReordonner: boolean;
}) {
  const router = useRouter();

  const [ordre, setOrdre] = useState<GalleryCategory[]>([...categoriesInitiales]);
  const [nouveau, setNouveau] = useState("");
  const [enCreation, setEnCreation] = useState(false);
  const [edition, setEdition] = useState<{ id: string; label: string } | null>(
    null,
  );
  const [aSupprimer, setASupprimer] = useState<GalleryCategory | null>(null);

  const enSaisie = edition !== null || nouveau.trim().length > 0;

  /* ---------------------------------------------------------------------- */
  /* Mutations                                                               */
  /* ---------------------------------------------------------------------- */

  async function ajouter() {
    const label = nouveau.trim();
    if (!label) return;

    setEnCreation(true);
    const resultat = await creerCategorieGalerieAction({ label });
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

    const resultat = await renommerCategorieGalerieAction({ id, label: propre });

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

  /**
   * Change la teinte, sans toucher au libellé.
   *
   * L'action attend les deux : le libellé courant est donc renvoyé tel quel.
   * C'est volontaire — un schéma de mise à jour partielle aurait laissé la
   * porte ouverte à un appel qui n'envoie ni l'un ni l'autre, donc à une
   * écriture vide comptée comme un succès.
   */
  async function changerTeinte(categorie: GalleryCategory, tone: MediaTone) {
    const precedent = ordre;

    // Optimiste : la pastille doit répondre au choix immédiatement.
    setOrdre((actuel) =>
      actuel.map((c) => (c.id === categorie.id ? { ...c, tone } : c)),
    );

    const resultat = await renommerCategorieGalerieAction({
      id: categorie.id,
      label: categorie.label,
      tone,
    });

    if (!resultat.ok) {
      setOrdre(precedent);
      toast.error(resultat.message, { duration: 8000 });
      return;
    }

    toast.success(`Teinte de « ${categorie.label} » modifiée.`);
    router.refresh();
  }

  async function supprimer(categorie: GalleryCategory) {
    const resultat = await supprimerCategorieGalerieAction({ id: categorie.id });

    if (!resultat.ok) {
      /*
        Le cas courant : la catégorie classe encore des photos. Le message
        NOMME le nombre concerné et dit quoi faire — il est donc affiché
        longtemps, parce qu'il demande une action, pas seulement un constat.
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
      .filter((categorie): categorie is GalleryCategory => categorie !== undefined);

    setOrdre(reorganise);

    const resultat = await reordonnerCategoriesGalerieAction({
      orderedIds: nouvelOrdre,
    });

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
        title="Catégories de la galerie"
        description="Elles alimentent les boutons de filtre de la page Galerie. Leur ordre ici est celui des boutons ; leur teinte est la couleur affichée si une photo ne peut pas être chargée."
        isDirty={enSaisie}
        footer={
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
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
              administrateurs. Vous pouvez les renommer, changer leur teinte et
              leur ordre.
            </p>
          )}

          {ordre.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
              Aucune catégorie pour l&apos;instant. Les photos peuvent être
              publiées sans catégorie ; elles n&apos;apparaîtront alors que dans
              « Tous », sans bouton de filtre pour les atteindre.
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
                    photos={comptesParCategorie[categorie.id] ?? 0}
                    edition={edition?.id === categorie.id ? edition.label : null}
                    peutRenommer={peutRenommer}
                    peutSupprimer={peutSupprimer}
                    peutReordonner={peutReordonner}
                    onEditer={(label) => setEdition({ id: categorie.id, label })}
                    onAnnuler={() => setEdition(null)}
                    onValider={(label) => void renommer(categorie.id, label)}
                    onTeinte={(tone) => void changerTeinte(categorie, tone)}
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
        description="Le bouton de filtre correspondant disparaît de la page Galerie. Les photos ne sont pas supprimées — mais si la catégorie en classe encore, la suppression sera refusée et vous saurez combien il y en a."
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
  photos,
  edition,
  peutRenommer,
  peutSupprimer,
  peutReordonner,
  onEditer,
  onAnnuler,
  onValider,
  onTeinte,
  onSupprimer,
}: {
  categorie: GalleryCategory;
  photos: number;
  /** Le libellé en cours de saisie, ou `null` si la ligne n'est pas éditée. */
  edition: string | null;
  peutRenommer: boolean;
  peutSupprimer: boolean;
  peutReordonner: boolean;
  onEditer: (label: string) => void;
  onAnnuler: () => void;
  onValider: (label: string) => void;
  onTeinte: (tone: MediaTone) => void;
  onSupprimer: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, style } =
    useElementTriable(categorie.id, !peutReordonner);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-card px-1.5 py-1"
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
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-foreground">
              {categorie.label}
            </span>
            {/*
              Le décompte est écrit en toutes lettres plutôt que porté par une
              icône : c'est lui qui explique un refus de suppression AVANT le
              clic, et une information rendue par la seule couleur ou la seule
              forme est invisible pour un lecteur d'écran.
            */}
            <span className="text-xs text-muted-foreground">
              {photos === 0
                ? "aucune photo"
                : photos === 1
                  ? "1 photo"
                  : `${photos} photos`}
            </span>
          </span>

          {peutRenommer ? (
            <label className="flex items-center gap-1.5">
              <span className="sr-only">Teinte de {categorie.label}</span>
              <select
                value={categorie.tone}
                onChange={(evenement) =>
                  onTeinte(evenement.target.value as MediaTone)
                }
                className="h-11 rounded-md border border-input bg-background px-2 text-base text-foreground md:text-sm"
              >
                {MEDIA_TONES.map((tone) => (
                  <option key={tone} value={tone}>
                    {MEDIA_TONE_LABELS[tone]}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <span className="px-2 text-xs text-muted-foreground">
              {MEDIA_TONE_LABELS[categorie.tone]}
            </span>
          )}

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
