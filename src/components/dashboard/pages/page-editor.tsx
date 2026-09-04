"use client";

import { ChevronLeft, Settings2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BlockType } from "@/core/cms/entities/block-type";
import type { Page, PageSection } from "@/core/cms/entities/page";
import type { PageFormInput } from "@/core/cms/schemas/page.schema";
import { useIsTableViewport, useIsWideEditor } from "@/hooks/use-breakpoint";
import {
  ajouterSectionAction,
  changerVisibiliteSectionAction,
  dupliquerSectionAction,
  mettreAJourPageAction,
  mettreAJourSectionAction,
  reordonnerSectionsAction,
  supprimerSectionAction,
} from "@/server/actions/pages.actions";

import type { OptionsDeReference } from "../forms/references-context";
import { PageHeader } from "../layout/page-header";
import { ConfirmDialog } from "../modals/confirm-dialog";
import { BlockPicker } from "./block-picker";
import { PageActionBar } from "./page-action-bar";
import { PageSettingsForm } from "./page-settings-form";
import { SectionContentForm } from "./section-content-form";
import { SectionTree, evaluerSections } from "./section-tree";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  L'ÉDITEUR DE PAGE — `/dashboard/pages/[id]` (§9.3 du Rapport 2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Trois zones — sections, contenu, réglages — dans trois arrangements selon la
 * largeur, chacun un arbre React DISTINCT (voir l'avertissement ajouté à
 * `use-breakpoint.ts`) :
 *
 *   * `< 768px`  — trois ONGLETS, un seul montés à la fois (Radix Tabs) ;
 *   * `768–1279px` — DEUX zones simultanées (arbre + contenu), réglages dans
 *     un `Sheet` ouvert par un bouton ;
 *   * `≥ 1280px` — TROIS zones simultanées, réglages inline.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  TOUTE MUTATION SE REFAIT PAR `router.refresh()`, PAS D'ÉTAT OPTIMISTE
 * ---------------------------------------------------------------------------
 * Même discipline que les neuf écrans de la série 8 : la page reçoit ses
 * données du rendu serveur, une Server Action écrit, puis `router.refresh()`
 * relit. `selectionId` et l'onglet actif sont les SEULS états qui survivent au
 * rafraîchissement — c'est de l'UI, pas du contenu.
 */
