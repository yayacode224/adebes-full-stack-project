-- ===========================================================================
-- 0009 — Politiques RLS
--
-- Troisième et dernière barrière du dispositif (§9 du Rapport 1) : elle
-- protège même en cas de bug applicatif ou de clé anon fuitée. Les deux
-- premières barrières (proxy optimiste, DAL autoritaire) sont applicatives ;
-- celle-ci est dans la base et ne se contourne pas.
--
-- Deux principes de lecture :
--
--  * Les politiques sont PERMISSIVES : elles se combinent en OU. Une lecture
--    publique « contenu publié » et une lecture personnel « tout » coexistent
--    sans se gêner — le personnel voit tout, l'anonyme voit le publié.
--
--  * La restriction « l'éditeur ne publie pas » n'est PAS portée ici. Les
--    politiques d'`update` sont volontairement larges pour le personnel ; le
--    refus de la transition vers `published` est porté par le trigger
--    `guard_publish` (0010) et par la matrice de permissions applicative.
--    Deux barrières indépendantes valent mieux qu'une politique illisible.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- Profils
--
-- ⚠️  C'est ici que se trouve le piège de récursion documenté au §8 du
-- Rapport 1. `app_current_role()` interroge `profiles`, et ces politiques
-- portent sur `profiles`. La récursion infinie est évitée parce que la
-- fonction est `security definer` : elle ne repasse pas par la RLS.
-- ---------------------------------------------------------------------------

-- Chacun lit sa propre fiche. C'est le seul accès dont dispose un éditeur.
create policy "profiles_self_read" on public.profiles
  for select to authenticated
  using (id = auth.uid());

-- Les administrateurs lisent tout l'annuaire.
create policy "profiles_admin_read" on public.profiles
  for select to authenticated
  using (public.app_current_role() in ('super_admin', 'admin'));

-- Chacun modifie sa propre fiche — mais PAS son rôle.
--
-- `with check (role = public.app_current_role())` est ce qui l'interdit :
-- la fonction est `stable`, elle voit donc la valeur d'avant la commande.
-- Exiger l'égalité revient à exiger que le rôle n'ait pas changé. Sans cette
-- ligne, n'importe quel éditeur se promeut super administrateur.
create policy "profiles_self_update" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = public.app_current_role());

-- Seul un super administrateur touche aux rôles et à l'état d'activité des
-- autres comptes. Le dernier super administrateur actif reste protégé par le
-- trigger `guard_last_super_admin` (0010).
create policy "profiles_super_admin_update" on public.profiles
  for update to authenticated
  using (public.app_current_role() = 'super_admin')
  with check (public.app_current_role() = 'super_admin');

create policy "profiles_super_admin_delete" on public.profiles
  for delete to authenticated
  using (public.app_current_role() = 'super_admin');

-- Aucune politique d'`insert` : les profils naissent du trigger
-- `handle_new_user` (security definer), jamais d'une écriture directe.
-- Aucune politique pour `anon` : le site public n'expose jamais l'annuaire.


-- ---------------------------------------------------------------------------
-- Médiathèque
--
-- Lecture publique : les buckets sont publics en lecture, masquer le
-- catalogue n'apporterait rien. L'éditeur téléverse ; seul l'administrateur
-- corrige et supprime.
-- ---------------------------------------------------------------------------
create policy "media_assets_public_read" on public.media_assets
  for select using (true);

create policy "media_assets_staff_insert" on public.media_assets
  for insert to authenticated
  with check (public.app_is_staff());

create policy "media_assets_admin_update" on public.media_assets
  for update to authenticated
  using (public.app_can_publish())
  with check (public.app_can_publish());

create policy "media_assets_admin_delete" on public.media_assets
  for delete to authenticated
  using (public.app_can_publish());


-- ---------------------------------------------------------------------------
-- Collections à statut éditorial
--
-- programmes · team_members · testimonials · faq_items · gallery_items ·
-- annual_reports  →  même patron exactement.
--
-- `articles` suit juste après, avec une condition supplémentaire.
-- ---------------------------------------------------------------------------

