-- ===========================================================================
-- 0003 — Profils, et les fonctions de rôle qui en dépendent
--
-- `profiles` prolonge `auth.users` avec ce qui relève de l'application : le
-- rôle, l'état d'activité, le nom affiché. Supabase Auth reste la source de
-- vérité de l'identité ; cette table porte l'autorisation.
--
-- Les trois fonctions de rôle sont en fin de fichier plutôt qu'en 0002 : elles
-- interrogent `public.profiles`, et le corps d'une fonction `language sql` est
-- validé à la création. Voir l'en-tête de 0002 pour le détail.
-- ===========================================================================

create table public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  email            text not null,
  full_name        text,
  -- La contrainte de clé étrangère vers `media_assets` est ajoutée en 0004 :
  -- cette table-là n'existe pas encore, et `media_assets.uploaded_by` pointe
  -- en retour vers `profiles`. La dépendance est circulaire, elle se résout
  -- en deux temps.
  avatar_media_id  uuid,
  role             public.user_role not null default 'editor',
  is_active        boolean not null default true,
  last_seen_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.profiles is
  'Rôle et état applicatif d''un compte. L''identité vit dans auth.users.';

create index profiles_role_idx on public.profiles (role) where is_active;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Création automatique du profil.
--
-- Sans ce trigger, un utilisateur invité existerait dans `auth.users` sans
-- profil, donc sans rôle : il se connecterait et n'aurait accès à rien, sans
-- message clair. Le rôle par défaut est `editor` — le plus restreint.
--
-- `security definer` est requis : le trigger s'exécute dans le contexte de
-- l'inscription, qui n'a pas le droit d'écrire dans `public.profiles`.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  -- Un profil déjà présent (rejeu du seed, réinvitation) ne doit pas faire
  -- échouer la création du compte.
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;


-- ===========================================================================
-- Fonctions de rôle
--
-- Elles ne peuvent pas être créées avant la table ci-dessus : le corps d'une
-- fonction `language sql` est analysé à la création, et il référence
-- `public.profiles`.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Rôle de l'utilisateur courant.
--
-- ⚠️  `security definer` et `set search_path` sont indispensables, pas
-- décoratifs :
--
--  * `security definer` fait exécuter la fonction avec les droits de son
--    propriétaire, ce qui contourne la RLS **à l'intérieur** de la fonction.
--    Sans cela, une politique posée sur `profiles` qui interroge `profiles`
--    provoque une récursion infinie et rend la table définitivement
--    inaccessible — le dashboard serait mort.
--
--  * `set search_path = public` empêche qu'un appelant redéfinisse le chemin
--    de recherche pour détourner la fonction vers ses propres tables. C'est la
--    contrepartie obligatoire de `security definer`.
--
-- Ne pas simplifier ces deux lignes (§8 du Rapport 1).
-- ---------------------------------------------------------------------------
create or replace function public.app_current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- Deux raccourcis de lisibilité pour les politiques RLS.
--
-- Ils ne sont pas `security definer` : ils n'accèdent à aucune table, ils se
-- contentent de composer `app_current_role()`. `set search_path` est tout de
-- même fixé pour que la résolution de `app_current_role` ne dépende pas du
-- chemin de recherche de l'appelant.
--
-- Un rôle absent (utilisateur anonyme) fait renvoyer `null` à
-- `app_current_role()` ; `null in (…)` vaut `null`, que la RLS traite comme
-- faux. Le comportement est donc correct sans test explicite, mais
-- `coalesce` le rend lisible et robuste.
-- ---------------------------------------------------------------------------
create or replace function public.app_is_staff()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(
    public.app_current_role() in ('super_admin', 'admin', 'editor'),
    false
  )
$$;

create or replace function public.app_can_publish()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(
    public.app_current_role() in ('super_admin', 'admin'),
    false
  )
$$;
