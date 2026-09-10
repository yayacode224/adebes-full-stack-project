import "server-only";

import { draftMode } from "next/headers";
import { cache } from "react";

import type { Article } from "@/core/cms/entities/article";
import type { PageWithSections } from "@/core/cms/entities/page";
import { createServerClient } from "@/infrastructure/supabase/clients/server";
import { SupabaseArticleRepository } from "@/infrastructure/supabase/repositories/article.repository";
import { SupabasePageRepository } from "@/infrastructure/supabase/repositories/page.repository";
import { SupabasePageSectionRepository } from "@/infrastructure/supabase/repositories/page-section.repository";

import { getCurrentActor } from "../dal/session";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LECTURES DE PRÉVISUALISATION (§12.3 du Rapport 2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Quand un rédacteur ouvre `/api/preview?chemin=…`, le mode brouillon de
 * Next.js est activé (cookie `__prerender_bypass`). Les pages du site appellent
 * alors ces fonctions AU LIEU des lectures publiques : elles voient les
 * brouillons et les contenus programmés.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI CE MODULE VIT DANS `server/` ET NON `server/queries/`
 * ---------------------------------------------------------------------------
 * Il lit avec un client AUTHENTIFIÉ (`createServerClient`, donc les cookies de
 * session) pour franchir la RLS `*_staff_read`. La règle ESLint qui protège
 * `server/queries/**` interdit exactement cet import — et c'est justifié là-bas,
 * où le scope est mis en cache. Ici, il ne l'est jamais : le mode brouillon
 * fait ré-exécuter à chaque requête tout scope `'use cache'` (doc Next.js,
 * « Draft Mode with Cache Components »), donc lire les cookies y est sûr.
 *
 * ---------------------------------------------------------------------------
 * DOUBLE GARDE
 * ---------------------------------------------------------------------------
 * `previewActif()` vérifie le cookie de brouillon ET une session de personnel
 * valide. Un cookie de brouillon seul — copié, ou laissé après un changement de
 * rôle — ne suffit pas à faire apparaître un brouillon. Le cookie est signé et
 * régénéré à chaque build, mais la garde de session est celle qui reste vraie
 * quoi qu'il arrive au cookie.
 */

/**
 * Le rendu est-il en prévisualisation ?
 *
 * Mémoïsé sur la durée d'un rendu : chaque page l'appelle, parfois plusieurs
 * fois (métadonnées + corps).
 */
export const previewActif = cache(async (): Promise<boolean> => {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return false;

  const actor = await getCurrentActor();
  // Tout le personnel possède `page:read` ; c'est la porte du §12.3. Un
  // visiteur sans session ne prévisualise rien, même avec le cookie.
  return actor !== null;
});

/**
 * Un article, publié OU NON, par son adresse. `null` si l'adresse est inconnue.
 *
 * Aucun filtre de statut ni de date : c'est tout l'intérêt de la
 * prévisualisation. La RLS `articles_staff_read` autorise la lecture parce que
 * le client porte une session de personnel.
 */
export const lireArticlePrevisualisation = cache(
  async (slug: string): Promise<Article | null> => {
    const repo = new SupabaseArticleRepository(await createServerClient());
    return repo.findBySlug(slug);
  },
);

/**
 * Une page, publiée OU NON, servie à cette adresse, sections VISIBLES
 * comprises. `null` si aucune page n'existe à cette adresse.
 *
 * Les sections masquées restent masquées : la prévisualisation montre « ce que
 * publier produirait », pas l'atelier. Ce que le mode brouillon révèle, c'est
 * une PAGE en brouillon ou programmée, pas les sections qu'on a délibérément
 * retirées du site.
 */
export const lirePagePrevisualisation = cache(
  async (route: string): Promise<PageWithSections | null> => {
    const supabase = await createServerClient();
    const page = await new SupabasePageRepository(supabase).findByRoute(route);
    if (!page) return null;

    const sections = await new SupabasePageSectionRepository(supabase).findByPage(
      page.id,
    );

    return {
      ...page,
      sections: sections
        .filter((section) => section.isVisible)
        .sort((a, b) => a.position - b.position),
    };
  },
);
