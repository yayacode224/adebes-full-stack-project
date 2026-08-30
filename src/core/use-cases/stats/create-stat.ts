import type { CreateStat, Stat } from "../../cms/entities/stat";
import type { StatDeps } from "../../cms/ports/stat.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";
import { slugify } from "../../shared/slug";

/**
 * Crée un chiffre clé.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LA CLÉ TECHNIQUE EST DÉRIVÉE DU LIBELLÉ, ET N'EST PAS SAISIE
 * ---------------------------------------------------------------------------
 * `stats.key` est `not null unique`. Trois façons de la remplir étaient
 * possibles, et le choix mérite d'être écrit (écart nº 124) :
 *
 *   1. **Un champ de formulaire**, comme le slug d'un programme. Rejeté : un
 *      slug est une ADRESSE, il se lit dans la barre du navigateur et quelqu'un
 *      a de bonnes raisons de vouloir le choisir. La clé d'un chiffre
 *      n'apparaît nulle part — ni sur le site, ni dans une URL. Demander de la
 *      saisir aurait été demander de décider d'une chose invisible.
 *   2. **Un UUID ou un compteur.** Rejeté : la colonne `id` remplit déjà ce
 *      rôle. Une seconde clé opaque n'aurait servi à rien.
 *   3. **Dérivée du libellé**, ce qui est fait ici. Elle reste lisible dans une
 *      requête SQL (« beneficiaires »), et elle est stable : `updateStat` la
 *      neutralise, elle ne suit donc PAS les reformulations du libellé.
 *
 * ⚠️  CE QUI EST REFUSÉ EST LA COLLISION DE **CLÉ**, PAS LE LIBELLÉ EN DOUBLE.
 * La nuance a été trouvée par la recette (D08), et elle compte :
 *
 *   * deux libellés qui ne diffèrent que par un accent, une majuscule ou une
 *     ponctuation produisent la MÊME clé — la création est refusée, et le
 *     message nomme le chiffre qui occupe déjà la place ;
 *   * deux libellés réellement identiques produisent aussi la même clé — même
 *     refus ;
 *   * mais rien n'interdit deux libellés PROCHES qui slugifient différemment.
 *
 * ⚠️  Et surtout : **les quatre clés du seed ne sont PAS dérivées de leurs
 * libellés** (« projets » pour « Projets menés »). Elles viennent du tableau
 * TypeScript d'origine, où elles étaient écrites à la main. `updateStat` ne les
 * touchant jamais, elles restent telles quelles — la règle de dérivation ne
 * s'applique qu'aux chiffres créés depuis le dashboard. Mesuré (D60–D63) plutôt
 * que supposé.
 *
 * Un libellé RÉELLEMENT en double avec une clé différente reste donc possible.
 * Il est **signalé** dans l'écran de liste, jamais interdit — c'est la doctrine
 * de l'écart nº 115 (Lot 8F) : ni la base ni le métier ne portent d'unicité sur
 * le libellé, et l'inventer serait la faute que le Lot 8D a nommée.
 *
 * Le libellé reste librement modifiable ensuite : la clé est déjà fixée, plus
 * aucune collision n'est possible.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  UN CHIFFRE NAÎT VISIBLE — comme une valeur au Lot 8E
 * ---------------------------------------------------------------------------
 * Aucune permission `stat:publish` n'existe, aucune garde n'est à forcer, et la
 * base écrit `is_visible = true` par défaut. La valeur reçue est donc
 * RESPECTÉE, avec `true` par défaut — le schéma de création dit la même chose
 * (`.default(true)`), et les deux doivent rester d'accord : ce cas d'usage est
 * également appelable depuis un test ou un futur importateur, où le schéma
 * n'intervient pas.
 *
 * ⚠️  `input.value` est écrit TEL QUEL, `null` compris. Il n'y a pas de
 * `?? 0` ici, et il ne doit jamais y en avoir : ce serait fabriquer un chiffre.
 */
export async function createStat(
  deps: StatDeps,
  input: CreateStat,
): Promise<Result<Stat>> {
  const key = slugify(input.label);

  if (!key) {
    return err(
      new AppError(
        "VALIDATION",
        "Ce libellé ne permet pas de fabriquer un identifiant technique. Utilisez au moins une lettre ou un chiffre.",
        { label: "Libellé invalide." },
      ),
    );
  }

  /*
    Unicité vérifiée ici plutôt que laissée à la base : la violation 23505
    remonte en « Cette adresse est déjà utilisée. » (`mapPostgrestError`), un
    message écrit pour les slugs et faux ici — un chiffre n'a pas d'adresse.
    Le contrôle en amont permet de nommer le vrai problème sur le vrai champ.

    ⚠️  Le message NOMME le chiffre qui occupe la place. Sans lui, la personne
    lirait « ce libellé est déjà pris » en ayant sous les yeux une liste où
    aucun libellé ne ressemble au sien — cas réel, puisque les clés du seed ne
    sont pas dérivées des libellés.
  */
  const occupant = await deps.read.findByKey(key);
  if (occupant) {
    return err(
      new AppError(
        "CONFLICT",
        `« ${occupant.label} » occupe déjà l'identifiant technique « ${key} », que ce libellé produirait aussi. Choisissez un libellé qui s'en distingue par plus qu'un accent, une majuscule ou une ponctuation.`,
        { label: "Ce libellé produit un identifiant déjà utilisé." },
      ),
    );
  }

  // Le nouveau chiffre se place en fin de liste. `count()` plutôt qu'un
  // `max(position) + 1` : les positions sont renumérotées de 1 à N à chaque
  // réordonnancement, les deux valeurs coïncident donc toujours.
  const position = input.position ?? (await deps.read.count()) + 1;

  return ok(
    await deps.write.create({
      ...input,
      key,
      position,
      isVisible: input.isVisible ?? true,
      toConfirm: input.toConfirm ?? false,
    }),
  );
}
