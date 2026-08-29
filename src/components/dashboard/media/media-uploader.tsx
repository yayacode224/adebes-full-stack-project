"use client";

import {
  Camera,
  CircleAlert,
  Loader2,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";
import { useId, useRef, useState } from "react";

import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MEDIA_MIME_TYPES,
  type MediaAccept,
  type MediaAsset,
} from "@/core/cms/entities/media-asset";
import { formaterPoids } from "@/lib/media-url";
import { cn } from "@/lib/utils";
import { televerserMediaAction } from "@/server/actions/media.actions";

import { CHAMP, CHAMP_MULTILIGNE } from "../forms/field-styles";
import {
  libererApercus,
  preparerFichier,
  type FichierPrepare,
} from "./preparer-fichier";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  TÉLÉVERSEMENT
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §7.2 du Rapport 2, dont la contrainte centrale tient en une phrase :
 *
 *     « Le texte alternatif est EXIGÉ avant l'enregistrement. Le bouton reste
 *       désactivé tant qu'il est vide. »
 *
 * ---------------------------------------------------------------------------
 * POURQUOI EXIGÉ ET NON PROPOSÉ
 * ---------------------------------------------------------------------------
 * `media_assets.alt_text` est `not null`. Un champ facultatif ferait donc
 * échouer l'écriture EN BASE, après le téléversement du fichier : l'utilisateur
 * aurait attendu l'envoi de 3 Mo pour recevoir une erreur technique, et le
 * bucket garderait un orphelin. Exiger la saisie AVANT est à la fois plus
 * accessible et moins coûteux.
 *
 * Et surtout : c'est la seule occasion de l'obtenir. Personne ne revient
 * décrire quarante images une par une. Le site respecte WCAG 1.1.1
 * aujourd'hui ; c'est ici que ça se joue pour demain.
 *
 * ---------------------------------------------------------------------------
 * « PRENDRE UNE PHOTO » (§7.3)
 * ---------------------------------------------------------------------------
 * `capture="environment"` sur un second `<input type="file">`. C'est le geste
 * naturel de quelqu'un qui publie depuis le terrain, et cela ne coûte qu'un
 * attribut. L'entrée n'apparaît que pour les images : capturer un PDF n'a pas
 * de sens.
 *
 * ---------------------------------------------------------------------------
 * LES ENVOIS SONT SÉQUENTIELS
 * ---------------------------------------------------------------------------
 * Douze `Promise.all` sur une connexion mobile saturent le lien, font expirer
 * les requêtes et ne rapportent rien : la bande passante montante est le
 * goulot, pas le parallélisme. Un fichier après l'autre permet en prime
 * d'annoncer « 3 sur 12 » — un envoi silencieux de deux minutes passe pour un
 * blocage.
 */
