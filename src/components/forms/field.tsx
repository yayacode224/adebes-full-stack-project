import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Champ de formulaire accessible.
 *
 * Trois exigences WCAG sont traitées ici en une fois (section 13) :
 * - un `<label>` explicitement associé à chaque champ ;
 * - un message d'erreur annoncé aux lecteurs d'écran (`role="alert"`) ;
 * - une erreur signalée par une icône **et** un texte, jamais par la seule
 *   couleur rouge.
 */
export function Field({
  id,
  label,
  error,
  hint,
  required = false,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="text-xs font-normal text-muted-foreground">
            (facultatif)
          </span>
        )}
      </Label>

      {children}

      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="flex items-start gap-1.5 text-xs font-medium text-destructive"
        >
          <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Attributs ARIA cohérents entre le champ, son aide et son erreur. */
export function fieldAria(id: string, hasError: boolean, hasHint: boolean) {
  const describedBy =
    [hasHint ? `${id}-hint` : null, hasError ? `${id}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return {
    id,
    "aria-invalid": hasError || undefined,
    "aria-describedby": describedBy,
  };
}

/**
 * Champ piège anti-spam.
 *
 * Il est masqué visuellement et retiré de l'ordre de tabulation et de l'arbre
 * d'accessibilité : un utilisateur, y compris au lecteur d'écran, ne le
 * rencontre jamais. Un robot qui remplit tous les champs se signale.
 */
export function HoneypotField({
  register,
}: {
  register: Record<string, unknown>;
}) {
  return (
    <div aria-hidden="true" className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
      <label htmlFor="website">Ne pas remplir ce champ</label>
      <input
        id="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        {...register}
      />
    </div>
  );
}
