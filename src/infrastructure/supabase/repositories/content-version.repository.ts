import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ContentVersion,
  CreateContentVersion,
  VersionedEntityType,
} from "@/core/cms/entities/content-version";
import type {
  ContentVersionReadPort,
  ContentVersionWritePort,
} from "@/core/cms/ports/content-version.port";
import { AppError } from "@/core/shared/errors";

import type { Database } from "../database.types";
import { mapPostgrestError } from "../errors";
import {
  toContentVersion,
  toContentVersionInsert,
} from "../mappers/content-version.mapper";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  DÉPÔT SUPABASE DE L'HISTORIQUE DE CONTENU (§12.2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Reçoit son client par injection. Les politiques RLS de `content_versions`
 * (migration 0009) : lecture et insertion pour tout le personnel
 * (`app_is_staff()`), suppression pour les administrateurs
 * (`app_can_publish()`). La purge de rétention passe donc par un client
 * autorisé à publier — ce qui est le cas dès qu'on vient de publier.
 */
export class SupabaseContentVersionRepository
  implements ContentVersionReadPort, ContentVersionWritePort
{
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  // ═══════════════════════════════════════════════════════════════ Lecture ══

  async listForEntity(
    entityType: VersionedEntityType,
    entityId: string,
  ): Promise<ContentVersion[]> {
    const { data, error } = await this.supabase
      .from("content_versions")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("version_number", { ascending: false });

    if (error) throw mapPostgrestError(error, { ressource: "version" });
    return (data ?? []).map(toContentVersion);
  }

  async findById(id: string): Promise<ContentVersion | null> {
    const { data, error } = await this.supabase
      .from("content_versions")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw mapPostgrestError(error, { ressource: "version" });
    return data ? toContentVersion(data) : null;
  }

  // ═══════════════════════════════════════════════════════════════ Écriture ═

  /**
   * ⚠️  LE NUMÉRO DE VERSION EST CALCULÉ ICI, DANS LA MÊME OPÉRATION.
   *
   * Lire le dernier numéro puis insérer laisse une fenêtre entre les deux :
   * deux publications rapprochées calculeraient le même « dernier + 1 », et la
   * contrainte d'unicité `(entity_type, entity_id, version_number)` ferait
   * échouer la seconde. La fenêtre est étroite mais réelle ; on la referme en
   * réessayant une fois sur collision, plutôt qu'en verrouillant la table.
   */
  async record(input: CreateContentVersion): Promise<ContentVersion> {
    for (let tentative = 0; tentative < 3; tentative++) {
      const numero = (await this.dernierNumero(input.entityType, input.entityId)) + 1;

      const { data, error } = await this.supabase
        .from("content_versions")
        .insert(toContentVersionInsert({ ...input, versionNumber: numero }))
        .select()
        .maybeSingle();

      if (!error && data) return toContentVersion(data);

      // 23505 = violation d'unicité : un autre instantané a pris ce numéro
      // entre-temps. On recalcule et on retente.
      if (error && error.code === "23505" && tentative < 2) continue;
      if (error) throw mapPostgrestError(error, { ressource: "version" });
    }

    throw new AppError(
      "UNEXPECTED",
      "L'instantané de version n'a pas pu être enregistré. Réessayez dans un instant.",
    );
  }

  /**
   * Ne garde que les `keep` versions les plus récentes, supprime le reste.
   *
   * Deux requêtes : d'abord les numéros à conserver, puis une suppression de
   * tout ce qui est strictement en dessous du plus petit d'entre eux. Une
   * suppression par `not in (...)` sur des identifiants serait plus fragile sur
   * un grand historique — ici, `version_number` est monotone, un seuil suffit.
   */
  async pruneToLast(
    entityType: VersionedEntityType,
    entityId: string,
    keep: number,
  ): Promise<number> {
    const { data, error } = await this.supabase
      .from("content_versions")
      .select("version_number")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("version_number", { ascending: false })
      .limit(keep);

    if (error) throw mapPostgrestError(error, { ressource: "version" });

    const numeros = data ?? [];
    if (numeros.length < keep) return 0;

    const seuil = numeros[numeros.length - 1].version_number;

    const { data: supprimees, error: erreurSuppression } = await this.supabase
      .from("content_versions")
      .delete()
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .lt("version_number", seuil)
      .select("id");

    if (erreurSuppression) {
      throw mapPostgrestError(erreurSuppression, { ressource: "version" });
    }
    return (supprimees ?? []).length;
  }

  /** Le plus grand numéro de version d'une entité, ou 0 si l'historique est vide. */
  private async dernierNumero(
    entityType: VersionedEntityType,
    entityId: string,
  ): Promise<number> {
    const { data, error } = await this.supabase
      .from("content_versions")
      .select("version_number")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw mapPostgrestError(error, { ressource: "version" });
    return data?.version_number ?? 0;
  }
}
