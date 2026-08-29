"use client";

import { Loader2, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MEDIA_ACCEPT_LABELS,
  bucketPourAccept,
  type MediaAccept,
  type MediaAsset,
} from "@/core/cms/entities/media-asset";
import { cn } from "@/lib/utils";
import { listerMediasAction } from "@/server/actions/media.actions";

import { EmptyState } from "../feedback/empty-state";
import { CHAMP } from "../forms/field-styles";
import { FormModal } from "../modals/form-modal";
import { MediaGrid } from "./media-grid";
import { MediaUploader } from "./media-uploader";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  `<MediaPicker>` — LE HUITIÈME COMPOSANT DU §12
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §7.3 du Rapport 2 : « Modale à deux onglets : Médiathèque (parcourir /
 * chercher) et Téléverser. Filtrée par `accept`. Renvoie un `mediaId`, jamais
 * une URL — la résolution en URL est faite au rendu, ce qui permet de déplacer
 * le stockage sans réécrire le contenu. »
 *
 * ---------------------------------------------------------------------------
 * LA BASCULE `Sheet` ⇄ `Dialog` N'EST PAS RÉÉCRITE
 * ---------------------------------------------------------------------------
 * Le §7.3 la décrit comme « même bascule que `<FormModal>`, même hook ». Elle
 * n'est donc pas réimplémentée : c'est `<FormModal>` lui-même qui est employé.
 * Il apporte du même coup le pied FIXE au-dessus de `env(safe-area-inset-
 * bottom)` — ce que le §7.3 exige pour que le bouton « Choisir » reste
 * atteignable au pouce — et le corps seul défilant.
 *
 * `isDirty` n'est pas transmis : parcourir une médiathèque n'est pas une
 * saisie, et demander « quitter sans enregistrer ? » à quelqu'un qui a
 * simplement regardé des vignettes serait du bruit. Le téléversement, lui,
 * porte sa propre file et ses propres messages.
 *
 * ---------------------------------------------------------------------------
 * SÉLECTION MULTIPLE — AJOUTÉE AU LOT 8A
 * ---------------------------------------------------------------------------
 * `galleryMediaIds` (§8A.2) attend plusieurs images. Le mode multiple ouvre la
 * modale avec la sélection COURANTE déjà cochée et renvoie la liste complète :
 * une même modale sert donc à ajouter, à retirer et à ne rien changer, au lieu
 * d'un « ajouter » qui obligerait à ressortir pour enlever une image.
 *
 * L'ORDRE est conservé par l'appelant, pas par cette modale : la grille est
 * triée par date, elle ne connaît pas l'ordre voulu dans la galerie. Voir
 * `MediaMultiField`, qui réconcilie la sélection renvoyée avec son ordre
 * existant.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `accept: "video"` — ÉTAT EXPLICITE, PAS UNE GRILLE VIDE
 * ---------------------------------------------------------------------------
 * Aucun bucket n'accepte de vidéo (migration 0011). Une grille vide laisserait
 * croire qu'aucune vidéo n'a encore été téléversée, alors qu'aucune ne PEUT
 * l'être. On le dit — c'est l'invariant nº 1 transposé : une absence ne se
 * présente jamais comme une donnée.
 */

/** Fichiers chargés par appel dans la modale. */
const TAILLE_PAGE = 36;

const DELAI_RECHERCHE = 300;

type ProprietesCommunes = {
  open: boolean;
  onOpenChange: (ouvert: boolean) => void;
  accept: MediaAccept;
  peutTeleverser?: boolean;
};

/**
 * Deux modes, deux formes de valeur.
 *
 * Le drapeau `multiple` discrimine l'union : TypeScript garantit qu'un champ
 * simple ne reçoit jamais un tableau, et qu'un champ multiple ne reçoit jamais
 * `null`. Même contrat que le `FieldDescriptor` correspondant.
 */
type ProprietesSimple = ProprietesCommunes & {
  multiple?: false;
  /** Identifiant actuellement choisi, ou `null`. */
  valeur: string | null;
  /** Reçoit un identifiant de média, JAMAIS une URL. */
  onChoisir: (mediaId: string | null) => void;
};

type ProprietesMultiple = ProprietesCommunes & {
  multiple: true;
  /** Identifiants actuellement retenus, dans l'ordre de l'appelant. */
  valeur: readonly string[];
  /** Reçoit la sélection COMPLÈTE, jamais un ajout isolé. */
  onChoisir: (mediaIds: string[]) => void;
  /** Borne haute — au-delà, la sélection supplémentaire est refusée. */
  max?: number;
};

