/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LES NOMS D'ICÔNES — la liste, sans les composants
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ---------------------------------------------------------------------------
 * POURQUOI CETTE LISTE DESCEND DANS LE DOMAINE AU LOT 8E
 * ---------------------------------------------------------------------------
 * Elle vivait entièrement dans `src/components/ui-ext/icon-registry.ts`, mêlée
 * aux composants React qu'elle nomme. Le domaine n'ayant pas le droit
 * d'importer `@/components` (règle ESLint), aucun schéma ne pouvait vérifier
 * qu'un nom d'icône EST un nom d'icône.
 *
 * La conséquence était mesurable, et elle l'a été : `programme.schema.ts`
 * valide `icon` par `z.string().min(1)`. **N'IMPORTE QUELLE CHAÎNE PASSE.**
 * Un POST direct portant `icon: "bonjour"` est accepté, écrit en base, et la
 * page publique rend l'étoile de repli sans que rien ne signale l'erreur —
 * alors que `tone`, juste à côté, est un `z.enum(MEDIA_TONES)` infranchissable.
 * La seule raison de cette asymétrie était l'étage où vivait la liste.
 *
 * C'est exactement la situation de `MediaTone` au Lot 6, et la résolution est
 * la même : **le type DESCEND dans le domaine — c'est une donnée du contenu,
 * pas une notion de rendu — et la couche présentation le ré-exporte.** Aucun
 * import existant n'est cassé, et il n'existe toujours qu'une seule liste.
 *
 * ---------------------------------------------------------------------------
 * CE FICHIER NE CONTIENT QUE DES CHAÎNES, ET C'EST TOUT SON INTÉRÊT
 * ---------------------------------------------------------------------------
 * Pas un `import` de lucide-react, pas un composant. `icon-registry.ts`
 * associe chaque nom à son composant et se déclare `Record<IconName,
 * LucideIcon>` : **ajouter un nom ici sans ajouter le composant là-bas casse la
 * compilation.** C'est ce qui rend la duplication impossible à laisser diverger,
 * là où deux listes recopiées auraient fini par se contredire en silence.
 *
 * La liste reste EXPLICITE et courte. Voir l'en-tête de `icon-registry.ts` pour
 * la raison de fond : un import dynamique par nom embarquerait le millier
 * d'icônes de la bibliothèque, ce qui se paie en secondes sur une connexion
 * mobile camerounaise.
 */

/**
 * Les 21 icônes réellement utilisées par le contenu du site, plus `Sparkles`
 * qui ne sert qu'au repli.
 *
 * ⚠️  `Sparkles` FAIT PARTIE de la liste, et c'est délibéré : elle est
 * sélectionnable dans le dashboard. L'exclure aurait produit une incohérence
 * pénible à diagnostiquer — un nom que le rendu accepte mais que la validation
 * refuse.
 */
export const ICON_NAMES = [
  "Accessibility",
  "Briefcase",
  "CalendarDays",
  "Globe",
  "GraduationCap",
  "HandHeart",
  "Handshake",
  "HardHat",
  "HeartHandshake",
  "HeartPulse",
  "Landmark",
  "Layers",
  "Leaf",
  "Lightbulb",
  "Rocket",
  "ShieldCheck",
  "Sprout",
  "Stethoscope",
  "Target",
  "TrendingUp",
  "Users",
  "Sparkles",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

/** Le nom de repli, quand la base porte une valeur devenue invalide. */
export const ICON_NAME_REPLI: IconName = "Sparkles";

export function isIconName(valeur: unknown): valeur is IconName {
  return (
    typeof valeur === "string" && (ICON_NAMES as readonly string[]).includes(valeur)
  );
}
