"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { FieldDescriptor } from "@/core/cms/blocks/types";
import type { IdentitySettings } from "@/core/cms/entities/site-settings";
import {
  identitySettingsSchema,
  type IdentitySettingsInput,
} from "@/core/cms/schemas/settings/identity.schema";
import { mettreAJourIdentiteAction } from "@/server/actions/settings.actions";

import { SchemaForm } from "../forms/schema-form";

/**
 * Le formulaire du groupe « identity » (§10.1 du Rapport 2).
 *
 * `columns={1}` : c'est l'exemple même que cite `<SchemaForm>` pour ce
 * réglage (« un formulaire de réglages »). Les huit champs sont ceux de
 * `siteConfig` (`src/lib/site-config.ts`), dans le même ordre.
 */
const CHAMPS: readonly FieldDescriptor[] = [
  { kind: "text", name: "name", label: "Nom", required: true, maxLength: 80 },
  {
    kind: "text",
    name: "legalName",
    label: "Raison sociale",
    required: true,
    maxLength: 160,
  },
  { kind: "text", name: "motto", label: "Devise", required: true, maxLength: 160 },
  {
    kind: "text",
    name: "tagline",
    label: "Accroche",
    required: true,
    maxLength: 160,
    hint: "Affichée sous le nom sur la page d'accueil.",
  },
  {
    kind: "textarea",
    name: "description",
    label: "Description",
    required: true,
    maxLength: 500,
    rows: 4,
    hint: "Reprise dans les métadonnées quand aucune description de référencement n'est définie.",
  },
  {
    kind: "number",
    name: "foundingYear",
    label: "Année de création",
    min: 1900,
    max: 2100,
  },
  { kind: "media", name: "logoMediaId", label: "Logo", accept: "image" },
  { kind: "media", name: "faviconMediaId", label: "Icône du site (favicon)", accept: "image" },
];

const CLES_FORMULAIRE = [
  "name",
  "legalName",
  "motto",
  "tagline",
  "description",
  "foundingYear",
  "logoMediaId",
  "faviconMediaId",
] as const satisfies readonly (keyof IdentitySettingsInput)[];

export function IdentitySettingsForm({ reglages }: { reglages: IdentitySettings }) {
  const router = useRouter();

  return (
    <SchemaForm<IdentitySettingsInput>
      fields={CHAMPS}
      schema={identitySettingsSchema}
      defaultValues={reglages}
      columns={1}
      submitLabel="Enregistrer"
      onSubmit={async (saisie, outils) => {
        const resultat = await mettreAJourIdentiteAction(saisie);

        if (resultat.ok) {
          toast.success("Identité de l'association mise à jour.");
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
