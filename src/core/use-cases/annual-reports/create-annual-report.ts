import type {
  AnnualReport,
  CreateAnnualReport,
} from "../../cms/entities/annual-report";
import type { AnnualReportDeps } from "../../cms/ports/annual-report.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Déclare un rapport annuel.
 *
 * ---------------------------------------------------------------------------
 * LA SEULE RÈGLE MÉTIER DU LOT : UNE ANNÉE, UN RAPPORT
 * ---------------------------------------------------------------------------
 * `year` est `integer not null unique` (migration 0005) : la base refuserait
 * déjà un doublon. On le vérifie AVANT, et ce n'est pas de la ceinture et des
 * bretelles — c'est le seul moyen d'afficher un message juste.
 *
 * ⚠️  Sans cette vérification, le 23505 remonté par PostgREST est traduit par
 * `mapPostgrestError` en « Cette adresse est déjà utilisée », avec un
 * `fieldErrors.slug`. Cette traduction est écrite pour les collections à
 * `slug` — les huit autres — et elle est doublement fausse ici : le mot
 * « adresse » ne veut rien dire pour un rapport annuel, et le champ `slug`
 * n'existe pas dans ce formulaire, de sorte que le message ne se rattacherait à
 * AUCUN champ à l'écran. (Le rendre générique dans `errors.ts` demanderait de
 * lire le nom de la contrainte violée : à faire au Lot 16, avec les autres
 * dettes de messages.)
 *
 * Le message NOMME l'année et le rapport existant : « 2025 » seul n'aide pas
 * quelqu'un qui a deux onglets ouverts.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LE DOCUMENT N'EST PAS VÉRIFIÉ, ET C'EST LA MÊME DÉCISION QU'AU LOT 8H
 * ---------------------------------------------------------------------------
 *   * `document_media_id` est une clé étrangère (`on delete restrict`) : un
 *     identifiant inventé est refusé par la base de toute façon ;
 *   * le vérifier exigerait un `MediaReadPort` dans `AnnualReportDeps`, donc un
 *     port de plus dans la composition de CHAQUE écriture, pour couvrir un cas
 *     que seul un POST direct peut produire — le `<MediaPicker>` ne proposant
 *     que des documents réels ;
 *   * et le message que la base rend dans ce cas est déjà traduit par
 *     `mapPostgrestError`.
 *
 * La différence avec la catégorie du Lot 8H tenait au CAS COURANT : une
 * catégorie supprimée pendant qu'un formulaire était ouvert est atteignable
 * sans mauvaise intention. Un PDF supprimé pendant ce temps ne l'est pas : la
 * médiathèque REFUSE de supprimer un document référencé par un rapport
 * (`on delete restrict`, usage marqué bloquant au Lot 7).
 */
export async function createAnnualReport(
  deps: AnnualReportDeps,
  input: CreateAnnualReport,
): Promise<Result<AnnualReport>> {
  const existant = await deps.read.findByYear(input.year);
  if (existant) {
    return err(
      new AppError(
        "CONFLICT",
        `Un rapport existe déjà pour l'année ${input.year} : « ${existant.title} ». Modifiez-le plutôt que d'en créer un second.`,
        { year: "Cette année a déjà son rapport." },
      ),
    );
  }

  // Le nouveau rapport se place en fin de liste. `count()` plutôt qu'un
  // `max(position) + 1` : les positions sont renumérotées de 1 à N à chaque
  // réordonnancement, les deux valeurs coïncident donc toujours.
  //
  // ⚠️  « Fin de liste » et « année la plus ancienne » ne coïncident PAS. Un
  // rapport 2026 créé aujourd'hui se place après 2024, et c'est l'écran de
  // liste qui le signale (`ordreSuitLesAnnees`), parce que réordonner tout seul
  // écrirait des positions que personne n'a demandées.
  const position = input.position ?? (await deps.read.count()) + 1;

  return ok(
    await deps.write.create({
      ...input,
      position,
      /*
        Un rapport naît TOUJOURS en brouillon.

        `'draft'` en dur, et non `input.status ?? 'draft'` : la valeur reçue est
        ignorée, quelle qu'elle soit. C'est ce qui garantit que toute mise en
        ligne traverse `setAnnualReportStatus`. Le schéma de création ne
        transporte déjà plus `status`, mais ce cas d'usage est aussi appelable
        depuis un test ou un importateur — et la règle ne doit pas dépendre de
        qui appelle.
      */
      status: "draft",
    }),
  );
}
