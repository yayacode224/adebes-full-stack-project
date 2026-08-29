"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import {
  FormProvider,
  useForm,
  type DefaultValues,
  type FieldValues,
  type Resolver,
} from "react-hook-form";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { estPleineLargeur, type FieldDescriptor } from "@/core/cms/blocks/types";
import { cn } from "@/lib/utils";

import { FieldControl } from "./field-control";
import {
  ReferencesProvider,
  type OptionsDeReference,
} from "./references-context";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LE FORMULAIRE GÉNÉRÉ
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §10 du Rapport 1, propriété nº 2 : « le formulaire d'édition n'est jamais
 * écrit à la main ». Un bloc à douze champs coûte douze lignes de déclaration.
 *
 * ---------------------------------------------------------------------------
 * LE SCHÉMA ZOD EST LA MÊME AUTORITÉ DES DEUX CÔTÉS
 * ---------------------------------------------------------------------------
 * Celui passé ici est celui que la Server Action rejoue côté serveur
 * (`createAction`, étape 4). La validation côté client est un CONFORT — elle
 * évite un aller-retour — jamais une garantie : une Server Action est une
 * frontière publique, et rien de ce qui vient du navigateur n'est cru.
 *
 * ---------------------------------------------------------------------------
 * MISE EN PAGE (§6.2)
 * ---------------------------------------------------------------------------
 *   * une colonne sous `lg:`, **deux au maximum** au-delà, jamais trois ;
 *   * les champs longs (`textarea`, `richtext`, `list`, `media`) prennent
 *     toujours la largeur entière — la règle est portée par le descripteur
 *     lui-même (`estPleineLargeur`), pas répétée dans chaque écran ;
 *   * largeur bornée à `max-w-3xl` : un formulaire étiré sur 1440 px oblige à
 *     balayer l'écran des yeux à chaque champ.
 *
 * ---------------------------------------------------------------------------
 * LA BARRE D'ENREGISTREMENT
 * ---------------------------------------------------------------------------
 * `sticky bottom-0` avec `env(safe-area-inset-bottom)`. C'est ce qui fait que
 * « Enregistrer » n'est jamais au-delà de dix champs de défilement sur un
 * téléphone — le §6.2 en fait une exigence, pas une commodité.
 *
 * Elle se retire (`showSaveBar={false}`) quand le formulaire vit dans un
 * `<FormModal>`, qui fournit déjà son propre pied fixe.
 */
export function SchemaForm<TValeurs extends FieldValues>({
  fields,
  schema,
  defaultValues,
  onSubmit,
  submitLabel = "Enregistrer",
  secondaryAction,
  references,
  showSaveBar = true,
  columns = 2,
  className,
  children,
}: {
  fields: readonly FieldDescriptor[];
  /**
   * Le MÊME schéma que celui rejoué par la Server Action.
   *
   * Typé `z.ZodType<TValeurs, TValeurs>` — entrée ET sortie : `zodResolver`
   * exige que le type d'ENTRÉE du schéma soit assignable à `FieldValues`, ce
   * qu'un `unknown` implicite ne satisfait pas. Un schéma qui transformerait
   * ses valeurs (entrée ≠ sortie) ne conviendrait donc pas ici — et n'aurait
   * de toute façon pas sa place dans un formulaire, dont les champs éditent
   * la donnée telle qu'elle sera enregistrée.
   */
  schema: z.ZodType<TValeurs, TValeurs>;
  defaultValues: DefaultValues<TValeurs>;
  /**
   * Retourner un message d'erreur affiche un bandeau global ; retourner
   * `void` vaut succès. Les erreurs de champ se remontent avec `setError`,
   * accessible par la référence exposée ci-dessous.
   */
  onSubmit: (
    valeurs: TValeurs,
    outils: { setError: ReturnType<typeof useForm<TValeurs>>["setError"] },
  ) => Promise<string | void> | string | void;
  submitLabel?: string;
  secondaryAction?: ReactNode;
  references?: OptionsDeReference;
  showSaveBar?: boolean;
  /** 1 force la colonne unique — un formulaire de réglages, par exemple. */
  columns?: 1 | 2;
  className?: string;
  /** Contenu inséré entre les champs et la barre d'enregistrement. */
  children?: ReactNode;
}) {
  const methodes = useForm<TValeurs>({
    // `as Resolver<TValeurs>` : `zodResolver` infère son type de sortie depuis
    // le schéma, et TypeScript ne peut pas prouver qu'il coïncide avec le
    // générique de l'appelant. L'égalité est garantie par la signature de
    // `schema: z.ZodType<TValeurs>`.
    resolver: zodResolver(schema) as unknown as Resolver<TValeurs>,
    defaultValues,
    // Validation au premier envoi, puis à chaque frappe : signaler une erreur
    // sur un champ que l'utilisateur n'a pas encore fini de remplir le fait
    // douter de sa saisie plutôt que de l'aider.
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const {
    handleSubmit,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = methodes;

  const erreurGlobale = errors.root?.message;

  async function envoyer(valeurs: TValeurs) {
    const message = await onSubmit(valeurs, { setError });
    if (typeof message === "string") {
      setError("root", { message });
    }
  }

  return (
    <FormProvider {...methodes}>
      <ReferencesProvider options={references ?? {}}>
        <form
          onSubmit={handleSubmit(envoyer)}
          // `noValidate` : la validation native du navigateur afficherait ses
          // propres bulles, en anglais, à côté des messages de Zod.
          noValidate
          className={cn("flex w-full max-w-3xl flex-col gap-6", className)}
        >
          {erreurGlobale ? (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive"
            >
              <TriangleAlert
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              {erreurGlobale}
            </p>
          ) : null}

          <div
            className={cn(
              "grid grid-cols-1 gap-x-6 gap-y-5",
              columns === 2 && "lg:grid-cols-2",
            )}
          >
            {fields.map((champ) => (
              <div
                key={champ.name}
                className={cn(
                  "min-w-0",
                  columns === 2 && estPleineLargeur(champ) && "lg:col-span-2",
                )}
              >
                <FieldControl champ={champ} />
              </div>
            ))}
          </div>

          {children}

          {showSaveBar ? (
            <div
              className={cn(
                // `sticky bottom-0` + zone sûre : le bouton reste atteignable
                // sans dérouler tout le formulaire, et ne passe pas sous la
                // barre système d'un téléphone récent.
                "sticky bottom-0 -mx-4 flex flex-col gap-2 border-t border-border bg-background/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-sm",
                "sm:mx-0 sm:flex-row sm:items-center sm:justify-end sm:rounded-lg sm:border sm:px-4 sm:pb-3",
                "[&>*]:w-full sm:[&>*]:w-auto",
              )}
            >
              {/*
                L'état « modifications non enregistrées » est annoncé, pas
                seulement coloré : c'est la seule indication qu'il reste
                quelque chose à faire avant de quitter l'écran.
              */}
              <p
                aria-live="polite"
                className="text-xs text-muted-foreground sm:mr-auto sm:w-auto"
              >
                {isDirty
                  ? "Modifications non enregistrées."
                  : "Aucune modification en attente."}
              </p>

              {secondaryAction}

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Enregistrement…
                  </>
                ) : (
                  submitLabel
                )}
              </Button>
            </div>
          ) : null}
        </form>
      </ReferencesProvider>
    </FormProvider>
  );
}
