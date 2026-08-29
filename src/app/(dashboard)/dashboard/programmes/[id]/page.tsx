import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { ProgrammeEditeur } from "@/components/dashboard/programmes/programme-editeur";
import type { Programme } from "@/core/cms/entities/programme";
import { can } from "@/core/rbac/policy";
import { programmeIdSchema } from "@/core/cms/schemas/programme.schema";
import { getProgrammeById } from "@/core/use-cases/programmes/get-programme";
import { requirePermission } from "@/server/dal/session";
import { programmeReadPort } from "@/server/deps/programme.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /dashboard/programmes/[id]
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ---------------------------------------------------------------------------
 * L'IDENTIFIANT EST VALIDÉ AVANT D'ÊTRE ENVOYÉ EN BASE
 * ---------------------------------------------------------------------------
 * Il vient de l'URL, donc de n'importe qui. Sans cette vérification,
 * `/dashboard/programmes/bonjour` produirait une erreur PostgREST 22P02
 * (« invalid input syntax for type uuid ») remontée en écran d'erreur
 * technique, là où la réponse juste est une 404 — la même que pour un
 * programme réellement supprimé.
 *
 * ---------------------------------------------------------------------------
 * `params` EST UNE PROMESSE (Next.js 16, §15 du Rapport 1)
 * ---------------------------------------------------------------------------
 * `const { id } = await params`. C'est la règle nº 3 des contraintes
 * anti-hallucination, et elle vaut aussi dans `generateMetadata`.
 */

/**
 * La lecture, mémoïsée sur la durée d'UN rendu.
 *
 * `generateMetadata` et la page demandent le même programme : sans `cache()`,
 * chaque affichage produirait deux requêtes identiques.
 */
const lireProgramme = cache(
  async (identifiant: string): Promise<Programme | null> => {
    const analyse = programmeIdSchema.safeParse({ id: identifiant });
    if (!analyse.success) return null;

    const resultat = await getProgrammeById(
      await programmeReadPort(),
      analyse.data.id,
    );

    if (resultat.ok) return resultat.value;
    // `NOT_FOUND` est un cas normal : un lien rouvert après une suppression.
    // Toute autre erreur est une panne et doit remonter telle quelle.
    if (resultat.error.code === "NOT_FOUND") return null;
    throw resultat.error;
  },
);

export async function generateMetadata(
  props: PageProps<"/dashboard/programmes/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;

  // La garde d'accès protège la DONNÉE, pas seulement l'affichage : sans elle,
  // le titre de l'onglet révélerait le nom d'un brouillon à un compte non
  // autorisé.
  await requirePermission("programme:read");

  const programme = await lireProgramme(id);
  return { title: programme ? programme.title : "Programme introuvable" };
}

export default async function ProgrammePage(
  props: PageProps<"/dashboard/programmes/[id]">,
) {
  const { id } = await props.params;
  const actor = await requirePermission("programme:read");

  const programme = await lireProgramme(id);
  if (!programme) notFound();

  return (
    <ProgrammeEditeur
      programme={programme}
      peutModifier={can(actor, "programme:update")}
      peutPublier={can(actor, "programme:publish")}
      peutSupprimer={can(actor, "programme:delete")}
    />
  );
}