export function PageEditor({
  page,
  sections,
  peutModifierPage,
  peutPublierPage,
  peutSupprimerPage,
  peutComposerSections,
  peutModifierSections,
  referencesDeBloc,
}: {
  page: Page;
  sections: PageSection[];
  peutModifierPage: boolean;
  peutPublierPage: boolean;
  peutSupprimerPage: boolean;
  /** `section:create` / `section:delete` — administrateurs seulement. */
  peutComposerSections: boolean;
  /** `section:update` / `section:reorder` — ouvert à l'éditeur. */
  peutModifierSections: boolean;
  /** Options des champs `kind: 'reference'` des blocs (ex. catégories de galerie). */
  referencesDeBloc: OptionsDeReference;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const large = useIsWideEditor(); // ≥ 1280px : trois zones inline
  const moyen = useIsTableViewport(); // ≥ 768px : au moins deux zones

  const [selectionId, setSelectionId] = useState<string | null>(null);
  const [onglet, setOnglet] = useState<"sections" | "contenu" | "reglages">(
    () => {
      const valeur = searchParams.get("onglet");
      return valeur === "contenu" || valeur === "reglages"
        ? valeur
        : "sections";
    },
  );
  const [reglagesOuverts, setReglagesOuverts] = useState(false);
  const [picker, setPicker] = useState<{ position: number | null } | null>(
    null,
  );
  const [aSupprimer, setASupprimer] = useState<PageSection | null>(null);
  const [reordonnancementEnCours, setReordonnancementEnCours] = useState(false);

  const etats = evaluerSections(sections);
  const selection = sections.find((section) => section.id === selectionId) ?? null;

  /** Change d'onglet ET reflète le choix dans l'URL (`?onglet=`, §9.3). */
  function allerA(cible: "sections" | "contenu" | "reglages") {
    setOnglet(cible);
    const params = new URLSearchParams(searchParams);
    params.set("onglet", cible);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function selectionner(id: string) {
    setSelectionId(id);
    // « Sélectionner une section bascule automatiquement sur l'onglet
    // Contenu » — seul effet visible sur mobile, où un seul onglet est monté.
    if (!moyen) allerA("contenu");
  }

  /* ---------------------------------------------------------------------- */
  /* Mutations                                                               */
  /* ---------------------------------------------------------------------- */

  async function ajouter(type: BlockType, position: number | null) {
    const resultat = await ajouterSectionAction({
      pageId: page.id,
      blockType: type,
      position,
    });

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 10000 });
      return;
    }

    toast.success("Section ajoutée.");
    if (resultat.data.section) selectionner(resultat.data.section.id);
    router.refresh();
  }

  async function enregistrerContenu(
    section: PageSection,
    contenu: Record<string, unknown>,
  ): Promise<string | void> {
    const resultat = await mettreAJourSectionAction({
      id: section.id,
      content: contenu,
    });

    if (!resultat.ok) return resultat.message;

    toast.success("Section enregistrée.");
    router.refresh();
  }

  async function changerVisibilite(section: PageSection, isVisible: boolean) {
    const resultat = await changerVisibiliteSectionAction({
      id: section.id,
      isVisible,
    });

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 10000 });
      return;
    }

    toast.success(isVisible ? "Section affichée." : "Section masquée.");
    router.refresh();
  }

  async function dupliquer(section: PageSection) {
    const resultat = await dupliquerSectionAction({ id: section.id });

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 10000 });
      return;
    }

    toast.success(
      "Section dupliquée, masquée en attendant vos modifications.",
    );
    if (resultat.data.section) selectionner(resultat.data.section.id);
    router.refresh();
  }

  async function supprimer(section: PageSection) {
    const resultat = await supprimerSectionAction({ id: section.id });

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 10000 });
      return;
    }

    toast.success("Section supprimée.");
    if (selectionId === section.id) setSelectionId(null);
    router.refresh();
  }

  async function reordonner(ordre: string[]) {
    setReordonnancementEnCours(true);
    try {
      const resultat = await reordonnerSectionsAction({
        pageId: page.id,
        orderedIds: ordre,
      });

      if (!resultat.ok) {
        toast.error(resultat.message, { duration: 10000 });
        return;
      }

      router.refresh();
    } finally {
      setReordonnancementEnCours(false);
    }
  }

  async function enregistrerReglages(
    valeurs: PageFormInput,
  ): Promise<string | void> {
    const resultat = await mettreAJourPageAction({ id: page.id, ...valeurs });
    if (!resultat.ok) return resultat.message;

    toast.success("Réglages enregistrés.");
    router.refresh();
  }

  /* ---------------------------------------------------------------------- */
  /* Les trois zones, en fonctions pour ne pas les répéter                   */
  /* ---------------------------------------------------------------------- */

  const zoneSections = (
    <SectionTree
      etats={etats}
      selectionId={selectionId}
      onSelect={selectionner}
      onAjouter={(position) => setPicker({ position })}
      onDupliquer={(section) => void dupliquer(section)}
      onSupprimer={setASupprimer}
      onChangerVisibilite={(section, isVisible) =>
        void changerVisibilite(section, isVisible)
      }
      onReordonner={(ordre) => void reordonner(ordre)}
      peutComposer={peutComposerSections}
      peutModifier={peutModifierSections}
      reordonnancementEnCours={reordonnancementEnCours}
    />
  );

  const zoneContenu = selection ? (
    <div className="flex flex-col gap-3">
      {!moyen ? (
        <button
          type="button"
          onClick={() => allerA("sections")}
          className="flex min-h-11 w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Sections
        </button>
      ) : null}

      {peutModifierSections ? (
        <SectionContentForm
          key={selection.id}
          section={selection}
          references={referencesDeBloc}
          onSubmit={(contenu) => enregistrerContenu(selection, contenu)}
        />
      ) : (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Vous n&apos;avez pas les droits pour modifier cette section.
        </p>
      )}
    </div>
  ) : (
    <p className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      Sélectionnez une section dans la liste pour la remplir.
    </p>
  );

  const zoneReglages = peutModifierPage ? (
    <PageSettingsForm page={page} onSubmit={enregistrerReglages} />
  ) : (
    <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
      Vous n&apos;avez pas les droits pour modifier les réglages de cette page.
    </p>
  );

  /* ---------------------------------------------------------------------- */
  /* Assemblage responsive                                                   */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={page.title}
        description={page.route}
      />

      <PageActionBar
        page={page}
        peutPublier={peutPublierPage}
        peutSupprimer={peutSupprimerPage}
      />

      {large ? (
        // ≥ 1280px — trois zones inline, aucun onglet, aucun Sheet.
        <div className="grid grid-cols-[280px_1fr_320px] items-start gap-6">
          <div className="rounded-xl border border-border bg-card p-3">
            {zoneSections}
          </div>
          <div className="min-w-0 rounded-xl border border-border bg-card p-5">
            {zoneContenu}
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-3 font-heading text-sm font-semibold text-foreground">
              Réglages de la page
            </h2>
            {zoneReglages}
          </div>
        </div>
      ) : moyen ? (
        // 768–1279px — deux zones ; réglages dans un Sheet.
        <div className="flex items-start gap-6">
          <div className="w-64 shrink-0 rounded-xl border border-border bg-card p-3">
            {zoneSections}
          </div>
          <div className="min-w-0 flex-1 rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReglagesOuverts(true)}
              >
                <Settings2 className="size-4" aria-hidden="true" />
                Réglages de la page
              </Button>
            </div>
            {zoneContenu}
          </div>

          <Sheet open={reglagesOuverts} onOpenChange={setReglagesOuverts}>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Réglages de la page</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-6">{zoneReglages}</div>
            </SheetContent>
          </Sheet>
        </div>
      ) : (
        // < 768px — trois onglets, l'actif reflété dans l'URL.
        <Tabs
          value={onglet}
          onValueChange={(valeur) => allerA(valeur as typeof onglet)}
        >
          <TabsList className="w-full">
            <TabsTrigger value="sections" className="flex-1">
              Sections
            </TabsTrigger>
            <TabsTrigger value="contenu" className="flex-1">
              Contenu
            </TabsTrigger>
            <TabsTrigger value="reglages" className="flex-1">
              Réglages
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="sections"
            className="rounded-xl border border-border bg-card p-3"
          >
            {zoneSections}
          </TabsContent>
          <TabsContent
            value="contenu"
            className="rounded-xl border border-border bg-card p-4"
          >
            {zoneContenu}
          </TabsContent>
          <TabsContent
            value="reglages"
            className="rounded-xl border border-border bg-card p-4"
          >
            {zoneReglages}
          </TabsContent>
        </Tabs>
      )}

      <BlockPicker
        open={picker !== null}
        onOpenChange={(ouvert) => {
          if (!ouvert) setPicker(null);
        }}
        onChoisir={(type) => void ajouter(type, picker?.position ?? null)}
      />

      <ConfirmDialog
        open={aSupprimer !== null}
        onOpenChange={(ouvert) => {
          if (!ouvert) setASupprimer(null);
        }}
        title="Supprimer cette section ?"
        description="Son contenu sera perdu. Pour la retirer du site sans rien perdre, masquez-la plutôt depuis l'œil de sa ligne."
        confirmLabel="Supprimer la section"
        variant="destructive"
        onConfirm={async () => {
          if (aSupprimer) await supprimer(aSupprimer);
          setASupprimer(null);
        }}
      />
    </div>
  );
}