create policy "programmes_public_read" on public.programmes
  for select using (status = 'published');
create policy "programmes_staff_read" on public.programmes
  for select to authenticated using (public.app_is_staff());
create policy "programmes_staff_insert" on public.programmes
  for insert to authenticated with check (public.app_is_staff());
create policy "programmes_staff_update" on public.programmes
  for update to authenticated
  using (public.app_is_staff()) with check (public.app_is_staff());
create policy "programmes_admin_delete" on public.programmes
  for delete to authenticated using (public.app_can_publish());

create policy "team_members_public_read" on public.team_members
  for select using (status = 'published');
create policy "team_members_staff_read" on public.team_members
  for select to authenticated using (public.app_is_staff());
create policy "team_members_staff_insert" on public.team_members
  for insert to authenticated with check (public.app_is_staff());
create policy "team_members_staff_update" on public.team_members
  for update to authenticated
  using (public.app_is_staff()) with check (public.app_is_staff());
create policy "team_members_admin_delete" on public.team_members
  for delete to authenticated using (public.app_can_publish());

create policy "testimonials_public_read" on public.testimonials
  for select using (status = 'published');
create policy "testimonials_staff_read" on public.testimonials
  for select to authenticated using (public.app_is_staff());
create policy "testimonials_staff_insert" on public.testimonials
  for insert to authenticated with check (public.app_is_staff());
create policy "testimonials_staff_update" on public.testimonials
  for update to authenticated
  using (public.app_is_staff()) with check (public.app_is_staff());
create policy "testimonials_admin_delete" on public.testimonials
  for delete to authenticated using (public.app_can_publish());

create policy "faq_items_public_read" on public.faq_items
  for select using (status = 'published');
create policy "faq_items_staff_read" on public.faq_items
  for select to authenticated using (public.app_is_staff());
create policy "faq_items_staff_insert" on public.faq_items
  for insert to authenticated with check (public.app_is_staff());
create policy "faq_items_staff_update" on public.faq_items
  for update to authenticated
  using (public.app_is_staff()) with check (public.app_is_staff());
create policy "faq_items_admin_delete" on public.faq_items
  for delete to authenticated using (public.app_can_publish());

create policy "gallery_items_public_read" on public.gallery_items
  for select using (status = 'published');
create policy "gallery_items_staff_read" on public.gallery_items
  for select to authenticated using (public.app_is_staff());
create policy "gallery_items_staff_insert" on public.gallery_items
  for insert to authenticated with check (public.app_is_staff());
create policy "gallery_items_staff_update" on public.gallery_items
  for update to authenticated
  using (public.app_is_staff()) with check (public.app_is_staff());
create policy "gallery_items_admin_delete" on public.gallery_items
  for delete to authenticated using (public.app_can_publish());

create policy "annual_reports_public_read" on public.annual_reports
  for select using (status = 'published');
create policy "annual_reports_staff_read" on public.annual_reports
  for select to authenticated using (public.app_is_staff());
create policy "annual_reports_staff_insert" on public.annual_reports
  for insert to authenticated with check (public.app_is_staff());
create policy "annual_reports_staff_update" on public.annual_reports
  for update to authenticated
  using (public.app_is_staff()) with check (public.app_is_staff());
create policy "annual_reports_admin_delete" on public.annual_reports
  for delete to authenticated using (public.app_can_publish());


-- ---------------------------------------------------------------------------
-- Actualités
--
-- Même patron, plus la publication programmée (§12.4 du Rapport 2) : un
-- article daté dans le futur reste invisible du public jusqu'à sa date.
--
-- Le filtre est doublé ici alors que les requêtes publiques l'appliquent
-- déjà : une date de publication future ne doit pas fuiter parce qu'une
-- requête a oublié la clause.
-- ---------------------------------------------------------------------------
create policy "articles_public_read" on public.articles
  for select using (
    status = 'published'
    and (published_at is null or published_at <= now())
  );
