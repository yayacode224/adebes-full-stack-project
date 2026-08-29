# Rapport 2 — Plan d'implémentation de A à Z

> **Objet.** Découper la construction du mini CMS en **17 lots** livrables l'un après
> l'autre. Chaque lot est autonome, vérifiable, et laisse l'application dans un état
> fonctionnel.
>
> **Prérequis de lecture.** Le [Rapport 1](./RAPPORT-01-ARCHITECTURE.md) fixe les
> décisions (D1 à D8), l'arborescence, la matrice RBAC et le modèle de données. Ce
> document n'y revient pas : il les met en œuvre.

---

## Règles valables pour tous les lots

Elles s'appliquent sans être répétées.

1. **Aucun lot n'est « terminé » sans sa recette.** La section *Recette* de chaque lot
   est la définition de terminé. Un lot partiellement livré est un lot non livré : le
   signaler explicitement plutôt que de le déclarer fait.
2. **`npm run build` doit passer** à la fin de chaque lot. Un `build` cassé bloque le
   lot suivant.
3. **`npx tsc --noEmit` doit passer.** Aucun `any`, aucun `@ts-ignore`, aucun
   `as unknown as` hors des deux cas déjà présents dans le dépôt.
4. **Respecter le §15 du Rapport 1** (contraintes Next.js 16) avant d'écrire la moindre
   ligne. En cas de doute sur une API, lire `node_modules/next/dist/docs/` — jamais se
   fier à la mémoire.
5. **Ne rien inventer comme contenu.** Les invariants du projet (§1 du Rapport 1) —
   aucun chiffre fabriqué, aucun lien mort — restent valables dans le CMS.
6. **Langue.** Identifiants et types en anglais ; libellés, messages et commentaires en
   français.
7. **Commits.** Un commit par lot minimum, message en français décrivant l'apport
   fonctionnel.
8. **Tout écran est responsive avant d'être déclaré terminé.** Le dashboard doit être
   pleinement utilisable au téléphone comme au bureau. Le contrat de points de rupture,
   les dix règles de mise en œuvre, les interdits et la matrice de recette sont fixés au
   **§12 du Rapport 1** ; ils s'appliquent à tous les lots d'interface (5, 6, 7, 8A–8I,
   9, 10, 11, 12, 13, 14) sans être répétés. Concrètement, aucun lot d'interface n'est
   clos sans la vérification aux **cinq largeurs 320 · 390 · 768 · 1024 · 1440 px**,
   avec pour chacune : aucun défilement horizontal de page, toutes les actions
   atteignables, toutes les cibles tactiles ≥ 44 px.

### Tableau de bord des lots

| Lot | Titre | Livre |
|---|---|---|
| 0 | Préparation du terrain | Dépendances, env, projet Supabase |
| 1 | Base de données et RLS | Schéma complet, politiques, seed |
| 2 | Noyau de domaine | `core/` : Result, RBAC, entités, ports |
| 3 | Infrastructure Supabase | 4 clients, mappers, repositories |
| 4 | Authentification et RBAC | Connexion, session, `proxy.ts`, DAL |
| 5 | Coquille du dashboard | Layout, sidebar, navigation par permissions |
| 6 | Design system du dashboard | 8 composants réutilisables |
| 7 | Médiathèque | Storage, upload, MediaPicker |
| 8A | **Programmes de bout en bout** | Implémentation de référence |
| 8B–8I | Les 8 autres collections | Réplication du modèle 8A |
| 9 | Constructeur de pages | Registre de blocs, sections, glisser-déposer |
| 10 | Réglages du site | Identité, contact, légal, réseaux, SEO, navigation |
| 11 | Éditeur de thème | Couleurs, rayons, polices, contrôle du contraste |
| 12 | Workflow éditorial | Brouillon, versions, prévisualisation |
| 13 | Utilisateurs et audit | Invitations, rôles, journal |
| 14 | Boîte de réception | Messages contact et bénévolat |
| 15 | Bascule du site public | Migration de `src/content/`, cache |
| 16 | Durcissement et mise en ligne | Limite de débit, CSP, recette, Vercel |

---

# Lot 0 — Préparation du terrain

**Objectif.** Installer les dépendances, créer le projet Supabase, préparer la
configuration. Le site public continue de fonctionner à l'identique.

### 0.1 Dépendances

```bash
npm install @supabase/supabase-js @supabase/ssr @dnd-kit/core @dnd-kit/sortable @dnd-kit/modifiers date-fns
npm install -D supabase
```

| Paquet | Usage |
|---|---|
| `@supabase/supabase-js` | Client base de données et Storage |
| `@supabase/ssr` | Sessions par cookies en App Router |
| `@dnd-kit/*` | Réordonnancement des sections et des listes |
| `date-fns` | Formatage des dates dans le dashboard (le site utilise déjà `Intl`) |
| `supabase` (dev) | CLI : migrations, génération des types |

> Ne pas installer de bibliothèque de table (TanStack Table) : `<DataTable>` est écrit
> sur mesure au Lot 6, au-dessus des primitives shadcn déjà présentes. Une dépendance de
> plus n'apporterait rien pour les volumes concernés (quelques dizaines de lignes).

### 0.2 Projet Supabase

1. Créer le projet sur [supabase.com](https://supabase.com), **région `eu-west-3`
   (Paris)** — la plus proche du Cameroun parmi les régions européennes, et cohérente
   avec un hébergement Vercel `cdg1`.
2. Relever `Project URL`, `anon key`, `service_role key`.
3. `npx supabase init` puis `npx supabase link --project-ref <ref>`.

### 0.3 Variables d'environnement

Ajouter à `.env.example` **et** à `.env.local`, en respectant le style de commentaires
du fichier existant :

```bash
# --- Supabase ---------------------------------------------------------------
# Base de données, authentification et stockage des médias.
# URL et clé anon sont publiques par nature (protégées par les politiques RLS).
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""

# Clé de service : contourne TOUTES les politiques RLS.
# Jamais préfixée NEXT_PUBLIC_, jamais commitée, jamais importée dans un
# composant client. Utilisée uniquement par src/infrastructure/supabase/clients/admin.ts
SUPABASE_SERVICE_ROLE_KEY=""

# --- Dashboard --------------------------------------------------------------
# E-mail du premier super administrateur, créé par le script de seed.
SEED_SUPER_ADMIN_EMAIL=""
```

### 0.4 `next.config.ts`

Trois modifications, aux emplacements existants :

```ts
images: {
  formats: ["image/avif", "image/webp"],
  localPatterns: [
    { pathname: "/images/**", search: "" },
    { pathname: "/documents/**", search: "" },
  ],
  // AJOUT — sans cette entrée, aucune image de la médiathèque ne s'affiche.
  remotePatterns: [
    {
      protocol: "https",
      hostname: "<project-ref>.supabase.co",
      pathname: "/storage/v1/object/public/**",
    },
  ],
},
```

> `remotePatterns` n'accepte pas de variable d'environnement : le nom d'hôte doit être
> une constante analysable au build. L'inscrire en dur, avec un commentaire renvoyant à
> `NEXT_PUBLIC_SUPABASE_URL`.

`cacheComponents: true` n'est **pas** activé maintenant — c'est le Lot 15.

### 0.5 Garde-fou d'architecture

Ajouter à `eslint.config.mjs` la règle qui matérialise la règle de dépendance (§4 du
Rapport 1) :

```js
{
  files: ["src/core/**/*.ts"],
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [
        { group: ["next", "next/*"],        message: "core/ ne dépend pas de Next.js." },
        { group: ["@supabase/*"],           message: "core/ ne dépend pas de Supabase. Passer par un port." },
        { group: ["react", "react-dom"],    message: "core/ ne dépend pas de React." },
        { group: ["@/infrastructure/*", "@/app/*", "@/components/*"],
          message: "Inversion de dépendance : core/ ne connaît que ses propres ports." },
      ],
    }],
  },
},
{
  files: ["src/server/queries/**/*.ts"],
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [{
        group: ["**/clients/server"],
        message: "Un scope 'use cache' ne peut pas lire les cookies. Utiliser createPublicClient().",
      }],
    }],
  },
},
```

### Recette du Lot 0

- [ ] `npm run build` passe, le site public est inchangé.
- [ ] `npx supabase projects list` répond, projet lié.
- [ ] `.env.local` renseigné, `.env.example` documenté, aucune clé commitée
      (`git status` propre côté secrets).
- [ ] ESLint échoue si l'on ajoute volontairement `import { cookies } from 'next/headers'`
      dans un fichier de `src/core/` — **tester ce point, puis retirer l'import**.

---

# Lot 1 — Base de données et RLS

**Objectif.** Le schéma complet, les politiques de sécurité, les données de départ. Rien
d'applicatif.

### 1.1 Fichiers de migration

Créer dans `supabase/migrations/`, dans cet ordre — la numérotation compte :

| Fichier | Contenu |
|---|---|
| `0001_extensions_and_enums.sql` | `pgcrypto` ; les 4 `create type` du §8 |
| `0002_shared_functions.sql` | `set_updated_at()`, `app_current_role()` |
| `0003_profiles.sql` | `profiles` + trigger de création depuis `auth.users` |
| `0004_media.sql` | `media_assets` |
| `0005_collections.sql` | `programmes`, `article_categories`, `articles`, `team_members`, `testimonials`, `core_values`, `faq_items`, `stats`, `gallery_categories`, `gallery_items`, `annual_reports` |
| `0006_pages.sql` | `pages`, `page_sections` |
| `0007_settings.sql` | `site_settings`, `navigation_items` |
| `0008_versions_audit_submissions.sql` | `content_versions`, `audit_logs`, `form_submissions`, `rate_limits` |
| `0009_rls_policies.sql` | Toutes les politiques |
| `0010_guards.sql` | Triggers d'invariants |
| `0011_storage.sql` | Buckets et politiques Storage |

### 1.2 Fonctions partagées (`0002`)

```sql
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- security definer + search_path : indispensables (§8 du Rapport 1, piège de récursion RLS)
create or replace function public.app_current_role()
returns public.user_role
language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.app_is_staff() returns boolean
language sql stable as $$
  select public.app_current_role() in ('super_admin','admin','editor')
$$;

create or replace function public.app_can_publish() returns boolean
language sql stable as $$
  select public.app_current_role() in ('super_admin','admin')
$$;
```

### 1.3 Profil créé automatiquement (`0003`)

```sql
create table public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  email            text not null,
  full_name        text,
  avatar_media_id  uuid,
  role             public.user_role not null default 'editor',
  is_active        boolean not null default true,
  last_seen_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

> Sans ce trigger, un utilisateur invité existerait dans `auth.users` sans profil, donc
> sans rôle : il se connecterait et n'aurait accès à rien, sans message clair.

### 1.4 Politiques RLS (`0009`)

Appliquer à **chaque** table le patron du §8 du Rapport 1. Le tableau des accès :

| Table | `anon` (site public) | `editor` | `admin` / `super_admin` |
|---|---|---|---|
| `programmes`, `articles`, `testimonials`, `team_members`, `faq_items`, `gallery_items`, `annual_reports` | `select` où `status='published'` | `select` tout, `insert`, `update` | + `delete`, + passage à `published` |
| `core_values`, `stats`, `article_categories`, `gallery_categories` | `select` où `is_visible`/publié | `select`, `update` | + `insert`, `delete` |
| `pages` | `select` où `status='published'` | `select`, `update` | tout |
| `page_sections` | `select` si page publiée | `select`, `update` | + `insert`, `delete`, `reorder` |
| `media_assets` | `select` | `select`, `insert` | + `update`, `delete` |
| `site_settings`, `navigation_items` | `select` | `select` | `select`, `update`, `insert`, `delete` |
| `profiles` | ❌ aucun accès | `select` (soi-même) | `select` tous ; rôle modifiable par `super_admin` seul |
| `form_submissions` | `insert` uniquement | `select`, `update` (statut) | + `delete` |
| `audit_logs` | ❌ | ❌ | `select` |
| `content_versions` | ❌ | `select`, `insert` | tout |

### 1.5 Triggers d'invariants (`0010`)

Trois garde-fous que l'applicatif ne peut pas garantir seul :

```sql
-- 1. Un éditeur ne publie pas, même si l'applicatif est contourné.
create or replace function public.guard_publish()
returns trigger language plpgsql as $$
begin
  if new.status = 'published'
     and (tg_op = 'INSERT' or old.status is distinct from 'published')
     and not public.app_can_publish() then
    raise exception 'Seuls un administrateur ou un super administrateur peuvent publier.';
  end if;
  return new;
end $$;
-- à poser sur chaque table possédant une colonne `status`

-- 2. Le dernier super administrateur actif ne peut être ni rétrogradé ni désactivé.
create or replace function public.guard_last_super_admin()
returns trigger language plpgsql as $$
begin
  if old.role = 'super_admin'
     and (new.role <> 'super_admin' or new.is_active = false)
     and (select count(*) from public.profiles
          where role = 'super_admin' and is_active and id <> old.id) = 0 then
    raise exception 'Impossible : ce compte est le dernier super administrateur actif.';
  end if;
  return new;
end $$;

-- 3. Une page système ne se supprime pas.
create or replace function public.guard_system_page()
returns trigger language plpgsql as $$
begin
  if old.is_system then
    raise exception 'Cette page fait partie de la structure du site et ne peut pas être supprimée.';
  end if;
  return old;
end $$;
```

### 1.6 Buckets Storage (`0011`)

| Bucket | Public | Types acceptés | Taille max |
|---|---|---|---|
| `media` | oui (lecture) | `image/jpeg`, `image/png`, `image/webp`, `image/avif`, `image/svg+xml` | 8 Mo |
| `documents` | oui (lecture) | `application/pdf` | 20 Mo |

Écriture réservée aux authentifiés ; suppression réservée à `admin` / `super_admin`.

### 1.7 Seed

`supabase/seed.sql` — les données de départ proviennent **exclusivement** de
`src/content/*.ts`. Ne rien réécrire, ne rien enjoliver, ne rien compléter.

Contenu du seed :

1. Les **8 programmes** de `src/content/programmes.ts`, `status='published'`,
   `position` = ordre du tableau. L'icône est stockée comme **chaîne** (`"GraduationCap"`)
   — voir Lot 2, §2.5.
2. Les **5 catégories** d'actualités et les **3 articles d'exemple**, en conservant
   `is_placeholder`.
3. Les **4 valeurs**, les **7 questions de FAQ**, les **4 chiffres** — `beneficiaires`
   avec `value = NULL`, exactement comme aujourd'hui.
4. Les **3 fiches d'équipe** avec leurs `[À COMPLÉTER]`, `status='draft'`.
5. Les **3 témoignages** d'exemple, les **4 catégories de galerie**.
6. Les **10 pages éditoriales** (`/`, `/a-propos`, `/biographie`, `/programmes`,
   `/impact`, `/actualites`, `/galerie`, `/don`, `/benevolat`, `/contact`) avec
   `is_system = true`, et leurs sections dans l'ordre relevé au §1 du Rapport 1.
   Les 2 pages légales (`/mentions-legales`, `/politique-confidentialite`) sont ajoutées
   également, alimentées par le groupe de réglages `legal` plutôt que par des sections.
7. `site_settings` : les 7 groupes, remplis depuis `src/lib/site-config.ts` — y compris
   les `[À COMPLÉTER]`, qui doivent rester visibles.
8. `navigation_items` : les 3 menus de `src/lib/navigation.ts`.

### Recette du Lot 1

- [ ] `npx supabase db reset` s'exécute sans erreur, migrations + seed compris.
- [ ] `npx supabase gen types typescript --linked > src/infrastructure/supabase/database.types.ts` produit un fichier compilable.
- [ ] **Test de la récursion RLS** : `select * from profiles` depuis le SQL Editor en
      tant qu'utilisateur authentifié répond — sans erreur `infinite recursion`.
- [ ] **Test `anon`** : avec la clé anon, `select` sur `programmes` renvoie 8 lignes ;
      sur `team_members` (en `draft`), 0 ligne ; sur `profiles`, une erreur.
- [ ] **Test d'invariant** : `update profiles set role='editor'` sur l'unique
      super administrateur échoue avec le message attendu.
- [ ] `stats` contient bien une ligne `beneficiaires` à `value IS NULL`.

---

# Lot 2 — Noyau de domaine

**Objectif.** Écrire `src/core/` : types, règles, ports. Aucune dépendance externe.
Entièrement testable sans base de données.

### 2.1 `src/core/shared/result.ts`

```ts
export type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E }

export const ok  = <T>(value: T): Result<T, never> => ({ ok: true, value })
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error })
```

### 2.2 `src/core/shared/errors.ts`

```ts
export type ErrorCode =
  | 'UNAUTHENTICATED' | 'FORBIDDEN' | 'NOT_FOUND' | 'VALIDATION'
  | 'CONFLICT' | 'RATE_LIMITED' | 'STORAGE' | 'UNEXPECTED'

export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    /** Message affichable à un utilisateur non technique, en français. */
    message: string,
    readonly fieldErrors?: Record<string, string>,
    readonly cause?: unknown,
  ) { super(message) }
}
```

Chaque erreur porte **un message destiné à l'utilisateur final**, en français, sans
jargon. « Ce lien existe déjà pour un autre programme. » et non « unique constraint
violation ».

### 2.3 `src/core/rbac/`

`roles.ts`, `permissions.ts`, `policy.ts` — traduction littérale de la matrice du §9 du
Rapport 1 :

```ts
export const RESOURCES = ['page','section','programme','article','gallery','team',
  'testimonial','faq','stat','document','media','settings','navigation','theme',
  'user','submission','audit'] as const

