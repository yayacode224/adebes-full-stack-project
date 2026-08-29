"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Send } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { submitVolunteer } from "@/app/actions/forms";
import { Field, HoneypotField, fieldAria } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  disponibilites,
  volunteerSchema,
  type VolunteerInput,
} from "@/lib/schemas";

/**
 * Formulaire de candidature de bénévole.
 *
 * ---------------------------------------------------------------------------
 * LES DOMAINES ARRIVENT EN PROPS DEPUIS LA BASE (Lot 8A, §8A.2)
 * ---------------------------------------------------------------------------
 * Ils venaient de `volunteerDomains`, construit en statique depuis
 * `src/content/programmes.ts`. Les programmes vivent désormais en base, et un
 * schéma Zod partagé client/serveur ne peut pas être asynchrone : la liste est
 * lue par le Server Component parent et passée ici, tandis que
 * `submitVolunteer` vérifie l'appartenance côté serveur — la seule
 * vérification qui protège.
 */
export function VolunteerForm({
  domains,
  defaultDomain,
}: {
  /** Les `benevolatLabel` des programmes PUBLIÉS, dans l'ordre d'affichage. */
  domains: readonly string[];
  defaultDomain?: string;
}) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VolunteerInput>({
    resolver: zodResolver(volunteerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      city: "",
      /*
        Aucun domaine présélectionné si la liste est vide : écrire un libellé
        en dur ici ferait partir une candidature vers un domaine qui n'existe
        pas, et la Server Action la refuserait sans que personne comprenne.
      */
      domain: defaultDomain ?? domains[0] ?? "",
      availability: disponibilites[0],
      message: "",
      consent: false as unknown as true,
      website: "",
    },
  });

  async function onSubmit(values: VolunteerInput) {
    const result = await submitVolunteer(values);

    if (result.ok) {
      toast.success(result.message);
      reset();
    } else {
      toast.error(result.message, { duration: 10000 });
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="relative flex flex-col gap-5"
    >
      <HoneypotField register={register("website")} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label="Nom complet" required error={errors.name?.message}>
          <Input
            {...register("name")}
            {...fieldAria("name", Boolean(errors.name), false)}
            autoComplete="name"
            placeholder="Votre nom"
            className="h-11"
          />
        </Field>

        <Field id="email" label="Adresse e-mail" required error={errors.email?.message}>
          <Input
            {...register("email")}
            {...fieldAria("email", Boolean(errors.email), false)}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="vous@exemple.com"
            className="h-11"
          />
        </Field>

        <Field id="phone" label="Téléphone" required error={errors.phone?.message}>
          <Input
            {...register("phone")}
            {...fieldAria("phone", Boolean(errors.phone), false)}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+237 6XX XX XX XX"
            className="h-11"
          />
        </Field>

        <Field id="city" label="Ville" required error={errors.city?.message}>
          <Input
            {...register("city")}
            {...fieldAria("city", Boolean(errors.city), false)}
            autoComplete="address-level2"
            placeholder="Douala, Yaoundé…"
            className="h-11"
          />
        </Field>

        <Field
          id="domain"
          label="Domaine d'intérêt"
          required
          error={errors.domain?.message}
        >
          {domains.length === 0 ? (
            /*
              Aucun programme publié : la liste serait VIDE. On le dit plutôt
              que d'afficher une liste déroulante qui ne s'ouvre sur rien —
              invariant nº 1 : une absence ne se présente jamais comme une
              donnée. Le reste du formulaire, lui, reste utilisable.
            */
            <p className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">
              Les domaines d&apos;engagement ne sont pas disponibles pour le
              moment. Écrivez-nous directement, nous vous orienterons.
            </p>
          ) : (
            <Controller
              control={control}
              name="domain"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    {...fieldAria("domain", Boolean(errors.domain), false)}
                    className="h-11 w-full"
                  >
                    <SelectValue placeholder="Choisissez un domaine" />
                  </SelectTrigger>
                  <SelectContent>
                    {domains.map((domain) => (
                      <SelectItem key={domain} value={domain}>
                        {domain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
        </Field>

        <Field
          id="availability"
          label="Disponibilités"
          required
          error={errors.availability?.message}
        >
          <Controller
            control={control}
            name="availability"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  {...fieldAria(
                    "availability",
                    Boolean(errors.availability),
                    false,
                  )}
                  className="h-11 w-full"
                >
                  <SelectValue placeholder="Choisissez" />
                </SelectTrigger>
                <SelectContent>
                  {disponibilites.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </div>

      <Field
        id="message"
        label="Parlez-nous de vous"
        error={errors.message?.message}
        hint="Compétences, expériences, motivations — quelques lignes suffisent."
      >
        <Textarea
          {...register("message")}
          {...fieldAria("message", Boolean(errors.message), true)}
          rows={5}
          placeholder="Ce que vous aimeriez apporter à ADEBES."
          className="min-h-28 resize-y"
        />
      </Field>

      <Field id="consent" label="" error={errors.consent?.message} className="gap-0">
        <Controller
          control={control}
          name="consent"
          render={({ field }) => (
            <label
              htmlFor="consent"
              className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-muted-foreground"
            >
              <Checkbox
                id="consent"
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-invalid={Boolean(errors.consent) || undefined}
                aria-describedby={errors.consent ? "consent-error" : undefined}
                className="mt-0.5 size-5"
              />
              <span>
                J&apos;accepte qu&apos;ADEBES conserve ces informations pour
                traiter ma candidature de bénévole.
              </span>
            </label>
          )}
        />
      </Field>

      <Button type="submit" size="lg" disabled={isSubmitting} className="sm:w-fit">
        {isSubmitting ? (
          <>
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            Envoi en cours…
          </>
        ) : (
          <>
            <Send className="size-4" aria-hidden="true" />
            Envoyer ma candidature
          </>
        )}
      </Button>
    </form>
  );
}
