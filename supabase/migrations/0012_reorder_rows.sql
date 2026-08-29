-- ===========================================================================
-- 0012 — Réordonnancement transactionnel
--
-- Appartient au Lot 3 (§3.4 du Rapport 2), pas au Lot 1 : c'est une brique
-- d'infrastructure, pas du schéma. Elle arrive donc avec le repository qui
-- l'appelle.
--
-- POURQUOI UNE FONCTION SQL PLUTÔT QUE N REQUÊTES
--
-- PostgREST n'offre pas de transaction multi-requêtes. Réordonner par une
-- boucle de N `update` laisse, si la troisième échoue, deux éléments
-- renumérotés et le reste à l'ancienne position — un ordre que personne n'a
-- voulu, et qu'aucun rechargement ne corrige.
--
-- Ici, tout se joue dans une seule instruction : elle réussit entièrement ou
-- ne change rien.
-- ===========================================================================

create or replace function public.reorder_rows(p_table text, p_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- -------------------------------------------------------------------------
  -- 1. Liste blanche de tables — OBLIGATOIRE.
  --
  -- `format(%I)` protège de l'injection d'identifiant, mais pas de l'usage
  -- détourné : sans cette liste, n'importe quel utilisateur authentifié
  -- pourrait appeler reorder_rows('profiles', …) et écraser une colonne
  -- `position` sur une table qui n'a rien à voir. La fonction étant
  -- `security definer`, elle le ferait avec les droits du propriétaire.
  -- -------------------------------------------------------------------------
  if p_table not in (
    'programmes', 'articles', 'team_members', 'testimonials',
    'core_values', 'faq_items', 'stats', 'gallery_items',
    'gallery_categories', 'article_categories',
    'annual_reports', 'navigation_items', 'page_sections'
  ) then
    raise exception 'Table non autorisée au réordonnancement : %', p_table
      using errcode = 'ADB04';
  end if;

  -- -------------------------------------------------------------------------
  -- 2. Contrôle de rôle — OBLIGATOIRE pour la même raison.
  --
  -- `security definer` fait tomber la RLS à l'intérieur de la fonction. Sans
  -- ce test, un visiteur anonyme pourrait réordonner tout le site.
  --
  -- `auth.uid() is null` = contexte de confiance (seed, migration, tâche
  -- planifiée, service_role), cohérent avec `guard_publish` (migration 0010).
  -- -------------------------------------------------------------------------
  if auth.uid() is not null and not public.app_is_staff() then
    raise exception 'Droits insuffisants pour réordonner.'
      using errcode = 'ADB05';
  end if;

  -- -------------------------------------------------------------------------
  -- 3. Renumérotation de 1 à N, en une instruction.
  --
  -- `with ordinality` donne le rang de chaque identifiant dans le tableau
  -- reçu ; la jointure applique ce rang à la colonne `position`.
  --
  -- Les lignes absentes de `p_ids` ne sont pas touchées. Le cas d'usage
  -- `reorderProgrammes` impose déjà que la liste soit exhaustive, ce qui rend
  -- la renumérotation totale.
  -- -------------------------------------------------------------------------
  execute format(
    'update public.%I t
        set position = x.ord
       from unnest($1) with ordinality as x(id, ord)
      where t.id = x.id',
    p_table
  ) using p_ids;
end $$;

comment on function public.reorder_rows(text, uuid[]) is
  'Réordonne une table autorisée en une transaction. Liste blanche + contrôle de rôle obligatoires.';

-- L'exécution est ouverte aux comptes connectés ; le contrôle de rôle est fait
-- à l'intérieur, où il peut renvoyer un message clair.
revoke all on function public.reorder_rows(text, uuid[]) from public, anon;
grant execute on function public.reorder_rows(text, uuid[]) to authenticated;
