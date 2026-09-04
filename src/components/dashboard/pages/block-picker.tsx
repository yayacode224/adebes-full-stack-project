"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { BLOCK_ICONS } from "@/components/blocks/block-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  BLOCK_CATEGORY_HINTS,
  BLOCK_CATEGORY_LABELS,
  type BlockType,
} from "@/core/cms/entities/block-type";
import { BLOCK_LIST, categoriesNonVides } from "@/core/cms/blocks/registry";
import { useIsDesktop } from "@/hooks/use-breakpoint";
import { cn } from "@/lib/utils";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LE SÉLECTEUR DE BLOCS (§9.2 et §9.3 du Rapport 2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * « Une modale groupée par `category`, avec pour chaque bloc son icône, son
 * libellé et sa description — un utilisateur non technique doit comprendre ce
 * qu'il ajoute avant de l'ajouter. »
 *
 * ---------------------------------------------------------------------------
 * ⚠️  DEUX COMPOSANTS RADIX, PAS UN SEUL AVEC DES CLASSES RESPONSIVES
 * ---------------------------------------------------------------------------
 * Le §9.3 est explicite : « un `Sheet` plein écran sous 1024 px […] ; les
 * catégories deviennent des sections de liste plutôt que des colonnes. »
 *
 * Un `Dialog` centré rétréci en `Sheet` par CSS aurait gardé le comportement
 * de focus-trap et de largeur d'un `Dialog` — Radix les traite comme deux
 * primitives distinctes, avec des a11y différentes. `useIsDesktop()` choisit
 * donc entre DEUX arbres, comme le fait déjà `<FormModal>` au Lot 6.
 *
 * ---------------------------------------------------------------------------
 * LA RECHERCHE FILTRE SUR LE LIBELLÉ **ET** LA DESCRIPTION
 * ---------------------------------------------------------------------------
 * Une personne qui tape « don » doit trouver « Moyens de don », mais aussi
 * « Bannière d'appel à l'action » si sa description mentionne les dons —
 * ce que fait précisément celle de `cta-banner`. Chercher uniquement le
 * libellé aurait manqué ce second cas, plus difficile à deviner par son nom.
 */

export function BlockPicker({
  open,
  onOpenChange,
  onChoisir,
}: {
  open: boolean;
  onOpenChange: (ouvert: boolean) => void;
  onChoisir: (type: BlockType) => void;
}) {
  const surBureau = useIsDesktop();
  const [recherche, setRecherche] = useState("");

  const contenu = (
    <ContenuDuSelecteur
      recherche={recherche}
      onRechercheChange={setRecherche}
      onChoisir={(type) => {
        onChoisir(type);
        onOpenChange(false);
        setRecherche("");
      }}
    />
  );

  if (surBureau) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl gap-0 p-0">
          <DialogHeader className="border-b border-border p-5 pb-4">
            <DialogTitle>Ajouter une section</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto p-5 pt-4">{contenu}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* `side="bottom"` + `h-dvh` : plein écran, jamais coupé par la barre
          d'adresse (§12, règle 5 — jamais `h-screen`). */}
      <SheetContent side="bottom" className="h-dvh w-full max-w-none gap-0 p-0">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Ajouter une section</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">{contenu}</div>
      </SheetContent>
    </Sheet>
  );
}

function ContenuDuSelecteur({
  recherche,
  onRechercheChange,
  onChoisir,
}: {
  recherche: string;
  onRechercheChange: (valeur: string) => void;
  onChoisir: (type: BlockType) => void;
}) {
  const requete = recherche.trim().toLowerCase();

  const parCategorie = useMemo(() => {
    const filtres = requete
      ? BLOCK_LIST.filter(
          (bloc) =>
            bloc.label.toLowerCase().includes(requete) ||
            bloc.description.toLowerCase().includes(requete),
        )
      : BLOCK_LIST;

    return categoriesNonVides()
      .map((categorie) => ({
        categorie,
        blocs: filtres.filter((bloc) => bloc.category === categorie),
      }))
      .filter((groupe) => groupe.blocs.length > 0);
  }, [requete]);

  return (
    <div className="flex flex-col gap-6">
      {/* Champ de recherche FIXÉ en haut sur mobile (§9.3). Sur bureau, il
          défile avec le reste : la modale est assez courte pour que ce ne
          soit pas nécessaire. */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={recherche}
          onChange={(evenement) => onRechercheChange(evenement.target.value)}
          placeholder="Rechercher un bloc…"
          className="pl-9"
          autoFocus
        />
      </div>

      {parCategorie.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Aucun bloc ne correspond à « {recherche} ».
        </p>
      ) : (
        parCategorie.map(({ categorie, blocs }) => (
          <div key={categorie} className="flex flex-col gap-2.5">
            <div>
              <h3 className="font-heading text-sm font-semibold text-foreground">
                {BLOCK_CATEGORY_LABELS[categorie]}
              </h3>
              <p className="text-xs text-muted-foreground">
                {BLOCK_CATEGORY_HINTS[categorie]}
              </p>
            </div>

            {/* Une colonne de cartes sous 1024px (§9.3) ; deux au-delà. La
                largeur de la modale elle-même s'en charge : pas de classe
                `lg:` ici, `sm:grid-cols-2` suffit à la largeur du Dialog. */}
            <div className="grid gap-2 sm:grid-cols-2">
              {blocs.map((bloc) => {
                const Icone = BLOCK_ICONS[bloc.type];
                return (
                  <button
                    key={bloc.type}
                    type="button"
                    onClick={() => onChoisir(bloc.type)}
                    className={cn(
                      "flex min-h-11 items-start gap-3 rounded-xl border border-border bg-card p-3.5 text-left transition-colors",
                      "hover:border-primary/50 hover:bg-muted/50",
                    )}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Icone className="size-4.5" aria-hidden="true" />
                    </span>
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground">
                        {bloc.label}
                      </span>
                      <span className="text-xs leading-relaxed text-muted-foreground">
                        {bloc.description}
                      </span>
                      {bloc.collection ? (
                        <span className="mt-0.5 text-xs text-muted-foreground/80">
                          Alimenté par « {bloc.collection} »
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
