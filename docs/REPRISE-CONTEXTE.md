# Prompt de reprise — mini CMS ADEBES

> **Mode d'emploi.** Copiez tout ce fichier dans une nouvelle session, puis
> ajoutez votre demande (« on continue », ou un lot précis).
>
> **À maintenir.** Mettez-le à jour à la fin de chaque lot : c'est la mémoire du
> chantier. Un écart non consigné ici sera « corrigé » à tort par la session
> suivante, qui le prendra pour une erreur.

---

Agis en expert Next.js (TypeScript) full-stack.

Nous construisons un mini CMS pour le site associatif ADEBES, en suivant deux
documents qui font autorité :

- `docs/RAPPORT-01-ARCHITECTURE.md` — décisions D1–D8, arborescence, matrice
  RBAC, modèle de données, contraintes Next.js 16.
- `docs/RAPPORT-02-PLAN-IMPLEMENTATION.md` — les 17 lots, avec la recette de
  chacun.
- `docs/RAPPORT-03-ORM-PRISMA.md` — décision : **pas de Prisma**, on reste sur
  le client Supabase derrière des Ports & Repositories. Ne pas rouvrir.

**Lis les trois avant d'écrire une ligne.** Ils sont longs ; ne réponds pas de
mémoire sur leur contenu.

## Règles de travail

1. **Aucun lot n'est terminé sans sa recette exécutée.** Pas « ça devrait
   marcher » : on exécute et on montre la sortie. Un lot partiellement livré est
   signalé comme tel.
2. `npm run build`, `npx tsc --noEmit` et `npx eslint .` doivent passer —
   **zéro erreur et zéro avertissement** — à la fin de chaque lot. Vérifie les
   codes de sortie, pas la sortie tronquée par un `head`.
3. **Ne rien inventer comme contenu.** Les deux invariants du projet tiennent :
   aucun chiffre fabriqué (une valeur absente est `NULL`, affichée « — », jamais
   `0`), aucun lien mort (un réseau non configuré est grisé).
4. **Langue** : identifiants et types en anglais ; libellés, messages d'erreur,
   commentaires et routes du dashboard en français.
5. **Next.js 16** : `proxy.ts` (pas `middleware.ts`), `await params` /
   `await searchParams` / `await cookies()`, `updateTag` en Server Action et
   `revalidateTag(tag, 'max')` ailleurs, `cacheTag`/`cacheLife` depuis
   `next/cache`. En cas de doute sur une API, lire
   `node_modules/next/dist/docs/` — **jamais** se fier à la mémoire.
6. **Signale tout écart** entre le code et les rapports, et consigne-le dans ce
   fichier. Les rapports contiennent des erreurs réelles (voir plus bas) : les
   suivre aveuglément casse le projet.
7. Ne pas lancer d'agent ni de workflow sans qu'on le demande.

---

## État au terme du Lot 8C

### Lots livrés et recettés

| Lot | Contenu | Recette |
|---|---|---|
| 0 | Dépendances, `.env`, garde-fous ESLint, `remotePatterns` | ✅ testée |
| 1 | 11 migrations + seed, appliqués sur la base distante | ✅ 22 tests anon + 12 authentifiés |
| 2 | `src/core/` — Result, erreurs, RBAC, slug, icônes, ports, cas d'usage programmes | ✅ 47 tests |
| 3 | 4 clients Supabase, mappers, repository, Storage, `reorder_rows` | ✅ 40 tests sur base réelle |
| 4 | Auth, route groups, `src/proxy.ts`, DAL, `createAction` | ✅ recette runtime sur serveur de prod |
| 5 | Coquille du dashboard, navigation filtrée, tableau de bord d'accueil | ✅ 29 tests HTTP + 24 mesures navigateur |
| 6 | Design system : DataTable, SchemaForm, FormModal, ConfirmDialog, StatusBadge, EmptyState | ✅ 51 mesures navigateur |
| 7 | Médiathèque : domaine média, dépôt, Storage, `<MediaPicker>`, `<CmsImage>` | ✅ 82 tests purs + 43 sur base réelle + 81 mesures navigateur |
| 8A | Programmes de bout en bout : deps, 5 actions, requêtes publiques, 3 écrans, bascule du site | ✅ 59 tests purs + 50 HTTP + 78 parcours navigateur + 61 mesures responsive = **248, 0 échec** |
| 8B | Actualités de bout en bout : domaine, catégories gérables, champ `date`, 4 + 4 actions, 3 écrans, bascule du site | ✅ 119 tests purs + 57 sur base réelle + 69 HTTP + 67 parcours navigateur + 77 mesures responsive = **389, 0 échec** |
| 8C | Témoignages de bout en bout : domaine, **règle de consentement appliquée dans le domaine**, 5 actions, 3 écrans, bascule de l'accueil | ✅ 174 tests purs + 78 sur base réelle + 92 HTTP + 69 parcours navigateur + 85 mesures responsive = **498, 0 échec** |

### Environnement (déjà configuré, ne pas refaire)

- Projet Supabase `vulqavwbfybwqrufgctj`, **région `eu-west-2` (Londres)** — le
  §0.2 prévoyait `eu-west-3` (Paris) ; l'écart est connu et assumé.
- `.env.local` rempli et fonctionnel : URL, clé anon, `service_role`,
  `SEED_SUPER_ADMIN_EMAIL`. **Ne jamais afficher une clé dans la sortie.**
- CLI Supabase authentifiée et liée. Migrations **0001 → 0013** appliquées.
  Seed appliqué.
- `src/infrastructure/supabase/database.types.ts` généré. Régénérer avec
  `npm run db:types` après toute migration.
- **1 seul profil en base** : le super administrateur de l'utilisateur. Les
  comptes de test sont créés puis supprimés à chaque recette.
- Données : 8 programmes publiés, 3 articles, 5 catégories, 4 valeurs, 7 FAQ,
  4 chiffres (`beneficiaires` à `NULL`), 3 témoignages, 3 fiches d'équipe en
  brouillon, 12 pages, 30 sections squelettes, 12 entrées de navigation,
  7 groupes de réglages, 2 rapports annuels en brouillon.
