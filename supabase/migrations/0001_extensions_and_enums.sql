-- ===========================================================================
-- 0001 — Extensions et types énumérés
--
-- Premier fichier de la chaîne : tout le reste en dépend. Les quatre types
-- énumérés sont ceux du §8 du Rapport 1.
--
-- `media_tone` reprend **exactement** le type `MediaTone` de
-- src/components/media/media-placeholder.tsx. Les deux doivent rester
-- alignés : ajouter une teinte ici sans l'ajouter là-bas produirait une
-- valeur que le site ne sait pas rendre.
-- ===========================================================================

-- gen_random_uuid() appartient au cœur de PostgreSQL depuis la version 13,
-- mais pgcrypto reste nécessaire pour le hachage utilisé par Supabase Auth.
create extension if not exists pgcrypto with schema extensions;

-- Trois rôles seulement. La granularité fine est portée par la matrice de
-- permissions applicative (§9 du Rapport 1), pas par une multiplication des
-- rôles en base.
create type public.user_role as enum ('super_admin', 'admin', 'editor');

-- Le cycle éditorial complet (décision D8) : un CMS sans brouillon force à
-- publier pour voir le rendu.
create type public.content_status as enum (
  'draft',
  'in_review',
  'published',
  'archived'
);

-- États d'un message reçu par un formulaire du site.
create type public.submission_status as enum (
  'new',
  'read',
  'handled',
  'archived',
  'spam'
);

-- Teintes des visuels et des cartes.
create type public.media_tone as enum (
  'navy',
  'blue',
  'green',
  'orange',
  'neutral'
);