export const ACTIONS = ['read','create','update','delete','publish','reorder'] as const

export type Permission = `${(typeof RESOURCES)[number]}:${(typeof ACTIONS)[number]}`

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  super_admin: [/* toutes */],
  admin:       [/* toutes sauf user:update, user:delete */],
  editor:      [/* read/create/update/reorder sur le contenu + media:create ;
                   ni publish, ni delete, ni settings/navigation/theme/user/audit */],
}

export function can(actor: Actor | null, permission: Permission): boolean {
  if (!actor || !actor.isActive) return false
  return ROLE_PERMISSIONS[actor.role].includes(permission)
}

export function assertCan(actor: Actor | null, permission: Permission): void {
  if (!can(actor, permission)) {
    throw new AppError('FORBIDDEN', "Vous n'avez pas les droits nécessaires pour cette action.")
  }
}
```

> Écrire les listes **en toutes lettres**, sans génération par boucle. Une matrice de
> droits doit se relire ligne à ligne pour être auditable.

### 2.4 `src/core/shared/slug.ts`

`slugify()` doit gérer les accents français et les cas réels du projet :
`"Protection de l'environnement"` → `protection-de-l-environnement`,
`"Éducation"` → `education`. Normalisation `NFD` + suppression des diacritiques,
apostrophes converties en tirets, tirets consécutifs réduits, longueur max 80.

### 2.5 Icônes et teintes — la décision à ne pas rater

Le contenu actuel stocke des **composants React** (`icon: GraduationCap`). Une base ne
stocke qu'une **chaîne**. Il faut donc un registre d'icônes côté présentation :

```ts
// src/components/ui-ext/icon-registry.ts   (couche présentation, pas core/)
import { GraduationCap, Stethoscope, /* … */ type LucideIcon } from 'lucide-react'

export const ICONS = { GraduationCap, Stethoscope, /* … */ } as const
export type IconName = keyof typeof ICONS
export const ICON_NAMES = Object.keys(ICONS) as IconName[]

export function getIcon(name: string): LucideIcon {
  return ICONS[name as IconName] ?? ICONS.Sparkles   // repli, jamais de page cassée
}
```

Le registre contient **au minimum** les **21 icônes réellement utilisées** aujourd'hui
dans `src/content/` (liste vérifiée, à reprendre telle quelle) :
`Accessibility`, `Briefcase`, `CalendarDays`, `Globe`, `GraduationCap`, `HandHeart`,
`Handshake`, `HardHat`, `HeartHandshake`, `HeartPulse`, `Landmark`, `Layers`,
`Leaf`, `Lightbulb`, `Rocket`, `ShieldCheck`, `Sprout`, `Stethoscope`, `Target`,
`TrendingUp`, `Users`
— plus **`Sparkles`**, qui n'est pas utilisée actuellement et sert uniquement d'icône
de repli pour `getIcon()`. Soit 22 entrées au total.

> **Ne pas importer `lucide-react` dynamiquement par nom.** Un import dynamique casse le
> tree-shaking et embarquerait le millier d'icônes de la bibliothèque dans le bundle. Le
> registre explicite est la seule option correcte.

`MediaTone` est réutilisé tel quel depuis
`src/components/media/media-placeholder.tsx` — ne pas le redéfinir.

### 2.6 Schémas Zod

Un fichier par entité dans `src/core/cms/schemas/`. Ils **reprennent et étendent** les
contraintes déjà exprimées dans `src/lib/schemas.ts` (le projet est en **Zod 4**,
respecter sa syntaxe : `z.enum(tab, { message })`).

Pour chaque entité, trois schémas dérivés : `<entity>Schema` (forme complète),
`create<Entity>Schema` (sans `id`/timestamps), `update<Entity>Schema` (partiel + `id`).

### 2.7 Ports

```ts
// src/core/cms/ports/programme.port.ts
export interface ProgrammeReadPort {
  findAll(filter?: ListFilter): Promise<Programme[]>
  findBySlug(slug: string): Promise<Programme | null>
  findById(id: string): Promise<Programme | null>
  count(filter?: ListFilter): Promise<number>
}

export interface ProgrammeWritePort {
  create(input: CreateProgramme): Promise<Programme>
  update(id: string, input: UpdateProgramme): Promise<Programme>
  delete(id: string): Promise<void>
  reorder(orderedIds: string[]): Promise<void>
  setStatus(id: string, status: ContentStatus): Promise<Programme>
}
```

Lecture et écriture séparées (principe I de SOLID) : une requête publique ne reçoit
jamais un port capable d'écrire.

### 2.8 Cas d'usage

Un fichier, une intention, les ports en paramètres :

```ts
// src/core/use-cases/programmes/create-programme.ts
export async function createProgramme(
  deps: { read: ProgrammeReadPort; write: ProgrammeWritePort },
  input: CreateProgramme,
): Promise<Result<Programme>> {
  const slug = input.slug?.trim() || slugify(input.title)
  if (await deps.read.findBySlug(slug)) {
    return err(new AppError('CONFLICT',
      `L'adresse « ${slug} » est déjà utilisée par un autre programme.`,
      { slug: 'Cette adresse est déjà prise.' }))
  }
  return ok(await deps.write.create({ ...input, slug }))
}
```

### Recette du Lot 2

- [ ] `src/core/` ne contient **aucun** import de `next`, `@supabase/*`, `react`,
      `@/infrastructure`, `@/app`, `@/components`. ESLint le confirme.
- [ ] `can({ role: 'editor', isActive: true }, 'programme:publish')` → `false`.
- [ ] `can({ role: 'admin', isActive: true }, 'user:update')` → `false`.
- [ ] `can({ role: 'editor', isActive: false }, 'programme:read')` → `false`.
- [ ] `slugify("Protection de l'environnement")` → `"protection-de-l-environnement"`.
- [ ] `slugify("Éducation")` → `"education"`.
- [ ] Le registre d'icônes couvre les 22 icônes ; `getIcon("Inconnue")` renvoie le repli.
- [ ] Les cas d'usage sont testables avec un port en mémoire, sans base.

---

# Lot 3 — Infrastructure Supabase

**Objectif.** Implémenter les ports. Aucune interface utilisateur.

### 3.1 Les quatre fabriques — `src/infrastructure/supabase/clients/`

Chaque fichier commence par un commentaire d'en-tête décrivant son usage **et ses
interdictions** (décision D7 du Rapport 1).

| Fichier | Export | Cookies | Interdiction |
|---|---|---|---|
| `browser.ts` | `createBrowserClient()` | oui | jamais côté serveur |
| `server.ts` | `createServerClient()` | **oui** | ⚠️ **jamais dans un scope `'use cache'`** |
| `public.ts` | `createPublicClient()` | **non** | jamais pour lire du contenu non publié |
| `admin.ts` | `createAdminClient()` | non | `import 'server-only'` en tête ; usage limité aux 4 cas listés ci-dessous |

```ts
// src/infrastructure/supabase/clients/server.ts
import { cookies } from 'next/headers'
import { createServerClient as createSSRClient } from '@supabase/ssr'

export async function createServerClient() {
  const cookieStore = await cookies()          // await obligatoire (Next.js 16)
  return createSSRClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) }
          catch { /* appelé depuis un Server Component : le rafraîchissement est fait par proxy.ts */ }
        },
      },
    },
  )
}
```

```ts
// src/infrastructure/supabase/clients/public.ts
import { createClient } from '@supabase/supabase-js'

