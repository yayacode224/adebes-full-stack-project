import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Adapté depuis shadcn/ui pour ADEBES :
 *
 * - les hauteurs par défaut de shadcn (32–36 px) ont été relevées : toute
 *   cible tactile doit faire au moins 44×44 px (section 11) ;
 * - ajout des variantes `donate` (vert ADEBES) et `whatsapp`, les deux seuls
 *   parcours de conversion du site.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        /** CTA « Faire un don » — le vert du ruban droit du logo. */
        donate:
          "bg-brand-green-ink text-white shadow-sm hover:bg-[#276a2a] dark:bg-brand-green dark:text-[#06121e] dark:hover:bg-[#5cbf60]",
        /** Canal historique de l'association : couleur reconnaissable assumée. */
        whatsapp:
          "bg-whatsapp-ink text-white shadow-sm hover:bg-[#0f7a6d] dark:bg-whatsapp dark:text-[#06121e] dark:hover:bg-[#3ade79]",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        /** Pour les fonds photo ou bleu marine (hero, CTA de fin de page). */
        "outline-inverse":
          "border-white/70 text-white hover:bg-white/15 focus-visible:ring-white/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        /** 44 px : cible tactile minimale confortable. */
        default: "h-11 gap-2 px-4",
        sm: "h-9 gap-1.5 rounded-[min(var(--radius-md),12px)] px-3 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-6 text-[0.95rem]",
        icon: "size-11",
        "icon-sm": "size-9 rounded-[min(var(--radius-md),12px)]",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
