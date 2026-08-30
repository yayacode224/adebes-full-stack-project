import type { Stat } from "../../cms/entities/stat";
import type { StatDeps } from "../../cms/ports/stat.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  AFFICHER OU RETIRER UN CHIFFRE DU SITE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * L'équivalent de `setCoreValueVisibility` (Lot 8E) pour la seconde des deux
 * collections sans cycle éditorial. Deux états, pas quatre.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  CE CAS D'USAGE N'EST PAS PROTÉGÉ PAR `stat:publish` — IL N'EXISTE PAS
 * ---------------------------------------------------------------------------
 * La matrice (§9 du Rapport 1, `core/rbac/permissions.ts`) ne contient aucune
 * entrée `stat:publish`, pour aucun rôle. La Server Action correspondante exige
 * donc `stat:update`, que l'éditeur possède.
 *
 * **Un éditeur peut donc retirer un chiffre de l'accueil et de `/impact`,
 * alors qu'il ne peut dépublier aucun programme.** C'est l'écart nº 104 à
 * l'identique, sur la seconde table qui le porte : la matrice ET la RLS
 * (`stats_staff_update`, migration 0009) le disent indépendamment l'une de
 * l'autre, et le trigger `guard_publish` ne couvre pas cette table faute de
 * colonne `status`. Consigné, pas corrigé au détour d'un lot de collection.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  MASQUER LE DERNIER CHIFFRE VISIBLE EST **AUTORISÉ**
 * ---------------------------------------------------------------------------
 * Même réponse qu'au Lot 8E (écart nº 106), et pour les mêmes trois raisons :
 * l'état obtenu est VIDE et non FAUX ; une section vide qui disparaît est le
 * comportement établi du site depuis le Lot 8B ; le geste est trivialement
 * réversible.
 *
 * ⚠️  Il y a pourtant ici une nuance que le Lot 8E n'avait pas, et il faut la
 * dire pour ne pas la confondre avec un argument d'interdire : **masquer un
 * chiffre n'est PAS le moyen honnête de traiter un chiffre douteux.** Le moyen
 * honnête est de cocher « pas encore disponible », ce qui laisse la carte en
 * place et affiche « — ». Masquer retire la carte entière et laisse croire que
 * l'association ne suit pas cet indicateur.
 *
 * Les deux gestes existent donc, ils ne disent pas la même chose, et l'écran
 * l'écrit — dans l'aide du champ, dans la confirmation, et sur la fiche.
 * Informer plutôt qu'interdire, une fois de plus.
 */
export async function setStatVisibility(
  deps: StatDeps,
  input: { id: string; isVisible: boolean },
): Promise<Result<Stat>> {
  const existant = await deps.read.findById(input.id);
  if (!existant) {
    return err(new AppError("NOT_FOUND", "Ce chiffre n'existe plus."));
  }

  /*
    Idempotence explicite : réafficher un chiffre déjà affiché n'écrit rien.

    Sans ce court-circuit, l'action passerait quand même — la base accepte
    parfaitement d'écrire `true` sur `true` — mais elle produirait une entrée
    d'audit décrivant un changement qui n'a pas eu lieu, et déplacerait
    `updated_at`. Le journal doit raconter ce qui s'est passé, pas ce qu'on a
    cliqué. Le cas est courant : deux onglets ouverts, ou une action groupée
    appliquée à une sélection déjà dans l'état voulu.
  */
  if (existant.isVisible === input.isVisible) {
    return ok(existant);
  }

  return ok(await deps.write.setVisibility(existant.id, input.isVisible));
}