- **`media_assets` est VIDE**, et les deux buckets aussi. Le seed n'a jamais
  créé de média (aucun fichier éditorial n'existe encore), et la recette du
  Lot 7 supprime tout ce qu'elle dépose. Le premier fichier réel sera téléversé
  par l'utilisateur depuis `/dashboard/mediatheque`.

### Méthode de recette qui a fait ses preuves

Aucun harnais de test n'est installé (proposé, non retenu). Procédé employé :

- **Code pur** (`core/`) : `tsconfig.recette.json` temporaire → compile vers
  `.tmp-recette/` → exécution `node`.
- **Infrastructure** : idem, plus un `bootstrap.js` qui résout les alias `@/`
  vers le dossier compilé, et exécution contre la **base réelle**.
- **Runtime** : `npm run build` puis `npm start` sur un port dédié, comptes
  temporaires créés via `service_role`, cookies capturés avec
  `@supabase/ssr`, requêtes en `curl`.
- **Navigateur (ajouté au Lot 5)** : Chrome piloté en **CDP**, sans installer
  Playwright ni Puppeteer — Node 22 fournit `fetch` et `WebSocket` en global,
  cela suffit.

  ```sh
  chrome.exe --headless=new --remote-debugging-port=9333 \
             --user-data-dir=<profil temporaire> --disable-gpu about:blank
  ```

  puis `GET /json/version` pour l'URL WebSocket, `Target.createTarget` +
  `Target.attachToTarget {flatten:true}`, `Network.setCookies` avec les
  cookies capturés (domaine `127.0.0.1`),
  `Emulation.setDeviceMetricsOverride` pour chaque largeur, et
  `Runtime.evaluate` pour mesurer. C'est le **seul** moyen d'exécuter la
  matrice de recette responsive du §12 : `curl` ne mesure pas un
  `scrollWidth`. Chrome est présent sur la machine
  (`C:\Program Files\Google\Chrome\Application\chrome.exe`) ; Edge aussi.

  Prévoir ~600 ms après `Page.loadEventFired` avant de mesurer : l'hydratation
  doit être terminée, sinon les états clients (rétraction, tiroir) sont lus
  trop tôt.
- **Les scripts de recette doivent vivre dans le projet** (le scratchpad ne
  résout pas `node_modules`), et **tout est supprimé après** : fichiers
  temporaires, page de test, comptes de test.
- **Piège Git Bash** : un argument commençant par `/` est converti en chemin
  Windows (`/dashboard` → `C:/Program Files/Git/dashboard`). Préfixer la
  commande par `MSYS_NO_PATHCONV=1`.
- **Piège `.env.local`** : les valeurs y sont entre guillemets. Un lecteur
  maison doit les retirer, sinon `createClient` refuse l'URL.
- **Toujours vérifier les comptes résiduels à la fin** : un script qui échoue
  avant son `finally` en laisse un derrière lui. Contrôle :
  `select id, email, role from profiles` — il ne doit rester **que** le super
  administrateur de l'utilisateur.

---

## Écarts assumés — NE PAS « CORRIGER »

Chacun est documenté dans le code concerné.

### Erreurs réelles des rapports

| # | Rapport | Réalité |
|---|---|---|
| 1 | §4.3 : `proxy.ts` à la racine du dépôt | **Faux avec `src/app`.** Le fichier est ignoré. Il doit être en **`src/proxy.ts`** (doc Next : « or inside `src` if applicable, same level as `app` »). |
| 2 | §1.2 : les 4 fonctions partagées en migration `0002` | **Impossible.** Le corps d'une fonction `language sql` est validé à sa création ; `app_current_role()` interroge `profiles`, créée en `0003`. Les 3 fonctions de rôle sont en fin de `0003`. |
| 3 | §6.5 : banc d'essai `/dashboard/_demo` | **Ne sera pas routable** : Next.js exclut du routage tout dossier préfixé par `_`. Le nommer `demo`. |
| 4 | §0.5 : glob ESLint `@/infrastructure/*` | Ne traverse pas les `/` : ne bloquait pas `@/infrastructure/supabase/clients/admin`. Élargi en `**`. |
| 5 | §9 : liste `RESOURCES` | Oubliait `value` (les valeurs, table `core_values`, Lot 8E). Ajoutée. |
| 6 | §2.5 : réutiliser `MediaTone` depuis `components/` | Contredit l'interdiction faite à `core/` d'importer `@/components`. Le type est descendu dans `core/cms/entities/media-tone.ts` et **ré-exporté** par `media-placeholder.tsx` — aucun import cassé. |
| 7 | §1.4 : « sur `profiles`, une erreur » pour l'anonyme | La RLS **filtre** au lieu de rejeter : 0 ligne, pas d'erreur. Aussi sûr, mais l'attendu était mal décrit. |
| 8 | §10 : `FieldDescriptor.media.accept` accepte `'video'` | **Aucun bucket vidéo n'existe** (migration 0011 : `media` = images, `documents` = PDF). Le `<MediaPicker>` rend pour `video` un état « indisponible » explicite plutôt qu'une grille vide, qui laisserait croire qu'aucune vidéo n'a encore été téléversée alors qu'aucune ne PEUT l'être. Le site embarque ses vidéos par URL (`VideoEmbed`). |
| 9 | §7.1 : « auteur » dans le panneau de détail | **Inatteignable pour un éditeur** : la RLS n'ouvre `profiles` qu'aux administrateurs (`profiles_admin_read`). Une jointure lui renverrait `null` sans qu'il comprenne. La fiche répond donc à la question utile — « Vous » / « Un autre membre de l'équipe » / « — ». Les noms arrivent avec l'annuaire du Lot 13. |

### Choix de conception ajoutés

| # | Écart | Raison |
|---|---|---|
| 8 | `page_sections` : contrainte unique `deferrable initially deferred` | Sinon tout échange de positions échoue sur un état intermédiaire pourtant valide. |
| 9 | `guard_publish` passe si `auth.uid() is null` | Sinon le seed ne peut pas insérer les 8 programmes en `published`. L'anonyme n'atteint jamais ce trigger (RLS). |
| 10 | `guard_last_super_admin` étendu au `DELETE` | Le §16 nomme « suppression **et** rétrogradation » ; le snippet ne couvrait que l'UPDATE. |
| 11 | SQLSTATE `ADB01`–`ADB05` | Messages français destinés à l'utilisateur, transmis **verbatim** par le repository. Sans code dédié, ils seraient remplacés par « Une erreur technique est survenue. » |
| 12 | RLS `articles` filtre aussi `published_at <= now()` | Une date de publication future ne doit pas fuiter si une requête oublie la clause. |
| 13 | Colonne `testimonials.has_consent` | Absente du §8. Le Lot 8C impose une case de consentement ; sans colonne elle ne laisse aucune trace. **Validée.** |
| 14 | `annual_reports` seedés (2 lignes, `draft`) | Hors liste littérale du §1.7 mais présents dans `equipe.ts`. Aucun PDF n'existe → lien masqué, parité exacte. |
| 15 | Sections de pages seedées en **squelettes** (`content` vide) | Le §9.5 confie explicitement le contenu au Lot 9. `SectionRenderer` ignore une section invalide sans casser la page. |
| 16 | Pas de barrel `clients/index.ts` | Un barrel rendrait la règle ESLint inopérante : importer le barrel depuis `queries/` tirerait `server.ts` — donc `next/headers` — dans un scope `'use cache'`. Règle durcie pour l'interdire. |
| 17 | Migration `0012` (`reorder_rows`) au Lot 3, `0013` (`consume_rate_limit`) au Lot 4 | `createAction` annonce la limitation de débit en étape 1 : un talon aurait rendu la garantie creuse. Le Lot 16 garde l'application des seuils et la purge. |
| 18 | La limitation de débit est le **5ᵉ** usage autorisé de `createAdminClient` | S'ajoute aux 4 du §3.1 (invitation, suppression d'utilisateur, audit, seed). |
| 19 | Les actions d'authentification ne passent pas par `createAction` | Le décorateur exige un acteur ; il n'y en a pas encore par définition. Elles appliquent à la main débit + validation. **Seule exception**, bornée à `auth.actions.ts`. |
| 20 | `updateProgramme(deps, id, input)` — `id` en paramètre séparé | Le laisser dans la charge utile invitait à l'écrire en base, où il est immuable. |
| 21 | `requireActor` distingue `aucune-session` de `compte-desactive` | Sinon un utilisateur désactivé ressaisit son mot de passe indéfiniment sans comprendre. |
| 22 | Chemins Storage assainis via `slugify` | Une substitution naïve donnait `programmes/sant-`. Effet de bord utile : `slugify("..")` est vide, la traversée de dossier disparaît. |
| 23 | Deux chiffres autrefois calculés sont désormais figés | `programmes` = 8 et `annees` = 6 étaient recalculés à chaque build. `annees` ne s'incrémentera plus au 1er janvier. |
| 24 | `DashboardNavItem.permission` est `Permission \| null` | Le §5.2 le type `Permission`. Aucune permission de la matrice ne signifie « voir l'accueil du dashboard ». Faire porter à l'accueil une permission empruntée (`page:read`) polluerait le document d'audit qu'est le §9. `null` = visible par tout compte actif, et **seule** l'entrée « Tableau de bord » l'emploie. |
| 25 | Entrée de navigation **« Valeurs »** ajoutée | Le §5.2 l'oublie, exactement comme le §9 oubliait la ressource `value` (écart nº 5). Sans elle, l'écran `/dashboard/valeurs` du Lot 8E serait livré inatteignable. |
| 26 | L'état rétracté de la barre est mémorisé dans un **cookie**, pas dans `localStorage` | Le §5.3 dit `localStorage`, qui n'est lisible qu'après hydratation : la barre serait rendue déployée par le serveur puis rétractée à l'exécution — un saut de 264 → 72 px à chaque chargement, et un `aria-expanded` faux le temps d'un rendu. Le cookie (`adebes_barre_laterale`, `path=/dashboard`) est lu **pendant** le rendu serveur. Même arbitrage que `next-themes`, déjà en place. Contrainte de recette (« survit à un rechargement ») tenue à l'identique. |
| 27 | Registre d'icônes **distinct** pour la navigation (`DASHBOARD_ICONS` dans `lib/dashboard-navigation.ts`) | Le §5.2 type `icon: IconName`, celui de `components/ui-ext/icon-registry.ts`. Or `ICON_NAMES` alimente la grille de sélection d'icônes du `<SchemaForm>` (Lot 6) : y verser « Réglages » ou « Journal » les proposerait à un éditeur choisissant l'icône d'un programme. Même contrainte d'implémentation (imports statiques), deux vocabulaires séparés. |
| 28 | `max-w-(--breakpoint-2xl)` au lieu de `max-w-screen-2xl` | **`max-w-screen-*` n'existe plus en Tailwind v4** : la classe est silencieusement ignorée. Elle figurait dans la page provisoire du Lot 4 et ne bornait donc rien. La forme v4 lit la même valeur de thème (96 rem). |
| 29 | Les lectures authentifiées non mises en cache vivent dans `src/server/dal/` | Ni le §5 du Rapport 1 ni le Rapport 2 ne leur donnent d'emplacement. `server/queries/` est réservé aux lectures publiques `'use cache'` (une règle ESLint y interdit `createServerClient`), et un port + repository pour six compteurs sans règle métier serait de la cérémonie. **Frontière à tenir : le DAL lit, il ne décide pas.** Dès qu'une règle métier entre en jeu → cas d'usage + port. |
| 30 | Fourre-tout `dashboard/[...segments]/page.tsx` — **ajout au périmètre du Lot 5** | Une navigation « complète » pointe vers 17 écrans dont 1 existe : les 16 autres renvoyaient la 404 **du site public**, avec ses CTA « Faire un don ». Un seul fichier remplace 16 pages d'attente, et disparaît de lui-même (une route statique l'emporte sur un fourre-tout). Il ne contourne aucune garde : correspondance **exacte** avec une entrée déclarée, puis `requirePermission()`. Une adresse inconnue y lève `notFound()`. |
| 31 | `dashboard/not-found.tsx` se met en page **seule** | Voir découverte de terrain nº 6 : Next.js ne rejoue pas les layouts au-dessus d'un `notFound()` levé dans une route dynamique. La supposer enveloppée par `<DashboardShell>` aurait donné un bloc collé au bord de l'écran. |
| 32 | `DASHBOARD_ICONS` est indexé directement, sans fonction d'accès | La règle `react-hooks/static-components` du compilateur React signale toute valeur de composant **renvoyée par un appel de fonction** pendant le rendu : elle ne distingue pas une consultation de table d'une fabrique. Un accès par propriété passe le lint sans désactivation locale. |
| 33 | `use-breakpoint.ts` déclare **deux** seuils (`md` 768, `lg` 1024) | La règle 9 du §12 nomme un ENDROIT unique, pas une requête unique. `<DataTable>` doit choisir entre `<table>` et cartes à 768 px, `<FormModal>` entre `Dialog` et `Sheet` à 1024 px : deux remplacements de composants, qu'aucune media query ne peut faire. Les deux requêtes vivent dans le même fichier, le `grep` de recette ne renvoie toujours que lui. |
| 34 | `Column<T>.sortValue` ajouté | Le type du §6.1 annonce `sortable` mais ne fournit aucune valeur comparable : `cell` renvoie du JSX. Sans `sortValue`, une colonne de dates se trierait sur le texte français (« 12 janv. » avant « 3 févr. »). |
| 35 | `FilterDescriptor<T>` défini, et `selection.actions` ajouté | Le §6.1 référence `FilterDescriptor` sans le définir, et décrit `onBulk(ids, action)` sans dire d'où vient la liste des actions — la barre de sélection n'aurait aucun bouton à afficher. |
| 36 | `DataTableProps.badgeColumnKey` ajouté | Le §6.1 décrit la ligne 1 d'une carte comme « colonne primaire + `<StatusBadge>` » sans dire quelle colonne fournit le badge. Nommé explicitement, avec repli sur la colonne de clé `status`. |
| 37 | Le réordonnancement **coexiste** avec la pagination | Une première version les rendait exclusifs (glisser-déposer ⇒ liste entière rendue), ce qui aurait affiché 200 lignes d'un bloc. Le glissement porte sur la tranche visible et `reordonnerTranche` la réinsère à sa position dans la liste complète ; « Monter / Descendre » travaillent, eux, sur la liste entière et franchissent donc les limites de page. |
| 38 | Le réordonnancement est **bloqué** — pas masqué — pendant un tri, un filtre ou une recherche | Déplacer une ligne dans une vue triée écrirait des positions qui ne correspondent à rien. Les poignées restent visibles, désactivées, avec leur motif et un lien « Revenir à la liste complète » : un contrôle qui disparaît sans explication passe pour une panne. |
| 39 | `list` : `of: [{ kind: 'text', name: '' }]` = liste de valeurs simples | Le type du §10 exige un `name` sur chaque descripteur ; `name: ''` est le seul moyen d'exprimer « cet élément n'a pas de sous-champ, il EST la valeur ». C'est la forme des quatre listes réelles (`actions`, `publics`, `besoins`, `bullets`). Écrit avec `setValue` sur le tableau entier, **jamais `useFieldArray`**, qui enveloppe les primitives. |
| 40 | `reference` : options **fournies par l'écran**, pas de chargement paresseux | Le §6.2 décrit un chargement paresseux. Il n'existe au Lot 6 ni repository ni Server Action de lecture pour huit des neuf ressources : le câbler reviendrait à appeler des routes inexistantes. Les écrans passent un tableau (`references-context.tsx`) ; une ressource absente rend un état « indisponible » explicite, jamais une liste vide. |
| 41 | `BlockDescriptor` **ne pourra pas** vivre dans `core/` (Lot 9) | Le §10 le déclare avec `icon: LucideIcon` et `Renderer: ComponentType`, deux types que la règle de dépendance interdit à `core/`. Le partage devra suivre le patron de `MediaTone` (écart nº 6). Consigné dans `core/cms/blocks/types.ts` pour que le Lot 9 ne découvre pas le mur en cours de route. |
| 42 | `<PageHeader>` et `<EmptyState>` restent des Server Components | Aucun état à porter. Les laisser côté serveur permet aux écrans des Lots 8+ d'y placer des boutons liés à des Server Actions sans faire basculer la page entière côté client. |
| 43 | Palette du `<StatusBadge>` refaite après mesure | Les teintes translucides du §6.4 (`bg-brand-orange/15`, `bg-success/12`) tombaient à 4,40 / 4,08 / 4,42:1 en thème clair. Remplacées par : `in_review` en **outline** (ce que dit littéralement le §6.4), `published` sur la paire opaque `--accent` / `--accent-foreground`, `archived` en bordure **tiretée**. Voir découverte de terrain nº 10. |
| 44 | Dossier **`src/server/deps/`** créé | Le §8A.4 écrit `createProgramme(programmeDeps(), input)` sans jamais dire où vit `programmeDeps()`. `server/dal/` LIT (écart nº 29) : assembler des ports n'est pas une lecture. `server/actions/` est un fichier `"use server"`, dont les PAGES ne doivent pas dépendre pour récupérer une fabrique. `server/deps/` est donc la racine de composition, côté contrôleur. **Les Lots 8A→8I y ajouteront une fabrique par collection.** Le client Supabase y est reconstruit à CHAQUE appel : le mémoriser au niveau du module le ferait fuiter d'un visiteur à l'autre. |
| 45 | Un **troisième port** pour la médiathèque : `MediaStoragePort` | Un téléversement écrit dans DEUX systèmes sans transaction commune — le bucket puis `media_assets`. La compensation (retirer l'objet si le catalogue échoue) est une règle métier : elle vit dans le cas d'usage, ce qui suppose que le domaine commande les deux systèmes. |
| 46 | `MEDIA_MIME_TYPES`, `MEDIA_MAX_BYTES`, `MEDIA_EXTENSIONS` **remontés dans `core/`** | Ils vivaient dans `infrastructure/storage/storage.ts` au Lot 3, faute de consommateur ailleurs. `uploadMedia` doit désormais CHOISIR le bucket à partir du type réel — une décision métier, prise dans `core/`, qui n'a pas le droit d'importer l'infrastructure. `storage.ts` les ré-exporte sous leurs noms d'origine (`MIME_AUTORISES`, `TAILLE_MAX`) : aucun import cassé, une seule définition. |
| 47 | `detectMimeType` vit dans **`core/shared/file-signature.ts`** | « Un fichier dont le contenu ne correspond pas à ce qu'il annonce est refusé » est une règle du domaine, pas un détail Supabase. La fonction est pure, sans dépendance, et le cas d'usage l'applique sans passer par un adaptateur. |
| 48 | `uploadMediaSchema` porte un champ **`filename`** distinct du `File` | **Défaut relevé par la recette navigateur.** La compression client réencode en WebP et RECONSTRUIT un `File` : son `name` devient « Photo campagne santé (1).webp ». Le catalogue affichait donc une extension que l'utilisateur n'avait jamais vue. `media_assets.filename` est documenté comme « nom d'origine, pour l'affichage seulement » : c'est le nom d'AVANT compression qu'il doit porter. Facultatif, avec repli sur `file.name`, et assaini avant écriture. |
| 49 | `programmes.gallery_media_ids` est un usage **BLOQUANT** | C'est un `uuid[]` **sans clé étrangère** : la base laisserait la suppression passer et le tableau garderait un identifiant mort. Bloquant ici, faute de l'être en base — invariant nº 2, « aucun lien mort ». Les deux autres usages bloquants (`gallery_items`, `annual_reports`) le sont, eux, par `on delete restrict`. |
| 50 | `mediaFicheSchema` **distinct** de `updateMediaSchema` | `<SchemaForm>` exige `z.ZodType<T, T>` — entrée et sortie identiques. Or `.default(null)` rend un champ facultatif en entrée et garanti en sortie : les deux types divergent. Les deux schémas partagent leurs briques (`altTextSchema`, `captionSchema`, `folderSchema`) : les règles ne peuvent pas diverger, seule l'enveloppe change. |
| 51 | La médiathèque filtre et pagine **côté SERVEUR**, contrairement à `<DataTable>` | Même règle, volumes différents. `<DataTable>` filtre en mémoire parce qu'une collection compte huit programmes ; la médiathèque grossit sans limite. `<DataTable>` reçoit donc la page **déjà filtrée**, sans ses props `search`, `filters` ni `pagination` — on lui emprunte ses quatre états et sa bascule cartes/tableau, déjà recettés. Les contrôles de filtre sont uniques et **au-dessus des deux vues** : basculer grille ↔ liste ne perd pas la recherche. |
| 52 | `<PageHeader>` est rendu **depuis le composant client** de la médiathèque | Il est resté Server Component au Lot 6 (écart nº 42) pour accueillir des boutons de Server Action, mais il n'a aucune dépendance serveur. L'action primaire de cet écran ouvre une modale — un état client : le laisser dans la page obligerait à faire remonter cet état par un contexte. |
| 53 | La chaîne de filtres du dépôt média est **écrite deux fois** (`findAll` et `count`) | La factoriser imposait un `as unknown as` : le constructeur de requêtes PostgREST est typé par la table ET par la projection. Douze lignes redites valent mieux qu'une conversion qui désactive le typage sur toute une couche d'accès aux données (règle 3 du plan). Un commentaire en tête l'exige : **toute condition ajoutée doit l'être dans les deux.** |
| 54 | `urlMedia()` vit dans **`src/lib/media-url.ts`**, et n'emploie **jamais** `/render/image/` | `SupabaseStorage.getPublicUrl()` exige un client, donc le serveur ; or ce sont des COMPOSANTS qui ont besoin de l'URL, y compris côté client, et le §4 leur interdit d'importer `infrastructure/`. L'URL d'un bucket public est de toute façon déterministe. Le point capital : `next.config.ts` n'autorise que `pathname: "/storage/v1/object/public/**"` — l'endpoint de transformation `/storage/v1/render/image/public/…` serait **refusé par `next/image`**. Le redimensionnement est confié à `next/image`, qui le fait déjà en AVIF/WebP. |
| 55 | **Correctif hors périmètre** : deux cibles tactiles de la coquille du Lot 5 | La recette du Lot 7 a étendu le contrôle des 44 px à la coquille du dashboard, et y a trouvé deux manquements réels à la règle 4 du §12 : le lien du logo de la barre latérale (`py-1` + logo 32 px = **40 px**) et les étapes intermédiaires du fil d'Ariane (**17 px**, hauteur naturelle d'un lien de texte). Corrigés par `min-h-11` dans les deux cas — les barres font déjà 56/64 px, rien ne bouge à l'écran. |
| 56 | **`src/server/queries/*.query.ts` n'est PAS encore `'use cache'`** | Les deux rapports se contredisent : le §8A.1 exige une lecture « `'use cache'` », le §0.4 écrit « `cacheComponents: true` n'est **pas** activé maintenant — c'est le Lot 15 ». Or la directive est une fonctionnalité de Cache Components et ne compile pas sans le drapeau (vérifié dans `node_modules/next/dist/docs/…/use-cache.md`). Les lectures publiques sont donc **dynamiques** en attendant, et les pages concernées portent `export const dynamic = "force-dynamic"`. Le contraire — des pages figées au build — rendrait fausse la première ligne de recette du §8A. Les étiquettes de cache sont déjà posées et déjà invalidées par les actions : le Lot 15 n'aura que trois gestes à faire, listés en tête de `programmes.query.ts`. |
| 57 | Périmètre public ÉLARGI : `/`, `/benevolat`, `/don` et `sitemap.xml` basculent aussi | Le §8A.5 ne nomme que les deux pages `/programmes`. Mais `<ProgrammeCard>` change de type (l'entité de domaine, `icon` en chaîne) et l'accueil l'emploie ; surtout, laisser l'accueil sur `src/content/` afficherait l'ANCIEN titre d'un programme renommé dans le CMS, et le sitemap déclarerait un programme dépublié — un lien mort, contraire à l'invariant nº 2. L'étiquette `cms:page:accueil`, exigée par le §8A.4, n'aurait par ailleurs rien à invalider. Conséquence : **`src/content/programmes.ts` n'est plus importé par aucune page** — critère du §8x atteint dès 8A. |
| 58 | `programmeFormSchema`, **troisième** schéma distinct | Même cause qu'à l'écart nº 50 : `<SchemaForm>` exige `z.ZodType<T, T>`. `createProgrammeSchema` porte trois `.default(...)` et `updateProgrammeSchema` est `.partial()` — les deux ont entrée ≠ sortie. Les trois partagent leurs briques (`slugSchema`, `listeDeTextes`) : les règles ne peuvent pas diverger. |
| 59 | `body` **absent du formulaire** | Le §8A.2 énumère les champs « repris exactement du type `Programme` de `src/content/` », qui n'a pas de `body`. La colonne existe, aucune page publique ne la rend : offrir un champ dont la saisie ne s'affiche nulle part serait pire que de ne pas l'offrir. Il reste `null` et n'est jamais écrit. |
| 60 | `FieldDescriptor` de type `media` gagne `multiple` et `max` | Le point « à trancher au début du lot ». Le §10 donne `multiple` à `reference` mais pas à `media`, alors que le §8A.2 déclare `galleryMediaIds` comme « media multiple ». Le drapeau est ajouté, `<MediaPicker>` gagne un mode multiple (sélection complète renvoyée, pas un ajout), et `MediaMultiField` réconcilie l'ordre. Le Lot 8H (galerie) est le second appelant prévu. |
| 61 | `<ContentIcon>` remplace `getIcon()` **dans le rendu** | Écart nº 32 rencontré à nouveau : `react-hooks/static-components` refuse une valeur de composant renvoyée par un APPEL DE FONCTION pendant le rendu. `const Icon = getIcon(x)` casse le lint ; `ICONS[nom]` passe. La règle est appliquée une fois dans `components/ui-ext/content-icon.tsx` plutôt que répétée dans chaque écran. `getIcon()` reste utile hors rendu. |
| 62 | La garde ESLint du barrel passe de `patterns` à `paths` | **Le motif interdisait l'import qu'il devait autoriser.** Les `patterns` de `no-restricted-imports` suivent la sémantique .gitignore : un motif finissant par `supabase/clients` désigne le DOSSIER et tout son contenu — donc aussi `clients/public`, le seul import légitime de `server/queries/`. Le défaut a dormi depuis le Lot 0, faute d'un fichier pour l'exercer. `paths` compare la chaîne exacte. Revérifié : les trois imports interdits sont bloqués, `clients/public` passe. |
| 63 | `<PageHero>` gagne une prop `imageNode` | Quand une couverture vient de la médiathèque, elle se rend avec `<CmsImage>` et non `<MediaImage>`. Passer le JSX déjà construit évite au hero d'apprendre ce qu'est un `MediaAsset`. `image`/`imageAlt` restent obligatoires : ils sont le repli. |
| 64 | **`src/lib/programme-visuels.ts`** — repli transitoire vers `/public` | `media_assets` est vide et tous les `cover_media_id` valent `NULL`. Basculer sans repli aurait remplacé huit photographies par huit aplats de couleur, alors que la recette du §8A exige un rendu « identique à l'actuel ». Priorité déclarée : média choisi → fichier livré dans `/public` → `MediaPlaceholder`. `content/programmes.ts` ré-exporte les deux fonctions (patron de l'écart nº 6). **À retirer au Lot 15, une fois les visuels réels téléversés.** |
| 65 | **Correctifs hors périmètre** : trois défauts de Lot 6 trouvés par la recette responsive | (a) `table-view.tsx` reçoit `relative` sur son conteneur défilant — sans lui, le `<span class="sr-only">Ordre</span>` en `position: absolute` prenait le bloc conteneur INITIAL, échappait au découpage et faisait défiler la PAGE de 248 px à 1024 px ; (b) les trois cases à cocher du `<DataTable>` faisaient 16 px de cible réelle (40 × 32 avec leur `::after`) — `CIBLE_44` les porte à 44 × 44 sans rien déplacer ; (c) « Monter » / « Descendre » d'un champ `list` faisaient 32 px empilés — ils passent côte à côte en 44 px, la ligne se coupant (`flex-wrap`) quand la largeur manque. Les trois dormaient depuis le Lot 6 : aucun écran n'avait encore de tableau plus large que son conteneur, ni de sélection multiple réelle, ni de champ `list`. |

