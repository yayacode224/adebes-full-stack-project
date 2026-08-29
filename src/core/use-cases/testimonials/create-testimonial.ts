import type {
  CreateTestimonial,
  Testimonial,
} from "../../cms/entities/testimonial";
import type { TestimonialDeps } from "../../cms/ports/testimonial.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Crée un témoignage.
 *
 * Trois règles métier, et rien d'autre : ce fichier ne sait ni ce qu'est une
 * requête HTTP, ni ce qu'est Supabase. Il se teste avec un dépôt en mémoire.
 *
 * ---------------------------------------------------------------------------
 * PAS DE SLUG, DONC PAS D'UNICITÉ À VÉRIFIER
 * ---------------------------------------------------------------------------
 * C'est la différence la plus visible avec `createProgramme` et
 * `createArticle` : un témoignage n'a pas d'adresse publique. Deux personnes
 * peuvent parfaitement dire la même chose, et deux « Prénom » citer deux
 * programmes différents. Refuser un doublon serait inventer une contrainte que
 * ni la base ni le métier ne portent.
 */
export async function createTestimonial(
  deps: TestimonialDeps,
  input: CreateTestimonial,
): Promise<Result<Testimonial>> {
  // 1. Le programme cité doit exister. Vérifié ici pour pouvoir nommer le
  //    champ fautif ; la clé étrangère de la base reste la garantie ultime,
  //    mais son message (23503) parle de suppression, pas de création.
  if (input.programmeId) {
    const programme = await deps.programmes.findById(input.programmeId);
    if (!programme) {
      return err(
        new AppError(
          "VALIDATION",
          "Le programme choisi n'existe plus. Sélectionnez-en un autre.",
          { programmeId: "Ce programme n'existe plus." },
        ),
      );
    }
  }

  // 2. Le nouveau témoignage se place en fin de liste. `count()` plutôt qu'un
  //    `max(position) + 1` : les positions sont renumérotées de 1 à N à chaque
  //    réordonnancement, les deux valeurs coïncident donc toujours.
  const position = input.position ?? (await deps.read.count()) + 1;

  return ok(
    await deps.write.create({
      ...input,
      position,
      /*
        3. Un témoignage naît TOUJOURS en brouillon, et ce n'est pas ici une
        simple prudence éditoriale : c'est ce qui rend la règle d'accord
        applicable. Naître publié court-circuiterait `setTestimonialStatus`,
        seul endroit où l'accord de la personne est exigé.

        `'draft'` en dur, et non `input.status ?? 'draft'` comme aux Lots 8A et
        8B : la valeur reçue est ignorée, quelle qu'elle soit. Le schéma de
        création ne la transporte déjà plus, mais ce cas d'usage est aussi
        appelable depuis un test ou un futur importateur, et la règle ne doit
        pas dépendre de qui appelle.
      */
      status: "draft",
    }),
  );
}
