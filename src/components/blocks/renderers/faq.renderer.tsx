import { JsonLd, faqJsonLd } from "@/components/seo/json-ld";
import { FAQAccordion } from "@/components/ui-ext/faq-accordion";
import { Reveal } from "@/components/ui-ext/reveal";
import type { FaqContent } from "@/core/cms/blocks/definitions/faq.block";
import { texteReponse } from "@/core/cms/entities/faq-item";
import { cn } from "@/lib/utils";
import { getFaqAccueil, getFaqParSujet } from "@/server/queries/faq.query";

import { BlockSection, PiedDeSection, enteteEstVide } from "../block-section";
import type { ProprietesDeRendu } from "../types";

/**
 * Rendu du bloc « Questions fréquentes ».
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  LE SEUL DES DIX-SEPT BLOCS QUI ÉMET DU BALISAGE STRUCTURÉ
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Trois règles héritées du Lot 8F, et aucune n'est facultative :
 *
 * **1. `texteReponse()` compose le paragraphe ET les puces.** Le balisage doit
 * contenir ce que le visiteur LIT — c'est la consigne de Google sur `FAQPage`,
 * et l'écart n'était pas théorique : « Comment faire un don à ADEBES ? »
 * énumère ses quatre canaux en puces, dont aucun n'entrait dans la réponse
 * déclarée.
 *
 * **2. Aucun balisage si la liste est vide.** Un `FAQPage` sans `mainEntity`
 * est une déclaration fausse envoyée aux moteurs de recherche. Ici la question
 * ne se pose pas : le rendu entier s'arrête avant.
 *
 * **3. Un seul bloc FAQ par page.** Deux `FAQPage` sur une même URL est une
 * erreur de balisage. C'est `addSection()` qui l'empêche, pas ce fichier — un
 * `Renderer` ne voit que sa propre section.
 *
 * ---------------------------------------------------------------------------
 * `source: 'accueil'` APPELLE UNE REQUÊTE DÉDIÉE, PAS UN FILTRE RECOPIÉ
 * ---------------------------------------------------------------------------
 * « toutes sauf le bénévolat » est une règle du domaine
 * (`estAffichableSurAccueil`), pas une commodité d'affichage. La recopier ici
 * l'aurait fait diverger de ce que `/dashboard/faq` annonce à qui réordonne la
 * liste.
 */
export async function FaqRenderer({ content }: ProprietesDeRendu<FaqContent>) {
  /*
    Aucune coupe ici, et le bloc n'offre pas de champ « nombre de questions ».

    `getFaqAccueil()` applique déjà la sienne — les quatre premières — parce
    qu'elle fait partie de la règle d'accueil du Lot 8F. Les autres sujets
    montrent TOUTES leurs questions publiées : une FAQ tronquée est une FAQ qui
    laisse le visiteur sans réponse, sur les deux pages (`/don`, `/benevolat`)
    dont c'est la fonction.
  */
  const items =
    content.source === "accueil"
      ? await getFaqAccueil()
      : await getFaqParSujet(content.source);

  if (items.length === 0) return null;

  return (
    <>
      <JsonLd
        data={faqJsonLd(
          items.map((item) => ({
            question: item.question,
            answer: texteReponse(item),
          })),
        )}
      />

      <BlockSection
        id="faq"
        entete={content}
        taille="narrow"
        espacement="page"
        fond={content.background === "surface" ? "carte" : "aucun"}
      >
        <Reveal delay={0.1}>
          <FAQAccordion
            items={items}
            defaultOuvert={content.openFirst}
            className={cn(enteteEstVide(content) ? undefined : "mt-8")}
          />
        </Reveal>

        <PiedDeSection
          texte={content.footerText}
          libelleLien={content.footerLinkLabel}
          href={content.footerHref}
          aligne={content.align}
        />
      </BlockSection>
    </>
  );
}
