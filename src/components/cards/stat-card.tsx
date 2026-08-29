import { AnimatedCounter } from "@/components/ui-ext/animated-counter";
import type { Stat } from "@/content/stats";
import { cn } from "@/lib/utils";

/**
 * Carte de chiffre clé.
 *
 * Quand la valeur n'a pas encore été fournie par l'association (`value: null`),
 * la carte l'assume : elle affiche « — » et un libellé d'attente, plutôt qu'un
 * zéro trompeur ou un chiffre inventé.
 */
export function StatCard({
  stat,
  className,
}: {
  stat: Stat;
  className?: string;
}) {
  const Icon = stat.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-4 py-6 text-center",
        className,
      )}
    >
      <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>

      <p className="font-heading text-3xl font-bold leading-none text-foreground sm:text-4xl">
        {stat.value === null ? (
          <span
            className="text-muted-foreground"
            title="Chiffre à fournir par l'association"
          >
            —
          </span>
        ) : (
          <AnimatedCounter value={stat.value} suffix={stat.suffix} />
        )}
      </p>

      <p className="text-balance text-sm font-medium text-muted-foreground">
        {stat.label}
      </p>
    </div>
  );
}
