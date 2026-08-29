import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { siteConfig } from "@/lib/site-config";

/**
 * Écrans non authentifiés du CMS : connexion, mot de passe oublié,
 * réinitialisation.
 *
 * Volontairement dépouillé — ni `SiteHeader`, ni `SiteFooter`, ni
 * `StickyMobileActionBar`. Proposer « Faire un don » au-dessus d'un formulaire
 * de connexion administrateur n'aurait aucun sens, et le menu public
 * inviterait à quitter la page qu'on essaie justement d'atteindre.
 *
 * Le logo reste cliquable vers l'accueil : c'est la seule porte de sortie
 * nécessaire, et l'attendre à cet endroit est un réflexe universel.
 *
 * `min-h-dvh` et non `min-h-screen` : `100vh` ignore la barre d'adresse mobile
 * et couperait le bas du formulaire sur téléphone (§12, règle 5 du Rapport 1).
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col bg-muted/30">
      <header className="flex justify-center px-5 pt-10 sm:px-6 sm:pt-14">
        <Link
          href="/"
          className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          aria-label={`${siteConfig.name} — retour à l'accueil`}
        >
          <Logo className="h-10 w-auto sm:h-12" />
        </Link>
      </header>

      {/*
        `flex-1` + centrage vertical : le formulaire est au milieu sur grand
        écran, mais reste en haut dès qu'il dépasse la hauteur disponible —
        c'est ce que fait `items-center` combiné à `py-*`, sans jamais rendre
        le haut du formulaire inatteignable quand le clavier virtuel s'ouvre.
      */}
      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-6">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="px-5 pb-8 text-center text-xs text-muted-foreground sm:px-6">
        <p>
          {siteConfig.name} — {siteConfig.legalName}
        </p>
      </footer>
    </div>
  );
}
