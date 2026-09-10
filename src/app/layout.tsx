import type { Metadata, Viewport } from "next";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { FONT_VARIABLE_CLASSNAMES } from "@/lib/fonts";
import { siteUrl } from "@/lib/site-config";
import { getIdentitySettings, getSeoSettings } from "@/server/queries/settings.query";

import "./globals.css";

/**
 * §10.3 du Rapport 2 : les métadonnées globales viennent désormais des
 * groupes de réglages `identity` et `seo` — `generateMetadata` remplace la
 * constante `metadata` pour pouvoir les lire (`getIdentitySettings()` et
 * `getSeoSettings()` replient sur `site-config.ts` si la base est
 * injoignable, voir `settings.query.ts`).
 *
 * `metadataBase` reste construit depuis `siteUrl` : c'est le seul champ que
 * ce lot laisse à `resolveSiteUrl()`, indispensable au build (§10.3, dernier
 * paragraphe).
 */
export async function generateMetadata(): Promise<Metadata> {
  const [identite, seo] = await Promise.all([getIdentitySettings(), getSeoSettings()]);

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${identite.name} — ${identite.legalName}`,
      template: `%s · ${identite.name}`,
    },
    description: seo.metaDescription,
    applicationName: identite.name,
    authors: [{ name: identite.legalName }],
    keywords: seo.keywords,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: seo.locale,
      url: siteUrl,
      siteName: identite.name,
      title: `${identite.name} — ${identite.legalName}`,
      description: seo.metaDescription,
      images: [
        {
          url: "/images/logo/og-image.jpg",
          width: 1200,
          height: 630,
          alt: `${identite.name} — ${identite.tagline}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${identite.name} — ${identite.legalName}`,
      description: seo.metaDescription,
      images: ["/images/logo/og-image.jpg"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1b2b" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      // next-themes écrit la classe de thème sur <html> avant l'hydratation.
      suppressHydrationWarning
      className={`${FONT_VARIABLE_CLASSNAMES} h-full antialiased`}
    >
      <head>
        {/*
          Les animations d'entrée démarrent à opacity 0. Sans JavaScript, cette
          règle rétablit immédiatement la visibilité du contenu (section 9).
        */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      {/*
        Layout racine réduit à la coquille HTML : <html>, polices, thème et
        notifications. Rien qui suppose un site public.

        Le chrome (en-tête, pied de page, barre d'action mobile, lien
        d'évitement) est descendu dans `app/(site)/layout.tsx` au Lot 4 : il ne
        doit s'appliquer ni au dashboard, ni aux écrans de connexion.

        `pb-action-bar` a suivi le même chemin — la classe est dimensionnée
        pour la StickyMobileActionBar, absente partout ailleurs.
      */}
      <body className="min-h-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-center" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
