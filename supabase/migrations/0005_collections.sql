-- ===========================================================================
-- 0005 — Collections typées (Famille A)
--
-- Les onze tables qui reprennent les neuf fichiers de `src/content/`. Chaque
-- colonne correspond à un champ existant du modèle TypeScript : rien n'est
-- inventé, rien n'est abandonné.
--
-- Règles transverses appliquées partout (§8 du Rapport 1) :
--   1. clé primaire `uuid default gen_random_uuid()`
--   2. `created_at` / `updated_at`, `updated_at` tenu par `set_updated_at()`
--   4. toute liste ordonnée porte `position int not null`
--   5. RLS activée sur toutes les tables, sans exception
--
-- Politique de suppression des clés étrangères, choisie délibérément :
--   * `on delete set null`  — le contenu survit à la perte de son illustration
--   * `on delete restrict`  — l'élément est indispensable ; PostgreSQL lève
--     alors 23503, que le repository traduit en message français explicite
--     (§3.3 du Rapport 2) plutôt qu'en erreur SQL brute.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- Programmes — 8 lignes au seed, source : src/content/programmes.ts
-- ---------------------------------------------------------------------------
create table public.programmes (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,
  title              text not null,
  -- Titre court : fils d'Ariane et cartes étroites.
  short_title        text not null,
  summary            text not null,
  -- Nom d'icône lucide, résolu côté présentation par `getIcon()` (§2.5 du
  -- Rapport 2). Une base ne stocke pas un composant React.
  icon               text not null,
  tone               public.media_tone not null default 'neutral',
  -- « Ce que nous faisons »
  actions            text[] not null default '{}',
  -- « À qui ce programme s'adresse »
  publics            text[] not null default '{}',
  -- Besoins concrets — alimentent les CTA don / bénévolat de la page détail.
  besoins            text[] not null default '{}',
  -- ⚠️  Alimente la liste déroulante du formulaire de bénévolat.
  benevolat_label    text not null,
  cover_media_id     uuid references public.media_assets (id) on delete set null,
  gallery_media_ids  uuid[] not null default '{}',
  body               jsonb,
  position           integer not null default 0,
  status             public.content_status not null default 'draft',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index programmes_status_position_idx
  on public.programmes (status, position);