### Écarts du Lot 8B

| # | Écart | Raison |
|---|---|---|
| 66 | **12ᵉ type de champ : `kind: "date"`** | Le §10 n'en prévoit AUCUN, alors que le §8B exige une date de publication « saisissable dans le passé et dans le futur ». Aucun `kind` existant ne convenait : `text` aurait laissé saisir « la semaine dernière », que rien ne sait convertir en instant, et aurait privé le téléphone du sélecteur natif. La valeur du champ est un **instant ISO**, `null` si la date n'est pas fixée. Appelants suivants prévus : Lot 8I (millésime) et Lot 12 (publication programmée). |
| 67 | **`src/lib/dates.ts` — un fuseau éditorial unique** | Une date traverse trois machines aux fuseaux différents : le navigateur de l'éditeur, le serveur de rendu (UTC en production) et la base (UTC). Sans référence commune, « 20 août » saisi à Douala devient `2025-08-19T23:00Z`, que le serveur réaffiche « 19 août » — le bug classique des dates sans heure, et il décale la moitié des publications. `Africa/Douala` (UTC+1, sans heure d'été) sert donc à la SAISIE comme à l'AFFICHAGE. `formatDate` a déménagé depuis `content/actualites.ts`, qui la ré-exporte (patron de l'écart nº 6). **L'heure du jour existante est préservée** : corriger la date d'un article seedé à 09:00 ne le ramène pas à minuit. |
| 68 | **AUCUN réordonnancement des articles** | `articles` n'a pas de colonne `position` (migration 0005) : un fil d'actualités s'ordonne par `published_at`. La ligne « CRUD complet + réordonnancement » de la recette du §8x porte donc, pour ce lot, sur les CATÉGORIES — qui, elles, ont une `position`. **Défaut latent signalé** : `reorder_rows` (migration 0012) liste `'articles'` dans sa liste blanche alors que la table n'a pas la colonne ; un appel passerait les deux gardes pour échouer sur `column "position" does not exist`. Personne ne l'appelle et `ArticleWritePort` ne déclare pas `reorder` — le cas ne compile même pas. Le retrait de la liste blanche appartient à une migration, hors périmètre. |
| 69 | **Les catégories sont gérées dans une MODALE, pas un second écran** | Le point « à trancher au début du lot ». Trois raisons : (a) la navigation du §5.2 ne prévoit pas d'entrée « Catégories », et lui en ajouter une répéterait l'écart nº 25 sans qu'aucun rapport ne l'appelle — l'écran serait livré inatteignable ; (b) une catégorie porte deux informations (libellé, rang) : l'écran de liste du Lot 6 n'aurait ni recherche, ni filtres, ni colonnes à afficher ; (c) on gère ses catégories EN CLASSANT un article, donc la commande vit à côté de « Nouvel article ». |
| 70 | **Permissions des catégories : la base commande** | La RLS ouvre le renommage et le réordonnancement au personnel mais réserve l'ajout et la suppression à `app_can_publish()` (migration 0009). Or la matrice du §9 n'a aucune permission `article:*` de CRÉATION réservée aux administrateurs — `article:create` est ouverte à l'éditeur. Les deux seules dont les titulaires coïncident avec `app_can_publish()` sont `article:publish` et `article:delete`. D'où : **création → `article:publish`**, renommage → `article:update`, suppression → `article:delete`, réordonnancement → `article:reorder`. L'alternative — inventer une ressource `category` — aurait ajouté six permissions au document d'audit pour une liste de cinq libellés. **Ce qui est recetté : l'interface n'affiche jamais un bouton que la base refusera.** |
| 71 | **`articleFormSchema`, 3ᵉ schéma distinct, et la sentinelle `SANS_CATEGORIE`** | Même cause qu'aux écarts nº 50 et nº 58 : `<SchemaForm>` exige `z.ZodType<T, T>`. `createArticleSchema` porte cinq `.default(...)`, `updateArticleSchema` est `.partial()`. S'y ajoute une contrainte de Radix : `<SelectItem value="">` lève une erreur, la chaîne vide étant réservée à « aucune sélection ». « Sans catégorie » porte donc une sentinelle, retraduite en `null` **dans le composant** — un schéma qui transformerait aurait entrée ≠ sortie, ce que `<SchemaForm>` refuse. |
| 72 | **`setArticleStatus` FIXE `published_at` à la première mise en ligne** | Un article publié sans date serait visible (la RLS l'autorise) mais introuvable dans un fil trié par date. Ce n'est pas un chiffre fabriqué : l'instant de la publication EST la date de publication. **Une date déjà saisie n'est jamais écrasée**, passé comme futur — c'est ce qui rend possibles la reprise d'un article ancien et la publication programmée du Lot 12. Republier un article dépublié conserve donc sa date d'origine. |
| 73 | **`authorId` est écrit à la création, depuis la SESSION** | `createArticleSchema` l'omet, le handler le renseigne depuis `actor`. Un champ « auteur » qu'on peut remplir soi-même ne désigne rien. Le nom n'est pas encore affiché (écart nº 9 : la RLS n'ouvre `profiles` qu'aux administrateurs, l'annuaire arrive au Lot 13) — mais la donnée est écrite dès maintenant, parce qu'elle serait impossible à reconstituer après coup. |
| 74 | **`Article.body` est `string[]`, non nullable** | Contrairement à `Programme.body`. Un article sans corps n'est pas publiable (`setArticleStatus` le refuse) : l'absence se dit par la longueur, pas par un second état à traiter dans chaque composant. Le mapper ramène un JSONB abîmé à `[]`, jamais à `null`. |
| 75 | **`src/lib/actualite-visuels.ts` — repli transitoire vers `/public`** | Jumeau de l'écart nº 64. `media_assets` est vide et tous les `cover_media_id` valent `NULL` : basculer sans repli aurait remplacé trois photographies réelles par trois aplats de couleur. **Différence avec les programmes, et elle compte** : un article CRÉÉ depuis le dashboard n'aura jamais de fichier `/public`, la convention `<slug>-cover.jpeg` ne valant que pour les trois articles d'origine. Le repli rend alors le `MediaPlaceholder`, ce qui est le comportement voulu. **À retirer au Lot 15.** |
| 76 | **Périmètre public ÉLARGI : accueil et `sitemap.xml`** | Le §8x ne nomme que les deux pages `/actualites`. Mais l'accueil affiche les trois derniers articles, et laisser cette section sur `src/content/` afficherait l'ANCIEN titre d'un article renommé dans le CMS ; le sitemap, lui, déclarerait un article dépublié — un lien mort, contraire à l'invariant nº 2. Conséquence : **`src/content/actualites.ts` n'est plus importé par aucune page ni composant** — critère du §8x atteint. |
| 77 | **`ActualitesFilter` : catégories en chaînes libres, « Toutes » = `null`** | Le type `ActualiteCategory` était une union de cinq littéraux ; les catégories étant désormais gérables, un type figé aurait interdit d'en créer une sixième. L'état « Toutes » est `null` et non une sentinelle textuelle : rien n'empêche quelqu'un de créer une catégorie nommée « all », et le bouton deviendrait indistinguable. |
| 78 | **Correctifs hors périmètre** : trois cibles tactiles | (a) et (b) les cases à cocher de `NumberField` et de `BooleanField` faisaient 40 × 32 px de zone sensible réelle — `CIBLE_44` les porte à 44 × 44 sans rien déplacer. Elles dormaient depuis le Lot 6 : **aucun écran livré n'avait encore de champ `number` nullable ni de champ `boolean`**, le Lot 8B en apporte deux et le Lot 8G en fera le cœur de son écran. (c) le bouton « Utiliser cette estimation » était en `size="sm"`, soit 36 px : `min-h-11` le porte à 44 px. Trouvé par la sonde de cibles. |
| 79 | **La liste du dashboard est bornée à 100 — et le DIT** | `<DataTable>` filtre en mémoire (écart nº 51) : cela suppose que la collection tienne dans une page. Trois articles aujourd'hui, mais la collection grossira, ce qui la distingue des huit programmes. L'écran affiche donc le total dès qu'il dépasse ce qui est chargé : « les 100 plus récents sont affichés, sur 137 au total ». Une recherche qui ne trouve pas un article de 2019 doit s'expliquer, pas laisser croire qu'il a disparu. Le jour où le total approche la centaine, le filtrage passe côté serveur — le dépôt sait déjà le faire. |
| 80 | **Aucun export non-fonction dans un fichier `"use server"`** | `article-categories.actions.ts` exportait son étiquette de cache. Voir la découverte nº 24 : la compilation échoue avec un message qui ne nomme pas le coupable. L'étiquette est publiée par `server/queries/articles.query.ts`, du côté qui la lit. |