/**
 * Client SANS cookies — le seul utilisable dans un scope `'use cache'`.
 * S'authentifie comme `anon` : la RLS ne lui laisse voir que le contenu publié.
 */
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}
```

**Les quatre seuls usages autorisés de `createAdminClient()`**, à ne pas étendre sans
décision explicite : invitation d'un utilisateur, suppression d'un utilisateur,
écriture du journal d'audit, script de seed.

### 3.2 Mappers

`src/infrastructure/supabase/mappers/<entity>.mapper.ts` — deux fonctions par entité :

```ts
export function toProgramme(row: Tables<'programmes'>): Programme   // SQL → domaine
export function toProgrammeRow(input: CreateProgramme): TablesInsert<'programmes'>
```

Le mapper est le **seul** endroit où l'on passe de `snake_case` à `camelCase`. Aucun
composant ne doit jamais voir `cover_media_id`.

### 3.3 Repositories

`src/infrastructure/supabase/repositories/<entity>.repository.ts` — implémentent les
ports du Lot 2. Une erreur Supabase est traduite en `AppError` **avec un message
français** :

| Code PostgreSQL | `ErrorCode` | Message utilisateur |
|---|---|---|
| `23505` (unicité) | `CONFLICT` | « Cette adresse est déjà utilisée. » |
| `23503` (clé étrangère) | `CONFLICT` | « Cet élément est utilisé ailleurs et ne peut pas être supprimé. » |
| `42501` (RLS) | `FORBIDDEN` | « Vous n'avez pas les droits nécessaires. » |
| `PGRST116` (0 ligne) | `NOT_FOUND` | « Cet élément n'existe plus. » |
| autre | `UNEXPECTED` | « Une erreur technique est survenue. » |

### 3.4 Réordonnancement

`reorder(orderedIds)` doit s'exécuter **en une transaction**, sinon un échec en cours de
route laisse des positions incohérentes. PostgREST ne permet pas de transaction
multi-requêtes : créer une fonction SQL et l'appeler par RPC.

```sql
create or replace function public.reorder_rows(p_table text, p_ids uuid[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_table not in ('programmes','articles','team_members','testimonials',
                     'core_values','faq_items','stats','gallery_items',
                     'annual_reports','navigation_items','page_sections') then
    raise exception 'Table non autorisée.';
  end if;
  if not public.app_is_staff() then
    raise exception 'Droits insuffisants.';
  end if;
  execute format(
    'update %I t set position = x.ord
       from unnest($1) with ordinality as x(id, ord)
      where t.id = x.id', p_table
  ) using p_ids;
end $$;
```

> La liste blanche de tables et le contrôle de rôle sont **obligatoires** : `format(%I)`
> protège de l'injection d'identifiant, mais rien n'empêcherait sinon de réordonner
> `profiles`.

### 3.5 Storage

`src/infrastructure/storage/` : `upload`, `remove`, `getPublicUrl`, `getTransformedUrl`.
Le nom de fichier stocké est **régénéré** — `<uuid>.<ext>` — jamais le nom d'origine
(qui peut contenir des accents, des espaces ou une extension mensongère). Le nom
d'origine est conservé dans `media_assets.filename` pour l'affichage.

### Recette du Lot 3

- [ ] Un script `npm run db:types` régénère `database.types.ts`.
- [ ] Chaque port du Lot 2 a exactement une implémentation Supabase.
- [ ] `createAdminClient` n'est importé que dans les quatre fichiers autorisés
      (`grep -r "createAdminClient" src/` le confirme).
- [ ] Une violation d'unicité remonte `AppError('CONFLICT')` avec un message français.
- [ ] `reorder_rows('profiles', …)` échoue ; `reorder_rows('programmes', …)` réussit et
      renumérote de 1 à N.

---

# Lot 4 — Authentification, session et RBAC

**Objectif.** Se connecter, être reconnu, être filtré. Premier lot visible à l'écran.

### 4.1 Pages d'authentification — `src/app/(auth)/`

`layout.tsx` : écran centré, logo ADEBES (`src/components/brand/logo.tsx`), sans
`SiteHeader` ni `SiteFooter`.

| Route | Contenu |
|---|---|
| `/connexion` | E-mail + mot de passe, lien « mot de passe oublié », erreurs en français |
| `/mot-de-passe-oublie` | E-mail → envoi du lien de réinitialisation |
| `/reinitialiser-mot-de-passe` | Nouveau mot de passe (min. 12 caractères) + confirmation |

Ces formulaires reprennent le patron exact des formulaires existants :
`react-hook-form` + `zodResolver` + `Field`/`fieldAria` + `toast` de `sonner`.

**Messages d'erreur** — traduits, jamais l'anglais brut de Supabase :

| Supabase | Affiché |
|---|---|
| `Invalid login credentials` | « E-mail ou mot de passe incorrect. » |
| `Email not confirmed` | « Votre compte n'est pas encore activé. Vérifiez votre boîte mail. » |
| compte désactivé (`is_active = false`) | « Votre accès a été désactivé. Contactez un administrateur. » |

### 4.2 Refonte du layout racine — étape obligatoire

C'est le point le plus délicat du lot. Ordre à respecter :

1. Créer `src/app/(site)/layout.tsx` et y **déplacer** `SiteHeader`, `<main id="contenu">`,
   `SiteFooter`, `StickyMobileActionBar` et le lien d'évitement « Aller au contenu
   principal ».
2. Déplacer dans `src/app/(site)/` les 14 dossiers de routes publiques :
   `page.tsx`, `a-propos/`, `biographie/`, `programmes/`, `actualites/`, `galerie/`,
   `impact/`, `don/`, `benevolat/`, `contact/`, `mentions-legales/`,
   `politique-confidentialite/`.
3. **Laisser à la racine `src/app/`** : `layout.tsx`, `globals.css`, `robots.ts`,
   `sitemap.ts`, `manifest.ts`, `not-found.tsx`, `global-error.tsx`, `error.tsx`,
   `actions/`, `api/`.
4. Réduire `src/app/layout.tsx` à : `<html>`, polices `Inter`/`Sora`, `<body>`,
   `ThemeProvider`, `Toaster`, le bloc `<noscript>` des animations. Conserver
   `metadata` et `viewport` tels quels.
5. Lancer `npx next typegen` et corriger les types de layout si nécessaire.

> **Les URL publiques ne changent pas** — un route group entre parenthèses n'apparaît
> jamais dans l'URL. Vérifier néanmoins les 29 routes une par une après déplacement.

### 4.3 `proxy.ts` — à la racine du projet

**Pas `middleware.ts`.** Racine du dépôt, au même niveau que `src/`.

```ts
// proxy.ts
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  // 1. Rafraîchir la session Supabase (obligatoire : sans cela, les jetons expirent)
  // 2. Contrôle OPTIMISTE : lecture du cookie / claim JWT uniquement — AUCUNE requête base
  // 3. /dashboard sans session          → redirection /connexion?suivant=<chemin>
  // 4. /connexion avec session valide   → redirection /dashboard
  // 5. Sinon : NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|documents|.*\\.(?:svg|png|jpg|jpeg|webp|avif|pdf)$).*)'],
}
```

Trois rappels : le fichier s'appelle `proxy.ts`, la fonction s'appelle `proxy`, le
runtime est Node.js et n'est pas configurable.

### 4.4 Le DAL — `src/server/dal/`

```ts
// src/server/dal/session.ts
import 'server-only'
import { cache } from 'react'

/** Mémoïsé sur la durée du rendu : appelable partout sans multiplier les requêtes. */
export const getCurrentActor = cache(async (): Promise<Actor | null> => {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()   // getUser, pas getSession
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, is_active, avatar_media_id')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.is_active) return null
  return toActor(profile)
})

export async function requireActor(): Promise<Actor> {
  const actor = await getCurrentActor()
  if (!actor) redirect('/connexion')
  return actor
}

export async function requirePermission(permission: Permission): Promise<Actor> {
  const actor = await requireActor()
  if (!can(actor, permission)) redirect('/dashboard?erreur=droits-insuffisants')
  return actor
}
```

> `auth.getUser()` et non `auth.getSession()` : `getSession()` lit le cookie sans le
> valider auprès du serveur d'authentification. Pour une décision d'autorisation, seul
> `getUser()` fait foi.

### 4.5 `createAction` — `src/server/action-kit/create-action.ts`

Implémenter exactement le contrat et l'ordre d'exécution du §6 du Rapport 1 (rate limit
→ session → permission → validation → handler → audit → invalidation).

### Recette du Lot 4

- [ ] Les 29 routes publiques répondent après le déplacement en `(site)`, en-tête et pied
      de page intacts.
- [ ] `/dashboard` sans session redirige vers `/connexion?suivant=/dashboard`.
- [ ] Connexion réussie → redirection vers la valeur de `suivant`.
- [ ] `/connexion` avec session valide redirige vers `/dashboard`.
- [ ] Le dashboard n'affiche ni `SiteHeader` ni `SiteFooter`.
- [ ] Un compte `is_active = false` est refusé avec le message dédié.
- [ ] Une Server Action de test protégée par `permission: 'settings:update'`, appelée par
      un `editor`, renvoie `{ ok: false, code: 'FORBIDDEN' }` — **et non une exception**.
- [ ] La session survit à un rechargement complet et à 1 h d'inactivité.
- [ ] `grep -r "middleware" --include="*.ts" .` ne remonte rien dans le code du projet.

---

# Lot 5 — Coquille du dashboard

**Objectif.** La structure de navigation, vide mais complète et responsive.

### 5.1 Fichiers

| Fichier | Rôle |
|---|---|
| `src/app/(dashboard)/dashboard/layout.tsx` | `await requireActor()` puis `<DashboardShell>` |
| `src/components/dashboard/layout/dashboard-shell.tsx` | Assemblage |
| `src/components/dashboard/layout/sidebar.tsx` | Navigation principale |
| `src/components/dashboard/layout/topbar.tsx` | Fil d'Ariane, thème, menu utilisateur |
| `src/components/dashboard/layout/page-header.tsx` | Titre + description + actions |
| `src/lib/dashboard-navigation.ts` | Déclaration de la navigation |
| `src/hooks/use-breakpoint.ts` | `useIsDesktop()` — **seul** endroit du dépôt où un point de rupture est lu en JavaScript (§12 du Rapport 1, règle 9) |

### 5.2 Navigation, filtrée par permissions

```ts
export type DashboardNavItem = {
  label: string
  href: string
  icon: IconName
  permission: Permission          // masque l'entrée si l'utilisateur ne l'a pas
  group: 'contenu' | 'apparence' | 'administration'
}
```

| Groupe | Entrées |
|---|---|
| **Contenu** | Tableau de bord · Pages · Programmes · Actualités · Galerie · Équipe · Témoignages · Questions fréquentes · Chiffres clés · Documents · Médiathèque · Messages |
| **Apparence** | Navigation · Thème |
| **Administration** | Réglages · Utilisateurs · Journal d'activité |

Une entrée dont l'utilisateur n'a pas la permission `read` n'est **pas rendue** — ni
grisée, ni masquée en CSS. Un éditeur ne doit pas voir « Utilisateurs ».

### 5.3 Comportement responsive — le socle de tous les lots suivants

C'est ici que la responsivité du dashboard est **mise en place une fois pour toutes** :
les lots suivants s'y branchent, ils ne la refont pas. Le contrat de référence est le
§12 du Rapport 1.

**Sidebar**

| Largeur | Comportement |
|---|---|
| `≥ 1024px` (`lg:`) | fixe, 264 px, rétractable à 72 px (icônes seules), état mémorisé en `localStorage` ; en mode rétracté chaque icône porte un `aria-label` **et** un `Tooltip` — jamais le `Tooltip` seul |
| `< 1024px` | masquée ; ouverte par un bouton dans un `Sheet` gauche (déjà présent dans `ui/`), **fermée automatiquement à la navigation**, `h-dvh`, focus renvoyé au bouton d'ouverture à la fermeture |

**Topbar**

| Largeur | Comportement |
|---|---|
| `< 768px` | hauteur 56 px : bouton menu · titre court de la page · menu utilisateur. Fil d'Ariane masqué (il est redondant avec le titre) |
| `768–1023px` | fil d'Ariane tronqué : « … / niveau courant » |
| `≥ 1024px` | fil d'Ariane complet, sélecteur de thème, menu utilisateur |

**Structure de la coquille**

- `<DashboardShell>` : `min-h-dvh`, **jamais** `min-h-screen` (`100vh` coupe le bas sur
  mobile — §12, règle 5).
- Zone de contenu : `px-4 sm:px-6 lg:px-8`, bornée par `max-w-screen-2xl mx-auto`.
- `<PageHeader>` : sous `sm:`, titre puis actions **empilées pleine largeur**, l'action
  primaire en premier ; à partir de `sm:`, titre à gauche et actions à droite.
- Le contenu principal ne porte **aucun** `min-width` : la règle « zéro défilement
  horizontal de page à 320 px » est vérifiable dès ce lot, alors que les écrans sont
  encore vides.

**Ce qui disparaît du dashboard.** Le dashboard **n'a pas** de `StickyMobileActionBar` —
ce composant est propre au site public (boutons « Faire un don » / « Bénévolat »).
Retirer aussi `pb-action-bar` du `<body>` pour les routes du dashboard : cette classe est
dimensionnée pour la barre du site public et créerait un espace mort en bas de chaque
écran. Les barres fixes propres au dashboard (enregistrement, actions groupées)
recalculent leur propre `env(safe-area-inset-bottom)`.

### 5.4 Tableau de bord d'accueil

Six tuiles de comptage (programmes publiés, articles, brouillons en attente, messages
non lus, médias, dernière publication), les 5 dernières entrées du journal, et un bloc
« À compléter » listant les champs encore à `[À COMPLÉTER]` dans les réglages — la
continuité directe de `CONTENU-A-COMPLETER.md`.

### Recette du Lot 5

- [ ] `/dashboard` s'affiche, sidebar complète, utilisateur identifié en bas de sidebar.
- [ ] Connecté en `editor` : « Utilisateurs », « Réglages », « Journal », « Thème »
      sont **absents du DOM** (vérifier dans l'inspecteur, pas seulement à l'œil).
- [ ] En dessous de 1024 px, la sidebar passe en tiroir et se ferme à la navigation.
- [ ] L'état rétracté survit à un rechargement.
- [ ] Le sélecteur de thème clair/sombre fonctionne dans le dashboard.
- [ ] Toutes les cibles cliquables font au moins 44 px de haut.
- [ ] Navigation complète au clavier, focus visible partout.
- [ ] **Aux 5 largeurs (320 · 390 · 768 · 1024 · 1440 px)** :
      `document.documentElement.scrollWidth === window.innerWidth` — aucun défilement
      horizontal de page.
- [ ] À 390 px, le tiroir occupe toute la hauteur visible **sans être coupé** par la
      barre d'adresse (`h-dvh` effectif, pas `h-screen`).
- [ ] La sidebar rétractée à 72 px reste utilisable au clavier et au lecteur d'écran
      (chaque icône a un `aria-label`).
- [ ] `grep -rn "min-h-screen\|h-screen\|100vh" src/components/dashboard/ src/app/\(dashboard\)/`
      ne renvoie rien.
- [ ] `grep -rn "window.innerWidth\|matchMedia" src/ --include=*.tsx --include=*.ts`
      ne renvoie que `src/hooks/use-breakpoint.ts`.
- [ ] `pb-action-bar` n'est plus appliqué sur les routes du dashboard (inspecteur :
      aucun espace mort en bas d'écran).

---

# Lot 6 — Design system du dashboard

**Objectif.** Compléter le socle des huit composants réutilisables du §12 du Rapport 1.
Aucun écran métier n'est écrit avant que ce lot soit fini — c'est ce qui garantit la
cohérence de tout le reste.

**Répartition des huit composants sur trois lots** — ce lot en livre six :

| Composant | Lot |
|---|---|
| `<DashboardShell>`, `<PageHeader>` | déjà livrés au **Lot 5** |
| `<DataTable>`, `<SchemaForm>`, `<FormModal>`, `<ConfirmDialog>`, `<StatusBadge>`, `<EmptyState>` | **ce lot** |
| `<MediaPicker>` | **Lot 7** (dépend de la médiathèque) |

Le champ `kind: 'media'` de `<SchemaForm>` est donc livré ici avec un **emplacement
provisoire** (bouton inactif portant la mention « disponible au Lot 7 »), branché sur
`<MediaPicker>` dès le Lot 7. Ne pas différer `<SchemaForm>` pour autant.

### 6.1 `<DataTable>` — `src/components/dashboard/data-table/`

```ts
export type Column<T> = {
  key: string
  header: string
  cell: (row: T) => ReactNode
  sortable?: boolean
  width?: string
  /** Masquée sous 768 px — la ligne devient une carte empilée. */
  hideOnMobile?: boolean
}

export type DataTableProps<T> = {
  data: T[]
  columns: Column<T>[]
  getRowId: (row: T) => string
  isLoading?: boolean
  error?: string
  emptyState: { title: string; description: string; action?: ReactNode }
  search?: { placeholder: string; keys: (keyof T)[] }
  filters?: FilterDescriptor[]
  pagination?: { pageSize: number }
  selection?: { onBulk: (ids: string[], action: BulkAction) => void }
  reorder?: { onReorder: (orderedIds: string[]) => Promise<void> }
  rowActions?: (row: T) => RowAction[]
}
```

Quatre états obligatoires, tous conçus : **chargement** (squelettes, pas de spinner
seul), **vide** (titre + explication + bouton d'action), **erreur** (message + bouton
« Réessayer »), **rempli**. Les squelettes existent **dans les deux formes** — cartes
sous 768 px, lignes de tableau au-dessus — sinon le chargement provoque un saut de mise
en page à chaque affichage mobile.

**Bascule tableau ⇄ cartes.** En dessous de 768 px, le tableau se transforme en **liste
de cartes** — un tableau à défilement horizontal est inutilisable sur mobile, la colonne
d'identification sortant de l'écran. Chaque carte porte :

| Emplacement | Contenu |
|---|---|
| Ligne 1 | colonne primaire (titre) + `<StatusBadge>` |
| Ligne 2 | deux métadonnées au maximum (date de modification, catégorie) |
| Coin | menu d'actions (`DropdownMenu`), cible ≥ 44 px |
| Bord gauche | poignée de réordonnancement si `reorder` est activé |

`Column<T>` porte déjà `hideOnMobile`. Deux précisions à respecter :
`hideOnMobile` masque la colonne entre 768 px et 1024 px ; **sous 768 px, ce sont les
deux premières colonnes non masquées qui alimentent la carte** — la structure du tableau
n'est pas rendue du tout, pas seulement masquée en CSS. Rendre les deux formes en
parallèle et en cacher une doublerait le DOM et les lecteurs d'écran liraient tout deux
fois.

**Barre de recherche, filtres, pagination**

| Élément | < 768 px | ≥ 768 px |
|---|---|---|
| Recherche | pleine largeur, toujours visible | intégrée à la barre d'outils |
| Filtres | bouton « Filtrer » ouvrant un `Sheet`, avec un compteur de filtres actifs | barre de filtres en ligne |
| Actions groupées | barre fixée en bas + `env(safe-area-inset-bottom)` | barre sous l'en-tête du tableau |
| Pagination | « Précédent / Suivant » + « page X sur Y », boutons 44 px | pagination numérotée complète |

**Réordonnancement tactile.** `PointerSensor` avec contrainte d'activation (8 px ou
200 ms), `KeyboardSensor` activé, **et** une alternative « Monter » / « Descendre » dans
le menu d'actions de chaque ligne — sans elle, réordonner au téléphone est impossible
(§12 du Rapport 1).

### 6.2 `<SchemaForm>` — `src/components/dashboard/forms/`

Génère un formulaire à partir de `FieldDescriptor[]` (§10 du Rapport 1). Un composant de
champ par `kind`, tous construits sur `Field` et `fieldAria` de
`src/components/forms/field.tsx` — **ne pas réécrire l'accessibilité déjà en place**.

| `kind` | Composant | Notes |
|---|---|---|
| `text`, `textarea` | `Input`, `Textarea` | compteur si `maxLength` |
| `richtext` | zone multi-paragraphes | v1 : une ligne par paragraphe, stockée en `string[]` — la forme exacte de `Actualite.body` |
| `number` | `Input type=number` | si `nullable`, case « pas encore disponible » qui écrit `null` |
| `boolean` | `Checkbox` | |
| `select` | `Select` | |
| `media` | `MediaPicker` | aperçu + bouton « Remplacer » |
| `link` | `Input` + validation | avertit si lien externe |
| `icon` | grille d'icônes cherchables | depuis `ICON_NAMES` |
| `tone` | 5 pastilles de couleur | depuis `MediaTone` |
| `list` | liste ordonnable | ajout / suppression / glisser-déposer ; sert à `actions[]`, `publics[]`, `besoins[]`, `bullets[]` |
| `reference` | sélecteur d'entité | recherche + chargement paresseux |

**Mise en page du formulaire**

- Une seule colonne sous `md:`, deux colonnes **au maximum** à partir de `lg:` — jamais
  trois. Les champs longs (`textarea`, `richtext`, `list`) occupent toujours la largeur
  entière.
- Largeur bornée à `max-w-3xl` : un formulaire étiré sur un écran 1440 px oblige à
  balayer l'écran des yeux de gauche à droite pour chaque champ.
- **`text-base` sous `md:`, `text-sm` au-delà** pour `Input`, `Textarea` et `Select`. En
  deçà de 16 px, iOS Safari zoome à la mise au point et casse la mise en page (§12 du
  Rapport 1, règle 7). Point à traiter dans `src/components/ui/` **sans** modifier le
  comportement des formulaires du site public : appliquer la classe au niveau des champs
  du dashboard, pas dans la primitive partagée.
- Barre d'enregistrement : `sticky bottom-0` avec `env(safe-area-inset-bottom)` sous
  `lg:`, bouton pleine largeur ; intégrée au `<PageHeader>` au-delà. Le bouton
  « Enregistrer » ne doit **jamais** exiger de faire défiler un long formulaire jusqu'en
  bas sur un téléphone.
- Les grilles de choix (`icon`, `tone`) s'adaptent : 4 colonnes sous `sm:`, 6 à 8
  au-delà, chaque pastille ≥ 44 px.
- La liste ordonnable (`list`) reprend les trois exigences tactiles du `<DataTable>`
  (contrainte d'activation, clavier, boutons monter/descendre).

### 6.3 `<FormModal>` et `<ConfirmDialog>`

- `FormModal` : `Dialog` en desktop, `Sheet` plein écran en mobile. **Détecte
  `formState.isDirty` et confirme avant fermeture.** Fermeture par Échap, clic extérieur
  et croix — les trois passent par la même confirmation.
- `ConfirmDialog` : nomme l'élément (« Supprimer le programme *Éducation* ? »), explique
  la conséquence (« Cette action est définitive. »), verbe d'action sur le bouton
  (« Supprimer »), variante `destructive`.

**Bascule `Dialog` ⇄ `Sheet`.** C'est la seule bascule que le CSS ne peut pas faire :
elle passe par `useIsDesktop()` (Lot 5), et par lui seul. Le hook doit rendre une valeur
**stable au premier rendu serveur** — sans cela, l'hydratation diffère et la modale
clignote. Retenu : valeur initiale `false` (mobile d'abord), corrigée après montage ;
la modale n'étant jamais ouverte au chargement, la correction est invisible.

Comportement attendu :

| | < 1024 px | ≥ 1024 px |
|---|---|---|
| `FormModal` | `Sheet` plein écran, `h-dvh`, en-tête et pied **fixes**, corps seul défilant | `Dialog` centré, `max-w-2xl`, `max-h-[85dvh]`, corps défilant |
| `ConfirmDialog` | `Dialog` recentré, boutons **empilés pleine largeur**, action destructive en dernier (évite l'appui réflexe) | boutons alignés à droite, ordre habituel |

Le pied fixe du `Sheet` est ce qui rend le formulaire utilisable au téléphone : sans lui,
« Enregistrer » se trouve au-delà de dix champs de défilement.

### 6.4 `<StatusBadge>` et `<EmptyState>`

`StatusBadge` — couleur **et** libellé, jamais la couleur seule :

| Statut | Libellé | Variante |
|---|---|---|
| `draft` | Brouillon | `secondary` |
| `in_review` | À relire | `outline` + teinte orange |
| `published` | En ligne | teinte verte (`--success`) |
| `archived` | Archivé | `secondary` atténué |

### 6.5 Page de démonstration

Créer `/dashboard/_demo` (non listée dans la navigation) montrant les huit composants
dans tous leurs états. Elle sert de référence visuelle et de test manuel ; elle est
supprimée au Lot 16.

Elle sert aussi de **banc d'essai responsive** : c'est sur cette page que la matrice des
cinq largeurs (§12 du Rapport 1) est parcourue une première fois, avant qu'aucun écran
métier n'existe. Un défaut trouvé ici se corrige une fois ; le même défaut trouvé au
Lot 8I se corrige neuf fois.

### Recette du Lot 6

- [ ] Les 6 composants de ce lot existent et sont exercés sur `/dashboard/_demo`, aux
      côtés de `<DashboardShell>` et `<PageHeader>` livrés au Lot 5.
- [ ] `<DataTable>` affiche correctement ses 4 états.
- [ ] En dessous de 768 px, le tableau devient des cartes lisibles sans défilement
      horizontal.
- [ ] Modifier un champ puis presser Échap déclenche la confirmation ; fermer sans
      modifier ne la déclenche pas.
- [ ] `<SchemaForm>` rend les 11 types de champs et remonte les erreurs Zod sur le bon
      champ.
- [ ] Un champ `number` avec `nullable` permet d'enregistrer `null` — et l'affiche
      comme « pas encore disponible ».
- [ ] Formulaire entièrement utilisable au clavier ; l'erreur est annoncée par le lecteur
      d'écran (`role="alert"` hérité de `Field`).
- [ ] Contraste AA vérifié en clair et en sombre.

**Recette responsive du Lot 6** — parcourue sur `/dashboard/_demo` aux 5 largeurs :

- [ ] 320 / 390 / 768 / 1024 / 1440 px : aucun défilement horizontal de page.
- [ ] À 767 px le `<DataTable>` rend des **cartes**, à 768 px un **tableau** ; la
      structure `<table>` n'est pas présente dans le DOM sous 768 px (inspecteur).
- [ ] Les squelettes de chargement existent dans les deux formes, sans saut de mise en
      page à l'arrivée des données.
- [ ] À 390 px, `<FormModal>` s'ouvre en `Sheet` plein écran, en-tête et pied restent
      visibles pendant le défilement du corps.
- [ ] Aucun clignotement de modale à l'ouverture (valeur SSR stable de `useIsDesktop`).
- [ ] Sur téléphone réel ou en émulation tactile, la mise au point dans un champ **ne
      déclenche pas de zoom** (police ≥ 16 px).
- [ ] Le glisser-déposer d'une liste ne se déclenche pas lors d'un simple défilement au
      doigt, et l'alternative « Monter / Descendre » fonctionne.
- [ ] Les actions groupées restent atteignables sur téléphone (barre fixe au-dessus de la
      zone sûre, non masquée par la barre système).
- [ ] Zoom navigateur à 200 % sur `/dashboard/_demo` : aucune fonctionnalité perdue
      (WCAG 1.4.4).

---

# Lot 7 — Médiathèque

**Objectif.** Téléverser, organiser, choisir des images et des documents.

### 7.1 Écran `/dashboard/mediatheque`

Grille de vignettes, filtres par type et par dossier, recherche sur `filename`,
`alt_text` et `caption`. Panneau latéral de détail : aperçu, dimensions, poids, date,
auteur, **texte alternatif éditable**, légende, liste des usages, suppression.

**Responsive :** grille 2 colonnes sous `sm:`, 3–4 en tablette, 5–6 au-delà, avec une
borne haute pour éviter les vignettes minuscules sur grand écran. Vignettes en
`aspect-square object-cover` — une grille d'images de proportions libres devient illisible
en deux colonnes. Le panneau de détail est un **`Sheet` plein écran sous 1024 px** (le
téléphone n'a pas la place d'afficher grille et détail côte à côte) et un panneau latéral
au-delà.

### 7.2 Téléversement

- Glisser-déposer ou sélection, multi-fichiers.
- **Validation côté serveur obligatoire** : type MIME réel, taille (8 Mo images /
  20 Mo PDF), dimensions minimales pour les images de couverture (1200×630 recommandé,
  avertissement en deçà).
- **Le texte alternatif est exigé avant l'enregistrement.** Le bouton reste désactivé
  tant qu'il est vide. `media_assets.alt_text` est `not null` : le respecter dès l'UI
  plutôt que d'échouer côté base.
- Compression côté client avant envoi (canvas, qualité 0,85, largeur max 2400 px) —
  déterminant sur une connexion camerounaise.

### 7.3 `<MediaPicker>`

Modale à deux onglets : « Médiathèque » (parcourir/chercher) et « Téléverser ». Filtrée
par `accept`. Renvoie un `mediaId`, jamais une URL — la résolution en URL est faite au
rendu, ce qui permet de déplacer le stockage sans réécrire le contenu.

**Responsive :** `Sheet` plein écran sous 1024 px, `Dialog` au-delà — même bascule que
`<FormModal>`, même hook. Sur mobile, le bouton « Choisir » reste fixé en bas de la
feuille, au-dessus de la zone sûre. L'entrée « Prendre une photo » est offerte par
`<input type="file" accept="image/*" capture="environment">` : c'est le geste naturel
d'un utilisateur au téléphone, et cela ne coûte qu'un attribut.

### 7.4 Composant de rendu public

`src/components/media/cms-image.tsx` : reçoit un `MediaAsset`, rend `next/image` avec
l'URL Supabase, `sizes` explicite, `alt` issu de la base. Repli sur `MediaPlaceholder`
(déjà existant) si l'asset est absent — le comportement actuel du site est préservé.

### Recette du Lot 7

- [ ] Téléverser une image de 5 Mo réussit ; une de 12 Mo est refusée avec un message clair.
- [ ] Un `.exe` renommé en `.jpg` est refusé (contrôle du MIME réel, pas de l'extension).
- [ ] Impossible d'enregistrer sans texte alternatif.
- [ ] L'image téléversée s'affiche dans une page publique via `next/image` **sans
      erreur de domaine** — si erreur, revoir `remotePatterns` (Lot 0.4).
- [ ] Supprimer un média utilisé affiche la liste des usages et demande confirmation.
- [ ] Un `editor` peut téléverser mais pas supprimer.
- [ ] Le fichier stocké porte un nom régénéré (`<uuid>.<ext>`), pas le nom d'origine.
- [ ] À 390 px : la grille est lisible en 2 colonnes, le détail s'ouvre en plein écran,
      le texte alternatif est saisissable sans que le clavier virtuel masque le champ.
- [ ] Le téléversement fonctionne depuis l'appareil photo d'un téléphone
      (`capture="environment"`), avec compression client avant envoi.
- [ ] Aux 5 largeurs : aucun défilement horizontal, bouton « Choisir » toujours
      atteignable.

---

# Lot 8A — Programmes, de bout en bout *(implémentation de référence)*

**Objectif.** Une collection **complètement** terminée : base → repository → cas d'usage
→ actions → dashboard → site public. Ce lot est le gabarit des huit suivants : sa
qualité détermine la leur.

### 8A.1 Chaîne complète à livrer

| Couche | Fichier |
|---|---|
| Domaine | `src/core/cms/entities/programme.ts`, `src/core/cms/schemas/programme.schema.ts` |
| Port | `src/core/cms/ports/programme.port.ts` |
| Cas d'usage | `src/core/use-cases/programmes/{list,get,create,update,delete,reorder,publish}-programme.ts` |
| Infrastructure | `mappers/programme.mapper.ts`, `repositories/programme.repository.ts` |
| Contrôleur (écriture) | `src/server/actions/programmes.actions.ts` |
| Contrôleur (lecture publique) | `src/server/queries/programmes.query.ts` |
| Dashboard | `src/app/(dashboard)/dashboard/programmes/{page,nouveau/page,[id]/page}.tsx` |
| Site public | `src/app/(site)/programmes/{page,[slug]/page}.tsx` branchés sur la base |

### 8A.2 Champs du formulaire

Repris **exactement** du type `Programme` de `src/content/programmes.ts` :

| Champ | Type | Obligatoire | Notes |
|---|---|---|---|
| `title` | `text` | ✅ | max 120 |
| `slug` | `text` | ✅ | proposé depuis le titre, modifiable, unicité vérifiée |
| `shortTitle` | `text` | ✅ | fils d'Ariane et cartes étroites |
| `summary` | `textarea` | ✅ | max 300 |
| `icon` | `icon` | ✅ | depuis `ICON_NAMES` |
| `tone` | `tone` | ✅ | 5 teintes |
| `actions` | `list` de `text` | ✅ | « Ce que nous faisons » |
| `publics` | `list` de `text` | ✅ | « À qui ce programme s'adresse » |
| `besoins` | `list` de `text` | ✅ | alimente les CTA don/bénévolat |
| `benevolatLabel` | `text` | ✅ | **alimente la liste du formulaire de bénévolat** |
| `coverMediaId` | `media` | ➖ | |
| `galleryMediaIds` | `media` multiple | ➖ | |
| `status` | interne | ✅ | via les boutons de publication |

> **Dépendance à ne pas manquer.** `src/lib/schemas.ts` construit aujourd'hui les
> domaines du formulaire de bénévolat depuis `programmes.map(p => p.benevolatLabel)`, en
> statique. Une fois les programmes en base, `volunteerSchema` doit valider contre la
> liste **dynamique**. Comme un schéma Zod partagé client/serveur ne peut pas être
> asynchrone, la solution retenue est : `domain: z.string().min(1)` côté schéma, et
> vérification d'appartenance à la liste **dans la Server Action**, avec un message
> dédié. Le composant reçoit la liste en props depuis un Server Component.

### 8A.3 Écran de liste

Colonnes : glissière de réordonnancement · Couverture · Titre · Adresse (`slug`) ·
Statut · Modifié le · Actions.
Filtres : statut, teinte. Recherche : titre et résumé.
Actions groupées : publier, dépublier, supprimer.
Bouton primaire : « Nouveau programme ».

### 8A.4 Actions serveur

```ts
export const createProgrammeAction = createAction({
  permission: 'programme:create',
  input: createProgrammeSchema,
  audit: { action: 'programme.create', entityType: 'programme' },
  invalidates: (p) => ['cms:programmes', `cms:programme:${p.slug}`, 'cms:page:accueil'],
  handler: ({ input }) => createProgramme(programmeDeps(), input),
})
```

Les cinq autres (`update`, `delete`, `reorder`, `publish`, `unpublish`) suivent le même
gabarit. **Aucune** n'est écrite hors de `createAction`.

`invalidates` doit inclure `'cms:page:accueil'` et `'cms:page:programmes'` : un
programme apparaît aussi dans le bloc `programmes-grid` de l'accueil.

### 8A.5 Bascule du site public

`src/app/(site)/programmes/page.tsx` et `[slug]/page.tsx` lisent désormais
`src/server/queries/programmes.query.ts` au lieu d'importer `src/content/programmes.ts`.

- `generateStaticParams` interroge la base pour les slugs publiés.
- `params` est une **Promesse** : `const { slug } = await params`.
- `generateMetadata` lit la même requête (mémoïsée par le cache).
- Un slug inconnu appelle `notFound()`.
- L'icône passe par `getIcon(programme.icon)`.

### Recette du Lot 8A

- [ ] Créer un programme depuis le dashboard le fait apparaître sur `/programmes` après
      publication — et **pas avant**.
- [ ] Le slug est proposé automatiquement, modifiable, et un doublon est refusé avec un
      message français sur le bon champ.
- [ ] Le réordonnancement par glisser-déposer persiste et se reflète sur le site.
- [ ] Un `editor` peut créer et modifier ; le bouton « Publier » est absent, et
      l'action directe renvoie `FORBIDDEN`.
- [ ] Supprimer un programme référencé par un témoignage affiche un message explicite,
      pas une erreur SQL.
- [ ] `/programmes/[slug]` affiche les 8 programmes migrés à l'identique du rendu actuel.
- [ ] Le formulaire de bénévolat propose les `benevolatLabel` **issus de la base**.
- [ ] Le journal d'audit contient une entrée par mutation.
- [ ] **Parcours complet réalisé au téléphone (390 px)** : lister → créer → remplir →
      enregistrer → publier, sans défilement horizontal ni action inaccessible. C'est le
      gabarit responsive des huit lots suivants autant que le gabarit fonctionnel.
- [ ] `npm run build` passe.

---

# Lots 8B → 8I — Les huit autres collections

**Objectif.** Répliquer 8A. Même chaîne, même qualité, mêmes critères. Chaque lot est
livré complet avant de passer au suivant.

| Lot | Collection | Route dashboard | Spécificités |
|---|---|---|---|
| **8B** | Actualités | `/dashboard/actualites` | `body: string[]` (un paragraphe par ligne) · catégories gérables · date de publication · temps de lecture **calculé** (200 mots/min) et modifiable · badge « Exemple » (`is_placeholder`) · partage |
| **8C** | Témoignages | `/dashboard/temoignages` | lien vers un programme · **avertissement de consentement affiché dans le formulaire** (règle absolue de `src/content/temoignages.ts` : aucune citation sans accord) |
| **8D** | Équipe | `/dashboard/equipe` | photo · rôle · bio courte · réordonnancement |
| **8E** | Valeurs | `/dashboard/valeurs` | 4 par défaut · icône + teinte · pas de statut (toujours visibles) |
| **8F** | Questions fréquentes | `/dashboard/faq` | `topic` (don/bénévolat/général) · `bullets[]` · **génère le JSON-LD `FAQPage`** |
| **8G** | Chiffres clés | `/dashboard/chiffres` | **`value` nullable** avec case « pas encore disponible » · `to_confirm` · note explicative |
| **8H** | Galerie | `/dashboard/galerie` | assemblage médiathèque + catégorie · remplace la lecture disque de `src/content/galerie.ts` |
| **8I** | Documents | `/dashboard/documents` | rapports annuels PDF · année · le lien public n'apparaît que si le fichier existe |

**Points d'attention par lot :**

- **8B** — La date de publication doit être saisissable dans le passé (migration
  d'articles anciens) comme dans le futur (publication programmée, Lot 12). Conserver
  `formatDate` existant côté rendu.
- **8C** — Une case à cocher obligatoire « La personne a donné son accord écrit pour la
  publication de cette citation » avant enregistrement. Ce n'est pas une lourdeur :
  c'est la règle écrite dans le code actuel.
- **8G** — La case « pas encore disponible » écrit `NULL` et le site affiche « — » avec
  la mention. **Ne jamais convertir `NULL` en `0`.** C'est l'invariant le plus important
  du projet.
- **8H** — La convention de nommage `categorie-NN.jpg` disparaît : la catégorie devient
  une colonne. Le fichier `legendes.json` est migré vers `media_assets.alt_text`.
- **8I** — Le comportement actuel (lien masqué si le PDF est absent) est conservé, la
  vérification portant désormais sur l'existence du média en base.

### Recette de chaque lot 8x

Identique à 8A, transposée. Un lot 8x n'est terminé que si :

- [ ] CRUD complet + réordonnancement + publication.
- [ ] La collection correspondante de `src/content/` n'est plus importée par aucune page.
- [ ] Le rendu public est **identique** à l'actuel pour les données migrées
      (comparaison visuelle avant/après).
- [ ] Les permissions `editor` / `admin` sont vérifiées.
- [ ] Écran de liste et formulaire vérifiés à 390 px et à 1440 px : cartes lisibles,
      formulaire complet, enregistrement atteignable sans défilement jusqu'en bas.
- [ ] `npm run build` passe.

---

# Lot 9 — Constructeur de pages et de sections

**Objectif.** La Famille B. Le lot le plus structurant du CMS.

### 9.1 Registre de blocs

`src/core/cms/blocks/` — un fichier par bloc, plus `registry.ts` qui les agrège. Les
**17 blocs** listés au §10 du Rapport 1, chacun avec `schema`, `defaults`, `fields`,
`Renderer`.

Chaque `Renderer` **réutilise les composants existants** — `PageHero`, `SectionHeading`,
`CTABanner`, `ProgrammeCard`, `NewsCard`, `StatCard`, `ValueCard`, `TestimonialCard`,
`FAQAccordion`, `Reveal`, `Container`. Aucun composant de rendu n'est réécrit : le bloc
n'est qu'un adaptateur entre un contenu JSONB validé et un composant déjà éprouvé.

### 9.2 Écran `/dashboard/pages`

Liste des pages, avec `is_system` signalé (non supprimables). Colonnes : Titre, Adresse,
Sections, Statut, Modifié le.

### 9.3 Écran `/dashboard/pages/[id]` — l'éditeur

Trois zones :

| Zone | Contenu |
|---|---|
| **Gauche** — arbre des sections | Liste ordonnable (`@dnd-kit`), icône + libellé du bloc, œil pour masquer, menu dupliquer/supprimer, bouton « + Ajouter une section » |
| **Centre** — édition | `<SchemaForm>` généré depuis `fields` du bloc sélectionné |
| **Droite** — réglages de page | Titre, adresse, métadonnées SEO, image de partage, statut, bouton « Prévisualiser » |

Le sélecteur de blocs est une modale groupée par `category`, avec pour chaque bloc son
icône, son libellé et sa description — un utilisateur non technique doit comprendre ce
qu'il ajoute avant de l'ajouter.

**Trois zones sur un téléphone : la bascule la plus délicate du CMS.** Trois colonnes
côte à côte n'existent qu'à partir de `xl:` (1280 px). En dessous, la même information
est répartie ainsi :

| Largeur | Mise en page |
|---|---|
| `< 768px` | **trois onglets** — « Sections » · « Contenu » · « Réglages ». Sélectionner une section bascule automatiquement sur l'onglet « Contenu » ; un bouton « ‹ Sections » y ramène. L'onglet actif est reflété dans l'URL (`?onglet=contenu`) pour survivre à un rechargement |
| `768–1279px` | deux zones : arbre des sections (largeur fixe) + édition ; les réglages de page passent dans un `Sheet` ouvert par un bouton « Réglages de la page » |
| `≥ 1280px` | les trois zones simultanées |

Deux points à ne pas manquer :

- **La barre d'action de la page** (Enregistrer · Prévisualiser · Publier) est commune
  aux trois onglets et reste fixe en bas sur mobile. Elle ne doit jamais dépendre de
  l'onglet affiché.
- **Le réordonnancement des sections** suit la règle tactile du Lot 6 : contrainte
  d'activation, clavier, et « Monter / Descendre » dans le menu de chaque section. Sur
  un téléphone, c'est cette alternative qui sera réellement utilisée.

Le sélecteur de blocs est un `Sheet` plein écran sous 1024 px, en une colonne de cartes
(icône + libellé + description), avec un champ de recherche fixé en haut ; les catégories
deviennent des sections de liste plutôt que des colonnes.

### 9.4 Rendu public

```tsx
// src/components/blocks/section-renderer.tsx
export function SectionRenderer({ section }: { section: PageSection }) {
  const descriptor = BLOCK_REGISTRY[section.blockType]
  if (!descriptor || !section.isVisible) return null

  const parsed = descriptor.schema.safeParse(section.content)
  if (!parsed.success) {
    // Contenu incohérent : la page ne casse pas, l'anomalie est journalisée
    // et signalée dans le dashboard. Rien n'est rendu.
    console.error(`[CMS] Section ${section.id} (${section.blockType}) invalide`, parsed.error)
    return null
  }
  return <descriptor.Renderer content={parsed.data} />
}
```

C'est la garantie du §16 du Rapport 1 : un JSONB corrompu par une évolution de schéma
n'entraîne jamais une page blanche en production.

### 9.5 Migration des pages existantes

Les 10 pages éditoriales sont converties en suites de sections, **section par section**,
en comparant le rendu avant/après. Le contenu textuel est repris tel quel depuis les
fichiers `.tsx` actuels — aucune reformulation.

### Recette du Lot 9

- [ ] Les 17 blocs sont enregistrés, chacun avec schéma, valeurs par défaut, champs et
      rendu.
- [ ] Ajouter, réordonner, masquer, dupliquer, supprimer une section fonctionne et
      persiste.
- [ ] Le formulaire d'un bloc est **entièrement généré** — aucun formulaire écrit à la
      main par bloc.
- [ ] Une section masquée disparaît du site mais reste dans le dashboard.
- [ ] Un `content` volontairement corrompu en base n'empêche pas la page de s'afficher.
- [ ] Une page `is_system` ne peut pas être supprimée (message clair, pas d'erreur SQL).
- [ ] Les 10 pages éditoriales migrées sont **visuellement identiques** à leur version
      actuelle.
- [ ] Ajouter un 18ᵉ bloc de test ne demande qu'un fichier + une entrée de registre —
      le vérifier réellement, puis retirer le bloc de test.
- [ ] À 390 px, l'éditeur est **entièrement exploitable en onglets** : ajouter une
      section, la remplir, la réordonner, l'enregistrer et prévisualiser sans jamais
      faire défiler la page latéralement.
- [ ] L'onglet actif survit à un rechargement (`?onglet=`).
- [ ] La barre d'action (Enregistrer / Prévisualiser / Publier) reste visible sur
      téléphone quel que soit l'onglet.
- [ ] À 1279 px on voit deux zones, à 1280 px trois — vérifié au pixel.
- [ ] Le rendu public de chaque bloc est vérifié aux 5 largeurs : c'est le site public
      qui est en jeu, pas seulement le dashboard.

---

# Lot 10 — Réglages du site

**Objectif.** La Famille C. Tout ce qui vient aujourd'hui de `src/lib/site-config.ts` et
`src/lib/navigation.ts`.

### 10.1 Écrans

| Route | Groupe | Champs |
|---|---|---|
| `/dashboard/reglages/identite` | `identity` | `name`, `legalName`, `motto`, `tagline`, `description`, `foundingYear`, logo, favicon |
| `/dashboard/reglages/contact` | `contact` | ville, pays, adresse, code postal, région, e-mail, téléphone (E.164 + affichage), **téléphone secondaire optionnel**, horaires, coordonnées GPS |
| `/dashboard/reglages/legal` | `legal` | numéro d'enregistrement, autorité, directeur de publication, hébergeur |
| `/dashboard/reglages/reseaux` | `socials` | Facebook, Instagram, TikTok — avec **case « compte pas encore créé »** |
| `/dashboard/reglages/seo` | `seo` | meta description par défaut, mots-clés, image Open Graph, `locale` |
| `/dashboard/reglages/navigation` | table `navigation_items` | 3 menus, ordonnables |

### 10.2 Deux comportements à préserver absolument

**Le champ `[À COMPLÉTER]`.** `src/lib/site-config.ts` marque volontairement les
informations manquantes plutôt que de les masquer. Le CMS conserve ce mécanisme : un
champ vide s'affiche sur le site avec la mention `[À COMPLÉTER]`, et le tableau de bord
du Lot 5 en dresse la liste. Ne pas remplacer par une chaîne vide silencieuse.

**Le lien social non configuré.** `socialLink()` distingue aujourd'hui `configured:
true/false` : une URL vide produit une icône grisée « bientôt », jamais un lien mort. Le
formulaire propose donc une case explicite « ce compte n'existe pas encore », et non un
simple champ vide.

**Le téléphone secondaire.** L'audit avait relevé un second numéro dont le lien pointait
en réalité vers le premier. Le champ n'est activé que si un numéro réellement distinct
est saisi — validation qui compare les deux valeurs.

### 10.3 Répercussion sur le site

`siteConfig`, `contact`, `legal`, `socials` deviennent des lectures cachées
(`cms:settings:*`), consommées par le layout `(site)`, le pied de page, les données
structurées JSON-LD, `sitemap.ts`, `manifest.ts` et les liens WhatsApp.

`whatsappLink()` et `whatsappMessages` restent du code (ce sont des gabarits de
message), mais le numéro provient désormais des réglages.

**`src/lib/site-config.ts` n'est pas supprimé** : il conserve `resolveSiteUrl()`
(URL canonique issue de l'environnement, indispensable au build) et sert de **valeurs de
repli** si la base est injoignable au build. Ce filet évite qu'une panne Supabase casse
un déploiement.

### Recette du Lot 10

- [ ] Modifier le nom de l'association le répercute sur le pied de page, les
      métadonnées et le JSON-LD.
- [ ] Vider le numéro d'enregistrement le fait afficher `[À COMPLÉTER]` sur les mentions
      légales, et l'ajoute à la liste « À compléter » du tableau de bord.
- [ ] Cocher « compte pas encore créé » pour TikTok produit une icône grisée, **pas un
      lien mort**.
- [ ] Saisir un téléphone secondaire identique au principal est refusé.
- [ ] Réordonner le menu principal change l'ordre dans l'en-tête du site.
- [ ] Un `editor` ne peut accéder à aucun écran de réglages (route directe comprise).
- [ ] Les six écrans de réglages sont utilisables à 390 px : la navigation entre groupes
      passe en onglets défilants horizontalement **dans leur propre conteneur**, jamais
      en faisant déborder la page.

---

# Lot 11 — Éditeur de thème

**Objectif.** Changer l'apparence du site sans toucher au CSS.

### 11.1 Ce qui est éditable

Le groupe `theme` de `site_settings` reprend les tokens de
`src/app/globals.css` :

| Catégorie | Tokens |
|---|---|
| Marque | `brand-navy`, `brand-blue`, `brand-blue-ink`, `brand-green`, `brand-green-ink`, `brand-orange`, `brand-orange-ink` |
| Interface claire | `background`, `foreground`, `card`, `primary`, `secondary`, `muted`, `accent`, `border`, `ring`, `destructive`, `success` |
| Interface sombre | les mêmes, variante `.dark` |
| Formes | `radius` |
| Typographie | police de titre et police de texte, **choisies dans une liste fermée** |

### 11.2 La contrainte `next/font` — à ne pas contourner

`next/font/google` exige des valeurs **littérales au build**. Une police saisie
librement est impossible. La liste est donc déclarée en code :

```ts
// src/lib/fonts.ts
import { Inter, Sora, Poppins, Montserrat, Lora, Source_Sans_3 } from 'next/font/google'
export const FONTS = { Inter, Sora, Poppins, Montserrat, Lora, Source_Sans_3 } // …
```

Le dashboard propose ces polices et rien d'autre. C'est une limite technique réelle, pas
un manque : elle est expliquée dans l'interface.

### 11.3 Injection

Le layout `(site)` lit le thème (mis en cache, étiquette `cms:settings:theme`) et injecte
un `<style>` **côté serveur**, dans le HTML initial :

```tsx
<style dangerouslySetInnerHTML={{ __html:
  `:root{${lightVars}}\n.dark{${darkVars}}` }} />
```

Injection serveur obligatoire : appliquer les couleurs en JavaScript après hydratation
provoquerait un flash de couleurs par défaut. Les valeurs injectées sont **validées et
assainies** — uniquement des couleurs hexadécimales ou `oklch()` reconnues, jamais une
chaîne libre insérée dans du CSS.

### 11.4 Contrôle du contraste

Le README documente que les teintes du logo ont été assombries pour atteindre AA
(`#2E8BC0` → `#1B6FA8`, 5,3:1). L'éditeur doit empêcher de perdre ce travail :

- Ratio de contraste calculé **en direct** pour chaque couple texte/fond.
- Sous 4,5:1 : avertissement visible et **enregistrement bloqué** pour les couples
  critiques (`primary`/`primary-foreground`, `background`/`foreground`,
  `destructive`/blanc).
- Bouton « Rétablir les couleurs d'origine ADEBES » toujours disponible.

### Recette du Lot 11

- [ ] Modifier `--primary` change la couleur des boutons du site après enregistrement.
- [ ] Aucun flash de couleur au chargement (vérifier en réseau ralenti).
- [ ] Une couleur à contraste 3:1 sur un couple critique est refusée avec explication.
- [ ] « Rétablir » restaure exactement les valeurs actuelles de `globals.css`.
- [ ] Le mode sombre reste éditable indépendamment.
- [ ] Une valeur hostile (`red;}body{display:none`) est rejetée à la validation.
- [ ] À 390 px, les sélecteurs de couleur et l'aperçu s'empilent ; le ratio de contraste
      reste visible en même temps que la couleur en cours de modification.

---

# Lot 12 — Workflow éditorial

**Objectif.** Brouillon, relecture, publication, historique, prévisualisation.

### 12.1 États et transitions

```
draft ──► in_review ──► published ──► archived
  ▲            │             │            │
  └────────────┴─────────────┴────────────┘   (retour possible en brouillon)
```

| Transition | Permission |
|---|---|
| `draft → in_review` | `<resource>:update` (éditeur inclus) |
| `in_review → published` | `<resource>:publish` (admin et plus) |
| `published → draft` | `<resource>:publish` |
| `* → archived` | `<resource>:publish` |

### 12.2 Versions

À chaque publication, un instantané complet dans `content_versions`.
Écran d'historique : liste des versions, auteur, date, commentaire, comparaison
champ par champ avec la version courante, restauration.
Rétention : 20 versions par entité, purge des plus anciennes.

### 12.3 Prévisualisation

`src/app/api/preview/route.ts` :

```ts
export async function GET(request: Request) {
  const actor = await getCurrentActor()
  if (!actor || !can(actor, 'page:read')) {
    return new Response('Non autorisé', { status: 401 })
  }
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('chemin') ?? '/'
  if (!path.startsWith('/')) return new Response('Chemin invalide', { status: 400 })

  ;(await draftMode()).enable()      // await obligatoire
  redirect(path)
}
```

Une bannière fixe « Mode prévisualisation — vous voyez les brouillons » avec bouton
« Quitter » (vers `/api/preview/exit`) est affichée dans le layout `(site)` quand
`(await draftMode()).isEnabled` est vrai.

`isEnabled` est lisible à l'intérieur d'un scope `'use cache'` ; quand il est actif, les
scopes cachés se réexécutent à chaque requête sans être mis en cache. C'est exactement
le comportement voulu.

### 12.4 Publication programmée

`published_at` dans le futur + `status = 'published'` = pas encore visible. Les requêtes
publiques filtrent `published_at <= now()`. Un Vercel Cron quotidien appelle un Route
Handler protégé par `CRON_SECRET` qui exécute `revalidateTag(tag, 'max')` sur les
étiquettes concernées — **`updateTag` n'est pas utilisable dans un Route Handler**.

### Recette du Lot 12

- [ ] Un `editor` peut passer un article en « À relire » mais pas le publier.
- [ ] Publier crée une version ; restaurer une version antérieure remet le contenu.
- [ ] La prévisualisation affiche les brouillons ; un utilisateur non connecté qui ouvre
      la même URL ne les voit pas.
- [ ] La bannière de prévisualisation apparaît et « Quitter » la retire.
- [ ] Un article daté dans le futur n'apparaît pas ; il apparaît après le passage du cron.
- [ ] Au-delà de 20 versions, les plus anciennes sont purgées.

---

# Lot 13 — Utilisateurs et journal d'audit

**Objectif.** Gérer les comptes, tracer les actions.

### 13.1 `/dashboard/utilisateurs`

Liste : avatar, nom, e-mail, rôle, état, dernière connexion.
Actions : inviter, changer le rôle (`super_admin` seul), activer/désactiver, supprimer
(`super_admin` seul).

L'invitation utilise `supabase.auth.admin.inviteUserByEmail()` — donc
`createAdminClient()`, l'un des quatre usages autorisés. Le rôle choisi est écrit dans
`profiles` juste après. E-mail d'invitation en français, aux couleurs ADEBES.

### 13.2 Garde-fous

- Impossible de modifier son propre rôle.
- Impossible de se désactiver soi-même.
- Le dernier `super_admin` actif est protégé **en base** (trigger du Lot 1) autant que
  dans l'interface. L'UI affiche le message renvoyé par la base.
- Désactiver un compte invalide ses sessions à la prochaine requête (`is_active` est
  relu par `getCurrentActor`).

### 13.3 `/dashboard/journal`

Lecture seule. Filtres : auteur, type d'entité, action, période. Chaque entrée affiche
le différentiel des champs modifiés. Rétention 180 jours, purge par le cron.

Actions journalisées : toute mutation passée par `createAction` avec `audit` configuré,
plus connexion, déconnexion, échec de connexion, invitation, changement de rôle,
modification de réglages.

### Recette du Lot 13

- [ ] Inviter un utilisateur envoie un e-mail ; le lien mène à la définition du mot de
      passe puis au dashboard avec le bon rôle.
- [ ] Un `admin` ne peut pas changer un rôle (bouton absent, action directe refusée).
- [ ] Rétrograder le dernier `super_admin` échoue avec le message de la base.
- [ ] Désactiver un compte le déconnecte à la requête suivante.
- [ ] Toute mutation apparaît au journal avec auteur, horodatage et différentiel.
- [ ] Un `editor` n'accède pas au journal.
- [ ] À 390 px, le journal s'affiche en cartes chronologiques avec différentiel
      repliable ; le JSON du différentiel défile dans son propre conteneur, pas dans la
      page.

---

# Lot 14 — Boîte de réception des formulaires

**Objectif.** Ne plus perdre un message. Aujourd'hui, si Resend n'est pas configuré ou
échoue, le message n'existe nulle part.

### 14.1 Modification de `src/app/actions/forms.ts`

Nouvel ordre, **non négociable** :

1. Valider (schéma inchangé).
2. Détecter le honeypot (comportement actuel conservé : réponse « ok » sans traitement).
3. **Écrire en base** (`form_submissions`).
4. **Puis** envoyer l'e-mail Resend.
5. Si l'e-mail échoue mais que l'écriture a réussi → **répondre « message bien reçu »**,
   parce que c'est vrai : il est en base et visible dans le dashboard.
6. Si l'écriture échoue → conserver le message de repli actuel (coordonnées directes).

C'est un renversement important : l'e-mail devient une notification, la base devient la
source de vérité. Le principe affiché dans le code actuel — « un message de bénévole
perdu en silence est pire qu'une erreur affichée » — est ainsi mieux servi.

### 14.2 `/dashboard/messages`

Deux onglets (Contact / Bénévolat), badge de non-lus, liste avec expéditeur, sujet,
extrait, date, statut. Détail : contenu complet, bouton « Répondre » (`mailto:`
pré-rempli), statut (`nouveau`/`lu`/`traité`/`archivé`/`spam`), notes internes.
Export CSV des candidatures.

### 14.3 Notification

Compteur de non-lus dans la sidebar. Optionnel : récapitulatif quotidien par e-mail si
des messages non lus subsistent.

### Recette du Lot 14

- [ ] Un message envoyé depuis `/contact` apparaît dans le dashboard.
- [ ] Avec `RESEND_API_KEY` vide, le message est **quand même enregistré** et
      l'utilisateur reçoit une confirmation honnête.
- [ ] Le honeypot rempli n'écrit rien en base et renvoie « ok » (comportement inchangé).
- [ ] Le compteur de non-lus se met à jour.
- [ ] L'export CSV des bénévoles s'ouvre correctement dans un tableur (encodage UTF-8
      avec BOM, séparateur `;` pour Excel francophone).
- [ ] Un `editor` lit les messages mais ne peut pas les supprimer.
- [ ] À 390 px, la liste et le détail d'un message sont deux écrans successifs (retour
      explicite), jamais deux colonnes tassées ; le bouton « Répondre » reste atteignable.

