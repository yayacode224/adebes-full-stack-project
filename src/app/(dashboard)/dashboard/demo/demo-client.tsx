"use client";

import { Archive, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/dashboard/data-table/data-table";
import type { Column } from "@/components/dashboard/data-table/types";
import { EmptyState } from "@/components/dashboard/feedback/empty-state";
import { ErrorState } from "@/components/dashboard/feedback/error-state";
import { StatusBadge } from "@/components/dashboard/feedback/status-badge";
import { SchemaForm } from "@/components/dashboard/forms/schema-form";
import { ConfirmDialog } from "@/components/dashboard/modals/confirm-dialog";
import { FormModal } from "@/components/dashboard/modals/form-modal";
import { Button } from "@/components/ui/button";
import { CONTENT_STATUSES } from "@/core/cms/entities/content-status";

import {
  CHAMPS_DEMO,
  LIGNES_DEMO,
  REFERENCES_DEMO,
  VALEURS_DEMO,
  schemaDemo,
  type LigneDemo,
  type ValeursDemo,
} from "./demo-data";

/**
 * Banc d'essai des six composants du Lot 6.
 *
 * ---------------------------------------------------------------------------
 * À QUOI IL SERT VRAIMENT
 * ---------------------------------------------------------------------------
 * §6.5 : « un défaut trouvé ici se corrige une fois ; le même défaut trouvé au
 * Lot 8I se corrige neuf fois. » C'est sur cette page que la matrice des cinq
 * largeurs est parcourue avant qu'aucun écran métier n'existe.
 *
 * Les quatre états du `<DataTable>` sont pilotés par des boutons plutôt que
 * simulés : un état d'erreur qu'on ne peut pas déclencher à volonté n'est
 * jamais relu après sa première écriture.
 */
export function DemoClient() {
  const [etatDuTableau, setEtatDuTableau] = useState<
    "rempli" | "chargement" | "erreur" | "vide"
  >("rempli");

  const [lignes, setLignes] = useState<LigneDemo[]>(LIGNES_DEMO);
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [formulaireModifie, setFormulaireModifie] = useState(false);
  const [confirmationOuverte, setConfirmationOuverte] = useState(false);
  const [aSupprimer, setASupprimer] = useState<LigneDemo | null>(null);

  const colonnes: Column<LigneDemo>[] = [
    {
      key: "titre",
      header: "Titre",
      sortable: true,
      sortValue: (ligne) => ligne.titre,
      cell: (ligne) => <span className="font-medium">{ligne.titre}</span>,
    },
    {
      key: "status",
      header: "État",
      sortable: true,
      sortValue: (ligne) => CONTENT_STATUSES.indexOf(ligne.status),
      cell: (ligne) => <StatusBadge status={ligne.status} />,
    },
    {
      key: "categorie",
      header: "Catégorie",
      sortable: true,
      sortValue: (ligne) => ligne.categorie,
      cell: (ligne) => ligne.categorie,
    },
    {
      key: "misAJour",
      header: "Mis à jour",
      sortable: true,
      sortValue: (ligne) => new Date(ligne.misAJour),
      // Masquée entre 768 et 1024 px : c'est la colonne la moins utile quand
      // la place manque, et elle revient dès l'écran de bureau.
      hideOnMobile: true,
      cell: (ligne) => (
        <time dateTime={ligne.misAJour} className="text-muted-foreground">
          {formaterDate(ligne.misAJour)}
        </time>
      ),
    },
    {
      key: "vues",
      header: "Vues",
      align: "end",
      sortable: true,
      sortValue: (ligne) => ligne.vues,
      hideOnMobile: true,
      cell: (ligne) =>
        /*
          INVARIANT Nº 1 : « — » et jamais « 0 ». La ligne nº 4 du jeu d'essai
          existe précisément pour que ce cas soit visible sur le banc.
        */
        ligne.vues === null ? (
          <span title="Donnée indisponible" className="text-muted-foreground">
            —
          </span>
        ) : (
          new Intl.NumberFormat("fr-FR").format(ligne.vues)
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-10">
      {/* ================================================================= */}
      <Section
        titre="StatusBadge"
        description="Couleur ET libellé, jamais la couleur seule. Chaque état porte aussi une forme de point distincte."
      >
        <div className="flex flex-wrap gap-2">
          {CONTENT_STATUSES.map((statut) => (
            <StatusBadge key={statut} status={statut} />
          ))}
        </div>
      </Section>

      {/* ================================================================= */}
      <Section
        titre="EmptyState et ErrorState"
        description="« Il n'y a rien » et « on n'a pas pu savoir » n'appellent pas la même réaction."
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <EmptyState
            title="Aucun programme pour l'instant"
            description="Créez votre premier programme : il apparaîtra aussitôt dans la liste, en brouillon."
            action={
              <Button type="button">
                <Plus className="size-4" aria-hidden="true" />
                Nouveau programme
              </Button>
            }
          />
          <ErrorState
            message="La connexion à la base de données a échoué. Vos données ne sont pas perdues."
            onRetry={() => toast.info("Nouvelle tentative (démonstration).")}
          />
        </div>
      </Section>

      {/* ================================================================= */}
      <Section
        titre="DataTable"
        description="Tableau à partir de 768 px, liste de cartes en dessous. Recherche, filtre, tri, pagination, sélection multiple et réordonnancement."
      >
        <div
          role="group"
          aria-label="État simulé du tableau"
          className="flex flex-wrap gap-2"
        >
          {(["rempli", "chargement", "erreur", "vide"] as const).map((etat) => (
            <Button
              key={etat}
              type="button"
              variant={etatDuTableau === etat ? "default" : "outline"}
              size="sm"
              aria-pressed={etatDuTableau === etat}
              onClick={() => setEtatDuTableau(etat)}
            >
              {etat}
            </Button>
          ))}
        </div>

        <DataTable<LigneDemo>
          data={etatDuTableau === "vide" ? [] : lignes}
          columns={colonnes}
          getRowId={(ligne) => ligne.id}
          primaryColumnKey="titre"
          itemLabel="élément"
          isLoading={etatDuTableau === "chargement"}
          error={
            etatDuTableau === "erreur"
              ? "La liste n'a pas pu être chargée. Vérifiez votre connexion."
              : undefined
          }
          onRetry={() => setEtatDuTableau("rempli")}
          emptyState={{
            title: "Aucun élément pour l'instant",
            description:
              "Cette liste est vide. Créez un premier élément pour commencer.",
            action: (
              <Button type="button" onClick={() => setModaleOuverte(true)}>
                <Plus className="size-4" aria-hidden="true" />
                Nouvel élément
              </Button>
            ),
          }}
          search={{ placeholder: "Rechercher un élément…", keys: ["titre", "categorie"] }}
          filters={[
            {
              key: "status",
              label: "État",
              options: [
                { value: "draft", label: "Brouillon" },
                { value: "in_review", label: "À relire" },
                { value: "published", label: "En ligne" },
                { value: "archived", label: "Archivé" },
              ],
              match: (ligne, valeur) => ligne.status === valeur,
            },
            {
              key: "categorie",
              label: "Catégorie",
              options: [
                { value: "Éducation", label: "Éducation" },
                { value: "Santé", label: "Santé" },
                { value: "Environnement", label: "Environnement" },
                { value: "Insertion", label: "Insertion" },
              ],
              match: (ligne, valeur) => ligne.categorie === valeur,
            },
          ]}
          pagination={{ pageSize: 5 }}
          selection={{
            actions: [
              { key: "archiver", label: "Archiver", icon: Archive },
              {
                key: "supprimer",
                label: "Supprimer",
                icon: Trash2,
                variant: "destructive",
              },
            ],
            onBulk: (ids, action) =>
              toast.info(
                `${action.label} : ${ids.length} élément${ids.length > 1 ? "s" : ""} (démonstration).`,
              ),
          }}
          reorder={{
            onReorder: async (ordre) => {
              // Réordonnancement local : le banc n'écrit rien en base.
              setLignes((precedentes) =>
                ordre
                  .map((id) => precedentes.find((ligne) => ligne.id === id))
                  .filter((ligne): ligne is LigneDemo => ligne !== undefined),
              );
              toast.success("Ordre enregistré (démonstration).");
            },
          }}
          rowActions={(ligne) => [
            {
              label: "Modifier",
              icon: Pencil,
              onSelect: () => setModaleOuverte(true),
            },
            {
              label: "Supprimer",
              icon: Trash2,
              variant: "destructive",
              onSelect: () => {
                setASupprimer(ligne);
                setConfirmationOuverte(true);
              },
            },
          ]}
        />
      </Section>

      {/* ================================================================= */}
      <Section
        titre="FormModal et ConfirmDialog"
        description="Dialog au-dessus de 1024 px, Sheet plein écran en dessous. Modifiez un champ puis fermez : la confirmation apparaît."
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" onClick={() => setModaleOuverte(true)}>
            Ouvrir la modale de formulaire
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setASupprimer(lignes[0] ?? null);
              setConfirmationOuverte(true);
            }}
          >
            Ouvrir une confirmation destructive
          </Button>
        </div>
      </Section>

      {/* ================================================================= */}
      <Section
        titre="SchemaForm"
        description="Les onze types de champs, générés depuis un tableau de descripteurs. Aucun JSX de formulaire n'est écrit à la main."
      >
        <SchemaForm<ValeursDemo>
          fields={CHAMPS_DEMO}
          schema={schemaDemo}
          defaultValues={VALEURS_DEMO}
          references={REFERENCES_DEMO}
          submitLabel="Enregistrer (démonstration)"
          onSubmit={(valeurs) => {
            toast.success("Formulaire valide.");
            // Le banc n'écrit rien : la sortie part en console pour vérifier
            // la FORME des valeurs, en particulier `beneficiaires: null`.
            console.info("[démonstration] valeurs du formulaire", valeurs);
          }}
        />
      </Section>

      {/* ================================================================= */}
      <FormModal
        open={modaleOuverte}
        onOpenChange={setModaleOuverte}
        title="Modifier l'élément"
        description="Formulaire de démonstration — rien n'est enregistré."
        isDirty={formulaireModifie}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setModaleOuverte(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={() => {
                setFormulaireModifie(false);
                setModaleOuverte(false);
                toast.success("Enregistré (démonstration).");
              }}
            >
              Enregistrer
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Cochez la case ci-dessous pour simuler un formulaire modifié, puis
            fermez la modale par la croix, par Échap ou par un clic à
            l&apos;extérieur : les trois passent par la même confirmation.
          </p>

          <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-medium">
            <input
              type="checkbox"
              checked={formulaireModifie}
              onChange={(evenement) => setFormulaireModifie(evenement.target.checked)}
              className="size-4 accent-primary"
            />
            Le formulaire contient des modifications non enregistrées
          </label>

          {/* Remplissage : vérifie que le corps défile et que le pied reste fixe. */}
          {Array.from({ length: 10 }).map((_, index) => (
            <p key={index} className="text-sm text-muted-foreground">
              Paragraphe de remplissage nº {index + 1} — il sert à vérifier que
              l&apos;en-tête et le pied de la modale restent visibles pendant le
              défilement du corps.
            </p>
          ))}
        </div>
      </FormModal>

      <ConfirmDialog
        open={confirmationOuverte}
        onOpenChange={setConfirmationOuverte}
        title={
          aSupprimer
            ? `Supprimer « ${aSupprimer.titre} » ?`
            : "Supprimer cet élément ?"
        }
        description="Cette action est définitive. L'élément et son historique seront perdus."
        confirmLabel="Supprimer"
        onConfirm={() => {
          if (aSupprimer) {
            setLignes((precedentes) =>
              precedentes.filter((ligne) => ligne.id !== aSupprimer.id),
            );
          }
          setConfirmationOuverte(false);
          toast.success("Élément supprimé (démonstration).");
        }}
      />
    </div>
  );
}

function Section({
  titre,
  description,
  children,
}: {
  titre: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          {titre}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

/** Fuseau explicite : sans lui, le serveur formate en UTC. */
function formaterDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Douala",
  }).format(new Date(iso));
}
