import "server-only";

import { createAdminClient } from "@/infrastructure/supabase/clients/admin";
import type { Json } from "@/infrastructure/supabase/database.types";

import { adresseAppelanteInet, userAgentAppelant } from "./request-context";

/**
 * Journal d'audit.
 *
 * Usage autorisé nº 3 de `createAdminClient` (§3.1 du Rapport 2).
 *
 * ---------------------------------------------------------------------------
 * POURQUOI LE CLIENT D'ADMINISTRATION EST NÉCESSAIRE ICI
 * ---------------------------------------------------------------------------
 * `audit_logs` n'a AUCUNE politique d'insertion (migration 0009), seulement
 * une politique de lecture pour les administrateurs. C'est délibéré : un
 * journal que l'application peut modifier avec les droits de l'utilisateur ne
 * prouve rien. Personne ne peut effacer sa propre trace, pas même un super
 * administrateur, puisque aucune politique de `delete` n'existe non plus.
 *
 * L'écriture passe donc par `service_role`, depuis ce seul fichier.
 */
export async function writeAuditLog(entree: {
  actorId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  /**
   * Différentiel des champs modifiés.
   *
   * Typé `Json` et non `Record<string, unknown>` : la colonne est du JSONB, et
   * `unknown` autoriserait à y glisser une `Date` ou une fonction, qui ne
   * survivraient pas à la sérialisation.
   */
  diff?: Json;
}): Promise<void> {
  const supabase = createAdminClient();
  const ip = await adresseAppelanteInet();
  const userAgent = await userAgentAppelant();

  const { error } = await supabase.from("audit_logs").insert({
    actor_id: entree.actorId,
    action: entree.action,
    entity_type: entree.entityType ?? null,
    entity_id: entree.entityId ?? null,
    diff: entree.diff ?? null,
    ip,
    user_agent: userAgent,
  });

  // L'appelant (`createAction`) attrape et journalise : une écriture d'audit
  // qui échoue ne doit pas faire échouer une mutation déjà committée.
  if (error) throw error;
}

/**
 * Événements d'authentification, journalisés hors de `createAction`.
 *
 * `auth.login_failed` en particulier n'a pas d'acteur — c'est justement ce qui
 * en fait un signal utile.
 */
export async function writeAuthAuditLog(entree: {
  actorId: string | null;
  action: "auth.login" | "auth.logout" | "auth.login_failed" | "auth.password_reset";
  email?: string;
}): Promise<void> {
  try {
    const supabase = createAdminClient();
    const ip = await adresseAppelanteInet();
    const userAgent = await userAgentAppelant();

    await supabase.from("audit_logs").insert({
      actor_id: entree.actorId,
      action: entree.action,
      entity_type: "auth",
      // L'e-mail est conservé pour les échecs de connexion : sans lui, on sait
      // qu'il y a eu des tentatives, mais pas contre quel compte.
      entity_id: entree.email ?? null,
      ip,
      user_agent: userAgent,
    });
  } catch (erreur) {
    console.error("[ADEBES] Journalisation de l'authentification impossible", erreur);
  }
}