### Écarts du Lot 8C

| # | Écart | Raison |
|---|---|---|
| 81 | **L'accord est exigé à la PUBLICATION, pas à l'enregistrement** | Le §8C écrit « une case à cocher obligatoire […] avant enregistrement ». Pris à la lettre, cela interdirait d'enregistrer un brouillon tant que l'accord n'est pas revenu — et surtout obligerait quiconque corrige une faute de frappe à cocher une attestation qu'il n'est pas en mesure d'honorer. **Une case qu'on est contraint de cocher pour travailler cesse d'attester quoi que ce soit.** L'accord est donc exigé là où il protège réellement quelqu'un : `setTestimonialStatus` refuse toute mise en ligne sans lui, **aucun rôle n'y échappe, super administrateur compris**. C'est aussi la lettre de la règle d'origine, qui parle de PUBLICATION (`src/content/temoignages.ts`), et le précédent du projet : un brouillon a le droit d'être incomplet (`set-programme-status.ts`). |
| 82 | **Deux règles de plus dans `updateTestimonial`, que les autres lots n'ont pas** | Une garde posée uniquement à la publication se contourne par la porte de derrière. D'où : (a) **retirer l'accord d'un témoignage EN LIGNE est refusé** — le message dit de dépublier d'abord ; l'alternative (dépublier automatiquement) aurait changé le statut depuis un cas d'usage de modification et donné à un éditeur le moyen de retirer un contenu du site sans avoir `testimonial:publish` ; (b) **réécrire la CITATION d'un publié sans accord est refusé** — sinon un gabarit du seed deviendrait, par simple modification, une vraie citation non autorisée. Deux sorties restent ouvertes et sont dans le message : cocher l'accord dans la même requête, ou dépublier. Le rôle, la photo et le programme restent modifiables : ils ne changent pas ce que la personne est censée avoir dit. |
| 83 | **`status` est ABSENT de `createTestimonialSchema`** | Aux Lots 8A et 8B, `status` restait facultatif dans la charge utile et un `'published'` envoyé par POST direct était arrêté par le trigger `guard_publish` (ADB01). Ici, cette porte donnerait à un ADMINISTRATEUR — qui, lui, passe le trigger — le moyen de créer un témoignage déjà en ligne sans jamais traverser le contrôle d'accord. Le champ est retiré du contrat d'entrée, et `createTestimonial` écrit `'draft'` **en dur** plutôt que `input.status ?? 'draft'` : la règle ne doit pas dépendre de qui appelle. |
| 84 | **La lecture publique NE FILTRE PAS sur `hasConsent`** | Les trois témoignages du seed sont `status = 'published'` **et** `has_consent = false`. Filtrer viderait la section « Témoignages » de l'accueil, alors que la recette du §8x exige un rendu « identique à l'actuel » — et au nom d'une règle qui protège des personnes réelles, dont aucune n'est concernée : ce sont des gabarits signés « Prénom », dont le texte est « Emplacement réservé au témoignage d'un bénéficiaire… ». La porte d'entrée est fermée (écarts nº 81 et 82) et **l'état hérité est SIGNALÉ** : l'écran de liste compte les lignes concernées en tête de page, chaque ligne porte « En ligne sans accord », et la fiche le redit. Masquer ces trois lignes sans rien dire aurait laissé croire à une panne ; les effacer aurait été inventer du contenu. |
| 85 | **AUCUN repli vers `/public` pour les portraits — contrairement aux écarts nº 64 et nº 75** | Les Lots 8A et 8B ont gardé un pont parce que leur convention de nommage est indexée sur le SLUG, qui existe encore en base. `temoignage-<id>.jpg` est indexé sur l'identifiant du tableau TypeScript, qui n'existe plus. Aucune colonne de `testimonials` ne peut le remplacer sans danger : `position` change à chaque réordonnancement, `author_name` n'est pas unique (les trois entrées s'appellent « Prénom »). Dans les deux cas le pont finirait par afficher **le visage d'une personne réelle à côté des paroles d'une autre** — exactement le préjudice que la règle de consentement existe pour empêcher. **Conséquence assumée : les trois portraits de `/public/images/temoignages/` ne sont plus affichés**, remplacés par l'emplacement tenu de `<MediaPlaceholder>`. Les fichiers restent sur le disque ; la marche à suivre est de les téléverser dans la médiathèque et de les choisir dans le champ « Photo ». |
| 86 | **Ni slug, ni page publique, ni « Voir sur le site »** | Première collection du Lot 8 dans ce cas : un témoignage s'affiche là où on le cite, il n'a pas d'adresse. D'où l'absence de `findBySlug` sur son port, d'étiquette `cms:temoignage:<slug>`, et d'entrée au sitemap. Un lien « Voir sur le site » pointant vers `/` aurait promis de montrer CE témoignage et mené huit fois sur dix à une page où il ne figure pas. La fiche indique à la place **s'il fait partie des trois affichés sur l'accueil** — lu réellement (`findPublished(3)`), et non déduit de `position <= 3` : les positions numérotent la collection ENTIÈRE, brouillons compris. |
| 87 | **Périmètre public : l'accueil, et rien d'autre** | Le §8x ne nomme aucune page pour les témoignages. L'accueil en affiche trois, et la section ENTIÈRE disparaît s'il n'y en a aucun en ligne — un titre « Celles et ceux qui font vivre ADEBES » suivi du vide annoncerait un contenu manquant. Conséquence : **`src/content/temoignages.ts` n'est plus importé par aucune page ni composant** — critère du §8x atteint. `temoignagePhoto()` n'a plus d'appelant (écart nº 85). |
| 88 | **`kind: "reference"` rejoint `CHAMPS_PLEINE_LARGEUR`** | Le §6.2 énumère « textarea, richtext, list » ; `media` avait rejoint la liste au Lot 6. `reference` manquait, et cela ne s'était pas vu : **aucun écran livré n'en portait avant les témoignages**. Ce n'est pas une entrée d'une ligne mais un champ de recherche suivi d'une liste défilante de 224 px ; sur une demi-colonne, « Développement communautaire » et « Autonomisation des femmes » sont tronqués un par un. |
| 89 | **`src/server/dal/programme-options.ts`** | Deux écrans du Lot 8C ont besoin de la même liste, et les Lots 8D et 9 en auront d'autres. Les brouillons y sont proposés — `programme_id` n'exige pas un programme publié — mais **leur état est écrit** dans le `detail` : choisir « Santé mentale » sans savoir qu'il n'est pas en ligne serait trompeur. Une lecture en échec renvoie `[]` et non `undefined` : l'écran FOURNIT bien la ressource, et l'édition d'un témoignage ne doit pas tomber parce que la liste des programmes n'a pas pu être lue. |
| 90 | **Messages français jusque sur les erreurs de TYPE** | Trouvé par la recette (A44), pas déduit : `z.string().min(20, "…")` ne couvre que l'erreur de LONGUEUR. Sur un champ **absent** — ce qu'un POST direct produit — Zod s'arrête à l'erreur de type et rend « Invalid input: expected string, received undefined », en anglais, affiché tel quel. Chaque champ de `testimonial.schema.ts` porte donc son message deux fois, `z.string("…")` **et** `.min(n, "…")`. ⚠️ **Le même trou existe dans `programme.schema.ts` et `article.schema.ts`** (Lots 8A et 8B) : le remède est identique et tient en une chaîne par champ, mais il n'a pas été appliqué ici — ces deux lots ont été recettés en l'état, et les corriger sans rejouer leurs recettes n'aurait rien prouvé. **À traiter au Lot 16.** |

---

## Découvertes de terrain qui conditionnent la suite

**1. La RLS filtre les écritures, elle ne les rejette pas.** Mesuré :
`DELETE` d'un programme par un éditeur → **HTTP 204, 0 ligne supprimée**.
Aucune erreur. Toute écriture doit donc faire `.select()` et **vérifier les
lignes renvoyées** — zéro ligne = refus, jamais succès. Utilitaires en place :
`requireOneRow` / `requireDeleted` dans
`src/infrastructure/supabase/errors.ts`. **Absent du §3.3 du Rapport 2.**

**2. PostgREST transmet les `ADB*` intacts** : HTTP 400 avec `code` et
`message`. Le contrat du §0010 est donc tenable tel quel.

