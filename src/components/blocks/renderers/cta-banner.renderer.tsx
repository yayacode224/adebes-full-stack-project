import { CTABanner } from "@/components/ui-ext/cta-banner";
import type { CtaBannerContent } from "@/core/cms/blocks/definitions/cta-banner.block";

import type { ProprietesDeRendu } from "../types";

/**
 * Rendu du bloc « Bannière d'appel à l'action ».
 *
 * ⚠️  `undefined` ET NON LA CHAÎNE VIDE.
 *
 * `<CTABanner>` porte ses propres valeurs par défaut — « Votre soutien change
 * des vies » — et c'est `undefined` qui les déclenche. Passer `""` afficherait
 * un titre VIDE : un pavé bleu nuit de deux cents pixels sans un mot, sur la
 * section dont la fonction unique est d'appeler à l'action.
 *
 * Le champ vide signifie donc bien « garder le texte par défaut », comme
 * l'aide du formulaire l'annonce.
 */
export function CtaBannerRenderer({
  content,
}: ProprietesDeRendu<CtaBannerContent>) {
  return (
    <CTABanner
      title={content.title || undefined}
      subtitle={content.subtitle || undefined}
      whatsappMessage={content.whatsappMessage || undefined}
    />
  );
}