---

# Lot 15 — Bascule complète du site public et cache

**Objectif.** Plus aucune page ne lit `src/content/`. Performance préservée.

### 15.1 Activation de Cache Components

```ts
// next.config.ts
const nextConfig: NextConfig = {
  cacheComponents: true,
  // …reste inchangé
}
```

Conséquences à traiter :

- Le rendu devient dynamique par défaut ; seul ce qui est `'use cache'` est mis en cache.
- Toute lecture publique doit être enveloppée dans `src/server/queries/*.query.ts`.
- Aucun `export const runtime = 'edge'` ne doit subsister (incompatible).
- Vérifier qu'aucun scope caché ne lit `cookies()` ou `headers()`.

### 15.2 Audit des lectures

Passer les 29 routes en revue. Pour chacune :

- [ ] aucun `import … from '@/content/…'`
- [ ] les données viennent de `src/server/queries/`
- [ ] `params` / `searchParams` sont `await`és
- [ ] `generateStaticParams` interroge la base
- [ ] `generateMetadata` réutilise la requête mémoïsée
- [ ] `notFound()` sur identifiant inconnu

### 15.3 SEO dynamique

`sitemap.ts` liste les slugs publiés depuis la base ; `robots.ts` et `manifest.ts` lisent
les réglages ; les composants JSON-LD (`ngoJsonLd`, `websiteJsonLd`, `faqJsonLd`,
`breadcrumbJsonLd`) sont alimentés par les réglages et le contenu.

