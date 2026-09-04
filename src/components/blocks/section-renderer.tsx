import "server-only";

import { parseContenu } from "@/core/cms/blocks/registry";
import { isBlockType } from "@/core/cms/entities/block-type";
import type { PageSection } from "@/core/cms/entities/page";

import { BLOCK_RENDERERS } from "./registry";
import type { ContextePage, RenduDeBloc } from "./types";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LE RENDU D'UNE SECTION — §9.4 du Rapport 2
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Le point de passage unique entre une ligne de `page_sections` et un
 * composant. Trois refus, tous silencieux du point de vue du visiteur :
 *
 *   1. **section masquée** — retirée du site, conservée dans le dashboard ;
 *   2. **bloc inconnu** — le nom d'un bloc retiré du registre ;
 *   3. **contenu invalide** — un JSONB que le schéma du bloc refuse.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  UN CONTENU INVALIDE NE DOIT JAMAIS PRODUIRE UNE PAGE BLANCHE
 * ---------------------------------------------------------------------------
 * C'est la garantie du §16 du Rapport 1, et elle vaut la peine d'être écrite
 * en toutes lettres : `page_sections.content` est du JSONB, une colonne sans
 * forme. Un contenu écrit par une version antérieure d'un schéma, ou modifié à
 * la main dans le SQL Editor, arrive tel quel ici.
 *
 * Lever aurait fait tomber la page ENTIÈRE sur sa frontière d'erreur — donc le
 * site public — à cause d'un caractère de trop dans une section. On ne rend
 * donc rien, et on JOURNALISE : l'anomalie doit être visible côté serveur,
 * sans quoi une section disparue passerait pour un oubli de saisie.
 *
 * La recette du lot exerce exactement ce chemin, en corrompant volontairement
 * une ligne en base.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  L'UNIQUE ASSERTION DE TYPE DE CETTE COUCHE, ET ELLE EST ICI
 * ---------------------------------------------------------------------------
 * `BLOCK_RENDERERS` est un type mappé : chaque entrée attend le contenu de SON
 * bloc. Lu par une clé dont TypeScript ne connaît que l'union, il en tire une
 * fonction dont le paramètre est l'INTERSECTION des dix-sept contenus —
 * c'est-à-dire un type que rien ne satisfait.
 *
 * La table de dispatch impose donc une assertion, et le choix est de n'en
 * avoir QU'UNE, ici, plutôt que dix-sept dispersées dans les rendus. Elle est
 * sûre parce que `parseContenu()` vient de valider le contenu contre le schéma
 * du MÊME bloc que celui dont on lit le rendu — le registre appariant les deux
 * par construction.
 */
export async function SectionRenderer({
  section,
  page,
}: {
  section: PageSection;
  page: ContextePage;
}) {
  if (!section.isVisible) return null;

  if (!isBlockType(section.blockType)) {
    console.error(
      `[CMS] Section ${section.id} : type de bloc « ${section.blockType} » inconnu du registre.`,
    );
    return null;
  }

  const analyse = parseContenu(section.blockType, section.content);
  if (!analyse.ok) {
    console.error(
      `[CMS] Section ${section.id} (${section.blockType}) : ${analyse.message}`,
    );
    return null;
  }

  const Rendu = BLOCK_RENDERERS[section.blockType] as RenduDeBloc<unknown>;

  return <Rendu content={analyse.contenu} page={page} />;
}

/**
 * Les sections d'une page, dans l'ordre.
 *
 * ⚠️  La clé est l'IDENTIFIANT, jamais la position : réordonner deux sections
 * échange leurs positions, et React remonterait alors les deux sous-arbres au
 * lieu de les déplacer — perdant l'état de tout composant client qu'elles
 * contiennent (l'accordéon ouvert d'une FAQ, le filtre actif d'une galerie).
 */
export function SectionsRenderer({
  sections,
  page,
}: {
  sections: PageSection[];
  page: ContextePage;
}) {
  return (
    <>
      {sections.map((section) => (
        <SectionRenderer key={section.id} section={section} page={page} />
      ))}
    </>
  );
}
