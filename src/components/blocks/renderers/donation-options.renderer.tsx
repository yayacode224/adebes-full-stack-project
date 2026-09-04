import { DonationAmounts } from "@/components/don/donation-amounts";
import { ContentIcon } from "@/components/ui-ext/content-icon";
import { Reveal } from "@/components/ui-ext/reveal";
import type { DonationOptionsContent } from "@/core/cms/blocks/definitions/donation-options.block";
import { cn } from "@/lib/utils";

import { BlockSection, PiedDeSection, enteteEstVide } from "../block-section";
import type { ProprietesDeRendu } from "../types";

/**
 * Rendu du bloc « Moyens de don ».
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LA MENTION D'ÉTAT EST CE QUI REND CE BLOC HONNÊTE
 * ---------------------------------------------------------------------------
 * Le site n'a AUCUN moyen de paiement en ligne opérationnel. Les trois moyens
 * actuels portent une mention — « Coordonnées communiquées sur demande »,
 * « Bientôt disponible » — et un moyen sans mention se lit comme un moyen
 * disponible. C'est le §1 du Rapport 1 : ne pas laisser croire à une action
 * qui n'existe pas.
 *
 * La mention est donc rendue dès qu'elle est saisie, en bas de carte, dans une
 * pastille discrète mais lisible.
 *
 * ⚠️  `<DonationAmounts>` est un composant CLIENT (état de sélection du
 * montant). Il porte ses quatre paliers et compose son message WhatsApp en
 * francs CFA — indissociables du texte du message, qui vit dans le même
 * fichier. Ce bloc décide de l'afficher ou non, pas de son contenu.
 */
export function DonationOptionsRenderer({
  content,
}: ProprietesDeRendu<DonationOptionsContent>) {
  const rienAAfficher = !content.showAmounts && content.methods.length === 0;
  if (rienAAfficher && enteteEstVide(content)) return null;

  return (
    <BlockSection
      entete={content}
      espacement="page"
      fond={content.background === "surface" ? "carte" : "aucun"}
    >
      {content.showAmounts ? (
        <Reveal delay={0.06}>
          <div
            className={cn(
              "mx-auto max-w-2xl",
              enteteEstVide(content) ? undefined : "mt-8",
            )}
          >
            <DonationAmounts />
          </div>
        </Reveal>
      ) : null}

      {content.methods.length > 0 ? (
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {content.methods.map((moyen, index) => (
            <Reveal as="li" key={moyen.title} delay={index * 0.06}>
              <div className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-background p-5">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <ContentIcon name={moyen.icon} className="size-5" />
                </span>
                <h3 className="font-heading text-base font-semibold text-foreground">
                  {moyen.title}
                </h3>
                {moyen.description ? (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {moyen.description}
                  </p>
                ) : null}
                {moyen.status ? (
                  <span className="mt-auto w-fit rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                    {moyen.status}
                  </span>
                ) : null}
              </div>
            </Reveal>
          ))}
        </ul>
      ) : null}

      <PiedDeSection
        texte={content.footerText}
        libelleLien={content.footerLinkLabel}
        href={content.footerHref}
        aligne={content.align}
      />
    </BlockSection>
  );
}
