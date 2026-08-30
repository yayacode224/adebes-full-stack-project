import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { FaqItem } from "@/core/cms/entities/faq-item";
import { cn } from "@/lib/utils";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  L'ACCORDÉON DES QUESTIONS FRÉQUENTES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Rendu par trois pages publiques — l'accueil, « Faire un don » et
 * « Devenir bénévole » — et par l'aperçu du formulaire du dashboard.
 *
 * ---------------------------------------------------------------------------
 * CE QUI A CHANGÉ AU LOT 8F
 * ---------------------------------------------------------------------------
 *   1. **Le type vient du DOMAINE**, plus de `src/content/faq.ts`. Même
 *      bascule qu'au Lot 8E pour `<ValueCard>`. Le balisage est identique.
 *   2. **`bullets` n'est plus facultatif** : l'entité garantit un tableau,
 *      éventuellement vide. La condition porte donc sur la LONGUEUR, ce qui
 *      supprime le second état d'absence que chaque appelant devait traiter.
 *   3. **La clé et la valeur d'accordéon viennent de l'IDENTIFIANT**, plus de
 *      la question ni de l'index. C'est un correctif réel, pas une
 *      préférence : `key={item.question}` produisait une clé React DUPLIQUÉE
 *      dès que deux questions du même sujet portaient le même libellé — état
 *      impossible tant que la liste vivait dans un fichier TypeScript relu à
 *      chaque commit, parfaitement atteignable depuis un dashboard. React
 *      aurait alors réutilisé le mauvais panneau au dépliage.
 *      Les index, eux, auraient rouvert le mauvais panneau après un
 *      réordonnancement.
 *
 * Le composant reste un Server Component : il n'a aucun état propre, et
 * `<Accordion>` porte le sien côté client.
 */

/**
 * Ce dont l'accordéon a besoin — pas l'entité entière.
 *
 * Le statut, la position et les dates ne le regardent pas : lui demander un
 * `FaqItem` complet obligerait l'aperçu du formulaire à inventer une position
 * et un statut pour une question qui n'existe pas encore.
 */
export type FaqAffichable = Pick<
  FaqItem,
  "id" | "question" | "answer" | "bullets"
>;

export function FAQAccordion({
  items,
  className,
  defaultOuvert = false,
}: {
  items: FaqAffichable[];
  className?: string;
  /**
   * Ouvre le premier panneau au montage.
   *
   * Réservé à l'aperçu du dashboard : sur le site, un accordéon déjà déplié
   * fausserait la hauteur de la section et l'intérêt du repli. Un aperçu qui
   * demande un clic pour montrer ce qu'on vient de saisir, en revanche, n'est
   * pas un aperçu.
   */
  defaultOuvert?: boolean;
}) {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={
        defaultOuvert && items[0] ? `faq-${items[0].id}` : undefined
      }
      className={cn("w-full divide-y divide-border", className)}
    >
      {items.map((item) => (
        <AccordionItem key={item.id} value={`faq-${item.id}`}>
          <AccordionTrigger className="py-5 text-left font-heading text-base font-semibold hover:no-underline">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
            <p>{item.answer}</p>
            {item.bullets.length > 0 ? (
              <ul className="mt-3 flex flex-col gap-1.5">
                {item.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2">
                    <span
                      aria-hidden="true"
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-green"
                    />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
