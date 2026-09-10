"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { SocialsSettings } from "@/core/cms/entities/site-settings";
import {
  socialsSettingsSchema,
  type SocialsSettingsInput,
} from "@/core/cms/schemas/settings/socials.schema";
import { mettreAJourReseauxSociauxAction } from "@/server/actions/settings.actions";

import { FieldControl } from "../forms/field-control";
import { SchemaForm } from "../forms/schema-form";

/**
 * Le formulaire du groupe « socials » (§10.1 et §10.2 du Rapport 2).
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `fields={[]}` — LES TROIS RÉSEAUX SONT DES `<fieldset>` ÉCRITS À LA MAIN
 * ---------------------------------------------------------------------------
 * `<SchemaForm>` génère une grille PLATE : aucun `FieldDescriptor` ne sait
 * regrouper des champs sous un sous-titre (« Facebook », « Instagram »,
 * « TikTok »). Trois champs `boolean` et trois champs `text` sans
 * regroupement auraient rendu impossible de savoir, en un coup d'œil, quelle
 * case va avec quelle adresse.
 *
 * La solution retenue est celle de `<ApercuValeur>` (§8E, `value-form.tsx`) :
 * `<SchemaForm>` reste la seule source de vérité pour le formulaire
 * (`FormProvider`, validation, barre d'enregistrement), et ce composant lit
 * son contexte pour dessiner la mise en page qui manque au générateur —
 * `<FieldControl>` reste le seul point d'entrée qui sait rendre un champ, il
 * n'est simplement pas appelé par `<SchemaForm>` lui-même ici.
 */
const RESEAUX = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
] as const;

const CLES_FORMULAIRE = ["facebook.href", "instagram.href", "tiktok.href"] as const;

export function SocialsSettingsForm({ reglages }: { reglages: SocialsSettings }) {
  const router = useRouter();

  return (
    <SchemaForm<SocialsSettingsInput>
      fields={[]}
      schema={socialsSettingsSchema}
      defaultValues={reglages}
      columns={1}
      submitLabel="Enregistrer"
      onSubmit={async (saisie, outils) => {
        const resultat = await mettreAJourReseauxSociauxAction(saisie);

        if (resultat.ok) {
          toast.success("Réseaux sociaux mis à jour.");
          router.refresh();
          return;
        }

        for (const cle of CLES_FORMULAIRE) {
          const message = resultat.fieldErrors?.[cle];
          if (message) outils.setError(cle, { message });
        }

        return resultat.message;
      }}
    >
      <div className="flex flex-col gap-6">
        {RESEAUX.map((reseau) => (
          <fieldset
            key={reseau.key}
            className="flex flex-col gap-4 rounded-lg border border-border p-4"
          >
            <legend className="px-1 text-sm font-semibold text-foreground">
              {reseau.label}
            </legend>

            <FieldControl
              name={`${reseau.key}.configured`}
              champ={{
                kind: "boolean",
                name: `${reseau.key}.configured`,
                label: "Ce compte a été créé",
                hint: "Décochez si le compte n'existe pas encore : l'icône apparaîtra grisée « bientôt » sur le site, jamais comme un lien mort.",
              }}
            />

            <FieldControl
              name={`${reseau.key}.href`}
              champ={{
                kind: "text",
                name: `${reseau.key}.href`,
                label: "Adresse du compte",
                placeholder: `https://www.${reseau.key}.com/…`,
                hint: "Lien sécurisé (https://), obligatoire tant que la case ci-dessus est cochée.",
              }}
            />
          </fieldset>
        ))}
      </div>
    </SchemaForm>
  );
}
