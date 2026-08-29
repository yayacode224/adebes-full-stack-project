import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  /**
   * Garde-fou d'architecture nº 1 — la règle de dépendance.
   *
   * `src/core/` est la couche domaine : entités, schémas, règles métier, ports.
   * Elle ne doit connaître ni le framework, ni la base de données, ni le rendu.
   * C'est ce qui rend les cas d'usage testables sans Next.js et sans Supabase.
   *
   * Cette règle rend la contrainte vérifiable par la machine plutôt que par la
   * discipline : une violation casse le lint, pas seulement la relecture.
   *
   * Note sur les motifs : `no-restricted-imports` utilise des globs où `*` ne
   * traverse pas les barres obliques. `@/infrastructure/*` ne couvrirait donc
   * que le premier niveau ; les deux formes sont déclarées pour attraper aussi
   * les chemins profonds (`@/infrastructure/supabase/clients/admin`).
   */
  {
    files: ["src/core/**/*.ts", "src/core/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["next", "next/*", "next/**"],
              message: "core/ ne dépend pas de Next.js.",
            },
            {
              group: ["@supabase/*", "@supabase/**"],
              message:
                "core/ ne dépend pas de Supabase. Passer par un port (core/cms/ports/).",
            },
            {
              group: ["react", "react-dom", "react/*", "react-dom/*"],
              message: "core/ ne dépend pas de React.",
            },
            {
              group: [
                "@/infrastructure/*",
                "@/infrastructure/**",
                "@/app/*",
                "@/app/**",
                "@/components/*",
                "@/components/**",
                "@/server/*",
                "@/server/**",
              ],
              message:
                "Inversion de dépendance : core/ ne connaît que ses propres ports.",
            },
          ],
        },
      ],
    },
  },

  /**
   * Garde-fou d'architecture nº 2 — le piège le plus probable du chantier.
   *
   * Les fichiers de `src/server/queries/` sont des lectures publiques mises en
   * cache (`'use cache'`). Un tel scope ne peut pas lire les cookies : Next.js
   * lève une erreur. Or `createServerClient()` lit les cookies.
   *
   * La lecture publique doit donc passer par `createPublicClient()`, qui
   * s'authentifie comme `anon` et ne voit que le contenu publié — exactement le
   * comportement voulu ici.
   */
  {
    files: ["src/server/queries/**/*.ts", "src/server/queries/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          /*
           * ─────────────────────────────────────────────────────────────────
           * Interdiction d'un fichier barrel `clients/index.ts`
           * ─────────────────────────────────────────────────────────────────
           * Il n'en existe pas, et c'est volontaire : un barrel qui
           * ré-exporterait les quatre fabriques rendrait les deux motifs
           * ci-dessous inopérants. `import { createPublicClient } from
           * '.../clients'` passerait le lint tout en tirant `server.ts` — donc
           * `next/headers` — dans un scope 'use cache'.
           *
           * ⚠️  DÉCLARÉ EN `paths` ET NON EN `patterns`, ET C'EST LE POINT.
           *
           * Les `patterns` de cette règle suivent la sémantique .gitignore :
           * un motif se terminant par « supabase/clients » y désigne le
           * DOSSIER et, avec lui, tout ce qu'il contient. Le motif interdisait
           * donc aussi `clients/public` — c'est-à-dire le seul import que ce
           * dossier a le droit de faire. Le défaut est passé inaperçu au
           * Lot 0 : aucun
           * fichier de `server/queries/` n'existait encore pour l'exercer, et
           * il n'est apparu qu'au Lot 8A, à la première lecture publique.
           *
           * `paths` compare la chaîne d'import EXACTE : plus de glob, plus de
           * sémantique implicite, et le barrel reste interdit.
           */
          paths: [
            {
              name: "@/infrastructure/supabase/clients",
              message:
                "Importer la fabrique par son chemin exact (clients/public), jamais par un barrel : un barrel contournerait les règles ci-dessous.",
            },
          ],
          patterns: [
            {
              group: ["**/clients/server", "**/clients/server.ts"],
              message:
                "Un scope 'use cache' ne peut pas lire les cookies. Utiliser createPublicClient().",
            },
            {
              // Le client d'administration contourne toute la RLS : il n'a
              // rien à faire dans une lecture publique mise en cache.
              group: ["**/clients/admin", "**/clients/admin.ts"],
              message:
                "createAdminClient() contourne la RLS et ne doit jamais alimenter une lecture publique.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
