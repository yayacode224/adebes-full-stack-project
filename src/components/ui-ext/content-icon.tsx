import { ICONS, isIconName } from "./icon-registry";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  L'ICÔNE D'UN CONTENU, RENDUE DEPUIS SON NOM
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * La base stocke `icon` comme une CHAÎNE (« GraduationCap ») : une table SQL
 * ne contient pas de composant React. Ce composant fait la conversion au
 * rendu.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI CE COMPOSANT PLUTÔT QU'UN `const Icon = getIcon(...)`
 * ---------------------------------------------------------------------------
 * C'est l'écart nº 32, rencontré à nouveau au Lot 8A. La règle
 * `react-hooks/static-components` du compilateur React refuse toute valeur de
 * composant RENVOYÉE PAR UN APPEL DE FONCTION pendant le rendu :
 *
 *     const Icon = getIcon(programme.icon)   // ❌ refusé
 *     <Icon />
 *
 * Elle ne peut pas distinguer une consultation de table d'une fabrique de
 * composant — et une fabrique remonterait l'état à chaque rendu. Un accès par
 * PROPRIÉTÉ, lui, passe :
 *
 *     const Icon = ICONS[nom]                // ✅ accepté
 *
 * La règle générale, déjà écrite pour `DASHBOARD_ICONS` : **consulter une
 * table, jamais appeler une fabrique.** Elle est appliquée une fois ici plutôt
 * que répétée dans chaque écran qui affiche une icône de contenu.
 *
 * `getIcon()` reste utile là où l'on a besoin du composant sans le rendre
 * immédiatement — en dehors d'un corps de rendu.
 *
 * ---------------------------------------------------------------------------
 * LE REPLI N'EST PAS DE LA COMPLAISANCE
 * ---------------------------------------------------------------------------
 * Le nom vient de la base, donc d'une saisie humaine ou d'une migration. Un
 * nom devenu invalide — icône renommée dans une version de lucide, faute de
 * frappe — ne doit jamais produire une page blanche en production. Il produit
 * une étoile.
 */
export function ContentIcon({
  name,
  className,
}: {
  /** Nom d'icône tel qu'il est stocké en base. */
  name: string | null | undefined;
  className?: string;
}) {
  const cle = isIconName(name) ? name : "Sparkles";
  const Icon = ICONS[cle];

  // `aria-hidden` systématique : ces icônes accompagnent toujours un texte,
  // jamais elles ne le remplacent. Une icône annoncée en plus du titre qu'elle
  // illustre est du bruit pour un lecteur d'écran.
  return <Icon className={className} aria-hidden="true" />;
}
