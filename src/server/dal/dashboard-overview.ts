import "server-only";

import { can } from "@/core/rbac/policy";
import type { Actor } from "@/core/rbac/roles";
import { createServerClient } from "@/infrastructure/supabase/clients/server";
import type { Json } from "@/infrastructure/supabase/database.types";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LECTURES DU TABLEAU DE BORD D'ACCUEIL
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ---------------------------------------------------------------------------
 * POURQUOI ICI, ET NON DANS `server/queries/` NI DANS UN REPOSITORY
 * ---------------------------------------------------------------------------
 * Ni le Rapport 1 (§5) ni le Rapport 2 ne disent où loger une lecture
 * AUTHENTIFIÉE ET NON MISE EN CACHE. Les deux emplacements existants ne
 * conviennent pas :
 *
 *   * `server/queries/` est réservé aux lectures PUBLIQUES en `'use cache'`.
 *     Une règle ESLint y interdit `createServerClient` — précisément parce
 *     qu'un scope `'use cache'` ne peut pas lire les cookies. Or ces
 *     compteurs dépendent de qui regarde, et ne doivent surtout pas être
 *     mis en cache : un brouillon créé il y a dix secondes doit apparaître.
 *
 *   * `core/cms/ports/` + `infrastructure/…/repositories/` sont faits pour
 *     les entités du domaine. Ces chiffres n'en sont pas : aucune règle
 *     métier, aucun invariant, rien à tester en mémoire. Un port
 *     `DashboardOverviewPort` n'aurait qu'une implémentation et aucun
 *     consommateur hors de cette page.
 *
 * Le DAL est donc l'emplacement retenu, avec la frontière suivante, à tenir
 * pour les lots suivants : **le DAL lit, il ne décide pas.** Dès qu'une règle
 * métier entre en jeu, on repasse par un cas d'usage et un port.
 *
 * ---------------------------------------------------------------------------
 * TROIS BARRIÈRES, TOUJOURS
 * ---------------------------------------------------------------------------
 * `createServerClient()` s'exécute avec l'identité de l'utilisateur : la RLS
 * s'applique. Les permissions sont malgré tout testées ici (`can`), pour deux
 * raisons : ne pas envoyer une requête vouée à revenir vide, et distinguer
 * « rien à afficher » de « pas le droit de voir » — deux messages différents.
 *
 * ---------------------------------------------------------------------------
 * INVARIANT Nº 1 DU PROJET : AUCUN CHIFFRE FABRIQUÉ
 * ---------------------------------------------------------------------------
 * Chaque compteur est `number | null`. `null` signifie « valeur indisponible »
 * — requête en échec, permission absente — et s'affiche « — ». Il ne devient
 * JAMAIS `0` : un zéro affirme qu'il n'y a rien, ce qui est une information
 * fausse quand la vérité est qu'on n'a pas su compter.
 */

/** Tables portant un statut éditorial, pour le compteur de brouillons. */
const TABLES_A_STATUT = [
  "pages",
  "programmes",
  "articles",
  "team_members",
  "testimonials",
  "faq_items",
  "gallery_items",
  "annual_reports",
] as const;

/** Un brouillon « en attente » : pas encore publié, pas archivé. */
const STATUTS_EN_ATTENTE = ["draft", "in_review"] as const;

export type CompteursTableauDeBord = {
  programmesPublies: number | null;
  articles: number | null;
  brouillonsEnAttente: number | null;
  messagesNonLus: number | null;
  medias: number | null;
  /** ISO 8601, ou `null` si rien n'a jamais été publié. */
  dernierePublication: string | null;
};

export type EntreeDeJournal = {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
  /** Nom ou e-mail de l'auteur ; `null` pour un événement sans acteur. */
  acteur: string | null;
};

export type ChampAComplete = {
  /** Clé du groupe de réglages (`contact`, `legal`, …). */
  groupe: string;
  groupeLabel: string;
  /** Chemin de la clé dans le JSON, p. ex. `hostingProvider.name`. */
  chemin: string;
  label: string;
};

