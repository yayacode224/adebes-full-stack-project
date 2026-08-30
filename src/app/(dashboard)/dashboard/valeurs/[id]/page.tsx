import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { ValueEditeur } from "@/components/dashboard/values/value-editeur";
import type { CoreValue } from "@/core/cms/entities/core-value";
import { coreValueIdSchema } from "@/core/cms/schemas/core-value.schema";
import { can } from "@/core/rbac/policy";
import { getCoreValueById } from "@/core/use-cases/core-values/get-core-value";
import { listVisibleCoreValues } from "@/core/use-cases/core-values/list-core-values";
import { requirePermission } from "@/server/dal/session";
import { coreValueReadPort } from "@/server/deps/core-value.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /dashboard/valeurs/[id]
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ---------------------------------------------------------------------------
 * L'IDENTIFIANT EST VALIDÉ AVANT D'ÊTRE ENVOYÉ EN BASE
 * ---------------------------------------------------------------------------
 * Il vient de l'URL, donc de n'importe qui. Sans cette vérification,
 * `/dashboard/valeurs/bonjour` produirait une erreur PostgREST 22P02
 * (« invalid input syntax for type uuid ») remontée en écran d'erreur
 * technique, là où la réponse juste est une 404 — la même que pour une valeur
 * réellement supprimée.
 *
 * ---------------------------------------------------------------------------
 * `params` EST UNE PROMESSE (Next.js 16, §15 du Rapport 1)
 * ---------------------------------------------------------------------------
 * `const { id } = await params`. C'est la règle nº 3 des contraintes
 * anti-hallucination, et elle vaut aussi dans `generateMetadata`.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  UNE SECONDE LECTURE, QUI N'EXISTE SUR AUCUN AUTRE ÉCRAN DE FICHE
 * ---------------------------------------------------------------------------
 * La fiche a besoin de savoir si cette valeur est la DERNIÈRE affichée — c'est
 * ce qui déclenche la confirmation avant masquage, et la phrase qui l'annonce.
 * Une fiche ne connaît qu'elle-même : le décompte se lit donc ici, côté
 * serveur.
 *
 * Il est lu par `listVisibleCoreValues`, la MÊME fonction que le site public,
 * plutôt qu'un `count()` avec un filtre écrit à la main. Deux définitions de
 * « ce qui est affiché » finiraient par diverger, et l'écran annoncerait alors
 * une conséquence que la page publique ne produirait pas.
 */

/**
 * La lecture, mémoïsée sur la durée d'UN rendu.
 *
 * `generateMetadata` et la page demandent la même valeur : sans `cache()`,
 * chaque affichage produirait deux requêtes identiques.
 */
const lireValeur = cache(async (identifiant: string): Promise<CoreValue | null> => {
  const analyse = coreValueIdSchema.safeParse({ id: identifiant });
  if (!analyse.success) return null;

  const resultat = await getCoreValueById(
    await coreValueReadPort(),
    analyse.data.id,
  );

  if (resultat.ok) return resultat.value;
  // `NOT_FOUND` est un cas normal : un lien rouvert après une suppression.
  // Toute autre erreur est une panne et doit remonter telle quelle.
  if (resultat.error.code === "NOT_FOUND") return null;
  throw resultat.error;
});

export async function generateMetadata(
  props: PageProps<"/dashboard/valeurs/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;

  // La garde d'accès protège la DONNÉE, pas seulement l'affichage : sans elle,
  // le titre de l'onglet révélerait le contenu d'une valeur masquée à un compte
  // non autorisé.
  await requirePermission("value:read");

  const valeur = await lireValeur(id);
  return { title: valeur ? valeur.title : "Valeur introuvable" };
}

export default async function ValeurPage(
  props: PageProps<"/dashboard/valeurs/[id]">,
) {
  const { id } = await props.params;
  const actor = await requirePermission("value:read");

  const valeur = await lireValeur(id);
  if (!valeur) notFound();

  /*
    Le décompte des valeurs affichées.

    ⚠️  Un échec ici ne doit PAS faire échouer la page : la fiche reste
    parfaitement utilisable sans lui, seule la confirmation avant masquage
    s'en trouve moins précise. Le repli est `0` plutôt qu'un nombre inventé —
    et `0` signifie « je ne sais pas », ce qui ne déclenche aucune alerte
    trompeuse. Annoncer à tort « c'est la dernière » serait pire que se taire.
  */
  const affichees = await listVisibleCoreValues(await coreValueReadPort());

  return (
    <ValueEditeur
      valeur={valeur}
      visiblesTotal={affichees.ok ? affichees.value.length : 0}
      peutModifier={can(actor, "value:update")}
      peutSupprimer={can(actor, "value:delete")}
    />
  );
}
