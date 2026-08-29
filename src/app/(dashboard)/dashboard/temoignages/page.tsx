import type { Metadata } from "next";

import { ErrorState } from "@/components/dashboard/feedback/error-state";
import { PageHeader } from "@/components/dashboard/layout/page-header";
import { TestimonialsClient } from "@/components/dashboard/testimonials/testimonials-client";
import type { MediaAsset } from "@/core/cms/entities/media-asset";
import { can } from "@/core/rbac/policy";
import { getMediaByIds } from "@/core/use-cases/media/get-media";
import { listProgrammes } from "@/core/use-cases/programmes/list-programmes";
import { listTestimonials } from "@/core/use-cases/testimonials/list-testimonials";
import { requirePermission } from "@/server/dal/session";
import { mediaReadPort } from "@/server/deps/media.deps";
import { programmeReadPort } from "@/server/deps/programme.deps";
import { testimonialReadPort } from "@/server/deps/testimonial.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /dashboard/temoignages
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8C du Rapport 2, sur le gabarit du §8A.3.
 *
 * ---------------------------------------------------------------------------
 * LA PAGE N'APPELLE PAS DE DÉPÔT
 * ---------------------------------------------------------------------------
 * §4 du Rapport 1 : « Une page du dashboard n'appelle JAMAIS un repository :
 * elle appelle un cas d'usage via le contrôleur. » Elle demande donc des ports
 * de LECTURE à `server/deps/`. Le nom `SupabaseTestimonialRepository`
 * n'apparaît nulle part ici.
 *
 * ---------------------------------------------------------------------------
 * PAS DE `'use cache'`
 * ---------------------------------------------------------------------------
 * C'est une lecture AUTHENTIFIÉE : elle dépend des cookies, qu'un scope
 * `'use cache'` ne peut pas lire (§15, règle 10 du Rapport 1). Et elle ne doit
 * surtout pas être mise en cache — un témoignage publié il y a dix secondes
 * doit apparaître avec son nouvel état.
 */
export const metadata: Metadata = {
  title: "Témoignages",
};

/**
 * Tous les témoignages, brouillons compris.
 *
 * La collection en compte trois et n'a pas vocation à en compter deux cents :
 * `<DataTable>` filtre, trie et pagine en mémoire (§6.1). La borne existe
 * malgré tout — `MAX_PAGE_SIZE` vaut 100 — et c'est elle qui rendrait le
 * problème visible si la collection dérivait un jour.
 */
const TAILLE_PAGE = 100;

export default async function TemoignagesPage() {
  const actor = await requirePermission("testimonial:read");

  const read = await testimonialReadPort();
  const temoignages = await listTestimonials(read, {
    page: 1,
    pageSize: TAILLE_PAGE,
    sortBy: "position",
    sortDirection: "asc",
  });

  /*
    Une lecture en échec ne doit pas produire une liste vide : « il n'y a
    aucun témoignage » et « on n'a pas pu les lire » ne sont pas la même
    information, et les confondre est exactement ce que l'invariant nº 1
    interdit. Le second appelle « Réessayer », le premier « Créer ».
  */
  if (!temoignages.ok) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Témoignages"
          description="Les paroles recueillies auprès des bénéficiaires, bénévoles et partenaires."
        />
        <ErrorState
          title="La liste des témoignages n'a pas pu être chargée"
          message={temoignages.error.message}
        />
      </div>
    );
  }

  /*
    Les portraits et les titres de programmes sont résolus ICI, en deux
    requêtes, et non par les colonnes du tableau : trois vignettes chargées une
    par une depuis le navigateur, ce seraient trois allers-retours après le
    rendu, et trois cases vides en attendant.

    Un échec ne justifie pas d'écran d'erreur — la liste reste lisible sans ses
    vignettes, et la colonne dit alors « aucune photo ». Le programme, lui, est
    signalé comme non lisible plutôt que confondu avec « aucun programme ».
  */
  const identifiants = temoignages.value.items
    .map((temoignage) => temoignage.photoMediaId)
    .filter((identifiant): identifiant is string => identifiant !== null);

  const [medias, programmes] = await Promise.all([
    getMediaByIds(await mediaReadPort(), identifiants),
    listProgrammes(await programmeReadPort(), {
      page: 1,
      pageSize: TAILLE_PAGE,
      sortBy: "position",
      sortDirection: "asc",
    }),
  ]);

  const photos: Record<string, MediaAsset> = {};
  if (medias.ok) {
    for (const media of medias.value) photos[media.id] = media;
  }

  const titresProgrammes: Record<string, string> = {};
  if (programmes.ok) {
    for (const programme of programmes.value.items) {
      titresProgrammes[programme.id] = programme.shortTitle;
    }
  }

  return (
    <TestimonialsClient
      temoignages={temoignages.value.items}
      photos={photos}
      programmes={titresProgrammes}
      peutCreer={can(actor, "testimonial:create")}
      peutModifier={can(actor, "testimonial:update")}
      peutPublier={can(actor, "testimonial:publish")}
      peutSupprimer={can(actor, "testimonial:delete")}
      peutReordonner={can(actor, "testimonial:reorder")}
    />
  );
}
