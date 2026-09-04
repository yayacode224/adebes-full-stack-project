import "server-only";

import { ContactInfoRenderer } from "./renderers/contact-info.renderer";
import { CtaBannerRenderer } from "./renderers/cta-banner.renderer";
import { DocumentsListRenderer } from "./renderers/documents-list.renderer";
import { DonationOptionsRenderer } from "./renderers/donation-options.renderer";
import { FaqRenderer } from "./renderers/faq.renderer";
import { FeatureListRenderer } from "./renderers/feature-list.renderer";
import { GalleryPreviewRenderer } from "./renderers/gallery-preview.renderer";
import { ImageTextRenderer } from "./renderers/image-text.renderer";
import { NewsGridRenderer } from "./renderers/news-grid.renderer";
import { PageHeroRenderer } from "./renderers/page-hero.renderer";
import { ProgrammesGridRenderer } from "./renderers/programmes-grid.renderer";
import { RichTextRenderer } from "./renderers/rich-text.renderer";
import { StatsGridRenderer } from "./renderers/stats-grid.renderer";
import { TeamGridRenderer } from "./renderers/team-grid.renderer";
import { TestimonialsRenderer } from "./renderers/testimonials.renderer";
import { ValuesGridRenderer } from "./renderers/values-grid.renderer";
import { VideoRenderer } from "./renderers/video.renderer";
import type { RegistreDeRendus } from "./types";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LE REGISTRE DE RENDUS — la table de dispatch du site public
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `import "server-only"` EN PREMIÈRE LIGNE, ET C'EST STRUCTURANT
 * ---------------------------------------------------------------------------
 * Six de ces rendus lisent la base par `src/server/queries/`. Ce module ne peut
 * donc JAMAIS être tiré par un composant client — et `server-only` transforme
 * cette contrainte en erreur de compilation plutôt qu'en fuite silencieuse de
 * la clé de service dans un bundle navigateur.
 *
 * C'est la raison pour laquelle les ICÔNES vivent ailleurs
 * (`block-icons.ts`) : le sélecteur de blocs et l'arbre des sections du
 * dashboard en ont besoin, et ce sont des composants client.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `RegistreDeRendus` LIE CHAQUE RENDU AU SCHÉMA DE SON BLOC
 * ---------------------------------------------------------------------------
 * Le type est MAPPÉ sur `BlockType` et déduit le type de `content` du schéma
 * déclaré dans `BLOCK_DEFINITIONS`. Deux conséquences :
 *
 *   1. **oublier un bloc casse la compilation** — c'est ce qui rend vraie la
 *      promesse « ajouter un 18ᵉ bloc ne demande qu'un fichier + une entrée de
 *      registre » ;
 *   2. **brancher un rendu sur la mauvaise entrée casse la compilation** — un
 *      `NewsGridRenderer` posé sur `programmes-grid` n'attend pas le même
 *      contenu, et TypeScript le voit.
 *
 * La seconde garantie n'existe que parce que `BLOCK_DEFINITIONS` est déclaré
 * avec `satisfies` et non avec une annotation de type. Voir son en-tête.
 */
export const BLOCK_RENDERERS: RegistreDeRendus = {
  "page-hero": PageHeroRenderer,
  "rich-text": RichTextRenderer,
  "image-text": ImageTextRenderer,
  "stats-grid": StatsGridRenderer,
  "values-grid": ValuesGridRenderer,
  "programmes-grid": ProgrammesGridRenderer,
  "news-grid": NewsGridRenderer,
  testimonials: TestimonialsRenderer,
  "team-grid": TeamGridRenderer,
  faq: FaqRenderer,
  "cta-banner": CtaBannerRenderer,
  "gallery-preview": GalleryPreviewRenderer,
  video: VideoRenderer,
  "documents-list": DocumentsListRenderer,
  "contact-info": ContactInfoRenderer,
  "donation-options": DonationOptionsRenderer,
  "feature-list": FeatureListRenderer,
};
