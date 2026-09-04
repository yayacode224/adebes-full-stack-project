"use client";

import {
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  MoreVertical,
  Plus,
  Trash2,
  TriangleAlert,
} from "lucide-react";

import { BLOCK_ICONS } from "@/components/blocks/block-icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getBlockDefinition, parseContenu } from "@/core/cms/blocks/registry";
import { isBlockType } from "@/core/cms/entities/block-type";
import type { PageSection } from "@/core/cms/entities/page";
import { cn } from "@/lib/utils";

import {
  ReorderHandle,
  ReorderProvider,
  deplacer,
  useElementTriable,
} from "../shared/reorder";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  L'ARBRE DES SECTIONS — zone GAUCHE de l'éditeur (§9.3)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Liste ordonnable : icône + libellé du bloc, œil pour masquer, menu
 * dupliquer/supprimer, bouton « + Ajouter une section ».
 *
 * ---------------------------------------------------------------------------
 * ⚠️  TROIS CHEMINS POUR RÉORDONNER, ET LE TROISIÈME EST LE SEUL UTILISABLE AU
 *     TÉLÉPHONE
 * ---------------------------------------------------------------------------
 * Règle tactile du Lot 6, reprise au §9.3 : contrainte d'activation (8 px à la
 * souris, 200 ms au doigt), navigation au clavier, **et** « Monter / Descendre »
 * dans le menu de chaque section.
 *
 * Sans la troisième, réordonner sur un écran de 390 px suppose de maintenir le
 * doigt appuyé tout en faisant défiler une liste plus haute que l'écran — un
 * geste que personne ne réussit. C'est cette alternative qui sera réellement
 * employée sur téléphone.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  UNE SECTION INVALIDE EST SIGNALÉE ICI, ET NULLE PART AILLEURS
 * ---------------------------------------------------------------------------
 * Le site public ne rend RIEN pour une section dont le contenu ne passe pas le
 * schéma de son bloc (§9.4) — c'est ce qui empêche une page blanche en
 * production. Le revers : rien ne le dit à qui édite la page, et la section
 * paraît simplement absente du site sans motif.
 *
 * L'arbre porte donc l'avertissement, sur la ligne concernée. Il en va de même
 * pour une section dont le TYPE de bloc n'existe plus : elle reste listée —
 * c'est ce qui permet de la supprimer — mais son formulaire ne s'ouvre pas.
 */

export type EtatDeSection = {
  section: PageSection;
  /** Le contenu passe-t-il le schéma de son bloc ? */
  valide: boolean;
  /** Le type de bloc existe-t-il encore dans le registre ? */
  connu: boolean;
};

/** Évalue chaque section une fois, pour l'arbre et pour la barre d'action. */
export function evaluerSections(sections: PageSection[]): EtatDeSection[] {
  return sections.map((section) => {
    const connu = isBlockType(section.blockType);
    return {
      section,
      connu,
      valide: connu && parseContenu(section.blockType, section.content).ok,
    };
  });
}

export function SectionTree({
  etats,
  selectionId,
  onSelect,
  onAjouter,
  onDupliquer,
  onSupprimer,
  onChangerVisibilite,
  onReordonner,
  peutComposer,
  peutModifier,
  reordonnancementEnCours,
}: {
  etats: EtatDeSection[];
  selectionId: string | null;
  onSelect: (id: string) => void;
  /** `position` vaut `null` pour un ajout en fin de liste. */
  onAjouter: (position: number | null) => void;
  onDupliquer: (section: PageSection) => void;
  onSupprimer: (section: PageSection) => void;
  onChangerVisibilite: (section: PageSection, isVisible: boolean) => void;
  onReordonner: (ordre: string[]) => void;
  /** `section:create` et `section:delete` — administrateurs seulement. */
  peutComposer: boolean;
  /** `section:update` — ouvert à l'éditeur. */
  peutModifier: boolean;
  reordonnancementEnCours: boolean;
}) {
  const ids = etats.map((etat) => etat.section.id);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-heading text-sm font-semibold text-foreground">
          Sections
        </h2>
        <span className="text-xs text-muted-foreground">
          {etats.length === 0
            ? "aucune"
            : `${etats.length} section${etats.length > 1 ? "s" : ""}`}
        </span>
      </div>

      {etats.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          Cette page n&apos;a aucune section. Elle s&apos;affiche avec son
          en-tête et son pied de page, mais son corps est vide.
        </p>
      ) : (
        <ReorderProvider
          ids={ids}
          onReorder={onReordonner}
          disabled={!peutModifier || reordonnancementEnCours}
        >
          <ul className="flex flex-col gap-1.5">
            {etats.map((etat, index) => (
              <LigneDeSection
                key={etat.section.id}
                etat={etat}
                index={index}
                total={etats.length}
                selectionnee={etat.section.id === selectionId}
                onSelect={onSelect}
                onAjouter={onAjouter}
                onDupliquer={onDupliquer}
                onSupprimer={onSupprimer}
                onChangerVisibilite={onChangerVisibilite}
                onDecaler={(direction) => {
                  const suivant = deplacer(ids, etat.section.id, direction);
                  if (suivant) onReordonner(suivant);
                }}
                peutComposer={peutComposer}
                peutModifier={peutModifier}
                reordonnancementEnCours={reordonnancementEnCours}
              />
            ))}
          </ul>
        </ReorderProvider>
      )}

      {peutComposer ? (
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full"
          onClick={() => onAjouter(null)}
        >
          <Plus className="size-4" aria-hidden="true" />
          Ajouter une section
        </Button>
      ) : (
        /*
          Le motif d'une commande absente, écrit plutôt que laissé muet :
          « l'éditeur remplit une section existante mais ne compose pas la
          page » (§9 du Rapport 1). Sans cette phrase, l'absence du bouton
          passe pour une panne.
        */
        <p className="text-xs leading-relaxed text-muted-foreground">
          Ajouter et supprimer des sections est réservé aux administrateurs.
          Vous pouvez remplir celles qui existent, les réordonner et les
          masquer.
        </p>
      )}
    </div>
  );
}

