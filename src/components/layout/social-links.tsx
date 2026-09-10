import { FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa6";
import type { IconType } from "react-icons";

import type { SocialsSettings } from "@/core/cms/entities/site-settings";
import { cn } from "@/lib/utils";

const ICONS: Record<keyof SocialsSettings, IconType> = {
  facebook: FaFacebookF,
  instagram: FaInstagram,
  tiktok: FaTiktok,
};

/**
 * Réseaux sociaux — absents de l'ancien site (constat #7 de l'audit).
 *
 * Tant qu'un compte n'est pas coché « créé » dans les réglages (§10.2 du
 * Rapport 2, groupe `socials`), l'emplacement est visible mais **non
 * cliquable** : un lien mort coûte plus cher en crédibilité qu'une icône
 * grisée annoncée comme « à venir ».
 *
 * `socials` est une PROP depuis le Lot 10 — plus une constante importée de
 * `site-config.ts` — parce que ce composant est rendu à la fois par
 * `<SiteFooter>` (Server Component) et par `<HeaderShell>` (Client
 * Component, menu mobile) : un Client Component ne peut pas appeler
 * `getSocialsSettings()`, qui est `server-only`. La donnée est lue UNE fois,
 * dans `(site)/layout.tsx`, et redescend par les props.
 */
export function SocialLinks({
  socials,
  tone = "light",
  className,
}: {
  socials: SocialsSettings;
  /** `dark` : posé sur un fond bleu nuit (footer). */
  tone?: "light" | "dark";
  className?: string;
}) {
  const onDark = tone === "dark";

  return (
    <ul className={cn("flex items-center gap-2", className)}>
      {(Object.keys(socials) as (keyof SocialsSettings)[]).map((key) => {
        const social = socials[key];
        const Icon = ICONS[key];

        const base = cn(
          "grid size-11 place-items-center rounded-full border transition-colors",
          onDark
            ? "border-white/20 text-white/85"
            : "border-border text-muted-foreground",
        );

        return (
          <li key={key}>
            {social.configured ? (
              <a
                href={social.href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`${social.label} (nouvelle fenêtre)`}
                className={cn(
                  base,
                  onDark
                    ? "hover:border-white/50 hover:bg-white/10 hover:text-white"
                    : "hover:border-primary/40 hover:bg-primary/10 hover:text-primary",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
              </a>
            ) : (
              <span
                aria-disabled="true"
                title={`${social.label} — compte à venir`}
                className={cn(base, "cursor-not-allowed opacity-45")}
              >
                <Icon className="size-4" aria-hidden="true" />
                <span className="sr-only">
                  {social.label} — compte à venir
                </span>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
