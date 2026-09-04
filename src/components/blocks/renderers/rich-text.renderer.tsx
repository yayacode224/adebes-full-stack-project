import { Reveal } from "@/components/ui-ext/reveal";
import type { RichTextContent } from "@/core/cms/blocks/definitions/rich-text.block";
import { cn } from "@/lib/utils";

import { BlockSection, enteteEstVide } from "../block-section";
import type { ProprietesDeRendu } from "../types";

/**
 * Rendu du bloc « Texte libre ».
 *
 * ⚠️  Un `<p>` par paragraphe, JAMAIS de `dangerouslySetInnerHTML`. Le
 * raisonnement complet est dans la définition du bloc : un éditeur qui accepte
 * du HTML accepte du `<script>`.
 *
 * ⚠️  La section entière disparaît si elle n'a NI en-tête NI paragraphe. C'est
 * la règle établie depuis le Lot 8B, appliquée ici au contenu propre du bloc :
 * une section vide est pire que son absence. Le dashboard, lui, continue de
 * l'afficher — c'est le contrat de « masquée du site, présente dans le
 * dashboard », étendu à « vide sur le site, éditable dans le dashboard ».
 */
export function RichTextRenderer({ content }: ProprietesDeRendu<RichTextContent>) {
  const paragraphes = content.paragraphs.filter((texte) => texte.trim());

  if (paragraphes.length === 0 && enteteEstVide(content)) return null;

  return (
    <BlockSection entete={content} taille={content.width}>
      {paragraphes.length > 0 ? (
        <Reveal delay={0.08}>
          <div
            className={cn(
              "flex flex-col gap-4 text-[0.95rem] leading-relaxed text-muted-foreground",
              enteteEstVide(content) ? undefined : "mt-6",
              content.align === "center" && "text-center",
            )}
          >
            {paragraphes.map((paragraphe, index) => (
              // La clé est l'index : deux paragraphes identiques sont
              // possibles, et rien d'autre ne les distingue. C'est le seul cas
              // du projet où l'index est la bonne clé — la liste n'est ni
              // triable ni filtrable, son ordre ne change qu'à la saisie.
              <p key={index}>{paragraphe}</p>
            ))}
          </div>
        </Reveal>
      ) : null}
    </BlockSection>
  );
}