export type ApercuTableauDeBord = {
  compteurs: CompteursTableauDeBord;
  /** `null` = l'utilisateur n'a pas `audit:read`. Le bloc n'est pas rendu. */
  journal: EntreeDeJournal[] | null;
  /** `null` = l'utilisateur n'a pas `settings:read`. */
  aCompleter: ChampAComplete[] | null;
};

/**
 * Tout ce qu'affiche `/dashboard`, en une seule fonction.
 *
 * Les requêtes partent en parallèle : elles sont indépendantes, et les
 * enchaîner ajouterait dix allers-retours à la latence d'un écran d'accueil.
 */
export async function getApercuTableauDeBord(
  actor: Actor,
): Promise<ApercuTableauDeBord> {
  const supabase = await createServerClient();

  const [
    programmesPublies,
    articles,
    brouillonsEnAttente,
    messagesNonLus,
    medias,
    dernierePublication,
    journal,
    aCompleter,
  ] = await Promise.all([
    can(actor, "programme:read")
      ? compter(
          supabase
            .from("programmes")
            .select("id", { count: "exact", head: true })
            .eq("status", "published"),
        )
      : null,

    can(actor, "article:read")
      ? compter(
          supabase.from("articles").select("id", { count: "exact", head: true }),
        )
      : null,

    compterBrouillons(supabase),

    can(actor, "submission:read")
      ? compter(
          supabase
            .from("form_submissions")
            .select("id", { count: "exact", head: true })
            .eq("status", "new"),
        )
      : null,

    can(actor, "media:read")
      ? compter(
          supabase
            .from("media_assets")
            .select("id", { count: "exact", head: true }),
        )
      : null,

    can(actor, "article:read") ? lireDernierePublication(supabase) : null,

    can(actor, "audit:read") ? lireJournal(supabase) : null,

    can(actor, "settings:read") ? lireChampsAComplete(supabase) : null,
  ]);

  return {
    compteurs: {
      programmesPublies,
      articles,
      brouillonsEnAttente,
      messagesNonLus,
      medias,
      dernierePublication,
    },
    journal,
    aCompleter,
  };
}

type ClientServeur = Awaited<ReturnType<typeof createServerClient>>;

/**
 * Exécute une requête de comptage.
 *
 * L'erreur est journalisée côté serveur et convertie en `null` : un écran
 * d'accueil ne doit pas devenir une page d'erreur parce qu'un compteur
 * secondaire a échoué, et il ne doit pas non plus afficher `0` (invariant nº 1).
 */
async function compter(
  requete: PromiseLike<{ count: number | null; error: unknown }>,
): Promise<number | null> {
  const { count, error } = await requete;

  if (error) {
    console.error("[ADEBES] Comptage du tableau de bord impossible", error);
    return null;
  }

  return count;
}

/**
 * Brouillons en attente, toutes collections confondues.
 *
 * Une seule requête par table : PostgREST ne sait pas faire l'union de huit
 * tables, et une fonction SQL dédiée imposerait une migration hors du
 * périmètre de ce lot. Ce sont huit requêtes `HEAD` — aucune ligne ne
 * transite, seul l'en-tête `Content-Range` compte.
 *
 * Si UNE seule échoue, le total vaut `null`. Un total partiel serait un
 * chiffre faux, et un chiffre faux dans un tableau de bord est pire que pas
 * de chiffre du tout.
 */
async function compterBrouillons(
  supabase: ClientServeur,
): Promise<number | null> {
  const comptes = await Promise.all(
    TABLES_A_STATUT.map((table) =>
      compter(
        supabase
          .from(table)
          .select("id", { count: "exact", head: true })
          .in("status", [...STATUTS_EN_ATTENTE]),
      ),
    ),
  );

  if (comptes.some((compte) => compte === null)) return null;

  return comptes.reduce<number>((total, compte) => total + (compte ?? 0), 0);
}

/**
 * Date de la dernière mise en ligne.
 *
 * `articles.published_at` est la SEULE date de publication réelle du modèle :
 * les autres collections n'ont qu'un statut, sans horodatage de passage en
 * ligne. La tuile est donc libellée « Dernière publication » et précise en
 * sous-titre qu'il s'agit d'un article — plutôt que de bricoler un `updated_at`
 * qui bougerait à la moindre correction de faute de frappe.
 */