### 15.4 Retrait de `src/content/`

Une fois toutes les collections migrées et vérifiées, déplacer les fichiers vers
`supabase/seed-data/` (ils restent la source du seed) et supprimer `src/content/`.
`src/lib/media.ts` (résolution disque) est supprimé pour le contenu CMS ; il reste
utilisé si des images de marque en `/public` en dépendent — vérifier avant de le retirer.

### 15.5 Mesures

Comparer avant/après sur `/`, `/programmes`, `/actualites/[slug]` : LCP, TTFB, poids
transféré. Une régression de LCP supérieure à 20 % doit être expliquée et corrigée avant
de clore le lot.

### Recette du Lot 15

- [ ] `grep -r "@/content" src/` ne renvoie **aucun** résultat.
- [ ] Les 29 routes répondent en 200.
- [ ] Publier un contenu le rend visible sur le site en moins de 5 secondes.
- [ ] La page d'accueil n'exécute pas de requête base à chaque visite (cache actif).
- [ ] `sitemap.xml` liste les URL publiées, et elles seules.
- [ ] LCP non dégradé de plus de 20 %.
- [ ] `npm run build` passe sans avertissement de cache.

---

# Lot 16 — Durcissement, recette et mise en ligne

**Objectif.** Rendre l'ensemble exploitable en production.

