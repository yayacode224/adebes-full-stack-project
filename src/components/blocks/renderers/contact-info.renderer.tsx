import { Clock, Mail, MapPin, Phone, type LucideIcon } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";

import { SocialLinks } from "@/components/layout/social-links";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui-ext/reveal";
import type { ContactInfoContent } from "@/core/cms/blocks/definitions/contact-info.block";
import { TODO, contact, whatsappLink, whatsappMessages } from "@/lib/site-config";
import { cn } from "@/lib/utils";

import { BlockSection, enteteEstVide } from "../block-section";
import type { ProprietesDeRendu } from "../types";

/**
 * Rendu du bloc « Coordonnées ».
 *
 * ---------------------------------------------------------------------------
 * ⚠️  AUCUNE COORDONNÉE N'EST STOCKÉE DANS LE CONTENU DU BLOC
 * ---------------------------------------------------------------------------
 * Tout vient des réglages du site (`src/lib/site-config.ts` aujourd'hui,
 * `site_settings` au Lot 10). Les recopier dans une section aurait créé une
 * source de vérité de plus — celle qu'on oublie de mettre à jour le jour où le
 * numéro change, et qui affiche alors un téléphone mort sur la page Contact.
 * C'est l'invariant nº 2 pris à revers.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  UNE COORDONNÉE À `[À COMPLÉTER]` N'EST PAS AFFICHÉE, MÊME SI SA CASE EST
 *     COCHÉE
 * ---------------------------------------------------------------------------
 * `contact.streetAddress` et `contact.postalCode` valent aujourd'hui `TODO`.
 * Les rendre tels quels mettrait « [À COMPLÉTER] » en toutes lettres sur la
 * page Contact, à l'endroit d'une adresse postale.
 *
 * L'adresse affichée est donc « Ville, Pays » — exactement ce que fait la page
 * `/contact` actuelle, et exactement ce que le contenu permet d'affirmer.
 */
export function ContactInfoRenderer({
  content,
}: ProprietesDeRendu<ContactInfoContent>) {
  type LigneDeContact = {
    cle: string;
    Icone: LucideIcon;
    libelle: string;
    valeur: string;
    href: string | null;
  };

  /*
    L'adresse se compose des parties RÉELLEMENT renseignées.

    `streetAddress` et `postalCode` valent `[À COMPLÉTER]` aujourd'hui : les
    écarter laisse « Douala, Cameroun », qui est vrai. Les inclure aurait mis le
    marqueur en toutes lettres sur la page Contact.
  */
  // `string[]` explicite : `site-config.ts` est déclaré `as const`, donc
  // `streetAddress` a pour type le LITTÉRAL « [À COMPLÉTER] ». Sans
  // l'annotation, le tableau se referme sur ce littéral et n'accepte plus la
  // ville — une erreur de compilation qui décrit l'état actuel des données,
  // pas une contrainte durable.
  const parties: string[] = [contact.streetAddress, contact.postalCode];

  const adresse = parties
    .filter((partie) => partie.trim() && partie !== TODO)
    .concat(`${contact.city}, ${contact.country}`)
    .join(" · ");

  const lignes: LigneDeContact[] = [];

  if (content.showAddress) {
    lignes.push({
      cle: "adresse",
      Icone: MapPin,
      libelle: "Adresse",
      valeur: adresse,
      href: null,
    });
  }
  if (content.showPhone) {
    lignes.push({
      cle: "telephone",
      Icone: Phone,
      libelle: "Téléphone",
      valeur: contact.phoneDisplay,
      href: `tel:${contact.phoneE164}`,
    });
  }
  if (content.showEmail) {
    lignes.push({
      cle: "email",
      Icone: Mail,
      libelle: "E-mail",
      valeur: contact.email,
      href: `mailto:${contact.email}`,
    });
  }
  if (content.showHours) {
    lignes.push({
      cle: "horaires",
      Icone: Clock,
      libelle: "Horaires",
      valeur: contact.openingHours,
      href: null,
    });
  }

  // Une coordonnée vide ou encore à compléter n'est jamais rendue, même si sa
  // case est cochée. Voir l'avertissement en tête de fichier.
  const affichables = lignes.filter(
    (ligne) => ligne.valeur.trim() && !ligne.valeur.includes(TODO),
  );

  return (
    <BlockSection entete={content} taille="default" espacement="page" fond="carte">
      <ul
        className={cn(
          "grid gap-4 sm:grid-cols-2",
          enteteEstVide(content) ? undefined : "mt-8",
        )}
      >
        {affichables.map((ligne, index) => (
          <Reveal as="li" key={ligne.cle} delay={index * 0.06}>
            <div className="flex h-full gap-4 rounded-2xl border border-border bg-background p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <ligne.Icone className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-heading text-sm font-semibold text-foreground">
                  {ligne.libelle}
                </p>
                {ligne.href ? (
                  // `min-h-11` : cible tactile de 44 px (§12, règle 4). Un
                  // numéro de téléphone se touche au pouce, souvent en
                  // marchant.
                  <a
                    href={ligne.href}
                    className="mt-1 inline-flex min-h-11 items-center text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                  >
                    {ligne.valeur}
                  </a>
                ) : (
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {ligne.valeur}
                  </p>
                )}
              </div>
            </div>
          </Reveal>
        ))}
      </ul>

      {content.showWhatsApp || content.showSocial ? (
        <Reveal delay={0.12}>
          <div className="mt-8 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
            {content.showWhatsApp ? (
              <Button asChild variant="whatsapp" size="lg">
                <a
                  href={whatsappLink(whatsappMessages.contact)}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <FaWhatsapp className="size-4" aria-hidden="true" />
                  Écrire sur WhatsApp
                </a>
              </Button>
            ) : null}

            {/*
              ⚠️  `<SocialLinks>` rend une entrée NON CONFIGURÉE comme
              « bientôt », grisée et sans lien — jamais un lien mort
              (invariant nº 2). Aucune condition à ajouter ici.
            */}
            {content.showSocial ? <SocialLinks /> : null}
          </div>
        </Reveal>
      ) : null}
    </BlockSection>
  );
}
