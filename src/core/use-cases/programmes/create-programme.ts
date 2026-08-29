import type { CreateProgramme, Programme } from "../../cms/entities/programme";
import type { ProgrammeDeps } from "../../cms/ports/programme.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";
import { slugify } from "../../shared/slug";

/**
 * Crée un programme.
 *
 * Deux règles métier, et rien d'autre : ce fichier ne sait ni ce qu'est une
 * requête HTTP, ni ce qu'est Supabase. Il se teste avec un dépôt en mémoire.
 */
export async function createProgramme(
  deps: ProgrammeDeps,
  input: CreateProgramme,
): Promise<Result<Programme>> {
  // 1. L'adresse est proposée à partir du titre si elle n'a pas été saisie.
  //    `slugify` gère les accents et les apostrophes du français :
  //    « Protection de l'environnement » → « protection-de-l-environnement ».
  const slug = input.slug?.trim() || slugify(input.title);

  if (!slug) {
    return err(
      new AppError(
        "VALIDATION",
        "Impossible de déduire une adresse à partir de ce titre. Saisissez-la manuellement.",
        { slug: "Adresse obligatoire." },
      ),
    );
  }

  // 2. Unicité. La base porte aussi une contrainte `unique`, mais la vérifier
  //    ici permet de renvoyer un message utile SUR LE BON CHAMP plutôt que de
  //    traduire après coup une violation 23505.
  if (await deps.read.findBySlug(slug)) {
    return err(
      new AppError(
        "CONFLICT",
        `L'adresse « ${slug} » est déjà utilisée par un autre programme.`,
        { slug: "Cette adresse est déjà prise." },
      ),
    );
  }

  // 3. Le nouveau programme se place en fin de liste. `count()` plutôt qu'un
  //    `max(position) + 1` : les positions sont renumérotées de 1 à N à chaque
  //    réordonnancement, les deux valeurs coïncident donc toujours.
  const position = input.position ?? (await deps.read.count()) + 1;

  return ok(
    await deps.write.create({
      ...input,
      slug,
      position,
      // Un programme naît TOUJOURS en brouillon. Publier est une décision
      // explicite, qui exige la permission `programme:publish`.
      status: input.status ?? "draft",
    }),
  );
}
