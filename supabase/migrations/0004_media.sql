-- ===========================================================================
-- 0004 — Médiathèque
--
-- `media_assets` est le catalogue des fichiers déposés dans Supabase Storage
-- (décision D5). Le contenu ne référence jamais une URL : il référence un
-- `media_id`. La résolution en URL est faite au rendu, ce qui permet de
-- changer de stockage sans réécrire une seule ligne de contenu.
-- ===========================================================================

create table public.media_assets (
  id           uuid primary key default gen_random_uuid(),
  -- 'media' pour les images, 'documents' pour les PDF (voir 0011).
  bucket       text not null,
  -- Chemin dans le bucket. Unique : deux entrées ne peuvent pas désigner le
  -- même objet et se contredire sur le texte alternatif.
  path         text not null unique,
  -- Nom d'origine, conservé pour l'affichage seulement. Le fichier réellement
  -- stocké porte un nom régénéré `<uuid>.<ext>` (§3.5 du Rapport 2) : un nom
  -- d'origine peut contenir des accents, des espaces, ou une extension
  -- mensongère.
  filename     text not null,
  mime_type    text not null,
  size_bytes   bigint not null,
  width        integer,
  height       integer,

  -- ⚠️  NON NUL, et ce n'est pas négociable.
  -- Le site respecte WCAG 1.1.1 ; le CMS ne doit pas permettre d'y régresser.
  -- Le formulaire de téléversement exige la saisie avant enregistrement
  -- (§7.2 du Rapport 2) plutôt que de laisser la base refuser l'écriture.
  alt_text     text not null,

  caption      text,
  folder       text,
  uploaded_by  uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

comment on column public.media_assets.alt_text is
  'Texte alternatif — obligatoire (WCAG 1.1.1). Exigé dès le formulaire.';

create index media_assets_folder_idx on public.media_assets (folder);
create index media_assets_mime_idx on public.media_assets (mime_type);
create index media_assets_created_idx on public.media_assets (created_at desc);

-- Second temps de la dépendance circulaire ouverte en 0003.
alter table public.profiles
  add constraint profiles_avatar_media_id_fkey
  foreign key (avatar_media_id)
  references public.media_assets (id)
  on delete set null;

alter table public.media_assets enable row level security;
