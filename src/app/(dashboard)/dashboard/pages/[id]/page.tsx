import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { PageEditor } from "@/components/dashboard/pages/page-editor";
import type { PageWithSections } from "@/core/cms/entities/page";
import { pageIdSchema } from "@/core/cms/schemas/page.schema";
import { can } from "@/core/rbac/policy";
import { getPage } from "@/core/use-cases/pages/get-page";
import { requirePermission } from "@/server/dal/session";
import { galleryCategoryReadPort } from "@/server/deps/gallery.deps";
import { pageDeps } from "@/server/deps/page.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /dashboard/pages/[id] — l'éditeur (§9.3 du Rapport 2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ---------------------------------------------------------------------------
 * L'IDENTIFIANT EST VALIDÉ AVANT D'ÊTRE ENVOYÉ EN BASE
 * ---------------------------------------------------------------------------
 * Il vient de l'URL. Sans cette vérification, `/dashboard/pages/bonjour`
 * produirait une erreur PostgREST 22P02 remontée en écran technique, là où la
 * réponse juste est une 404 — la même que pour une page réellement supprimée.
 *
 * `params` EST UNE PROMESSE (Next.js 16, §15 du Rapport 1) : `await params`.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LES SECTIONS MASQUÉES SONT LUES ICI, ET C'EST LE POINT QUI COMPTE
 * ---------------------------------------------------------------------------
 * `getPage()` (et non `getPagePubliee()`) rend TOUTES les sections d'une page,
 * visibilité comprise — c'est le contrat vérifié par la phase 1 du lot :
 * « une section masquée disparaît du site mais reste dans le dashboard ». La
 * lecture publique, elle, n'apparaît nulle part dans cet écran.
 *
 * ---------------------------------------------------------------------------
 * LES CATÉGORIES DE GALERIE : UNE LECTURE STAFF, PAS LA LECTURE PUBLIQUE
 * ---------------------------------------------------------------------------
 * Le champ `kind: 'reference'` du bloc « Aperçu de la galerie » propose les
 * catégories existantes. `galleryCategoryReadPort()` (authentifié) et non
 * `getCategoriesGalerie()` (public, non mis en cache ici de toute façon) :
 * une personne qui compose une section doit pouvoir choisir une catégorie
 * fraîchement créée, avant même qu'elle porte une photo visible.
 */

const lirePage = cache(
  async (identifiant: string): Promise<PageWithSections | null> => {
    const analyse = pageIdSchema.safeParse({ id: identifiant });
    if (!analyse.success) return null;

    const resultat = await getPage(await pageDeps(), analyse.data.id);

    if (resultat.ok) return resultat.value;
    // `NOT_FOUND` est un cas normal : un lien rouvert après une suppression.
    if (resultat.error.code === "NOT_FOUND") return null;
    throw resultat.error;
  },
);

export async function generateMetadata(
  props: PageProps<"/dashboard/pages/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;

  // La garde d'accès protège la DONNÉE, pas seulement l'affichage : sans elle,
  // le titre de l'onglet révélerait le nom d'un brouillon à un compte non
  // autorisé.
  await requirePermission("page:read");

  const page = await lirePage(id);
  return { title: page ? page.title : "Page introuvable" };
}

export default async function PageEditorScreen(
  props: PageProps<"/dashboard/pages/[id]">,
) {
  const { id } = await props.params;
  const actor = await requirePermission("page:read");

  const page = await lirePage(id);
  if (!page) notFound();

  /*
    Un échec ici ne doit PAS faire échouer l'écran entier : le champ de
    référence des catégories de galerie n'est utile que sur un bloc précis, et
    `<ReferenceField>` sait déjà annoncer une liste absente plutôt que d'en
    inventer une vide (voir son en-tête).
  */
  const categories = await galleryCategoryReadPort()
    .then((port) => port.findAll())
    .catch(() => null);

  return (
    <PageEditor
      page={page}
      sections={page.sections}
      peutModifierPage={can(actor, "page:update")}
      peutPublierPage={can(actor, "page:publish")}
      peutSupprimerPage={can(actor, "page:delete")}
      peutComposerSections={
        can(actor, "section:create") && can(actor, "section:delete")
      }
      peutModifierSections={
        can(actor, "section:update") && can(actor, "section:reorder")
      }
      referencesDeBloc={{
        gallery: (categories ?? []).map((categorie) => ({
          value: categorie.slug,
          label: categorie.label,
        })),
      }}
    />
  );
}
