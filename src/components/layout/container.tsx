import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Gouttières horizontales homogènes sur tout le site.
 * Conçues d'abord pour 375 px, puis élargies aux breakpoints supérieurs.
 */
export function Container({
  as: Tag = "div",
  size = "default",
  className,
  children,
}: {
  as?: ElementType;
  size?: "default" | "narrow" | "wide";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full px-5 sm:px-6 lg:px-8",
        size === "narrow" && "max-w-3xl",
        size === "default" && "max-w-6xl",
        size === "wide" && "max-w-7xl",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
