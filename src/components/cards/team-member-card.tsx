import { CmsImage } from "@/components/media/cms-image";
import { MediaPlaceholder } from "@/components/media/media-placeholder";
import type { MediaAsset } from "@/core/cms/entities/media-asset";
import type { TeamMember } from "@/core/cms/entities/team-member";
import { cn } from "@/lib/utils";

/**
 * Carte d'un membre de l'équipe.
 *
 * Le JSX était écrit à même `src/app/(site)/a-propos/page.tsx` avant le Lot
 * 8D. Il en est extrait pour la même raison que la carte de témoignage au Lot
 * 8C : la résolution d'un média a des règles — `alt` fait autorité, l'absence
 * a un rendu prévu — et les laisser dans une page les rend invisibles à la
 * relecture.
 *
 * ---------------------------------------------------------------------------
 * CE QUI A CHANGÉ AU LOT 8D
 * ---------------------------------------------------------------------------
 *   * le `TeamMember` reçu est celui du DOMAINE
 *     (`core/cms/entities/team-member`), plus le type `MembreEquipe` de
 *     `src/content/` ;
 *   * la photo vient d'un identifiant de média, résolu par la page ;
 *   * le badge « Nom et photo à fournir » DISPARAÎT — voir plus bas.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LE BADGE « NOM ET PHOTO À FOURNIR » N'EST PAS REMPLACÉ
 * ---------------------------------------------------------------------------
 * `team_members` n'a pas de colonne équivalente à `articles.is_placeholder`
 * (migration 0005), et contrairement au Lot 8C — où les trois témoignages
 * portaient `placeholder: false` et où le badge n'était donc rendu nulle
 * part — les trois fiches d'équipe portaient `placeholder: true` : le badge
 * ÉTAIT affiché sur `/a-propos`.
 *
 * Il n'est pas réintroduit, et ce n'est pas un renoncement. Une carte ne peut
 * plus atteindre cette page en portant un gabarit : `setTeamMemberStatus`
 * refuse de publier une fiche dont le nom est resté « [À COMPLÉTER] », et
 * `updateTeamMember` refuse de l'y remettre sur une fiche en ligne. Le badge
 * n'aurait donc jamais de sujet — il resterait dans le code comme la trace
 * d'un état devenu impossible, et la première personne à le relire croirait
 * qu'il peut s'afficher.
 *
 * L'avertissement qu'il portait n'a pas disparu pour autant : il a changé de
 * destinataire. Il s'adressait aux VISITEURS de la page ; il s'adresse
 * désormais à qui peut agir, en tête de `/dashboard/equipe`.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  PAS DE REPLI SUR `/public`, COMME AU LOT 8C
 * ---------------------------------------------------------------------------
 * `membrePhoto(id)` suivait `equipe-<id>.jpeg` où `<id>` est l'identifiant du
 * TABLEAU TypeScript (« direction », « programmes », « terrain »). Cet
 * identifiant n'existe plus : en base, c'est un UUID. Et aucune colonne de
 * `team_members` ne peut le remplacer — `position` change à chaque
 * réordonnancement, `name` vaut « [À COMPLÉTER] » sur les trois lignes.
 *
 * Les trois fichiers restent dans `public/images/a-propos/`. Pour les
 * réutiliser : les téléverser dans `/dashboard/mediatheque`, puis les choisir
 * dans le champ « Photo » de chaque fiche.
 */
export function TeamMemberCard({
  membre,
  photo,
  className,
}: {
  membre: TeamMember;
  /**
   * Le portrait déjà résolu par la page.
   *
   * Résolu en amont et non ici : une carte qui va chercher son média
   * produirait une requête par carte.
   */
  photo?: MediaAsset | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card",
        className,
      )}
    >
      <div className="relative aspect-[4/3] bg-muted">
        {photo ? (
          /*
            Pas de prop `alt` : `media_assets.alt_text` fait autorité, et il est
            saisi par la personne qui connaît la photo. C'est le contrat de
            `<CmsImage>`, où la surcharge est réservée au seul cas légitime —
            neutraliser une image décorative par `alt=""`. Un portrait ne l'est
            pas.
          */
          <CmsImage
            asset={photo}
            fill
            tone="neutral"
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
          />
        ) : (
          <MediaPlaceholder
            kind="portrait"
            tone="neutral"
            label={`Portrait de ${membre.name}`}
            className="absolute inset-0"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="font-heading text-base font-semibold text-foreground">
          {membre.name}
        </p>
        <p className="text-sm font-medium text-primary">{membre.role}</p>
        {membre.bio ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {membre.bio}
          </p>
        ) : null}
      </div>
    </div>
  );
}
