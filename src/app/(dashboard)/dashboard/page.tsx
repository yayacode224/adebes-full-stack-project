import {
  ArrowRight,
  FileClock,
  FolderOpen,
  HeartHandshake,
  Inbox,
  Newspaper,
  ScrollText,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { can } from "@/core/rbac/policy";
import type { Actor } from "@/core/rbac/roles";
import { PageHeader } from "@/components/dashboard/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getApercuTableauDeBord,
  type ApercuTableauDeBord,
  type ChampAComplete,
  type EntreeDeJournal,
} from "@/server/dal/dashboard-overview";
import { requireActor } from "@/server/dal/session";

/**
 * Tableau de bord d'accueil — §5.4 du Rapport 2.
 *
 * Six tuiles de comptage, les cinq dernières entrées du journal, et le bloc
 * « À compléter » alimenté par les `[À COMPLÉTER]` restés dans les réglages.
 *
 * ---------------------------------------------------------------------------
 * INVARIANT Nº 1 : AUCUN CHIFFRE FABRIQUÉ
 * ---------------------------------------------------------------------------
 * Une valeur indisponible s'affiche « — ». Jamais `0`. Le zéro est une
 * affirmation (« il n'y a aucun message »), et l'afficher parce qu'une requête
 * a échoué serait un mensonge que personne ne pourrait détecter.
 *
 * ---------------------------------------------------------------------------
 * PERMISSIONS
 * ---------------------------------------------------------------------------
 * Une tuile que l'utilisateur n'a pas le droit de lire n'est pas rendue —
 * même règle que la barre latérale. La grille se recompose, elle ne laisse
 * pas un trou.
 */
