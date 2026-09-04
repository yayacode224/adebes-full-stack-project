"use client";

import { Lock } from "lucide-react";

import type { FieldDescriptor } from "@/core/cms/blocks/types";
import type { Page } from "@/core/cms/entities/page";
import {
  pageFormSchema,
  type PageFormInput,
} from "@/core/cms/schemas/page.schema";

import { SchemaForm } from "../forms/schema-form";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  RÉGLAGES DE LA PAGE — zone DROITE de l'éditeur (§9.3)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * « Titre, adresse, métadonnées SEO, image de partage, statut, bouton
 * "Prévisualiser". » Le statut et la prévisualisation vivent dans
 * `<PageActionBar>` — ce ne sont pas des champs qu'on saisit, ce sont des
 * décisions avec leur propre permission (voir son en-tête). Ce formulaire ne
 * couvre donc que la SAISIE.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `route` DISPARAÎT DU FORMULAIRE POUR UNE PAGE SYSTÈME — PAS DÉSACTIVÉE
 * ---------------------------------------------------------------------------
 * `FieldDescriptor` n'a pas de drapeau « lecture seule » : c'est un type
 * partagé par les dix-sept blocs, et lui en ajouter un pour un seul écran
 * l'aurait alourdi partout pour un besoin local.
 *
 * La solution retenue est la même que pour `champsEntete({ sansAlignement })`
 * au Lot 9 : composer la liste de champs SELON LE CONTEXTE plutôt que
 * d'étendre le contrat. Une page système affiche son adresse en lecture seule,
 * hors du formulaire, avec le cadenas qui explique pourquoi — exactement le
 * motif déjà posé dans `<PagesClient>`. `update-page.ts` refuserait de toute
 * façon le changement ; l'écran évite simplement de le proposer pour rien.
 */

const CHAMPS_COMMUNS: readonly FieldDescriptor[] = [
  {
    kind: "text",
    name: "title",
    label: "Titre de la page",
    required: true,
    maxLength: 120,
    hint: "Employé comme balise <title> tant qu'aucun titre de référencement n'est saisi ci-dessous.",
  },
];

const CHAMPS_ROUTE: readonly FieldDescriptor[] = [
  {
    kind: "text",
    name: "route",
    label: "Adresse",
    required: true,
    maxLength: 120,
    placeholder: "/ma-page",
    hint: "Commence par une barre oblique, sans accent ni majuscule.",
  },
];

const CHAMPS_SEO: readonly FieldDescriptor[] = [
  {
    kind: "text",
    name: "metaTitle",
    label: "Titre de référencement",
    maxLength: 70,
    hint: "Affiché dans l'onglet du navigateur et dans Google. Laissez vide pour employer le titre de la page.",
  },
  {
    kind: "textarea",
    name: "metaDescription",
    label: "Description de référencement",
    maxLength: 180,
    rows: 3,
    hint: "Le résumé affiché sous le titre dans les résultats de recherche.",
  },
  {
    kind: "media",
    name: "ogMediaId",
    label: "Image de partage",
    accept: "image",
    hint: "Affichée quand la page est partagée sur les réseaux sociaux.",
  },
];

export function PageSettingsForm({
  page,
  onSubmit,
}: {
  page: Page;
  onSubmit: (valeurs: PageFormInput) => Promise<string | void>;
}) {
  const champs = page.isSystem
    ? [...CHAMPS_COMMUNS, ...CHAMPS_SEO]
    : [...CHAMPS_COMMUNS, ...CHAMPS_ROUTE, ...CHAMPS_SEO];

  const valeurs: PageFormInput = {
    title: page.title,
    route: page.route,
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    ogMediaId: page.ogMediaId,
  };

  return (
    <div className="flex flex-col gap-4">
      {page.isSystem ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/30 px-3.5 py-3 text-sm">
          <Lock
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <div>
            <p className="font-medium text-foreground">{page.route}</p>
            <p className="text-xs text-muted-foreground">
              Cette page fait partie de la structure du site : son adresse est
              verrouillée. Le titre et le référencement restent modifiables.
            </p>
          </div>
        </div>
      ) : null}

      <SchemaForm<PageFormInput>
        // `key` sur l'identifiant : ouvrir une autre page doit REMPLACER le
        // formulaire, pas le réutiliser — `defaultValues` n'est lu qu'au
        // montage par react-hook-form.
        key={page.id}
        fields={champs}
        schema={pageFormSchema}
        defaultValues={valeurs}
        columns={1}
        submitLabel="Enregistrer les réglages"
        // `<SchemaForm>` pose déjà `root` si ce qu'on lui rend est une chaîne
        // (voir sa fonction `envoyer`) : inutile de le refaire ici.
        onSubmit={async (saisie) => onSubmit(saisie)}
      />
    </div>
  );
}
