import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * En-tête de section réutilisé partout, pour que la hiérarchie visuelle
 * (badge → titre → sous-titre) soit strictement identique d'une page à
 * l'autre. `as` permet d'ajuster le niveau de titre sans changer le style :
 * une page ne doit jamais avoir deux `<h1>`.
 */
export function SectionHeading({
  badge,
  title,
  subtitle,
  align = "left",
  as: Tag = "h2",
  className,
  action,
}: {
  badge?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "left" | "center";
  as?: "h1" | "h2" | "h3";
  className?: string;
  /** Lien secondaire aligné à droite sur desktop (ex. « Voir tout »). */
  action?: ReactNode;
}) {
  const centered = align === "center";

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        action && !centered
          ? "sm:flex-row sm:items-end sm:justify-between sm:gap-8"
          : undefined,
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-3",
          centered && "items-center text-center",
        )}
      >
        {badge ? (
          <Badge
            variant="secondary"
            className="w-fit border-brand-blue/20 bg-brand-blue/10 text-brand-blue-ink dark:bg-brand-blue/15 dark:text-[#8fcdf0]"
          >
            {badge}
          </Badge>
        ) : null}

        <Tag
          className={cn(
            "font-heading font-bold text-foreground",
            Tag === "h1"
              ? "text-3xl leading-[1.1] sm:text-4xl lg:text-5xl"
              : "text-2xl leading-tight sm:text-3xl lg:text-[2.15rem]",
          )}
        >
          {title}
        </Tag>

        {subtitle ? (
          <p
            className={cn(
              "max-w-2xl text-[0.95rem] leading-relaxed text-muted-foreground sm:text-base",
              centered && "mx-auto",
            )}
          >
            {subtitle}
          </p>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
