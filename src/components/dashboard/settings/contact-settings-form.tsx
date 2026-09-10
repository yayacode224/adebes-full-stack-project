"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { FieldDescriptor } from "@/core/cms/blocks/types";
import { toEditableText, type ContactSettings } from "@/core/cms/entities/site-settings";
import {
  contactSettingsSchema,
  type ContactSettingsInput,
} from "@/core/cms/schemas/settings/contact.schema";
import { mettreAJourContactAction } from "@/server/actions/settings.actions";

import { SchemaForm } from "../forms/schema-form";

/**
 * Le formulaire du groupe « contact » (§10.1 et §10.2 du Rapport 2).
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `streetAddress` ET `postalCode` S'AFFICHENT VIDES, PAS AVEC LE MARQUEUR
 * ---------------------------------------------------------------------------
 * `toEditableText` (`core/cms/entities/site-settings.ts`) retraduit
 * `[À COMPLÉTER]` en chaîne vide dans `valeursInitiales`. Le trajet inverse a
 * lieu à l'écriture, dans `update-contact-settings.ts` : laisser le champ vide
 * et enregistrer FAIT réapparaître le marqueur, sans que personne n'ait à le
 * taper.
 *
 * ---------------------------------------------------------------------------
 * LE TÉLÉPHONE SECONDAIRE N'A PAS DE CASE À COCHER
 * ---------------------------------------------------------------------------
 * À la différence des réseaux sociaux (§10.2), ce champ n'a pas besoin d'une
 * décision explicite « existe / n'existe pas » : un champ vide EST l'absence
 * d'un second numéro, sans ambiguïté possible — il n'y a pas d'icône grisée à
 * distinguer d'un lien mort ici, seulement une ligne d'affichage qui apparaît
 * ou non sur `/contact`. La seule règle qui compte est la distinction, et elle
 * est portée par `contactSettingsSchema` (§10.2) : un numéro identique au
 * principal est refusé, quels que soient les espaces ou le format.
 */
const CHAMPS: readonly FieldDescriptor[] = [
  { kind: "text", name: "city", label: "Ville", required: true, maxLength: 80 },
  { kind: "text", name: "country", label: "Pays", required: true, maxLength: 80 },
  {
    kind: "text",
    name: "streetAddress",
    label: "Adresse (rue et numéro)",
    maxLength: 200,
    hint: "Laissez vide si l'adresse précise n'est pas encore connue : le site affichera « [À COMPLÉTER] ».",
  },
  {
    kind: "text",
    name: "postalCode",
    label: "Code postal",
    maxLength: 20,
    hint: "Laissez vide si inconnu.",
  },
  { kind: "text", name: "region", label: "Région", required: true, maxLength: 80 },
  {
    kind: "text",
    name: "email",
    label: "Adresse e-mail",
    required: true,
    placeholder: "contact@adebes.cm",
  },
  {
    kind: "text",
    name: "phoneE164",
    label: "Téléphone (format international)",
    required: true,
    placeholder: "+237680678939",
    hint: "Utilisé pour les liens « Appeler » et WhatsApp.",
  },
  {
    kind: "text",
    name: "phoneDisplay",
    label: "Téléphone affiché",
    required: true,
    placeholder: "+237 680 67 89 39",
  },
  {
    kind: "text",
    name: "secondaryPhoneE164",
    label: "Second téléphone (format international)",
    placeholder: "+237…",
    hint: "Laissez les deux champs de second numéro vides si l'association n'en a qu'un.",
  },
  {
    kind: "text",
    name: "secondaryPhoneDisplay",
    label: "Second téléphone affiché",
    placeholder: "+237 …",
  },
  {
    kind: "text",
    name: "openingHours",
    label: "Horaires (affichés)",
    required: true,
    placeholder: "Lundi – Samedi, 8h – 18h",
  },
  {
    kind: "text",
    name: "openingHoursSpec",
    label: "Horaires (format technique)",
    required: true,
    placeholder: "Mo-Sa 08:00-18:00",
    hint: "Format schema.org, lu par les moteurs de recherche — pas affiché tel quel.",
  },
  {
    kind: "number",
    name: "geo.latitude",
    label: "Latitude",
    min: -90,
    max: 90,
  },
  {
    kind: "number",
    name: "geo.longitude",
    label: "Longitude",
    min: -180,
    max: 180,
  },
];

const CLES_FORMULAIRE = [
  "city",
  "country",
  "streetAddress",
  "postalCode",
  "region",
  "email",
  "phoneE164",
  "phoneDisplay",
  "secondaryPhoneE164",
  "secondaryPhoneDisplay",
  "openingHours",
  "openingHoursSpec",
  "geo.latitude",
  "geo.longitude",
] as const;

export function ContactSettingsForm({ reglages }: { reglages: ContactSettings }) {
  const router = useRouter();

  const valeursInitiales: ContactSettingsInput = {
    ...reglages,
    streetAddress: toEditableText(reglages.streetAddress),
    postalCode: toEditableText(reglages.postalCode),
    secondaryPhoneE164: reglages.secondaryPhoneE164 ?? "",
    secondaryPhoneDisplay: reglages.secondaryPhoneDisplay ?? "",
  };

  return (
    <SchemaForm<ContactSettingsInput>
      fields={CHAMPS}
      schema={contactSettingsSchema}
      defaultValues={valeursInitiales}
      columns={1}
      submitLabel="Enregistrer"
      onSubmit={async (saisie, outils) => {
        const resultat = await mettreAJourContactAction(saisie);

        if (resultat.ok) {
          toast.success("Coordonnées mises à jour.");
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
