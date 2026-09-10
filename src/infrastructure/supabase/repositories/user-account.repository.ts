import type { SupabaseClient } from "@supabase/supabase-js";

import type { UserAccount } from "@/core/cms/entities/user-account";
import type {
  UserAccountReadPort,
  UserAccountWritePort,
} from "@/core/cms/ports/user-account.port";
import type { UserRole } from "@/core/rbac/roles";
import { AppError } from "@/core/shared/errors";
import { siteUrl } from "@/lib/site-config";

import type { Database } from "../database.types";
import { mapPostgrestError, requireOneRow } from "../errors";
import { toUserAccount } from "../mappers/user-account.mapper";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  DÉPÔT SUPABASE DE L'ANNUAIRE DES COMPTES (§13.1)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * DEUX clients, et c'est structurel :
 *
 *   • `session` — le client de la requête, soumis à la RLS. Il lit l'annuaire
 *     (`profiles_admin_read`) et écrit rôle et état (`profiles_super_admin_
 *     update`). C'est lui qui déclenche `guard_last_super_admin` et en reçoit
 *     le message intact via PostgREST.
 *
 *   • `admin` — `service_role`, contourne la RLS. STRICTEMENT limité aux deux
 *     opérations qui touchent `auth.users` et n'ont pas d'API RLS : inviter
 *     (`auth.admin.inviteUserByEmail`) et supprimer (`auth.admin.deleteUser`).
 *     Ce sont les usages nº 1 et nº 2 de la liste de `clients/admin.ts`.
 */
export class SupabaseUserAccountRepository
  implements UserAccountReadPort, UserAccountWritePort
{
  constructor(
    private readonly session: SupabaseClient<Database>,
    private readonly admin: SupabaseClient<Database>,
  ) {}

  // ═══════════════════════════════════════════════════════════════ Lecture ══

  async list(): Promise<UserAccount[]> {
    const { data, error } = await this.session
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw mapPostgrestError(error, { ressource: "compte" });
    return (data ?? []).map(toUserAccount);
  }

  async findById(id: string): Promise<UserAccount | null> {
    const { data, error } = await this.session
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw mapPostgrestError(error, { ressource: "compte" });
    return data ? toUserAccount(data) : null;
  }

  async countActiveSuperAdmins(): Promise<number> {
    const { count, error } = await this.session
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "super_admin")
      .eq("is_active", true);

    if (error) throw mapPostgrestError(error, { ressource: "compte" });
    return count ?? 0;
  }

  // ═══════════════════════════════════════════════════════════════ Écriture ═

  /**
   * Invite une adresse, puis inscrit le rôle choisi.
   *
   * `inviteUserByEmail` insère la ligne `auth.users` ; le trigger
   * `handle_new_user` crée aussitôt le `profiles` correspondant avec le rôle
   * `editor` par défaut et le `full_name` tiré des métadonnées. On repasse
   * derrière pour poser le rôle demandé.
   */
  async invite(input: {
    email: string;
    fullName: string;
    role: UserRole;
  }): Promise<UserAccount> {
    const { data, error } = await this.admin.auth.admin.inviteUserByEmail(
      input.email,
      {
        data: { full_name: input.fullName },
        redirectTo: `${siteUrl}/reinitialiser-mot-de-passe`,
      },
    );

    if (error || !data.user) {
      const message = error?.message ?? "";
      if (/already.*registered|already been registered|email.*exists/i.test(message)) {
        throw new AppError(
          "CONFLICT",
          "Un compte existe déjà pour cette adresse e-mail.",
          { email: "Adresse déjà utilisée." },
        );
      }
      throw new AppError(
        "UNEXPECTED",
        "L'invitation n'a pas pu être envoyée. Vérifiez l'adresse et réessayez.",
        undefined,
        error,
      );
    }

    const { data: profil, error: erreurProfil } = await this.admin
      .from("profiles")
      .update({ role: input.role, full_name: input.fullName })
      .eq("id", data.user.id)
      .select("*")
      .single();

    if (erreurProfil || !profil) {
      throw new AppError(
        "UNEXPECTED",
        "Le compte a été invité mais son rôle n'a pas pu être enregistré. Corrigez-le depuis la liste.",
        undefined,
        erreurProfil,
      );
    }

    return toUserAccount(profil);
  }

  async setRole(id: string, role: UserRole): Promise<UserAccount> {
    const { data, error } = await this.session
      .from("profiles")
      .update({ role })
      .eq("id", id)
      .select("*")
      .maybeSingle();

    // ADB02 (dernier super administrateur) arrive ici avec son message français
    // intact — `mapPostgrestError` le transmet tel quel.
    if (error) throw mapPostgrestError(error, { ressource: "compte" });

    const refus = requireOneRow(data ? [data] : [], {
      ressource: "compte",
      action: "modifier",
    });
    if (refus || !data) {
      throw refus ?? new AppError("FORBIDDEN", "Ce compte n'a pas pu être modifié.");
    }

    return toUserAccount(data);
  }

  async setActive(id: string, isActive: boolean): Promise<UserAccount> {
    const { data, error } = await this.session
      .from("profiles")
      .update({ is_active: isActive })
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) throw mapPostgrestError(error, { ressource: "compte" });

    const refus = requireOneRow(data ? [data] : [], {
      ressource: "compte",
      action: "modifier",
    });
    if (refus || !data) {
      throw refus ?? new AppError("FORBIDDEN", "Ce compte n'a pas pu être modifié.");
    }

    return toUserAccount(data);
  }

  /**
   * Supprime le compte, identité comprise.
   *
   * `deleteUser` cascade sur `profiles` (`on delete cascade`). Le trigger
   * `guard_last_super_admin` s'y applique aussi — mais GoTrue en avale le
   * message et renvoie un « 500 Database error » opaque (constat du Lot 1). Le
   * cas d'usage a donc DÉJÀ vérifié le dernier super administrateur avant
   * d'arriver ici ; une erreur à ce stade est soit une course, soit une panne.
   */
  async remove(id: string): Promise<void> {
    const { error } = await this.admin.auth.admin.deleteUser(id);

    if (error) {
      console.error("[ADEBES] Échec de auth.admin.deleteUser", error);
      throw new AppError(
        "CONFLICT",
        "La suppression a échoué. Si ce compte est le dernier super administrateur actif, nommez-en un autre d'abord.",
        undefined,
        error,
      );
    }
  }
}
