"use client";

import { CircleAlert, Loader2, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { FieldDescriptor } from "@/core/cms/blocks/types";
import {
  estImage,
  type MediaAsset,
  type MediaUsage,
} from "@/core/cms/entities/media-asset";
import {
  mediaFicheSchema,
  type MediaFicheInput,
} from "@/core/cms/schemas/media.schema";
import { useIsDesktop } from "@/hooks/use-breakpoint";
import { formaterDimensions, formaterPoids, urlMedia } from "@/lib/media-url";
import {
  listerUsagesMediaAction,
  mettreAJourMediaAction,
  supprimerMediaAction,
} from "@/server/actions/media.actions";

import { SchemaForm } from "../forms/schema-form";
import { ConfirmDialog } from "../modals/confirm-dialog";
import { MediaThumbnail } from "./media-thumbnail";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LA FICHE D'UN MÉDIA
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §7.1 du Rapport 2 : « Panneau latéral de détail : aperçu, dimensions, poids,
 * date, auteur, texte alternatif éditable, légende, liste des usages,
 * suppression. »
 *
 * ---------------------------------------------------------------------------
 * `Sheet` PLEIN ÉCRAN SOUS 1024 px, PANNEAU LATÉRAL AU-DELÀ
 * ---------------------------------------------------------------------------
 * « Le téléphone n'a pas la place d'afficher grille et détail côte à côte »
 * (§7.1). C'est un REMPLACEMENT de composant, donc le seul cas où la règle 9
 * du §12 autorise à lire un point de rupture en JavaScript — `useIsDesktop()`,
 * le même hook que `<FormModal>`.
 *
 * ---------------------------------------------------------------------------
 * LE FORMULAIRE N'EST PAS ÉCRIT À LA MAIN
 * ---------------------------------------------------------------------------
 * Trois `FieldDescriptor` et `<SchemaForm>` : libellé associé, `role="alert"`,
 * `aria-describedby`, 44 px, `text-base` sous `md:`, barre d'enregistrement
 * collante. Tout cela est déjà recetté au Lot 6 ; le réécrire ici serait trois
 * occasions de l'oublier.
 */

const CHAMPS_FICHE: readonly FieldDescriptor[] = [
  {
    kind: "textarea",
    name: "altText",
    label: "Que montre ce fichier ?",
    required: true,
    maxLength: 200,
    rows: 3,
    hint: "Cette description est lue à la place de l'image par les personnes qui ne la voient pas. Elle sert aussi à retrouver le fichier dans la médiathèque.",
  },
  {
    kind: "text",
    name: "caption",
    label: "Légende",
    maxLength: 300,
    hint: "Facultative. Affichée sous l'image quand la page le prévoit.",
  },
  {
    kind: "text",
    name: "folder",
    label: "Dossier",
    maxLength: 60,
    hint: "Sert au rangement dans la médiathèque. Le fichier lui-même n'est pas déplacé.",
  },
];

/** Les champs du formulaire, pour rattacher une erreur serveur au bon endroit. */
const CLES_FICHE = ["altText", "caption", "folder"] as const satisfies readonly (keyof MediaFicheInput)[];

export function MediaDetail({
  media,
  actorId,
  peutModifier,
  peutSupprimer,
  onFermer,
  onModifie,
  onSupprime,
}: {
  media: MediaAsset;
  /** Identifiant de l'utilisateur connecté — voir « auteur » plus bas. */
  actorId: string | null;
  peutModifier: boolean;
  peutSupprimer: boolean;
  onFermer: () => void;
  onModifie: (media: MediaAsset) => void;
  onSupprime: (id: string) => void;
}) {
  const surBureau = useIsDesktop();

  /*
    `key` sur l'identifiant : passer d'un fichier à l'autre REMONTE la fiche.

    Sans elle, il faudrait remettre à zéro les usages, le message d'erreur et
    l'état de chargement depuis un effet — ce que la règle
    `react-hooks/set-state-in-effect` du compilateur React refuse, à juste
    titre : il existerait un rendu pendant lequel la fiche affiche le nouveau
    fichier avec les usages de l'ancien. Le remontage rend cet instant
    impossible.
  */
  const contenu = (
    <MediaDetailContenu
      key={media.id}
      media={media}
      actorId={actorId}
      peutModifier={peutModifier}
      peutSupprimer={peutSupprimer}
      onFermer={onFermer}
      onModifie={onModifie}
      onSupprime={onSupprime}
    />
  );

  /* ---------------------------------------------------------------------- */
  /* ≥ 1024 px — panneau latéral, collé en haut de la zone de contenu        */
  /* ---------------------------------------------------------------------- */
  if (surBureau) {
    return (
      <aside
        aria-label={`Fiche du fichier ${media.filename}`}
        /*
          `sticky top-4` plutôt qu'une hauteur fixe : le panneau suit le
          défilement de la grille sans jamais imposer sa propre barre de
          défilement au-delà de la fenêtre. `max-h` en `dvh` — jamais `vh`
          (règle 5 du §12).
        */
        className="sticky top-4 flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-y-auto rounded-xl border border-border bg-card"
      >
        {contenu}
      </aside>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* < 1024 px — `Sheet` plein écran                                         */
  /* ---------------------------------------------------------------------- */
  return (
    <Sheet
      open
      onOpenChange={(ouvert) => {
        if (!ouvert) onFermer();
      }}
    >
      <SheetContent
        side="bottom"
        showCloseButton={false}
        // `h-dvh` et non `h-screen` : la barre d'adresse mobile amputerait le
        // bas du panneau, donc le bouton de suppression.
        className="flex flex-col gap-0 rounded-none p-0 data-[side=bottom]:h-dvh"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Fiche du fichier {media.filename}</SheetTitle>
          <SheetDescription>
            Description, légende, rangement et usages de ce fichier.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {contenu}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Contenu commun aux deux formes
 * ═══════════════════════════════════════════════════════════════════════════ */

function MediaDetailContenu({
  media,
  actorId,
  peutModifier,
  peutSupprimer,
  onFermer,
  onModifie,
  onSupprime,
}: {
  media: MediaAsset;
  actorId: string | null;
  peutModifier: boolean;
  peutSupprimer: boolean;
  onFermer: () => void;
  onModifie: (media: MediaAsset) => void;
  onSupprime: (id: string) => void;
}) {
  const [usages, setUsages] = useState<MediaUsage[] | null>(null);
  const [usagesEnCours, setUsagesEnCours] = useState(true);
  const [confirmation, setConfirmation] = useState(false);
  const [erreurSuppression, setErreurSuppression] = useState<string | null>(null);

  /*
    Les usages sont chargés à l'ouverture de la fiche, pas au clic sur
    « Supprimer » : le §7 veut que l'utilisateur VOIE où le fichier est employé
    avant de décider, pas qu'il découvre la liste dans une confirmation.

    L'effet n'écrit RIEN de synchrone : l'état de départ est celui de
    `useState`, et le composant est remonté à chaque changement de fichier
    (voir la `key` posée par `MediaDetail`). Seule la réponse déclenche un
    `setState`, hors du corps de l'effet.
  */
  useEffect(() => {
    let abandonne = false;

    void listerUsagesMediaAction({ id: media.id }).then((resultat) => {
      if (abandonne) return;
      setUsages(resultat.ok ? resultat.data : null);
      setUsagesEnCours(false);
    });

    return () => {
      abandonne = true;
    };
  }, [media.id]);

  const bloquants = usages?.filter((usage) => usage.blocking) ?? [];
  const url = urlMedia(media);

  return (
    <div className="flex flex-col">
      {/* ---------------------------------------------------------------- */}
      {/* En-tête                                                           */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-heading text-sm font-semibold text-foreground">
            {media.filename}
          </p>
          <p className="text-xs text-muted-foreground">
            {typeLisible(media.mimeType)} · {formaterPoids(media.sizeBytes)}
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="-mr-1 shrink-0"
          aria-label="Fermer la fiche"
          onClick={onFermer}
        >
          <X className="size-5" aria-hidden="true" />
        </Button>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Aperçu                                                            */}
      {/* ---------------------------------------------------------------- */}
      <div className="border-b border-border p-4">
        <MediaThumbnail
          asset={media}
          sizes="(max-width: 1023px) 100vw, 24rem"
          className="rounded-lg"
        />

        {url ? (
          <p className="mt-2">
            {/*
              Lien vers le fichier d'origine, pour vérifier ce qu'on regarde.
              `rel="noreferrer"` : l'URL de la médiathèque n'a pas à voyager
              vers le domaine Supabase en en-tête `Referer`.
            */}
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-primary underline underline-offset-2"
            >
              Ouvrir le fichier d&apos;origine
            </a>
          </p>
        ) : null}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Métadonnées                                                       */}
      {/* ---------------------------------------------------------------- */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-border px-4 py-4 text-sm">
        <Metadonnee libelle="Dimensions" valeur={formaterDimensions(media)} />
        <Metadonnee libelle="Poids" valeur={formaterPoids(media.sizeBytes)} />
        <Metadonnee libelle="Ajouté le" valeur={formaterDate(media.createdAt)} />
        <Metadonnee libelle="Ajouté par" valeur={auteur(media, actorId)} />
        <Metadonnee libelle="Dossier" valeur={media.folder} />
        <Metadonnee libelle="Type" valeur={typeLisible(media.mimeType)} />
      </dl>

      {/* ---------------------------------------------------------------- */}
      {/* Fiche éditable                                                    */}
      {/* ---------------------------------------------------------------- */}
      <div className="border-b border-border px-4 py-4">
        {peutModifier ? (
          <SchemaForm<MediaFicheInput>
            /*
              `key` sur l'identifiant : changer de média dans la grille doit
              REMPLACER le formulaire, pas le réutiliser. Sans cette clé,
              react-hook-form garde les valeurs du média précédent —
              `defaultValues` n'est lu qu'au montage.
            */
            key={media.id}
            fields={CHAMPS_FICHE}
            schema={mediaFicheSchema}
            defaultValues={{
              altText: media.altText,
              caption: media.caption,
              folder: media.folder,
            }}
            columns={1}
            submitLabel="Enregistrer les modifications"
            onSubmit={async (valeurs, outils) => {
              const resultat = await mettreAJourMediaAction({
                id: media.id,
                ...valeurs,
              });

              if (resultat.ok) {
                onModifie(resultat.data);
                return;
              }

              // Erreur de champ → sous le champ ; erreur générale → bandeau.
              //
              // Les clés sont parcourues depuis la liste connue plutôt que
              // depuis la réponse : `setError` attend un chemin du formulaire,
              // et une clé venue du serveur n'en est pas un tant qu'on ne l'a
              // pas vérifiée. Boucler sur les trois champs réels évite la
              // conversion de type qu'exigerait l'inverse.
              for (const cle of CLES_FICHE) {
                const message = resultat.fieldErrors?.[cle];
                if (message) outils.setError(cle, { message });
              }

              return resultat.message;
            }}
          />
        ) : (
          <div className="space-y-3">
            <ChampLecture libelle="Description" valeur={media.altText} />
            <ChampLecture libelle="Légende" valeur={media.caption} />
            {/*
              Dire POURQUOI c'est en lecture seule. Un formulaire grisé sans
              explication passe pour une panne (§12).
            */}
            <p className="text-xs text-muted-foreground">
              Seul un administrateur peut corriger la fiche d&apos;un fichier.
            </p>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Usages                                                            */}
      {/* ---------------------------------------------------------------- */}
      <div className="px-4 py-4">
        <h3 className="font-heading text-sm font-semibold text-foreground">
          Où ce fichier est-il utilisé ?
        </h3>

        <div aria-live="polite" className="mt-2">
          {usagesEnCours ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Recherche des usages…
            </p>
          ) : usages === null ? (
            <p className="text-sm text-muted-foreground">
              La liste des usages n&apos;a pas pu être établie. Réessayez en
              rouvrant cette fiche.
            </p>
          ) : usages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun usage connu pour l&apos;instant.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {usages.map((usage) => (
                <li
                  key={`${usage.resource}-${usage.id}-${usage.field}`}
                  className="rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span className="font-medium text-foreground">
                    {usage.resource} « {usage.label} »
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {usage.field}
                    {usage.blocking
                      ? " — à retirer avant de pouvoir supprimer ce fichier"
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/*
          Ce que la liste NE COUVRE PAS est dit explicitement.
          `page_sections.content` est du JSONB dont la forme dépend du registre
          de blocs, livré au Lot 9. Laisser croire à une liste exhaustive serait
          l'inverse de l'invariant nº 1 : une absence présentée comme une
          certitude.
        */}
        {!usagesEnCours && usages !== null ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Les sections de pages composées ne sont pas encore analysées : cette
            liste couvre les collections (programmes, actualités, équipe,
            témoignages, galerie, documents) et les réglages de page.
          </p>
        ) : null}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Suppression                                                       */}
      {/* ---------------------------------------------------------------- */}
      {peutSupprimer ? (
        <div className="border-t border-border px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {erreurSuppression ? (
            <p
              role="alert"
              className="mb-3 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {erreurSuppression}
            </p>
          ) : null}

          <Button
            type="button"
            variant="destructive"
            className="w-full"
            disabled={usagesEnCours || bloquants.length > 0}
            onClick={() => setConfirmation(true)}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Supprimer ce fichier
          </Button>

          {/* Le motif de la désactivation, jamais un bouton gris muet. */}
          {bloquants.length > 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Ce fichier est utilisé à {bloquants.length} endroit
              {bloquants.length > 1 ? "s" : ""} qui ne peu
              {bloquants.length > 1 ? "vent" : "t"} pas s&apos;en passer.
              Retirez-le d&apos;abord de la liste ci-dessus.
            </p>
          ) : null}

          <ConfirmDialog
            open={confirmation}
            onOpenChange={setConfirmation}
            title={`Supprimer « ${media.filename} » ?`}
            description={
              usages && usages.length > 0 ? (
                <>
                  Ce fichier est utilisé par {usages.length} élément
                  {usages.length > 1 ? "s" : ""} :{" "}
                  {usages
                    .map((usage) => `${usage.resource} « ${usage.label} »`)
                    .join(", ")}
                  . {usages.length > 1 ? "Ces éléments perdront" : "Cet élément perdra"}{" "}
                  {usages.length > 1 ? "leur" : "son"} illustration. Le fichier
                  est définitivement effacé.
                </>
              ) : (
                "Le fichier est définitivement effacé du stockage. Cette action est irréversible."
              )
            }
            confirmLabel="Supprimer le fichier"
            onConfirm={async () => {
              const resultat = await supprimerMediaAction({ id: media.id });

              if (resultat.ok) {
                setConfirmation(false);
                onSupprime(media.id);
                return;
              }

              setConfirmation(false);
              setErreurSuppression(resultat.message);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Petits blocs
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Une métadonnée.
 *
 * Une valeur absente s'affiche « — », JAMAIS `0` ni une chaîne vide : c'est
 * l'invariant nº 1 du projet appliqué aux fiches de fichiers. « Dimensions :
 * 0 × 0 » serait une information fausse pour un PDF.
 */
function Metadonnee({
  libelle,
  valeur,
}: {
  libelle: string;
  valeur: string | null;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{libelle}</dt>
      <dd className="truncate text-sm font-medium text-foreground">
        {valeur ?? "—"}
      </dd>
    </div>
  );
}

function ChampLecture({
  libelle,
  valeur,
}: {
  libelle: string;
  valeur: string | null;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{libelle}</p>
      <p className="text-sm text-foreground">{valeur || "—"}</p>
    </div>
  );
}

/**
 * L'auteur du téléversement.
 *
 * ---------------------------------------------------------------------------
 * ÉCART SIGNALÉ PAR RAPPORT AU §7.1 — pas de NOM, mais pas d'invention
 * ---------------------------------------------------------------------------
 * Le §7.1 demande « auteur » dans le panneau de détail. `media_assets` ne
 * stocke qu'un identifiant, et la RLS n'ouvre l'annuaire `profiles` qu'aux
 * administrateurs (politique `profiles_admin_read`) : un éditeur ne peut donc
 * PAS obtenir le nom de ses collègues, et une jointure renverrait `null` pour
 * lui sans qu'il comprenne pourquoi.
 *
 * Plutôt que d'afficher un UUID ou de fabriquer un nom, la fiche répond à la
 * question réellement utile — « est-ce moi qui l'ai déposé ? ». Les noms
 * arrivent avec l'annuaire des utilisateurs, au Lot 13, en même temps que le
 * journal d'audit qui trace déjà `media.create`.
 */
function auteur(media: MediaAsset, actorId: string | null): string | null {
  if (!media.uploadedBy) return null;
  if (actorId && media.uploadedBy === actorId) return "Vous";
  return "Un autre membre de l'équipe";
}

/** `image/svg+xml` → « SVG », `application/pdf` → « PDF ». */
function typeLisible(mimeType: string): string {
  if (mimeType === "application/pdf") return "PDF";
  if (!estImage(mimeType)) return mimeType;

  const sousType = mimeType.slice("image/".length).replace("+xml", "");
  return sousType.toUpperCase();
}

/** Format long français, cohérent avec le reste du dashboard. */
function formaterDate(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Réutilisé par la vue en liste. */
export { formaterDate as formaterDateMedia, typeLisible as typeMediaLisible };
