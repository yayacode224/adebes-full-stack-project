import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, LegalSection } from "@/components/ui-ext/legal-page";
import { contact, legal, siteConfig, siteUrl } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Mentions légales",
  description:
    "Mentions légales du site d'ADEBES : éditeur, hébergeur, propriété intellectuelle et responsabilité.",
  alternates: { canonical: "/mentions-legales" },
  robots: { index: true, follow: true },
};

/**
 * Page absente de l'ancien site (constat §4.9 de l'audit) — un manque
 * important pour une structure qui collecte des dons.
 *
 * Les mentions marquées « [À COMPLÉTER] » proviennent de `site-config.ts` :
 * il suffit d'y renseigner les valeurs réelles une seule fois pour qu'elles
 * apparaissent ici et partout ailleurs sur le site.
 */
export default function MentionsLegalesPage() {
  return (
    <LegalPage title="Mentions légales" updatedAt="2026-08-27">
      <LegalSection title="Éditeur du site">
        <p>
          Le présent site est édité par <strong>{siteConfig.name}</strong> —{" "}
          {siteConfig.legalName}, association camerounaise à but non lucratif.
        </p>
        <ul>
          <li>Siège : {contact.streetAddress}</li>
          <li>
            {contact.postalCode} {contact.city}, {contact.country}
          </li>
          <li>Numéro d&apos;enregistrement : {legal.registrationNumber}</li>
          <li>Autorité d&apos;enregistrement : {legal.registrationAuthority}</li>
          <li>
            Directeur / directrice de la publication :{" "}
            {legal.publicationDirector}
          </li>
          <li>
            E-mail : <a href={`mailto:${contact.email}`}>{contact.email}</a>
          </li>
          <li>
            Téléphone :{" "}
            <a href={`tel:${contact.phoneE164}`}>{contact.phoneDisplay}</a>
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Hébergement">
        <p>Le site est hébergé par :</p>
        <ul>
          <li>{legal.hostingProvider.name}</li>
          <li>{legal.hostingProvider.address}</li>
          <li>
            <a
              href={legal.hostingProvider.url}
              target="_blank"
              rel="noreferrer noopener"
            >
              {legal.hostingProvider.url}
            </a>
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
        <p>
          L&apos;ensemble des contenus présents sur ce site — textes, photos,
          vidéos, logo, éléments graphiques — est la propriété d&apos;
          {siteConfig.name} ou de ses partenaires, sauf mention contraire.
        </p>
        <p>
          Toute reproduction, représentation ou diffusion, totale ou partielle,
          sans autorisation écrite préalable, est interdite. Les demandes de
          réutilisation peuvent être adressées à{" "}
          <a href={`mailto:${contact.email}`}>{contact.email}</a>.
        </p>
      </LegalSection>

      <LegalSection title="Photographies">
        <p>
          Les photographies publiées sur ce site représentent des actions
          réelles de l&apos;association. Les personnes qui y figurent ont donné
          leur accord pour cette utilisation. Toute personne identifiable
          souhaitant le retrait d&apos;une image peut en faire la demande à{" "}
          <a href={`mailto:${contact.email}`}>{contact.email}</a> : le retrait
          est effectué sans condition.
        </p>
      </LegalSection>

      <LegalSection title="Responsabilité">
        <p>
          {siteConfig.name} s&apos;efforce de maintenir les informations
          publiées exactes et à jour. Des inexactitudes ou omissions peuvent
          néanmoins survenir : elles peuvent être signalées à l&apos;adresse
          ci-dessus.
        </p>
        <p>
          Le site peut renvoyer vers des sites tiers (réseaux sociaux,
          plateformes vidéo). {siteConfig.name} n&apos;exerce aucun contrôle sur
          leur contenu et ne saurait en être tenue responsable.
        </p>
      </LegalSection>

      <LegalSection title="Dons">
        <p>
          Aucun paiement n&apos;est prélevé directement depuis ce site. Les dons
          sont réalisés à l&apos;issue d&apos;un échange avec l&apos;équipe, par
          les moyens indiqués sur la page{" "}
          <Link href="/don">Faire un don</Link>. Tout donateur peut demander le
          détail de l&apos;utilisation de sa contribution.
        </p>
      </LegalSection>

      <LegalSection title="Données personnelles">
        <p>
          Le traitement des données transmises via les formulaires est décrit
          dans notre{" "}
          <Link href="/politique-confidentialite">
            politique de confidentialité
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Droit applicable">
        <p>
          Les présentes mentions sont soumises au droit camerounais. Adresse du
          site : <a href={siteUrl}>{siteUrl}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