create policy "articles_staff_read" on public.articles
  for select to authenticated using (public.app_is_staff());
create policy "articles_staff_insert" on public.articles
  for insert to authenticated with check (public.app_is_staff());
create policy "articles_staff_update" on public.articles
  for update to authenticated
  using (public.app_is_staff()) with check (public.app_is_staff());
create policy "articles_admin_delete" on public.articles
  for delete to authenticated using (public.app_can_publish());


-- ---------------------------------------------------------------------------
-- Collections sans statut éditorial
--
-- core_values et stats sont toujours affichées (elles portent `is_visible`).
-- Les tables de catégories ne sont que des libellés : leur lecture est
-- publique sans condition.
--
-- L'éditeur peut corriger un libellé ou un chiffre, mais pas ajouter ni
-- supprimer une entrée : ce sont des listes structurantes du site.
-- ---------------------------------------------------------------------------
create policy "core_values_public_read" on public.core_values
  for select using (is_visible);
create policy "core_values_staff_read" on public.core_values
  for select to authenticated using (public.app_is_staff());
create policy "core_values_staff_update" on public.core_values
  for update to authenticated
  using (public.app_is_staff()) with check (public.app_is_staff());
create policy "core_values_admin_insert" on public.core_values
  for insert to authenticated with check (public.app_can_publish());
create policy "core_values_admin_delete" on public.core_values
  for delete to authenticated using (public.app_can_publish());

create policy "stats_public_read" on public.stats
  for select using (is_visible);
create policy "stats_staff_read" on public.stats
  for select to authenticated using (public.app_is_staff());
create policy "stats_staff_update" on public.stats
  for update to authenticated
  using (public.app_is_staff()) with check (public.app_is_staff());
create policy "stats_admin_insert" on public.stats
  for insert to authenticated with check (public.app_can_publish());
create policy "stats_admin_delete" on public.stats
  for delete to authenticated using (public.app_can_publish());

create policy "article_categories_public_read" on public.article_categories
  for select using (true);
create policy "article_categories_staff_update" on public.article_categories
  for update to authenticated
  using (public.app_is_staff()) with check (public.app_is_staff());
create policy "article_categories_admin_insert" on public.article_categories
  for insert to authenticated with check (public.app_can_publish());
create policy "article_categories_admin_delete" on public.article_categories
  for delete to authenticated using (public.app_can_publish());

create policy "gallery_categories_public_read" on public.gallery_categories
  for select using (true);
create policy "gallery_categories_staff_update" on public.gallery_categories
  for update to authenticated
  using (public.app_is_staff()) with check (public.app_is_staff());
create policy "gallery_categories_admin_insert" on public.gallery_categories
  for insert to authenticated with check (public.app_can_publish());
create policy "gallery_categories_admin_delete" on public.gallery_categories
  for delete to authenticated using (public.app_can_publish());


-- ---------------------------------------------------------------------------
-- Pages et sections
--
-- Une section n'est publique que si SA PAGE l'est. La sous-requête sur
-- `pages` est elle-même soumise à la RLS de `pages` : pour un visiteur
-- anonyme, elle ne voit que les pages publiées, ce qui est exactement la
-- condition recherchée.
-- ---------------------------------------------------------------------------
create policy "pages_public_read" on public.pages
  for select using (status = 'published');
create policy "pages_staff_read" on public.pages
  for select to authenticated using (public.app_is_staff());
create policy "pages_staff_update" on public.pages
  for update to authenticated
  using (public.app_is_staff()) with check (public.app_is_staff());
create policy "pages_admin_insert" on public.pages
  for insert to authenticated with check (public.app_can_publish());
create policy "pages_admin_delete" on public.pages
  for delete to authenticated using (public.app_can_publish());

create policy "page_sections_public_read" on public.page_sections
  for select using (
    is_visible
    and exists (
      select 1 from public.pages p
      where p.id = page_sections.page_id
        and p.status = 'published'
    )
  );