**3. GoTrue avale le message sur `auth.admin.deleteUser`** : la suppression du
dernier super administrateur renvoie `500 "Database error deleting user"`. La
base protège, mais le message français est perdu. **Le Lot 13 doit compter les
`super_admin` actifs avant d'appeler l'API**, pour afficher un message clair.

**4. `src/app/not-found.tsx` est la frontière 404 de toutes les routes**,
dashboard compris. ~~Un `not-found.tsx` propre au dashboard serait bienvenu.~~
**Traité au Lot 5, mais pas comme prévu.** Un `dashboard/not-found.tsx` seul
n'aurait rien changé : la doc de `not-found.js` est explicite, **seule**
`app/not-found.js` traite les URL qui ne correspondent à **aucune** route. Ce
qui règle le problème, c'est le fourre-tout `dashboard/[...segments]` (écart
nº 30) : il fait qu'une adresse sous `/dashboard` est toujours appariée, donc
que le `notFound()` qu'il lève tombe bien sur la frontière du dashboard.
Vérifié : `/dashboard/inconnu` → 404, titre « Écran introuvable », aucun CTA
public.

**5. La charge utile RSC contient les frontières que la page POURRAIT rendre.**
`app/not-found.tsx` — donc son bouton « Faire un don » — est sérialisé dans un
`<script>` de **chaque** page du dashboard. Toute recette qui cherche un texte
dans le HTML brut confond « affiché à l'écran » et « présent dans la charge
utile ». **Retirer les `<script>` avant d'assertionner** :
`html.replace(/<script[\s\S]*?<\/script>/g, '')`. Trois faux échecs sur cette
seule confusion à la première passe du Lot 5.

**6. Un `notFound()` levé dans une route dynamique ne rejoue pas les layouts.**
Next.js 16 rend alors une coquille d'erreur `<html id="__next_error__">` au
corps vide, et le contenu arrive par la charge utile RSC. Mesuré : la réponse
de `/dashboard/inconnu` ne contient ni barre latérale ni barre supérieure. La
formule de la doc — « `not-found.js` s'insère entre `loading.js` et
`page.js` » — décrit l'arbre de composants, pas ce qui est réellement rendu
dans ce cas. **Conséquence : toute page `not-found.tsx` doit assurer sa propre
mise en page.**

**7. `max-w-screen-*` n'existe plus en Tailwind v4.** La classe est ignorée
sans le moindre avertissement. Écrire `max-w-(--breakpoint-2xl)`. Le §5.3 et
le §12 du Rapport 1 emploient l'ancienne forme : la corriger à chaque
occurrence.

**8. Le compilateur React refuse `field.ref` lu pendant le rendu.** La règle
`react-hooks/refs` signale `name={field.name} ref={field.ref}` sur un champ
`useController` — et, une fois qu'elle a classé `field` comme conteneur de
`ref`, elle signale aussi `field.name` et `field.onBlur`. **La forme qui passe
est le spread** : `{...field}` puis les surcharges (`value`, `onChange`,
`disabled`) APRÈS. C'est aussi la forme idiomatique de react-hook-form.

Même famille : `react-hooks/static-components` interdit toute valeur de
composant renvoyée par un APPEL DE FONCTION pendant le rendu (écart nº 32).
Retenir la règle générale : **consulter une table, jamais appeler une
fabrique.**

**9. Piloter Radix en recette : le menu s'ouvre sur `pointerdown`.** Un
`element.click()` n'ouvre PAS un `DropdownMenu` — il faut dispatcher
`pointerdown` puis `pointerup` avant le clic. Les cases à cocher et les
boutons, eux, répondent bien au clic. Un test qui « ne trouve pas l'entrée de
menu » cherche souvent un menu qui n'est jamais apparu.

**10. Mesurer un contraste demande de COMPOSER les couleurs, pas de les lire.**
Trois versions du test se sont trompées avant d'être justes, et deux d'entre
elles échouaient en donnant l'air d'un défaut du code :

  * les modificateurs d'opacité de Tailwind v4 produisent
    `color-mix(in oklab, …)`, que Chrome résout en `lab(71.5 29.5 54.6 / .15)` :
    lire les trois premiers nombres comme du RVB transforme un orange très
    clair en couleur sombre ;
  * prendre `<html>` comme fond de référence donne `rgba(0,0,0,0)`, traité
    comme du noir opaque — tous les textes du thème CLAIR échouent, tous ceux
    du thème sombre passent.

**La méthode juste** : peindre la couche de fond opaque puis les couches
translucides dans un canevas 1 × 1, relire le pixel, y peindre la couleur du
texte, relire — le navigateur fait lui-même la conversion d'espace et la
composition alpha. Réutiliser cette sonde aux lots suivants plutôt que d'en
réécrire une.

**Ce qu'elle a trouvé, et qui est une vraie leçon de conception :** un texte
posé sur un fond TRANSLUCIDE perd le contraste que son jeton lui garantissait.
`--brand-orange-ink` vaut 5,05:1 sur blanc et 4,40:1 sur `bg-brand-orange/15`.
Règle à tenir : **soit le fond est opaque et le couple est vérifiable une fois
pour toutes, soit il n'y a pas de fond.**

**11. Les coordonnées de `Input.dispatchTouchEvent` sont celles de la FENÊTRE.**
Un `scrollIntoView({ block: 'center' })` est obligatoire avant tout geste
tactile de recette. Sans lui, les événements tombent dans le vide — et un test
« le défilement ne réordonne pas » passe **sans avoir rien touché**. Vérifier
qu'un test négatif échoue quand il doit échouer.

**12. `react-hooks/set-state-in-effect` interdit tout `setState` SYNCHRONE dans
un effet.** Même famille que les découvertes nº 8 : le compilateur React est
une contrainte structurante de ce dépôt, pas un avis. Deux parades, toutes deux
employées au Lot 7 :

- **Remonter le composant** par une `key` quand l'état à réinitialiser est
  interne (`<MediaDetailContenu key={media.id}>`). L'état de départ redevient
  celui de `useState`, et il n'existe plus d'instant où la fiche affiche le
  nouveau fichier avec les usages de l'ancien.
- **Dériver plutôt que recopier** quand l'état vient d'une prop
  (`MediaField` : `mediaAffiche = identifiant && media?.id === identifiant ? media : null`).
  L'effet ne fait plus qu'une chose — aller chercher ce qui manque — et n'écrit
  qu'à l'arrivée de la réponse, hors du corps de l'effet.

Retenir la règle générale : **un effet synchronise avec l'extérieur ; il ne
recopie pas une prop dans un état.**

**13. Le CDN Supabase sert encore un objet SUPPRIMÉ.** Mesuré : après
`storage.remove()`, l'URL publique répond toujours `200` — la copie mise en
cache lors du premier accès survit (`cache-control` par défaut d'une heure). Ce
n'est pas une suppression manquée. **Vérifier par `storage.from(b).list(dossier)`,
jamais par un `fetch` de l'URL.** Sans conséquence applicative ici : le
catalogue est la seule source des URL affichées, et il est vidé immédiatement.

**14. Rebâtir pendant qu'un `next start` tourne CASSE l'hydratation du serveur
en cours.** `npm run build` remplace `.next` sous le processus en vie : les
chunks référencés n'existent plus, la page s'affiche normalement mais **aucun
clic ne fait plus rien**. Deux passes de la recette navigateur ont échoué là-dessus
en accusant le code applicatif. Toujours **arrêter le serveur avant de rebâtir**.

Corollaire Windows : `pkill -f "next start"` **ne tue rien** — le processus est
`node`, lancé par `npx`. Passer par le port :
`Get-NetTCPConnection -LocalPort 3007 -State Listen | … | Stop-Process -Force`.

**15. `fetch` de Node n'envoie aucun en-tête `Accept`.** `/_next/image` négocie
le format avec le client : sans cet en-tête, il renvoie du **JPEG**, ce qui fait
croire à une configuration `formats` inopérante. Ajouter
`accept: image/avif,image/webp,…` — un navigateur, lui, l'envoie toujours.

**16. Attendre une CONDITION, jamais une durée.** Les `pause(700)` du Lot 5
tenaient sur une machine au repos ; ils échouent dès que la première page d'un
`next start` fraîchement démarré met plus d'une seconde à s'hydrater — et le
clic est alors perdu, sans erreur. Le Lot 7 a ajouté `Cdp.attendreQue(expression)`,
qui interroge la page toutes les 200 ms jusqu'à un délai maximal. Les seuls
`pause()` restants sont des marges après une condition déjà satisfaite.

**17. Un `notFound()` levé dans une route dynamique renvoie HTTP 200 — DÉFAUT
PRÉEXISTANT.** Mesuré au Lot 8A sur `/programmes/slug-inconnu` : statut 200,
corps vide, le contenu de la 404 n'arrivant que par la charge utile RSC (suite
de la découverte nº 6). **Ce n'est pas une régression de la bascule sur la
base** : `/actualites/[slug]`, que le Lot 8A ne touche pas, se comporte à
l'identique — la comparaison est faite dans la recette elle-même, comme
assertion. Conséquence réelle : un moteur de recherche indexerait une page
introuvable comme valide. **À traiter au Lot 15 ou 16**, avec le reste du SEO.

**18. Le HTML du serveur ne contient PAS les lignes d'un `<DataTable>`.** Il
affiche son squelette tant qu'il n'est pas monté, pour ne pas rendre les cartes
puis les remplacer par le tableau (§6.1). Une recette `curl` qui cherche un
titre de programme dans `/dashboard/programmes` échoue donc à juste titre : le
contenu du tableau se vérifie **au navigateur**, l'en-tête d'écran et ses
boutons se vérifient en HTTP.

**19. `document.querySelector` trouve un champ AVANT l'hydratation.** Écrire
dedans à cet instant ne fait rien — react-hook-form n'écoute pas encore — et
l'hydratation remet ensuite la valeur par défaut : le formulaire part vide et
l'échec ressemble à un défaut de validation (« Le titre est obligatoire »,
alors que le titre avait été saisi). Le signal fiable est local à l'élément :

```js
Object.keys(noeud).some((c) => c.startsWith('__reactProps$'))
```

`Cdp.attendreHydratation(selecteur)` l'encapsule. À appeler après **chaque**
navigation complète, avant toute interaction. Même famille que la
découverte nº 16 : on attend une condition, et il faut attendre la BONNE.

**20. Les entrées d'un menu Radix se déclenchent DEUX fois si on leur envoie la
séquence complète de pointeur.** Complément à la découverte nº 9 : le menu
s'OUVRE sur `pointerdown` (d'où la séquence sur le déclencheur), mais ses
`[role=menuitem]` réagissent au `pointerup` **et** au `click`. Mesuré : un seul
« Monter » faisait remonter la ligne de deux rangs, et l'échec ressemblait à un
bug de `deplacer()`. Un clic simple pour les entrées, la séquence complète pour
ce qui les ouvre. Corollaire de recette : **compter les appels réels** (une
entrée de `audit_logs` par mutation) plutôt que de constater seulement l'état
final.

**21. Une assertion sur `audit_logs` doit être bornée à l'exécution en cours.**
C'est un journal : il conserve les traces des passes précédentes. Filtrer sur
`actor_id` — le compte temporaire étant recréé à chaque passe — est la seule
fenêtre juste. Et l'entrée d'audit arrive **après** l'écriture métier
(`createAction` journalise à l'étape 6, le handler écrit à l'étape 5) : la lire
dès que la donnée a changé la lit trop tôt. Enfin, **le journal doit être
nettoyé** en fin de recette, comme les comptes : sinon l'écran du Lot 13
affichera un historique fabriqué par les tests.

**22. Un élément `position: absolute` sans ancêtre positionné échappe à
`overflow-x-auto`.** Son bloc conteneur est le bloc conteneur INITIAL : il
étend la zone défilante de la PAGE, pas celle du conteneur. C'est ce qui faisait
défiler `/dashboard/programmes` de 248 px à 1024 px, à cause d'un simple
`<span class="sr-only">Ordre</span>` dans l'en-tête du tableau. **Tout conteneur
à `overflow` doit porter `relative`** dès qu'il contient un descendant absolu —
y compris un `sr-only`.

