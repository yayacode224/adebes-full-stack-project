-- ===========================================================================
-- 0010 — Triggers d'invariants
--
-- Trois garde-fous que l'applicatif ne peut pas garantir seul. Ils protègent
-- même si une Server Action est appelée directement, même si la matrice de
-- permissions est contournée, même si un futur développeur écrit un script
-- ad hoc.
--
-- ---------------------------------------------------------------------------
-- CONTRAT D'ERREUR — à respecter au Lot 3 (mappage des erreurs Supabase)
-- ---------------------------------------------------------------------------
-- Ces trois triggers lèvent des SQLSTATE personnalisés de la classe `ADB` :
--
--   ADB01  publication refusée à un éditeur
--   ADB02  dernier super administrateur actif
--   ADB03  page système non supprimable
--
-- Leur `message` est déjà rédigé pour un utilisateur final, en français et
-- sans jargon (§2.2 du Rapport 2). Le repository doit donc **transmettre ce
-- message tel quel** au lieu de le remplacer par le libellé générique de sa
-- table de correspondance. Une classe dédiée rend cette règle sans ambiguïté
-- et auditable : tout SQLSTATE commençant par `ADB` est un message destiné à
-- être affiché.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- 1. Un éditeur ne publie pas, même si l'applicatif est contourné.
--
-- Seconde barrière de la règle portée par la matrice de permissions (§9 du
-- Rapport 1). Elle couvre aussi bien la création directe en `published` que
-- le passage d'un brouillon en ligne.
--
-- ⚠️  `auth.uid() is null` = contexte de confiance : script de seed, migration,
-- tâche planifiée, client `service_role`. Sans cette porte, le seed ne
-- pourrait pas insérer les 8 programmes en `published`, puisqu'il ne
-- s'exécute au nom d'aucun utilisateur. Le visiteur anonyme, lui, n'atteint
-- jamais ce trigger : la RLS ne lui accorde aucune écriture.
-- ---------------------------------------------------------------------------
create or replace function public.guard_publish()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  etait_publie boolean;
begin
  if auth.uid() is null then
    return new;
  end if;

  -- OLD n'existe pas sur INSERT : le cas est traité à part plutôt que de
  -- compter sur l'évaluation paresseuse d'un OR.
  if tg_op = 'INSERT' then
    etait_publie := false;
  else
    etait_publie := (old.status = 'published');
  end if;

  if new.status = 'published'
     and not etait_publie
     and not public.app_can_publish() then
    raise exception
      'Seuls un administrateur ou un super administrateur peuvent publier.'
      using errcode = 'ADB01';
  end if;

  return new;
end $$;

-- Posé sur chacune des huit tables possédant une colonne `status`.
create trigger programmes_guard_publish
  before insert or update on public.programmes
  for each row execute function public.guard_publish();

create trigger articles_guard_publish
  before insert or update on public.articles
  for each row execute function public.guard_publish();

create trigger team_members_guard_publish
  before insert or update on public.team_members
  for each row execute function public.guard_publish();

create trigger testimonials_guard_publish
  before insert or update on public.testimonials
  for each row execute function public.guard_publish();

create trigger faq_items_guard_publish
  before insert or update on public.faq_items
  for each row execute function public.guard_publish();

create trigger gallery_items_guard_publish
  before insert or update on public.gallery_items
  for each row execute function public.guard_publish();

create trigger annual_reports_guard_publish
  before insert or update on public.annual_reports
  for each row execute function public.guard_publish();

create trigger pages_guard_publish
  before insert or update on public.pages
  for each row execute function public.guard_publish();


-- ---------------------------------------------------------------------------
-- 2. Le dernier super administrateur actif est intouchable.
--
-- Perdre le dernier super administrateur, c'est perdre définitivement l'accès
-- à la gestion des utilisateurs : plus personne ne peut promouvoir qui que ce
-- soit. C'est le risque le plus coûteux du §16 du Rapport 1, et la seule
-- parade fiable est en base.
--
-- Deux voies mènent au même désastre, les deux sont fermées :
--   * rétrograder ou désactiver le compte  → trigger sur UPDATE
--   * supprimer le compte                  → trigger sur DELETE
-- ---------------------------------------------------------------------------
create or replace function public.guard_last_super_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  autres_super_admins integer;
begin
  if old.role <> 'super_admin' then
    return coalesce(new, old);
  end if;

  -- Sur UPDATE : seul un départ du rôle ou une désactivation est dangereux.
  if tg_op = 'UPDATE'
     and new.role = 'super_admin'
     and new.is_active then
    return new;
  end if;

  select count(*) into autres_super_admins
  from public.profiles
  where role = 'super_admin'
    and is_active
    and id <> old.id;

  if autres_super_admins = 0 then
    raise exception
      'Impossible : ce compte est le dernier super administrateur actif.'
      using errcode = 'ADB02';
  end if;

  return coalesce(new, old);
end $$;

create trigger profiles_guard_last_super_admin
  before update or delete on public.profiles
  for each row execute function public.guard_last_super_admin();


-- ---------------------------------------------------------------------------
-- 3. Une page système ne se supprime pas.
--
-- Une page `is_system` correspond à une route qui existe en dur dans
-- `src/app/(site)/`. La supprimer laisserait une route sans contenu — une
-- page blanche en production, sans message d'erreur exploitable.
-- ---------------------------------------------------------------------------
create or replace function public.guard_system_page()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.is_system then
    raise exception
      'Cette page fait partie de la structure du site et ne peut pas être supprimée.'
      using errcode = 'ADB03';
  end if;
  return old;
end $$;

create trigger pages_guard_system_page
  before delete on public.pages
  for each row execute function public.guard_system_page();
