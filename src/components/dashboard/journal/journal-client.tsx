"use client";

import { ChevronDown, RotateCcw, ScrollText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_TYPE_LABELS,
  estEvenementAuth,
  libelleAction,
  libelleTypeEntite,
  type AuditEntry,
  type AuditFilters,
} from "@/core/cms/entities/audit-entry";
import type { UserAccount } from "@/core/cms/entities/user-account";
import { formatDateHeure } from "@/lib/dates";

import { EmptyState } from "../feedback/empty-state";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  L'ÉCRAN `/dashboard/journal` (§13.3 du Rapport 2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Lecture seule. Filtres : auteur, type d'entité, action, période. Chaque
 * entrée affiche le différentiel des champs modifiés, replié.
 *
 * ---------------------------------------------------------------------------
 * LES FILTRES PASSENT PAR L'URL
 * ---------------------------------------------------------------------------
 * Le filtrage est fait EN BASE (le repository ajoute des `.eq` / `.gte`), pas
 * en mémoire : le journal peut peser des mois. « Appliquer » recharge donc la
 * page avec des paramètres d'URL — un état partageable, et une seule source de
 * vérité. La liste des options d'auteur vient de l'annuaire complet ; celles
 * de type et d'action, des libellés connus (`audit-entry.ts`).
 *
 * ---------------------------------------------------------------------------
 * TOUJOURS EN CARTES
 * ---------------------------------------------------------------------------
 * Un journal est un flux chronologique : il se lit en cartes à toutes les
 * largeurs, pas en tableau. Le JSON du différentiel défile dans son propre
 * conteneur (`overflow-x-auto`), jamais la page.
 */
