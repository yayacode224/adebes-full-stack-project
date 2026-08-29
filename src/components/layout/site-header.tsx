import { Logo } from "@/components/brand/logo";

import { HeaderShell } from "./header-shell";

/**
 * Le logo lit le système de fichiers (`resolveMedia`) : il ne peut donc être
 * rendu que côté serveur. Il est passé en prop au shell client, qui gère le
 * scroll, l'état actif et le menu mobile.
 *
 * Les deux teintes sont rendues systématiquement : c'est une classe CSS — et
 * non un état React — qui décide laquelle s'affiche selon le thème et selon
 * que le header se superpose ou non à une photo. Aucune désynchronisation
 * d'hydratation, aucun clignotement au premier rendu (même principe que
 * `ThemeToggle`).
 *
 * Hauteurs : 40 px sur mobile, 44 px dès 640 px, 48 px sur grand écran — le
 * header mesure 64 px (mobile) et 80 px (desktop), le logo respire donc de
 * part et d'autre sans jamais déborder.
 */
const HEADER_LOGO = "h-10 sm:h-11 lg:h-12";

export function SiteHeader() {
  return (
    <HeaderShell
      logo={<Logo fetchPriority="high" className={HEADER_LOGO} />}
      logoWhite={
        <Logo variant="white" fetchPriority="high" className={HEADER_LOGO} />
      }
    />
  );
}
