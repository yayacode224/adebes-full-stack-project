"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Send } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { submitContact } from "@/app/actions/forms";
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
import { contactSchema, contactSubjects, type ContactInput } from "@/lib/schemas";

export function ContactForm({
  defaultSubject = "Demander une information",
}: {
  defaultSubject?: (typeof contactSubjects)[number];
}) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: defaultSubject,
      message: "",
      consent: false as unknown as true,
      website: "",
    },
  });

  async function onSubmit(values: ContactInput) {
    const result = await submitContact(values);

    if (result.ok) {
      toast.success(result.message);
      reset();
    } else {
      // `duration` allongée : le message de repli contient des coordonnées
      // que le visiteur doit avoir le temps de lire et de noter.
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

        <Field
          id="phone"
          label="Téléphone"
          error={errors.phone?.message}
          hint="Pour un rappel ou un échange sur WhatsApp."
        >
          <Input
            {...register("phone")}
            {...fieldAria("phone", Boolean(errors.phone), true)}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+237 6XX XX XX XX"
            className="h-11"
          />
        </Field>

        <Field id="subject" label="Sujet" required error={errors.subject?.message}>
          <Controller
            control={control}
            name="subject"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  {...fieldAria("subject", Boolean(errors.subject), false)}
                  className="h-11 w-full"
                >
                  <SelectValue placeholder="Choisissez un sujet" />
                </SelectTrigger>
                <SelectContent>
                  {contactSubjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </div>

      <Field id="message" label="Votre message" required error={errors.message?.message}>
        <Textarea
          {...register("message")}
          {...fieldAria("message", Boolean(errors.message), false)}
          rows={6}
          placeholder="Décrivez votre demande en quelques lignes."
          className="min-h-32 resize-y"
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
                J&apos;accepte qu&apos;ADEBES utilise ces informations pour
                répondre à ma demande. Elles ne sont ni revendues ni utilisées
                à d&apos;autres fins.
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
            Envoyer le message
          </>
        )}
      </Button>
    </form>
  );
}