### 16.1 Limitation de débit

Table `rate_limits (key text, window_start timestamptz, count int)` + fonction SQL
atomique. Appliquée à : connexion (5 tentatives / 15 min / IP), réinitialisation de mot
de passe (3 / heure), formulaires publics (5 / heure / IP), téléversement (30 / heure /
utilisateur).

> Implémentation en base plutôt qu'en mémoire : sur Vercel, chaque instance
> serverless a sa propre mémoire — un compteur en mémoire ne compte rien.

### 16.2 Content Security Policy

Ajouter la CSP aux `headers()` de `next.config.ts`, à côté des quatre en-têtes déjà
présents. Autoriser explicitement : le domaine Supabase (`connect-src`, `img-src`),
Google Fonts, et les `nonce` des scripts Next.js. Tester chaque page avant d'appliquer
en mode bloquant — commencer en `Content-Security-Policy-Report-Only`.

### 16.3 Nettoyage

- [ ] Supprimer `/dashboard/_demo`.
- [ ] Supprimer les `console.log` de développement (conserver les `console.error`
      volontaires).
- [ ] `npx eslint .` sans erreur ni avertissement.
- [ ] `npx tsc --noEmit` sans erreur.

### 16.4 Documentation

- **`docs/GUIDE-UTILISATEUR.md`** — en français simple, sans jargon, avec captures :
  se connecter, publier un article, changer une photo, modifier un chiffre, ajouter une
  section, gérer les utilisateurs. C'est le livrable qui décide de l'adoption réelle du
  CMS.
