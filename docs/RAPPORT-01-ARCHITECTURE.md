# Rapport 1 — Architecture du mini CMS ADEBES

> **Objet.** Décrire *comment* le site vitrine actuel devient une application full-stack
> Next.js pilotée par un dashboard utilisable sans compétence technique.
> Ce document fixe les décisions ; le [Rapport 2](./RAPPORT-02-PLAN-IMPLEMENTATION.md)
> fixe l'ordre des travaux.
>
> **Statut.** Document de référence. Toute divergence entre le code et ce rapport est
> un bug de l'un ou de l'autre — jamais une improvisation autorisée.

---

## Sommaire

1. [Point de départ constaté](#1-point-de-départ-constaté)
2. [Ce que « mini CMS » veut dire ici](#2-ce-que--mini-cms--veut-dire-ici)
3. [Les huit décisions structurantes](#3-les-huit-décisions-structurantes)
4. [Architecture en couches](#4-architecture-en-couches)
5. [Arborescence cible](#5-arborescence-cible)
6. [Design patterns effectivement utilisés](#6-design-patterns-effectivement-utilisés)
7. [SOLID, concrètement](#7-solid-concrètement)
8. [Modèle de données Supabase](#8-modèle-de-données-supabase)
9. [RBAC — rôles, permissions, triple barrière](#9-rbac--rôles-permissions-triple-barrière)
10. [Le registre de blocs, cœur du CMS](#10-le-registre-de-blocs-cœur-du-cms)
11. [Cache et revalidation](#11-cache-et-revalidation)
12. [Design system et responsivité du dashboard](#12-design-system-et-responsivité-du-dashboard)
13. [Sécurité](#13-sécurité)
14. [Conventions de nommage](#14-conventions-de-nommage)
15. [Contraintes Next.js 16 — règles anti-hallucination](#15-contraintes-nextjs-16--règles-anti-hallucination)
16. [Risques et parades](#16-risques-et-parades)

---

## 1. Point de départ constaté

Inventaire réel du dépôt au moment de la rédaction — aucune supposition.

| Élément | État |
|---|---|
| Framework | Next.js **16.3.3**, App Router, React 19.2.8, TypeScript strict |
| Style | Tailwind CSS v4 (`@theme inline`), tokens dans `src/app/globals.css` (249 lignes) |
| Composants | shadcn/ui style `radix-nova`, 21 primitives dans `src/components/ui/` |
| Thème | `next-themes`, classes `:root` / `.dark`, palette AA documentée |
| Contenu | **Statique**, 9 fichiers TypeScript dans `src/content/` |
| Médias | Fichiers dans `/public`, résolus au build par `src/lib/media.ts` (`fs.statSync`) |
| Formulaires | `react-hook-form` + `zod` + Server Actions → Resend (`src/app/actions/forms.ts`) |
| Config site | `src/lib/site-config.ts`, `src/lib/navigation.ts` — constantes `as const` |
| Base de données | **Aucune** |
| Authentification | **Aucune** |
| Routes | 29, toutes pré-générées statiquement |

**Les 9 collections de contenu existantes** (à migrer intégralement) :

| Fichier | Type exporté | Contenu |
|---|---|---|
| `src/content/programmes.ts` | `Programme` | 8 programmes, champs `actions[]`, `publics[]`, `besoins[]`, `icon`, `tone` |
| `src/content/actualites.ts` | `Actualite` | Articles + 5 catégories, `body: string[]` |
| `src/content/equipe.ts` | `MembreEquipe`, `RapportAnnuel` | Membres + rapports PDF |
| `src/content/temoignages.ts` | `Temoignage` | Citations liées à un `programmeSlug` |
| `src/content/valeurs.ts` | `Valeur` | 4 valeurs, `icon` + `tone` |
| `src/content/faq.ts` | `FaqItem` | Questions, `bullets[]`, `topic` (`don`/`benevolat`/`general`) |
| `src/content/stats.ts` | `Stat` | Chiffres clés, `value: number \| null`, `toConfirm` |
| `src/content/galerie.ts` | `GalerieItem` | Lecture du dossier `public/images/galerie/` au build |
| `src/content/biographie.ts` | objet `biographie` | Fiche + `domainesEngagement[]` + `engagementsBiographie[]` |

**Les sections de page déjà identifiées** (repérables par les commentaires `{/* --- … --- */}`) :

| Route | Sections |
|---|---|
| `/` | Chiffres clés · Qui sommes-nous · Valeurs · Programmes · Témoignages · Actualités · FAQ |
| `/a-propos` | Mission · Valeurs · Équipe · Gouvernance |
| `/impact` | Chiffres · Engagements · Rapports · Zones d'intervention |
| `/don` | Montants + WhatsApp · À quoi sert un don · Autres moyens · FAQ dons |
| `/benevolat` | Domaines d'engagement · Formulaire · FAQ bénévolat |
| `/contact` | Formulaire · Coordonnées · Carte |
| `/biographie` | Présentation · Domaines · Action sociale · À fournir |
| `/galerie` | Grille filtrable · Vidéo |

**Deux invariants du projet à ne jamais casser** — ils sont documentés dans le README
et dans les commentaires de code, et ils conditionnent la confiance des donateurs :

1. **Aucun chiffre inventé.** Une valeur absente s'affiche « — » avec une mention
   explicite, jamais `0`. Le CMS doit permettre de saisir « pas encore de valeur ».
2. **Aucun lien mort.** Un réseau social non configuré s'affiche grisé, jamais en lien
   cassé. Le CMS doit conserver cette distinction « configuré / non configuré ».

---

## 2. Ce que « mini CMS » veut dire ici

L'objectif — « tout est modifiable depuis le dashboard » — recouvre en réalité
**quatre familles de contenu** qui n'ont ni la même forme, ni la même interface
d'édition. Les confondre est la première cause d'échec d'un CMS maison.

### Famille A — Collections typées

Des listes d'entités homogènes : programmes, articles, membres, témoignages, valeurs,
FAQ, chiffres, photos, rapports.

*Interface* : liste paginable et filtrable → formulaire de création/édition →
réordonnancement par glisser-déposer → publication.

### Famille B — Pages composables

Le corps des pages `/`, `/a-propos`, `/impact`, `/don`, `/benevolat`, `/contact`,
`/biographie`. Chaque page est une **suite ordonnée de sections**, chaque section étant
un **bloc typé** dont le contenu est validé par un schéma.

*Interface* : arbre de sections → ajout / suppression / réordonnancement / masquage →
formulaire généré automatiquement à partir du schéma du bloc.

### Famille C — Singletons de configuration

Identité de l'association, coordonnées, mentions légales, réseaux sociaux, SEO par
défaut, thème, navigation.

*Interface* : formulaires de réglages, un onglet par groupe.

### Famille D — Données entrantes

Messages du formulaire de contact, candidatures de bénévoles.

*Interface* : boîte de réception en lecture, avec statut et export.

> **Conséquence architecturale.** Une seule abstraction ne peut pas couvrir les quatre.
> Le CMS expose donc **quatre modules de présentation** distincts, tous assis sur le
> **même noyau** (validation, permissions, versionnement, audit, invalidation de cache).

---

## 3. Les huit décisions structurantes

### D1 — Supabase Auth, pas d'authentification maison

**Décision.** `@supabase/ssr` + Supabase Auth (e-mail / mot de passe), sessions par
cookies HttpOnly.

**Pourquoi.** La base est déjà Supabase ; réutiliser son fournisseur d'identité évite
un second magasin d'utilisateurs à synchroniser, et donne gratuitement la
réinitialisation de mot de passe, la vérification d'e-mail et la rotation des jetons.
Surtout, cela permet aux politiques **RLS** de PostgreSQL de connaître l'utilisateur
courant via `auth.uid()` — la seule façon d'obtenir une défense en profondeur au niveau
de la base.

**Écarté.** NextAuth/Auth.js (double source de vérité vis-à-vis de RLS), session maison
(à écrire, à auditer, à maintenir — sans bénéfice ici).

### D2 — Modèle de contenu hybride

**Décision.** Collections typées **en tables dédiées** (Famille A) + pages en
**sections JSONB validées par Zod** (Famille B) + réglages en **documents JSONB
groupés** (Famille C).

**Pourquoi.** Une table par entité donne des contraintes d'intégrité réelles (clés
étrangères, unicité des slugs, index) là où les données sont structurées et
interrogées. Le JSONB est réservé aux endroits où la forme varie par nature — un bloc
« bannière CTA » et un bloc « grille de chiffres » n'ont rien en commun. Chaque
document JSONB est **systématiquement** validé par un schéma Zod à l'écriture *et* à la
lecture : le JSONB ne devient jamais un fourre-tout non typé.

**Écarté.** Tout-en-JSONB (perte d'intégrité, requêtes illisibles), tout-en-tables
(une table par type de bloc : 16 migrations pour ajouter un bloc, ingérable).

### D3 — Les Server Actions sont la couche Contrôleur

**Décision.** Aucune API REST interne. Les mutations passent par des Server Actions
typées ; les Route Handlers sont réservés à trois usages précis : Draft Mode
(prévisualisation), webhooks entrants, export de fichiers.

**Pourquoi.** Une API REST interne dupliquerait la validation, le contrôle d'accès et
les types, pour un seul consommateur. Les Server Actions donnent la sécurité de type
de bout en bout et suppriment la sérialisation manuelle. Le projet utilise déjà ce
schéma dans `src/app/actions/forms.ts`.

**Conséquence.** Une Server Action est une **frontière publique non authentifiée par
défaut** : elle est joignable par un POST direct sans passer par le formulaire. Chaque
action passe donc obligatoirement par le décorateur `createAction` (§6) qui impose
authentification, permission et validation. Aucune exception.

### D4 — Cache Components activé

**Décision.** `cacheComponents: true` dans `next.config.ts`. Les lectures publiques
sont enveloppées dans des fonctions `'use cache'` étiquetées par `cacheTag`. Les
mutations invalident par `updateTag`.

**Pourquoi.** Le site est aujourd'hui 100 % statique et doit le rester en performance
perçue, alors que le contenu devient dynamique. Cache Components donne exactement ça :
coquille statique servie immédiatement, invalidation ciblée à la publication. C'est le
mécanisme prévu par Next.js 16 pour ce cas ; `revalidatePath` global serait un recul.

**Repli documenté.** Si Cache Components pose un problème bloquant en production, le
repli est `revalidateTag(tag, 'max')` sur des lectures `fetch`-taggées, au prix d'une
granularité moindre. Décision à prendre au Lot 15, pas avant.

### D5 — Supabase Storage remplace `/public` pour les médias éditoriaux

**Décision.** Deux buckets : `media` (images, lecture publique) et `documents` (PDF des
rapports, lecture publique). `src/lib/media.ts` et sa résolution par `fs.statSync`
disparaissent pour le contenu piloté par le CMS.

**Pourquoi.** Un utilisateur non technique ne peut pas déposer un fichier dans
`/public` : cela suppose un accès au dépôt et un redéploiement. Storage donne
l'URL publique, les transformations d'image et les politiques d'accès.

**Conséquence obligatoire.** `next.config.ts` déclare aujourd'hui
`remotePatterns: []` et des `localPatterns`. Il **faut** y ajouter le domaine Supabase,
sinon `next/image` refusera toutes les images du CMS. Détail traité au Lot 7.

**Ce qui reste dans `/public`** : le logo, les icônes, l'image Open Graph par défaut —
des ressources de marque, pas du contenu éditorial.

### D6 — RBAC par permissions, pas par rôles

**Décision.** Le code ne teste jamais `role === 'admin'`. Il teste
`can(actor, 'programme:publish')`. Les rôles ne sont qu'un raccourci vers un ensemble
de permissions, défini en un seul endroit.

**Pourquoi.** Un test de rôle disséminé dans 60 fichiers rend tout changement de
politique impossible à auditer. Une matrice unique se relit en trente secondes et se
teste unitairement.

### D7 — Séparation stricte des clients Supabase

Quatre fabriques, quatre usages, **jamais interchangeables** :

| Fabrique | Cookies | Clé | Usage autorisé |
|---|---|---|---|
| `createBrowserClient()` | oui | anon | Client Components (usage rare) |
| `createServerClient()` | **oui** | anon | DAL, Server Actions, pages du dashboard |
| `createPublicClient()` | **non** | anon | **uniquement** dans les scopes `'use cache'` |
| `createAdminClient()` | non | service_role | code serveur de confiance uniquement |

**Pourquoi `createPublicClient` existe.** Un scope `'use cache'` ne peut pas lire
`cookies()` — Next.js lève une erreur. Or `createServerClient()` lit les cookies. Une
lecture publique mise en cache doit donc utiliser un client **sans cookies**, qui
s'authentifie comme `anon` : la RLS ne lui laisse voir que le contenu publié, ce qui est
exactement le comportement voulu. Confondre les deux est l'erreur la plus probable de
tout ce chantier.

### D8 — Workflow éditorial à quatre états + versions

**Décision.** `draft` → `in_review` → `published` → `archived`. Chaque enregistrement
publié produit un instantané dans `content_versions`, restaurable.

**Pourquoi.** Un CMS sans brouillon force à publier pour voir le rendu. Un CMS sans
historique transforme la moindre erreur en perte définitive. Les deux sont
rédhibitoires pour un utilisateur non technique.

---

## 4. Architecture en couches

### La règle de dépendance

```
       presentation  ──────►  server  ──────►  core  ◄──────  infrastructure
    (app/, components/)   (dal/, actions/)  (domaine)      (supabase/, mail/)

                    Les flèches ne pointent JAMAIS dans l'autre sens.
```

| Couche | Dossier | Contenu | Interdictions |
|---|---|---|---|
| **Domaine** | `src/core/**` | Entités, schémas Zod, règles métier, matrice RBAC, ports (interfaces), `Result` | ❌ `import next/*`, ❌ `import @supabase/*`, ❌ `import react` |
| **Application** | `src/core/use-cases/**` | Cas d'usage. Orchestrent le domaine via les **ports** | mêmes interdictions |
| **Infrastructure** | `src/infrastructure/**` | Implémentations des ports : Supabase, Storage, Resend, audit | ❌ importer `src/app/**` |
| **Interface (Contrôleur)** | `src/server/**` | DAL, Server Actions, décorateurs, requêtes cachées | seule couche qui connaît *tout* |
| **Présentation (Vue)** | `src/app/**`, `src/components/**` | Routes, layouts, composants | ❌ importer `src/infrastructure/**` directement |

Cette règle est **vérifiable mécaniquement** : une règle ESLint
`no-restricted-imports` la fait respecter (Lot 2), elle n'est pas laissée à la
discipline.

### Correspondance avec MVC

| MVC | Ici |
|---|---|
| **Model** | `src/core/**` (entités + règles) et `src/infrastructure/supabase/repositories/**` (persistance) |
| **View** | `src/app/**` (Server Components) et `src/components/**` |
| **Controller** | `src/server/actions/**` (écritures) et `src/server/queries/**` (lectures cachées) |

Un Server Component ne fait **jamais** d'appel Supabase direct : il appelle une
fonction de `src/server/queries/`. Une page du dashboard n'appelle **jamais** un
repository : elle appelle un cas d'usage via le contrôleur. Cette discipline est ce qui
rend le code testable et le RBAC impossible à contourner par oubli.

---

## 5. Arborescence cible

```
src/
├── app/
│   ├── layout.tsx                    ← réduit : <html>, polices, ThemeProvider, Toaster
│   ├── globals.css
│   ├── robots.ts  sitemap.ts  manifest.ts  global-error.tsx  not-found.tsx
│   │
│   ├── (site)/                       ← ROUTE GROUP : le site public
│   │   ├── layout.tsx                ← SiteHeader + SiteFooter + StickyMobileActionBar
│   │   ├── page.tsx                  ← accueil (routes existantes déplacées ici)
│   │   ├── a-propos/  biographie/  programmes/  actualites/  galerie/
│   │   ├── impact/  don/  benevolat/  contact/
│   │   └── mentions-legales/  politique-confidentialite/
│   │
│   ├── (auth)/                       ← ROUTE GROUP : pages non authentifiées du CMS
│   │   ├── layout.tsx                ← écran centré, sans chrome du site
│   │   ├── connexion/page.tsx
│   │   ├── mot-de-passe-oublie/page.tsx
│   │   └── reinitialiser-mot-de-passe/page.tsx
│   │
│   ├── (dashboard)/
│   │   └── dashboard/
│   │       ├── layout.tsx            ← garde d'accès + Sidebar + Topbar
│   │       ├── page.tsx              ← tableau de bord
│   │       ├── pages/                ← constructeur de pages (Famille B)
│   │       ├── programmes/  actualites/  galerie/  equipe/
│   │       ├── temoignages/  faq/  chiffres/  documents/   (Famille A)
│   │       ├── mediatheque/
│   │       ├── messages/             ← Famille D
│   │       ├── reglages/             ← Famille C
│   │       │   ├── identite/  contact/  legal/  reseaux/
│   │       │   ├── navigation/  seo/  theme/
│   │       ├── utilisateurs/
│   │       └── journal/              ← audit
│   │
│   └── api/
│       ├── preview/route.ts          ← draftMode().enable()
│       └── preview/exit/route.ts
│
├── core/                             ← DOMAINE — zéro dépendance Next/Supabase/React
│   ├── shared/
│   │   ├── result.ts                 ← Result<T, E>
│   │   ├── errors.ts                 ← AppError et sous-types
│   │   ├── pagination.ts
│   │   └── slug.ts                   ← slugify + unicité (accents français gérés)
│   ├── rbac/
│   │   ├── roles.ts                  ← UserRole
│   │   ├── permissions.ts            ← Permission, ROLE_PERMISSIONS
│   │   └── policy.ts                 ← can(), assertCan()
│   ├── cms/
│   │   ├── entities/                 ← Programme, Article, Page, Section…
│   │   ├── schemas/                  ← schémas Zod partagés client/serveur
│   │   ├── blocks/                   ← registre des blocs (§10)
│   │   └── ports/                    ← interfaces de repository
│   └── use-cases/
│       ├── programmes/  articles/  pages/  media/  settings/  users/ …
│
├── infrastructure/
│   ├── supabase/
│   │   ├── clients/                  ← les 4 fabriques (D7)
│   │   ├── database.types.ts         ← GÉNÉRÉ, ne jamais éditer à la main
│   │   ├── mappers/                  ← ligne SQL ⇄ entité de domaine
│   │   └── repositories/             ← implémentations des ports
│   ├── storage/                      ← upload, suppression, URL publiques
│   ├── mail/                         ← adaptateur Resend (reprend l'existant)
│   └── audit/                        ← écriture du journal
│
├── server/                           ← CONTRÔLEUR
│   ├── dal/                          ← verifySession, getCurrentActor, requirePermission
│   ├── actions/                      ← Server Actions, un fichier par module
│   ├── queries/                      ← lectures publiques 'use cache' + cacheTag
│   └── action-kit/                   ← createAction, ActionResult, rate limit
│
├── components/
│   ├── ui/                           ← shadcn — INCHANGÉ
│   ├── ui-ext/                       ← extensions site — INCHANGÉ
│   ├── layout/  media/  cards/  forms/  seo/   ← site public, inchangés
│   ├── blocks/                       ← NOUVEAU : rendu public de chaque bloc
│   └── dashboard/                    ← NOUVEAU : design system du dashboard
│       ├── layout/                   ← Sidebar, Topbar, PageHeader, Breadcrumbs
│       ├── data-table/               ← DataTable, colonnes, filtres, pagination, tri
│       ├── forms/                    ← FormShell, champs contrôlés, SchemaForm
│       ├── modals/                   ← FormModal, ConfirmDialog, MediaPickerModal
│       ├── media/                    ← MediaPicker, Uploader, MediaGrid
│       └── feedback/                 ← EmptyState, ErrorState, StatusBadge, Skeletons
│
├── content/                          ← SUPPRIMÉ progressivement (Lot 14)
│                                        conservé en seed jusqu'à migration complète
└── lib/                              ← utils, site-config (repli), navigation (repli)
```

**Point de vigilance sur le route group `(site)`.** Le `layout.tsx` racine actuel
contient `<html>`, les polices, `ThemeProvider`, `SiteHeader`, `SiteFooter`,
`StickyMobileActionBar` et `Toaster`. Il s'applique à **toutes** les routes, dashboard
compris. Le chrome du site doit donc descendre dans `app/(site)/layout.tsx`, et le
layout racine se réduire à la coquille HTML. Sans ce déplacement, le dashboard hérite
de l'en-tête et du pied de page du site public.

---

## 6. Design patterns effectivement utilisés

Chaque pattern listé ici résout un problème identifié. Aucun n'est décoratif.

| Pattern | Emplacement | Problème résolu |
|---|---|---|
| **Repository** | `core/cms/ports/*.port.ts` + `infrastructure/supabase/repositories/*` | Le domaine ignore Supabase. Les cas d'usage se testent avec un repository en mémoire. |
| **Ports & Adapters** | idem, plus `storage/`, `mail/` | Changer Resend ou Storage n'impacte aucun fichier de `core/`. |
| **Registry** | `core/cms/blocks/registry.ts` | Ajouter un type de bloc = ajouter **une** entrée. Ni `switch`, ni migration SQL. |
| **Strategy** | Chaque descripteur de bloc porte son schéma, ses champs et son composant de rendu | Le comportement varie par type sans conditionnelle centrale. |
| **Factory** | `infrastructure/supabase/clients/` | Quatre clients aux garanties distinctes (D7), impossibles à confondre par accident. |
| **Decorator / Chaîne de responsabilité** | `server/action-kit/create-action.ts` | Auth → permission → validation → limite de débit → exécution → audit → invalidation, appliqués uniformément. |
| **Result (Either)** | `core/shared/result.ts` | Erreurs métier typées, pas d'exception traversant la frontière serveur/client. |
| **DTO + Mapper** | `infrastructure/supabase/mappers/` | La forme SQL (`snake_case`, colonnes nullables) ne fuit jamais vers l'UI. |
| **Command** | `core/use-cases/**` | Une intention = un fichier = un test. |
| **Observer** | Journal d'audit déclenché après mutation | Tracer sans polluer chaque cas d'usage. |
| **Template Method** | `createResourceModule()` (Lot 8) | Les 9 collections partagent liste / formulaire / actions ; seules leurs différences sont déclarées. |
| **Specification** | `core/rbac/policy.ts` | `can()` compose des règles au lieu de les câbler en dur. |

### Le décorateur `createAction`, en détail

C'est la pièce la plus importante du dispositif : **aucune** mutation n'existe en dehors
d'elle.

```ts
// src/server/action-kit/create-action.ts — signature contractuelle
export function createAction<TInput extends z.ZodType, TOutput>(config: {
  /** Permission exigée. `null` = action volontairement publique (formulaires du site). */
  permission: Permission | null
  /** Schéma de validation de l'entrée. Rejoué serveur, jamais délégué au client. */
  input: TInput
  /** Étiquettes de cache à invalider après succès (peut dépendre du résultat). */
  invalidates?: (result: TOutput, input: z.infer<TInput>) => string[]
  /** Écriture au journal d'audit. */
  audit?: { action: string; entityType: string }
  /** Limitation de débit, pour les actions publiques. */
  rateLimit?: { max: number; windowSeconds: number }
  handler: (ctx: {
    input: z.infer<TInput>
    actor: Actor | null
  }) => Promise<Result<TOutput, AppError>>
}): (input: unknown) => Promise<ActionResult<TOutput>>
```

Ordre d'exécution imposé, non négociable :

```
1. rate limit        → 429 si dépassé
2. verifySession     → 401 si permission ≠ null et pas de session
3. can(actor, perm)  → 403 si refusé
4. input.safeParse   → 422 + fieldErrors si invalide
5. handler           → Result<T, AppError>
6. audit             → si succès et audit configuré
7. updateTag(...)    → invalidations déclarées
8. → ActionResult<T> sérialisable
```

`ActionResult` prolonge le `FormResult` déjà présent dans
`src/app/actions/forms.ts` — même esprit, forme généralisée :

```ts
type ActionResult<T> =
  | { ok: true; data: T; message?: string }
  | { ok: false; code: ErrorCode; message: string; fieldErrors?: Record<string, string> }
```

---

## 7. SOLID, concrètement

| Principe | Application vérifiable |
|---|---|
| **S** — Responsabilité unique | Un cas d'usage = un fichier = une intention. `publish-programme.ts` ne fait pas aussi la mise à jour. |
| **O** — Ouvert/fermé | Ajouter un bloc = une entrée dans le registre. Ajouter un rôle = une ligne dans `ROLE_PERMISSIONS`. Aucun fichier existant modifié. |
| **L** — Substitution de Liskov | `InMemoryProgrammeRepository` (tests) et `SupabaseProgrammeRepository` (prod) sont interchangeables ; les tests de cas d'usage tournent sur le premier. |
| **I** — Ségrégation des interfaces | Ports fins : `ProgrammeReadPort` et `ProgrammeWritePort` séparés. Une requête publique ne reçoit jamais un port capable d'écrire. |
| **D** — Inversion des dépendances | Les cas d'usage reçoivent leurs ports en argument. `core/` ne contient aucun `import` de `infrastructure/`. Vérifié par ESLint. |

---

## 8. Modèle de données Supabase

### Types énumérés

```sql
create type public.user_role      as enum ('super_admin', 'admin', 'editor');
create type public.content_status as enum ('draft', 'in_review', 'published', 'archived');
create type public.submission_status as enum ('new', 'read', 'handled', 'archived', 'spam');
create type public.media_tone     as enum ('navy', 'blue', 'green', 'orange', 'neutral');
```

`media_tone` reprend exactement `MediaTone` de
`src/components/media/media-placeholder.tsx`. Les deux doivent rester alignés.

### Tables

**Identité et accès**

| Table | Colonnes clés |
|---|---|
| `profiles` | `id uuid pk → auth.users(id) on delete cascade`, `email`, `full_name`, `avatar_media_id`, `role user_role not null default 'editor'`, `is_active bool default true`, `last_seen_at`, `created_at`, `updated_at` |
| `audit_logs` | `id`, `actor_id → profiles`, `action text`, `entity_type text`, `entity_id text`, `diff jsonb`, `ip inet`, `user_agent text`, `created_at` |

**Médias**

| Table | Colonnes clés |
|---|---|
| `media_assets` | `id`, `bucket text`, `path text unique`, `filename`, `mime_type`, `size_bytes`, `width`, `height`, `alt_text text not null`, `caption`, `folder text`, `uploaded_by → profiles`, `created_at` |

> `alt_text` est **non nul**. Le site respecte WCAG 1.1.1 ; le CMS ne doit pas permettre
> de régresser sur ce point. Le formulaire d'upload exige la saisie du texte alternatif.

**Pages et sections (Famille B)**

| Table | Colonnes clés |
|---|---|
| `pages` | `id`, `slug text unique`, `route text unique`, `title`, `meta_title`, `meta_description`, `og_media_id → media_assets`, `hero jsonb`, `status content_status`, `is_system bool` (une page système ne se supprime pas), `published_at`, `created_by`, `updated_by`, timestamps |
| `page_sections` | `id`, `page_id → pages on delete cascade`, `block_type text`, `position int`, `content jsonb not null`, `is_visible bool default true`, timestamps ; **unique (page_id, position)** |

**Collections (Famille A)**

| Table | Colonnes reprises du modèle TypeScript actuel |
|---|---|
| `programmes` | `slug unique`, `title`, `short_title`, `summary`, `icon text`, `tone media_tone`, `actions text[]`, `publics text[]`, `besoins text[]`, `benevolat_label`, `cover_media_id`, `gallery_media_ids uuid[]`, `body jsonb`, `position`, `status`, timestamps |
| `article_categories` | `slug unique`, `label`, `position` |
| `articles` | `slug unique`, `title`, `excerpt`, `body jsonb` (tableau de paragraphes, cf. `Actualite.body: string[]`), `category_id`, `cover_media_id`, `reading_minutes int`, `is_placeholder bool`, `published_at timestamptz`, `status`, `author_id`, timestamps |
| `team_members` | `name`, `role`, `bio`, `photo_media_id`, `position`, `status` |
| `testimonials` | `quote`, `author_name`, `author_role`, `programme_id → programmes`, `photo_media_id`, `position`, `status` |
| `core_values` | `title`, `description`, `icon`, `tone`, `position` |
| `faq_items` | `question`, `answer`, `bullets text[]`, `topic text check (topic in ('don','benevolat','general'))`, `position`, `status` |
| `stats` | `key text unique`, `label`, `value int **null**`, `suffix`, `icon`, `note`, `to_confirm bool`, `position`, `is_visible` |
| `gallery_categories` | `slug unique`, `label`, `tone media_tone`, `position` |
| `gallery_items` | `media_id → media_assets`, `category_id → gallery_categories`, `position`, `status` |
| `annual_reports` | `year int unique`, `title`, `document_media_id`, `position`, `status` |

> **`stats.value` est nullable, et ce n'est pas un détail.** C'est la traduction en base
> de l'invariant « aucun chiffre inventé » (§1). Le formulaire du dashboard propose
> explicitement une case « chiffre pas encore disponible » qui écrit `NULL`.

**Configuration (Famille C)**

| Table | Colonnes clés |
|---|---|
| `site_settings` | `group text primary key`, `value jsonb not null`, `updated_at`, `updated_by` |
| `navigation_items` | `id`, `menu text check (menu in ('main','conversion','legal','footer'))`, `label`, `href`, `description`, `parent_id → navigation_items`, `position`, `is_external bool`, `is_visible bool` |

Groupes de `site_settings`, chacun avec son schéma Zod dans `core/cms/schemas/settings/` :
`identity`, `contact`, `legal`, `socials`, `seo`, `theme`, `features`.

**Versions et données entrantes**

| Table | Colonnes clés |
|---|---|
| `content_versions` | `id`, `entity_type text`, `entity_id text`, `version_number int`, `snapshot jsonb`, `comment text`, `created_by`, `created_at` ; **unique (entity_type, entity_id, version_number)** |
| `form_submissions` | `id`, `form_type text check (form_type in ('contact','benevolat'))`, `payload jsonb`, `status submission_status default 'new'`, `handled_by → profiles`, `notes text`, `ip inet`, `created_at` |

### Règles transverses appliquées à toutes les tables

1. Clé primaire `uuid default gen_random_uuid()`.
2. `created_at` / `updated_at` en `timestamptz default now()`, `updated_at` maintenu par
   un trigger `public.set_updated_at()` unique et réutilisé.
3. Toute table exposée publiquement possède `status content_status` **ou** est une table
   de configuration lue par tous.
4. Toute liste ordonnée possède `position int not null` — le réordonnancement en
   glisser-déposer écrit ces entiers dans une seule transaction.
5. `alter table … enable row level security;` sur **toutes** les tables, sans exception.

### La fonction de rôle, et le piège de la récursion RLS

```sql
create or replace function public.app_current_role()
returns public.user_role
language sql
stable
security definer            -- indispensable
set search_path = public    -- indispensable
as $$
  select role from public.profiles where id = auth.uid()
$$;
```

> **Piège classique à connaître.** Une politique RLS posée sur `profiles` qui
> interrogerait `profiles` provoque une **récursion infinie** et rend la table
> inaccessible. `security definer` contourne la RLS à l'intérieur de la fonction et
> supprime le problème. `set search_path = public` est requis pour qu'une fonction
> `security definer` ne soit pas détournable. Ne pas simplifier ces deux lignes.

### Forme des politiques RLS

```sql
-- Lecture publique : contenu publié uniquement, pour tout le monde (anon inclus).
create policy "programmes_public_read" on public.programmes
  for select using (status = 'published');

-- Lecture complète pour le back-office (brouillons compris).
create policy "programmes_staff_read" on public.programmes
  for select to authenticated
  using (public.app_current_role() in ('super_admin','admin','editor'));

-- Écriture : les trois rôles créent et modifient…
create policy "programmes_staff_write" on public.programmes
  for insert to authenticated
  with check (public.app_current_role() in ('super_admin','admin','editor'));

-- …mais la suppression reste réservée.
create policy "programmes_admin_delete" on public.programmes
  for delete to authenticated
  using (public.app_current_role() in ('super_admin','admin'));
```

La restriction « l'éditeur ne publie pas » est portée par la matrice de permissions
applicative (§9) **et** doublée en base par un trigger qui refuse la transition vers
`published` si `app_current_role() = 'editor'`. Deux barrières indépendantes.

### Claim JWT pour les contrôles optimistes

Un *Custom Access Token Hook* Supabase injecte `user_role` dans le JWT. Cela permet à
`proxy.ts` de filtrer sans requête SQL. **Ce claim n'est jamais l'autorité** : il peut
être périmé si le rôle vient de changer. L'autorité reste `app_current_role()` en base
et le DAL côté serveur.

---

## 9. RBAC — rôles, permissions, triple barrière

### Vocabulaire

Une permission est la chaîne `` `${resource}:${action}` ``.

- **Ressources** : `page`, `section`, `programme`, `article`, `gallery`, `team`,
  `testimonial`, `faq`, `stat`, `document`, `media`, `settings`, `navigation`, `theme`,
  `user`, `submission`, `audit`
- **Actions** : `read`, `create`, `update`, `delete`, `publish`, `reorder`

### Matrice des rôles

| Domaine | `super_admin` | `admin` | `editor` |
|---|:---:|:---:|:---:|
| Lire le contenu (tous états) | ✅ | ✅ | ✅ |
| Créer / modifier du contenu | ✅ | ✅ | ✅ |
| **Publier / dépublier** | ✅ | ✅ | ❌ |
| **Supprimer du contenu** | ✅ | ✅ | ❌ |
| Réordonner | ✅ | ✅ | ✅ |
| Téléverser un média | ✅ | ✅ | ✅ |
| Supprimer un média | ✅ | ✅ | ❌ |
| Composer les pages (sections) | ✅ | ✅ | ✅ (édition), ❌ (ajout/suppression) |
| Réglages du site | ✅ | ✅ | ❌ |
| Navigation | ✅ | ✅ | ❌ |
| Thème | ✅ | ✅ | ❌ |
| Lire les messages reçus | ✅ | ✅ | ✅ |
| Supprimer un message | ✅ | ✅ | ❌ |
| Inviter un utilisateur | ✅ | ✅ | ❌ |
| **Changer le rôle d'un utilisateur** | ✅ | ❌ | ❌ |
| **Supprimer un utilisateur** | ✅ | ❌ | ❌ |
| Journal d'audit | ✅ | ✅ (lecture) | ❌ |

Deux règles de sûreté supplémentaires, implémentées comme invariants :

- Un `super_admin` ne peut ni se rétrograder ni se désactiver lui-même **s'il est le
  dernier `super_admin` actif**. Vérifié en base par un trigger, pas seulement dans l'UI.
- Un utilisateur ne peut jamais s'attribuer une permission qu'il ne possède pas déjà.

### Les trois barrières

| # | Où | Nature | Rôle |
|---|---|---|---|
| 1 | `proxy.ts` | **Optimiste** — lit le cookie/JWT, aucune requête base | Rediriger vite. Confort, pas sécurité. |
| 2 | `src/server/dal/` + `createAction` | **Autoritaire** — session vérifiée, rôle relu en base | La vraie garde applicative. |
| 3 | Politiques RLS PostgreSQL | **Dernier rempart** | Protège même en cas de bug applicatif ou de clé anon fuitée. |

> La barrière 1 ne fait **jamais** d'appel base : `proxy.ts` s'exécute sur chaque
> requête, y compris les préchargements de navigation. Une requête SQL à cet endroit
> dégrade tout le site.

---

## 10. Le registre de blocs, cœur du CMS

C'est ce qui distingue un CMS d'une collection de formulaires CRUD.

### Le contrat

```ts
// src/core/cms/blocks/types.ts
export type FieldDescriptor =
  | { kind: 'text';     name: string; label: string; required?: boolean; maxLength?: number; hint?: string }
  | { kind: 'textarea'; name: string; label: string; required?: boolean; maxLength?: number; rows?: number }
  | { kind: 'richtext'; name: string; label: string; required?: boolean }
  | { kind: 'number';   name: string; label: string; min?: number; max?: number; nullable?: boolean }
  | { kind: 'boolean';  name: string; label: string }
  | { kind: 'select';   name: string; label: string; options: { value: string; label: string }[] }
  | { kind: 'media';    name: string; label: string; accept: 'image' | 'document' | 'video' }
  | { kind: 'link';     name: string; label: string }
  | { kind: 'icon';     name: string; label: string }
  | { kind: 'tone';     name: string; label: string }
  | { kind: 'list';     name: string; label: string; itemLabel: string; of: FieldDescriptor[] }
  | { kind: 'reference'; name: string; label: string; resource: ResourceName; multiple?: boolean }

export type BlockDescriptor<S extends z.ZodType = z.ZodType> = {
  type: BlockType
  label: string            // libellé humain : « Bannière d'appel à l'action »
  description: string      // aide affichée dans le sélecteur de blocs
  icon: LucideIcon
  category: 'contenu' | 'mise-en-avant' | 'conversion' | 'media'
  schema: S                // validation, à l'écriture ET à la lecture
  defaults: z.infer<S>     // contenu d'un bloc fraîchement ajouté
  fields: FieldDescriptor[]// pilote le formulaire généré automatiquement
  Renderer: ComponentType<{ content: z.infer<S> }>  // rendu sur le site public
}
```

### Les blocs de la version 1

Ils sont dérivés des sections existantes recensées au §1 — aucun bloc inventé.

| `type` | Libellé dashboard | Alimente |
|---|---|---|
| `page-hero` | En-tête de page | `PageHero` |
| `rich-text` | Texte libre | paragraphes |
| `image-text` | Image + texte | section « Qui sommes-nous », « Mission » |
| `stats-grid` | Grille de chiffres clés | `StatCard` |
| `values-grid` | Grille de valeurs | `ValueCard` |
| `programmes-grid` | Grille de programmes | `ProgrammeCard` |
| `news-grid` | Dernières actualités | `NewsCard` |
| `testimonials` | Témoignages | `TestimonialCard` |
| `team-grid` | Équipe | section Équipe |
| `faq` | Questions fréquentes | `FAQAccordion` |
| `cta-banner` | Bannière d'appel à l'action | `CTABanner` |
| `gallery-preview` | Aperçu de la galerie | `/galerie` |
| `video` | Vidéo | `VideoEmbed` / `VideoPlayer` |
| `documents-list` | Liste de documents | rapports annuels |
| `contact-info` | Coordonnées | section Coordonnées |
| `donation-options` | Moyens de don | `/don` |
| `feature-list` | Liste à puces illustrée | engagements, zones d'intervention |

### Les trois propriétés que ce registre garantit

1. **Ajouter un bloc n'exige aucune migration SQL** — `page_sections.content` est du
   JSONB ; seule une entrée du registre est ajoutée.
2. **Le formulaire d'édition n'est jamais écrit à la main** — `<SchemaForm>` le génère
   depuis `fields`. Un bloc à douze champs coûte douze lignes de déclaration.
3. **Le contenu ne peut pas être incohérent** — `schema.parse()` est appliqué à
   l'écriture *et* à la lecture. Un JSONB corrompu par une migration est détecté au
   rendu, pas silencieusement affiché.

---

## 11. Cache et revalidation

### Convention d'étiquetage

| Portée | Étiquette | Exemple |
|---|---|---|
| Collection entière | `cms:<resource>` | `cms:programmes` |
| Élément | `cms:<resource>:<id ou slug>` | `cms:programme:education` |
| Page composée | `cms:page:<slug>` | `cms:page:accueil` |
| Groupe de réglages | `cms:settings:<group>` | `cms:settings:theme` |
| Navigation | `cms:navigation:<menu>` | `cms:navigation:main` |

### Lecture publique — le modèle à suivre

```ts
// src/server/queries/programmes.ts
import { cacheTag, cacheLife } from 'next/cache'
import { createPublicClient } from '@/infrastructure/supabase/clients'

export async function getPublishedProgrammes() {
  'use cache'
  cacheTag('cms:programmes')
  cacheLife('days')          // borne haute ; l'invalidation reste pilotée par les tags

  // createPublicClient() : SANS cookies — obligatoire dans un scope 'use cache'
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('programmes')
    .select('*')
    .eq('status', 'published')
    .order('position')

  if (error) throw error
  return data.map(toProgramme)
}
```

### Écriture — invalidation

Dans une **Server Action** (cas général) : `updateTag('cms:programmes')`.
`updateTag` expire immédiatement et la requête suivante attend la donnée fraîche —
l'éditeur voit son changement tout de suite. C'est la sémantique voulue pour un CMS.

Dans un **Route Handler** (webhook, tâche planifiée) : `updateTag` n'y est **pas
disponible**. Utiliser `revalidateTag('cms:programmes', 'max')` — le second argument est
**obligatoire** en Next.js 16.

### Prévisualisation

`app/api/preview/route.ts` vérifie la session et la permission `page:read`, puis appelle
`(await draftMode()).enable()` et redirige vers l'URL publique.
Quand le Draft Mode est actif, Next.js réexécute les scopes `'use cache'` à chaque
requête sans mettre en cache : la prévisualisation montre donc les brouillons sans
polluer le cache public. `draftMode().isEnabled` est lisible **à l'intérieur** d'un
scope `'use cache'` — contrairement à `cookies()` et `headers()`.

---

## 12. Design system et responsivité du dashboard

Le dashboard **réutilise** les primitives shadcn existantes de `src/components/ui/`
(21 composants déjà en place, palette et tokens compris). Il n'introduit pas une seconde
identité visuelle. Ce qui s'y ajoute est une couche de composants de *composition*.

### Les huit composants réutilisables imposés

| Composant | Rôle | Points non négociables |
|---|---|---|
| `<DashboardShell>` | Sidebar + Topbar + zone de contenu | Sidebar rétractable ; en mobile, `Sheet` en tiroir. Navigation filtrée par permissions. |
| `<PageHeader>` | Titre, fil d'Ariane, actions | Une seule action primaire par écran. |
| `<DataTable>` | Liste générique | Recherche, filtre par statut, tri, pagination, sélection multiple, réordonnancement, états vide/chargement/erreur. Colonnes déclarées, jamais codées en dur. |
| `<SchemaForm>` | Formulaire généré depuis `FieldDescriptor[]` | `react-hook-form` + `zodResolver`, comme les formulaires du site. Réutilise `Field` et `fieldAria` de `src/components/forms/field.tsx` — libellé associé, `role="alert"`, icône **et** texte pour l'erreur. |
| `<FormModal>` | Modale de création/édition | Repose sur `Dialog` en desktop et `Sheet` en mobile. **Confirme avant fermeture si le formulaire est modifié.** |
| `<ConfirmDialog>` | Confirmation destructive | Nomme l'élément concerné (« Supprimer *Éducation* ? »), verbe d'action explicite, jamais « OK ». |
| `<MediaPicker>` | Sélection dans la médiathèque | Modale : parcourir, rechercher, téléverser, recadrer. Le texte alternatif est exigé à l'upload. |
| `<StatusBadge>` | État éditorial | Couleur **et** libellé — jamais la couleur seule (contrainte d'accessibilité du projet). |

### Règles d'ergonomie héritées du site public

Elles sont déjà appliquées côté site et doivent l'être côté dashboard :

- **Cibles tactiles ≥ 44 px.** `src/components/ui/button.tsx` a déjà relevé les hauteurs
  shadcn de 32–36 px à 44 px. Ne pas les rabaisser dans le dashboard.
- **Contraste AA.** Toute couleur posée derrière du texte doit atteindre 4,5:1. Les
  tokens `*-ink` de `globals.css` existent pour ça.
- **Erreur jamais signalée par la seule couleur** — icône + texte, comme dans `Field`.
- **`prefers-reduced-motion` respecté.**
- **Retour systématique après action** — `sonner` est déjà installé et monté.

### Trois exigences propres au CMS

1. **Sauvegarde protégée.** Quitter un formulaire modifié déclenche une confirmation.
   Un bénévole qui perd vingt minutes de saisie n'y revient pas.
2. **Vocabulaire métier, pas technique.** « Article », « Section », « Publier » — jamais
   « entity », « payload », « slug » sans explication. Le champ URL affiche
   « Adresse de la page » avec un aperçu `adebesgroup.com/actualites/mon-article`.
3. **Aide contextuelle.** Chaque champ non évident porte un `hint`. Chaque écran vide
   explique quoi faire, avec un bouton d'action — jamais un tableau vide muet.

---

### Responsivité — le dashboard est utilisable au téléphone

> **Exigence.** Le dashboard est **entièrement responsive** : chaque écran, chaque
> formulaire et chaque action doivent être réalisables depuis un téléphone de 360 px de
> large comme depuis un écran de 2560 px. Il ne s'agit pas d'une version mobile dégradée
> du bureau, mais d'une contrainte de conception de même rang que le contraste AA.

**Pourquoi c'est structurant et non cosmétique.** Les personnes qui alimenteront ce CMS
publient depuis un téléphone, souvent en déplacement et sur une connexion mobile. Un
dashboard confortable au bureau et inutilisable au téléphone produit exactement l'échec
décrit au §16 : l'utilisateur non technique renonce et redemande au développeur. La
responsivité est donc une condition d'adoption, pas une finition.

Le site public est déjà construit ainsi (`Container` en `px-5 sm:px-6 lg:px-8`, en-tête
en `Sheet` sous `xl`, `StickyMobileActionBar`, `.pb-action-bar` avec
`env(safe-area-inset-bottom)`). Le dashboard reprend ces acquis ; il n'invente pas une
seconde doctrine.

#### Contrat de points de rupture

Les points de rupture sont ceux de **Tailwind v4 par défaut**. Aucun point de rupture
personnalisé n'est introduit : le projet n'en déclare aucun aujourd'hui, et en ajouter un
obligerait à relire toute la feuille de style.

| Alias | Largeur | Cible réelle | Rôle dans le dashboard |
|---|---|---|---|
| *(base)* | < 640 px | téléphone portrait (360 · 390 · 414) | une seule colonne, tiroirs, cartes |
| `sm:` | ≥ 640 px | téléphone paysage, petit format | densification typographique, quelques paires de champs |
| `md:` | ≥ 768 px | tablette portrait | **premier seuil décisif** : le tableau redevient un tableau |
| `lg:` | ≥ 1024 px | tablette paysage, portable | **deuxième seuil décisif** : sidebar persistante |
| `xl:` | ≥ 1280 px | bureau | **troisième seuil décisif** : trois zones simultanées |
| `2xl:` | ≥ 1536 px | grand écran | largeur de lecture bornée, aucun étirement |

**Trois seuils seulement portent une décision de structure** — 768, 1024, 1280. Les
autres n'ajustent que la typographie et les espacements. Toute nouvelle bascule de
structure doit s'aligner sur ces trois valeurs ou faire l'objet d'une ligne
supplémentaire dans ce tableau.

#### Comportement attendu, zone par zone

| Zone | < 768 px | 768 – 1023 px | ≥ 1024 px |
|---|---|---|---|
| **Sidebar** | masquée, ouverte en `Sheet` à gauche, fermée automatiquement à la navigation | idem | fixe, 264 px, rétractable à 72 px (icônes seules), état en `localStorage` |
| **Topbar** | hauteur 56 px, bouton menu + titre court + menu utilisateur ; fil d'Ariane masqué | fil d'Ariane tronqué (dernier niveau + « … ») | fil d'Ariane complet, recherche, thème, menu utilisateur |
| **`<PageHeader>`** | titre sur 2 lignes autorisées, actions empilées pleine largeur, action primaire en premier | titre + actions sur une ligne si la place suffit | titre à gauche, actions à droite |
| **`<DataTable>`** | **liste de cartes** : titre, statut, 2 métadonnées, menu d'actions | tableau réel, colonnes `hideOnMobile` masquées | tableau complet |
| **Filtres et recherche** | recherche visible, filtres regroupés dans un `Sheet` « Filtrer » avec compteur de filtres actifs | barre de filtres sur une ligne, débordement défilant | barre de filtres complète |
| **Sélection multiple** | barre d'actions groupées fixée en bas, au-dessus de la zone sûre | barre en bas de tableau | barre en bas de tableau |
| **`<SchemaForm>`** | une colonne, libellés au-dessus, champs pleine largeur | une colonne, largeur bornée à 42 rem | deux colonnes **au maximum**, champs longs (`textarea`, `list`) sur toute la largeur |
| **Barre d'enregistrement** | fixe en bas (`sticky bottom-0`), « Enregistrer » pleine largeur, respect de `env(safe-area-inset-bottom)` | fixe en bas de la carte de formulaire | en haut à droite du `<PageHeader>` |
| **`<FormModal>`** | `Sheet` plein écran, en-tête et pied fixes, corps défilant | `Sheet` | `Dialog` centré, `max-w-2xl`, corps défilant |
| **`<ConfirmDialog>`** | `Dialog` recentré, boutons empilés, action destructive **en dernier** | `Dialog` | `Dialog`, boutons alignés à droite |
| **`<MediaPicker>`** | plein écran, grille 2 colonnes, panneau de détail en second écran | grille 3 colonnes, détail en panneau latéral | grille 4–6 colonnes, détail en panneau latéral |
| **Médiathèque** | grille 2 colonnes | 3–4 colonnes | 5–6 colonnes, borne haute pour éviter les vignettes minuscules |
| **Constructeur de pages** (Lot 9) | **trois onglets** : « Sections » · « Contenu » · « Réglages » | deux zones : liste des sections + édition ; réglages en `Sheet` | trois zones simultanées (`xl:`) |
| **Tableau de bord d'accueil** | tuiles en 1 colonne (2 dès `sm:`) | 2 colonnes | 3 colonnes |
| **Journal d'audit** | cartes chronologiques, différentiel repliable | tableau | tableau + panneau de détail |

#### Les dix règles de mise en œuvre

1. **Mobile d'abord.** Les classes sans préfixe décrivent le téléphone ; `md:`, `lg:` et
   `xl:` **ajoutent**. Écrire `grid-cols-1 lg:grid-cols-3`, jamais
   `grid-cols-3 max-lg:grid-cols-1`. Cette convention est déjà celle du site public.
2. **Aucun défilement horizontal de page**, jusqu'à 320 px de large inclus. C'est un
   critère de recette binaire, vérifiable :
   `document.documentElement.scrollWidth <= window.innerWidth`.
3. **Le contenu large défile dans son propre conteneur**, jamais dans la page : tableau
   à colonnes nombreuses, bloc de code, aperçu d'URL, valeur JSON du journal d'audit.
   Le conteneur porte `overflow-x-auto` et un ombrage de bord indiquant qu'il reste du
   contenu.
4. **Cibles tactiles ≥ 44 px à tous les points de rupture.** La règle du site public
   (§12, `button.tsx` déjà relevé à 44 px) ne se relâche pas sur les écrans larges : une
   tablette tactile de 1024 px reste un écran tactile. Les cellules d'action d'un
   tableau et les poignées de glisser-déposer sont concernées au premier chef.
5. **Hauteurs en `dvh`, jamais en `vh`.** `100vh` ignore la barre d'adresse mobile et
   coupe le bas des tiroirs et des modales sur iOS et Android. Les surfaces plein écran
   utilisent `h-dvh` / `min-h-dvh`.
6. **Zones sûres respectées.** Toute barre fixée en bas (enregistrement, actions
   groupées) ajoute `env(safe-area-inset-bottom)`, comme le fait déjà `.pb-action-bar`.
   Ne pas réutiliser cette classe telle quelle : elle est dimensionnée pour la
   `StickyMobileActionBar` du site public, absente du dashboard (§5.3 du Rapport 2).
7. **Taille de police des champs ≥ 16 px sur mobile.** En deçà, iOS Safari zoome
   automatiquement à la mise au point et casse la mise en page. Les `Input`, `Textarea`
   et `Select` du dashboard sont donc en `text-base` sous `md:`, `text-sm` au-delà.
8. **Aucune information ni action accessible uniquement au survol.** Un `title`, un
   `Tooltip` ou un menu ouvert au survol n'existent pas sur un écran tactile. Toute
   action de ligne est atteignable par un clic ou un appui. Le `Tooltip` reste autorisé
   comme **complément** — jamais comme unique porteur d'un libellé, y compris pour la
   sidebar rétractée à 72 px, dont chaque icône porte un `aria-label`.
9. **La responsivité est faite en CSS, pas en JavaScript.** Une seule exception,
   assumée : le remplacement d'un composant par un autre (`Dialog` ⇄ `Sheet`) ne peut pas
   se faire en CSS. Il passe par **un unique** hook `useIsDesktop()`
   (`src/hooks/use-breakpoint.ts`), SSR-safe, qui est le **seul endroit du dépôt** où un
   point de rupture est lu en JavaScript. Aucun `window.innerWidth` ailleurs.
10. **Largeur de lecture bornée.** Au-delà de 1536 px, la zone de contenu est bornée
    (`max-w-screen-2xl mx-auto`) et les formulaires à `max-w-3xl`. Un formulaire étiré
    sur 2500 px est aussi inutilisable qu'un formulaire écrasé sur 360 px.

#### Ce qui est explicitement interdit

| Interdit | Raison |
|---|---|
| `min-width` sur le `<body>` ou un conteneur de page | Provoque le défilement horizontal que la règle 2 interdit. |
| Un tableau à défilement horizontal comme seule réponse au mobile | Illisible : la colonne d'identification sort de l'écran. La bascule en cartes sous 768 px est obligatoire. |
| Masquer une action en `hidden md:block` sans équivalent mobile | Une fonctionnalité invisible au téléphone est une fonctionnalité absente. Elle doit être déplacée (menu, tiroir), pas supprimée. |
| `100vh` sur une surface plein écran | Coupe le contenu sous la barre d'adresse mobile (règle 5). |
| Points de rupture personnalisés ou valeurs en dur (`@media (max-width: 991px)`) | Sort du contrat du tableau ci-dessus et devient invisible à la relecture. |
| Rendu conditionnel de mise en page piloté par `window.innerWidth` | Décalage d'hydratation et clignotement au chargement (règle 9). |
| Réduire la hauteur des boutons sous 44 px pour « gagner de la place » | Régression d'accessibilité, contraire au §12 et au socle du site public. |

#### Glisser-déposer et tactile

Le réordonnancement (`@dnd-kit`, Lot 0.1) est le point le plus fragile en mobile.
Trois exigences :

1. `PointerSensor` avec une **contrainte d'activation** (8 px de déplacement ou 200 ms de
   pression) — sans elle, tout défilement de la liste au doigt déclenche un déplacement.
2. `KeyboardSensor` activé : le réordonnancement doit être réalisable au clavier seul.
3. **Une alternative sans glisser-déposer est obligatoire** : « Monter » / « Descendre »
   dans le menu d'actions de la ligne. C'est le seul moyen fiable sur un petit écran, et
   c'est aussi ce qui rend l'opération accessible aux technologies d'assistance.

#### Matrice de recette responsive

Tout écran du dashboard est vérifié à ces cinq largeurs avant qu'un lot soit déclaré
terminé. Le point à 320 px n'est pas décoratif : c'est le mode « texte agrandi » d'un
téléphone courant.

| Largeur | Appareil représenté | À vérifier |
|---|---|---|
| **320 px** | petit téléphone / zoom 200 % | aucun débordement, aucun texte tronqué, boutons atteignables |
| **390 px** | téléphone courant | parcours complet : lister → créer → enregistrer → publier |
| **768 px** | tablette portrait | bascule cartes → tableau, formulaire encore lisible |
| **1024 px** | portable | sidebar persistante, rétraction, mémorisation |
| **1440 px** | bureau | largeurs bornées, pas d'étirement, densité correcte |

Deux vérifications transverses s'ajoutent, à chaque largeur : **navigation au clavier
avec focus visible**, et **zoom navigateur à 200 %** sans perte de fonctionnalité
(WCAG 1.4.4), la seconde étant déjà satisfaite par la première si les règles 1 à 3 sont
respectées.

---

## 13. Sécurité

| Menace | Parade |
|---|---|
| Server Action appelée directement en POST | `createAction` impose auth + permission + validation. Aucune action définie hors de ce décorateur. |
| Élévation de privilège | Rôle relu en base à chaque mutation ; le claim JWT ne sert qu'aux redirections optimistes. |
| Clé `anon` fuitée | RLS active sur toutes les tables : lecture du seul contenu publié. |
| Clé `service_role` fuitée | Jamais préfixée `NEXT_PUBLIC_`. Utilisée dans quatre fichiers au plus, tous listés au Lot 3. |
| Injection SQL | Client Supabase paramétré ; aucune concaténation de requête. |
| XSS par contenu éditorial | Le rendu passe par React (échappement natif). Si un éditeur riche est introduit, sortie assainie côté serveur avant stockage. `escapeHtml` existe déjà dans `src/app/actions/forms.ts` pour les e-mails. |
| Upload malveillant | Type MIME et taille validés côté serveur, extension recalculée, nom de fichier régénéré. Buckets sans exécution. |
| Spam sur formulaires publics | Honeypot déjà en place (`src/lib/schemas.ts`) + limitation de débit ajoutée au Lot 16. |
| Fuite de données par le DTO | Les mappers ne retournent que les colonnes nécessaires ; `profiles` n'expose jamais l'e-mail sur le site public. |
| CSRF | Protection native des Server Actions Next.js, cookies `SameSite=Lax`. |
| En-têtes | `next.config.ts` pose déjà `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`. Une CSP est ajoutée au Lot 16. |

---

## 14. Conventions de nommage

| Élément | Convention | Exemple |
|---|---|---|
| Fichiers TypeScript | `kebab-case.ts` | `create-programme.ts` |
| Composants React | `PascalCase` dans un fichier `kebab-case.tsx` | `MediaPicker` dans `media-picker.tsx` |
| Types et interfaces | `PascalCase`, **sans** préfixe `I` | `ProgrammeRepository` |
| Schémas Zod | `camelCase` + suffixe `Schema` | `createProgrammeSchema` |
| Cas d'usage | verbe à l'infinitif anglais | `publishArticle`, `reorderSections` |
| Server Actions | verbe + suffixe `Action` | `createProgrammeAction` |
| Ports | nom + suffixe `Port` | `ProgrammeReadPort` |
| Implémentations | préfixe technologique | `SupabaseProgrammeRepository` |
| Tables SQL | `snake_case` pluriel | `page_sections` |
| Colonnes SQL | `snake_case` | `cover_media_id` |
| Clés étrangères | `<entité>_id` | `programme_id` |
| Booléens SQL | préfixe `is_` / `has_` | `is_visible` |
| Étiquettes de cache | `cms:<ressource>[:<id>]` | `cms:article:rentree-solidaire` |
| Routes du dashboard | **français**, cohérent avec le site | `/dashboard/actualites` |
| Variables d'environnement | `SCREAMING_SNAKE_CASE` | `SUPABASE_SERVICE_ROLE_KEY` |

**Langue.** Le code (identifiants, types, cas d'usage) est en **anglais**. Tout ce que
lit un humain — libellés d'interface, messages d'erreur, commentaires, routes du
dashboard — est en **français**, comme l'ensemble du projet actuel.

---

## 15. Contraintes Next.js 16 — règles anti-hallucination

> Cette version de Next.js diffère des versions antérieures sur des points qui touchent
> directement ce chantier. Les erreurs listées ici sont celles qu'un modèle entraîné sur
> Next.js 13/14/15 commettra par défaut. Chacune a été vérifiée dans
> `node_modules/next/dist/docs/`.

| # | ❌ Faux en Next.js 16 | ✅ Correct |
|---|---|---|
| 1 | `middleware.ts`, fonction `middleware()` | **`proxy.ts`**, fonction `proxy()`. Runtime `nodejs` imposé, `edge` non supporté. |
| 2 | `skipMiddlewareUrlNormalize` | `skipProxyUrlNormalize` |
| 3 | `const { slug } = params` | `const { slug } = await params` — `params` et `searchParams` sont des **Promesses** |
| 4 | `cookies()`, `headers()`, `draftMode()` synchrones | **`await cookies()`**, `await headers()`, `await draftMode()` |
| 5 | `revalidateTag('posts')` | `revalidateTag('posts', 'max')` — le profil `cacheLife` est **obligatoire** |
| 6 | `updateTag()` dans un Route Handler | `updateTag()` **uniquement** dans une Server Action ; ailleurs, `revalidateTag` |
| 7 | `unstable_cacheTag`, `unstable_cacheLife` | `import { cacheTag, cacheLife } from 'next/cache'` — stabilisés |
| 8 | `experimental.ppr`, `experimental_ppr` | supprimés — utiliser `cacheComponents: true` |
| 9 | `experimental.dynamicIO`, `experimental.useCache` | remplacés par `cacheComponents: true` |
| 10 | `cookies()` / `headers()` dans un scope `'use cache'` | interdit → passer les valeurs en arguments, ou utiliser `createPublicClient()` |
| 11 | `images.domains` | `images.remotePatterns` |
| 12 | `next lint` | `eslint` en configuration plate (le projet a déjà `eslint.config.mjs`) |
| 13 | `export const runtime = 'edge'` avec Cache Components | incompatible — runtime Node.js requis |
| 14 | Types de props écrits à la main | `npx next typegen` puis `PageProps<'/programmes/[slug]'>`, `LayoutProps<'/'>`, `RouteContext<…>`. Le projet les utilise déjà (`app/layout.tsx`). |

**Deux règles supplémentaires propres à ce dépôt :**

15. `AGENTS.md` est **réécrit automatiquement par `next dev`**. Ne pas le retirer d'un
    diff : le supprimer recrée simplement une modification non commitée.
16. Une variable d'environnement **déclarée mais vide vaut `""`, pas `undefined`** —
    `??` ne la rattrape pas. `src/lib/site-config.ts` et `src/app/actions/forms.ts`
    traitent déjà ce cas ; reprendre le même helper `env()` pour toute nouvelle
    variable.

---

## 16. Risques et parades

| Risque | Impact | Parade |
|---|---|---|
| Confusion entre `createServerClient` et `createPublicClient` dans un scope `'use cache'` | Erreur d'exécution ou fuite de brouillons | Nommage explicite + commentaire d'en-tête dans chaque fabrique + règle ESLint interdisant l'import de `client.server` depuis `src/server/queries/**` |
| Migration `src/content/` → base incomplète | Le site affiche des données partielles | Lot 14 : bascule collection par collection, avec un script de seed rejouable et une vérification page par page |
| `cacheComponents` change le comportement de rendu | Régressions de performance | Lot 15 isolé et mesuré ; repli documenté en D4 |
| Récursion RLS sur `profiles` | Table inaccessible, dashboard mort | Fonction `security definer` (§8), testée au Lot 1 avant tout code applicatif |
| Perte du contraste AA via l'éditeur de thème | Régression d'accessibilité | Calcul du ratio affiché en direct dans l'éditeur + avertissement bloquant sous 4,5:1 |
| Contenu JSONB invalidé par une évolution de schéma | Page cassée en production | `schema.safeParse` à la lecture : le bloc invalide est ignoré et signalé dans le dashboard, la page ne casse pas |
| Utilisateur non technique perdu | CMS inutilisé, retour aux demandes au développeur | Vocabulaire métier, aide contextuelle, écrans vides explicatifs (§12) |
| Perte de saisie | Frustration, abandon | Confirmation avant fermeture d'un formulaire modifié |
| Dashboard conçu au bureau, inutilisable au téléphone | Le CMS n'est pas adopté par ceux qui devaient s'en servir | Contrat de points de rupture et matrice de recette responsive (§12), vérifiés à 320/390/768/1024/1440 px **avant** de clore chaque lot d'interface |
| Dernier `super_admin` supprimé | Perte d'accès définitive | Trigger en base interdisant la suppression/rétrogradation du dernier `super_admin` actif |

---

## Ce que le Rapport 2 apporte

Ce document a fixé **quoi** et **pourquoi**. Le
[Rapport 2](./RAPPORT-02-PLAN-IMPLEMENTATION.md) fixe **dans quel ordre**, avec pour
chaque lot : les fichiers exacts à créer, le contenu attendu, les critères de recette et
la commande de vérification.
