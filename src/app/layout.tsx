import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig, siteUrl } from "@/lib/site-config";

import "./globals.css";

/** Corps de texte : très bon rendu des accents français. */
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

/** Titres : géométrique et arrondie, en écho aux formes du pictogramme. */
const sora = Sora({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteConfig.name} — ${siteConfig.legalName}`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.metaDescription,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.legalName }],
  keywords: [
    "ADEBES",
    "association Cameroun",
    "ONG Douala",
    "développement communautaire",
    "éducation Cameroun",
    "santé Cameroun",
    "bénévolat Cameroun",
    "faire un don Cameroun",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteUrl,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.legalName}`,
    description: siteConfig.metaDescription,
    images: [
      {
        url: "/images/logo/og-image.jpg",
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} — ${siteConfig.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.legalName}`,
    description: siteConfig.metaDescription,
    images: ["/images/logo/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

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
      className={`${inter.variable} ${sora.variable} h-full antialiased`}
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
