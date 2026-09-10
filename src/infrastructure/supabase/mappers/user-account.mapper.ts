import type { UserAccount } from "@/core/cms/entities/user-account";
import { isUserRole } from "@/core/rbac/roles";

import type { Tables } from "../database.types";

/**
 * Conversion entre la ligne `profiles` et l'entité `UserAccount`.
 *
 * Le rôle traverse une frontière non typée (PostgREST renvoie une chaîne) : on
 * le valide plutôt que de le forcer. Un rôle illisible retombe sur `editor`,
 * le plus restreint — jamais une promotion silencieuse.
 */
export function toUserAccount(row: Tables<"profiles">): UserAccount {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: isUserRole(row.role) ? row.role : "editor",
    isActive: row.is_active,
    lastSeenAt: row.last_seen_at,
    avatarMediaId: row.avatar_media_id,
    createdAt: row.created_at,
  };
}
