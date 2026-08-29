import type { Valeur } from "@/content/valeurs";
import { cn } from "@/lib/utils";

const TONE_CLASSES: Record<Valeur["tone"], string> = {
  navy: "bg-brand-navy/10 text-brand-navy dark:bg-white/10 dark:text-white",
  blue: "bg-brand-blue/12 text-brand-blue-ink dark:bg-brand-blue/20 dark:text-[#8fcdf0]",
  green:
    "bg-brand-green/12 text-brand-green-ink dark:bg-brand-green/20 dark:text-[#8fdc93]",
  orange:
    "bg-brand-orange/15 text-brand-orange-ink dark:bg-brand-orange/20 dark:text-brand-orange",
  neutral: "bg-muted text-muted-foreground",
};

export function ValueCard({
  valeur,
  className,
}: {
  valeur: Valeur;
  className?: string;
}) {
  const Icon = valeur.icon;

  return (
    <div
      className={cn(
        "flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-shadow duration-300 hover:shadow-md motion-reduce:transition-none",
        className,
      )}
    >
      <span
        className={cn(
          "grid size-11 place-items-center rounded-xl",
          TONE_CLASSES[valeur.tone],
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>

      <h3 className="font-heading text-base font-semibold text-foreground">
        {valeur.title}
      </h3>

      <p className="text-sm leading-relaxed text-muted-foreground">
        {valeur.description}
      </p>
    </div>
  );
}
