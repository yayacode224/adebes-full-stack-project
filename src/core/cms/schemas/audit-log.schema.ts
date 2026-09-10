import { z } from "zod";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SCHÉMA DES FILTRES DU JOURNAL (§13.3 du Rapport 2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Le journal est en lecture seule : ce schéma ne valide pas une mutation, il
 * assainit les paramètres d'URL de l'écran (`?auteur=…&type=…&action=…&
 * du=…&au=…`). Une valeur incohérente est ignorée, pas rejetée — un filtre
 * bancal ne doit pas casser la page, seulement ne rien filtrer.
 *
 * `catch(undefined)` sur chaque champ : `safeParse` réussit toujours, les
 * entrées illisibles retombent à « pas de filtre ».
 */
export const auditFiltersSchema = z.object({
  actorId: z.uuid().optional().catch(undefined),
  entityType: z.string().trim().min(1).max(60).optional().catch(undefined),
  action: z.string().trim().min(1).max(80).optional().catch(undefined),
  /** Bornes de période, en date simple `AAAA-MM-JJ` venue d'un `<input type="date">`. */
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .catch(undefined),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .catch(undefined),
});

export type AuditFiltersInput = z.infer<typeof auditFiltersSchema>;
