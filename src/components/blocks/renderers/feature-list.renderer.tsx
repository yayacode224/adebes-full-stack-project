import { ContentIcon } from "@/components/ui-ext/content-icon";
import { Reveal } from "@/components/ui-ext/reveal";
import type { FeatureListContent } from "@/core/cms/blocks/definitions/feature-list.block";
import { cn } from "@/lib/utils";

import { BlockSection, PiedDeSection, enteteEstVide } from "../block-section";
import type { ProprietesDeRendu } from "../types";

/**
 * Rendu du bloc « Liste à puces illustrée ».
 *
 * Le bloc le plus réemployé de la migration : cinq sections du site actuel s'y
 * ramènent. Elles étaient écrites en clair dans cinq fichiers, avec cinq mises
 * en page très proches et jamais identiques ; ce rendu les unifie en deux
 * variantes.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  DEUX VARIANTES, ET L'ÉCART VISUEL EST ASSUMÉ
 * ---------------------------------------------------------------------------
 *   * `centered = false` — icône à GAUCHE du texte, dans une pastille verte.
 *     C'est la forme des « engagements » de `/impact` ;
 *   * `centered = true` — icône AU-DESSUS, tout centré. C'est la forme des
 *     « zones d'intervention » de la même page.
 *
 * Les sections de `/a-propos` (gouvernance) et de `/biographie` employaient
 * une troisième forme, très légèrement différente : pastille bleue pour l'une,
 * verte pour l'autre, selon l'icône. Cette nuance-là n'est PAS reproduite —
 * elle n'exprimait aucune intention, seulement l'ordre dans lequel les deux
 * cartes avaient été écrites. La recette du lot mesure l'écart et le consigne
 * plutôt que de le nier.
 *
 * ⚠️  `<ContentIcon>` et non `const Icon = getIcon(...)` : la règle
 * `react-hooks/static-components` refuse toute valeur de composant renvoyée
 * par un APPEL pendant le rendu (écart nº 32).
 */
export function FeatureListRenderer({
  content,
}: ProprietesDeRendu<FeatureListContent>) {
  if (content.items.length === 0 && enteteEstVide(content)) return null;

  return (
    <BlockSection entete={content} espacement="page" fond="carte">
      {content.items.length > 0 ? (
        <ul
          className={cn(
            "grid gap-4",
            enteteEstVide(content) ? undefined : "mt-10",
            content.columns === "3" ? "sm:grid-cols-3" : "sm:grid-cols-2",
            content.centered && "mx-auto max-w-3xl",
          )}
        >
          {content.items.map((element, index) => (
            <Reveal as="li" key={element.title} delay={index * 0.06}>
              {content.centered ? (
                <div className="flex h-full flex-col items-center gap-2 rounded-2xl border border-border bg-background p-5 text-center">
                  <ContentIcon
                    name={element.icon}
                    className="size-5 text-brand-green-ink dark:text-brand-green"
                  />
                  <p className="font-heading text-base font-semibold text-foreground">
                    {element.title}
                  </p>
                  {element.description ? (
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {element.description}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="flex h-full gap-4 rounded-2xl border border-border bg-background p-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-green/12 text-brand-green-ink dark:text-brand-green">
                    <ContentIcon name={element.icon} className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-heading text-base font-semibold text-foreground">
                      {element.title}
                    </h3>
                    {element.description ? (
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {element.description}
                      </p>
                    ) : null}
                  </div>
                </div>
              )}
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
