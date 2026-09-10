"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  BRAND_CSS_VARS,
  BRAND_LABELS,
  CONTRAST_AA,
  contrastRatio,
  couplesCritiquesEnEchec,
  FONT_CSS_VARS,
  PALETTE_CSS_VARS,
  PALETTE_LABELS,
  RADIUS_CHOICES,
  THEME_DEFAULTS,
  THEME_FONT_IDS,
  THEME_FONT_LABELS,
  type ThemeBrand,
  type ThemePalette,
  type ThemeSettings,
} from "@/core/cms/entities/theme-settings";
import { cn } from "@/lib/utils";
import { mettreAJourThemeAction } from "@/server/actions/settings.actions";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  L'ÉDITEUR DE THÈME — §11 du Rapport 2
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ---------------------------------------------------------------------------
 * ⚠️  PAS DE `<SchemaForm>` ICI
 * ---------------------------------------------------------------------------
 * Le générateur de formulaire (Lot 6) ne sait pas rendre un sélecteur de
 * couleur, encore moins un aperçu vivant ni un ratio de contraste recalculé à
 * chaque frappe. Ce composant est écrit à la main — mais la validation reste
 * la MÊME autorité : `themeSettingsSchema`, rejouée par `createAction` côté
 * serveur (assainissement des couleurs + contraste des couples critiques).
 *
 * ---------------------------------------------------------------------------
 * LE CONTRASTE BLOQUE L'ENREGISTREMENT (§11.4)
 * ---------------------------------------------------------------------------
 * `couplesCritiquesEnEchec` est recalculé à chaque rendu. Tant qu'un couple
 * critique reste sous 4,5:1, le bouton « Enregistrer » est désactivé et un
 * bandeau `role="alert"` dit lesquels. Le serveur refuserait de toute façon.
 *
 * ---------------------------------------------------------------------------
 * L'APERÇU EST ISOLÉ
 * ---------------------------------------------------------------------------
 * Il n'injecte rien globalement : c'est un `<div>` qui porte les tokens en
 * `style` inline, donc `bg-[var(--primary)]`, `font-sans`, `rounded-[var(--radius)]`
 * à l'intérieur résolvent SES valeurs sans toucher au reste du dashboard.
 */

const MODES = [
  { cle: "light" as const, titre: "Interface claire" },
  { cle: "dark" as const, titre: "Interface sombre" },
];

function toHexInput(valeur: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(valeur)) return valeur.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(valeur)) {
    const c = valeur.slice(1);
    return `#${c[0]}${c[0]}${c[1]}${c[1]}${c[2]}${c[2]}`.toLowerCase();
  }
  return "#000000";
}

/* ─────────────────────────────────────────────────────────── Sous-composants ── */

function BadgeContraste({
  id,
  a,
  b,
  intitule,
}: {
  id: string;
  a: string;
  b: string;
  intitule: string;
}) {
  const ratio = contrastRatio(a, b);
  const conforme = ratio !== null && ratio >= CONTRAST_AA;
  return (
    <p
      id={id}
      className={cn(
        "text-xs",
        conforme ? "text-muted-foreground" : "font-medium text-destructive",
      )}
    >
      {intitule} :{" "}
      {ratio === null ? "contraste incalculable" : `${ratio.toFixed(2)}:1`}
      {conforme ? " ✓" : " — sous le minimum de 4,5:1"}
    </p>
  );
}

