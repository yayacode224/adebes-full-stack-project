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
import { signInSchema, type SignInInput } from "@/core/cms/schemas/auth.schema";
import { signInAction } from "@/server/actions/auth.actions";

/**
 * Formulaire de connexion.
 *
 * Reprend exactement le patron des formulaires du site (`contact-form.tsx`) :
 * `react-hook-form` + `zodResolver` + `Field`/`fieldAria` + `toast` de
 * `sonner`. L'accessibilité déjà en place dans `Field` — label associé,
 * `role="alert"`, icône ET texte pour l'erreur — n'est pas réécrite.
 */
export function SignInForm({ suivant }: { suivant?: string }) {
  const router = useRouter();
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "", suivant },
  });

  async function onSubmit(valeurs: SignInInput) {
    setErreurGlobale(null);
    const resultat = await signInAction(valeurs);

    if (resultat.ok) {
      toast.success("Connexion réussie.");
      // `refresh()` avant `replace()` : sans lui, le rendu serveur mis en
      // cache par le routeur ignorerait la session qui vient d'être ouverte,
      // et le dashboard renverrait aussitôt vers la connexion.
      router.refresh();
      router.replace(resultat.data.suivant);
      return;
    }

    // Erreurs rattachées à un champ précis…
    if (resultat.fieldErrors) {
      for (const [champ, message] of Object.entries(resultat.fieldErrors)) {
        setError(champ as keyof SignInInput, { message });
      }
    }

    // …et message général pour ce qui ne relève d'aucun champ : identifiants
    // incorrects, compte désactivé, trop de tentatives.
    if (!resultat.fieldErrors || Object.keys(resultat.fieldErrors).length === 0) {
      setErreurGlobale(resultat.message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <input type="hidden" {...register("suivant")} />

      {erreurGlobale ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"
        >
          {erreurGlobale}
        </p>
      ) : null}

      <Field id="email" label="Adresse e-mail" required error={errors.email?.message}>
        <Input
          type="email"
          autoComplete="username"
          // Le clavier mobile ne doit ni capitaliser ni corriger une adresse.
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          // `text-base` sous md: — en deçà de 16 px, iOS Safari zoome à la mise
          // au point et casse la mise en page (§12, règle 7 du Rapport 1).
          className="text-base md:text-sm"
          {...fieldAria("email", !!errors.email, false)}
          {...register("email")}
        />
      </Field>

      <Field
        id="password"
        label="Mot de passe"
        required
        error={errors.password?.message}
      >
        <Input
          type="password"
          autoComplete="current-password"
          className="text-base md:text-sm"
          {...fieldAria("password", !!errors.password, false)}
          {...register("password")}
        />
      </Field>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Connexion…
          </>
        ) : (
          "Se connecter"
        )}
      </Button>
    </form>
  );
}
