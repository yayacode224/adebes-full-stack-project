-- ===========================================================================
-- 0002 — Fonctions partagées sans dépendance de table
--
-- ⚠️  ÉCART ASSUMÉ PAR RAPPORT AU §1.2 DU RAPPORT 2 — à lire avant de
-- « remettre de l'ordre » dans ce fichier.
--
-- Le plan prévoyait de regrouper ici les quatre fonctions partagées :
-- `set_updated_at()`, `app_current_role()`, `app_is_staff()` et
-- `app_can_publish()`. C'est impossible en l'état, et pas par convention :
--
--   PostgreSQL analyse et valide le corps d'une fonction `language sql`
--   AU MOMENT DE SA CRÉATION. Or `app_current_role()` interroge
--   `public.profiles`, qui n'est créée qu'en 0003. La création échoue donc
--   avec « relation "public.profiles" does not exist » (SQLSTATE 42P01).
--
-- Deux corrections étaient possibles :
--   a) passer `app_current_role()` en `language plpgsql`, dont le corps n'est
--      pas résolu à la création ;
--   b) déplacer les trois fonctions de rôle après la table.
--
-- (b) est retenue : le §8 du Rapport 1 fixe la forme exacte de
-- `app_current_role()` et conclut « Ne pas simplifier ces deux lignes ».
-- Changer son langage serait une modification plus lourde de sa définition
-- qu'un déplacement de fichier. Les trois fonctions de rôle sont donc en fin
-- de 0003, juste après la table dont elles dépendent.
--
-- Reste ici la seule fonction qui ne dépend d'aucune table.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Horodatage : une seule fonction, réutilisée par un trigger sur chaque table
-- possédant `updated_at` (règle transverse nº 2 du §8 du Rapport 1).
--
-- Elle est définie ici parce que 0003 en a besoin dès sa première table.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end $$;
