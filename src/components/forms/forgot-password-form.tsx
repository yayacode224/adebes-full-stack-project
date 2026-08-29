"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MailCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Field, fieldAria } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/core/cms/schemas/auth.schema";
import { requestPasswordResetAction } from "@/server/actions/auth.actions";

/** Demande d'un lien de réinitialisation. */
export function ForgotPasswordForm() {
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(valeurs: ForgotPasswordInput) {
    const resultat = await requestPasswordResetAction(valeurs);
    setConfirmation(
      resultat.ok
        ? (resultat.message ?? "E-mail envoyé.")
        : resultat.message,
    );
  }

  /*
   * L'écran de confirmation remplace le formulaire.
   *
   * Le message reste volontairement au conditionnel — « si un compte
   * existe » — parce que la Server Action répond la même chose que l'adresse
   * soit connue ou non. Confirmer l'existence d'un compte permettrait
   * d'énumérer les utilisateurs.
   */
  if (confirmation) {
    return (
      <div className="flex flex-col items-center gap-3 text-center" role="status">
        <MailCheck className="size-8 text-success" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">{confirmation}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <Field
        id="email"
        label="Adresse e-mail"
        required
        error={errors.email?.message}
        hint="Celle avec laquelle votre compte a été créé."
      >
        <Input
          type="email"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="text-base md:text-sm"
          {...fieldAria("email", !!errors.email, true)}
          {...register("email")}
        />
      </Field>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Envoi…
          </>
        ) : (
          "Envoyer le lien de réinitialisation"
        )}
      </Button>
    </form>
  );
}
