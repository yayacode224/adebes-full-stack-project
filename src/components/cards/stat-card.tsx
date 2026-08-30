import { AnimatedCounter } from "@/components/ui-ext/animated-counter";
import { ContentIcon } from "@/components/ui-ext/content-icon";
import {
  MENTION_VALEUR_ABSENTE,
  VALEUR_ABSENTE,
  type Stat,
} from "@/core/cms/entities/stat";
import { cn } from "@/lib/utils";

/**
 * Carte de chiffre clé.
 *
 * Quand la valeur n'a pas encore été fournie par l'association (`value: null`),
 * la carte l'assume : elle affiche « — » et un libellé d'attente, plutôt qu'un
 * zéro trompeur ou un chiffre inventé.
 *
 * ---------------------------------------------------------------------------
 * CE QUI CHANGE AU LOT 8G — ET CE QUI NE CHANGE PAS
 * ---------------------------------------------------------------------------
 * La carte lisait `Stat` (`src/content/stats.ts`), dont le champ `icon` était
 * un COMPOSANT React (`icon: Users`). Elle lit maintenant les champs
 * correspondants de l'entité de domaine, où `icon` est un NOM (« Users »)
 * résolu au rendu par `<ContentIcon>` — même pont qu'aux Lots 8A et 8E.
 *
 * Le tiret et sa mention descendent dans le domaine (`VALEUR_ABSENTE`,
 * `MENTION_VALEUR_ABSENTE`) : le dashboard doit dire exactement ce que la carte
 * dit, et quatre tirets recopiés à quatre endroits finissent par devenir un
 * « N/A » quelque part.
 *
 * **Le balisage produit est identique, à l'octet près.** C'est un critère de
 * recette des lots 8x, et il est vérifiable ici parce que rien d'autre n'a
 * bougé : mêmes classes, même ordre, même `title` sur le tiret.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `stat.value === null`, JAMAIS `!stat.value`
 * ---------------------------------------------------------------------------
 * C'est l'invariant nº 1 au point où il se voit. `!stat.value` afficherait
 * « — » pour un chiffre RÉELLEMENT nul, confondant « nous n'avons pas encore ce
 * chiffre » et « ce chiffre vaut zéro » — deux affirmations différentes, dont
 * une seule est vraie à la fois.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI LA PROP N'EST PAS UN `Stat` COMPLET
 * ---------------------------------------------------------------------------
 * Un `Pick` des quatre champs réellement affichés, comme `<ValueCard>` au
 * Lot 8E. La carte n'a que faire de `id`, `key`, `position`, `isVisible`,
 * `toConfirm` ni des horodatages — et l'aperçu du formulaire de saisie
 * (`stat-form.tsx`) n'en dispose pas : il montre ce qui est en train d'être
 * tapé, pas une ligne de la base.
 *
 * ⚠️  `note` n'y est PAS non plus, et c'est délibéré : la précision est rendue
 * PAR LA PAGE `/impact`, sous la carte, pas par la carte. L'accueil affiche les
 * mêmes cartes sans les précisions. Déplacer `note` ici changerait le rendu de
 * l'accueil, ce qu'aucun lot 8x n'a le droit de faire.
 *
 * ⚠️  `toConfirm` non plus — voir l'écart nº 125 : c'est un signal interne,
 * adressé au dashboard, pas au visiteur.
 */
export type ChiffreAffichable = Pick<
  Stat,
  "label" | "value" | "suffix" | "icon"
>;

export function StatCard({
  stat,
  className,
}: {
  stat: ChiffreAffichable;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-4 py-6 text-center",
        className,
      )}
    >
      <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
        {/*
          `<ContentIcon>` plutôt que `const Icon = getIcon(...)` : la règle
          `react-hooks/static-components` refuse toute valeur de composant
          renvoyée par un APPEL pendant le rendu (écart nº 32).
        */}
        <ContentIcon name={stat.icon} className="size-5" />
      </span>

      <p className="font-heading text-3xl font-bold leading-none text-foreground sm:text-4xl">
        {stat.value === null ? (
          <span className="text-muted-foreground" title={MENTION_VALEUR_ABSENTE}>
            {VALEUR_ABSENTE}
          </span>
        ) : (
          /*
            `?? undefined` : `<AnimatedCounter>` déclare `suffix?: string`, la
            base rend `string | null`. Sans cette conversion, `null` serait
            rendu tel quel par React — c'est-à-dire rien du tout — ce qui
            marcherait par accident. Le typage explicite vaut mieux qu'une
            coïncidence.
          */
          <AnimatedCounter value={stat.value} suffix={stat.suffix ?? undefined} />
        )}
      </p>

      <p className="text-balance text-sm font-medium text-muted-foreground">
        {stat.label}
      </p>
    </div>
  );
}
