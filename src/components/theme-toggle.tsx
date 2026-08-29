"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

/**
 * Bascule clair / sombre.
 *
 * Le thème résolu n'est pas connu au rendu serveur. Plutôt que d'attendre le
 * montage côté client pour choisir l'icône — ce qui provoque un décalage
 * visible et un rendu en cascade — les deux icônes sont rendues et c'est la
 * classe `dark` posée sur `<html>` par next-themes qui décide laquelle
 * s'affiche. Aucun effet, aucune désynchronisation d'hydratation, aucun
 * clignotement.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Moon className="size-5 dark:hidden" aria-hidden="true" />
      <Sun className="hidden size-5 dark:block" aria-hidden="true" />

      {/* Le libellé suit la même logique, pour rester exact au lecteur d'écran. */}
      <span className="sr-only dark:hidden">Activer le thème sombre</span>
      <span className="sr-only hidden dark:inline">Activer le thème clair</span>
    </Button>
  );
}
