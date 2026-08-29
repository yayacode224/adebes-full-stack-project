-- ===========================================================================
-- 0011 — Buckets Storage et leurs politiques
--
-- Décision D5 : Supabase Storage remplace `/public` pour les médias
-- éditoriaux. Un utilisateur non technique ne peut pas déposer un fichier
-- dans `/public` — cela suppose un accès au dépôt et un redéploiement.
--
-- Ce qui RESTE dans `/public` : le logo, les icônes, l'image Open Graph par
-- défaut. Ce sont des ressources de marque, pas du contenu éditorial.
--
-- ⚠️  Rappel du Lot 0.4 : sans l'entrée `remotePatterns` correspondante dans
-- next.config.ts, `next/image` refusera toutes les images de ces buckets.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- Les deux buckets.
--
-- `public = true` ne concerne que la LECTURE : n'importe qui peut afficher un
-- fichier dont il connaît l'URL. L'écriture reste gouvernée par les
-- politiques ci-dessous. C'est ce qui permet à `next/image` d'optimiser les
-- images sans jeton signé.
--
-- Les limites de taille et de type MIME sont posées ici en plus de la
-- validation applicative (§7.2 du Rapport 2) : une validation côté serveur
-- peut être oubliée dans un nouveau chemin d'appel, la contrainte du bucket
-- non.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  8388608,  -- 8 Mo
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    -- NOTE DE SÉCURITÉ : un SVG peut embarquer du script. Le risque est
    -- contenu ici (les buckets sont servis depuis le domaine Supabase, pas
    -- depuis celui du site) mais il n'est pas nul. À réexaminer au Lot 16 en
    -- même temps que la CSP ; le retirer si aucun SVG éditorial n'est
    -- réellement téléversé.
    'image/svg+xml'
  ]
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  true,
  20971520,  -- 20 Mo
  array['application/pdf']
)
on conflict (id) do nothing;


-- ---------------------------------------------------------------------------
-- Politiques d'accès aux objets.
--
-- Même répartition que pour `media_assets` (0009), pour que le catalogue et
-- les fichiers ne puissent jamais diverger : l'éditeur téléverse, seul
-- l'administrateur remplace et supprime.
-- ---------------------------------------------------------------------------

create policy "storage_public_read" on storage.objects
  for select
  using (bucket_id in ('media', 'documents'));

create policy "storage_staff_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('media', 'documents')
    and public.app_is_staff()
  );

create policy "storage_admin_update" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('media', 'documents')
    and public.app_can_publish()
  )
  with check (
    bucket_id in ('media', 'documents')
    and public.app_can_publish()
  );

create policy "storage_admin_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('media', 'documents')
    and public.app_can_publish()
  );