export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const actor = await requireActor("/dashboard");
  const parametres = await searchParams;
  const apercu = await getApercuTableauDeBord(actor);

  const droitsInsuffisants = parametres.erreur === "droits-insuffisants";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tableau de bord"
        description={`Bonjour ${prenom(actor)}. Voici l'état du site en un coup d'œil.`}
      />

      {droitsInsuffisants ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive"
        >
          {/* Jamais la couleur seule : icône ET texte (§12 du Rapport 1). */}
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Vous n&apos;avez pas les droits nécessaires pour accéder à cet écran.
        </p>
      ) : null}

      <Tuiles actor={actor} compteurs={apercu.compteurs} />

      {/*
        Deux colonnes à partir de 1024 px seulement : en dessous, le journal et
        le bloc « À compléter » s'empilent, chacun sur toute la largeur.
      */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {apercu.journal ? <Journal entrees={apercu.journal} /> : null}
        {apercu.aCompleter ? <AComplete champs={apercu.aCompleter} /> : null}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Les six tuiles
 * ═══════════════════════════════════════════════════════════════════════════ */

type Tuile = {
  cle: string;
  label: string;
  /** `null` = indisponible → « — ». */
  valeur: string | null;
  precision: string;
  icone: LucideIcon;
  href?: string;
};

function Tuiles({
  actor,
  compteurs,
}: {
  actor: Actor;
  compteurs: ApercuTableauDeBord["compteurs"];
}) {
  const tuiles: Tuile[] = [];

  if (can(actor, "programme:read")) {
    tuiles.push({
      cle: "programmes",
      label: "Programmes publiés",
      valeur: nombre(compteurs.programmesPublies),
      precision: "Visibles sur le site",
      icone: HeartHandshake,
      href: "/dashboard/programmes",
    });
  }

  if (can(actor, "article:read")) {
    tuiles.push({
      cle: "articles",
      label: "Actualités",
      valeur: nombre(compteurs.articles),
      precision: "Tous statuts confondus",
      icone: Newspaper,
      href: "/dashboard/actualites",
    });
  }

  tuiles.push({
    cle: "brouillons",
    label: "Brouillons en attente",
    valeur: nombre(compteurs.brouillonsEnAttente),
    precision: "Contenus non publiés, toutes collections",
    icone: FileClock,
  });

  if (can(actor, "submission:read")) {
    tuiles.push({
      cle: "messages",
      label: "Messages non lus",
      valeur: nombre(compteurs.messagesNonLus),
      precision: "Contact et bénévolat",
      icone: Inbox,
      href: "/dashboard/messages",
    });
  }

  if (can(actor, "media:read")) {
    tuiles.push({
      cle: "medias",
      label: "Médias",
      valeur: nombre(compteurs.medias),
      precision: "Images et documents téléversés",
      icone: FolderOpen,
      href: "/dashboard/mediatheque",
    });
  }

  if (can(actor, "article:read")) {
    tuiles.push({
      cle: "derniere-publication",
      label: "Dernière publication",
      valeur: compteurs.dernierePublication
        ? formaterDate(compteurs.dernierePublication)
        : null,
      // `articles.published_at` est le seul horodatage de mise en ligne du
      // modèle : la précision évite de laisser croire que la date couvre
      // toutes les collections.
      precision: "Dernier article mis en ligne",
      icone: ScrollText,
    });
  }

  return (
    /* 1 colonne au téléphone, 2 dès 640 px, 3 à partir de 1024 px (§12). */
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {tuiles.map((tuile) => (
        <li key={tuile.cle}>
          <TuileDeComptage tuile={tuile} />
        </li>
      ))}
    </ul>
  );
}

function TuileDeComptage({ tuile }: { tuile: Tuile }) {
  const Icone = tuile.icone;

  const contenu = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium text-muted-foreground">
          {tuile.label}
        </span>
        <Icone className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      </div>

      <p className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground">
        {/*
          « — » et non « 0 » : la valeur est indisponible, pas nulle.
          `title` explicite le tiret pour qui ne connaît pas la convention.
        */}
        {tuile.valeur ?? (
          <span title="Donnée indisponible" className="text-muted-foreground">
            —
          </span>
        )}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">{tuile.precision}</p>
    </>
  );

  const classeCarte =
    "flex h-full min-h-11 flex-col rounded-xl border border-border bg-card p-4 transition-colors";

  if (!tuile.href) {
    return <div className={classeCarte}>{contenu}</div>;
  }

  return (
    <Link
      href={tuile.href}
      className={`${classeCarte} hover:border-primary/40 hover:bg-muted/40`}
    >
      {contenu}
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Journal d'activité
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Traduction des actions les plus fréquentes.
 *
 * Repli sur le code brut plutôt que sur un libellé générique : « auth.login »
 * reste lisible, alors que « Action inconnue » n'apprendrait rien à personne.
 * Les Lots 8 et suivants complètent cette table au fur et à mesure qu'ils
 * ajoutent des actions.
 */
const LIBELLES_ACTIONS: Record<string, string> = {
  "auth.login": "Connexion",
  "auth.logout": "Déconnexion",
  "auth.login_failed": "Échec de connexion",
  "auth.password_reset": "Réinitialisation de mot de passe",
};

function Journal({ entrees }: { entrees: readonly EntreeDeJournal[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Activité récente</CardTitle>
        <CardDescription>Les 5 dernières actions enregistrées.</CardDescription>
      </CardHeader>

      <CardContent>
        {entrees.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune action enregistrée pour l&apos;instant.
          </p>
        ) : (
          <ol className="flex flex-col gap-3">
            {entrees.map((entree) => (
              <li key={entree.id} className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">
                  {LIBELLES_ACTIONS[entree.action] ?? entree.action}
                </span>
                <span className="text-xs text-muted-foreground">
                  {entree.acteur ?? "Auteur inconnu"} ·{" "}
                  <time dateTime={entree.createdAt}>
                    {formaterDateHeure(entree.createdAt)}
                  </time>
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Bloc « À compléter »
 * ═══════════════════════════════════════════════════════════════════════════ */

function AComplete({ champs }: { champs: readonly ChampAComplete[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">À compléter</CardTitle>
        <CardDescription>
          Ces informations manquent encore et s&apos;affichent «&nbsp;[À
          COMPLÉTER]&nbsp;» sur le site public.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {champs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Rien à compléter : tous les réglages sont renseignés.
          </p>
        ) : (
          <>
            <ul className="flex flex-col gap-2">
              {champs.map((champ) => (
                <li
                  key={`${champ.groupe}.${champ.chemin}`}
                  className="flex flex-col gap-0.5"
                >
                  <span className="text-sm font-medium text-foreground">
                    {champ.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {champ.groupeLabel}
                  </span>
                </li>
              ))}
            </ul>

            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/dashboard/reglages">
                Ouvrir les réglages
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Formatage
 * ═══════════════════════════════════════════════════════════════════════════ */

/** `null` reste `null` — la conversion en « — » est faite au rendu. */
function nombre(valeur: number | null): string | null {
  return valeur === null ? null : new Intl.NumberFormat("fr-FR").format(valeur);
}

/**
 * Fuseau explicite.
 *
 * Sans `timeZone`, la date est formatée dans le fuseau du serveur — UTC sur
 * Vercel. Une publication du 1er mars à 00 h 30 à Douala s'afficherait « 28
 * février ». L'association est au Cameroun ; c'est son heure qui fait foi.
 */
const FUSEAU = "Africa/Douala";

function formaterDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: FUSEAU,
  }).format(new Date(iso));
}

function formaterDateHeure(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: FUSEAU,
  }).format(new Date(iso));
}

/** Le premier mot du nom, ou la partie locale de l'e-mail à défaut. */
function prenom(actor: Actor): string {
  if (actor.fullName) return actor.fullName.split(/\s+/)[0]!;
  return actor.email.split("@")[0]!;
}