function ChampCouleur({
  id,
  label,
  valeur,
  onChange,
  erreur,
  contraste,
}: {
  id: string;
  label: string;
  valeur: string;
  onChange: (valeur: string) => void;
  erreur?: string;
  contraste?: { autre: string; intitule: string };
}) {
  const idErr = `${id}-err`;
  const idContraste = `${id}-contraste`;
  const decrit = erreur ? idErr : contraste ? idContraste : undefined;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} — nuancier`}
          value={toHexInput(valeur)}
          onChange={(e) => onChange(e.target.value)}
          className="size-9 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-0.5"
        />
        <input
          type="text"
          id={id}
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          aria-invalid={erreur ? true : undefined}
          aria-describedby={decrit}
          className={cn(
            "h-9 min-w-0 flex-1 rounded-md border bg-background px-2 font-mono text-sm text-foreground",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            erreur ? "border-destructive" : "border-input",
          )}
        />
      </div>
      {contraste ? (
        <BadgeContraste
          id={idContraste}
          a={valeur}
          b={contraste.autre}
          intitule={contraste.intitule}
        />
      ) : null}
      {erreur ? (
        <p id={idErr} role="alert" className="text-xs font-medium text-destructive">
          {erreur}
        </p>
      ) : null}
    </div>
  );
}

function Apercu({
  palette,
  brand,
  radius,
  headingFont,
  bodyFont,
  titre,
}: {
  palette: ThemePalette;
  brand: ThemeBrand;
  radius: string;
  headingFont: ThemeSettings["headingFont"];
  bodyFont: ThemeSettings["bodyFont"];
  titre: string;
}) {
  const style: Record<string, string> = {
    "--radius": radius,
    "--popover": palette.card,
    "--popover-foreground": palette.cardForeground,
    "--font-heading-runtime": `var(${FONT_CSS_VARS[headingFont]})`,
    "--font-sans-runtime": `var(${FONT_CSS_VARS[bodyFont]})`,
    backgroundColor: palette.background,
    color: palette.foreground,
  };
  for (const [cle, css] of PALETTE_CSS_VARS) style[css] = palette[cle];
  for (const [cle, css] of BRAND_CSS_VARS) style[css] = brand[cle];

  return (
    <div
      style={style as CSSProperties}
      className="rounded-[var(--radius)] border border-[var(--border)] p-4 font-sans"
    >
      <p className="font-heading text-lg font-semibold">{titre}</p>
      <p className="mt-1 text-sm" style={{ color: palette.mutedForeground }}>
        Un paragraphe d&apos;exemple, posé sur le fond de page.
      </p>

      <div
        className="mt-3 rounded-[var(--radius)] p-3 text-sm"
        style={{ backgroundColor: palette.card, color: palette.cardForeground }}
      >
        Contenu d&apos;une carte, avec son propre fond.
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className="inline-flex h-9 items-center rounded-[var(--radius)] px-3 text-sm font-medium"
          style={{ backgroundColor: palette.primary, color: palette.primaryForeground }}
        >
          Action principale
        </span>
        <span
          className="inline-flex h-9 items-center rounded-[var(--radius)] px-3 text-sm font-medium"
          style={{ backgroundColor: palette.destructive, color: "#ffffff" }}
        >
          Supprimer
        </span>
        <span
          className="inline-flex h-9 items-center rounded-[var(--radius)] border px-3 text-sm"
          style={{ borderColor: palette.input, color: palette.foreground }}
        >
          Champ
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {BRAND_CSS_VARS.map(([cle]) => (
          <span
            key={cle}
            title={BRAND_LABELS[cle]}
            className="size-5 rounded-full border border-black/10"
            style={{ backgroundColor: brand[cle] }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── Formulaire ── */

export function ThemeSettingsForm({ reglages }: { reglages: ThemeSettings }) {
  const router = useRouter();
  const [theme, setTheme] = useState<ThemeSettings>(reglages);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const echecs = useMemo(() => couplesCritiquesEnEchec(theme), [theme]);
  const bloque = echecs.length > 0;
  const modifie = useMemo(
    () => JSON.stringify(theme) !== JSON.stringify(reglages),
    [theme, reglages],
  );

  function effacerErreur(cle: string) {
    setErreurs((e) => {
      if (!e[cle]) return e;
      const copie = { ...e };
      delete copie[cle];
      return copie;
    });
  }

  function majPalette(mode: "light" | "dark", cle: keyof ThemePalette, valeur: string) {
    setTheme((t) => ({ ...t, [mode]: { ...t[mode], [cle]: valeur } }));
    effacerErreur(`${mode}.${cle}`);
  }

  function majMarque(cle: keyof ThemeBrand, valeur: string) {
    setTheme((t) => ({ ...t, brand: { ...t.brand, [cle]: valeur } }));
    effacerErreur(`brand.${cle}`);
  }

  function reinitialiser() {
    setTheme(THEME_DEFAULTS);
    setErreurs({});
    setErreurGlobale(null);
  }

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    if (bloque || enCours) return;

    setEnCours(true);
    setErreurGlobale(null);
    const resultat = await mettreAJourThemeAction(theme);
    setEnCours(false);

    if (resultat.ok) {
      toast.success("Thème mis à jour.");
      router.refresh();
      return;
    }

    setErreurs(resultat.fieldErrors ?? {});
    setErreurGlobale(resultat.message);
  }

  function contrasteDe(
    mode: "light" | "dark",
    cle: keyof ThemePalette,
  ): { autre: string; intitule: string } | undefined {
    const p = theme[mode];
    switch (cle) {
      case "background":
        return { autre: p.foreground, intitule: "Contraste texte/fond" };
      case "foreground":
        return { autre: p.background, intitule: "Contraste texte/fond" };
      case "primary":
        return { autre: p.primaryForeground, intitule: "Contraste texte sur bouton" };
      case "primaryForeground":
        return { autre: p.primary, intitule: "Contraste texte sur bouton" };
      case "destructive":
        return mode === "light"
          ? { autre: "#ffffff", intitule: "Contraste texte blanc" }
          : { autre: p.background, intitule: "Contraste sur fond sombre" };
      default:
        return undefined;
    }
  }

  return (
    <form onSubmit={soumettre} noValidate className="flex w-full max-w-5xl flex-col gap-8">
      <div className="grid gap-8 xl:grid-cols-[1fr_20rem]">
        {/* ─────────────────────────────────────────────── Colonne des réglages ── */}
        <div className="flex min-w-0 flex-col gap-8">
          {(erreurGlobale || bloque) && (
            <div
              role="alert"
              className="flex flex-col gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
              <p className="flex items-start gap-2 font-medium">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {erreurGlobale ?? "Certains couples texte / fond ne sont pas assez lisibles."}
              </p>
              {bloque ? (
                <ul className="ml-6 list-disc space-y-0.5">
                  {echecs.map(({ pair, ratio }) => (
                    <li key={`${pair.mode}-${pair.bg}-${String(pair.fg)}`}>
                      {pair.label} :{" "}
                      {ratio === null ? "contraste incalculable" : `${ratio.toFixed(2)}:1`}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}

          {/* Typographie */}
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="font-heading text-base font-semibold text-foreground">
                Typographie
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Deux polices au choix dans une liste fixe. Google Fonts doit être
                connu au moment de la construction du site : une police saisie
                librement est techniquement impossible, ce n&apos;est pas un oubli.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="headingFont"
                  className="text-sm font-medium text-foreground"
                >
                  Police des titres
                </label>
                <select
                  id="headingFont"
                  value={theme.headingFont}
                  onChange={(e) => {
                    const v = e.target.value as ThemeSettings["headingFont"];
                    setTheme((t) => ({ ...t, headingFont: v }));
                    effacerErreur("headingFont");
                  }}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {THEME_FONT_IDS.map((id) => (
                    <option key={id} value={id}>
                      {THEME_FONT_LABELS[id]}
                    </option>
                  ))}
                </select>
                {erreurs.headingFont ? (
                  <p role="alert" className="text-xs font-medium text-destructive">
                    {erreurs.headingFont}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="bodyFont" className="text-sm font-medium text-foreground">
                  Police du texte
                </label>
                <select
                  id="bodyFont"
                  value={theme.bodyFont}
                  onChange={(e) => {
                    const v = e.target.value as ThemeSettings["bodyFont"];
                    setTheme((t) => ({ ...t, bodyFont: v }));
                    effacerErreur("bodyFont");
                  }}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {THEME_FONT_IDS.map((id) => (
                    <option key={id} value={id}>
                      {THEME_FONT_LABELS[id]}
                    </option>
                  ))}
                </select>
                {erreurs.bodyFont ? (
                  <p role="alert" className="text-xs font-medium text-destructive">
                    {erreurs.bodyFont}
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          {/* Formes */}
          <section className="flex flex-col gap-4">
            <h2 className="font-heading text-base font-semibold text-foreground">Formes</h2>
            <div className="flex max-w-xs flex-col gap-1.5">
              <label htmlFor="radius" className="text-sm font-medium text-foreground">
                Arrondi des angles
              </label>
              <select
                id="radius"
                value={theme.radius}
                onChange={(e) => {
                  const v = e.target.value;
                  setTheme((t) => ({ ...t, radius: v }));
                  effacerErreur("radius");
                }}
                className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {RADIUS_CHOICES.map((choix) => (
                  <option key={choix.value} value={choix.value}>
                    {choix.label}
                  </option>
                ))}
              </select>
              {erreurs.radius ? (
                <p role="alert" className="text-xs font-medium text-destructive">
                  {erreurs.radius}
                </p>
              ) : null}
            </div>
          </section>

          {/* Couleurs de marque */}
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="font-heading text-base font-semibold text-foreground">
                Couleurs de marque
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Les couleurs du logo. Identiques en clair et en sombre.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {BRAND_CSS_VARS.map(([cle]) => (
                <ChampCouleur
                  key={cle}
                  id={`brand-${cle}`}
                  label={BRAND_LABELS[cle]}
                  valeur={theme.brand[cle]}
                  onChange={(v) => majMarque(cle, v)}
                  erreur={erreurs[`brand.${cle}`]}
                />
              ))}
            </div>
          </section>

          {/* Palettes clair / sombre */}
          {MODES.map(({ cle: mode, titre }) => (
            <section key={mode} className="flex flex-col gap-4">
              <div>
                <h2 className="font-heading text-base font-semibold text-foreground">
                  {titre}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {mode === "dark"
                    ? "Modifiable indépendamment du mode clair."
                    : "La palette appliquée par défaut."}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {PALETTE_CSS_VARS.map(([cle]) => (
                  <ChampCouleur
                    key={cle}
                    id={`${mode}-${cle}`}
                    label={PALETTE_LABELS[cle]}
                    valeur={theme[mode][cle]}
                    onChange={(v) => majPalette(mode, cle, v)}
                    erreur={erreurs[`${mode}.${cle}`]}
                    contraste={contrasteDe(mode, cle)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* ─────────────────────────────────────────────────────────── Aperçu ── */}
        <div className="flex flex-col gap-4 xl:sticky xl:top-4 xl:self-start">
          <h2 className="font-heading text-base font-semibold text-foreground">Aperçu</h2>
          <Apercu
            palette={theme.light}
            brand={theme.brand}
            radius={theme.radius}
            headingFont={theme.headingFont}
            bodyFont={theme.bodyFont}
            titre="Mode clair"
          />
          <Apercu
            palette={theme.dark}
            brand={theme.brand}
            radius={theme.radius}
            headingFont={theme.headingFont}
            bodyFont={theme.bodyFont}
            titre="Mode sombre"
          />
        </div>
      </div>

      {/* Barre d'enregistrement — même gabarit que <SchemaForm> */}
      <div
        className={cn(
          "sticky bottom-0 -mx-4 flex flex-col gap-2 border-t border-border bg-background/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-sm",
          "sm:mx-0 sm:flex-row sm:items-center sm:justify-end sm:rounded-lg sm:border sm:px-4 sm:pb-3",
          "[&>*]:w-full sm:[&>*]:w-auto",
        )}
      >
        <p aria-live="polite" className="text-xs text-muted-foreground sm:mr-auto sm:w-auto">
          {modifie ? "Modifications non enregistrées." : "Aucune modification en attente."}
        </p>

        <Button type="button" variant="outline" onClick={reinitialiser}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Rétablir les couleurs d&apos;origine ADEBES
        </Button>

        <Button type="submit" disabled={enCours || bloque}>
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
