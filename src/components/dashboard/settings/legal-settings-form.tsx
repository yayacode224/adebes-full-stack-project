"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { FieldDescriptor } from "@/core/cms/blocks/types";
import { toEditableText, type LegalSettings } from "@/core/cms/entities/site-settings";
import {
  legalSettingsSchema,
  type LegalSettingsInput,
} from "@/core/cms/schemas/settings/legal.schema";
import { mettreAJourLegalAction } from "@/server/actions/settings.actions";

import { SchemaForm } from "../forms/schema-form";

/**
 * Le formulaire du groupe « legal » (§10.1 et §10.2 du Rapport 2).
 *
 * Les trois premiers champs suivent la même convention que
 * `ContactSettingsForm` : affichés vides pour le marqueur
 * `[À COMPLÉTER]`, retraduits à l'écriture par `update-legal-settings.ts`.
 *
 * `registrationNumber` est le champ que le §10 de REPRISE-CONTEXTE.md cite
 * explicitement : c'est la première fois qu'un écran de réglages peut le
 * faire disparaître d'un site déjà public, plutôt que par un commit.
 */
const CHAMPS: readonly FieldDescriptor[] = [
  {
    kind: "text",
    name: "registrationNumber",
    label: "Numéro d'enregistrement",
    maxLength: 80,
    hint: "Laissez vide si l'association n'a pas encore ce numéro : le site affichera « [À COMPLÉTER] » sur les mentions légales.",
  },
  {
    kind: "text",
    name: "registrationAuthority",
    label: "Autorité d'enregistrement",
    maxLength: 160,
    hint: "Laissez vide si inconnue.",
  },
  {
    kind: "text",
    name: "publicationDirector",
    label: "Directeur ou directrice de la publication",
    maxLength: 160,
    hint: "Laissez vide si non désigné·e.",
  },
  {
    kind: "text",
    name: "hostingProvider.name",
    label: "Nom de l'hébergeur",
    required: true,
    maxLength: 160,
  },
  {
    kind: "text",
    name: "hostingProvider.address",
    label: "Adresse de l'hébergeur",
    required: true,
    maxLength: 240,
  },
  {
    kind: "text",
    name: "hostingProvider.url",
    label: "Site de l'hébergeur",
    required: true,
    placeholder: "https://vercel.com",
  },
];

const CLES_FORMULAIRE = [
  "registrationNumber",
  "registrationAuthority",
  "publicationDirector",
  "hostingProvider.name",
  "hostingProvider.address",
  "hostingProvider.url",
] as const;

export function LegalSettingsForm({ reglages }: { reglages: LegalSettings }) {
  const router = useRouter();

  const valeursInitiales: LegalSettingsInput = {
    ...reglages,
    registrationNumber: toEditableText(reglages.registrationNumber),
    registrationAuthority: toEditableText(reglages.registrationAuthority),
    publicationDirector: toEditableText(reglages.publicationDirector),
  };

  return (
    <SchemaForm<LegalSettingsInput>
      fields={CHAMPS}
      schema={legalSettingsSchema}
      defaultValues={valeursInitiales}
      columns={1}
      submitLabel="Enregistrer"
      onSubmit={async (saisie, outils) => {
        const resultat = await mettreAJourLegalAction(saisie);

        if (resultat.ok) {
          toast.success("Mentions légales mises à jour.");
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
