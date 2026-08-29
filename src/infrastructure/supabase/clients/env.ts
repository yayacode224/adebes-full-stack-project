/**
 * Lecture des variables d'environnement Supabase.
 *
 * ⚠️  LE PIÈGE QUE CE FICHIER EXISTE POUR ÉVITER (§15, règle 16 du Rapport 1)
 *
 * Une variable d'environnement **déclarée mais vide vaut `""`, pas
 * `undefined`**. C'est précisément ce qui se produit quand une variable est
 * créée dans Vercel sans être renseignée — et le cas s'est déjà présenté sur
 * ce projet : `SUPABASE_SERVICE_ROLE_KEY` était déclarée à vide dans
 * `.env.local`.
 *
 * Conséquence : `process.env.X ?? "valeur"` NE RATTRAPE RIEN, et l'écriture
 * répandue `process.env.X!` produit un client qui s'initialise sans erreur
 * puis échoue à la première requête, avec un message incompréhensible.
 *
 * `src/lib/site-config.ts` traite déjà ce cas pour l'URL du site ; ce fichier
 * applique le même principe aux clés Supabase : on valide, et on échoue tôt
 * avec un message qui dit quoi faire.
 */

function lire(nom: string): string {
  const valeur = process.env[nom]?.trim();
  if (!valeur) {
    throw new Error(
      `Variable d'environnement manquante ou vide : ${nom}. ` +
        `Renseignez-la dans .env.local (voir .env.example) et redémarrez le serveur. ` +
        `Attention : une variable déclarée sans valeur vaut une chaîne vide, pas « absente ».`,
    );
  }
  return valeur;
}

/** URL et clé anon — publiques par nature, protégées par les politiques RLS. */
export function requireSupabaseEnv(): { url: string; anonKey: string } {
  return {
    url: lire("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: lire("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

/**
 * Clé de service — contourne TOUTES les politiques RLS.
 *
 * Fonction distincte, et non un champ de la précédente : ainsi le code qui n'a
 * besoin que de la clé anon ne peut pas échouer au démarrage parce que la clé
 * de service est absente, et surtout ne peut pas y accéder par mégarde.
 */
export function requireServiceRoleKey(): string {
  return lire("SUPABASE_SERVICE_ROLE_KEY");
}