**23. Mesurer une cible tactile demande de composer les couches, pas de lire un
rectangle.** Deux pièges, tous deux producteurs de faux échecs :

  * une entrée `sr-only` n'est pas la cible — c'est son `<label>` de 44 px
    (sélecteurs d'icône et de teinte) ;
  * la zone sensible peut être un **pseudo-élément** en position absolue à
    insets négatifs (`Checkbox`) : un appui dessus active bien le bouton, et la
    mesure doit additionner `rect` et `::after`.

Même leçon que la découverte nº 10 sur le contraste : une sonde naïve accuse un
code correct, et une sonde absente laisse passer un vrai défaut — les trois
correctifs de l'écart nº 65 ont été trouvés par la sonde corrigée.

**24. Dans un fichier `"use server"`, TOUT export doit être une fonction
asynchrone.** Next.js transforme le module en table d'actions. Un
`export const ETIQUETTE = "…"` fait échouer la compilation avec
**« The module has no exports at all »**, message qui ne nomme pas le coupable
et pointe le fichier IMPORTATEUR. Deux minutes perdues à chercher un import
cassé qui n'existait pas. Règle : une constante partagée par un fichier
d'actions vit ailleurs — ici dans `server/queries/`, du côté qui la lit.

**25. PostgREST renvoie les `timestamptz` avec un décalage explicite, jamais
`Z`.** Mesuré : on envoie `2026-09-28T15:46:19.757Z`, la base rend
`2026-09-28T15:46:19.757+00:00`. Même instant, chaîne différente. Deux
conséquences :

  * un schéma Zod strict (`z.iso.datetime()`) **refuserait la donnée que la
    base vient de rendre**, et casserait la modification d'un article existant.
    `dateISOSchema` valide donc par `Date.parse` ;
  * une assertion de recette doit comparer des INSTANTS, pas des chaînes. Un
    faux échec à la première passe.

**26. React échappe les apostrophes ET sépare les nœuds de texte adjacents.**
Complément de la découverte nº 5. Deux normalisations obligatoires avant toute
assertion sur du HTML :

  * `'` est rendu `&#x27;` — chercher « Plantation d'arbres » dans le HTML brut
    ne trouve rien, alors que le texte est bien affiché ;
  * `{minutes} min de lecture` est rendu `3<!-- --> min de lecture` — chercher
    « 3 min de lecture » échoue pour une raison qui n'a rien à voir avec le
    rendu.

Six faux échecs sur ces deux seuls points à la première passe HTTP. Décoder les
entités et retirer les commentaires, en plus des `<script>`.

**27. Radix rend, sous chaque `Select` et chaque `Checkbox`, un contrôle natif
masqué de 1 × 1 px.** Il porte `aria-hidden="true"` et `tabindex="-1"`, sert à
la compatibilité des formulaires, et personne ne le voit ni ne le touche. Une
sonde de cibles tactiles le compte pourtant, et une sonde de taille de police
aussi : **neuf faux échecs** à la première passe responsive, dont un libellé
absurde (la concaténation des cinq catégories). Toute sonde d'accessibilité doit
exclure ce qui est hors de l'arbre d'accessibilité. Corollaire : la règle des
16 px vise les champs de saisie TEXTUELLE — une case à cocher ne se remplit pas
au clavier.

**28. Rejouer un appel de Server Action demande deux précautions.**

  * **Figer la PREMIÈRE capture.** Un écouteur qui écrase à chaque POST finit
    par rejouer l'action la plus récente — ici l'enregistrement de l'éditeur,
    pour lequel il a les droits — au lieu de la publication visée. Le test
    « répond FORBIDDEN » échouait en donnant l'air d'une garde absente.
  * **Rejouer TOUS les en-têtes**, `next-router-state-tree` compris. Sans lui,
    Next ne reconnaît pas un appel d'action et renvoie le **rendu RSC de la
    page** : la réponse ressemble à un succès silencieux alors que l'action n'a
    jamais été appelée.

Même leçon que la découverte nº 11 : vérifier qu'un test négatif échoue pour la
BONNE raison.

**29. Une modale remontée par une `key` dérivée des données annule une saisie en
cours.** Le patron de la découverte nº 12 (« remonter le composant par une
`key` ») a un revers : quand le `router.refresh()` d'une mutation retombe, la
`key` change et l'état local repart de zéro — y compris un champ d'édition en
ligne ouvert entre-temps. Sans conséquence applicative ici (le remontage ne suit
qu'une action que l'utilisateur vient de terminer), mais **une recette doit
attendre que le rafraîchissement soit retombé** avant d'enchaîner sur le geste
suivant.

**30. Radix ouvre ses menus sur `pointerdown`, jamais sur `click`.** Un
`element.click()` sur un `DropdownMenuTrigger` ou un `SelectTrigger` ne
déclenche RIEN : le menu ne s'ouvre pas, la sonde trouve zéro `[role="menuitem"]`
et conclut « l'éditeur n'a pas accès au réordonnancement » alors qu'il l'a. Il
faut rejouer la séquence complète — `pointerdown`, `mousedown`, `pointerup`,
`mouseup`, `click`. Quatre faux échecs à la première passe du Lot 8C, dont un
qui faisait croire à une permission manquante.

**31. Chrome headless démarre en 800 × 600, et la cible créée par
`Target.createTarget` n'hérite pas de `--window-size`.** Sous 1024 px le
`<DataTable>` rend des CARTES : une recette qui cherche `tbody tr` trouve zéro
ligne et conclut que la liste est vide. Il faut **`Emulation.setDeviceMetricsOverride`
sur la cible**, pas seulement le drapeau de lancement.

**32. Le contenu d'un `<DataTable>` n'est PAS dans le HTML servi.** Le verrou de
montage (§6.1, en tête de `data-table.tsx`) fait rendre un SQUELETTE côté
serveur, pour éviter le saut « cartes → tableau ». Toute assertion sur les
colonnes, les lignes ou les cellules appartient donc à la **suite navigateur**,
jamais à la suite HTTP. Six faux échecs au Lot 8C. Ce que la suite HTTP peut
vérifier : que le squelette est là, que les données sont sérialisées dans la
charge utile, et tout ce qui vit HORS du tableau — en-tête de page, bandeaux,
formulaires.

**33. Les pauses fixes après navigation sont la première source d'échecs
intermittents.** Le même script a échoué puis réussi sans qu'une ligne de code
applicatif change. Remède appliqué : `attendreCondition(expression)` qui
interroge la page jusqu'à ce qu'elle soit prête, et `cliquer(texte)` qui attend
son bouton avant de le presser. **Ne pas calibrer une pause sur une exécution
réussie** : elle échouera sur une machine chargée, et fera chercher un défaut
applicatif qui n'existe pas.

**34. Un `next start` de recette peut survivre à la session.** Celui du Lot 8B
tournait encore vingt-quatre heures plus tard sur le port 3210, servant un build
périmé — et le `next start` du Lot 8C a échoué sur `EADDRINUSE` pendant que
`curl` répondait 200 depuis l'ancien. **Vérifier le port avant de lancer**
(`Get-NetTCPConnection -LocalPort <port> -State Listen`) et arrêter le serveur
dans le nettoyage de fin, au même titre que les comptes de test.

**35. Le disque de la machine est proche de la saturation.** ~130 Mo libres
après un `npm run build`. `.next/cache` pèse à lui seul 120 à 220 Mo et se
regénère : le vider (`Remove-Item -Recurse .next\cache`) est sans risque et
suffit à faire tenir une recette navigateur, qui a besoin de place pour le
profil Chrome temporaire. À surveiller avant chaque lot.

---

## Ce qu'a livré le Lot 8A (détail)

### Fichiers

| Fichier | Rôle |
|---|---|
| `src/core/cms/schemas/programme.schema.ts` | ✚ `programmeFormSchema` (écart nº 58), `programmeIdSchema`, `reorderProgrammesSchema`, `setProgrammeStatusSchema` |
| `src/core/cms/blocks/types.ts` | ✚ `multiple` et `max` sur le descripteur `media` (écart nº 60) |
| `src/server/deps/programme.deps.ts` | Racine de composition — **le gabarit à recopier aux Lots 8B → 8I** |
| `src/server/actions/programmes.actions.ts` | 5 actions, toutes dans `createAction`. `etiquettes()` regroupe collection + fiche + pages composées |
| `src/server/queries/programmes.query.ts` | Lectures publiques (`createPublicClient`), + la marche à suivre du Lot 15 en tête de fichier |
| `src/server/queries/media.query.ts` | Résolution publique des médias — un échec y rend une Map vide, il ne casse pas la page |
| `src/components/dashboard/programmes/programme-form.tsx` | 12 descripteurs + `<SchemaForm>`. `<AdressePublique>` propose l'adresse et affiche l'aperçu |
| `…/programmes/programmes-client.tsx` | L'écran de liste : colonnes, filtres, réordonnancement, actions groupées |
| `…/programmes/programme-editeur.tsx` | La fiche : publier / dépublier / supprimer autour du formulaire |
| `src/app/(dashboard)/dashboard/programmes/{page,nouveau/page,[id]/page}.tsx` | Les trois écrans, chacun derrière `requirePermission` |
| `src/components/ui-ext/content-icon.tsx` | ✚ Nom d'icône → composant, **sans appel de fonction pendant le rendu** (écart nº 61) |
| `src/lib/programme-visuels.ts` | ✚ Repli vers `/public` tant qu'aucune couverture n'est choisie (écart nº 64) |

Modifiés côté public : `programme-card.tsx` (entité de domaine + `<CmsImage>`),
`page-hero.tsx` (`imageNode`), `(site)/{page,programmes,programmes/[slug],
benevolat,don}`, `sitemap.ts`, `lib/schemas.ts`, `volunteer-form.tsx`,
`app/actions/forms.ts`.
Modifiés côté design system (écart nº 65) : `table-view.tsx`, `card-view.tsx`,
`list-field.tsx`, `field-styles.ts`, `media-picker.tsx`, `relation-fields.tsx`,
`field-control.tsx`, `media.actions.ts` (+ `lireMediasAction`).

### Recette exécutée — 248 vérifications, 0 échec

**Code pur (59).** `programmeFormSchema` accepté / refusé champ par champ, avec
les messages français attendus ; entrée = sortie prouvée (aucun défaut ajouté) ;
les quatre schémas d'action ; l'adresse proposée depuis le titre sur les cas
réels du contenu ; les sept cas d'usage sur dépôt en mémoire — naissance en
brouillon, position en fin de liste, doublon d'adresse en `CONFLICT` sur le
champ `slug`, statut neutralisé dans une modification, publication d'un
programme incomplet refusée **en nommant ce qui manque**, réordonnancement
partiel / à doublon / à identifiant inconnu refusé, renumérotation sans trou
après suppression.

**HTTP (50).** Anonyme redirigé vers `/connexion` avec sa destination ;
éditeur et admin sur les trois écrans ; `Dépublier` et `Supprimer` **absents**
pour l'éditeur, avec le motif écrit ; identifiant inexistant et identifiant non
uuid → 404 du dashboard, sans CTA public ; les 8 programmes rendus sur
`/programmes` avec leurs liens et leurs visuels ; la fiche `education` complète ;
l'accueil, `/benevolat`, `/don` et le sitemap alimentés par la base. **Un
programme repassé en brouillon disparaît de `/programmes`, du sitemap et de la
liste de bénévolat, reste visible au dashboard, et réapparaît immédiatement une
fois republié.**

**Parcours navigateur (78).** Chrome en CDP. Liste : 8 lignes ordonnées,
colonnes du §8A.3, filtres « État » et « Teinte », recherche en mémoire,
réordonnancement bloqué **et expliqué** pendant une recherche. Création :
l'adresse suit le titre puis **cesse de le suivre** dès qu'on la corrige ; un
envoi incomplet produit des messages français sur les bons champs, reliés par
`aria-describedby` ; le programme naît en `draft` à la position 9 et **n'est pas
sur le site** ; publié, il apparaît aussitôt sur `/programmes`, sur sa page, dans
le sitemap et dans les domaines de bénévolat. Doublon d'adresse refusé sous le
champ « Adresse », saisie intacte, **rien créé en base**. « Monter » remonte
d'exactement un rang, en **un** appel, et l'ordre se reflète sur le site.
Supprimer un programme cité par un témoignage est refusé par un message
français qui ne laisse fuir aucun SQL, et le programme reste en base.
L'éditeur **crée et modifie**, ne voit ni « Publier » ni « Supprimer », et les
**trois barrières** sont mesurées : l'action de publication appelée directement
en POST (identifiant `Next-Action` capturé sur le clic de l'admin) répond
`FORBIDDEN`, la base la refuse par `guard_publish`, et la RLS **filtre** la
suppression — 0 ligne, aucune erreur (découverte nº 1). Journal d'audit : une
entrée par mutation réussie, **aucune** pour la suppression refusée.

**Responsive (61).** Les trois écrans aux cinq largeurs 320 · 390 · 768 · 1024 ·
1440 : aucun défilement horizontal de page, toutes les cibles tactiles ≥ 44 px
(zone sensible réelle, pseudo-éléments compris), tout élément focalisable nommé,
champs ≥ 16 px sous 768 px. Bascule cartes ⇄ tableau vérifiée à 767 puis 768 px
— **aucune structure de tableau dans le DOM** en dessous. Barre
d'enregistrement `sticky` et bouton pleine largeur à 390 px. Zoom 200 % (émulé
à 720 px) sans perte de fonctionnalité.

Comptes et programmes de recette supprimés, journal d'audit nettoyé ; contrôle
final : **1 seul profil**, **8 programmes en positions 1 à 8 dans leur ordre
d'origine**, `media_assets` toujours vide, aucune entrée d'audit de type
`programme`. Banc de recette entièrement retiré du dépôt.

`npm run build`, `npx tsc --noEmit` et `npx eslint .` : code de sortie **0**,
zéro avertissement.

### Points de vigilance légués

- **`audit_logs` contient 17 entrées résiduelles de la recette du Lot 7**
  (`media.create` / `media.delete` / `auth.*` de comptes supprimés). Elles
  PRÉCÈDENT ce lot. À purger avant le Lot 13, qui les afficherait comme un
  historique réel.
- **Les libellés « Huit programmes » / « Voir les 8 programmes » restent
  écrits en dur** sur `/programmes`, l'accueil et les métadonnées. Ils sont
  laissés à l'identique parce que la recette du §8A compare le rendu
  avant/après — mais ils deviennent faux dès qu'un neuvième programme est
  publié. Ce sont des textes éditoriaux : ils relèvent du constructeur de pages
  (Lot 9) et des réglages SEO (Lot 10).
- **Le gabarit des Lots 8B → 8I est en place.** Recopier, dans cet ordre :
  `deps` → `actions` (avec `etiquettes()`) → `query` → schéma de formulaire
  distinct → écran de liste → écran de fiche → bascule publique. Les quatre
  suites de recette suivent le même découpage.

---

## Ce qu'a livré le Lot 8B (détail)

### Fichiers

| Fichier | Rôle |
|---|---|
| `src/core/cms/entities/article.ts` | `Article`, `ArticleCategory`, et l'explication de l'absence de `position` |
| `src/core/shared/reading-time.ts` | ✚ `tempsDeLecture` à 200 mots/min — pure, appelée des deux côtés de la frontière |
| `src/core/cms/schemas/article.schema.ts` | `articleFormSchema` (écart nº 71), `dateISOSchema`, `SANS_CATEGORIE`, les schémas de catégorie |
| `src/core/cms/ports/article.port.ts` | 4 ports : lecture / écriture d'article, lecture / écriture de catégorie (écart nº 69) |
| `src/core/use-cases/articles/{create,update,delete,get,list,set-article-status}.ts` | `setArticleStatus` FIXE la date de publication (écart nº 72) |
| `src/core/use-cases/article-categories/manage-categories.ts` | Les 5 cas d'usage des catégories, dont le refus de suppression qui COMPTE les articles |
| `src/core/testing/in-memory-article.repository.ts` | Les deux dépôts en mémoire — 119 tests purs tournent dessus |
| `src/infrastructure/supabase/mappers/article.mapper.ts` | `snake_case` ⇄ `camelCase`, une seule fois |
| `…/repositories/article.repository.ts` | `findPublished` porte la condition `published_at <= now()` ; l'avertissement sur `reorder_rows` est en tête |
| `…/repositories/article-category.repository.ts` | Dépôt séparé — droits distincts en base |
| `src/server/deps/article.deps.ts` | Racine de composition, un seul client Supabase pour les deux dépôts |
| `src/server/actions/articles.actions.ts` | 4 actions ; l'auteur vient de la session |
| `src/server/actions/article-categories.actions.ts` | 4 actions ; le raisonnement complet sur les permissions (écart nº 70) |
| `src/server/queries/articles.query.ts` | Lectures publiques + la marche à suivre du Lot 15, avec le piège des catégories |
| `src/lib/dates.ts` | ✚ Fuseau éditorial unique, conversions saisie ⇄ instant (écart nº 67) |
| `src/lib/actualite-visuels.ts` | ✚ Repli transitoire vers `/public` (écart nº 75) |
| `src/core/cms/blocks/types.ts` | ✚ `kind: "date"` — 12ᵉ type de champ (écart nº 66) |
| `src/components/dashboard/forms/fields/date-field.tsx` | ✚ `<input type="date">` natif, heure du jour préservée, mention « À venir » |
| `…/articles/article-form.tsx` | 9 descripteurs, `<AdressePublique>`, `<TempsDeLectureAssistant>`, `<DatePubliee>` |
| `…/articles/articles-client.tsx` | L'écran de liste : colonnes, 3 filtres, actions groupées, borne annoncée |
| `…/articles/article-editeur.tsx` | La fiche : trois états (brouillon / programmé / en ligne) |
| `…/articles/categories-modal.tsx` | La modale : ajout, renommage en ligne, réordonnancement, suppression |
| `src/app/(dashboard)/dashboard/actualites/{page,nouveau/page,[id]/page}.tsx` | Les trois écrans, chacun derrière `requirePermission` |

Modifiés côté public : `news-card.tsx` (entité de domaine + `<CmsImage>`),
`actualites-filter.tsx` (catégories en chaînes libres),
`(site)/{page,actualites,actualites/[slug]}`, `sitemap.ts`,
`content/actualites.ts` (ré-exports).
Modifiés côté design system : `field-control.tsx`, `basic-fields.tsx`
(écart nº 78).

### Recette exécutée — 389 vérifications, 0 échec

**Code pur (119).** `tsconfig.recette.json` temporaire → `.tmp-recette/` →
`node`. `tempsDeLecture` : 0 mot → `null`, 1 mot → 1 min (jamais 0), 200 → 1,
201 → 2. `src/lib/dates.ts` : 09:00 UTC reste le même jour à Douala, 23:30 UTC
bascule au lendemain, **l'heure du jour survit à un aller-retour**, une saisie
invalide rend `null`. `articleFormSchema` accepté / refusé champ par champ avec
les messages français attendus, **entrée = sortie prouvée**, date dans le passé
ET dans le futur acceptées, format `timestamptz` de PostgreSQL accepté. Les six
cas d'usage sur dépôt en mémoire : naissance en brouillon, temps de lecture
calculé mais jamais écrasé s'il est saisi, doublon d'adresse en `CONFLICT` sur
le champ `slug`, catégorie inconnue refusée sur le champ `categoryId`, statut et
auteur neutralisés dans une modification, publication d'un article vide refusée
**en nommant ce qui manque**, date de publication fixée à la mise en ligne et
**conservée à la republication**, article programmé absent de la liste publique
et illisible par son adresse. Les cinq cas d'usage de catégorie : position en
fin de liste, doublon refusé, adresse non recalculée au renommage, suppression
d'une catégorie utilisée refusée **avec le nombre d'articles, accordé au
pluriel**, réordonnancement partiel / à doublon / à identifiant inconnu refusé.

**Infrastructure, base réelle (57).** Deux comptes temporaires (admin, éditeur).
Les 3 articles et 5 catégories seedés lus par l'anonyme, dans le bon ordre, avec
leurs temps de lecture d'origine intacts. **RLS : un éditeur crée et modifie,
mais la base refuse sa publication (ADB01, message français verbatim) et FILTRE
sa suppression** — le refus est détecté, l'article reste en base (découverte
nº 1). Un article publié avec une date future est **invisible de l'anonyme par
son adresse comme dans la liste**, et le dépôt le filtre aussi avec un client
authentifié. Recherche sur deux colonnes, `count` et `findAll` alignés, une
recherche contenant `,()%_` ne casse pas la requête. Catégories : l'éditeur
renomme et réordonne, la base lui refuse l'ajout et la suppression ;
`reorder_rows('article_categories')` inverse réellement l'ordre et renumérote de
1 à N.

