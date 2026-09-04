"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { FieldDescriptor } from "@/core/cms/blocks/types";
import {
  createPageFormSchema,
  type CreatePageFormInput,
} from "@/core/cms/schemas/page.schema";
import { creerPageAction } from "@/server/actions/pages.actions";

import { SchemaForm } from "../forms/schema-form";

/**
 * Formulaire de création d'une page. §9.2 du Rapport 2.
 *
 * ⚠️  `route` reste éditable ici, contrairement à l'éditeur : une page qui
 * vient de naître n'est jamais système, la garde d'`update-page.ts` ne
 * s'applique pas encore.
 */
const CHAMPS: readonly FieldDescriptor[] = [
  {
    kind: "text",
    name: "title",
    label: "Titre de la page",
    required: true,
    maxLength: 120,
    placeholder: "Nos partenaires",
  },
  {
    kind: "text",
    name: "route",
    label: "Adresse",
    maxLength: 120,
    placeholder: "/nos-partenaires",
    hint: "Laissez vide pour la déduire automatiquement du titre. Modifiable ensuite, tant que la page n'est pas de la structure du site.",
  },
];

const VALEURS_VIERGES: CreatePageFormInput = { title: "", route: "" };

export function NewPageForm() {
  const router = useRouter();

  return (
    <SchemaForm<CreatePageFormInput>
      fields={CHAMPS}
      schema={createPageFormSchema}
      defaultValues={VALEURS_VIERGES}
      submitLabel="Créer la page"
      onSubmit={async (saisie, outils) => {
        // Une route vide ferait échouer `createPageSchema` (elle est
        // obligatoire côté serveur) : `create-page.ts` la dérive du titre.
        // On ne transmet donc que ce qui est réellement saisi.
        const resultat = await creerPageAction({
          title: saisie.title,
          route: saisie.route.trim() || undefined,
        });

        if (resultat.ok) {
          toast.success(
            "Page créée, en brouillon. Ajoutez-lui des sections pour la remplir.",
          );
          router.push(`/dashboard/pages/${resultat.data.id}`);
          return;
        }

        for (const cle of ["title", "route"] as const) {
          const message = resultat.fieldErrors?.[cle];
          if (message) outils.setError(cle, { message });
        }
        if (!resultat.fieldErrors) return resultat.message;
      }}
    />
  );
}
