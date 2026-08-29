import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { TestimonialEditeur } from "@/components/dashboard/testimonials/testimonial-editeur";
import type { Testimonial } from "@/core/cms/entities/testimonial";
import { testimonialIdSchema } from "@/core/cms/schemas/testimonial.schema";
import { can } from "@/core/rbac/policy";
import { getTestimonialById } from "@/core/use-cases/testimonials/get-testimonial";
import { lireOptionsProgrammes } from "@/server/dal/programme-options";
import { requirePermission } from "@/server/dal/session";
import { testimonialReadPort } from "@/server/deps/testimonial.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /dashboard/temoignages/[id]
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ---------------------------------------------------------------------------
 * L'IDENTIFIANT EST VALIDÉ AVANT D'ÊTRE ENVOYÉ EN BASE
 * ---------------------------------------------------------------------------
 * Il vient de l'URL, donc de n'importe qui. Sans cette vérification,
 * `/dashboard/temoignages/bonjour` produirait une erreur PostgREST 22P02
 * (« invalid input syntax for type uuid ») remontée en écran d'erreur
 * technique, là où la réponse juste est une 404 — la même que pour un
 * témoignage réellement supprimé.
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
 * `generateMetadata` et la page demandent le même témoignage : sans `cache()`,
 * chaque affichage produirait deux requêtes identiques.
 */
const lireTemoignage = cache(
  async (identifiant: string): Promise<Testimonial | null> => {
    const analyse = testimonialIdSchema.safeParse({ id: identifiant });
    if (!analyse.success) return null;

    const resultat = await getTestimonialById(
      await testimonialReadPort(),
      analyse.data.id,
    );

    if (resultat.ok) return resultat.value;
    // `NOT_FOUND` est un cas normal : un lien rouvert après une suppression.
    // Toute autre erreur est une panne et doit remonter telle quelle.
    if (resultat.error.code === "NOT_FOUND") return null;
    throw resultat.error;
  },
);

/** Ce que l'accueil affiche — voir `src/app/(site)/page.tsx`. */
const VISIBLES_SUR_ACCUEIL = 3;

/**
 * Les trois témoignages que la page d'accueil affiche réellement.
 *
 * Lu plutôt que déduit de `position <= 3` : les positions sont renumérotées de
 * 1 à N sur la collection ENTIÈRE, brouillons compris. Un témoignage en
 * position 2 peut donc parfaitement ne pas figurer parmi les trois PUBLIÉS, et
 * un témoignage en position 7 y figurer. C'est exactement la confusion que
 * cette page doit dissiper, pas reproduire.
 */
const lireVisiblesSurAccueil = cache(async (): Promise<Set<string>> => {
  const read = await testimonialReadPort();
  const publies = await read.findPublished(VISIBLES_SUR_ACCUEIL);
  return new Set(publies.map((temoignage) => temoignage.id));
});

export async function generateMetadata(
  props: PageProps<"/dashboard/temoignages/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;

  // La garde d'accès protège la DONNÉE, pas seulement l'affichage : sans elle,
  // le titre de l'onglet révélerait le nom d'une personne citée en brouillon à
  // un compte non autorisé.
  await requirePermission("testimonial:read");

  const temoignage = await lireTemoignage(id);
  return {
    title: temoignage
      ? `Témoignage de ${temoignage.authorName}`
      : "Témoignage introuvable",
  };
}

export default async function TemoignagePage(
  props: PageProps<"/dashboard/temoignages/[id]">,
) {
  const { id } = await props.params;
  const actor = await requirePermission("testimonial:read");

  const temoignage = await lireTemoignage(id);
  if (!temoignage) notFound();

  const [programmes, visibles] = await Promise.all([
    lireOptionsProgrammes(),
    lireVisiblesSurAccueil(),
  ]);

  return (
    <TestimonialEditeur
      temoignage={temoignage}
      programmes={programmes}
      visibleSurAccueil={visibles.has(temoignage.id)}
      peutModifier={can(actor, "testimonial:update")}
      peutPublier={can(actor, "testimonial:publish")}
      peutSupprimer={can(actor, "testimonial:delete")}
    />
  );
}