async function lireDernierePublication(
  supabase: ClientServeur,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("articles")
    .select("published_at")
    .eq("status", "published")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[ADEBES] Lecture de la dernière publication impossible", error);
    return null;
  }

  return data?.published_at ?? null;
}

/** Les 5 dernières entrées du journal d'audit. */
async function lireJournal(
  supabase: ClientServeur,
): Promise<EntreeDeJournal[] | null> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, action, entity_type, entity_id, created_at, actor:profiles(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("[ADEBES] Lecture du journal impossible", error);
    return null;
  }

  return data.map((ligne) => ({
    id: ligne.id,
    action: ligne.action,
    entityType: ligne.entity_type,
    entityId: ligne.entity_id,
    createdAt: ligne.created_at,
    acteur: ligne.actor?.full_name ?? ligne.actor?.email ?? null,
  }));
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Bloc « À compléter »
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Continuité directe de `CONTENU-A-COMPLETER.md` : le seed a repris les
 * « [À COMPLÉTER] » tels quels plutôt que d'inventer une adresse ou un numéro
 * d'enregistrement (invariant nº 1). Ce bloc est ce qui les rend visibles au
 * lieu de les laisser dormir en base et fuiter sur le site public.
 */

const MARQUEUR = "[À COMPLÉTER]";

const LIBELLES_GROUPES: Record<string, string> = {
  identity: "Identité",
  contact: "Coordonnées",
  legal: "Mentions légales",
  socials: "Réseaux sociaux",
  seo: "Référencement",
  theme: "Thème",
  features: "Fonctionnalités",
};

/**
 * Libellés métier des champs connus (§12 du Rapport 1 : vocabulaire métier,
 * pas technique). Un champ absent de cette table affiche son chemin brut —
 * moins élégant, mais jamais faux, et le bloc continue de fonctionner quand
 * un réglage est ajouté au Lot 10 sans passer par ici.
 */
const LIBELLES_CHAMPS: Record<string, string> = {
  "contact.streetAddress": "Adresse (rue et numéro)",
  "contact.postalCode": "Code postal",
  "contact.region": "Région",
  "legal.registrationNumber": "Numéro d'enregistrement de l'association",
  "legal.registrationAuthority": "Autorité d'enregistrement",
  "legal.publicationDirector": "Directeur ou directrice de la publication",
};

async function lireChampsAComplete(
  supabase: ClientServeur,
): Promise<ChampAComplete[] | null> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("group, value");

  if (error) {
    console.error("[ADEBES] Lecture des réglages impossible", error);
    return null;
  }

  const champs: ChampAComplete[] = [];

  for (const ligne of data) {
    for (const chemin of cheminsAComplete(ligne.value)) {
      const cle = `${ligne.group}.${chemin}`;
      champs.push({
        groupe: ligne.group,
        groupeLabel: LIBELLES_GROUPES[ligne.group] ?? ligne.group,
        chemin,
        label: LIBELLES_CHAMPS[cle] ?? chemin,
      });
    }
  }

  return champs;
}

/**
 * Chemins des chaînes contenant le marqueur, en profondeur.
 *
 * Récursif parce que les groupes sont imbriqués : `legal.hostingProvider.name`
 * existe déjà, et le Lot 10 en ajoutera d'autres. Une inspection au premier
 * niveau seulement raterait silencieusement les champs les plus faciles à
 * oublier — ceux qu'on ne voit pas dans un formulaire replié.
 */
function cheminsAComplete(valeur: Json, prefixe = ""): string[] {
  if (typeof valeur === "string") {
    return valeur.includes(MARQUEUR) && prefixe ? [prefixe] : [];
  }

  if (Array.isArray(valeur)) {
    return valeur.flatMap((element, index) =>
      cheminsAComplete(element, `${prefixe}[${index}]`),
    );
  }

  if (valeur !== null && typeof valeur === "object") {
    return Object.entries(valeur).flatMap(([cle, sousValeur]) =>
      cheminsAComplete(
        sousValeur ?? null,
        prefixe ? `${prefixe}.${cle}` : cle,
      ),
    );
  }

  return [];
}
