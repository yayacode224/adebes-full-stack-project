import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { StatEditeur } from "@/components/dashboard/stats/stat-editeur";
import type { Stat } from "@/core/cms/entities/stat";
import { statIdSchema } from "@/core/cms/schemas/stat.schema";
import { can } from "@/core/rbac/policy";
import { getStatById } from "@/core/use-cases/stats/get-stat";
import { listVisibleStats } from "@/core/use-cases/stats/list-stats";
import { requirePermission } from "@/server/dal/session";
import { statReadPort } from "@/server/deps/stat.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /dashboard/chiffres/[id]
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ---------------------------------------------------------------------------
 * L'IDENTIFIANT EST VALIDÉ AVANT D'ÊTRE ENVOYÉ EN BASE
 * ---------------------------------------------------------------------------
 * Il vient de l'URL, donc de n'importe qui. Sans cette vérification,
 * `/dashboard/chiffres/bonjour` produirait une erreur PostgREST 22P02
 * (« invalid input syntax for type uuid ») remontée en écran d'erreur
 * technique, là où la réponse juste est une 404 — la même que pour un chiffre
 * réellement supprimé.
 *
 * ---------------------------------------------------------------------------
 * `params` EST UNE PROMESSE (Next.js 16, §15 du Rapport 1)
 * ---------------------------------------------------------------------------
 * `const { id } = await params`. C'est la règle nº 3 des contraintes
 * anti-hallucination, et elle vaut aussi dans `generateMetadata`.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  UNE SECONDE LECTURE, comme au Lot 8E
 * ---------------------------------------------------------------------------
 * La fiche a besoin de savoir si ce chiffre est le DERNIER affiché — c'est ce
 * qui déclenche la confirmation avant masquage, et la phrase qui l'annonce. Une
 * fiche ne connaît qu'elle-même : le décompte se lit donc ici, côté serveur.
 *
 * Il est lu par `listVisibleStats`, la MÊME fonction que le site public, plutôt
 * qu'un `count()` avec un filtre écrit à la main. Deux définitions de « ce qui
 * est affiché » finiraient par diverger, et l'écran annoncerait alors une
 * conséquence que les pages publiques ne produiraient pas.
 */

/**
 * La lecture, mémoïsée sur la durée d'UN rendu.
 *
 * `generateMetadata` et la page demandent le même chiffre : sans `cache()`,
 * chaque affichage produirait deux requêtes identiques.
 */
const lireChiffre = cache(async (identifiant: string): Promise<Stat | null> => {
  const analyse = statIdSchema.safeParse({ id: identifiant });
  if (!analyse.success) return null;

  const resultat = await getStatById(await statReadPort(), analyse.data.id);

  if (resultat.ok) return resultat.value;
  // `NOT_FOUND` est un cas normal : un lien rouvert après une suppression.
  // Toute autre erreur est une panne et doit remonter telle quelle.
  if (resultat.error.code === "NOT_FOUND") return null;
  throw resultat.error;
});

export async function generateMetadata(
  props: PageProps<"/dashboard/chiffres/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;

  // La garde d'accès protège la DONNÉE, pas seulement l'affichage : sans elle,
  // le titre de l'onglet révélerait le contenu d'un chiffre masqué à un compte
  // non autorisé.
  await requirePermission("stat:read");

  const chiffre = await lireChiffre(id);
  return { title: chiffre ? chiffre.label : "Chiffre introuvable" };
}

export default async function ChiffrePage(
  props: PageProps<"/dashboard/chiffres/[id]">,
) {
  const { id } = await props.params;
  const actor = await requirePermission("stat:read");

  const chiffre = await lireChiffre(id);
  if (!chiffre) notFound();

  /*
    Le décompte des chiffres affichés.

    ⚠️  Un échec ici ne doit PAS faire échouer la page : la fiche reste
    parfaitement utilisable sans lui, seule la confirmation avant masquage s'en
    trouve moins précise. Le repli est `0` plutôt qu'un nombre inventé — et `0`
    signifie « je ne sais pas », ce qui ne déclenche aucune alerte trompeuse.
    Annoncer à tort « c'est le dernier » serait pire que se taire.
  */
  const affiches = await listVisibleStats(await statReadPort());

  return (
    <StatEditeur
      chiffre={chiffre}
      visiblesTotal={affiches.ok ? affiches.value.length : 0}
      peutModifier={can(actor, "stat:update")}
      peutSupprimer={can(actor, "stat:delete")}
    />
  );
}