- **`README.md`** — mettre à jour « Architecture », « Stack », « Organisation du code »,
  « Variables d'environnement » et remplacer la section « Pistes pour la suite → CMS ».
- **`.env.example`** — complet et commenté.

### 16.5 Déploiement Vercel

1. Variables d'environnement des trois environnements (Production, Preview, Development).
   ⚠️ Ne **jamais** créer une variable sans la renseigner — une variable vide vaut `""`,
   pas `undefined` (piège déjà documenté dans `.env.example`).
2. Région `cdg1` (Paris), cohérente avec `eu-west-3` côté Supabase.
3. Vercel Cron pour la publication programmée et les purges.
4. Créer le premier `super_admin` et vérifier sa connexion en production.
5. Sauvegarde automatique Supabase activée.

### 16.6 Recette fonctionnelle finale

**Parcours administrateur**

- [ ] Connexion, publication d'un article avec image, vérification sur le site.
- [ ] Modification d'un chiffre clé, dont un passage à « pas encore disponible ».
- [ ] Ajout d'une section à la page d'accueil, réordonnancement, prévisualisation,
      publication.
- [ ] Modification d'une couleur du thème, contrôle du contraste.
- [ ] Invitation d'un éditeur, vérification de ses droits restreints.
- [ ] Lecture et traitement d'un message reçu.
- [ ] Restauration d'une version antérieure.

