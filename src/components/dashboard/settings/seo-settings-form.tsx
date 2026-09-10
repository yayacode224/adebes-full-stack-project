"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { FieldDescriptor } from "@/core/cms/blocks/types";
import type { SeoSettings } from "@/core/cms/entities/site-settings";
import {
  seoSettingsSchema,
  type SeoSettingsInput,
} from "@/core/cms/schemas/settings/seo.schema";
import { mettreAJourSeoAction } from "@/server/actions/settings.actions";

import { SchemaForm } from "../forms/schema-form";

/**
 * Le formulaire du groupe « seo » (§10.1 du Rapport 2).
 *
 * `keywords` reprend la forme « liste de chaînes simples » de `bullets[]`
 * (Lot 9, `champListeDeTextes` de `core/cms/blocks/shared.ts`) : un seul
 * descripteur `of`, au `name` vide. Ce fichier ne peut pas importer
 * `champListeDeTextes` — il est réservé aux blocs — mais rien n'empêche de
 * déclarer la même forme directement : c'est le descripteur qui compte, pas
 * la fonction qui l'a écrit.
 */
const CHAMPS: readonly FieldDescriptor[] = [
  {
    kind: "textarea",
    name: "metaDescription",
    label: "Description par défaut",
    required: true,
    maxLength: 300,
    rows: 3,
    hint: "Utilisée quand une page ne définit pas sa propre description — affichée sous le titre dans les résultats de recherche.",
  },
  {
    kind: "list",
    name: "keywords",
    label: "Mots-clés",
    itemLabel: "mot-clé",
    of: [{ kind: "text", name: "", label: "mot-clé" }],
    max: 20,
    hint: "Utilisés par les moteurs de recherche, jamais affichés sur le site.",
  },
  {
    kind: "media",
    name: "ogMediaId",
    label: "Image de partage (Open Graph)",
    accept: "image",
    hint: "Affichée en aperçu quand une page est partagée sur les réseaux sociaux, si la page ne définit pas sa propre image.",
  },
  {
    kind: "text",
    name: "locale",
    label: "Locale",
    required: true,
    placeholder: "fr_CM",
    hint: "Format technique « langue_PAYS », lu par les moteurs de recherche.",
  },
];

const CLES_FORMULAIRE = [
  "metaDescription",
  "keywords",
  "ogMediaId",
  "locale",
] as const satisfies readonly (keyof SeoSettingsInput)[];

export function SeoSettingsForm({ reglages }: { reglages: SeoSettings }) {
  const router = useRouter();

  return (
    <SchemaForm<SeoSettingsInput>
      fields={CHAMPS}
      schema={seoSettingsSchema}
      defaultValues={reglages}
      columns={1}
      submitLabel="Enregistrer"
      onSubmit={async (saisie, outils) => {
        const resultat = await mettreAJourSeoAction(saisie);

        if (resultat.ok) {
          toast.success("Réglages de référencement mis à jour.");
          router.refresh();
          return;
        }

        for (const cle of CLES_FORMULAIRE) {
          const message = resultat.fieldErrors?.[cle];
          if (message) outils.setError(cle, { message });
        }

        return resultat.message;
      }}
    />
  );
}
