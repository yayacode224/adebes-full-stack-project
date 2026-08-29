-- ===========================================================================
-- 0006 — Pages composables (Famille B)
--
-- Une page est une suite ordonnée de sections ; chaque section est un bloc
-- typé dont le contenu est du JSONB validé par un schéma Zod à l'écriture
-- **et** à la lecture (décision D2).
--
-- Le JSONB n'est pas un fourre-tout : c'est le seul endroit où la forme varie
-- par nature. Un bloc « bannière CTA » et un bloc « grille de chiffres »
-- n'ont aucune colonne en commun ; une table par type de bloc imposerait une
-- migration SQL pour chaque nouveau bloc, ce qui est précisément ce que le
-- registre du §10 évite.
-- ===========================================================================

create table public.pages (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  -- Chemin réel sur le site ('/', '/a-propos', …). Distinct du slug pour que
  -- la page d'accueil ait un slug lisible ('accueil') tout en servant '/'.
  route             text not null unique,
  title             text not null,
  meta_title        text,
  meta_description  text,
  og_media_id       uuid references public.media_assets (id) on delete set null,
  -- En-tête de page. Conservé hors des sections : toute page en a un, et il
  -- ne se réordonne pas.
  hero              jsonb,
  status            public.content_status not null default 'draft',
  -- Une page système fait partie de la structure du site : elle correspond à
  -- une route qui existe en dur dans `src/app/(site)/`. La supprimer
  -- produirait une route sans contenu. Le trigger de 0010 l'interdit.
  is_system         boolean not null default false,
  published_at      timestamptz,
  created_by        uuid references public.profiles (id) on delete set null,
  updated_by        uuid references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index pages_status_idx on public.pages (status);

create trigger pages_set_updated_at
  before update on public.pages
  for each row execute function public.set_updated_at();


create table public.page_sections (
  id          uuid primary key default gen_random_uuid(),
  page_id     uuid not null references public.pages (id) on delete cascade,
  -- Clé dans BLOCK_REGISTRY (§10 du Rapport 1). Volontairement `text` et non
  -- un enum : ajouter un bloc ne doit demander aucune migration SQL.
  block_type  text not null,
  position    integer not null,
  content     jsonb not null default '{}'::jsonb,
  -- Masquer une section la retire du site sans la supprimer du dashboard.
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- ⚠️  `deferrable initially deferred` est indispensable, pas cosmétique.
  --
  -- Le réordonnancement par glisser-déposer réécrit toutes les positions en
  -- une seule transaction (§3.4 du Rapport 2). Une contrainte d'unicité NON
  -- déferrée est vérifiée ligne à ligne : dès que deux sections échangent
  -- leurs positions, l'état intermédiaire viole la contrainte et la
  -- transaction échoue, alors que l'état final est parfaitement valide.
  --
  -- Différer la vérification à la fin de la transaction résout le problème
  -- sans affaiblir la garantie.
  constraint page_sections_page_position_key
    unique (page_id, position) deferrable initially deferred
);

create index page_sections_page_position_idx
  on public.page_sections (page_id, position);

create trigger page_sections_set_updated_at
  before update on public.page_sections
  for each row execute function public.set_updated_at();


alter table public.pages         enable row level security;
alter table public.page_sections enable row level security;