**Parcours éditeur**

- [ ] Création d'un article, passage en « À relire », impossibilité de publier.
- [ ] Téléversement d'une image, impossibilité de la supprimer.
- [ ] Absence des écrans Réglages, Utilisateurs, Journal, Thème.

**Responsivité du dashboard — recette finale**

La matrice du §12 du Rapport 1, passée une dernière fois sur l'ensemble des écrans
livrés, en clair **et** en sombre :

- [ ] **320 px** — aucun écran ne déborde horizontalement, aucun texte tronqué, aucune
      action hors d'atteinte.
- [ ] **390 px** — les deux parcours complets ci-dessus (administrateur et éditeur) sont
      réalisables **de bout en bout au téléphone**, y compris l'ajout d'une section à la
      page d'accueil et le téléversement d'une image.
- [ ] **768 px** — bascule cartes → tableau effective sur les 12 écrans de liste.
- [ ] **1024 px** — sidebar persistante, rétraction, mémorisation ; toutes les cibles
      tactiles toujours ≥ 44 px.
- [ ] **1440 px** — largeurs bornées, aucun formulaire étiré, densité correcte.
- [ ] Zoom navigateur à 200 % : aucune fonctionnalité perdue (WCAG 1.4.4).
- [ ] `grep -rn "min-h-screen\|h-screen\|100vh" src/components/dashboard/ src/app/\(dashboard\)/`
      ne renvoie rien.
- [ ] `grep -rn "window.innerWidth\|matchMedia" src/ --include=*.ts --include=*.tsx`
      ne renvoie que `src/hooks/use-breakpoint.ts`.
- [ ] Aucun point de rupture personnalisé ni `@media` en dur : seules les classes
      `sm: md: lg: xl: 2xl:` de Tailwind sont utilisées.
- [ ] Lighthouse **en profil mobile** ≥ 90 sur Performance, Accessibilité, Bonnes
      pratiques — mesuré sur `/dashboard` et sur un écran de liste.
- [ ] Test sur au moins **un téléphone réel** (Android ou iOS), pas seulement en
      émulation : le clavier virtuel, la barre d'adresse et les zones sûres ne se
      simulent pas fidèlement.

**Non-régression du site public**

- [ ] Les 29 routes répondent.
- [ ] Formulaires contact et bénévolat fonctionnels, honeypot actif.
- [ ] Mode sombre, animations, `prefers-reduced-motion`.
- [ ] Aucun lien mort ; réseaux non configurés toujours grisés.
- [ ] Aucun chiffre inventé : les valeurs absentes affichent « — ».
- [ ] Données structurées valides (test Google Rich Results).
- [ ] Lighthouse ≥ 90 sur Performance, Accessibilité, Bonnes pratiques, SEO.

**Sécurité**

- [ ] Server Action appelée sans session → `UNAUTHENTICATED`.
- [ ] Server Action appelée avec un rôle insuffisant → `FORBIDDEN`.
- [ ] Requête directe à l'API Supabase avec la clé anon : contenu publié uniquement.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` absente du bundle client
      (`grep -r "service_role" .next/static/` ne renvoie rien).
- [ ] Limitation de débit effective sur la connexion.

---

## Annexe A — Ordre des dépendances entre lots

```
0 ─► 1 ─► 2 ─► 3 ─► 4 ─► 5 ─► 6 ─► 7 ─► 8A ─┬─► 8B…8I ─┐
                                             └─► 9 ─────┼─► 15 ─► 16
                                       10 ─► 11 ────────┤
                                       12 ──────────────┤
                                       13 ──────────────┤
                                       14 ──────────────┘
```

- Les lots **0 à 7** sont strictement séquentiels : chacun conditionne le suivant.
- **8A est le point de bifurcation.** Tant qu'il n'est pas terminé et validé, ne
  commencer ni 8B, ni 9.
- **8B–8I, 9, 10–11, 12, 13, 14** peuvent progresser en parallèle une fois 8A validé.
- **15 exige que tous les précédents soient terminés.**

## Annexe B — Estimation indicative

| Lots | Charge |
|---|---|
| 0–1 (préparation, base) | 2–3 j |
| 2–3 (noyau, infrastructure) | 3–4 j |
| 4–5 (auth, coquille) | 3–4 j |
| 6 (design system) | 3–4 j |
| 7 (médiathèque) | 2–3 j |
| 8A (référence) | 2–3 j |
| 8B–8I (8 collections) | 6–8 j |
| 9 (constructeur de pages) | 5–7 j |
| 10–11 (réglages, thème) | 3–4 j |
| 12 (workflow) | 3–4 j |
| 13–14 (utilisateurs, messages) | 3–4 j |
| 15 (bascule, cache) | 3–4 j |
| 16 (durcissement, recette) | 3–4 j |
| **Total** | **41–56 jours-homme** |

Fourchette pour un développeur seul travaillant en continu, sans imprévu majeur. Les
lots 6, 9 et 15 concentrent le risque : le premier parce qu'il conditionne toute la
cohérence de l'interface, le deuxième par sa complexité intrinsèque, le troisième parce
qu'il touche à tout ce qui existe déjà.

## Annexe C — Ce qui est volontairement hors périmètre

À décider explicitement plus tard, pour ne pas élargir le chantier en cours de route :

- Multilingue (français / anglais) — le modèle de données le permettrait, l'interface
  demanderait un lot entier.
- Paiement en ligne (CinetPay, Mobile Money) — évoqué dans le README, projet distinct.
- Éditeur de texte riche complet (gras, italique, liens) — la v1 stocke des paragraphes
  simples, conformes à la structure `body: string[]` actuelle.
- Mesure d'audience et bandeau de consentement.
- Authentification à deux facteurs.
- Recherche plein texte sur le site public.