create trigger programmes_set_updated_at
  before update on public.programmes
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- Catégories d'actualités — 5 lignes au seed
-- ---------------------------------------------------------------------------
create table public.article_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  label       text not null,
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger article_categories_set_updated_at
  before update on public.article_categories
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- Actualités — source : src/content/actualites.ts
-- ---------------------------------------------------------------------------
create table public.articles (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title            text not null,
  excerpt          text not null,
  -- Tableau de paragraphes, forme exacte de `Actualite.body: string[]`.
  -- JSONB plutôt que text[] : le Lot 12 pourra enrichir un paragraphe sans
  -- migration.
  body             jsonb not null default '[]'::jsonb,
  category_id      uuid references public.article_categories (id) on delete restrict,
  cover_media_id   uuid references public.media_assets (id) on delete set null,
  -- Calculé à 200 mots/minute puis modifiable (§8B du Rapport 2).
  reading_minutes  integer,
  -- Conserve la distinction actuelle : ces articles sont des exemples de mise
  -- en page, pas des faits. Le site affiche un badge « Exemple ».
  is_placeholder   boolean not null default false,
  -- Peut être dans le passé (migration) comme dans le futur (publication
  -- programmée, Lot 12 — les requêtes publiques filtrent `<= now()`).
  published_at     timestamptz,
  status           public.content_status not null default 'draft',
  author_id        uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index articles_status_published_idx
  on public.articles (status, published_at desc);
create index articles_category_idx on public.articles (category_id);

create trigger articles_set_updated_at
  before update on public.articles
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- Équipe — source : src/content/equipe.ts
-- Les 3 fiches actuelles portent des « [À COMPLÉTER] » : elles sont seedées en
-- `draft`, donc invisibles du site tant qu'elles ne sont pas renseignées.
-- ---------------------------------------------------------------------------
create table public.team_members (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  role            text not null,
  bio             text,
  photo_media_id  uuid references public.media_assets (id) on delete set null,
  position        integer not null default 0,
  status          public.content_status not null default 'draft',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index team_members_status_position_idx
  on public.team_members (status, position);

create trigger team_members_set_updated_at
  before update on public.team_members
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- Témoignages — source : src/content/temoignages.ts
--
-- Règle absolue reprise du code actuel : aucune citation n'est publiée sans
-- l'accord écrit de la personne. Le formulaire du Lot 8C impose une case à
-- cocher ; la colonne ci-dessous en garde la trace.
-- ---------------------------------------------------------------------------
create table public.testimonials (
  id                uuid primary key default gen_random_uuid(),
  quote             text not null,
  author_name       text not null,
  author_role       text not null,
  -- `restrict` : supprimer un programme cité doit produire un message clair,
  -- pas effacer silencieusement le témoignage.
  programme_id      uuid references public.programmes (id) on delete restrict,
  photo_media_id    uuid references public.media_assets (id) on delete set null,
  -- Trace du consentement — voir l'en-tête de src/content/temoignages.ts.
  has_consent       boolean not null default false,
  position          integer not null default 0,
  status            public.content_status not null default 'draft',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index testimonials_status_position_idx
  on public.testimonials (status, position);
create index testimonials_programme_idx on public.testimonials (programme_id);

create trigger testimonials_set_updated_at
  before update on public.testimonials
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- Valeurs — 4 lignes, toujours visibles (pas de statut éditorial)
-- ---------------------------------------------------------------------------
create table public.core_values (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text not null,
  icon         text not null,
  tone         public.media_tone not null default 'neutral',
  position     integer not null default 0,
  is_visible   boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger core_values_set_updated_at
  before update on public.core_values
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- Questions fréquentes — alimente aussi le JSON-LD `FAQPage` (Lot 8F)
-- ---------------------------------------------------------------------------
create table public.faq_items (
  id          uuid primary key default gen_random_uuid(),
  question    text not null,
  answer      text not null,
  bullets     text[] not null default '{}',
  topic       text not null
                check (topic in ('don', 'benevolat', 'general')),
  position    integer not null default 0,
  status      public.content_status not null default 'draft',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index faq_items_topic_position_idx
  on public.faq_items (topic, position);

create trigger faq_items_set_updated_at
  before update on public.faq_items
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- Chiffres clés
--
-- ⚠️  `value` EST NULLABLE, ET CE N'EST PAS UN DÉTAIL.
--
-- C'est la traduction en base de l'invariant nº 1 du projet : « aucun chiffre
-- inventé ». Une valeur absente s'affiche « — » avec une mention explicite,
-- jamais `0`. Le formulaire du dashboard propose une case « chiffre pas encore
-- disponible » qui écrit NULL.
--
-- Ne jamais ajouter `default 0` ni `not null` sur cette colonne.
-- ---------------------------------------------------------------------------
create table public.stats (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,
  label       text not null,
  value       integer,
  suffix      text,
  icon        text not null,
  -- Précision affichée sous le chiffre (source, périmètre, réserve).
  note        text,
  -- Le chiffre existe mais doit encore être validé par l'association.
  to_confirm  boolean not null default false,
  position    integer not null default 0,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on column public.stats.value is
  'NULL = chiffre pas encore disponible. Ne jamais convertir en 0 (invariant du projet).';

create trigger stats_set_updated_at
  before update on public.stats
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- Galerie — catégories puis éléments
--
-- La convention de nommage `categorie-NN.jpg` et la lecture disque de
-- src/content/galerie.ts disparaissent : la catégorie devient une colonne, et
-- les légendes de `legendes.json` migrent vers `media_assets.alt_text`.
-- ---------------------------------------------------------------------------
create table public.gallery_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  label       text not null,
  tone        public.media_tone not null default 'neutral',
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger gallery_categories_set_updated_at
  before update on public.gallery_categories
  for each row execute function public.set_updated_at();

create table public.gallery_items (
  id           uuid primary key default gen_random_uuid(),
  -- `restrict` : un élément de galerie sans image n'a pas de sens. La
  -- suppression du média passe par l'écran « usages » du Lot 7.
  media_id     uuid not null references public.media_assets (id) on delete restrict,
  category_id  uuid references public.gallery_categories (id) on delete restrict,
  position     integer not null default 0,
  status       public.content_status not null default 'draft',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index gallery_items_status_position_idx
  on public.gallery_items (status, position);
create index gallery_items_category_idx on public.gallery_items (category_id);

create trigger gallery_items_set_updated_at
  before update on public.gallery_items
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- Rapports annuels (PDF)
--
-- Comportement actuel conservé : le lien public n'apparaît que si le fichier
-- existe réellement — la vérification porte désormais sur la présence du
-- média en base plutôt que sur `fs.statSync`.
-- ---------------------------------------------------------------------------
create table public.annual_reports (
  id                 uuid primary key default gen_random_uuid(),
  year               integer not null unique,
  title              text not null,
  document_media_id  uuid references public.media_assets (id) on delete restrict,
  position           integer not null default 0,
  status             public.content_status not null default 'draft',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create trigger annual_reports_set_updated_at
  before update on public.annual_reports
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- Règle transverse nº 5 : RLS activée partout, sans exception.
-- Les politiques elles-mêmes sont posées en 0009.
-- ---------------------------------------------------------------------------
alter table public.programmes          enable row level security;
alter table public.article_categories  enable row level security;
alter table public.articles            enable row level security;
alter table public.team_members        enable row level security;
alter table public.testimonials        enable row level security;
alter table public.core_values         enable row level security;
alter table public.faq_items           enable row level security;
alter table public.stats               enable row level security;
alter table public.gallery_categories  enable row level security;
alter table public.gallery_items       enable row level security;
alter table public.annual_reports      enable row level security;
