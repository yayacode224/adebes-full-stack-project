-- ===========================================================================
-- 0014 — Insertion d'une section à une position donnée
--
-- Jumelle de `reorder_rows()` (migration 0012), pour le geste que celle-ci ne
-- couvre pas : ajouter une section AU MILIEU d'une page.
--
-- ---------------------------------------------------------------------------
-- POURQUOI UNE FONCTION SQL PLUTÔT QUE DEUX REQUÊTES
-- ---------------------------------------------------------------------------
-- Insérer en 3ᵉ position sur une page qui en compte cinq suppose deux
-- écritures : décaler les positions 3, 4, 5 vers 4, 5, 6, puis insérer. Faites
-- depuis l'applicatif, PostgREST ne les réunit dans aucune transaction :
--
--   * si la seconde échoue, la page garde un trou en position 3 et le prochain
--     ajout calcule une position déjà prise ;
--   * entre les deux, la page publique est servie avec un ordre que personne
--     n'a demandé.
--
-- Le contrat d'unicité `(page_id, position)` est `deferrable initially
-- deferred` (migration 0006) précisément pour permettre l'état intermédiaire à
-- l'intérieur d'une transaction. Il faut donc une transaction, et le corps
-- d'une fonction plpgsql en est une.
--
-- ---------------------------------------------------------------------------
-- ⚠️  `security definer` FAIT TOMBER LA RLS — LE CONTRÔLE DE RÔLE EST DONC
--     OBLIGATOIRE ICI, exactement comme dans `reorder_rows()`
-- ---------------------------------------------------------------------------
-- La politique `page_sections_admin_insert` (migration 0009) exige
-- `app_can_publish()` : « l'éditeur remplit une section existante mais ne
-- compose pas la page ». Sans le contrôle ci-dessous, cette fonction offrirait
-- à un éditeur — voire à un visiteur anonyme — exactement le chemin que la
-- politique refuse.
--
-- `auth.uid() is null` = contexte de confiance (seed, migration, service_role),
-- cohérent avec `guard_publish` (0010) et `reorder_rows` (0012).
-- ===========================================================================

create or replace function public.insert_section_at(
  p_page_id    uuid,
  p_block_type text,
  p_content    jsonb,
  p_is_visible boolean,
  p_position   integer
)
returns public.page_sections
language plpgsql
security definer
set search_path = public
as $$
declare
  v_section  public.page_sections;
  v_position integer;
  v_total    integer;
begin
  if auth.uid() is not null and not public.app_can_publish() then
    raise exception
      'Seuls un administrateur ou un super administrateur peuvent ajouter une section.'
      using errcode = 'ADB06';
  end if;

  if not exists (select 1 from public.pages where id = p_page_id) then
    raise exception 'Cette page n''existe plus.'
      using errcode = 'ADB07';
  end if;

  select count(*) into v_total
    from public.page_sections
   where page_id = p_page_id;

  -- La position est BORNÉE plutôt que refusée : une valeur hors plage vient
  -- d'un arbre affiché avant une modification faite ailleurs, pas d'une
  -- tentative d'abus. Refuser ferait perdre la saisie pour un décalage d'un
  -- rang ; borner place la section à l'extrémité la plus proche de ce qui
  -- était demandé.
  v_position := greatest(1, least(p_position, v_total + 1));

  -- Décalage AVANT l'insertion. L'état intermédiaire viole momentanément
  -- l'unicité `(page_id, position)` — c'est ce que `deferrable initially
  -- deferred` autorise, et la vérification a lieu au COMMIT.
  update public.page_sections
     set position = position + 1
   where page_id = p_page_id
     and position >= v_position;

  insert into public.page_sections (page_id, block_type, position, content, is_visible)
  values (
    p_page_id,
    p_block_type,
    v_position,
    coalesce(p_content, '{}'::jsonb),
    coalesce(p_is_visible, true)
  )
  returning * into v_section;

  return v_section;
end $$;

comment on function public.insert_section_at(uuid, text, jsonb, boolean, integer) is
  'Insère une section à une position donnée en une transaction, en décalant les suivantes. Contrôle de rôle obligatoire (security definer).';

-- `public` couvre `anon` et `authenticated` ; le contrôle de rôle du corps est
-- la barrière réelle, comme pour `reorder_rows`.
revoke all on function public.insert_section_at(uuid, text, jsonb, boolean, integer) from public;
grant execute on function public.insert_section_at(uuid, text, jsonb, boolean, integer) to authenticated;