**HTTP (69).** Anonyme redirigé vers `/connexion` avec sa destination ; éditeur
et admin sur les trois écrans ; `Dépublier` et `Supprimer` **absents** pour
l'éditeur, avec le motif écrit ; identifiant inexistant et non-uuid sans erreur
technique ni CTA public. Les 3 articles rendus sur `/actualites` avec leurs
liens, leurs catégories, leurs visuels et leur temps de lecture ; la page d'un
article rend chaque paragraphe, son chapô et son JSON-LD ; l'accueil et le
sitemap alimentés par la base. **Un article dépublié disparaît de `/actualites`,
du sitemap et de l'accueil, reste visible au dashboard, et réapparaît
immédiatement une fois republié.** Un article programmé est **absent des trois**,
visible au dashboard, qui annonce sa date — et le lien « Voir sur le site » ne
lui est pas proposé. Renommer une catégorie change le libellé sur le site.

**Parcours navigateur (67).** Chrome en CDP. Liste : 3 lignes, les cinq colonnes
du §8B, **aucune poignée de réordonnancement**, recherche et filtres « État » et
« Catégorie » en mémoire. Création : l'adresse suit le titre puis **cesse de le
suivre** dès qu'on la corrige ; le corps est découpé en paragraphes et le temps
de lecture **calculé** sous les yeux ; un envoi incomplet produit des messages
français sur les bons champs, reliés par `aria-describedby` ; l'article naît en
`draft`, avec son auteur, et **n'est pas sur le site** ; publié, il apparaît
aussitôt sur `/actualites`, sur sa page et dans le sitemap, avec son badge
« Exemple ». Doublon d'adresse refusé sous le champ « Adresse », saisie intacte,
**rien créé en base**. **Date future** : le champ annonce « À venir », l'écran
explique la conséquence, et après enregistrement l'article disparaît du site et
du sitemap tandis que le dashboard affiche « En ligne le … ». Catégories :
ajout, renommage (adresse inchangée), suppression d'une catégorie utilisée
refusée **avec le nombre**, suppression d'une catégorie libre acceptée.
L'éditeur **crée et modifie**, ne voit ni « Publier » ni « Supprimer », et
**l'action de publication appelée directement en POST répond `FORBIDDEN`** avec
un message français — l'article reste en brouillon. Journal d'audit : une entrée
par mutation réussie, **aucune** pour la suppression refusée, **aucune
publication** au nom de l'éditeur.

**Responsive et accessibilité (77).** Les trois écrans aux cinq largeurs 320 ·
390 · 768 · 1024 · 1440 : aucun défilement horizontal de page, **toutes les
cibles tactiles ≥ 44 px** (zone sensible réelle, pseudo-éléments compris),
tout élément focalisable nommé, champs de saisie ≥ 16 px sous 768 px. Bascule
cartes ⇄ tableau vérifiée à 767 puis 768 px — **aucune structure de tableau dans
le DOM** en dessous. Barre d'enregistrement `sticky` et bouton pleine largeur à
390 px. Modale des catégories : `Sheet` de la hauteur exacte de la fenêtre à
390 px, `Dialog` ≤ 672 px et ≤ 85 dvh à 1440 px, cibles ≥ 44 px dans les deux
formes. Zoom 200 % (émulé à 720 px) sans perte. **Contraste AA mesuré par
composition réelle** (découverte nº 10) sur les trois écrans, thème clair ET
thème sombre : tous conformes.

Comptes, articles et catégories de recette supprimés, journal d'audit nettoyé ;
contrôle final : **1 seul profil**, **3 articles publiés**, **5 catégories dans
leur ordre d'origine**, `media_assets` toujours vide. Banc de recette
entièrement retiré du dépôt.

`npm run build`, `npx tsc --noEmit` et `npx eslint .` : code de sortie **0**,
zéro avertissement.

### Points de vigilance légués

- **`audit_logs` contient toujours les 17 entrées résiduelles du Lot 7.** Le
  Lot 8B n'en a ajouté aucune : chaque suite nettoie les siennes par
  `actor_id`. À purger avant le Lot 13.
- **`src/content/actualites.ts` n'est plus importé par aucune page**, mais le
  fichier reste — comme `programmes.ts` — pour sa valeur de référence et ses
  deux ré-exports. Il sera retiré au Lot 16.
- **La liste des catégories est lue TROIS fois** sur l'écran de fiche (page,
  `generateMetadata` n'en a pas besoin, formulaire). Une seule requête en
  pratique, la page la passe en props. Si un quatrième appelant apparaît,
  mémoïser avec `cache()` comme le fait `lireArticle`.
- **Le champ `date` n'a qu'un appelant.** Le Lot 8I (millésime d'un rapport
  annuel) et le Lot 12 (publication programmée) sont les suivants prévus : ne
  pas le réécrire, l'étendre.

---

## Prochaine étape : Lot 8C — témoignages

Voir la table des lots 8B → 8I du Rapport 2. Spécificités de 8C : lien vers un
programme, et **avertissement de consentement affiché dans le formulaire** —
règle absolue de `src/content/temoignages.ts` : aucune citation sans accord.

Quatre choses valent d'être sues avant de commencer :

- **la colonne `testimonials.has_consent` existe déjà** (écart nº 13, validée au
  Lot 1). Le §8C impose une case à cocher obligatoire « La personne a donné son
  accord écrit pour la publication de cette citation » : sans cette colonne, la
  case ne laisserait aucune trace. Elle doit être exigée **par le schéma**, pas
  seulement par l'interface ;