export function MediaUploader({
  accept,
  dossierParDefaut = "",
  onTermine,
  className,
}: {
  /** Restreint la sélection. `undefined` = images et documents. */
  accept?: MediaAccept;
  dossierParDefaut?: string;
  /** Appelé avec les médias réellement créés, dans l'ordre d'envoi. */
  onTermine?: (medias: MediaAsset[]) => void;
  className?: string;
}) {
  const idBase = useId();
  const entreeFichiers = useRef<HTMLInputElement>(null);
  const entreePhoto = useRef<HTMLInputElement>(null);

  const [fichiers, setFichiers] = useState<FichierPrepare[]>([]);
  const [textes, setTextes] = useState<Record<string, string>>({});
  const [legendes, setLegendes] = useState<Record<string, string>>({});
  const [dossier, setDossier] = useState(dossierParDefaut);
  const [survol, setSurvol] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [progression, setProgression] = useState<{ fait: number; total: number } | null>(
    null,
  );
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [preparation, setPreparation] = useState(false);

  const acceptHtml = attributAccept(accept);

  const retenus = fichiers.filter((prepare) => !prepare.refus);

  /*
    La condition exacte du §7.2 : le bouton reste désactivé tant qu'UN SEUL
    texte alternatif est vide. Pas « la plupart », pas « le premier ».
  */
  const tousDecrits =
    retenus.length > 0 &&
    retenus.every((prepare) => (textes[prepare.cle] ?? "").trim().length >= 3);

  async function ajouter(liste: FileList | null) {
    if (!liste || liste.length === 0) return;

    setErreurGlobale(null);
    setPreparation(true);

    try {
      const prepares = await Promise.all([...liste].map(preparerFichier));
      setFichiers((actuels) => [...actuels, ...prepares]);
    } finally {
      setPreparation(false);
    }
  }

  function retirer(cle: string) {
    setFichiers((actuels) => {
      const partant = actuels.filter((prepare) => prepare.cle === cle);
      libererApercus(partant);
      return actuels.filter((prepare) => prepare.cle !== cle);
    });
  }

  function viderTout() {
    libererApercus(fichiers);
    setFichiers([]);
    setTextes({});
    setLegendes({});
    setErreurs({});
    setProgression(null);
  }

  async function televerser() {
    if (!tousDecrits || enCours) return;

    setEnCours(true);
    setErreurs({});
    setErreurGlobale(null);
    setProgression({ fait: 0, total: retenus.length });

    const crees: MediaAsset[] = [];
    const echecs: Record<string, string> = {};

    for (const [index, prepare] of retenus.entries()) {
      const resultat = await televerserMediaAction({
        file: prepare.fichier,
        // Le nom D'ORIGINE, pas celui du fichier compressé : la compression
        // réencode en WebP et renomme, ce que l'utilisateur n'a pas à subir
        // dans la médiathèque.
        filename: prepare.nomOrigine,
        altText: (textes[prepare.cle] ?? "").trim(),
        caption: (legendes[prepare.cle] ?? "").trim() || null,
        folder: dossier.trim() || null,
        width: prepare.width,
        height: prepare.height,
      });

      if (resultat.ok) {
        crees.push(resultat.data);
      } else {
        echecs[prepare.cle] = resultat.message;
      }

      setProgression({ fait: index + 1, total: retenus.length });
    }

    setEnCours(false);
    setProgression(null);

    /*
      Les fichiers envoyés sont retirés de la file, les échecs y restent avec
      leur message. Tout vider ferait perdre les textes alternatifs déjà
      saisis pour les fichiers à renvoyer — la perte de saisie que le §12
      cherche précisément à éviter.
    */
    const clesReussies = new Set(
      retenus
        .filter((prepare) => !echecs[prepare.cle])
        .map((prepare) => prepare.cle),
    );

    setFichiers((actuels) => {
      const partants = actuels.filter((prepare) => clesReussies.has(prepare.cle));
      libererApercus(partants);
      return actuels.filter((prepare) => !clesReussies.has(prepare.cle));
    });

    setErreurs(echecs);

    if (crees.length > 0) onTermine?.(crees);

    if (crees.length === 0 && Object.keys(echecs).length > 0) {
      setErreurGlobale(
        "Aucun fichier n'a pu être enregistré. Les messages ci-dessous précisent pourquoi.",
      );
    }
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* ---------------------------------------------------------------- */}
      {/* Zone de dépôt                                                     */}
      {/* ---------------------------------------------------------------- */}
      <div
        onDragOver={(evenement) => {
          evenement.preventDefault();
          setSurvol(true);
        }}
        onDragLeave={() => setSurvol(false)}
        onDrop={(evenement) => {
          evenement.preventDefault();
          setSurvol(false);
          void ajouter(evenement.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
          survol ? "border-primary bg-primary/5" : "border-border bg-muted/30",
        )}
      >
        <Upload className="size-7 text-muted-foreground" aria-hidden="true" />

        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            Déposez vos fichiers ici
          </p>
          <p className="text-xs text-muted-foreground">
            {accept === "document"
              ? "PDF, 20 Mo maximum."
              : "JPG, PNG, WebP, AVIF ou SVG, 8 Mo maximum. Les images sont automatiquement allégées avant l'envoi."}
          </p>
        </div>

        {/*
          Les deux entrées sont masquées et pilotées par des boutons : un
          `<input type="file">` natif n'est stylable ni fiable en cible
          tactile. Le bouton, lui, hérite des 44 px du projet.
        */}
        <input
          ref={entreeFichiers}
          id={`${idBase}-fichiers`}
          type="file"
          multiple
          accept={acceptHtml}
          className="sr-only"
          onChange={(evenement) => {
            void ajouter(evenement.target.files);
            // Remis à zéro : sans cela, choisir deux fois le même fichier
            // n'émet pas de second `change`.
            evenement.target.value = "";
          }}
        />

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => entreeFichiers.current?.click()}
            disabled={enCours}
          >
            Choisir des fichiers
          </Button>

          {accept !== "document" ? (
            <>
              <input
                ref={entreePhoto}
                id={`${idBase}-photo`}
                type="file"
                accept="image/*"
                /*
                  `capture="environment"` : ouvre directement l'appareil photo
                  arrière sur un téléphone (§7.3). Sur un ordinateur,
                  l'attribut est ignoré et le sélecteur habituel s'ouvre — il
                  n'y a donc rien à masquer conditionnellement, et surtout pas
                  en lisant une largeur d'écran.
                */
                capture="environment"
                className="sr-only"
                onChange={(evenement) => {
                  void ajouter(evenement.target.files);
                  evenement.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => entreePhoto.current?.click()}
                disabled={enCours}
              >
                <Camera className="size-4" aria-hidden="true" />
                Prendre une photo
              </Button>
            </>
          ) : null}
        </div>

        <p aria-live="polite" className="text-xs text-muted-foreground">
          {preparation
            ? "Préparation des fichiers…"
            : fichiers.length > 0
              ? `${fichiers.length} fichier${fichiers.length > 1 ? "s" : ""} en attente d'envoi.`
              : ""}
        </p>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* File d'attente                                                    */}
      {/* ---------------------------------------------------------------- */}
      {fichiers.length > 0 ? (
        <>
          <Field
            id={`${idBase}-dossier`}
            label="Ranger dans le dossier"
            hint="Facultatif. Un même dossier pour tous les fichiers de cet envoi — « programmes », « galerie/2026 »…"
          >
            <Input
              id={`${idBase}-dossier`}
              value={dossier}
              onChange={(evenement) => setDossier(evenement.target.value)}
              placeholder="galerie"
              maxLength={60}
              disabled={enCours}
              className={CHAMP}
            />
          </Field>

          <ul className="flex flex-col gap-3">
            {fichiers.map((prepare) => (
              <li
                key={prepare.cle}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row"
              >
                {/* Aperçu */}
                <div className="flex items-start gap-3 sm:w-40 sm:shrink-0 sm:flex-col">
                  <span className="relative block size-16 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-full sm:aspect-square">
                    {prepare.apercu ? (
                      /*
                        `<img>` et non `next/image` : la source est une URL
                        d'objet locale (`blob:`), que l'optimiseur ne peut pas
                        aller chercher. C'est le seul endroit du dépôt où la
                        balise native se justifie.
                      */
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={prepare.apercu}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center text-xs font-medium text-muted-foreground">
                        PDF
                      </span>
                    )}
                  </span>

                  <div className="min-w-0 flex-1 sm:flex-none">
                    <p className="truncate text-sm font-medium text-foreground">
                      {prepare.nomOrigine}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {prepare.compresse ? (
                        <>
                          {formaterPoids(prepare.fichier.size)}{" "}
                          <span className="text-muted-foreground/80">
                            (allégé depuis {formaterPoids(prepare.taillOrigine)})
                          </span>
                        </>
                      ) : (
                        formaterPoids(prepare.fichier.size)
                      )}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 sm:hidden"
                    aria-label={`Retirer ${prepare.nomOrigine} de la liste`}
                    onClick={() => retirer(prepare.cle)}
                    disabled={enCours}
                  >
                    <X className="size-4" aria-hidden="true" />
                  </Button>
                </div>

                {/* Saisie */}
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  {prepare.refus ? (
                    <p
                      role="alert"
                      className="flex items-start gap-1.5 text-xs font-medium text-destructive"
                    >
                      <CircleAlert
                        className="mt-px size-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      {prepare.refus}
                    </p>
                  ) : (
                    <>
                      <Field
                        id={`${idBase}-alt-${prepare.cle}`}
                        label="Que montre ce fichier ?"
                        required
                        hint="Cette description est lue à la place de l'image par les personnes qui ne la voient pas. Elle sert aussi à retrouver le fichier plus tard."
                        error={erreurs[prepare.cle]}
                      >
                        <Textarea
                          id={`${idBase}-alt-${prepare.cle}`}
                          rows={2}
                          maxLength={200}
                          value={textes[prepare.cle] ?? ""}
                          onChange={(evenement) =>
                            setTextes((actuels) => ({
                              ...actuels,
                              [prepare.cle]: evenement.target.value,
                            }))
                          }
                          placeholder="Atelier de couture à Bafoussam, six participantes autour d'une machine."
                          disabled={enCours}
                          className={CHAMP_MULTILIGNE}
                        />
                      </Field>

                      <Field
                        id={`${idBase}-legende-${prepare.cle}`}
                        label="Légende"
                        hint="Facultative. Affichée sous l'image quand la page le prévoit."
                      >
                        <Input
                          id={`${idBase}-legende-${prepare.cle}`}
                          value={legendes[prepare.cle] ?? ""}
                          onChange={(evenement) =>
                            setLegendes((actuels) => ({
                              ...actuels,
                              [prepare.cle]: evenement.target.value,
                            }))
                          }
                          maxLength={300}
                          disabled={enCours}
                          className={CHAMP}
                        />
                      </Field>
                    </>
                  )}

                  {prepare.avertissement ? (
                    <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <TriangleAlert
                        className="mt-px size-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      {prepare.avertissement}
                    </p>
                  ) : null}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="hidden shrink-0 sm:inline-flex"
                  aria-label={`Retirer ${prepare.nomOrigine} de la liste`}
                  onClick={() => retirer(prepare.cle)}
                  disabled={enCours}
                >
                  <X className="size-4" aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>

          {erreurGlobale ? (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {erreurGlobale}
            </p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
            <Button
              type="button"
              variant="ghost"
              onClick={viderTout}
              disabled={enCours}
            >
              Tout retirer
            </Button>

            <Button type="button" onClick={televerser} disabled={!tousDecrits || enCours}>
              {enCours ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              {enCours && progression
                ? `Envoi ${progression.fait} sur ${progression.total}…`
                : `Téléverser ${retenus.length} fichier${retenus.length > 1 ? "s" : ""}`}
            </Button>
          </div>

          {/*
            Explique la désactivation au lieu de laisser un bouton gris muet.
            Un bouton inactif sans motif passe pour une panne (§12).
          */}
          {!tousDecrits && retenus.length > 0 ? (
            <p aria-live="polite" className="text-xs text-muted-foreground">
              Décrivez chaque fichier pour pouvoir l&apos;enregistrer.
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

/** Valeur de l'attribut `accept` du sélecteur natif. */
function attributAccept(accept: MediaAccept | undefined): string {
  if (accept === "document") return MEDIA_MIME_TYPES.documents.join(",");
  if (accept === "image") return MEDIA_MIME_TYPES.media.join(",");
  return [...MEDIA_MIME_TYPES.media, ...MEDIA_MIME_TYPES.documents].join(",");
}