function LigneDeSection({
  etat,
  index,
  total,
  selectionnee,
  onSelect,
  onAjouter,
  onDupliquer,
  onSupprimer,
  onChangerVisibilite,
  onDecaler,
  peutComposer,
  peutModifier,
  reordonnancementEnCours,
}: {
  etat: EtatDeSection;
  index: number;
  total: number;
  selectionnee: boolean;
  onSelect: (id: string) => void;
  onAjouter: (position: number | null) => void;
  onDupliquer: (section: PageSection) => void;
  onSupprimer: (section: PageSection) => void;
  onChangerVisibilite: (section: PageSection, isVisible: boolean) => void;
  onDecaler: (direction: "haut" | "bas") => void;
  peutComposer: boolean;
  peutModifier: boolean;
  reordonnancementEnCours: boolean;
}) {
  const { section, valide, connu } = etat;
  const definition = getBlockDefinition(section.blockType);

  // Déstructuré ici, jamais lu par `objet.propriete` plus bas : la règle du
  // compilateur `react-hooks/refs` refuse l'accès à un ref via une expression
  // de membre pendant le rendu (voir le gabarit de `card-view.tsx`).
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, style } =
    useElementTriable(section.id, !peutModifier || reordonnancementEnCours);

  const Icone = isBlockType(section.blockType)
    ? BLOCK_ICONS[section.blockType]
    : TriangleAlert;

  const libelle = definition?.label ?? section.blockType;

  return (
    <li ref={setNodeRef} style={style}>
      <div
        className={cn(
          "flex items-stretch gap-1 rounded-xl border bg-card transition-colors",
          selectionnee
            ? "border-primary ring-1 ring-primary/30"
            : "border-border hover:border-primary/40",
          !section.isVisible && "opacity-70",
        )}
      >
        <ReorderHandle
          label={`Déplacer la section ${libelle}`}
          disabled={!peutModifier || reordonnancementEnCours}
          disabledReason={
            peutModifier
              ? "Réordonnancement en cours."
              : "Vous n'avez pas les droits pour réordonner."
          }
          setActivatorNodeRef={setActivatorNodeRef}
          attributes={attributes}
          listeners={listeners}
          className="shrink-0"
        />

        {/*
          Le corps de la ligne est un BOUTON pleine largeur : sur un téléphone,
          la cible de sélection doit être la ligne entière, pas son titre.
          `min-h-11` garantit les 44 px de la règle 4 du §12.
        */}
        <button
          type="button"
          onClick={() => onSelect(section.id)}
          aria-current={selectionnee ? "true" : undefined}
          className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 py-2 pr-1 text-left"
        >
          <span
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-lg",
              connu
                ? "bg-muted text-muted-foreground"
                : "bg-destructive/10 text-destructive",
            )}
          >
            <Icone className="size-4" aria-hidden="true" />
          </span>

          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">
              {libelle}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>{index + 1}</span>
              {!section.isVisible ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Masquée</span>
                </>
              ) : null}
              {!connu ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-destructive">Bloc inconnu</span>
                </>
              ) : !valide ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-destructive">Contenu à corriger</span>
                </>
              ) : null}
            </span>
          </span>
        </button>

        {/*
          L'œil est une action à part entière, pas une entrée de menu : masquer
          est le geste le plus fréquent de cet écran, et le §9.3 le place
          explicitement sur la ligne.
        */}
        {peutModifier ? (
          <button
            type="button"
            onClick={() => onChangerVisibilite(section, !section.isVisible)}
            className="grid min-h-11 w-11 shrink-0 place-items-center text-muted-foreground transition-colors hover:text-foreground"
          >
            {section.isVisible ? (
              <Eye className="size-4" aria-hidden="true" />
            ) : (
              <EyeOff className="size-4" aria-hidden="true" />
            )}
            <span className="sr-only">
              {section.isVisible
                ? `Masquer la section ${libelle}`
                : `Afficher la section ${libelle}`}
            </span>
          </button>
        ) : null}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="grid min-h-11 w-11 shrink-0 place-items-center rounded-r-xl text-muted-foreground transition-colors hover:text-foreground"
            >
              <MoreVertical className="size-4" aria-hidden="true" />
              <span className="sr-only">Actions de la section {libelle}</span>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            {/*
              ⚠️  « Monter » et « Descendre » — l'alternative tactile du §12.
              Sans elles, réordonner au téléphone est impossible.
            */}
            <DropdownMenuItem
              disabled={!peutModifier || index === 0 || reordonnancementEnCours}
              onSelect={() => onDecaler("haut")}
            >
              <ChevronUp className="size-4" aria-hidden="true" />
              Monter
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={
                !peutModifier || index === total - 1 || reordonnancementEnCours
              }
              onSelect={() => onDecaler("bas")}
            >
              <ChevronDown className="size-4" aria-hidden="true" />
              Descendre
            </DropdownMenuItem>

            {peutComposer ? (
              <>
                <DropdownMenuItem onSelect={() => onAjouter(index + 2)}>
                  <Plus className="size-4" aria-hidden="true" />
                  Insérer une section en dessous
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!connu}
                  onSelect={() => onDupliquer(section)}
                >
                  <Copy className="size-4" aria-hidden="true" />
                  Dupliquer
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => onSupprimer(section)}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Supprimer
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}