- `testimonials.programme_id` est en `on delete restrict` : c'est ce qui fait
  qu'un programme cité ne peut pas être supprimé (recette du Lot 8A). Le champ
  du formulaire est un `reference` vers `programme`, et ses options sont
  fournies par l'écran (écart nº 40) ;
- `testimonials` **porte une colonne `position`**, contrairement à `articles` :
  le réordonnancement du §8x s'applique cette fois à la collection elle-même,
  avec `reorder_rows('testimonials')` et la glissière du `<DataTable>`. Le
  gabarit à recopier est celui du Lot 8A, pas celui du Lot 8B ;
- le champ `boolean` et le champ `number` nullable viennent d'être corrigés
  (écart nº 78) : leurs cases à cocher font désormais 44 px. Ne pas les
  redimensionner localement.

---

## Ce qu'a livré le Lot 6 (détail)

### Fichiers

| Fichier | Rôle |
|---|---|
| `src/core/cms/blocks/types.ts` | `FieldDescriptor` — le contrat d'entrée de `<SchemaForm>`. Porte l'avertissement de l'écart nº 41 pour le Lot 9. |
| `src/components/dashboard/data-table/types.ts` | `Column`, `FilterDescriptor`, `RowAction`, `BulkAction`, `DataTableProps` |
| `…/data-table/data-table.tsx` | Orchestrateur : filtre, tri, pagination, sélection, réordonnancement, 4 états |
| `…/data-table/table-view.tsx` · `card-view.tsx` | Les deux formes. **Une seule est montée à la fois.** |
| `…/data-table/toolbar.tsx` · `pagination.tsx` · `bulk-bar.tsx` · `row-actions.tsx` · `skeletons.tsx` | Barre d'outils, pagination, actions groupées, menu de ligne, squelettes |
| `…/forms/schema-form.tsx` | Le formulaire généré + barre d'enregistrement collante |
| `…/forms/field-control.tsx` | L'aiguillage `kind` → composant, exhaustif à la compilation |
| `…/forms/field-styles.ts` | 44 px et `text-base` sous `md:`, **hors** des primitives partagées |
| `…/forms/fields/basic-fields.tsx` | text, link, textarea, richtext, number, boolean, select |
| `…/forms/fields/choice-fields.tsx` | icon, tone — boutons radio natifs, jamais des `<button>` |
| `…/forms/fields/list-field.tsx` | Liste ordonnable |
| `…/forms/fields/relation-fields.tsx` | media (~~provisoire~~ — **branché sur `<MediaPicker>` au Lot 7**), reference |
| `…/forms/references-context.tsx` | Options du champ `reference` (écart nº 40) |
| `…/modals/form-modal.tsx` · `confirm-dialog.tsx` | `Dialog` ⇄ `Sheet`, sauvegarde protégée |
| `…/feedback/status-badge.tsx` · `empty-state.tsx` · `error-state.tsx` | États éditoriaux, vide, erreur |
| `…/shared/reorder.tsx` | **Les trois exigences tactiles du §12, implémentées une seule fois** |
| `src/app/(dashboard)/dashboard/demo/` | Banc d'essai — `page.tsx`, `demo-client.tsx`, `demo-data.ts`. **Supprimé au Lot 16.** |

### Recette exécutée (51 mesures navigateur, 0 échec)

Chrome piloté en CDP, sur `next start`, compte temporaire créé puis supprimé
(1 seul profil en base après coup, vérifié).

- **5 largeurs** : 320 · 390 · 768 · 1024 · 1440 px — `scrollWidth ≤ innerWidth`
  partout, et **encore vrai à 200 % de zoom** (WCAG 1.4.4).
- **Bascule à 768 px** : à 767 px, `document.querySelectorAll('table').length === 0`
  — la structure de tableau n'est pas dans le DOM, pas seulement masquée. À
  768 px elle est là.
- **Quatre états** : rempli (5 lignes paginées), chargement (squelettes dans
  **les deux formes**, une seule visible, **une seule** annonce au lecteur
  d'écran), erreur (`role="alert"` + « Réessayer »), vide (titre, explication,
  bouton).
- **Recherche, tri, réordonnancement** : filtrage juste ; `aria-sort` passe de
  `none` à `ascending` ; le réordonnancement se **bloque et s'explique**
  pendant une recherche ; « Monter » déplace sans glisser-déposer.
- **Tactile** : un défilement rapide au doigt **ne déclenche pas** de
  déplacement ; une pression de 400 ms l'arme (annonce dnd-kit en français) et
  le glissement qui suit réordonne réellement.
- **Clavier seul** : espace → flèche bas → espace réordonne.
- **`<SchemaForm>`** : les 11 types de champs rendus ; champs ≥ 16 px et ≥ 44 px
  à 390 px ; erreurs Zod sur le bon champ, en `role="alert"`, avec
  `aria-describedby` juste ; barre d'enregistrement `sticky`, bouton pleine
  largeur.
- **Invariant nº 1 vérifié de bout en bout** : le formulaire soumis transmet
  `beneficiaires: null` — jamais `0` ; le texte riche part en tableau de
  paragraphes.
- **`<FormModal>`** : `Sheet` de hauteur exactement `innerHeight` à 390 px,
  corps défilant, en-tête ET pied encore visibles après défilement ; `Dialog`
  ≤ 672 px et ≤ 85 dvh à 1440 px. Fermeture sans modification → aucune
  confirmation ; **Échap** après modification → confirmation, « Continuer la
  saisie » en premier.
- **`<ConfirmDialog>`** : le titre nomme l'élément, la conséquence est dite, le
  bouton porte un verbe ; à 390 px les boutons sont empilés et l'action
  destructive est **en bas**.
- **Accessibilité** : 103 éléments focalisables, tous nommés ;
  `prefers-reduced-motion` respecté.
- **Contraste AA mesuré par composition réelle** (voir découverte nº 10) :
  125 textes, thème clair **et** thème sombre, tous conformes — après les trois
  corrections de l'écart nº 43.

`npm run build`, `npx tsc --noEmit` et `npx eslint .` : code de sortie **0**,
zéro avertissement.

### Vérifications de non-régression

- `grep -rn "min-h-screen\|h-screen\|100vh" src/components/dashboard/ src/app/\(dashboard\)/`
  → une seule occurrence, dans un **commentaire** qui explique l'interdiction.
- `grep -rn "window.innerWidth\|matchMedia" src/ --include=*.ts --include=*.tsx`
  → une seule occurrence de **code**, `src/hooks/use-breakpoint.ts`.

---

## Ce qu'a livré le Lot 7 (détail)

### Fichiers

| Fichier | Rôle |
|---|---|
| `src/core/cms/entities/media-asset.ts` | `MediaAsset`, buckets, types MIME et tailles autorisés, `MediaUsage`, `MediaFilter`. **Source de vérité** des listes, lue par l'infrastructure (écart nº 46). |
| `src/core/shared/file-signature.ts` | `detectMimeType(octets)` — le type RÉEL, lu dans les premiers octets. C'est ce qui refuse un `.exe` renommé `.jpg`. |
| `src/core/cms/schemas/media.schema.ts` | `uploadMediaSchema`, `updateMediaSchema`, `mediaFicheSchema` (écart nº 50), `mediaFilterSchema` |
| `src/core/cms/ports/media.port.ts` | `MediaReadPort`, `MediaWritePort`, **`MediaStoragePort`** (écart nº 45) |
| `src/core/use-cases/media/upload-media.ts` | Type réel → bucket → taille → chemin → **fichier puis catalogue**, avec compensation |
| `…/media/{list,get,update,delete}-media.ts` | Liste paginée, résolution par identifiant, correction de fiche, suppression avec usages bloquants |
| `src/infrastructure/supabase/mappers/media-asset.mapper.ts` | `snake_case` ⇄ `camelCase`, une seule fois |
| `…/repositories/media.repository.ts` | Filtres, dossiers, et **`findUsages` sur neuf références** interrogées en parallèle |
| `src/infrastructure/storage/storage.ts` | Implémente désormais `MediaStoragePort` ; les listes viennent de `core/` |
| `src/server/deps/media.deps.ts` | **Racine de composition** — le gabarit des Lots 8A→8I (écart nº 44) |
| `src/server/actions/media.actions.ts` | 6 actions, toutes dans `createAction` ; débit 30/h sur le téléversement |
| `src/lib/media-url.ts` | `urlMedia`, `formaterPoids`, `formaterDimensions` — **jamais** `/render/image/` (écart nº 54) |
| `src/components/media/cms-image.tsx` | Rendu public : `next/image` + repli `MediaPlaceholder` (§7.4) |
| `src/components/dashboard/media/preparer-fichier.ts` | Compression canvas → WebP 2400 px / 0,85, dimensions, avertissement de taille |
| `…/media/media-thumbnail.tsx` · `media-grid.tsx` | Vignette `aspect-square`, grille 2→6 colonnes, carte entière cliquable |
| `…/media/media-uploader.tsx` | File d'attente, **texte alternatif exigé**, `capture="environment"`, envois séquentiels |
| `…/media/media-detail.tsx` | Fiche : `Sheet` < 1024 px, panneau latéral au-delà ; `<SchemaForm>` pour la correction |
| `…/media/media-picker.tsx` | Le 8ᵉ composant du §12 — deux onglets, sur `<FormModal>` |
| `…/media/mediatheque-client.tsx` | L'écran : filtres serveur, grille ⇄ `<DataTable>`, pagination |
| `src/app/(dashboard)/dashboard/mediatheque/page.tsx` | Garde `media:read`, lecture par cas d'usage, permissions transmises |

Modifiés : `relation-fields.tsx` (le `MediaField` provisoire du Lot 6 est
remplacé), `sidebar.tsx` et `topbar.tsx` (écart nº 55).

### Recette exécutée — 206 vérifications, 0 échec

**Code pur (82).** `tsconfig.recette.json` temporaire → `.tmp-recette/` → `node`.
Signatures des 6 formats acceptés **et** refus de l'exécutable, du MP4, du WAV
et du HTML ; chemins `<uuid>.<ext>` avec dossiers assainis et traversée
neutralisée ; texte alternatif exigé de 3 à 200 caractères ; 5 Mo accepté,
12 Mo refusé « 8 Mo maximum », PDF de 21 Mo refusé « 20 Mo maximum » ; **un PDF
déguisé en `.png` est rangé dans le bucket `documents`** ; ordre
`stockage > catalogue` vérifié, et le fichier orphelin retiré quand le
catalogue échoue ; usages bloquants nommés dans le message de refus.

**Infrastructure, base réelle (43).** Deux comptes temporaires (admin, éditeur).
Téléversement réel dans le bucket, URL publique servie en `image/png` ;
recherche sur les trois colonnes ; `count` et `findAll` alignés ; une recherche
contenant `,()%_` ne casse pas la requête. **RLS : un éditeur téléverse mais ne
corrige ni ne supprime** — et le refus est bien détecté, alors que la RLS
FILTRE au lieu de rejeter (découverte nº 1). Les neuf usages détectés, dont les
trois bloquants ; la base refuse elle aussi (`23503`) ; après suppression, la
couverture du programme repasse à `NULL` — pas de référence morte.

**Navigateur, Chrome en CDP (81).** Parcours complet sur `next start` :
téléversement d'une image de ~2,8 Mo → compression WebP visible dans l'interface
(« allégé depuis »), bouton d'envoi **désactivé tant qu'un texte alternatif
manque**, motif écrit ; le fichier stocké porte `<uuid>.webp` et le catalogue
garde « Photo campagne santé (1).PNG ». Refus client d'un `.exe` renommé et d'un
PDF de 21 Mo, en `role="alert"`. **Matrice des 5 largeurs** (320 · 390 · 768 ·
1024 · 1440) : aucun débordement, grille 2/2/4/5/5 colonnes, **toutes les cibles
tactiles ≥ 44 px**, tout élément focalisable nommé — et idem à **200 % de zoom**.
Fiche : `Sheet` de hauteur exactement `innerHeight` à 390 px, panneau latéral à
1440 px, police ≥ 16 px. Bascule cartes/tableau vérifiée à 767 puis 768 px.
`<MediaPicker>` : `Dialog` ≤ 672 px, deux onglets, `aria-pressed`, `Sheet` plein
écran et bouton « Choisir » atteignable à 390 px. **`/_next/image` accepte l'URL
Supabase et renvoie de l'AVIF** — un domaine hors liste est refusé. Un compte
`editor` ne voit **ni** bouton de suppression **ni** formulaire de correction,
et le motif est écrit. Suppression confirmée par une modale qui **nomme le
fichier**, puis vérifiée en base.

Comptes et médias de test supprimés ; contrôle final : **un seul profil en
base**, aucun média résiduel. Banc de recette entièrement retiré du dépôt.

`npm run build`, `npx tsc --noEmit` et `npx eslint .` : code de sortie **0**,
zéro avertissement.
