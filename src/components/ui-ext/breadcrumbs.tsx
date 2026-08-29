import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

/**
 * Fil d'Ariane des pages de détail (programme, actualité).
 *
 * `tone="inverse"` est utilisé lorsqu'il est posé sur le hero photographique :
 * le texte passe en blanc sur le scrim, jamais en gris sur une image.
 */
export function Breadcrumbs({
  items,
  tone = "default",
  className,
}: {
  items: Crumb[];
  tone?: "default" | "inverse";
  className?: string;
}) {
  const inverse = tone === "inverse";

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList
        className={cn("text-xs sm:text-sm", inverse && "text-white/70")}
      >
        {items.map((item, index) => {
          const last = index === items.length - 1;

          return (
            <BreadcrumbItem key={`${item.label}-${index}`}>
              {last || !item.href ? (
                <BreadcrumbPage className={inverse ? "text-white" : undefined}>
                  {item.label}
                </BreadcrumbPage>
              ) : (
                <>
                  <BreadcrumbLink asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "transition-colors",
                        inverse ? "hover:text-white" : "hover:text-foreground",
                      )}
                    >
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                  <BreadcrumbSeparator
                    className={inverse ? "text-white/50" : undefined}
                  />
                </>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
