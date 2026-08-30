import fs from "node:fs";
import path from "node:path";

import type { MediaTone } from "@/components/media/media-placeholder";
import { mediaExtensionRank } from "@/lib/media";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ⚠️  CE FICHIER N'EST PLUS IMPORTÉ PAR AUCUNE PAGE — LOT 8H
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * La galerie vit désormais en base : `gallery_categories` et `gallery_items`,
 * lues par `src/server/queries/gallery.query.ts`. `/galerie` est la seule page
 * qui l'affichait, et elle a basculé.
 *
 * ---------------------------------------------------------------------------
 * CE QUE CE FICHIER FAISAIT, ET CE QUI L'A REMPLACÉ
 * ---------------------------------------------------------------------------
 * | Ici (jusqu'au Lot 8H)                  | Désormais                        |
 * |----------------------------------------|----------------------------------|
 * | `fs.readdirSync` au build              | une lecture SQL à chaque requête |
 * | catégorie = préfixe du nom de fichier  | `gallery_items.category_id`      |
 * | légendes dans `legendes.json`          | `media_assets.alt_text`, NOT NULL |
 * | ordre = tri alphabétique du nom        | `gallery_items.position`         |
 * | teinte = tableau littéral ci-dessous   | `gallery_categories.tone`        |
 *
 * Les quatre photographies de `public/images/galerie/` ont été MIGRÉES —
 * téléversées dans Storage, cataloguées, puis rattachées à leur catégorie —
 * avec exactement les textes alternatifs que ce fichier générait. Les fichiers
 * restent sur le disque : ils ne sont plus lus, et la médiathèque en détient
 * désormais la copie de référence.
 *
 * ⚠️  Déposer un fichier dans `public/images/galerie/` ne le fait donc PLUS
 * apparaître sur le site. La marche à suivre est : Médiathèque → téléverser,
 * puis Galerie → « Ajouter une photo ».
 *
 * Conservé comme référence jusqu'au Lot 16, où les fichiers de `src/content/`
 * seront retirés ensemble.
 *
 * ---------------------------------------------------------------------------
 * Documentation d'origine, pour mémoire :
 *
 * Le filtre par catégorie de l'ancien site était un bon pattern (audit §2) et
 * est conservé. En revanche, la galerie ne référence plus de fichiers en dur :
 * elle **lit le contenu réel** de `public/images/galerie/` au moment du build.
 *
 * Les textes alternatifs peuvent être fournis dans un fichier
 * `public/images/galerie/legendes.json` :
 *
 *   { "education-01.jpg": "Atelier de soutien scolaire à Bonabéri, Douala" }
 */

export const galerieCategories = [
  { slug: "education", label: "Éducation", tone: "navy" },
  { slug: "sante", label: "Santé", tone: "green" },
  { slug: "communaute", label: "Communauté", tone: "blue" },
  { slug: "environnement", label: "Environnement", tone: "green" },
] as const satisfies ReadonlyArray<{
  slug: string;
  label: string;
  tone: MediaTone;
}>;

export type GalerieCategorySlug = (typeof galerieCategories)[number]["slug"];

export type GalerieItem = {
  id: string;
  src: string;
  alt: string;
  category: GalerieCategorySlug;
  categoryLabel: string;
  tone: MediaTone;
  /** false = emplacement de démonstration, aucune photo réelle déposée. */
  available: boolean;
};

const GALERIE_DIR = path.join(process.cwd(), "public", "images", "galerie");
const FILE_PATTERN =
  /^(education|sante|communaute|environnement)-(\d{2,3})\.(png|jpe?g|svg|webp|avif)$/i;

/** `education-01.png` → `education-01`. */
function baseName(file: string): string {
  return file.slice(0, file.length - path.extname(file).length).toLowerCase();
}

/**
 * Ailleurs sur le site, c'est `resolveMedia` qui choisit entre deux fichiers de
 * même nom ; ici la galerie lit un dossier entier, elle doit donc appliquer
 * elle-même la règle de priorité (PNG > JPEG > SVG, voir `lib/media.ts`).
 *
 * Sans ce tri, déposer `education-01.png` à côté d'un `education-01.jpeg`
 * existant ferait apparaître **deux vignettes de la même photo** dans la
 * grille — et non un remplacement.
 */
function bestFilePerName(files: string[]): string[] {
  const best = new Map<string, string>();

  for (const file of files) {
    if (!FILE_PATTERN.test(file)) continue;

    const key = baseName(file);
    const current = best.get(key);
    if (!current || mediaExtensionRank(file) < mediaExtensionRank(current)) {
      best.set(key, file);
    }
  }

  return [...best.values()];
}

function readCaptions(): Record<string, string> {
  try {
    const raw = fs.readFileSync(path.join(GALERIE_DIR, "legendes.json"), "utf8");
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, string>)
      : {};
  } catch {
    return {};
  }
}

/**
 * La légende suit le visuel, pas son extension : une entrée écrite pour
 * `education-01.jpg` reste valable le jour où le fichier est remplacé par un
 * `education-01.png`. Le texte alternatif ne se perd donc pas silencieusement
 * (WCAG 1.1.1) à cause d'un simple changement de format.
 */
function captionFor(
  captions: Record<string, string>,
  file: string,
): string | undefined {
  const exact = captions[file];
  if (exact) return exact;

  const base = baseName(file);
  const fallback = Object.keys(captions).find((key) => baseName(key) === base);
  return fallback ? captions[fallback] : undefined;
}

function categoryOf(slug: string) {
  return galerieCategories.find((c) => c.slug === slug)!;
}

/**
 * Emplacements de démonstration tant qu'aucune photo n'a été déposée : deux par
 * catégorie, pour que la grille et le filtre soient visibles et testables.
 */
function placeholderItems(): GalerieItem[] {
  return galerieCategories.flatMap((category) =>
    ["01", "02"].map((n) => ({
      id: `${category.slug}-${n}`,
      src: `/images/galerie/${category.slug}-${n}.jpeg`,
      alt: `Photo à venir — action ADEBES, ${category.label.toLowerCase()}`,
      category: category.slug,
      categoryLabel: category.label,
      tone: category.tone,
      available: false,
    })),
  );
}

export function getGalerieItems(): GalerieItem[] {
  let files: string[];
  try {
    files = fs.readdirSync(GALERIE_DIR);
  } catch {
    return placeholderItems();
  }

  const captions = readCaptions();

  const items = bestFilePerName(files)
    .map((file): GalerieItem => {
      // Le fichier a déjà été validé par `bestFilePerName` : la correspondance
      // ne peut pas échouer ici.
      const match = FILE_PATTERN.exec(file)!;

      const category = categoryOf(match[1].toLowerCase());
      return {
        id: file,
        src: `/images/galerie/${file}`,
        alt:
          captionFor(captions, file) ??
          `Action ADEBES — ${category.label.toLowerCase()} (photo ${Number(match[2])})`,
        category: category.slug,
        categoryLabel: category.label,
        tone: category.tone,
        available: true,
      };
    })
    // Tri sur le nom sans extension : l'ordre de la grille ne change pas quand
    // une photo est remplacée par la même dans un autre format.
    .sort((a, b) => baseName(a.id).localeCompare(baseName(b.id), "fr"));

  return items.length > 0 ? items : placeholderItems();
}
