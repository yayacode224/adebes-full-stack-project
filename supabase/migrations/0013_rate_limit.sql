-- ===========================================================================
-- 0013 — Compteur de débit atomique
--
-- ÉCART DE CALENDRIER ASSUMÉ : le §16.1 du Rapport 2 place la limitation de
-- débit au Lot 16. Mais le contrat de `createAction` (§6 du Rapport 1, livré
-- au Lot 4) fait de la limitation la PREMIÈRE étape de toute mutation. Sans
-- cette fonction, l'étape 1 serait un talon qui laisse tout passer — une
-- garantie affichée mais absente.
--
-- La fonction arrive donc avec le décorateur qui l'appelle. Le Lot 16 garde
-- son travail : appliquer les seuils à la connexion, à la réinitialisation de
-- mot de passe, aux formulaires publics et au téléversement, puis purger les
-- fenêtres expirées.
--
-- ---------------------------------------------------------------------------
-- POURQUOI EN BASE, ET POURQUOI EN UNE SEULE INSTRUCTION
-- ---------------------------------------------------------------------------
-- En mémoire, ça ne compterait rien : sur Vercel, chaque instance serverless a
-- sa propre mémoire, et cinq tentatives réparties sur cinq instances feraient
-- cinq compteurs à 1.
--
-- Et en deux temps (lire puis écrire), deux requêtes simultanées lisent toutes
-- deux « 4 » et écrivent toutes deux « 5 » : la sixième tentative passe. Un
-- `insert … on conflict do update` est exécuté atomiquement par PostgreSQL,
-- ce qui ferme cette fenêtre.
-- ===========================================================================

create or replace function public.consume_rate_limit(
  p_key            text,
  p_max            integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  compte_courant integer;
begin
  insert into public.rate_limits as r (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update
    set
      -- Fenêtre expirée : on repart à 1 et on redémarre le décompte.
      -- Fenêtre en cours : on incrémente.
      count = case
                when r.window_start < now() - make_interval(secs => p_window_seconds)
                then 1
                else r.count + 1
              end,
      window_start = case
                       when r.window_start < now() - make_interval(secs => p_window_seconds)
                       then now()
                       else r.window_start
                     end
  returning r.count into compte_courant;

  -- `true` = l'appel est autorisé.
  return compte_courant <= p_max;
end $$;

comment on function public.consume_rate_limit(text, integer, integer) is
  'Incrémente atomiquement un compteur de débit et indique si l''appel est autorisé.';

-- Aucun rôle client ne doit pouvoir appeler cette fonction : elle est
-- invoquée côté serveur par le client `service_role`, qui n'est soumis à
-- aucun GRANT. Un visiteur capable de l'appeler pourrait épuiser le compteur
-- d'un tiers, ou sonder les clés existantes.
revoke all on function public.consume_rate_limit(text, integer, integer)
  from public, anon, authenticated;
