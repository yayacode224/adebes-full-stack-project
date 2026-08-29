"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Field, fieldAria } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/core/cms/schemas/auth.schema";
import { resetPasswordAction } from "@/server/actions/auth.actions";

/** Définition d'un nouveau mot de passe, depuis le lien reçu par e-mail. */
export function ResetPasswordForm() {
  const router = useRouter();
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", passwordConfirmation: "" },
  });

  async function onSubmit(valeurs: ResetPasswordInput) {
    setErreurGlobale(null);
    const resultat = await resetPasswordAction(valeurs);

    if (resultat.ok) {
      toast.success(resultat.message ?? "Mot de passe mis à jour.");
      router.refresh();
      router.replace("/dashboard");
      return;
    }

    if (resultat.fieldErrors && Object.keys(resultat.fieldErrors).length > 0) {
      for (const [champ, message] of Object.entries(resultat.fieldErrors)) {
        setError(champ as keyof ResetPasswordInput, { message });
      }
      return;
    }

    setErreurGlobale(resultat.message);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      {erreurGlobale ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"
        >
          {erreurGlobale}
        </p>
      ) : null}

      <Field
        id="password"
        label="Nouveau mot de passe"
        required
        error={errors.password?.message}
        hint="12 caractères minimum. Une phrase dont vous vous souvenez vaut mieux qu'un mot compliqué."
      >
        <Input
          type="password"
          autoComplete="new-password"
          className="text-base md:text-sm"
          {...fieldAria("password", !!errors.password, true)}
          {...register("password")}
        />
      </Field>

      <Field
        id="passwordConfirmation"
        label="Confirmez le mot de passe"
        required
        error={errors.passwordConfirmation?.message}
      >
        <Input
          type="password"
          autoComplete="new-password"
          className="text-base md:text-sm"
          {...fieldAria(
            "passwordConfirmation",
            !!errors.passwordConfirmation,
            false,
          )}
          {...register("passwordConfirmation")}
        />
      </Field>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Enregistrement…
          </>
        ) : (
          "Enregistrer le nouveau mot de passe"
        )}
      </Button>
    </form>
  );
}