export function JournalClient({
  entries,
  comptes,
  filtres,
  limite,
}: {
  entries: AuditEntry[];
  /** Annuaire indexé par identifiant — pour nommer l'auteur d'une entrée. */
  comptes: Record<string, UserAccount>;
  filtres: AuditFilters;
  /** Nombre maximal d'entrées lues : sert à prévenir quand la fenêtre est pleine. */
  limite: number;
}) {
  const router = useRouter();

  const [auteur, setAuteur] = useState(filtres.actorId ?? "");
  const [type, setType] = useState(filtres.entityType ?? "");
  const [action, setAction] = useState(filtres.action ?? "");
  const [du, setDu] = useState(filtres.from ?? "");
  const [au, setAu] = useState(filtres.to ?? "");

  const auteurs = useMemo(
    () =>
      Object.values(comptes)
        .map((compte) => ({
          value: compte.id,
          label: compte.fullName ?? compte.email,
        }))
        .sort((a, b) => a.label.localeCompare(b.label, "fr")),
    [comptes],
  );

  const typesEntite = useMemo(
    () =>
      Object.entries(AUDIT_ENTITY_TYPE_LABELS)
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label, "fr")),
    [],
  );

  const actions = useMemo(
    () =>
      Object.entries(AUDIT_ACTION_LABELS)
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label, "fr")),
    [],
  );

  const filtreActif =
    Boolean(auteur) ||
    Boolean(type) ||
    Boolean(action) ||
    Boolean(du) ||
    Boolean(au);

  function appliquer() {
    const params = new URLSearchParams();
    if (auteur) params.set("auteur", auteur);
    if (type) params.set("type", type);
    if (action) params.set("action", action);
    if (du) params.set("du", du);
    if (au) params.set("au", au);

    const requete = params.toString();
    router.push(requete ? `/dashboard/journal?${requete}` : "/dashboard/journal");
  }

  function reinitialiser() {
    setAuteur("");
    setType("");
    setAction("");
    setDu("");
    setAu("");
    router.push("/dashboard/journal");
  }

  const classeSelect =
    "h-11 w-full rounded-md border border-input bg-transparent px-3 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm";

  return (
    <div className="flex flex-col gap-6">
      {/* -------------------------------------------------------------- */}
      {/* Filtres                                                        */}
      {/* -------------------------------------------------------------- */}
      <form
        className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3"
        onSubmit={(evenement) => {
          evenement.preventDefault();
          appliquer();
        }}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filtre-auteur">Auteur</Label>
          <select
            id="filtre-auteur"
            className={classeSelect}
            value={auteur}
            onChange={(evenement) => setAuteur(evenement.target.value)}
          >
            <option value="">Tous les auteurs</option>
            {auteurs.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filtre-type">Type d&apos;entité</Label>
          <select
            id="filtre-type"
            className={classeSelect}
            value={type}
            onChange={(evenement) => setType(evenement.target.value)}
          >
            <option value="">Tous les types</option>
            {typesEntite.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filtre-action">Action</Label>
          <select
            id="filtre-action"
            className={classeSelect}
            value={action}
            onChange={(evenement) => setAction(evenement.target.value)}
          >
            <option value="">Toutes les actions</option>
            {actions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filtre-du">À partir du</Label>
          <Input
            id="filtre-du"
            type="date"
            className="h-11 text-base md:text-sm"
            value={du}
            max={au || undefined}
            onChange={(evenement) => setDu(evenement.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filtre-au">Jusqu&apos;au</Label>
          <Input
            id="filtre-au"
            type="date"
            className="h-11 text-base md:text-sm"
            value={au}
            min={du || undefined}
            onChange={(evenement) => setAu(evenement.target.value)}
          />
        </div>

        <div className="flex items-end gap-2">
          <Button type="submit" className="flex-1 sm:flex-none">
            Appliquer
          </Button>
          {filtreActif ? (
            <Button
              type="button"
              variant="outline"
              onClick={reinitialiser}
              className="flex-1 sm:flex-none"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Réinitialiser
            </Button>
          ) : null}
        </div>
      </form>

      {/* -------------------------------------------------------------- */}
      {/* Résultats                                                      */}
      {/* -------------------------------------------------------------- */}
      {entries.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="Aucune entrée"
          description={
            filtreActif
              ? "Aucune action ne correspond à ces filtres. Élargissez la période ou retirez un critère."
              : "Le journal est vide pour l'instant. Chaque action effectuée dans le dashboard viendra s'y inscrire."
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {entries.length} entrée{entries.length > 1 ? "s" : ""}
            {entries.length >= limite ? (
              <>
                {" "}
                — seules les {limite} plus récentes sont affichées. Affinez les
                filtres pour remonter plus loin.
              </>
            ) : null}
          </p>

          <ol data-journal className="flex flex-col gap-3">
            {entries.map((entree) => (
              <EntreeJournal
                key={entree.id}
                entree={entree}
                compte={entree.actorId ? comptes[entree.actorId] : undefined}
              />
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

/** Une carte du journal. */
function EntreeJournal({
  entree,
  compte,
}: {
  entree: AuditEntry;
  compte: UserAccount | undefined;
}) {
  const [ouvert, setOuvert] = useState(false);

  const auteur = compte
    ? (compte.fullName ?? compte.email)
    : entree.actorId
      ? "Compte supprimé"
      : "Système";

  const detail = detailLisible(entree.diff);

  return (
    <li className="rounded-lg border border-border bg-card">
      <div className="flex flex-col gap-1 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="text-sm font-semibold text-foreground">
            {libelleAction(entree.action)}
          </span>
          <time
            dateTime={entree.createdAt}
            className="text-xs text-muted-foreground"
          >
            {formatDateHeure(entree.createdAt)}
          </time>
        </div>

        <p className="text-sm text-muted-foreground">
          <span className="text-foreground">{auteur}</span>
          {!estEvenementAuth(entree.action) && entree.entityType ? (
            <> · {libelleTypeEntite(entree.entityType)}</>
          ) : null}
          {entree.entityId ? (
            <>
              {" "}
              ·{" "}
              <span className="break-all font-mono text-xs">
                {entree.entityId}
              </span>
            </>
          ) : null}
        </p>

        {entree.ip ? (
          <p className="text-xs text-muted-foreground">Adresse : {entree.ip}</p>
        ) : null}

        {detail || entree.userAgent ? (
          <div className="mt-1">
            <button
              type="button"
              onClick={() => setOuvert((valeur) => !valeur)}
              aria-expanded={ouvert}
              className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline"
            >
              <ChevronDown
                className={`size-3.5 transition-transform ${ouvert ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
              {ouvert ? "Masquer le détail" : "Voir le détail"}
            </button>

            {ouvert ? (
              <div className="mt-2 flex flex-col gap-2">
                {detail ? (
                  <pre className="max-w-full overflow-x-auto rounded-md bg-muted p-3 text-xs leading-relaxed text-foreground">
                    {detail}
                  </pre>
                ) : null}
                {entree.userAgent ? (
                  <p className="text-xs break-all text-muted-foreground">
                    Navigateur : {entree.userAgent}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}

/**
 * Différentiel en JSON indenté, ou `null` s'il n'y a rien à montrer.
 *
 * Un `diff` absent, ou réduit à `{}` / `null` après sérialisation, ne mérite
 * pas de bouton « Voir le détail ».
 */
function detailLisible(diff: unknown): string | null {
  if (diff == null) return null;
  try {
    const texte = JSON.stringify(diff, null, 2);
    if (!texte || texte === "null" || texte === "{}" || texte === "[]") {
      return null;
    }
    return texte;
  } catch {
    return null;
  }
}
