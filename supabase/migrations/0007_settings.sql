-- ===========================================================================
-- 0007 — Configuration du site (Famille C)
--
-- Ce qui vient aujourd'hui de src/lib/site-config.ts et src/lib/navigation.ts.
--
-- Sept groupes de réglages, chacun avec son schéma Zod dans
-- core/cms/schemas/settings/ : identity, contact, legal, socials, seo, theme,
-- features. Un groupe = une ligne = un document JSONB validé.
-- ===========================================================================

create table public.site_settings (
  -- `group` est un mot réservé SQL : il est toujours cité en `"group"`.
  -- Conservé tel quel car c'est le nom retenu au §8 du Rapport 1 et celui que
  -- le code applicatif utilise.
  "group"     text primary key
                check ("group" in (
                  'identity', 'contact', 'legal',
                  'socials', 'seo', 'theme', 'features'
                )),
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles (id) on delete set null
);

comment on table public.site_settings is
  'Un groupe de réglages par ligne. `value` est validé par un schéma Zod à l''écriture et à la lecture.';

create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- Navigation — les 3 menus de src/lib/navigation.ts, devenus modifiables.
-- ---------------------------------------------------------------------------
create table public.navigation_items (
  id           uuid primary key default gen_random_uuid(),
  menu         text not null
                 check (menu in ('main', 'conversion', 'legal', 'footer')),
  label        text not null,
  href         text not null,
  -- Texte d'aide affiché dans les menus déroulants de l'en-tête.
  description  text,
  -- Sous-entrée d'un menu. `cascade` : supprimer un parent retire ses enfants,
  -- qui n'auraient plus de point d'accroche.
  parent_id    uuid references public.navigation_items (id) on delete cascade,
  position     integer not null default 0,
  -- Un lien externe s'ouvre dans un nouvel onglet et porte rel="noopener".
  is_external  boolean not null default false,
  is_visible   boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index navigation_items_menu_position_idx
  on public.navigation_items (menu, position);
create index navigation_items_parent_idx
  on public.navigation_items (parent_id);

create trigger navigation_items_set_updated_at
  before update on public.navigation_items
  for each row execute function public.set_updated_at();


alter table public.site_settings     enable row level security;
alter table public.navigation_items  enable row level security;
