import { getBlockDefinition, parseContenu } from "../../cms/blocks/registry";
import type { PageSection } from "../../cms/entities/page";
import type { PageDeps } from "../../cms/ports/page.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Enregistre le contenu d'une section.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  C'EST ICI QUE LE SCHÉMA DU BLOC EST APPLIQUÉ À L'ÉCRITURE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * `page_sections.content` est du JSONB : la base n'en vérifie rien. Sans cette
 * validation, un POST direct écrirait n'importe quoi dans la colonne, et la
 * seule barrière restante serait celle de la LECTURE — qui ferait alors
 * disparaître la section du site sans que personne ne comprenne pourquoi.
 *
 * C'est la troisième propriété du §10 du Rapport 1, et la seule qui exige
 * d'être appliquée aux DEUX bouts : « `schema.parse()` est appliqué à
 * l'écriture *et* à la lecture ».
 *
 * ---------------------------------------------------------------------------
 * ⚠️  ON ÉCRIT LE CONTENU VALIDÉ, PAS LE CONTENU REÇU
 * ---------------------------------------------------------------------------
 * `analyse.contenu` et non `input.content`. Trois effets, tous voulus :
 *
 *   * les champs absents sont comblés par les `defaults` du bloc — une section
 *     squelette du seed (`{}`) devient un contenu complet à sa première
 *     modification ;
 *   * les espaces de tête et de queue sont retirés (`.trim()` des schémas) ;
 *   * **les clés inconnues sont écartées.** Zod ne les conserve pas, et c'est
 *     ce qui empêche la colonne d'accumuler les restes des versions
 *     antérieures d'un bloc.
 *
 * ---------------------------------------------------------------------------
 * UN BLOC INCONNU N'EST PAS MODIFIABLE
 * ---------------------------------------------------------------------------
 * Une section portant le nom d'un bloc retiré du registre n'a plus de schéma :
 * on ne saurait pas quoi valider. Elle reste LISIBLE dans l'arbre — c'est ce
 * qui permet de la supprimer — mais son formulaire ne s'ouvre pas, et le
 * message dit lequel des deux gestes est possible.
 */
export async function updateSection(
  deps: PageDeps,
  input: { id: string; content: unknown },
): Promise<Result<PageSection>> {
  const section = await deps.sectionRead.findById(input.id);
  if (!section) {
    return err(new AppError("NOT_FOUND", "Cette section n'existe plus."));
  }

  const definition = getBlockDefinition(section.blockType);
  if (!definition) {
    return err(
      new AppError(
        "VALIDATION",
        `Le type de bloc « ${section.blockType} » n'existe plus : cette section ne peut plus être modifiée, seulement supprimée.`,
      ),
    );
  }

  const analyse = parseContenu(section.blockType, input.content);
  if (!analyse.ok) {
    /*
      Le message d'erreur reste GÉNÉRIQUE, et c'est délibéré.

      Le détail champ par champ appartient au formulaire, qui valide le même
      schéma côté client et sait afficher chaque message sous son champ. Ce
      chemin-ci n'est atteint que par un POST direct ou par un formulaire
      contourné : il n'y a alors aucun champ où afficher quoi que ce soit, et
      recopier les erreurs de Zod exposerait la forme interne du contenu sans
      aider personne.
    */
    return err(
      new AppError(
        "VALIDATION",
        `Le contenu saisi pour le bloc « ${definition.label} » n'est pas valide.`,
      ),
    );
  }

  return ok(await deps.sectionWrite.update(input.id, { content: analyse.contenu }));
}