create policy "page_sections_staff_read" on public.page_sections
  for select to authenticated using (public.app_is_staff());
-- L'éditeur remplit une section existante mais ne compose pas la page :
-- ajouter et supprimer des sections restent réservés (§9 du Rapport 1).
create policy "page_sections_staff_update" on public.page_sections
  for update to authenticated
  using (public.app_is_staff()) with check (public.app_is_staff());
create policy "page_sections_admin_insert" on public.page_sections
  for insert to authenticated with check (public.app_can_publish());
create policy "page_sections_admin_delete" on public.page_sections
  for delete to authenticated using (public.app_can_publish());


-- ---------------------------------------------------------------------------
-- Réglages et navigation
--
-- Lecture publique : le site en a besoin à chaque rendu (pied de page,
-- métadonnées, menus). Écriture réservée aux administrateurs — un éditeur
-- n'a accès à aucun écran de réglages.
-- ---------------------------------------------------------------------------
create policy "site_settings_public_read" on public.site_settings
  for select using (true);
create policy "site_settings_admin_insert" on public.site_settings
  for insert to authenticated with check (public.app_can_publish());
create policy "site_settings_admin_update" on public.site_settings
  for update to authenticated
  using (public.app_can_publish()) with check (public.app_can_publish());
create policy "site_settings_admin_delete" on public.site_settings
  for delete to authenticated using (public.app_can_publish());

create policy "navigation_items_public_read" on public.navigation_items
  for select using (true);
create policy "navigation_items_admin_insert" on public.navigation_items
  for insert to authenticated with check (public.app_can_publish());
create policy "navigation_items_admin_update" on public.navigation_items
  for update to authenticated
  using (public.app_can_publish()) with check (public.app_can_publish());
create policy "navigation_items_admin_delete" on public.navigation_items
  for delete to authenticated using (public.app_can_publish());


-- ---------------------------------------------------------------------------
-- Messages reçus
--
-- Le visiteur anonyme INSÈRE mais ne lit rien : sans cette asymétrie, les
-- coordonnées de tous les correspondants seraient publiques.
-- ---------------------------------------------------------------------------
create policy "form_submissions_public_insert" on public.form_submissions
  for insert with check (true);
create policy "form_submissions_staff_read" on public.form_submissions
  for select to authenticated using (public.app_is_staff());
create policy "form_submissions_staff_update" on public.form_submissions
  for update to authenticated
  using (public.app_is_staff()) with check (public.app_is_staff());
create policy "form_submissions_admin_delete" on public.form_submissions
  for delete to authenticated using (public.app_can_publish());


-- ---------------------------------------------------------------------------
-- Journal d'audit — lecture seule, et seulement pour les administrateurs.
--
-- Aucune politique d'écriture : le journal est alimenté par le client
-- `service_role` (l'un des quatre usages autorisés de `createAdminClient`).
-- Un journal que l'application peut modifier ne prouve rien.
-- ---------------------------------------------------------------------------
create policy "audit_logs_admin_read" on public.audit_logs
  for select to authenticated using (public.app_can_publish());


-- ---------------------------------------------------------------------------
-- Versions de contenu
-- ---------------------------------------------------------------------------
create policy "content_versions_staff_read" on public.content_versions
  for select to authenticated using (public.app_is_staff());
create policy "content_versions_staff_insert" on public.content_versions
  for insert to authenticated with check (public.app_is_staff());
create policy "content_versions_admin_delete" on public.content_versions
  for delete to authenticated using (public.app_can_publish());


-- ---------------------------------------------------------------------------
-- Limitation de débit — AUCUNE politique, volontairement.
--
-- RLS est active et rien n'est autorisé : la table n'est accessible qu'au
-- rôle `service_role` et à la fonction d'incrément `security definer` du
-- Lot 16. Un compteur que le client peut lire ou remettre à zéro ne limite
-- rien.
-- ---------------------------------------------------------------------------