export function MediaPicker(proprietes: ProprietesSimple | ProprietesMultiple) {
  const {
    open,
    onOpenChange,
    accept,
    valeur,
    onChoisir,
    peutTeleverser = true,
  } = proprietes;

  const multiple = proprietes.multiple === true;
  const max = proprietes.multiple === true ? proprietes.max : undefined;

  const libelles = MEDIA_ACCEPT_LABELS[accept];
  const bucket = bucketPourAccept(accept);

  const [onglet, setOnglet] = useState<"mediatheque" | "televerser">("mediatheque");
  const [recherche, setRecherche] = useState("");
  const [medias, setMedias] = useState<MediaAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  /** Sélection en cours, dans l'ordre où elle a été construite. */
  const [choisis, setChoisis] = useState<string[]>(() => valeurInitiale(valeur));

  // La sélection repart de la valeur du champ à chaque ouverture : rouvrir la
  // modale après avoir annulé ne doit pas réafficher le choix abandonné.
  const dejaOuvert = useRef(false);

  useEffect(() => {
    if (open && !dejaOuvert.current) {
      dejaOuvert.current = true;
      setChoisis(valeurInitiale(valeur));
      setOnglet("mediatheque");
      setRecherche("");
    }
    if (!open) dejaOuvert.current = false;
  }, [open, valeur]);

  const charger = useCallback(async () => {
    if (!bucket) return;

    setChargement(true);
    setErreur(null);

    const resultat = await listerMediasAction({
      search: recherche.trim() || undefined,
      kind: bucket === "documents" ? "document" : "image",
      page: 1,
      pageSize: TAILLE_PAGE,
    });

    setChargement(false);

    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }

    setMedias(resultat.data.items);
    setTotal(resultat.data.total);
  }, [bucket, recherche]);

  useEffect(() => {
    if (!open || !bucket) return;

    const minuterie = setTimeout(() => void charger(), DELAI_RECHERCHE);
    return () => clearTimeout(minuterie);
  }, [bucket, charger, open]);

  /** Coche ou décoche un fichier, selon le mode. */
  function basculer(mediaId: string) {
    setChoisis((actuels) => {
      if (!multiple) {
        // Re-cliquer sur l'élément déjà choisi le désélectionne : sans cela, un
        // champ facultatif devient impossible à vider une fois rempli (même
        // règle que `ReferenceField`).
        return actuels[0] === mediaId ? [] : [mediaId];
      }

      if (actuels.includes(mediaId)) {
        return actuels.filter((id) => id !== mediaId);
      }

      // La borne est signalée, pas contournée en silence : un clic sans effet
      // et sans explication passe pour une panne.
      if (max !== undefined && actuels.length >= max) return actuels;

      return [...actuels, mediaId];
    });
  }

  const selection = new Set(choisis);
  const borneAtteinte =
    multiple && max !== undefined && choisis.length >= max;

  /* ---------------------------------------------------------------------- */
  /* Aucun bucket pour ce type de champ                                      */
  /* ---------------------------------------------------------------------- */
  if (!bucket) {
    return (
      <FormModal
        open={open}
        onOpenChange={onOpenChange}
        title={`Choisir une ${libelles.singulier}`}
        footer={
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        }
      >
        <EmptyState
          title="Les vidéos ne sont pas hébergées ici"
          description="La médiathèque accepte les images et les documents PDF. Une vidéo s'intègre à une page par son adresse (YouTube, Vimeo), sans être téléversée."
        />
      </FormModal>
    );
  }

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={
        multiple
          ? `Choisir des ${libelles.pluriel}`
          : `Choisir ${libelles.feminin ? "une" : "un"} ${libelles.singulier}`
      }
      description={`Parcourez la médiathèque ou ajoutez ${libelles.feminin ? "un nouveau fichier" : "un nouveau document"}.`}
      footer={
        <>
          {/*
            Action primaire en PREMIER : sur téléphone, le pied empile les
            boutons et le pouce atteint le haut de la pile avant le bas
            (même convention que `<PageHeader>`).
          */}
          {multiple ? (
            <Button
              type="button"
              onClick={() => {
                (onChoisir as (ids: string[]) => void)(choisis);
                onOpenChange(false);
              }}
            >
              {choisis.length === 0
                ? "Valider (aucune image)"
                : `Valider la sélection (${choisis.length})`}
            </Button>
          ) : (
            <Button
              type="button"
              disabled={choisis.length === 0}
              onClick={() => {
                (onChoisir as (id: string | null) => void)(choisis[0] ?? null);
                onOpenChange(false);
              }}
            >
              Choisir ce fichier
            </Button>
          )}

          {!multiple && valeur ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                (onChoisir as (id: string | null) => void)(null);
                onOpenChange(false);
              }}
            >
              Retirer le fichier actuel
            </Button>
          ) : null}

          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
        </>
      }
    >
      <Tabs
        value={onglet}
        onValueChange={(valeurOnglet) =>
          setOnglet(valeurOnglet === "televerser" ? "televerser" : "mediatheque")
        }
      >
        <TabsList className="w-full">
          <TabsTrigger value="mediatheque" className="flex-1">
            Médiathèque
          </TabsTrigger>
          {peutTeleverser ? (
            <TabsTrigger value="televerser" className="flex-1">
              Téléverser
            </TabsTrigger>
          ) : null}
        </TabsList>

        {/* -------------------------------------------------------------- */}
        {/* Parcourir                                                       */}
        {/* -------------------------------------------------------------- */}
        <TabsContent value="mediatheque" className="mt-4 flex flex-col gap-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={recherche}
              onChange={(evenement) => setRecherche(evenement.target.value)}
              placeholder="Rechercher par nom ou par description…"
              aria-label="Rechercher dans la médiathèque"
              className={cn(CHAMP, "pl-9")}
            />
          </div>

          {multiple ? (
            <p aria-live="polite" className="text-xs text-muted-foreground">
              {choisis.length === 0
                ? "Aucune image sélectionnée."
                : `${choisis.length} image${choisis.length > 1 ? "s" : ""} sélectionnée${choisis.length > 1 ? "s" : ""}${max !== undefined ? ` sur ${max} possibles` : ""}.`}
              {borneAtteinte
                ? " Retirez-en une pour pouvoir en choisir une autre."
                : ""}
            </p>
          ) : null}

          <div aria-live="polite">
            {chargement ? (
              <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Chargement de la médiathèque…
              </p>
            ) : erreur ? (
              <div role="alert" className="py-6 text-center">
                <p className="text-sm font-medium text-destructive">{erreur}</p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3"
                  onClick={() => void charger()}
                >
                  Réessayer
                </Button>
              </div>
            ) : medias.length === 0 ? (
              <EmptyState
                title={
                  recherche.trim()
                    ? "Aucun résultat"
                    : `Aucun${libelles.feminin ? "e" : ""} ${libelles.singulier} dans la médiathèque`
                }
                description={
                  recherche.trim()
                    ? "Essayez un autre mot, ou téléversez un nouveau fichier."
                    : `Téléversez ${libelles.feminin ? "votre première" : "votre premier"} ${libelles.singulier} depuis l'onglet « Téléverser ».`
                }
                action={
                  peutTeleverser ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOnglet("televerser")}
                    >
                      Téléverser un fichier
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <>
                <MediaGrid
                  medias={medias}
                  onOuvrir={(media) => basculer(media.id)}
                  selection={selection}
                  libelleAction="Choisir"
                />

                {total > medias.length ? (
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    {medias.length} fichiers affichés sur {total}. Affinez la
                    recherche pour trouver les autres.
                  </p>
                ) : null}
              </>
            )}
          </div>
        </TabsContent>

        {/* -------------------------------------------------------------- */}
        {/* Téléverser                                                      */}
        {/* -------------------------------------------------------------- */}
        {peutTeleverser ? (
          <TabsContent value="televerser" className="mt-4">
            <MediaUploader
              accept={accept}
              onTermine={(crees) => {
                if (crees.length === 0) return;

                /*
                  Les fichiers tout juste téléversés sont PRÉSÉLECTIONNÉS et la
                  modale revient sur la médiathèque : ce sont presque toujours
                  ceux qu'on venait chercher. Refermer d'autorité serait pire —
                  l'utilisateur n'aurait pas vu ce qu'il a choisi.
                */
                setChoisis((actuels) => {
                  const nouveaux = crees.map((media) => media.id);
                  if (!multiple) return [nouveaux[0]!];

                  const fusion = [...actuels];
                  for (const id of nouveaux) {
                    if (fusion.includes(id)) continue;
                    if (max !== undefined && fusion.length >= max) break;
                    fusion.push(id);
                  }
                  return fusion;
                });

                setMedias((actuels) => [...crees, ...actuels]);
                setTotal((actuel) => actuel + crees.length);
                setOnglet("mediatheque");
              }}
            />
          </TabsContent>
        ) : null}
      </Tabs>
    </FormModal>
  );
}

/** Normalise la valeur d'entrée des deux modes en une liste ordonnée. */
function valeurInitiale(valeur: string | null | readonly string[]): string[] {
  if (valeur === null) return [];
  return typeof valeur === "string" ? [valeur] : [...valeur];
}
