import type {
  ContactSettings,
  IdentitySettings,
  LegalSettings,
  SocialsSettings,
} from "@/core/cms/entities/site-settings";
import { siteUrl } from "@/lib/site-config";

/**
 * Données structurées schema.org.
 *
 * L'audit (§4.7) relève qu'aucune donnée structurée n'était présente : Google
 * n'avait donc aucun moyen de comprendre qu'il s'agissait d'une ONG, où elle
 * intervient, ni comment la contacter.
 *
 * Le contenu du `<script>` est échappé (chaque `<` devient sa forme unicode) :
 * c'est la protection recommandée contre une injection XSS par une chaîne de
 * contenu.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

/**
 * §10.3 du Rapport 2 : les quatre groupes sont désormais des paramètres,
 * lus par l'appelant via `server/queries/settings.query.ts`, plutôt que des
 * constantes importées de `src/lib/site-config.ts`. Ce fichier n'a donc plus
 * à connaître la source de la donnée — build-time ou base — ni son filet de
 * repli, qui vit entièrement dans `settings.query.ts`.
 */
export function ngoJsonLd({
  identity,
  contact,
  legal,
  socials,
}: {
  identity: IdentitySettings;
  contact: ContactSettings;
  legal: LegalSettings;
  socials: SocialsSettings;
}) {
  const sameAs = Object.values(socials)
    .filter((s) => s.configured)
    .map((s) => s.href);

  return {
    "@context": "https://schema.org",
    "@type": "NGO",
    "@id": `${siteUrl}/#organization`,
    name: identity.name,
    legalName: identity.legalName,
    alternateName: identity.legalName,
    url: siteUrl,
    logo: `${siteUrl}/images/logo/logo-full-color.svg`,
    image: `${siteUrl}/images/logo/og-image.jpg`,
    slogan: identity.motto,
    description: identity.description,
    foundingDate: String(identity.foundingYear),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: contact.city,
      addressRegion: contact.region,
      addressCountry: "CM",
    },
    areaServed: [
      { "@type": "City", name: "Douala" },
      { "@type": "City", name: "Yaoundé" },
      { "@type": "Country", name: "Cameroun" },
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        telephone: contact.phoneE164,
        email: contact.email,
        availableLanguage: ["fr"],
        hoursAvailable: contact.openingHoursSpec,
      },
    ],
    knowsAbout: [
      "développement communautaire",
      "éducation",
      "santé",
      "inclusion sociale",
      "protection de l'environnement",
      "autonomisation des femmes",
      "insertion des jeunes",
    ],
    ...(legal.registrationNumber.startsWith("[")
      ? {}
      : { taxID: legal.registrationNumber }),
  };
}

export function websiteJsonLd({ identity }: { identity: IdentitySettings }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: identity.name,
    inLanguage: "fr-CM",
    publisher: { "@id": `${siteUrl}/#organization` },
  };
}

export function articleJsonLd({
  title,
  description,
  slug,
  datePublished,
  image,
  siteName,
}: {
  title: string;
  description: string;
  slug: string;
  datePublished: string;
  image: string;
  /** `identity.name` — voir l'en-tête de fichier. */
  siteName: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    datePublished,
    dateModified: datePublished,
    image: `${siteUrl}${image}`,
    mainEntityOfPage: `${siteUrl}/actualites/${slug}`,
    inLanguage: "fr-CM",
    author: { "@type": "Organization", name: siteName },
    publisher: { "@id": `${siteUrl}/#organization` },
  };
}

/**
 * Fiche `Person` d'une page biographique.
 *
 * `image` n'est transmis que si le fichier existe réellement dans /public :
 * une donnée structurée qui pointe vers une image absente est signalée comme
 * une erreur dans le test des résultats enrichis de Google.
 */
export function personJsonLd({
  name,
  jobTitle,
  description,
  path,
  image,
}: {
  name: string;
  jobTitle: string;
  description: string;
  /** Chemin de la page, ex. `/biographie`. */
  path: string;
  /** Chemin du portrait dans /public, uniquement s'il a été déposé. */
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${siteUrl}${path}#person`,
    name,
    jobTitle,
    description,
    url: `${siteUrl}${path}`,
    nationality: { "@type": "Country", name: "Cameroun" },
    ...(image ? { image: `${siteUrl}${image}` } : {}),
  };
}

export function breadcrumbJsonLd(items: { label: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: `${siteUrl}${item.href}`,
    })),
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
