-- ===========================================================================
-- 0008 — Versions, journal d'audit, données entrantes, limitation de débit
--
-- Quatre tables transverses :
--   * `content_versions`  — l'historique restaurable (décision D8)
--   * `audit_logs`        — qui a fait quoi, quand
--   * `form_submissions`  — la Famille D : messages reçus par le site
--   * `rate_limits`       — compteurs de la limitation de débit (Lot 16)
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- Versions de contenu
--
-- Un CMS sans historique transforme la moindre erreur en perte définitive.
-- Chaque publication produit un instantané complet, restaurable.
--
-- `entity_type` / `entity_id` sont volontairement génériques (pas de clé
-- étrangère) : la même table sert les onze collections et les pages, sans
-- onze colonnes nullables.
-- ---------------------------------------------------------------------------
create table public.content_versions (
  id              uuid primary key default gen_random_uuid(),
  entity_type     text not null,
  entity_id       text not null,
  version_number  integer not null,
  snapshot        jsonb not null,
  -- Commentaire libre de l'auteur : « corrigé le chiffre des bénéficiaires ».
  comment         text,
  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),

  constraint content_versions_entity_version_key
    unique (entity_type, entity_id, version_number)
);

-- Sert à la fois l'écran d'historique et le calcul du prochain numéro de
-- version, ainsi que la purge au-delà de 20 versions (§12.2 du Rapport 2).
create index content_versions_entity_idx
  on public.content_versions (entity_type, entity_id, version_number desc);


-- ---------------------------------------------------------------------------
-- Journal d'audit
--
-- Écrit par le décorateur `createAction` après chaque mutation réussie, plus
-- les événements d'authentification. Lecture seule depuis le dashboard :
-- aucune politique d'`update` ni de `delete` n'est accordée en 0009, la purge
-- passant par le cron (rétention 180 jours).
-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references public.profiles (id) on delete set null,
  -- Verbe pointé : 'programme.create', 'user.role_changed', 'auth.login_failed'.
  action       text not null,
  entity_type  text,
  entity_id    text,
  -- Différentiel des champs modifiés, affiché replié dans l'écran Journal.
  diff         jsonb,
  ip           inet,
  user_agent   text,
  created_at   timestamptz not null default now()
);

create index audit_logs_created_idx on public.audit_logs (created_at desc);
create index audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);


-- ---------------------------------------------------------------------------
-- Messages reçus (Famille D)
--
-- Aujourd'hui, si Resend n'est pas configuré ou échoue, le message n'existe
-- nulle part. À partir du Lot 14 cette table devient la source de vérité et
-- l'e-mail n'est plus qu'une notification.
--
-- « Un message de bénévole perdu en silence est pire qu'une erreur
-- affichée » — principe déjà écrit dans src/app/actions/forms.ts.
-- ---------------------------------------------------------------------------
create table public.form_submissions (
  id          uuid primary key default gen_random_uuid(),
  form_type   text not null check (form_type in ('contact', 'benevolat')),
  payload     jsonb not null,
  status      public.submission_status not null default 'new',
  handled_by  uuid references public.profiles (id) on delete set null,
  -- Notes internes de l'équipe, jamais renvoyées à l'expéditeur.
  notes       text,
  ip          inet,
  created_at  timestamptz not null default now()
);

create index form_submissions_type_status_idx
  on public.form_submissions (form_type, status, created_at desc);
-- Alimente le compteur de non-lus de la barre latérale.
create index form_submissions_new_idx
  on public.form_submissions (created_at desc) where status = 'new';


-- ---------------------------------------------------------------------------
-- Limitation de débit
--
-- En base et non en mémoire : sur Vercel, chaque instance serverless a sa
-- propre mémoire — un compteur en mémoire ne compte rien.
--
-- La fonction d'incrément atomique et les seuils appartiennent au Lot 16 ;
-- seule la table est créée ici, avec le reste du schéma.
-- ---------------------------------------------------------------------------
create table public.rate_limits (
  -- Discriminant complet : 'login:203.0.113.7', 'upload:<user-id>'.
  key           text primary key,
  window_start  timestamptz not null default now(),
  count         integer not null default 0
);

-- Sert la purge périodique des fenêtres expirées.
create index rate_limits_window_idx on public.rate_limits (window_start);


alter table public.content_versions  enable row level security;
alter table public.audit_logs        enable row level security;
alter table public.form_submissions  enable row level security;
alter table public.rate_limits       enable row level security;
