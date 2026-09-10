import { AUDIT_RETENTION_DAYS } from "@/core/cms/entities/audit-entry";
import { createAdminClient } from "@/infrastructure/supabase/clients/admin";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /api/cron/purge — RÉTENTION DU JOURNAL D'ACTIVITÉ (§13.3 du Rapport 2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * « Rétention 180 jours, purge par le cron. » Ce Route Handler, appelé une fois
 * par jour par Vercel Cron (`vercel.json`), supprime les entrées d'`audit_logs`
 * plus anciennes que la fenêtre de rétention.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI LE CLIENT D'ADMINISTRATION
 * ---------------------------------------------------------------------------
 * `audit_logs` n'a AUCUNE politique d'`update` ni de `delete` (migration 0009) :
 * personne, pas même un super administrateur, ne peut effacer une trace depuis
 * l'application. La purge de rétention est la seule exception, et elle passe
 * donc par `service_role`.
 *
 * ⚠️  C'est un usage de `createAdminClient` qui s'AJOUTE aux cinq déjà recensés
 * (invitation, suppression de compte, écriture du journal, seed, limitation de
 * débit). Il est de la même nature que l'écriture du journal — maintenance d'une
 * table que l'application ne peut pas toucher avec les droits d'un utilisateur —
 * et strictement borné à ce fichier. Consigné dans `clients/admin.ts` et dans
 * `docs/REPRISE-CONTEXTE.md`.
 *
 * ---------------------------------------------------------------------------
 * AUTHENTIFICATION — identique à `/api/cron/publish`
 * ---------------------------------------------------------------------------
 * `Authorization: Bearer <CRON_SECRET>`. Sans variable configurée : 500 (fail
 * closed). Une route qui supprime des lignes ne s'ouvre pas par défaut.
 */
export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return Response.json(
      { erreur: "CRON_SECRET n'est pas configuré." },
      { status: 500 },
    );
  }

  const entete = request.headers.get("authorization");
  if (entete !== `Bearer ${secret}`) {
    return new Response("Non autorisé", { status: 401 });
  }

  const seuil = new Date(
    Date.now() - AUDIT_RETENTION_DAYS * 24 * 3_600_000,
  ).toISOString();

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .delete()
    .lt("created_at", seuil)
    .select("id");

  if (error) {
    return Response.json(
      { erreur: "La purge du journal a échoué." },
      { status: 500 },
    );
  }

  return Response.json({
    ran: new Date().toISOString(),
    retentionDays: AUDIT_RETENTION_DAYS,
    olderThan: seuil,
    deleted: (data ?? []).length,
  });
}
