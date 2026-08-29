import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, LegalSection } from "@/components/ui-ext/legal-page";
import { contact, siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Comment ADEBES collecte, utilise et protège les données transmises via son site : formulaires, cookies, durée de conservation et droits des personnes.",
  alternates: { canonical: "/politique-confidentialite" },
};

export default function PolitiqueConfidentialitePage() {
  return (
    <LegalPage title="Politique de confidentialité" updatedAt="2026-08-27">
      <LegalSection title="En résumé">
        <p>
          Ce site ne collecte que les informations que vous nous transmettez
          volontairement, via le formulaire de contact ou celui de candidature
          bénévole. Elles servent uniquement à vous répondre. Elles ne sont ni
          vendues, ni louées, ni transmises à des tiers à des fins commerciales.
        </p>
      </LegalSection>

      <LegalSection title="Responsable du traitement">
        <p>
          {siteConfig.name} — {siteConfig.legalName}, {contact.city},{" "}
          {contact.country}. Contact :{" "}
          <a href={`mailto:${contact.email}`}>{contact.email}</a>.
        </p>
      </LegalSection>

      <LegalSection title="Données collectées">
        <h3>Formulaire de contact</h3>
        <ul>
          <li>Nom</li>
          <li>Adresse e-mail</li>
          <li>Numéro de téléphone (facultatif)</li>
          <li>Sujet et contenu de votre message</li>
        </ul>

        <h3>Formulaire de candidature bénévole</h3>
        <ul>
          <li>Nom</li>
          <li>Adresse e-mail et numéro de téléphone</li>
          <li>Ville</li>
          <li>Domaine d&apos;intérêt et disponibilités</li>
          <li>Message de présentation (facultatif)</li>
        </ul>

        <p>
          Un champ invisible destiné à filtrer les envois automatisés est présent
          dans chaque formulaire. Il ne collecte aucune donnée personnelle.
        </p>
      </LegalSection>

      <LegalSection title="Finalité et base légale">
        <p>
          Ces données sont traitées sur la base de votre consentement, recueilli
          explicitement par une case à cocher avant tout envoi. Elles servent
          exclusivement à :
        </p>
        <ul>
          <li>répondre à votre demande ;</li>
          <li>étudier votre candidature de bénévole ;</li>
          <li>vous recontacter au sujet de l&apos;échange engagé.</li>
        </ul>
        <p>
          Aucune inscription à une lettre d&apos;information n&apos;est
          effectuée sans votre demande explicite.
        </p>
      </LegalSection>

      <LegalSection title="Destinataires">
        <p>
          Les messages sont transmis par e-mail à l&apos;équipe d&apos;
          {siteConfig.name}. L&apos;acheminement est assuré par notre
          prestataire d&apos;envoi d&apos;e-mails, qui agit comme
          sous-traitant et ne réutilise pas ces données.
        </p>
      </LegalSection>

      <LegalSection title="Durée de conservation">
        <ul>
          <li>Demandes de contact : 12 mois après le dernier échange.</li>
          <li>
            Candidatures de bénévoles : 24 mois, ou jusqu&apos;à votre demande
            de suppression.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Cookies et mesure d'audience">
        <p>
          Ce site ne dépose <strong>aucun cookie publicitaire</strong> ni cookie
          de traçage tiers. Votre préférence de thème (clair ou sombre) est
          enregistrée localement dans votre navigateur ; elle ne quitte jamais
          votre appareil et n&apos;est accessible à personne d&apos;autre.
        </p>
        <p>
          La carte de localisation et les lecteurs vidéo sont fournis par des
          services tiers (Google Maps, plateforme d&apos;hébergement vidéo). Les
          vidéos ne sont chargées qu&apos;après un clic de votre part : aucune
          connexion n&apos;est établie avec la plateforme avant ce geste.
        </p>
        <p>
          Si un outil de mesure d&apos;audience venait à être ajouté, un bandeau
          de consentement serait mis en place et cette page mise à jour en
          conséquence.
        </p>
      </LegalSection>

      <LegalSection title="Sécurité">
        <p>
          Les échanges avec ce site sont chiffrés (HTTPS). L&apos;accès aux
          messages reçus est réservé aux membres de l&apos;équipe qui en ont
          besoin pour vous répondre.
        </p>
      </LegalSection>

      <LegalSection title="Vos droits">
        <p>
          Vous pouvez à tout moment demander l&apos;accès, la rectification ou
          la suppression des données vous concernant, ainsi que retirer votre
          consentement. Une simple demande à{" "}
          <a href={`mailto:${contact.email}`}>{contact.email}</a> suffit ; nous y
          répondons dans un délai de 30 jours.
        </p>
      </LegalSection>

      <LegalSection title="Photographies de personnes">
        <p>
          Les personnes photographiées lors de nos actions donnent leur accord
          avant toute publication. Toute demande de retrait est traitée sans
          condition et sans délai — voir les{" "}
          <Link href="/mentions-legales">mentions légales</Link>.
        </p>
      </LegalSection>

      <LegalSection title="Modification de cette politique">
        <p>
          Cette politique peut évoluer. La date de dernière mise à jour figure en
          haut de cette page.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
