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

## État au terme du Lot 8I — **LA SÉRIE 8 EST CLOSE**

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
| 8D | Équipe de bout en bout : domaine, **garde sur le marqueur « [À COMPLÉTER] » à la publication**, 5 actions, 3 écrans, bascule de `/a-propos` | ✅ 207 tests purs + 69 sur base réelle + 51 HTTP + 102 parcours navigateur + 104 mesures responsive = **533, 0 échec** |
| 8E | Valeurs de bout en bout : **première collection sans cycle éditorial** (`is_visible`), **liste des icônes descendue dans le domaine** → `icon` enfin validé par énumération, 5 actions, 3 écrans, bascule de **deux** pages publiques | ✅ 285 tests purs + 75 sur base réelle + 75 HTTP + 95 parcours navigateur + 101 mesures responsive = **631, 0 échec** |
| 8F | Questions fréquentes de bout en bout : **premier lot dont la bascule touche des données STRUCTURÉES** (JSON-LD `FAQPage`), `topic` qui décide de la page, `bullets[]` facultatives, 5 actions, 3 écrans, bascule de **trois** pages publiques | ✅ 118 tests purs + 59 sur base réelle + 74 HTTP + 57 parcours navigateur + 68 mesures responsive = **376, 0 échec** |
| 8G | Chiffres clés de bout en bout : **l'invariant nº 1 rendu SAISISSABLE** (`value` nullable, « — » jamais `0`), `key` dérivée et immuable, `to_confirm` interne, 5 actions, 3 écrans, bascule de **deux** pages dont `/impact` qui était **entièrement statique** | ✅ 265 tests purs + 121 sur base réelle + 113 HTTP + 107 parcours navigateur + 134 mesures responsive = **740, 0 échec** |
| 8H | Galerie de bout en bout : **premier lot dont la source de vérité était un DOSSIER**, migration réelle des 4 photos vers Storage + `media_assets` + `gallery_items`, catégories gérables (teinte comprise), 5 + 4 actions, 3 écrans, bascule de `/galerie` **entièrement statique**, et **3 correctifs hors périmètre dont un défaut réel de téléversement** | ✅ 124 tests purs + 74 sur base réelle + 80 HTTP + 101 parcours navigateur + 110 mesures responsive = **489, 0 échec** |
| 8I | Documents de bout en bout — **DERNIER LOT DE LA SÉRIE 8** : `document_media_id` NULLABLE donc **aucune garde de publication**, `year` unique vérifiée dans le domaine, avertissement d'ordre propre à cette collection, 5 actions, 3 écrans, bascule de la section Documents de `/impact`, **premier usage réel de `<MediaPicker accept="document">`**, et **correction d'un défaut du SEED** (les 2 rapports étaient en `draft`) | ✅ 114 tests purs + 74 sur base réelle + 59 HTTP + 96 parcours navigateur + 132 mesures responsive = **475, 0 échec** |

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
  brouillon, 4 éléments de galerie publiés et 4 catégories de galerie,
  12 pages, 30 sections squelettes, 12 entrées de navigation, 7 groupes de
  réglages, **2 rapports annuels PUBLIÉS, sans PDF, en positions 1 (2025) et
  2 (2024)**.
- ⚠️  **LES DEUX RAPPORTS ONT CHANGÉ D'ÉTAT AU LOT 8I : `draft` → `published`.**
  Ce n'est pas un changement d'avis, c'est la correction d'un défaut du seed —
  voir l'écart nº 151. `supabase/seed.sql` est corrigé pour les installations
  neuves, et la base déjà seedée a été alignée par un `UPDATE` borné aux deux
  années, aux lignes encore en `draft` et sans PDF. Aucun contenu n'a été
  inventé : seul l'état éditorial a bougé.
- **Le bucket `documents` est VIDE, et `media_assets` ne contient aucun PDF.**
  Les 5 médias sont tous des images. La chaîne du document a bien été exercée
  par la recette (téléversement réel, `Content-Type` servi, `?download=`), mais
  le fichier de test a été purgé : rien de durable n'a été ajouté. **Le premier
  vrai PDF sera celui que l'utilisateur déposera.**
- **`media_assets` contient 5 médias depuis le Lot 8H.** Le premier est celui de
  l'utilisateur, téléversé au Lot 8C depuis `/dashboard/mediatheque`. Les
  **quatre autres sont les photographies de la galerie**, migrées par ce lot :
  `communaute-01.jpeg`, `education-01.jpeg`, `environnement-01.jpeg` et
  `sante-01.jpeg`, rangées dans le dossier `galerie` du bucket `media`, avec
  leurs dimensions mesurées et `uploaded_by = null` (personne ne les a
  téléversées depuis le dashboard). **C'est la première fois qu'une recette
  ajoute des lignes durables à cette table** — et c'était le travail annoncé
  par le seed du Lot 1. Les fichiers d'origine restent dans
  `public/images/galerie/`, mais **plus aucune page ne les lit**.
- **`audit_logs` : 177 entrées, et la recette du Lot 8I n'en a laissé AUCUNE.**
  Le contrôle décisif n'est pas le compteur global mais celui-ci : **0 entrée
  créée après le 2026-08-31**, et **0 entrée `annual_report*`**. La suite 4 en a
  réellement produit par ses mutations, et les a purgées par `actor_id`.
  Quatrième lot consécutif à ne rien laisser derrière lui.
  ⚠️  **Le compteur global est mesuré à 171 au démarrage de la session et à 177
  à sa fin, et cet écart de 6 n'a PAS pu être expliqué.** Les six entrées les
  plus récentes datent du 31 août — donc d'avant cette session — et appartiennent
  au compte de l'utilisateur (`auth.login` ×2, `team_member.reorder` ×3,
  `gallery_category.update`). La mesure d'entrée est donc celle qui ne se
  raccorde pas, pas celle de sortie. Consigné tel quel plutôt qu'expliqué à
  tort : la question « la recette a-t-elle sali le journal ? » est tranchée par
  la mesure datée, qui répond non.
  Rappel du détail antérieur, à purger au Lot 13 : **101 entrées ont
  `actor_id = null`** (comptes de recette supprimés, `on delete set null`), les
  76 autres appartiennent au compte de l'utilisateur.
  ⚠️  **Les écarts de ce compteur ne viennent PAS des recettes.** 138 → 164
  entre les Lots 8G et 8H, puis 164 → 168 PENDANT la session du Lot 8H : les
  quatre dernières sont un `auth.login`, un `auth.logout` et deux
  `programme.reorder` du compte de l'utilisateur, horodatées au milieu de la
  recette et vérifiées une par une. Rien à corriger, mais à savoir avant de
  s'alarmer d'un compteur qui a bougé.
  Rappel du détail antérieur, à purger au Lot 13 : 16 entrées appartiennent au
  compte de l'utilisateur, 53 sont les `team_member.*` du Lot 8D, 12 les
  `core_value.*` du Lot 8E, 17 les résidus du Lot 7.
- **`rate_limits` contient 6 lignes**, dont **quatre portant une vraie adresse
  IP** : `connexion:196.117.202.164`, `mot-de-passe-oublie:196.117.202.164`,
  et **deux nouvelles depuis le Lot 8H** — `connexion:105.159.175.105` (31 août,
  09 h 14) et `connexion:196.117.108.244` (31 août, 18 h 12). Ce sont les
  connexions de l'utilisateur depuis d'autres réseaux, horodatées avant cette
  session et **jamais touchées par les recettes** : le banc s'authentifie
  directement auprès de Supabase, il ne passe pas par `/connexion`. Les deux
  dernières lignes (`televersement:::ffff:127.0.0.1`, `televersement:::1`) sont
  des restes de boucle locale d'un banc antérieur. Une recette ne remet à zéro
  que les clés `connexion:` de la boucle locale, et rien d'autre
  (découverte nº 38).

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

  ⚠️  **NE PAS attendre une durée après `Page.loadEventFired`** — ce fichier
  conseillait « ~600 ms », c'est-à-dire exactement ce que la découverte nº 33
  interdit. Attendre la MARQUE de React sur le DOM
  (`Object.keys(el).some(k => k.startsWith('__reactFiber'))`), et lever une
  erreur nommée si elle n'apparaît pas : une page non hydratée est un document
  MORT sur lequel aucun clic n'a d'effet, et le symptôme ressemble trait pour
  trait à un composant défectueux (découverte nº 48).
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
- **Vérifier l'espace disque AVANT de commencer** (découverte nº 35) et **le
  port AVANT de lancer `next start`** (découverte nº 34). Les deux ont coûté du
  temps au Lot 8C, et aucun des deux ne ressemble à ce qu'il est.
- **Attendre une condition, jamais une durée** (découverte nº 33) : une pause
  calibrée sur une exécution réussie échoue sur la suivante.
- **Et vérifier que l'action a PRIS** (découverte nº 37) : une valeur saisie
  avant l'hydratation de React est effacée sans bruit. Relire le champ, et
  recommencer tant que la valeur n'a pas tenu.
- **Un rôle, un contexte de navigation** (découverte nº 36) : deux onglets d'un
  même profil Chrome partagent leurs cookies. `Target.createBrowserContext`
  avant toute seconde session.
- **Purger à l'ENTRÉE, pas seulement à la sortie** (découverte nº 40) : une
  exécution interrompue lègue ses lignes et ses comptes à la suivante, qui les
  prend pour l'état initial. Et déduire les comptes attendus de l'état mesuré,
  jamais d'un nombre écrit en dur.
- **Remettre à zéro le compteur `connexion` de la boucle locale**
  (découverte nº 38) : 5 tentatives par quart d'heure, et une suite à deux
  sessions atteint la limite au troisième passage. Jamais les clés d'une
  adresse réelle.
- **Dimensionner la fenêtre AVANT de chercher une ligne de tableau**
  (découverte nº 41) : Chrome headless démarre en 800 × 600, et le
  `<DataTable>` rend des CARTES sous 1024 px. `tbody tr` n'y trouve rien, et
  l'échec ressemble à « les données ne sont pas arrivées ».
- **Attendre les LIGNES, pas le titre de la page** : le `<DataTable>` rend un
  squelette côté serveur ; `innerText` lu trop tôt ne contient aucune donnée.
- **Borner présence et ordre à la SECTION mesurée** (découvertes nº 42 et 43) :
  un titre de contenu est souvent un mot courant, et `indexOf` sur une page
  entière trouve la mauvaise occurrence. Une mesure de périmètre qui déborde de
  son périmètre impute à un lot les défauts de ses prédécesseurs.
- **Corriger l'assertion quand elle mesure la mauvaise chose ; corriger le CODE
  quand elle mesure la bonne** (découverte nº 44). Ne jamais assouplir une règle
  pour excuser ce qu'on vient d'écrire.
- **Le contenu d'un accordéon Radix FERMÉ n'est pas dans le HTML servi**
  (découverte nº 45) : jumeau de la découverte nº 32 pour le `<DataTable>`. Une
  assertion sur le texte d'une réponse appartient à la suite navigateur, après
  ouverture du panneau.
- **Envelopper les sondes CDP dans une IIFE `async`** (découverte nº 46), sans
  quoi toute sonde qui `await` lève une erreur de syntaxe.
- **Attendre la MUTATION, pas la capture** (découverte nº 47) : un patch de
  `window.fetch` rend la main quand la requête PART. Enchaîner tout de suite
  court contre la mutation en cours.
- **Purger le journal d'audit en fin de recette**, par `actor_id` : les Lots 8F
  et 8G l'ont fait et `audit_logs` n'a pas bougé d'une ligne.
- **REBÂTIR ET REDÉMARRER `next start` avant toute suite navigateur**
  (découverte nº 48) : un serveur périmé sert des chunks JS désaccordés du HTML,
  React abandonne l'hydratation EN SILENCE, et tout clic devient sans effet.
  Tuer le processus **par son port** (`Get-NetTCPConnection -LocalPort 3210 |
  Stop-Process`) — un `taskkill` sur `node.exe` ne l'attrape pas et laisse
  l'ancien serveur en place, ce qui produit exactement cette panne.
- **Une cible tactile ne se mesure pas avec `getBoundingClientRect()`**
  (découverte nº 49) : pseudo-élément `::after` de `CIBLE_44`, `<input>`
  `sr-only` délégant à son `<label>`, champs fantômes de Radix. Trois pièges,
  26 fausses fautes par écran si la sonde est naïve.
- **La règle des 16 px ne vaut que SOUS `md:`** (découverte nº 50), et
  seulement sur les champs de SAISIE. Une sonde qui l'applique partout invente
  une règle et condamne tous les écrans déjà recettés.
- **Une sonde CDP ne doit contenir aucun accent grave** : elle vit dans un
  littéral gabarit TypeScript, qu'un accent grave referme. Deux compilations
  ont été perdues sur des commentaires qui citaient du code.
- **Ce que Radix ne monte pas, le HTML ne le contient pas** (découverte nº 52,
  après les nº 32 et 45) : les options d'un `<Select>`, les lignes d'un
  `<DataTable>`, les réponses d'un accordéon fermé. La suite HTTP peut vérifier
  qu'elles sont SÉRIALISÉES dans la charge utile ; leur affichage appartient à
  la suite navigateur.
- **Choisir une capture de Server Action par son CONTENU, pas par son rang**
  (découverte nº 54) : sur un écran qui LIT par Server Action, la première
  capture est une lecture, et son rejeu réussit légitimement.
- **Un thème se règle là où l'application le lit** (découverte nº 55) :
  `localStorage`, puis rechargement, puis vérification que la classe a TENU
  pendant la mesure. Une classe posée à la main est reprise par `next-themes`
  en cours de route et compose un état qui n'existe pas.
- **Une sonde qui mesure ZÉRO doit échouer** (découverte nº 56). Exiger
  `mesures > 0`, et vérifier qu'une donnée existe avant d'assertionner dessus :
  `undefined !== null` vaut `true`.
- **Borner un clic à son conteneur** (découverte nº 57) : « Ajouter » trouve
  « Ajouter une photo » ailleurs sur la page. Comparer le texte de façon EXACTE
  dès qu'un libellé plus long peut contenir le sien.
- **Le banc de recette est TYPE-CHECKÉ par `next build`** : `tsconfig.json`
  inclut `**/*.ts`. Un fichier de recette qui ne compile pas fait échouer le
  build du projet — c'est une contrainte utile (le banc ne peut pas mentir sur
  ses types), mais elle surprend. Le banc doit être retiré AVANT la
  vérification finale.
- **Le banc n'est pas linté** : `npx eslint .` signale ses `require()` tant
  qu'il est présent. Vérifier `npx eslint src` pendant le lot, et `npx eslint .`
  une fois le banc supprimé.
- **Un clic de recette se fait par `Input.dispatchMouseEvent`, pas par
  `element.click()`** (découverte nº 58) : le `DropdownMenu` de Radix s'ouvre sur
  `pointerdown` et ignore un `click()` synthétique, là où le `Select` y réagit.
  Deux composants de la même bibliothèque, deux comportements.
- **Le harnais REND son code de sortie, il ne l'exécute pas** (découverte
  nº 59) : `process.exit()` appelé dans un `try` saute le `finally`, donc la
  purge. Une suite en échec laisse alors ses comptes derrière elle, proprement
  et sans bruit.
- **Rendre les POSITIONS, pas seulement les lignes** (découverte nº 60) :
  relever l'ordre à l'entrée, `reorder_rows` à la sortie. Une suite qui exerce
  « Monter » réordonne la table ENTIÈRE, donc les données de l'utilisateur.
- **Retirer les commentaires avant de sonder du code source** (découverte
  nº 62) : les fichiers de ce projet citent l'anti-patron qu'ils évitent, et une
  recherche brute le trouve.
- **Borner une mesure de HTML à sa section** (découverte nº 63) : la charge
  utile RSC répète en bas de page chaque texte rendu ; un `match(...).length`
  non borné compte double.
- **⚠️ ENCHAÎNER LES SUITES AVANT DE CONCLURE.** Trois défauts du banc du
  Lot 8I (nº 59, nº 60, nº 61) étaient invisibles suite par suite et n'ont
  paru qu'à l'exécution consécutive sur l'arbre final. La règle 1 dit « on
  exécute et on montre la sortie » ; il faut lire : **on exécute tout, à la
  suite, une dernière fois.**

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

### Écarts du Lot 8D

| # | Écart | Raison |
|---|---|---|
| 91 | **La garde du lot porte sur le MARQUEUR, pas sur un champ vide** | Le seed a écrit `name = '[À COMPLÉTER]'` dans les trois lignes de `team_members` — la valeur de `TODO` (`site-config.ts`), reprise telle quelle du tableau TypeScript où « aucun nom n'est inventé ». Publier une fiche ainsi mettrait ce marqueur en toutes lettres à l'endroit d'un nom de dirigeant, sur la page dont l'audit (§4.9) dit qu'elle est un signal de confiance pour un donateur : ce serait **publier un gabarit comme s'il s'agissait d'un contenu** (invariant nº 1). `setTeamMemberStatus` refuse donc la mise en ligne tant que le nom est un marqueur — **aucun rôle n'y échappe**. Les deux autres issues étaient exclues : inventer un nom (invariant nº 1), ou afficher une carte sans nom (que le visiteur prendrait pour une panne). |
| 92 | **`estNomAFournir()` vit dans le DOMAINE, et duplique `TODO`** | La reconnaissance est écrite une seule fois, dans l'entité `TeamMember`, plutôt que recopiée dans un cas d'usage et dans trois composants. `src/lib/site-config.ts` n'est PAS importé : `src/core/` est un domaine pur, et `site-config` est de la configuration d'application. **La duplication de la chaîne est assumée, et la recette (A01/A02) vérifie que les deux valeurs coïncident encore.** La comparaison porte sur la chaîne ENTIÈRE, en majuscules et sans espaces de bord — pas une sous-chaîne : « Todorov » contient « TODO » et est un nom réel (mesuré, A09/A10). |
| 93 | **La garde est à la PUBLICATION, doublée d'une porte de derrière fermée** | Même partage qu'à l'écart nº 81 : interdire le marqueur À LA SAISIE rendrait les trois fiches du seed impossibles à enregistrer — ouvrir la fiche de la direction pour y déposer une photo échouerait sur un champ qu'on n'a pas touché. Un brouillon a le droit d'être incomplet. En contrepartie, `updateTeamMember` **refuse de remettre le marqueur sur une fiche EN LIGNE**, avec le message qui dit de dépublier d'abord. Sur un brouillon, c'est permis : c'est la façon honnête de dire « ce nom était provisoire ». |
| 94 | **`status` est ABSENT de `createTeamMemberSchema`** | Même raisonnement qu'à l'écart nº 83, transposé : sans cela, un administrateur — qui passe `guard_publish` — pourrait créer une fiche déjà en ligne sans jamais traverser `setTeamMemberStatus`. `createTeamMember` écrit `'draft'` **en dur**. |
| 95 | **La section « L'équipe » de `/a-propos` DISPARAÎT, et c'est l'état d'aujourd'hui** | Les trois fiches sont en brouillon (seed du Lot 1) : la lecture publique rend une liste vide, et la section entière est masquée — même règle qu'à l'accueil pour les témoignages et les actualités. **Ce qui disparaît avec elle, ce sont trois cartes portant « [À COMPLÉTER] » et le badge « Nom et photo à fournir » : un aveu d'incomplétude adressé aux VISITEURS.** Ce rappel n'est pas supprimé, il change de destinataire — il est en tête de `/dashboard/equipe`, où quelqu'un peut agir. **Marche à suivre pour le rétablir : renseigner les trois noms, puis publier les fiches.** |
| 96 | **Le badge `PlaceholderBadge` n'est pas réintroduit** | `team_members` n'a pas de colonne équivalente à `articles.is_placeholder`. Contrairement au Lot 8C — où les trois témoignages portaient `placeholder: false` et où le badge n'était rendu nulle part — les trois fiches d'équipe portaient `placeholder: true` : le badge **était** affiché. Il n'est pas remplacé parce qu'il n'aurait plus de sujet : une carte ne peut plus atteindre `/a-propos` en portant un gabarit (écarts nº 91 et 93). Le laisser dans le code serait la trace d'un état devenu impossible. |
| 97 | **AUCUN repli vers `/public` pour les photos — l'écart nº 85 se rejoue** | `membrePhoto(id)` suit `equipe-<id>.jpeg` où `<id>` est l'identifiant du tableau TypeScript (« direction », « programmes », « terrain »). En base c'est un UUID, et aucune colonne ne peut le remplacer : `position` change au réordonnancement, `name` vaut « [À COMPLÉTER] » sur les trois lignes. **Les trois fichiers restent dans `public/images/a-propos/`** ; pour les réutiliser : les téléverser dans la médiathèque, puis les choisir dans le champ « Photo ». Aucune régression visible aujourd'hui, puisque la section entière est masquée (écart nº 95). |
| 98 | **« Voir sur le site » EXISTE ici, contrairement au Lot 8C** | L'écart nº 86 l'avait écarté parce qu'un témoignage n'apparaît sur l'accueil que s'il fait partie des trois premiers publiés. `/a-propos` affiche **tous** les membres publiés : si la fiche est en ligne, elle y est. Le lien n'est donc rendu **que sur une fiche publiée** — sur un brouillon il promettrait une page où elle ne figure pas — et il pointe vers `/a-propos#equipe`, ancre que la page ne rend elle aussi que lorsque la section existe. Mesuré des deux côtés (D11, E04). |
| 99 | **Messages français jusqu'au niveau de l'OBJET** | Prolongement de l'écart nº 90, trouvé par la recette de ce lot (C02–C06 et suivantes) : les messages de champ ne servent à rien si la charge utile n'est pas un objet. `schema.safeParse("bonjour")`, `safeParse(null)`, `safeParse([])` rendaient « Invalid input: expected object, received string ». Chaque `z.object` de `team-member.schema.ts` porte donc un `{ message: "…" }` en second argument, **et le message se propage aux schémas dérivés** (`.omit()`, `.extend()`, `.partial()`) — vérifié sur les sept schémas × dix charges hostiles. ⚠️ **Ce trou existe encore dans `programme.schema.ts`, `article.schema.ts` et `testimonial.schema.ts`. À traiter au Lot 16, avec l'écart nº 90.** |
| 100 | **Le titre d'onglet d'une fiche au marqueur affiche la FONCTION** | `generateMetadata` rend `Fiche : Coordination des programmes` plutôt que `[À COMPLÉTER]`. Avec plusieurs onglets ouverts, trois d'entre eux porteraient un libellé identique et seraient impossibles à distinguer ; la fonction est la seule information que ces fiches portent réellement. |

### Écarts du Lot 8E

| # | Écart | Raison |
|---|---|---|
| 101 | **La liste des noms d'icônes DESCEND dans le domaine** (`src/core/cms/entities/icon-name.ts`) | Elle vivait dans `src/components/ui-ext/icon-registry.ts`, mêlée aux composants React. Le domaine n'ayant pas le droit d'importer `@/components`, **aucun schéma ne pouvait vérifier qu'un nom d'icône en était un**. Résolution identique à celle de `MediaTone` au Lot 6 : le type descend — c'est une donnée du contenu, pas une notion de rendu — et la présentation le ré-exporte, de sorte qu'aucun import existant n'est cassé. `ICONS` est déclaré `Record<IconName, LucideIcon>` : **c'est ce typage, pas un commentaire, qui interdit aux deux fichiers de diverger** (ajouter un nom sans son composant casse la compilation). Vérifié en recette (A08–A13), y compris que `icon-name.ts` n'a aucun `import`. |
| 102 | **`icon` est enfin un `z.enum` — et `programme.schema.ts` ne l'est TOUJOURS pas** | Mesuré, pas supposé (suite 2, E05) : **la base n'a aucune contrainte sur `icon`**, une ligne portant `icon = 'CeciNEstPasUneIcone'` s'insère sans erreur. Or `programme.schema.ts` (Lot 8A) valide par `z.string().trim().min(1)` : n'importe quelle chaîne passe, est écrite, et la page publique rend l'étoile de repli **sans que rien ne le signale** — donnée fausse, rendu plausible. `tone`, juste à côté, était un `z.enum` depuis le Lot 8A : la seule cause de l'asymétrie était l'étage où vivait la liste. `core-value.schema.ts` utilise donc `z.enum(ICON_NAMES)`. ⚠️ **`programme.schema.ts` peut et doit être resserré de la même façon — au Lot 16**, avec les écarts nº 90 et 99 : corriger le schéma d'un lot livré sans rejouer sa recette ne prouverait rien. |
| 103 | **Première collection SANS cycle éditorial** — `is_visible`, pas `status` | `core_values` ne porte pas de colonne `status` (migration 0005) et la matrice ne contient **aucune** entrée `value:publish`, pour aucun rôle. Toute la chaîne suit : `setVisibility` au lieu de `setStatus`, `findVisible` au lieu de `findPublished`, `<VisibilityBadge>` (2 états) au lieu de `<StatusBadge>` (4), et **pas de `guard_publish` (ADB01) à redouter** puisque le trigger ne couvre que les tables à `status`. C'est la seule barrière **en moins** de ce lot, et elle explique l'écart nº 104. Ce que ce choix dit, et qui est juste : **il n'y a pas de brouillon d'un principe.** |
| 104 | **⚠️ UN ÉDITEUR PEUT RETIRER UNE VALEUR DE DEUX PAGES PUBLIQUES** | Afficher ou masquer relève de `value:update`, que l'éditeur possède — `value:publish` n'existe pas. Il ne peut dépublier ni programme, ni article, ni fiche d'équipe, mais il peut faire disparaître une valeur de l'accueil ET de « Qui sommes-nous ». **Ce n'est pas une faute d'implémentation** : la matrice (§9 du Rapport 1) et la RLS (`core_values_staff_update`, migration 0009) le disent indépendamment l'une de l'autre, et la recette le MESURE (suite 2, D08) plutôt que de le supposer. Le raisonnement derrière est défendable — une liste structurante se corrige, elle ne se soumet pas à relecture — mais l'écart de pouvoir méritait d'être écrit plutôt que découvert. **Le corriger serait une décision de produit**, touchant la matrice ET une migration : hors périmètre d'un lot de collection. |
| 105 | **`value:create` et `value:delete` sont RÉSERVÉS aux administrateurs** | Première collection du Lot 8 où un éditeur ne peut pas créer. Là encore la matrice et la RLS concordent (`core_values_admin_insert/delete` exigent `app_can_publish()`). Le bouton « Nouvelle valeur » n'est pas rendu, **et le motif est écrit à l'écran** : une commande absente sans explication passe pour une panne (§12). Nuance mesurée au passage (suite 2, D04b) : **une INSERTION refusée est REJETÉE (42501), pas filtrée**, contrairement à `update`/`delete` — sa politique n'a qu'un `WITH CHECK`, il n'y a aucune ligne à filtrer. La règle « la RLS filtre, elle ne rejette pas » (découverte nº 1) vaut donc pour les mises à jour et les suppressions, **pas pour les créations**. Les deux protections du dépôt — code d'erreur et comptage de lignes — sont ainsi non redondantes. |
| 106 | **Masquer la DERNIÈRE valeur visible est AUTORISÉ** | La tentation était de refuser, comme `setTeamMemberStatus` refuse un marqueur. Trois raisons de ne pas le faire : (a) l'état interdit du Lot 8D était **faux** (un gabarit affiché comme un contenu), celui-ci n'est que **vide** — et une section vide qui disparaît est le comportement établi depuis le Lot 8B ; (b) ce serait inventer une contrainte que ni la base ni le métier ne portent (le §8E dit « 4 par défaut », pas « 4 au minimum ») ; (c) le geste est **trivialement réversible**, contrairement à une suppression. Ce qui est fait à la place : le bandeau dit ce que **les deux pages** affichent, une confirmation nomme la conséquence quand c'est la dernière, et la fiche l'écrit avant le clic. **Informer plutôt qu'interdire.** |
| 107 | **Le titre « Quatre principes » de `/a-propos` est désormais DÉRIVÉ du décompte** | Défaut trouvé en écrivant le lot, et réel : le titre était écrit en dur. C'était vrai tant que la liste vivait dans un fichier TypeScript modifié dans le même commit ; **elle devient modifiable depuis le dashboard, et le titre devient une affirmation que la page n'a plus aucun moyen de tenir.** Ajouter une cinquième valeur ou en masquer une laissait la page annoncer « Quatre » au-dessus d'une grille qui en comptait trois ou cinq — l'invariant nº 1 dans sa forme la plus discrète. `src/lib/nombres.ts` (`enLettres`, `accorde`) le dérive ; avec les quatre valeurs migrées le rendu est identique **au caractère près** (recette K01, B04), et il suit le décompte (mesuré à 3 et à 5 : B05, D14). ⚠️ **`/programmes` annonce « Huit domaines d'intervention » et l'accueil « Voir les 8 programmes »** — même défaut, depuis le Lot 8A. Consigné, **non corrigé** : les toucher exigerait de rejouer la recette du Lot 8A. |
| 108 | **`isVisible` est ABSENT du schéma de FORMULAIRE, mais PRÉSENT à la création** | L'inverse exact des écarts nº 83/94, et pour une raison symétrique. **Absent du formulaire** : retirer une valeur du site est une décision, pas une saisie — une case au milieu de quatre champs de texte se coche par distraction, et celle-là retirerait la valeur de deux pages publiques en même temps qu'une correction d'orthographe. **Présent à la création, avec `true` par défaut** : il n'y a aucune garde à forcer ici (pas de `value:publish`), et la base écrit `is_visible = true` par défaut ; le retirer aurait imposé deux gestes pour l'usage normal sans rien protéger. Une valeur naît donc VISIBLE, et l'écran le dit. |
| 109 | **`ListFilter.status` est IGNORÉ par ce dépôt, jamais transformé en liste vide** | Le champ appartient au vocabulaire commun des listes, hérité des quatre collections à cycle éditorial. Le transmettre à PostgREST produirait « column core_values.status does not exist ». Il est donc ignoré et la liste **entière** est renvoyée — choix écrit plutôt que subi, et vérifié des deux côtés (suite 1, H07 ; suite 2, F05/F06), **y compris sur le dépôt en mémoire**, qui doit se comporter comme le vrai jusque dans ce qu'il ne fait pas. Renvoyer zéro ligne aurait été bien pire : **un écran vide ne se distingue pas d'une collection vide.** |
| 110 | **Le mapper replie une icône inconnue sur `Sparkles`, il ne lève pas** | La colonne est `text not null` : la base accepte n'importe quoi (mesuré, E05). Lever aurait fait tomber l'accueil ET « Qui sommes-nous » sur leur frontière d'erreur à cause d'un caractère de trop dans un champ décoratif. Le repli ne masque rien d'important — `<ContentIcon>` fait déjà le même choix au rendu depuis le Lot 8A, et l'icône n'est jamais porteuse d'information. ⚠️ **Il ne « nettoie » pas la base** : la ligne garde sa valeur invalide. Ce qui empêche vraiment une icône inconnue d'entrer, c'est le `z.enum` en amont. Le repli est la ceinture, le schéma est le harnais. |
| 111 | **`src/content/biographie.ts` a suivi la convention d'icône** | `<ValueCard>` sert deux collections sans rapport : les valeurs (désormais en base) et les quatre « domaines d'engagement » de `/biographie`, qui restent dans `src/content/` — ils décrivent le parcours d'une personne et ne figurent dans aucun lot du CMS. La carte ayant basculé sur les NOMS d'icônes, ces quatre entrées les suivent ; le rendu est identique (vérifié, suite 3, D03/D04). **`engagementsBiographie`, plus bas dans le même fichier, garde des composants** : cette liste ne passe pas par `<ValueCard>` et la convertir aurait été un changement sans nécessité. |
| 112 | **Les deux liens « Voir sur… » ont quitté l'en-tête de la fiche** | Défaut trouvé par la recette (suite 5, E) : quatre commandes dans l'en-tête faisaient **650 px de large**, et l'écran débordait horizontalement dès 640 px — c'est-à-dire **au zoom 200 %**, la situation où l'on a le plus besoin de lire. Ils sont descendus sur la ligne d'état, en phrase, à côté du badge de visibilité — ce ne sont pas des commandes, ils DISENT où la valeur apparaît. Seconde correction dans la foulée : rendus en liens de texte, ils mesuraient **56 × 17 et 122 × 17 px**. La tentation était d'inscrire dans le harnais l'exception WCAG 2.5.8 pour les liens « au sein d'une phrase » ; **se donner une dispense au moment où elle arrange le code qu'on vient d'écrire, c'est cesser de mesurer.** Ils portent donc `inline-flex min-h-11`. |

### Écarts du Lot 8F

| # | Écart | Raison |
|---|---|---|
| 113 | **⚠️ LE JSON-LD DÉCLARE DÉSORMAIS LA RÉPONSE ENTIÈRE, PUCES COMPRISES** | `faqJsonLd` recevait `answer` SEUL. Or `<FAQAccordion>` affiche le paragraphe **puis** les puces — et sur la première question du site, « Comment faire un don à ADEBES ? », les **quatre canaux de don sont dans les puces**. Le balisage envoyé aux moteurs annonçait donc une réponse qui n'en contenait aucun : une réponse tronquée présentée comme complète. Les consignes de Google sur `FAQPage` sont explicites — le contenu balisé doit être celui que le visiteur voit. `texteReponse()` (entité `FaqItem`) compose les deux, en texte simple, jamais en HTML. **Ce n'est pas un enrichissement mais une correction, et c'est ce lot qui la rend urgente** : les puces étaient jusqu'ici figées dans un fichier TypeScript relu à chaque commit ; elles deviennent saisissables, et rien n'empêchera — ni ne devrait empêcher — d'y mettre l'essentiel d'une réponse. Mesuré avant/après (suite 3, B07–B08 ; suite 4, E04). |
| 114 | **`<FAQAccordion>` : la clé passe de la QUESTION à l'IDENTIFIANT** | `key={item.question}` et `value={`faq-${index}`}`. **Le premier est un défaut réel** : deux questions du même sujet portant le même libellé produisaient une clé React DUPLIQUÉE, et React aurait réutilisé le mauvais panneau au dépliage. L'état était impossible tant que la liste vivait dans un fichier relu à chaque commit ; il devient atteignable depuis un dashboard. Le second l'était aussi, autrement : un index rouvre le mauvais panneau après un réordonnancement. **C'est le motif récurrent du Lot 8 — la bascule en base ne casse pas les données, elle rend atteignables des états que le fichier TypeScript rendait impossibles.** |
| 115 | **Un doublon de question est SIGNALÉ, jamais interdit** | Ni la base ni le métier ne portent d'unicité, et deux sujets différents peuvent légitimement poser la même question (« Comment nous contacter ? » a sa place dans les deux FAQ) — inventer une contrainte est précisément la faute que le Lot 8D a refusé de commettre. Mais **deux questions identiques dans le MÊME sujet** produisent deux entrées identiques dans le même `FAQPage` et deux panneaux jumeaux dans l'accordéon. L'écran de liste les compte en tête de page et marque **les deux lignes** concernées — pas seulement la seconde, qui n'est pas plus fautive que la première. Informer plutôt qu'interdire (Lot 8E), quand l'état est réversible d'un clic. |
| 116 | **`topic` est la PREMIÈRE liste de référence doublée par une contrainte SQL** | Différence mesurée avec l'écart nº 102 : `core_values.icon` est un `text` LIBRE et accepte n'importe quoi (revérifié en suite 2, C03) ; `faq_items.topic` porte `check (topic in ('don','benevolat','general'))` et refuse par **23514** (C01–C02). Il y a donc **deux barrières indépendantes**, et non une seule. Le schéma reste indispensable : sans lui, un sujet invalide traverserait toute la chaîne pour échouer sur « violates check constraint "faq_items_topic_check" » — exact, illisible, et affiché à quelqu'un qui n'écrira jamais de SQL. **Le repli du mapper vers « general » est donc une conséquence du TYPAGE généré, pas une défense contre un cas atteignable** — `database.types.ts` déclare `topic: string`, le générateur ne lisant pas les contraintes `check`. La recette vérifie que les deux colonnes ne se comportent PAS pareil, plutôt que de le supposer. |
| 117 | **QUATRE étiquettes de cache — le plus grand nombre du projet — et invalidation LARGE assumée** | `cms:faq`, `cms:page:accueil`, `cms:page:don`, `cms:page:benevolat`. Les deux dernières sont NOUVELLES. Les quatre sont invalidées à chaque mutation, y compris quand la question touchée n'appartient qu'à un sujet, et c'est délibéré : `updateFaqItem` peut CHANGER le sujet (il faudrait alors lire l'ancienne valeur avant d'écrire, uniquement pour économiser une invalidation), une question de don peut figurer sur l'accueil selon sa position, et un simple **réordonnancement** change ce que l'accueil affiche sans toucher au moindre sujet. **Invalider large est ici la seule forme CORRECTE** ; invalider fin aurait exigé de raisonner juste à chaque appel, et l'erreur — une page qui garde une réponse périmée — serait invisible depuis le dashboard. |
| 118 | **AUCUNE garde propre au lot, et c'est un constat, pas un oubli** | Les Lots 8C et 8D en portaient une parce qu'un état FAUX était atteignable : une citation sans accord, un marqueur affiché à la place d'un nom. Rien de tel ici — les sept questions du seed sont complètes, vraies, déjà en ligne, et aucune ne porte de gabarit. `setFaqItemStatus` se limite donc à exiger une question ET une réponse non vides (le schéma le fait déjà à la saisie ; ce cas d'usage est la dernière barrière avant la mise en ligne, atteignable par un import ou une écriture directe). **Chercher une garde à tout prix aurait conduit à en inventer une** — refuser une question qui ne finit pas par « ? », par exemple, ce qui empêcherait de publier « Où intervenons-nous au Cameroun » pour un signe de ponctuation. |
| 119 | **`bullets` est la PREMIÈRE liste facultative du projet** | Les trois listes du Lot 8A (`actions`, `publics`, `besoins`) portent `.min(1)` : un programme sans action n'est pas un programme. Ici, **cinq des sept questions du site n'ont aucune puce** et se lisent parfaitement. Exiger au moins une ligne obligerait à en inventer une (invariant nº 1) ou à couper la réponse en deux pour satisfaire le formulaire. Le `<ListField>` du Lot 6 gérait déjà le cas — il rend « Aucune puce pour l'instant » et le libellé « (facultatif) » — mais **aucun écran livré ne l'avait encore exercé**. |
| 120 | **⚠️ UN ÉDITEUR PEUT RETIRER UNE QUESTION DE L'ACCUEIL SANS AVOIR `faq:publish`** | Par le RÉORDONNANCEMENT. L'accueil n'affiche que les quatre premières questions publiées hors bénévolat : remonter une question générale en fait mécaniquement disparaître une autre. `faq:reorder` est ouverte à l'éditeur (matrice §9, et `reorder_rows` n'exige que `app_is_staff()`). **C'est le jumeau de l'écart nº 104, en moins grave** : la question reste en ligne sur la page de son sujet, ce n'est pas une dépublication déguisée — sauf pour un sujet `general`, qui n'a pas de page à lui. Le mécanisme est identique à celui du Lot 8C pour les trois témoignages de l'accueil. Il est **consigné et signalé à l'écran** (colonne « Accueil », bandeau), pas corrigé : le corriger serait une décision de produit. |
| 121 | **Changer le SUJET déplace la question d'une page à l'autre, et c'est AUTORISÉ** | C'est le seul champ de cette collection dont la modification a un effet que l'éditeur ne voit pas sur l'écran où il travaille. La tentation était d'en faire une garde, sur le modèle des Lots 8C et 8D ; elle a été écartée parce que **aucun état n'est faux ici** — une question de bénévolat rangée dans « Dons » est une erreur de classement, qui se corrige précisément par cette modification. Refuser reviendrait à empêcher la correction. À la place, `<ConsequenceDuSujet>` ÉCRIT la conséquence sous le champ et, sur une question existante, **nomme le déplacement** : « elle quittera la page X ». Mesuré des deux côtés (suite 4, F01–F04). |
| 122 | **Deux liens en ligne corrigés DANS le périmètre du lot** | Trouvés par la sonde de cibles bornée à la section `#faq` : « Écrivez-nous » (accueil) à **89 × 17 px** et « Devenez bénévole » (`/don`) à **123 × 17 px**. Ils sont dans la section que ce lot livre, et l'écart nº 112 s'applique mot pour mot : la règle 4 du §12 ne connaît pas d'exception pour un lien « au sein d'une phrase ». Ils portent désormais `inline-flex min-h-11`. Le relevé hors périmètre est passé de 13 à 12 cibles sur l'accueil et de 6 à 5 sur `/don` — les deux corrigées, et rien d'autre touché. |
| 123 | **Trois ancres `id="faq"` ajoutées, et trois sections rendues conditionnelles** | Les ancres sont exigées par les liens « Voir sur le site » de la fiche (sans elles, le lien mène en haut de page). La condition suit la règle établie depuis le Lot 8B : une section vide disparaît plutôt que d'annoncer un contenu absent. **Elle compte doublement ici** — sans elle, la page émettrait un `FAQPage` **VIDE**, c'est-à-dire une déclaration fausse envoyée aux moteurs. C'est la raison pour laquelle le bloc JSON-LD lui-même est conditionnel, et pas seulement l'accordéon (suite 3, H03). |

### Écarts du Lot 8G

| # | Écart | Raison |
|---|---|---|
| 124 | **`stats.key` est DÉRIVÉ du libellé, IMMUABLE, et jamais saisi** | La colonne est `not null unique` et il fallait bien la remplir. Trois voies étaient ouvertes : un champ de formulaire (rejeté — un slug est une ADRESSE que quelqu'un a de bonnes raisons de choisir, une clé de chiffre n'apparaît NULLE PART, ni sur le site ni dans une URL : demander de la saisir, c'est demander de décider d'une chose invisible) ; un identifiant opaque (rejeté — `id` fait déjà ce travail) ; **dérivée du libellé par `slugify`**, ce qui est fait. `updateStat` la neutralise comme il neutralise `isVisible` : une clé qui suivrait les reformulations du libellé ne serait pas un identifiant stable. **Le typage l'impose plutôt que le commentaire** : `CreateStat` (sans `key`) est le contrat de l'appelant, `CreateStatRow` (avec) celui du dépôt, et `createStat` est le seul pont — une Server Action ne peut pas écrire une clé arbitraire, même par POST direct. La clé est AFFICHÉE en lecture seule sur la fiche : cacher une donnée qui existe est une surprise pour qui ouvre la base un jour, et le Lot 9 en aura besoin pour désigner un chiffre depuis un bloc. |
| 125 | **`to_confirm` N'A AUCUN EFFET SUR LE SITE PUBLIC** | Le §8G le range parmi les spécificités du lot, et la tentation était d'en faire une mention visible. Trois raisons de ne pas le faire. (a) **Parité** : la recette des lots 8x exige un rendu « identique à l'actuel », et aujourd'hui `projets` et `annees` portent `toConfirm: true` sans que le site n'affiche quoi que ce soit. (b) **Le signal public existe déjà, et c'est la `note`** — « Valeur affichée sur l'ancien site — à revalider » est rendue sous la carte sur `/impact`, page dont le sous-titre promet que « les chiffres en attente de consolidation sont signalés ». (c) **Le destinataire n'est pas le même** : un visiteur ne peut rien faire d'un « à revalider », alors que le dashboard, lui, peut agir — l'écran de liste les compte en tête de page et marque chaque ligne. C'est le raisonnement de l'écart nº 95, transposé. Mesuré des deux côtés (suite 4, C51–C52). |
| 126 | **⚠️ CORRECTIF DANS `NumberField` (Lot 6) : DÉCOCHER NE REMET PLUS `0`** | Le champ `kind: "number"` et sa case « pas encore disponible » existaient depuis le Lot 6 et **n'avaient jamais eu d'appelant**. L'exercer a révélé un défaut réel : `onCheckedChange={(coche) => field.onChange(coche === true ? null : 0)}`. Décocher écrivait `0` — il suffisait d'enregistrer sans rien taper de plus pour publier un zéro que personne n'avait décidé, **dans le geste même qui annule la case censée l'empêcher**. Décocher laisse désormais le champ VIDE, et le schéma nomme les deux issues honnêtes. ⚠️ **La première version du correctif ne fonctionnait PAS** (`field.onChange(undefined)`, ravalé par react-hook-form — découverte nº 51) : la recette navigateur l'a montrée avant qu'elle n'atteigne quiconque. Corollaire : `inconnu = value === null \|\| value === undefined` laissait la case cochée sur un champ simplement vidé ; le test porte désormais sur `null` SEUL. |
| 127 | **TROIS états à l'écran là où la donnée n'en a que deux** | Conséquence directe de l'écart nº 126 : le champ porte « vide, pas encore déclaré indisponible », que la base ne connaît pas et que le formulaire refuse à l'enregistrement. L'aperçu le DIT (« Champ vide : saisissez un chiffre, ou cochez… ») plutôt que de montrer une carte que rien ne permet d'obtenir. Le test est `typeof === "number"` et jamais un `??` : **`0` est falsy**, et le confondre avec l'absence est exactement la faute que ce lot existe pour empêcher. |
| 128 | **La collision refusée est celle de la CLÉ, pas du libellé** | Trouvé par la recette (suite 1, D08), et le message du cas d'usage décrivait une condition qui n'était pas celle testée. **Les quatre clés du seed ne sont PAS dérivées de leurs libellés** — « projets » pour « Projets menés » : elles viennent du tableau TypeScript où elles étaient écrites à la main (mesuré, D60–D63). Deux libellés qui ne diffèrent que par un accent, une majuscule ou une ponctuation produisent la même clé et sont refusés, **avec un message qui NOMME le chiffre occupant la place** — sans quoi on lirait « déjà pris » devant une liste où aucun libellé ne ressemble au sien. Un libellé RÉELLEMENT en double avec une clé différente reste possible : il est **signalé sur les deux lignes** et compté au bandeau, jamais interdit (doctrine de l'écart nº 115 — ni la base ni le métier ne portent d'unicité sur le libellé). |
| 129 | **`.max(2 147 483 647)` sur `value`, et `.min(0)`** | La colonne est `integer` : sans borne, un chiffre à onze positions traverse toute la chaîne pour échouer sur « value out of range for type integer » — mesuré, **22003** (suite 2, B04). `.min(0)` n'est pas une contrainte inventée : ces cartes comptent des bénéficiaires, des projets et des années, et « −30 » en gros caractères sur l'accueil est une donnée fausse. ⚠️ **La base, elle, accepte `-42` sans broncher** (B05) : le schéma est la SEULE barrière, comme pour `icon` (écart nº 102, revérifié sur cette table en B06). `0` reste accepté — un chiffre réellement nul se dit, et c'est bien pour cela qu'il ne doit pas servir à dire « je ne sais pas ». |
| 130 | **⚠️ UN ÉDITEUR PEUT RETIRER UN CHIFFRE DE DEUX PAGES PUBLIQUES** | L'écart nº 104 à l'identique, sur la seconde table qui porte `is_visible`. `stat:publish` n'existe pas ; afficher ou masquer relève de `stat:update`. Matrice et RLS (`stats_staff_update`) le disent indépendamment l'une de l'autre, et la recette le MESURE (suite 2, C12–C13 ; suite 4, E10). **Nuance propre à cette collection, et il faut la dire sans en faire un argument d'interdire** : masquer n'est PAS le geste honnête pour un chiffre devenu douteux — celui-là est « cocher pas encore disponible », qui garde la carte avec « — ». Masquer retire la carte et laisse croire que l'association ne suit plus l'indicateur. Les deux gestes existent, ils ne disent pas la même chose, et l'écran l'écrit — aide du champ, confirmation, fiche. |
| 131 | **`/impact` passe en `force-dynamic` — c'est la première page ENTIÈREMENT statique que le CMS convertit** | Toutes les pages basculées jusqu'ici lisaient déjà la base par ailleurs. `/impact` ne lisait que `src/content/`. Sans la directive, elle serait prérendue au build et corriger le nombre de bénéficiaires laisserait l'ancienne valeur **sur la page qui promet la transparence**, jusqu'au prochain déploiement. L'étiquette `cms:page:impact` est également nouvelle. À retirer au Lot 15 avec les autres. |
| 132 | **La recherche ne porte PAS sur le chiffre, des DEUX côtés** | `ilike` sur `label` et `note` seulement : chercher « 30 » ne trouve pas le chiffre 30 (mesuré en base, suite 2 D12, et au navigateur, suite 4 A32). `value::text ilike …` était possible et a été écarté — l'index deviendrait inutile, et « 30 » trouverait 130 et 300. **Le dépôt en mémoire porte la MÊME limite volontairement** : un dépôt de test plus généreux que le vrai valide des cas d'usage qui échoueront en production. |
| 133 | **Le tiret ne voyage jamais seul** | `VALEUR_ABSENTE` et `MENTION_VALEUR_ABSENTE` descendent dans le domaine, et **partout où « — » apparaît, la mention l'accompagne** : `title` sur la carte publique (rendu inchangé), texte en clair dans la colonne du tableau, phrase sur la fiche. Motif : un tiret seul dans une cellule passe pour une colonne vide, un défaut d'affichage ou un chargement en cours — trois lectures qui mènent toutes à « il faut remplir ça », c'est-à-dire à inventer un chiffre. Vérifié jusqu'à 320 px, en cartes comme en tableau (suite 5, B04–B05, D30–D31). |

### Écarts du Lot 8H

| # | Écart | Raison |
|---|---|---|
| 134 | **LES QUATRE PHOTOS ONT ÉTÉ MIGRÉES, PAS PONTÉES** | La question « pont vers `/public` ou non » ne se pose ni dans le sens des écarts nº 64 et 75 (on garde le fichier affiché), ni dans celui des nº 85 et 97 (on refuse, la convention de nommage étant indexée sur un identifiant disparu). **`gallery_items.media_id` est `not null`** : aucun élément de galerie ne peut exister sans un média catalogué, donc un pont n'aurait rien à ponter — il n'y aurait AUCUNE ligne à afficher. Les quatre photographies sont donc réellement entrées dans Storage puis dans `media_assets`, et rattachées à leur catégorie par un `gallery_items` publié. Le seed du Lot 1 l'annonçait mot pour mot : « ce qui est le travail du Lot 8H ». Trois choses sont reprises À L'IDENTIQUE pour tenir la parité exigée par le §8x : le texte alternatif que le site GÉNÉRAIT (`legendes.json` n'existe pas), la catégorie déduite du préfixe du fichier — la convention servant une dernière fois, pour se supprimer elle-même — et **l'ORDRE de la grille**, qui était un tri alphabétique du nom sans extension (communaute, education, environnement, sante) et non l'ordre des catégories. |
| 135 | **UN ÉLÉMENT DE GALERIE NE PORTE AUCUN TEXTE** | `gallery_items` a quatre colonnes : `media_id`, `category_id`, `position`, `status`. Ce qu'on lit à l'écran — la description — appartient au MÉDIA. C'est le sens de la phrase du §8H sur `legendes.json` : la légende suit la photo, pas sa place dans la grille, et une même photo employée deux fois ne peut pas se décrire de deux façons. Trois conséquences qu'aucune collection précédente n'avait : le formulaire n'a **aucun champ de texte** ; le titre de la fiche et le titre d'onglet viennent du média (repli sur le nom de fichier, puis « Photo de la galerie » — aucun de ces replis n'invente de contenu) ; et **la recherche porte sur un texte qui n'est pas dans la table** (voir l'écart nº 141). |
| 136 | **La garde de publication se réduit à la photo — et c'est un constat** | Les Lots 8C et 8D avaient une garde parce qu'un état FAUX était atteignable (citation sans accord, marqueur affiché comme un nom). Ici, le seul état invalide est « publié sans photo », que la base interdit déjà (`not null`) mais qu'un import atteindrait avec un message SQL. La tentation était d'exiger une CATÉGORIE avant publication : écartée pour trois raisons, dans l'ordre — l'état n'est pas faux mais **incomplet** ; ce serait inventer une contrainte que ni la base (`category_id` nullable) ni le §8H ne portent, faute que le Lot 8E a refusé de commettre (écart nº 106) ; et le geste est trivialement réversible. Ce qui est fait à la place : l'écran le DIT, à quatre endroits. |
| 137 | **Une photo sans catégorie reste VISIBLE, dans « Tous » seulement** | Le point « à trancher au début du lot ». Les deux autres voies ont été écartées : un bouton « Sans catégorie » sur la page publique **exposerait au visiteur une lacune de classement interne**, qui ne le regarde pas ; rendre la catégorie obligatoire au formulaire interdirait d'enregistrer un brouillon avant d'avoir décidé du classement. Doctrine des Lots 8E et 8F : **informer plutôt qu'interdire**. La colonne « Catégorie » écrit « Sans catégorie » suivi de « n'apparaît que dans « Tous » », le bandeau les compte, la fiche le redit, et l'aperçu du formulaire le MONTRE en faisant disparaître le bouton de filtre. Mesuré des deux côtés (suite 4, D05–D07). |
| 138 | **Les boutons de filtre ne montrent que les catégories EMPLOYÉES** | `gallery_categories_public_read` est `using (true)` : les quatre lignes sont lisibles même si aucune photo ne les emploie. Rendre un bouton par ligne donnerait un filtre menant à une grille VIDE — un cul-de-sac que le visiteur prend pour une panne, et le jumeau exact de la section vide que les Lots 8B à 8G font disparaître. La sélection vit dans le domaine (`categoriesAffichees`), pas dans la page : l'écran du dashboard doit pouvoir appliquer la même règle pour l'expliquer. ⚠️ **La parité est conservée et vérifiée, pas supposée** : les quatre catégories portent chacune une photo migrée, donc les quatre boutons sont rendus, comme aujourd'hui (suite 3, A07–A10 ; suite 4, E09–E10). |
| 139 | **Les catégories sont gérées dans une MODALE — écart nº 69 qui se rejoue** | Mêmes trois raisons qu'au Lot 8B : la navigation du §5.2 ne prévoit pas d'entrée « Catégories » et lui en ajouter une livrerait un écran inatteignable ; une catégorie porte trois informations (libellé, teinte, rang), sur lesquelles l'écran de liste du Lot 6 n'aurait rien à afficher ; on gère ses catégories EN CLASSANT une photo. **Différence avec le Lot 8B : la TEINTE se choisit ici**, `gallery_categories` portant une colonne que `article_categories` n'a pas — et c'est la couleur du bloc affiché à la place d'une photo qui ne charge pas. Le sélecteur est un `<select>` NATIF : la modale rend déjà une liste ordonnable dans un conteneur défilant, et y superposer le menu flottant de Radix empilerait trois portails pour cinq options figées. |
| 140 | **La création d'une catégorie exige `gallery:publish` — écart nº 70 qui se rejoue** | La RLS ouvre le renommage et le réordonnancement au personnel mais réserve l'ajout et la suppression à `app_can_publish()` (migration 0009), alors que la matrice du §9 ouvre `gallery:create` à l'éditeur. Les deux seules permissions dont les titulaires coïncident avec `app_can_publish()` sont `gallery:publish` et `gallery:delete` ; la seconde couvre la suppression, il ne reste que la première pour l'ajout. Le choix est **contraint**, exactement comme au Lot 8B, et l'alternative — inventer une ressource `gallery_category` — aurait ajouté six permissions au document d'audit qu'est le §9 pour une liste de quatre libellés. **Ce qui est recetté : l'interface n'affiche jamais un bouton que la base refusera** (suite 2, E13–E16 ; suite 4, E11–E14). |
| 141 | **La recherche porte sur un texte qui n'est PAS dans la table** | `gallery_items` n'a aucune colonne de texte : le dépôt IGNORE donc `filter.search`, et le dépôt en mémoire l'ignore aussi — il doit ressembler au vrai jusque dans ce qu'il ne fait pas (écarts nº 109 et 132). La recherche existe malgré tout, et elle est juste : la page enrichit chaque ligne du texte alternatif ET du nom de fichier de son média avant de la passer au `<DataTable>`, qui filtre en mémoire (écart nº 51). C'est le seul endroit de la chaîne où les deux informations sont réunies, et le type `LigneGalerie` le dit explicitement. La jointure PostgREST `media_assets!inner(alt_text)` était possible : écartée parce qu'elle aurait changé le type de la projection selon le filtre, donc obligé le mapper à connaître deux formes de ligne. |
| 142 | **AUCUN repli dans le mapper — et c'est une différence MESURÉE** | Les mappers des Lots 8E et 8F en portaient un : `core_values.icon` est un `text` LIBRE (tout passe), `faq_items.topic` est un `text` avec `check` que le générateur de types ne sait pas lire. `gallery_categories.tone` et `gallery_items.status` sont des **énumérés PostgreSQL**, que le générateur SAIT lire : `database.types.ts` les type exactement comme le domaine. Il n'y a donc rien à convertir, et un repli « par prudence » serait du code mort qu'aucune recette ne pourrait exercer. La recette le vérifie dans les deux sens : le code du mapper n'en contient aucun (suite 1, F11), et la base REFUSE une teinte hors liste par **22P02** (suite 2, C02–C03). |
| 143 | **`/galerie` passe en `force-dynamic` — SECONDE page entièrement statique convertie** | Après `/impact` au Lot 8G (écart nº 131). Cette page ne lisait rien de la base : sa grille venait d'un `fs.readdirSync` au BUILD. Sans la directive, ajouter une photo depuis le dashboard ne changerait rien jusqu'au prochain déploiement. L'étiquette `cms:page:galerie` est nouvelle. À retirer au Lot 15 avec les autres. |
| 144 | **DEUX étiquettes de cache seulement, et c'est l'usage réel** | `cms:galerie` et `cms:page:galerie`. Aucune autre page publique n'affiche la galerie — vérifié : la section `gallery-preview` de la page `galerie` est un squelette du seed, sans contenu, et le Lot 9 s'en chargera. `cms:media` n'est PAS invalidée : ces actions ne touchent jamais `media_assets` — un élément RÉFÉRENCE une photo, il ne la modifie pas. Le Lot 8F en avait quatre parce que trois pages lisaient la FAQ ; recopier un nombre plutôt que de suivre l'usage aurait été du gabarit. |
| 145 | **⚠️ CORRECTIF HORS PÉRIMÈTRE : `storage.ts` RE-ÉTIQUETTE le corps téléversé** | Découverte nº 53, et c'est un défaut RÉEL de la chaîne du Lot 7, trouvé parce que la migration de ce lot a été la première à téléverser depuis autre chose qu'un navigateur. `supabase-js` ignore `contentType` pour un `Blob` : un fichier sans extension était refusé avec un message qui invite à réessayer, et un fichier au type menteur était stocké avec un `Content-Type` que le catalogue contredit. Le corps porte désormais le type lu dans les OCTETS, par `blob.slice(0, size, type)` — sans recopier les données. Vérifié par un `HEAD` sur l'URL publique (suite 2, B03). |
| 146 | **⚠️ CORRECTIF HORS PÉRIMÈTRE : « Photo nº position + 1 » dans les usages d'un média** | `media.repository.ts` (Lot 7) libellait un usage de galerie `Photo nº ${position + 1}`. Les positions de ce projet sont numérotées **à partir de 1** — le seed écrit 1..N, `reorder_rows` renumérote de 1 à N, les cas d'usage calculent `count() + 1`. La première ligne s'annonçait donc « Photo nº 2 ». Le défaut dormait depuis le Lot 7 pour une raison simple : **cette branche ne pouvait renvoyer aucune ligne**, `gallery_items` étant vide jusqu'à ce lot. C'est le motif récurrent du Lot 8 — la bascule ne casse rien, elle rend atteignable ce que le fichier TypeScript rendait impossible. |
| 147 | **CORRECTIF DANS LE PÉRIMÈTRE : les boutons de filtre de `/galerie` faisaient 36 px** | `size="sm"` rend un bouton de 36 px, sous les 44 px de la règle 4 du §12. Le défaut dormait depuis le Lot 2 : ce sont les seules commandes de cette section, et aucune recette n'avait encore mesuré `/galerie`. Corrigé par `min-h-11`, comme les deux liens en ligne du Lot 8F (écart nº 122) — la règle ne connaît pas d'exception pour un bouton « petit par choix esthétique ». Mesuré aux cinq largeurs, avant et après (suite 5, C02–C18). |
| 148 | **Un élément dont la photo ne se résout pas n'est PAS rendu** | C'est le SEUL endroit du site où l'on RETIRE un contenu plutôt que de le remplacer par un `MediaPlaceholder`, et il faut dire pourquoi : dans une grille de photos, une vignette de repli n'est pas un contenu dégradé, c'est une case vide au milieu d'une mosaïque — et la visionneuse l'ouvrirait en grand sur rien. Ailleurs (carte de programme, portrait), le repli accompagne un TEXTE qui reste porteur. L'état est très improbable (`media_id` `not null`, `on delete restrict`) et il est SIGNALÉ dans le dashboard, où quelqu'un peut agir. |
| 149 | **« Voir sur le site » existe ici SANS RÉSERVE** | Après quatre lots de nuances — pas de lien au 8C (écart nº 86), lien conditionné au 8D (nº 98), lien conditionné à une lecture réelle au 8F — celui-ci est le cas simple : **`/galerie` affiche TOUTES les photos publiées, sans coupe**. Si l'élément est en ligne, il y est, et rien n'a besoin d'être lu pour le savoir. Le lien n'est rendu que sur un élément publié : sur un brouillon il promettrait une page où la photo ne figure pas. Corollaire, écrit dans `gallery.actions.ts` : **le réordonnancement ne peut pas faire disparaître un contenu**, contrairement à l'écart nº 120 du Lot 8F. |
| 150 | **L'aperçu du formulaire est la VRAIE `<GalleryGrid>`, avec une seule photo** | Même doctrine qu'aux Lots 8E et 8F : un aperçu réécrit à la main est un aperçu qui ment tôt ou tard. Ce qu'il montre et que rien d'autre ne montre : **quel bouton de filtre atteint cette photo**. Choisir « Sans catégorie » fait disparaître le second bouton — la conséquence de l'écart nº 137 devient visible au lieu d'être expliquée, au moment exact où la décision se prend. Il montre aussi le texte alternatif hérité de la médiathèque, en ouvrant la photo, avec un lien vers `/dashboard/mediatheque` pour le corriger — **et non vers une fiche de média, route qui n'existe pas** (la médiathèque ouvre ses fiches en modale) : promettre `/dashboard/mediatheque/<id>` aurait produit un lien mort. |

### Écarts du Lot 8I

| # | Écart | Raison |
|---|---|---|
| 151 | **⚠️ CORRECTION D'UN DÉFAUT DU SEED : LES DEUX RAPPORTS PASSENT EN `published`** | Le seed du Lot 1 les écrivait en `'draft'`, au motif que « le lien reste masqué tant que le PDF est absent ». C'est vrai du LIEN, faux de la LIGNE : `/impact` affichait les deux rapports, avec « En cours de préparation » et « Bientôt disponible ». Ce sont **deux contenus visibles, pas deux absences**. Tant que rien ne lisait la table, l'écart ne se voyait pas ; à la bascule, il devenait une régression complète — la lecture publique ne rend que les rapports publiés, et la section entière aurait disparu de la page qui promet la transparence, alors que le §8x exige un rendu « IDENTIQUE à l'actuel pour les données migrées ». Le §8I confirme d'ailleurs l'intention (« une garde qui empêche de PUBLIER les deux seuls rapports existants »). `seed.sql` est corrigé pour les installations neuves, et la base déjà seedée alignée par un `UPDATE` **borné aux deux années, aux lignes encore en `draft` et sans PDF**, donc idempotent et sans effet sur un rapport que quelqu'un aurait volontairement dépublié. Aucun contenu inventé : ni titre, ni année, ni fichier. |
| 152 | **AUCUNE GARDE DE PUBLICATION — et c'est LA décision du lot** | Ce lot est le jumeau visuel du 8H, et c'est exactement le piège. `gallery_items.media_id` est `not null` : un élément sans photo n'existe pas, d'où la garde du Lot 8H (écart nº 136). **`annual_reports.document_media_id` est NULLABLE**, et un rapport sans PDF est l'état NORMAL — c'est même celui des deux seules lignes existantes. Recopier la garde aurait produit une règle interdisant de publier les deux seuls rapports du site. Le fichier `set-annual-report-status.ts` écrit ce raisonnement au long, avec le tableau comparatif des quatre lots à garde, pour qu'on ne la « rétablisse » pas plus tard en croyant réparer un oubli. Ce qui est fait à la place : l'écran le DIT, à quatre endroits (bandeau de la liste, phrase d'état de la fiche, message de succès de la publication, aperçu du formulaire). **Vérifié dans les deux sens** : la sonde B01 de la suite 1 exige que `documentMediaId` n'apparaisse NULLE PART dans le cas d'usage, et la suite 2 (E13) publie réellement un rapport sans PDF via un client administrateur. |
| 153 | **`year` EST VÉRIFIÉE DANS LE DOMAINE, comme un `slug`** | `findByYear` est la seule méthode de port que les huit autres collections n'ont pas. `year integer not null unique` : la base refuserait le doublon, mais `mapPostgrestError` traduit le 23505 par « **Cette adresse** est déjà utilisée » avec un `fieldErrors.slug` — message doublement faux ici (le mot « adresse » ne veut rien dire pour un rapport, et le champ `slug` n'existe pas dans ce formulaire, de sorte que l'erreur ne se rattacherait à AUCUN champ à l'écran). Le message du cas d'usage nomme l'année ET le titre du rapport existant. ⚠️ Rendre `errors.ts` générique demanderait de lire le nom de la contrainte violée : **dette consignée pour le Lot 16**. |
| 154 | **L'ANNÉE EST MODIFIABLE, contrairement à `stats.key` (écart nº 124)** | `key` est un identifiant technique dérivé et immuable ; `year` est une donnée saisie, affichée, et corrigible — une faute de frappe sur un millésime est une faute comme une autre. Rien ne pointe dessus : `year` n'est référencée par aucune table et ne compose aucune URL. L'unicité est revérifiée à la modification, **en excluant la ligne elle-même** : sans ce `!==`, réenregistrer un rapport sans toucher à son année le déclarerait en conflit avec lui-même (défaut classique, vérifié par D15). |
| 155 | **BORNES D'ANNÉE FIXES (2000–2100), jamais calculées** | `new Date().getFullYear() + 1` aurait été tentant et faux deux fois : la valeur serait figée au démarrage du serveur (un processus qui tourne au passage de l'année validerait selon l'année précédente), et l'écart nº 23 a déjà tranché cette question — une valeur qui change toute seule au 1er janvier est un défaut. Ce que ces bornes protègent réellement, c'est la faute de frappe : `20255` est refusé par un message français au lieu de s'afficher sur la page qui promet la transparence. Elles n'expriment aucune politique éditoriale — un rapport daté de l'année prochaine reste enregistrable. |
| 156 | **LE TITRE N'EST PAS DÉRIVÉ DE L'ANNÉE** | `src/content/equipe.ts` le composait (`Rapport d'activité ${year}`), et `stats.key` est bien dérivée de son libellé (écart nº 124). La différence : `key` est un identifiant technique que personne ne lit, `title` est **le texte affiché sur la page publique**. Dériver un texte affiché, c'est écrire du contenu à la place de l'association — la faute que l'invariant nº 1 interdit sur les chiffres et le Lot 8D sur les noms. Le jour où un rapport s'appelle « Rapport moral et financier 2026 », la dérivation aurait été un obstacle. À la place : un `placeholder` qui MONTRE la forme attendue, n'est pas envoyé, et laisse le champ obligatoire. |
| 157 | **UN AVERTISSEMENT D'ORDRE, propre à cette collection** | `annual_reports` est la SEULE table du projet qui porte à la fois une `position` réordonnable et une donnée suggérant un ordre naturel (`year`). Les deux peuvent se contredire, et rien en base ne l'empêche : un rapport créé aujourd'hui se place en fin de liste (`count() + 1`, comme les huit autres collections), donc un rapport 2026 se retrouverait APRÈS 2024. Deux voies écartées : **trier d'office par année et retirer le réordonnancement** — la matrice du §9 déclare `document:reorder` et la migration 0012 inscrit la table dans sa liste blanche, supprimer une capacité que deux documents d'autorité prévoient demanderait mieux qu'une préférence ; **réordonner tout seul** — cela écrirait des positions que personne n'a demandées. La règle vit dans le domaine (`ordreSuitLesAnnees`), elle est évaluée sur les rapports PUBLIÉS seulement (un brouillon mal rangé ne dérange personne), et l'écran la DIT. Informer plutôt qu'interdire. |
| 158 | **UN RAPPORT DONT LE PDF NE SE RÉSOUT PAS RESTE AFFICHÉ** | C'est l'INVERSE de l'écart nº 148 (Lot 8H), où un élément de galerie dont la photo manque est RETIRÉ de la grille. La différence est réelle et vaut d'être dite : dans une mosaïque, une case vide n'est pas un contenu dégradé, c'est un trou, et la visionneuse l'ouvrirait en grand sur rien. Ici, la ligne porte un TITRE et une ANNÉE qui restent une information vraie et utile ; seul le bouton de téléchargement disparaît, et la ligne repasse en « En cours de préparation » — l'état qu'elle aurait de toute façon sans PDF. **La règle du Lot 8H n'était pas générale, elle était propre aux mosaïques.** L'écran du dashboard, lui, distingue les TROIS états (`absent` / `present` / `introuvable`) : confondre une panne avec un choix éditorial est exactement ce que l'invariant nº 1 interdit. |
| 159 | **LE TEST DE TÉLÉCHARGEMENT PORTE SUR LE MÉDIA RÉSOLU, pas sur `documentMediaId`** | Une référence qui ne rend rien produirait sinon un bouton « Télécharger » sans fichier derrière — le lien mort que l'invariant nº 2 interdit. La page compose donc les deux lectures (rapports + médias) avant de décider. L'aperçu du formulaire fait la MÊME vérification, pour ne pas promettre autre chose que la page publique. |
| 160 | **`urlTelechargementMedia()` AJOUTÉ à `lib/media-url.ts` — `?download=<nom>`** | L'attribut HTML `download` est **ignoré par le navigateur dès que la cible est d'une autre origine** — règle du HTML, pas une particularité de Supabase. Avant la bascule, le chemin était `/documents/…pdf`, servi par Next depuis `/public`, donc de MÊME origine : `download` fonctionnait. Nos fichiers viennent maintenant de `<projet>.supabase.co` : le PDF s'ouvrirait dans un onglet sous un bouton qui promet « Télécharger ». Le paramètre `?download=<nom>` fait répondre le CDN avec `Content-Disposition: attachment`. **Vérifié par un `HEAD` réel sur l'URL publique** (suite 2, D10–D13), pas supposé — c'était la seule API du lot dont le comportement n'était pas certain. Le nom proposé est celui d'ORIGINE, encodé : personne ne veut retrouver `a3f9c1e2-….pdf` dans ses téléchargements. L'attribut `download` est conservé sur le lien : il ne coûte rien et redeviendra exact si les fichiers passent un jour par notre domaine. |
| 161 | **PREMIER USAGE RÉEL DE `<MediaPicker accept="document">`** | Le composant sait le faire depuis le Lot 7 (`bucketPourAccept` → `documents`, migration 0011, 20 Mo, `application/pdf` seul), mais **aucun écran ne l'avait jamais exercé** : les quatre champs `media` livrés jusqu'ici sont tous en `accept: "image"`. C'est la leçon nº 1 du Lot 8H appliquée à un composant plutôt qu'à une table. La recette a exercé la chaîne ENTIÈRE contre la base réelle — téléversement d'un vrai PDF, bucket déduit du type lu dans les octets, nom régénéré en `.pdf`, `width`/`height` à `null`, `Content-Type` servi par le CDN, usage BLOQUANT dans la médiathèque, refus 23503 à la suppression du média — **puis tout purgé**. Aucun défaut trouvé : le chemin du document était correct, il n'était simplement jamais passé. |
| 162 | **DEUX ÉTIQUETTES DE CACHE, DONT UNE PARTAGÉE — et c'est une première** | `cms:documents` est nouvelle ; **`cms:page:impact` ne l'est pas** — elle a été créée au Lot 8G pour les chiffres clés, et `stats.actions.ts` l'invalide déjà. C'est la première fois de la série que deux collections partagent une étiquette de page, et c'est exact : `/impact` lit désormais les deux. Corollaire pour le Lot 15 : **`/impact` n'a qu'un seul `force-dynamic` pour DEUX lectures** — ne pas le retirer en ne pensant qu'à l'une. C'est aussi le premier lot de la série dont la bascule n'a RIEN eu à changer au mode de rendu de sa page. |
| 163 | **LA SECTION `#documents` EST CONDITIONNELLE, ET LE PARAGRAPHE DE CONTACT DISPARAÎT AVEC ELLE** | Règle établie depuis le Lot 8B, et elle compte particulièrement ici : le sous-titre AFFIRME que « les rapports validés sont désormais téléchargeables directement ici ». Rendu au-dessus d'une liste vide, il serait faux — et faux sur la page qui promet la transparence. Le paragraphe « vous souhaitez le détail de l'utilisation d'un don ? » part avec la section, et c'est assumé : il répond à une question que posent les rapports eux-mêmes, et la même adresse reste atteignable **deux fois sur cette page** — l'engagement « Un rapport sur demande », juste au-dessus, et le pied de page. Une phrase de contact orpheline sous un titre sans contenu aurait été le troisième état, celui que personne n'a voulu. L'ancre `#documents` est nouvelle (destination des liens « Voir sur le site »), jumelle de `#chiffres` posée au Lot 8G. |
| 164 | **« Voir sur le site » SANS RÉSERVE, comme au Lot 8H** | Cinquième et dernier arbitrage de cette question dans la série : `/impact` affiche TOUS les rapports publiés, sans coupe. Si le rapport est en ligne, il y est, et rien n'a besoin d'être lu pour le savoir. Le lien n'est rendu que sur un rapport publié — sur un brouillon il promettrait une section où il ne figure pas. Corollaire écrit dans `annual-reports.actions.ts` : **le réordonnancement ne peut pas faire disparaître un contenu**, contrairement à l'écart nº 120 du Lot 8F. |
| 165 | **L'APERÇU EST REDESSINÉ — seul de la série** | Les Lots 8E, 8F et 8H rendaient le VRAI composant public (`<ValueCard>`, `<FAQAccordion>`, `<GalleryGrid>`), et c'était la bonne décision. ⚠️ **Ici, il n'y a AUCUN composant à réutiliser** : la section Documents de `/impact` n'a jamais été extraite, ses lignes sont écrites en clair dans la page. L'extraire aurait été le geste juste, et il est hors périmètre — une page serveur ne peut pas recevoir un composant qui lit un formulaire. Ce qui borne le risque : **les trois libellés viennent du DOMAINE** (`MENTION_AVEC_DOCUMENT`, `MENTION_SANS_DOCUMENT`, `PASTILLE_SANS_DOCUMENT`), pas de chaînes recopiées — si la page publique change de vocabulaire, l'aperçu change avec elle. Ce qui reste dupliqué, ce sont les classes de mise en forme. **À reprendre au Lot 9**, qui extraira des blocs de rendu. |
| 166 | **LA RECHERCHE PORTE SUR UNE COLONNE `integer`, et les deux niveaux ne mentent pas l'un sur l'autre** | `ilike` sur une colonne numérique lève une erreur PostgREST (« operator does not exist: integer ~~* unknown »). La clause `year` n'est donc ajoutée que si la saisie est un ENTIER, et elle emploie `eq` : chercher « 2025 » trouve le rapport 2025, chercher « 202 » ne trouve rien **côté SQL**. L'écran, lui, complète : `<DataTable>` filtre EN MÉMOIRE (écart nº 51) sur des lignes déjà chargées, où l'année est une chaîne — la saisie partielle y fonctionne. Le dépôt fait ce que SQL sait faire, l'écran ce que le navigateur sait faire, et **le dépôt en mémoire imite exactement le dépôt réel** (écarts nº 109, 132, 141). Les deux comportements sont mesurés séparément (suite 2 C11–C13, suite 4 B02–B03). |
| 167 | **AUCUNE COLLECTION SATELLITE — le patron « une collection dans la collection » ne s'applique PAS** | Après deux instances (catégories d'articles au 8B, de galerie au 8H), la tentation était de plaquer une troisième. `annual_reports` est une table seule : il n'y a pas de « catégories de documents », et en inventer une aurait créé une liste de libellés que rien n'affiche. Un seul port, un seul dépôt, une seule fabrique de dépendances — c'est le lot le plus simple de la série, et c'est normal. |
| 168 | **`document:*` EXISTAIT DÉJÀ dans la matrice — contrairement à `value` au Lot 8E** | Les six permissions sont déclarées depuis le Lot 2, et l'entrée de navigation « Documents » depuis le Lot 5. Aucun ajout au §9 n'a été nécessaire, et c'est la première collection de la série dans ce cas. La ressource s'appelle `document`, pas `annual_report` : c'est plus large que la table, et le §5.2 nomme l'écran « Documents » — le jour où un autre type de document arrive, la permission n'aura pas à être renommée. |

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

**35. ⚠️ LE DISQUE DE LA MACHINE EST SATURÉ — à vérifier AVANT chaque lot.**
Le volume `C:` a atteint **0 octet libre** pendant le Lot 8C, et la panne ne
ressemble pas à une panne de disque : `npx tsc --noEmit` s'est mis à échouer sur
`Type '"/dashboard/…/[id]"' does not satisfy the constraint 'AppRoutes'` pour
les TROIS routes dynamiques du projet, y compris celles des lots précédents. La
cause réelle était que Next ne pouvait plus écrire `.next/types/`. Chercher un
défaut de typage aurait fait perdre des heures.

`.next/cache` pèse 120 à 220 Mo, se regénère seul et n'est pas utilisé par
`next start` : le vider est sans risque.

```powershell
Get-PSDrive C | Select-Object @{n='FreeMB';e={[math]::Round($_.Free/1MB)}}
Remove-Item -Recurse -Force .next\cache
```

Prévoir ~250 Mo libres pour une recette navigateur : le profil Chrome
temporaire s'y ajoute. Turbopack le signale à sa façon, en toute fin de build et
avant le `✓ Compiled successfully` — « Persisting failed during shutdown […]
Espace insuffisant sur le disque (os error 112) » : **ce message ne fait pas
échouer le build**, mais il annonce la panne suivante.

**⚠️ COMPLÉMENT DU LOT 8D — le vrai gisement n'est PAS `.next/cache`.**
Le disque est retombé à zéro pendant le Lot 8D. `.next/cache` avait déjà été
vidé : **c'est `.next/dev` qui pesait 1,1 Go**, le cache Turbopack du serveur de
DÉVELOPPEMENT. `next start` ne le lit jamais — il ne se sert que de
`.next/server`, `.next/static` et des manifestes — et il se regénère seul au
prochain `next dev`, au prix d'un premier démarrage plus lent. Le supprimer a
rendu 1,1 Go d'un coup, serveur de recette en marche, sans rien casser.

```powershell
Remove-Item -Recurse -Force .next\dev      # ~1 Go, cache de `next dev`
Remove-Item -Recurse -Force .next\cache    # 120–220 Mo
```

Le dossier `%LOCALAPPDATA%\Temp` de la machine pèse par ailleurs **3,4 Go**,
étalés sur ~1700 fichiers `.tmp` laissés par d'autres applications. Rien n'y a
été touché : ce n'est pas au projet d'en décider. C'est signalé pour que
l'utilisateur puisse le faire.

**36. Un compte de recette a besoin de son PROPRE contexte de navigation.**
Deux onglets d'un même profil Chrome partagent leurs cookies : ouvrir
`/connexion` dans un second onglet alors que le premier est connecté en
administrateur ne montre pas le formulaire mais **redirige vers `/dashboard`**,
et la recette conclut que le champ e-mail a disparu. La parade est
`Target.createBrowserContext`, puis `Target.createTarget({ browserContextId })`
— l'équivalent d'une fenêtre privée distincte. Indispensable dès qu'un lot
compare deux rôles dans la même exécution.

**37. `document.readyState === 'complete'` ne veut PAS dire « React a hydraté ».**
Une valeur écrite dans un champ avant l'hydratation est effacée par le premier
rendu client, qui restaure la `defaultValue` : l'écran affiche alors
« L'adresse e-mail est obligatoire » sur un champ qu'on vient de remplir. Le
symptôme est **intermittent** et ressemble à un défaut de l'application. La
parade est de RELIRE le champ après l'avoir écrit et de recommencer tant que la
valeur n'a pas tenu — c'est ce que fait désormais le `saisir()` du module CDP.
C'est le prolongement de la découverte nº 33 : ne pas supposer qu'une action a
pris, le vérifier.

**38. La recette peut se faire bloquer par la protection anti-force brute du
projet.** `connexion` est limité à **5 tentatives par quart d'heure et par
adresse IP** (`rate-limit.ts`, table `rate_limits`). Une suite qui ouvre deux
sessions atteint la limite au troisième passage, et l'écran répond « Trop de
tentatives. Patientez 15 minutes ». **C'est la protection qui fonctionne**, pas
un défaut. La parade employée : remettre à zéro les seules clés de la boucle
locale (`connexion:::ffff:127.0.0.1`, `connexion:::1`) au démarrage de la
suite — jamais celles d'une adresse réelle, dont la protection reste entière.

**39. La casse des en-têtes n'est pas garantie côté CDP.**
`Network.requestWillBeSent` rend les en-têtes tels qu'ils partent : Next émet
`next-action` en minuscules. Chercher `headers["Next-Action"]` à l'identique ne
trouve jamais rien — et la mesure passe pour « aucune Server Action appelée »
alors qu'elles le sont toutes. Toujours chercher sans tenir compte de la casse.

**40. Une recette interrompue empoisonne la suivante.** Une exécution qui échoue
avant son bloc de nettoyage laisse derrière elle ses comptes et ses lignes ; la
suite d'après les photographie comme « état initial » et se compare à un état
faux — quatre échecs du Lot 8D venaient de là, aucun du code. **Toute suite qui
écrit doit PURGER ses propres traces à son démarrage**, sur un préfixe qui ne
peut appartenir à personne d'autre (`RECETTE-8D`, `recette-8d-…@exemple.test`),
et déduire ses comptes attendus de l'état initial mesuré plutôt que d'un nombre
écrit en dur.

**41. ⚠️ CHROME HEADLESS DÉMARRE EN 800 × 600 — et le `<DataTable>` rend alors
des CARTES.** Sous 1024 px il n'y a **aucune structure de tableau** dans le DOM
(`card-view.tsx`) : un sélecteur `tbody tr` n'y trouve rien, et l'échec ressemble
trait pour trait à « les données ne sont pas arrivées ». Six vérifications du
Lot 8E ont échoué pour cette seule raison. **Appeler
`Emulation.setDeviceMetricsOverride` AVANT toute mesure**, et attendre les lignes
(`tbody tr`) plutôt que le titre de la page avant de lire `innerText` — le
`<DataTable>` rend un squelette côté serveur et ne monte son contenu qu'après
hydratation.

**42. ⚠️ `indexOf` SUR UNE PAGE ENTIÈRE NE MESURE PAS CE QU'ON CROIT.** La
vérification d'ordre d'affichage du Lot 8E échouait en annonçant
`Solidarité@298` — alors que la base ET la grille étaient parfaitement
réordonnées. Le mot « Solidarité » apparaît **ailleurs sur l'accueil**, dans les
puces de la section « À propos », bien avant la grille des valeurs. **Un titre de
contenu est souvent un mot courant** : toute vérification de PRÉSENCE ou d'ORDRE
doit être bornée à la section concernée. Les ancres `id="…"` posées pour les
liens du dashboard servent de borne naturelle.

**43. Une mesure de périmètre doit respecter son périmètre.** Même lot, même
famille d'erreur : la sonde de débordement mesurait toujours
`document.documentElement`, y compris pour les entrées déclarées « section
valeurs ». Elle a échoué à 320 px sur l'accueil — coupable mesuré : la grille des
**témoignages** (Lot 8C), à 340 px. L'assertion imputait au Lot 8E un défaut
livré deux lots plus tôt. **Sans bornage, chaque lot hérite des défauts de tous
les précédents et plus personne ne sait à qui appartient quoi.** Le relevé global
reste utile, mais à sa place : une section qui AFFICHE sans COMPTER.

**44. Ne jamais assouplir une règle de mesure pour excuser le code qu'on vient
d'écrire.** Deux fois au Lot 8E la tentation s'est présentée : chercher « lucide »
dans un fichier entier échouait sur le commentaire qui explique pourquoi lucide
n'y est pas (assertion corrigée pour porter sur le CODE seul — légitime) ; mais
surtout, deux liens en ligne mesurés à 17 px de haut invitaient à inscrire dans
le harnais l'exception WCAG 2.5.8 pour les liens « au sein d'une phrase ».
**C'était l'inverse qu'il fallait faire** — les liens du pied de page, relevés à
22 px, attendent d'être corrigés au Lot 12 sous cette même règle. Corriger
l'assertion quand elle mesure la mauvaise chose ; corriger le CODE quand elle
mesure la bonne.

**45. ⚠️ LE CONTENU D'UN ACCORDÉON RADIX FERMÉ N'EST PAS DANS LE HTML SERVI.**
Jumeau exact de la découverte nº 32 pour le `<DataTable>`, et il a produit le
même genre de faux échec. Radix ne monte le `<AccordionContent>` qu'à
l'ouverture : le HTML de `/don` contient les QUESTIONS (les déclencheurs) et
**aucune** réponse. Une assertion HTTP qui cherche le texte d'une réponse
échoue à juste titre — la vérification appartient à la suite NAVIGATEUR, après
un clic sur le panneau.

L'assertion fautive cherchait de surcroît dans la page ENTIÈRE et « passait » à
moitié : « Orange Money » apparaît aussi dans la section « Moyens de paiement »,
très au-dessus de la FAQ (découverte nº 42 qui se rejoue).

**Et une conséquence qui dépasse la recette :** le texte des réponses n'atteint
un moteur de recherche **que par le JSON-LD**. C'est ce qui rend l'écart nº 113
structurant plutôt que cosmétique — le balisage n'est pas un doublon du
contenu visible, il en est le seul véhicule.

**46. `Runtime.evaluate` doit envelopper l'expression dans une IIFE ASYNC.**
Une IIFE ordinaire lève « await is only valid in async functions » dès que la
sonde a besoin d'un `await` — c'est le cas du rejeu d'une Server Action, qui
fait un `fetch`. `(async () => { … })()` avec `awaitPromise: true` couvre les
deux cas sans changer le comportement des expressions synchrones. Le module CDP
du Lot 8E ne l'avait pas rencontré, aucune de ses sondes n'étant asynchrone.

**47. La capture d'une Server Action arrive quand le `fetch` PART, pas quand il
revient.** Complément à la découverte nº 28. Le patron « patcher `window.fetch`,
cliquer, attendre la capture » rend la main **avant** que la mutation ne soit
committée. Republier tout de suite court contre elle, et l'écrasement qui suit
ressemble trait pour trait à « le refus n'était pas cosmétique, l'action a bien
eu lieu ». Il faut attendre la CONDITION en base — ici, que le statut soit
réellement retombé à `draft` — avant d'enchaîner. C'est la découverte nº 33
appliquée à une mutation distante : on attend une condition, et il faut attendre
la BONNE.

**48. ⚠️ UN `next start` PÉRIMÉ NE PLANTE PAS : IL SERT UNE PAGE MORTE.**
Découverte du Lot 8G, et la plus coûteuse de la recette. Le serveur tournait
encore avec le build précédent : les chunks JS ne correspondaient plus au HTML,
**React a abandonné l'hydratation en silence**, et la page est restée un
document statique. Aucun clic n'avait d'effet — ni par CDP, ni par un
`element.click()` natif. Le symptôme est trait pour trait celui d'un composant
défectueux, et une demi-heure a été passée à chercher un défaut dans une case à
cocher qui n'en avait aucun.

**Deux règles en découlent, et elles sont dans le module CDP :**

1. **Rebâtir ET REDÉMARRER `next start` avant toute suite navigateur.** Tuer le
   processus par son port (`Get-NetTCPConnection -LocalPort … | Stop-Process`),
   pas par un `taskkill` sur `node.exe` — le filtre ne l'attrape pas et laisse
   l'ancien serveur en place, ce qui produit exactement la panne ci-dessus.
2. **Attendre l'HYDRATATION, jamais une durée.** Le conseil « ~600 ms après
   `Page.loadEventFired` » de ce fichier était une pause calibrée, c'est-à-dire
   ce que la découverte nº 33 interdit. `aller()` attend désormais la MARQUE de
   React sur le DOM (`Object.keys(el).some(k => k.startsWith('__reactFiber'))`)
   et **lève une erreur nommée** si elle n'apparaît pas en 15 s. Le message dit
   « le serveur sert-il un build périmé ? » : le prochain lot n'aura pas à
   chercher.

**49. ⚠️ `getBoundingClientRect()` N'EST PAS LA ZONE SENSIBLE D'UNE CIBLE.** Une
sonde de 44 px naïve a rapporté **26 fautes par écran sur des cibles toutes
conformes**. Trois constructions du design system la mettent en défaut, et
« corriger » l'une d'elles aurait défait le correctif du Lot 8A :

- **`CIBLE_44` = `after:-inset-3.5`** — la case Radix mesure 16 × 16 px ; ce
  sont ses 44 px de zone sensible qui vivent dans le **pseudo-élément
  `::after`**, absent de tout rectangle d'élément. La sonde compose donc le
  rectangle avec les pseudo-éléments absolus à inset négatif
  (`getComputedStyle(el, '::after')`).
- **`PASTILLE_CHOIX`** — le `<input type="radio">` d'une grille d'icônes est en
  `sr-only`, donc **1 × 1 px** ; la cible réelle est le `<label>` de 44 px qui
  l'enveloppe. Un champ visuellement masqué délègue sa mesure à son `<label>`.
- **Les champs FANTÔMES de Radix** — chaque `Checkbox` rend derrière son bouton
  un `<input type="checkbox">` de 16 px pour la soumission native :
  `aria-hidden`, `opacity: 0`, `pointer-events: none`. Deux fausses fautes par
  formulaire. Le critère d'exclusion est fonctionnel, pas nominatif : est écarté
  ce qui est hors du champ tactile **et** hors de l'arbre d'accessibilité.

Le même trio fausse la sonde de NOMS accessibles : `el.labels` ne rend que les
`<label for=…>`, jamais ceux par enveloppement. `el.closest('label')` couvre les
deux formes.

**50. La règle des 16 px est bornée SOUS `md:` — et c'est écrit dans le code.**
`field-styles.ts` pose `text-base md:text-sm`, avec son motif : « iOS Safari
zoome à la mise au point ». Une sonde qui exige 16 px à 1440 px ne mesure pas une
règle du projet, **elle en invente une** — et signalerait tous les écrans
recettés des Lots 6 à 8F. Elle ne concerne d'ailleurs que les champs de SAISIE :
la taille de police d'une case à cocher ne fait rien zoomer. Une vérification
non applicable doit le DIRE (« règle non applicable au-delà de 768 px ») plutôt
que de passer en silence.

**51. ⚠️ `undefined` N'EST PAS REPRÉSENTABLE DANS REACT-HOOK-FORM.**
`useController` résout sa valeur par `get(valeurs, nom, défaut)`, et `get`
substitue le DÉFAUT dès que la valeur lue est `undefined`. Écrire `undefined`
dans un champ est donc indiscernable de « ce champ n'a jamais été touché » : la
bibliothèque relit aussitôt la valeur par défaut. C'est ce qui a fait échouer la
première version du correctif de l'écart nº 126 — la case refusait purement et
simplement de se décocher, sans la moindre erreur. **La seule valeur « vide »
que RHF sait porter est `""`**, et c'est celle qu'il faut utiliser ; le message
de TYPE du schéma (`z.number("…")`, acquis de l'écart nº 90) est alors ce qui
rend l'état lisible pour l'utilisateur.

**52. ⚠️ LES OPTIONS D'UN `<Select>` RADIX NE SONT PAS DANS LE HTML SERVI.**
Troisième membre de la famille des découvertes nº 32 (le `<DataTable>` rend un
squelette) et nº 45 (l'accordéon fermé ne monte pas ses réponses) : Radix ne
monte ses `<SelectItem>` qu'à l'OUVERTURE du menu, dans un portail. Une
assertion HTTP qui cherche « Éducation » dans le texte visible de
`/dashboard/galerie/nouveau` échoue donc à juste titre.

Ce que la suite HTTP peut légitimement vérifier : que les options sont
**sérialisées dans la charge utile RSC**, ce qui prouve que la page les a lues
EN BASE et transmises au composant client. Leur affichage appartient à la suite
navigateur, après ouverture.

Nuance mesurée au passage, et elle est utile : **la SENTINELLE, elle, n'est pas
dans la charge utile.** « Sans catégorie » est une constante du domaine lue par
le composant client — elle voyage dans le bundle JavaScript, pas dans les props.
La distinction permet de prouver que les options dynamiques viennent bien du
serveur.

**53. ⚠️ `supabase-js` IGNORE `contentType` QUAND LE CORPS EST UN `Blob`.**
Trouvé par la migration du Lot 8H, et c'est un **défaut réel de la chaîne de
téléversement du Lot 7**, pas un détail de banc d'essai. Dans
`storage-js`, `uploadOrUpdate` construit un `FormData` dès que le corps est un
`Blob` : le type transmis au bucket est alors **`blob.type`**, jamais l'option
`contentType`. Celle-ci n'est lue que dans la branche « ni Blob ni FormData ».

Deux conséquences, toutes deux invisibles jusqu'ici :

  * **un fichier sans type est REFUSÉ.** `File.type` est renseigné par le
    navigateur d'après l'EXTENSION : un JPEG valide nommé « photo », sans
    extension, arrive avec `type: ""`. Il traverse tout `uploadMedia` — qui, lui,
    lit les OCTETS — puis se fait refuser par le bucket (« mime type
    application/octet-stream is not supported »), et l'utilisateur lit « Le
    fichier n'a pas pu être enregistré. Réessayez. », c'est-à-dire une invitation
    à refaire ce qui échouera à l'identique ;
  * **un fichier au type MENTEUR est stocké avec ce mensonge.** Un JPEG renommé
    `.png` s'annonce `image/png` : les deux types étant acceptés par le bucket,
    l'objet est écrit avec `Content-Type: image/png` alors que
    `media_assets.mime_type` — déduit des octets — dit `image/jpeg`. Le catalogue
    et le CDN se contredisent, et c'est le CDN que voit le visiteur.

Le remède est dans `SupabaseStorage.upload` : le corps est RE-ÉTIQUETÉ avec le
type réel avant l'envoi, par `blob.slice(0, size, type)` — une vue qui porte le
nouveau type **sans recopier les octets**. Vérifié par un `HEAD` sur l'URL
publique (suite 2, B03).

**54. ⚠️ LA PREMIÈRE CAPTURE D'UNE SERVER ACTION PEUT ÊTRE UNE LECTURE.**
La découverte nº 28 dit de « FIGER LA PREMIÈRE capture », pour ne pas rejouer la
dernière action — celle pour laquelle l'éditeur a justement les droits. C'était
juste au Lot 8G, dont l'écran ne faisait aucune lecture par Server Action.

L'écran de ce lot en fait deux au montage : `<MediaField>` et `<ApercuElement>`
appellent tous deux `lireMediaAction` pour résoudre la photo. La première capture
était donc une LECTURE, et son rejeu depuis la session de l'éditeur renvoyait
tranquillement `{"ok":true,"data":{…MediaAsset…}}` — un succès parfaitement
légitime, que la sonde lisait comme « la garde n'a pas refusé ».

**Règle générale : choisir la capture par son CONTENU, pas par son rang.** On
collecte toutes les Server Actions et on retient celle dont la charge utile
désigne l'élément visé ET l'état demandé. La suite 4 vérifie en outre qu'il y
avait bien d'autres appels avant, pour que la parade reste justifiée le jour où
l'écran change.

**55. ⚠️ ON NE FORCE PAS UN THÈME EN POSANT SA CLASSE — `next-themes` LA REPREND.**
La sonde de contraste du Lot 8H faisait
`document.documentElement.classList.add("dark")`. Elle a rapporté TROIS échecs —
les libellés de la barre latérale à **1,06:1** — qui n'existent pas.

`next-themes` resynchronise `<html>` avec le thème stocké : la classe posée de
l'extérieur disparaît en cours de mesure, et la sonde compose alors un FOND déjà
repeint en sombre avec une COULEUR DE TEXTE encore claire. Le rapport obtenu ne
décrit **aucun état que l'application produit**, et il accusait un composant du
Lot 5 livré et recetté.

La parade : écrire le thème **là où l'application le lit** (`localStorage`, clé
`theme`), RECHARGER, vérifier que la classe est bien là — **et revérifier après
la mesure qu'elle a tenu**. Une bascule qui ne tient pas doit invalider la
mesure, pas la faire échouer en silence.

C'est la découverte nº 10 dans sa version la plus retorse : la sonde ne s'était
pas trompée de calcul, elle avait mesuré un instant qui n'existe pas.

**56. UNE SONDE QUI MESURE ZÉRO « PASSE » — ET NE PROUVE RIEN.**
Deux fois dans le même lot :

  * `verifier(cree?.category_id !== null)` réussissait quand l'élément
    n'existait pas (`undefined !== null` vaut `true`) ;
  * `insuffisants.length === 0` réussissait quand la sonde de contraste n'avait
    trouvé aucun texte à mesurer.

Un test qui réussit parce que sa donnée manque est pire qu'un test absent : il
occupe la place d'une vérification. Toute sonde qui COMPTE doit donc exiger
`mesures > 0`, et toute assertion sur une donnée lue doit commencer par vérifier
qu'elle existe.

**57. UN LIBELLÉ DE COMMANDE EST SOUVENT LE PRÉFIXE D'UN AUTRE.**
Découverte nº 42 (« un titre de contenu est souvent un mot courant »), transposée
aux boutons. `cliquerTexte("Ajouter")` cherchait dans la page entière et trouvait
**« Ajouter une photo »**, le bouton primaire de l'en-tête — qui contient bien
« Ajouter ». Le clic partait vers un autre écran, la catégorie n'était jamais
créée, et l'échec apparaissait deux assertions plus loin.

Un clic de recette se BORNE à son conteneur (la modale, la ligne, la section) et
compare le texte de façon EXACTE dès qu'un libellé plus long peut le contenir.

**COMPLÉMENT DU LOT 8E à la découverte nº 35 (disque).** Le disque est retombé à
**30 Mo** avant la recette. Cette fois `.next/dev` n'existait pas (aucun
`next dev` lancé) et `.next/cache` ne pesait que 125 Mo. **Le vrai gisement était
`%LOCALAPPDATA%\npm-cache` : 8,5 Go.** C'est un cache de téléchargement, purement
jetable — `npm cache clean --force` l'a ramené à zéro et libéré **8,3 Go**, au
seul prix d'un retéléchargement au prochain `npm install`. À vérifier en premier
désormais, avant `.next/`. (`%LOCALAPPDATA%\Temp` pesait 4,0 Go et le profil
Chrome 4,6 Go : **laissés intacts**, ils n'appartiennent pas au projet.)

**58. DEUX COMPOSANTS RADIX NE SE PILOTENT PAS DE LA MÊME FAÇON.**
`DropdownMenuTrigger` s'ouvre sur **`pointerdown`** : un `element.click()`
synthétique, qui ne produit qu'un événement `click`, l'ignore purement et
simplement. `SelectTrigger`, lui, réagit bien à `click()`. La même bibliothèque,
deux comportements, et rien ne le signale.

Le symptôme est trompeur : le menu ne s'ouvre pas, la sonde compte zéro entrée
et conclut « ce menu est vide » — c'est-à-dire qu'elle accuse un composant
parfaitement fonctionnel (découverte nº 44).

**La parade est générale** : ne plus piloter un clic par `element.click()`, mais
par `Input.dispatchMouseEvent` en CDP (`mousePressed` puis `mouseReleased`, aux
coordonnées du centre de l'élément). C'est ce que fait un vrai navigateur, donc
la séquence complète d'événements pointeur. À employer PAR DÉFAUT dans le module
CDP des prochains lots.

**59. `process.exit()` DANS UN `try` SAUTE LE `finally`.**
Défaut réel du banc, trouvé à la vérification finale. La fonction `resume()`
appelait `process.exit()` — et elle est invoquée DANS le bloc `try` de chaque
suite. Une suite en échec terminait donc le processus **sans exécuter sa purge**,
et laissait ses comptes de test derrière elle : trois profils en base au lieu
d'un.

C'est la découverte nº 40 par une porte que personne ne regarde — le script ne
« plante » pas, il sort proprement, avec un code d'erreur juste et une base
sale. Un harnais de recette doit RENDRE son code de sortie ; c'est l'appelant
qui sort, après la purge.

⚠️  Et c'est le contrôle « il ne doit rester que le super administrateur » qui
l'a rattrapé. Ce contrôle n'est pas de la cérémonie.

**60. PURGER LES LIGNES NE SUFFIT PAS : IL FAUT RENDRE LES POSITIONS.**
Une suite insérait des lignes de recette (dont une sans `position`, donc à 0) puis
les supprimait. La suppression ne renumérote rien : les deux rapports réels se
retrouvaient en positions **2 et 3** au lieu de 1 et 2 — dans le bon ORDRE, ce
que le contrôle final vérifiait, mais pas aux bonnes VALEURS.

Prise isolément, la suite passait. Enchaînée, elle empoisonnait la suivante : la
suite navigateur crée son rapport à `count() + 1`, soit 3 — **la même position
qu'une ligne réelle**. Deux lignes à égalité, plus aucun critère pour les
départager, et l'ordre lu devient non déterministe. Résultat : un avertissement
d'ordre qui apparaît ou non selon l'exécution, sur trois suites différentes.

Une recette rend l'état NUMÉRIQUE tel qu'elle l'a trouvé : relever l'ordre à
l'entrée, `reorder_rows` à la sortie. Et vérifier les positions, pas seulement
leur ordre relatif.

⚠️  Corollaire pour toute collection réordonnable : **une suite qui exerce
« Monter » exerce `reorder_rows` sur la table ENTIÈRE**, donc sur les données de
l'utilisateur. Ici, deux « Monter » sur un rapport de recette ont laissé le site
public avec ses deux rapports dans l'ordre inverse.

**61. UNE SONDE SUR UN PRÉFIXE D'URL MATCHE LA PAGE D'OÙ L'ON PART.**
Après avoir soumis le formulaire de création, l'attente était
`location.pathname.indexOf("/dashboard/documents/") === 0 && length > …`.
`/dashboard/documents/nouveau` la satisfait **aussi**. La sonde rendait la main
immédiatement, sans que rien ne se soit produit, et la relecture en base qui
suivait échouait — en désignant la création, alors que le défaut était l'attente.

Attendre une redirection, c'est attendre la forme EXACTE de la destination : ici,
un identifiant UUID en dernier segment. Jumeau de la découverte nº 47 (attendre
la mutation, pas la capture) et de la nº 56 (une assertion vraie par
construction n'assertionne rien).

**62. UNE SONDE DE TEXTE SOURCE TROUVE L'ANTI-PATRON DANS LES COMMENTAIRES.**
Trois sondes de la suite 1 ont accusé du code correct dès leur première
exécution, pour une seule raison : **les fichiers de ce projet CITENT
l'anti-patron qu'ils évitent**, en commentaire, précisément pour qu'on ne le
réintroduise pas. Le mapper contient la phrase « un `if (input.documentMediaId)`
aurait rendu le retrait impossible » ; le cas d'usage contient « et non
`input.status ?? 'draft'` ».

Une recherche de texte brut y voit le défaut qu'elle cherche. Toute sonde qui
LIT DU CODE doit d'abord retirer les commentaires — et il aurait été bien plus
rapide, et bien pire, de « nettoyer » les commentaires pour faire passer la
sonde.

**63. LA CHARGE UTILE RSC COMPTE DOUBLE.**
Next sérialise l'arbre rendu dans des `<script>` en bas de page : **chaque texte
affiché se retrouve une seconde fois dans le HTML servi**. Une sonde qui
comptait les occurrences d'une mention dans `html.slice(indexOf('id="documents"'))`
— c'est-à-dire jusqu'à la fin du document — rapportait 6 mentions pour 3 lignes
rendues.

C'est la découverte nº 42 avec une cause nouvelle, et elle touche toute mesure
par `match(...).length` sur du HTML de Next. Borner à la section (jusqu'au
`<section` suivant) suffit.

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

## Ce qu'a livré le Lot 8C (détail)

### Fichiers

| Fichier | Rôle |
|---|---|
| `src/core/cms/entities/testimonial.ts` | `Testimonial`, `CreateTestimonial`, `UpdateTestimonial`. Documente pourquoi `placeholder` disparaît et pourquoi `hasConsent` n'est pas un champ comme les autres |
| `src/core/cms/ports/testimonial.port.ts` | Lecture / écriture séparées. `TestimonialDeps` porte un `ProgrammeReadPort` — la création vérifie que le programme cité existe |
| `src/core/cms/schemas/testimonial.schema.ts` | 6 schémas. `status` absent de la création (écart nº 83), messages français jusqu'aux erreurs de type (écart nº 90) |
| `src/core/use-cases/testimonials/` | 7 cas d'usage. `set-testimonial-status.ts` porte **la règle absolue du §8C** ; `update-testimonial.ts` ses deux verrous (écart nº 82) |
| `src/core/testing/in-memory-testimonial.repository.ts` | Dépôt en mémoire — les cas d'usage se recettent sans base |
| `src/infrastructure/supabase/mappers/testimonial.mapper.ts` | `snake_case` ⇄ `camelCase`. Le plus simple des trois : aucun JSONB, aucun tableau |
| `src/infrastructure/supabase/repositories/testimonial.repository.ts` | Liste blanche de tri, `findPublished`, `reorder_rows('testimonials')` — **légitime ici**, contrairement au Lot 8B |
| `src/server/deps/testimonial.deps.ts` | Un client Supabase pour les deux dépôts. Gabarit de `programme.deps.ts` |
| `src/server/actions/testimonials.actions.ts` | 5 actions. Étiquettes réduites à deux : pas de fiche à invalider (écart nº 86) |
| `src/server/queries/testimonials.query.ts` | `getTemoignagesPublies()`. **Porte le raisonnement complet de l'écart nº 84** |
| `src/server/dal/programme-options.ts` | ✚ Les options du champ `reference` vers `programme` (écart nº 89) |
| `src/components/dashboard/testimonials/testimonial-form.tsx` | 6 descripteurs + `<AvertissementConsentement>`, qui **change de texte plutôt que de disparaître** une fois la case cochée |
| `…/testimonials-client.tsx` | Colonne « Accord » textuelle, 3 filtres, bandeau comptant les lignes en ligne sans accord, « Publier » désactivé avec motif |
| `…/testimonial-editeur.tsx` | Trois états distincts : brouillon sans accord · en ligne et affiché · en ligne hors des trois premiers |
| `src/app/(dashboard)/dashboard/temoignages/{,nouveau/,[id]/}page.tsx` | Les trois écrans |
| `src/components/cards/testimonial-card.tsx` | Réécrite pour le `Testimonial` du domaine. **Repli `/public` supprimé** (écart nº 85) |
| `src/app/(site)/page.tsx` | La section « Témoignages » lit la base ; elle disparaît entièrement s'il n'y en a aucun en ligne |
| `src/core/cms/blocks/types.ts` | ✚ `reference` dans `CHAMPS_PLEINE_LARGEUR` (écart nº 88) |
| `src/content/temoignages.ts` | N'est plus importé par aucune page. En-tête mis à jour |

### Recette exécutée — 498 vérifications, 0 échec

| Suite | Vérifs | Ce qu'elle couvre |
|---|---|---|
| Code pur | 174 | 6 schémas (dont l'absence de `status` à la création et l'absence totale de message anglais), 7 cas d'usage sur dépôts en mémoire, les 3 mappers, la matrice RBAC |
| Infrastructure (base réelle) | 78 | Dépôt, RLS lecture/écriture/suppression, `guard_publish`, `on delete restrict`, `reorder_rows`, aller-retour de `has_consent` |
| HTTP (`next start`) | 92 | Gardes, 3 écrans, **bascule de l'accueil** : dépublication, republication, section vide, quatrième témoignage, effet du réordonnancement |
| Parcours navigateur (CDP) | 69 | Création sans accord, refus de publication, bascule de l'avertissement, retrait d'accord refusé, réécriture de citation refusée puis régularisée, « Monter », rejeu direct → `FORBIDDEN`, suppression, journal d'audit |
| Responsive / a11y | 85 | 3 écrans × 5 largeurs, cibles 44 px, 16 px sous 768 px, zoom 200 %, contraste AA **clair et sombre**, bascule tableau/cartes, clavier |

Trois points de la recette valent d'être retenus :

- **la base, seule, n'empêche pas de publier sans accord** — aucune contrainte
  SQL ne porte sur `has_consent`. Mesuré (D21 de la suite infrastructure). C'est
  le domaine qui tient la règle, et c'est pourquoi aucune écriture ne doit
  court-circuiter les cas d'usage ;
- **la même règle est vérifiée aux trois niveaux** : le bouton est désactivé
  avec son motif, la Server Action refuse, et le rejeu direct par un éditeur
  reçoit `FORBIDDEN` ;
- **l'état final de la base est identique à l'état initial** : 1 profil,
  3 témoignages publiés sans accord dans leur ordre d'origine, `media_assets`
  vide, `audit_logs` toujours à 17 entrées (aucune ajoutée). Banc de recette
  entièrement retiré du dépôt, serveur de recette arrêté.

`npm run build`, `npx tsc --noEmit` et `npx eslint .` : code de sortie **0**,
zéro avertissement.

### Points de vigilance légués

- **Les trois portraits de `/public/images/temoignages/` ne s'affichent plus**
  (écart nº 85). Ce n'est pas une régression accidentelle mais une conséquence
  assumée et mesurée. Marche à suivre pour l'utilisateur : téléverser les trois
  fichiers dans `/dashboard/mediatheque`, puis les choisir dans le champ
  « Photo » de chaque fiche. Les fichiers sont toujours sur le disque.
- **Les trois témoignages du seed restent en ligne sans accord.** Rien ne les a
  modifiés : ce sont des gabarits, l'écran les signale, et aucun NOUVEAU
  témoignage ne peut être mis en ligne sans accord.
- **`audit_logs` contient toujours les 17 entrées résiduelles du Lot 7.** Aucune
  ajoutée par le Lot 8C. À purger avant le Lot 13.
- **La liste des programmes est lue deux fois** sur l'écran de fiche (options du
  champ + rien d'autre) : une seule requête en pratique. Si un troisième
  appelant apparaît, mémoïser `lireOptionsProgrammes` avec `cache()`.
- **Le trou de l'écart nº 90 existe dans `programme.schema.ts` et
  `article.schema.ts`.** Une charge utile amputée y produit encore un message
  anglais. Remède connu, une chaîne par champ. À traiter au Lot 16.

---

## Ce qu'a livré le Lot 8D (détail)

### Fichiers

| Fichier | Rôle |
|---|---|
| `src/core/cms/entities/team-member.ts` | `TeamMember`, `CreateTeamMember`, `UpdateTeamMember`, **`MARQUEURS_NOM_A_FOURNIR` et `estNomAFournir()`** |
| `src/core/cms/ports/team-member.port.ts` | Les ports les plus courts du Lot 8 : `TeamMemberDeps` n'a que `read` et `write` |
| `src/core/cms/schemas/team-member.schema.ts` | 7 schémas. Messages français aux trois niveaux : champ, longueur, **et objet** (écart nº 99) |
| `src/core/use-cases/team-members/*.ts` | `create`, `update`, `delete`, `reorder`, `setStatus`, `list` (+ `listPublished`), `get` |
| `src/core/testing/in-memory-team-member.repository.ts` | Dépôt en mémoire — n'importe que le domaine |
| `src/infrastructure/supabase/mappers/team-member.mapper.ts` | Le plus simple des quatre : que des scalaires |
| `src/infrastructure/supabase/repositories/team-member.repository.ts` | Liste blanche de tri, `reorder_rows('team_members')`, échappement PostgREST |
| `src/server/deps/team-member.deps.ts` | Un seul dépôt : rien à vérifier ailleurs avant d'écrire |
| `src/server/actions/team.actions.ts` | 5 actions. Étiquettes `cms:equipe` et **`cms:page:a-propos`** (nouvelle) |
| `src/server/queries/team.query.ts` | `getMembresEquipePublies` + le raisonnement de l'écart nº 95 |
| `src/components/dashboard/team/team-member-form.tsx` | 4 champs, conversion `"" → null` de `bio`, avertissement vivant sur le nom |
| `src/components/dashboard/team/team-client.tsx` | Liste : 5 colonnes, 3 filtres, actions groupées, réordonnancement, **bandeau qui dit ce que le SITE montre** |
| `src/components/dashboard/team/team-member-editeur.tsx` | Fiche : publier / dépublier / supprimer, « Voir sur le site » conditionnel |
| `src/app/(dashboard)/dashboard/equipe/{,nouveau/,[id]/}page.tsx` | Les trois écrans. L'entrée de navigation existait depuis le Lot 5 et menait à une 404 |
| `src/components/cards/team-member-card.tsx` | Carte publique, extraite de `/a-propos` |
| `src/app/(site)/a-propos/page.tsx` | **Bascule** : `async`, `force-dynamic`, section conditionnelle, ancre `#equipe` |
| `src/content/equipe.ts` | En-tête mis à jour. ⚠️ **`rapports` y est TOUJOURS utilisé par `/impact`** — ne pas supprimer ce fichier |

### Recette exécutée — 533 vérifications, 0 échec

| Suite | Vérifs | Portée |
|---|---|---|
| 1 · code pur | 207 | marqueur (13), schémas (28) + **70 charges hostiles contre 7 schémas**, création, publication, porte de derrière, suppression / réordonnancement, lectures, mappers, matrice RBAC |
| 2 · infrastructure (base réelle) | 69 | dépôt, tri, recherche, RLS anonyme, `guard_publish` (ADB01) sur un vrai compte éditeur, `reorder_rows` + liste blanche (ADB04), clé étrangère de la photo |
| 3 · HTTP (`next start`) | 51 | **la section « L'équipe » a bien disparu**, aucune fuite du marqueur, 10 pages publiques intactes, gardes anonymes, 404, en-têtes |
| 4 · parcours navigateur (CDP) | 102 | liste + bandeau, « Publier » désactivé avec son motif, saisie du nom → publication → **la section réapparaît sur `/a-propos`**, porte de derrière refusée, dépublication puis marqueur accepté, création, `bio` vidée → `null`, réordonnancement, éditeur sans publier / supprimer, audit, suppression |
| 5 · responsive / a11y | 104 | 4 écrans × 5 largeurs (débordement, 44 px, 16 px, contraste AA), thème sombre, zoom 200 %, structure et libellés |

Les cinq suites ont été rejouées d'affilée sur l'arbre final. Banc entièrement
retiré ensuite ; base vérifiée identique à son état de départ (3 fiches,
brouillon, marqueur, positions 1-2-3, aucune photo, 1 seul profil).

### Trois points retenus

1. **La règle protège le VISITEUR, pas le site contre ses éditeurs.** C'est ce
   qui la distingue de `guard_publish` : elle ne dépend d'aucun rôle, et un
   super administrateur y est soumis. Mesuré : la base, seule, laisse
   parfaitement publier une fiche au marqueur (suite 2, C14/C15). **La garde vit
   dans le domaine, et toute écriture qui court-circuite les cas d'usage la
   contourne.**
2. **Retirer un avertissement d'une page publique n'est pas le supprimer.** Le
   badge « Nom et photo à fournir » s'adressait aux visiteurs ; il s'adresse
   maintenant à qui peut agir. La question posée à chaque bascule du Lot 8 —
   « masquer, effacer ou signaler ? » — a ici une quatrième réponse :
   **déplacer**.
3. **Une recette doit se nettoyer à l'ENTRÉE autant qu'à la sortie**
   (découverte nº 40).

### Points de vigilance légués

- **La section « L'équipe » de `/a-propos` n'apparaît plus** (écart nº 95).
  Marche à suivre : renseigner les trois noms dans `/dashboard/equipe`, puis
  publier les fiches. La garde empêche d'oublier la première moitié.
- **Les trois photos `public/images/a-propos/equipe-*.jpeg` ne sont plus
  affichées** (écart nº 97). Elles restent sur le disque ; les téléverser dans
  la médiathèque puis les choisir dans le champ « Photo ».
- **`/a-propos` affiche toujours « [À COMPLÉTER] » une fois**, dans la section
  « Gouvernance » : c'est `legal.registrationNumber` (`site-config.ts`), le
  numéro d'enregistrement de l'association. **Antérieur à ce lot et légitime** —
  l'audit (§4.9) exige que le champ existe, et inventer un numéro serait pire.
  La recette l'assertionne précisément (A08) : toute autre occurrence du
  marqueur ferait échouer la mesure.
- **Relevé hors périmètre sur `/a-propos`, à traiter au Lot 12** : 5 cibles
  sous 44 px dans l'en-tête et le pied de page (lien d'évitement 32×16, bouton
  « Don » 73×36, liens de contact et de bas de page), et le libellé
  « WhatsApp » à **4,14 de contraste** au lieu de 4,5. Mesuré, affiché par la
  suite 5, **non compté comme échec** : ces éléments ont été livrés avant ce
  lot.
- **`audit_logs` est passé de 26 à 95 entrées**, dont **53 `team_member.*`
  produites par cette recette** (voir « Environnement »). Non purgées
  volontairement — purge unique prévue au Lot 13.
- **Le trou de l'écart nº 99 (message d'objet) existe dans
  `programme.schema.ts`, `article.schema.ts` et `testimonial.schema.ts`**, comme
  celui de l'écart nº 90. À traiter ensemble au Lot 16.

---

## Ce qu'a livré le Lot 8E (détail)

### Fichiers

| Fichier | Rôle |
|---|---|
| `src/core/cms/entities/icon-name.ts` | **NOUVEAU PRIMITIF PARTAGÉ** : `ICON_NAMES`, `IconName`, `isIconName`, `ICON_NAME_REPLI`. Aucun `import` — c'est ce qui permet à un schéma Zod de s'y référer (écart nº 101) |
| `src/core/cms/entities/visibility.ts` | `VISIBILITY_LABELS`, `libelleVisibilite()`. Écrit **en vue du Lot 8G** : `stats` porte la même colonne `is_visible` |
| `src/core/cms/entities/core-value.ts` | `CoreValue`, `CreateCoreValue`, `UpdateCoreValue`. `icon: IconName` — **seul endroit du projet où la garantie existe** |
| `src/core/cms/ports/core-value.port.ts` | `findVisible` et `setVisibility`, pas `findPublished` / `setStatus` : le vocabulaire du port suit celui de la table |
| `src/core/cms/schemas/core-value.schema.ts` | 7 schémas. `z.enum(ICON_NAMES)` + `z.enum(MEDIA_TONES)` — aucune chaîne libre. Messages français aux trois niveaux d'emblée |
| `src/core/use-cases/core-values/*.ts` | `create`, `update`, `delete`, `reorder`, `setVisibility`, `list` (+ `listVisible`), `get` |
| `src/core/testing/in-memory-core-value.repository.ts` | Dépôt en mémoire — ignore `filter.status` comme le vrai (écart nº 109) |
| `src/infrastructure/supabase/mappers/core-value.mapper.ts` | Le seul mapper à conversion non triviale : le repli d'icône (écart nº 110) |
| `src/infrastructure/supabase/repositories/core-value.repository.ts` | Liste blanche de tri (`is_visible` incluse, `status` impossible), `reorder_rows('core_values')` |
| `src/components/ui-ext/icon-registry.ts` | **MODIFIÉ** : importe la liste du domaine, `ICONS: Record<IconName, LucideIcon>` — le typage qui interdit la divergence |
| `src/server/deps/core-value.deps.ts` | Un seul dépôt : `core_values` n'a aucune clé étrangère |
| `src/server/actions/values.actions.ts` | 5 actions. **TROIS étiquettes** : `cms:valeurs`, `cms:page:accueil`, `cms:page:a-propos` |
| `src/server/queries/values.query.ts` | `getValeursAffichees` — appelée par **deux** pages |
| `src/components/dashboard/feedback/visibility-badge.tsx` | 2 états. **Aucune couleur inventée** : les deux couples viennent de `<StatusBadge>`, où ils ont été mesurés |
| `src/components/dashboard/values/value-form.tsx` | 4 champs, dont les deux grilles de choix. **Aperçu rendu par le VRAI `<ValueCard>`** |
| `src/components/dashboard/values/values-client.tsx` | Liste : 5 colonnes, 2 filtres, bandeau qui dit ce que **les deux pages** montrent |
| `src/components/dashboard/values/value-editeur.tsx` | Fiche : afficher / masquer / supprimer, avertissement « dernière valeur affichée » |
| `src/app/(dashboard)/dashboard/valeurs/{,nouveau/,[id]/}page.tsx` | Les trois écrans. L'entrée de navigation existait depuis le Lot 5 (écart nº 25) et menait à une 404 |
| `src/lib/nombres.ts` | `enLettres()`, `accorde()` — le titre dérivé (écart nº 107) |
| `src/components/cards/value-card.tsx` | **MODIFIÉ** : lit `CoreValue`, résout l'icône par `<ContentIcon>`. Balisage identique à l'octet près |
| `src/app/(site)/page.tsx` · `src/app/(site)/a-propos/page.tsx` | **Bascule** : lecture en base, section conditionnelle, ancre `#valeurs`, titre dérivé sur `/a-propos` |
| `src/content/biographie.ts` | **MODIFIÉ** : `DomaineEngagement.icon` devient un NOM (écart nº 111) |
| `src/content/valeurs.ts` | En-tête mis à jour — plus importé, gardé comme référence jusqu'au Lot 16 |

### Recette exécutée — 631 vérifications, 0 échec

| Suite | Vérifs | Portée |
|---|---|---|
| 1 · code pur | 285 | registre d'icônes (37), **7 schémas × 10 charges hostiles**, `icon` contraint (35), création, neutralisation d'`isVisible`, visibilité + idempotence, suppression / réordonnancement, lectures, mappers, matrice RBAC, titre dérivé, libellés |
| 2 · infrastructure (base réelle) | 75 | **les 4 lignes comparées champ par champ à `src/content/valeurs.ts`**, RLS anonyme, ce que la base autorise à un éditeur, `reorder_rows` + liste blanche, **la base n'a aucune contrainte sur `icon`**, filtre `status` ignoré |
| 3 · HTTP (`next start`) | 75 | les 4 valeurs rendues côté serveur sur **les deux pages**, titre dérivé, ancres, gardes anonymes, 12 pages publiques intactes, `/biographie` non régressée |
| 4 · parcours navigateur (CDP) | 95 | liste + bandeau, masquage → **disparition des deux pages** et titre qui passe à « Trois », confirmation sur la dernière, création + aperçu vivant → « Cinq », éditeur bridé, POST direct refusé, réordonnancement visible des deux côtés, suppression, audit |
| 5 · responsive / a11y | 101 | 5 écrans × 5 largeurs (débordement, 44 px, 16 px, contraste AA), thème sombre, zoom 200 %, structure, **les deux grilles de choix nommées et chaque option étiquetée** |

Les cinq suites ont été rejouées d'affilée sur l'arbre final. Banc entièrement
retiré ensuite ; base vérifiée identique à son état de départ (4 valeurs, contenu
d'origine, toutes visibles, positions 1-4, 1 seul profil).

### Trois points retenus

1. **Un type mal placé est un trou de validation.** `tone` était validé par
   énumération depuis le Lot 8A, `icon` ne l'était pas — et la seule cause était
   l'étage où vivait la liste. Deux lots ont livré un champ que **n'importe
   quelle chaîne traversait**. Quand une règle ne peut pas s'écrire là où elle
   s'applique, ce n'est pas la règle qu'il faut abandonner : c'est la donnée
   qu'il faut déplacer.
2. **Un titre qui compte ce qu'il surmonte devient faux dès que la liste devient
   modifiable.** « Quatre principes » était vrai en fichier TypeScript et
   mensonger en base. Le CMS ne casse pas seulement les données qu'il déplace :
   il casse **les phrases qui les décrivaient**. `/programmes` et l'accueil
   portent le même défaut depuis le Lot 8A (écart nº 107).
3. **Informer plutôt qu'interdire, quand l'état n'est que vide.** Le Lot 8D
   refusait un état FAUX ; celui-ci autorise un état VIDE et le dit trois fois —
   bandeau, confirmation, phrase sur la fiche. Confondre les deux aurait produit
   une règle incohérente avec le reste du site.

### Points de vigilance légués

- **⚠️ Un ÉDITEUR peut retirer une valeur de l'accueil ET de « Qui sommes-nous »**
  (écart nº 104). Mesuré, conforme à la matrice et à la RLS, **et probablement
  à rediscuter** — c'est une décision de produit, pas un correctif de lot.
- **`programme.schema.ts` accepte toujours n'importe quelle chaîne comme icône**
  (écart nº 102). Le remède est écrit et éprouvé ; à appliquer au Lot 16, avec
  les trous des écarts nº 90 et 99.
- **`/programmes` annonce « Huit domaines d'intervention » et l'accueil « Voir
  les 8 programmes »** — même défaut que le titre corrigé ici, depuis le
  Lot 8A. `src/lib/nombres.ts` est prêt ; à traiter en rejouant la recette 8A.
- **`audit_logs` est passé de 95 à 117 entrées**, dont 12 `core_value.*`
  produites par cette recette. Non purgées volontairement — purge unique prévue
  au Lot 13.
- **Relevé hors périmètre, mesuré et affiché sans être compté** : à 390 px, 12
  cibles sous 44 px sur l'accueil et 4 sur `/a-propos` (bouton « Don » 73×36,
  liens de programmes 22 px de haut, coordonnées du pied de page), et
  « WhatsApp » à **4,14 de contraste** au lieu de 4,5. **Ajout du Lot 8E** :
  l'accueil **déborde horizontalement à 320 px** — coupables mesurés : les
  cartes de témoignages (`<figure>`, 340 px) et la barre fixe du bas. Tout cela
  a été livré avant ce lot ; à traiter au Lot 12.

---

## Ce qu'a livré le Lot 8F (détail)

### Fichiers

| Fichier | Rôle |
|---|---|
| `src/core/cms/entities/faq-item.ts` | `FaqItem`, `FAQ_TOPICS`, `FAQ_TOPIC_LABELS`, `FAQ_TOPIC_DESTINATIONS`, **`texteReponse()`** (écart nº 113) et **`selectionAccueil()`** (la règle de l'accueil, descendue là où le dashboard peut la DIRE). Aucun import de valeur |
| `src/core/cms/schemas/faq-item.schema.ts` | 7 schémas. `z.enum(FAQ_TOPICS)`, `pucesSchema` **facultatif** (écart nº 119), messages français aux trois niveaux d'emblée |
| `src/core/cms/ports/faq-item.port.ts` | `findPublished({ topic, limit })` — **première lecture publique du Lot 8 à prendre un paramètre de sélection** : le sujet décide de la page |
| `src/core/use-cases/faq-items/*.ts` | `create`, `update`, `delete`, `reorder`, `setStatus`, `get`, et `list` (+ `listPublished`, `listFaqAccueil`) |
| `src/core/testing/in-memory-faq-item.repository.ts` | Dépôt en mémoire — copies défensives des tableaux, et **même limite de recherche que le vrai** (pas de `ilike` sur les puces) |
| `src/infrastructure/supabase/mappers/faq-item.mapper.ts` | Repli de sujet **inatteignable** (écart nº 116) et normalisation `bullets` → `[]` |
| `src/infrastructure/supabase/repositories/faq-item.repository.ts` | Liste blanche de tri, `findPublished` filtré par sujet, `reorder_rows('faq_items')`, **le point d'interrogation conservé à la recherche** |
| `src/server/deps/faq-item.deps.ts` | Un seul dépôt : `faq_items` n'a aucune clé étrangère, dans aucun sens |
| `src/server/actions/faq.actions.ts` | 5 actions. **QUATRE étiquettes**, dont deux nouvelles (écart nº 117) |
| `src/server/queries/faq.query.ts` | `getFaqParSujet(topic)` et `getFaqAccueil()` — appelées par **trois** pages |
| `src/components/dashboard/faq/faq-item-form.tsx` | 4 champs dont le **premier `kind: "select"` du Lot 8**. `<ConsequenceDuSujet>` nomme le déplacement ; `<ApercuQuestion>` rend le VRAI `<FAQAccordion>`, déplié |
| `src/components/dashboard/faq/faq-client.tsx` | Liste : 5 colonnes dont **« Accueil »**, 3 filtres, bandeau qui dit ce que les TROIS pages montrent, signalement des doublons |
| `src/components/dashboard/faq/faq-item-editeur.tsx` | Fiche : publier / dépublier / supprimer ; lien « Voir sur le site » **dépendant du sujet ET de la position** |
| `src/app/(dashboard)/dashboard/faq/{,nouveau/,[id]/}page.tsx` | Les trois écrans. L'entrée de navigation existait depuis le Lot 5 et menait à une 404 |
| `src/components/ui-ext/faq-accordion.tsx` | **MODIFIÉ** : lit l'entité de domaine, clé par identifiant (écart nº 114), `defaultOuvert` pour l'aperçu. Balisage identique |
| `src/app/(site)/page.tsx` · `don/page.tsx` · `benevolat/page.tsx` | **Bascule** : lecture en base, section conditionnelle, ancre `#faq`, JSON-LD conditionnel et composé (écarts nº 113 et 123), deux liens en ligne corrigés (écart nº 122) |
| `src/content/faq.ts` | En-tête mis à jour — plus importé, gardé comme référence jusqu'au Lot 16 |

### Recette exécutée — 376 vérifications, 0 échec

| Suite | Vérifs | Portée |
|---|---|---|
| 1 · code pur | 118 | entité (29) dont **la contrainte SQL lue dans la migration** et la réponse composée mesurée sur la donnée réelle, **7 schémas × 10 charges hostiles**, 39 vérifications de cas d'usage, mappers, matrice RBAC comparée à celle de `team:*` |
| 2 · infrastructure (base réelle) | 59 | **les 7 lignes comparées champ par champ à `src/content/faq.ts`**, RLS anonyme (insertion REJETÉE / écriture FILTRÉE), `guard_publish` sur un vrai compte éditeur, **la contrainte `check` sur `topic` mesurée — et `core_values.icon` revérifié comme libre**, `reorder_rows`, limites de recherche |
| 3 · HTTP (`next start`) | 74 | les 3 pages publiques alimentées par la base, **le JSON-LD `FAQPage` des trois** (nombre, contenu, puces incluses, aucun HTML), gardes anonymes, 3 écrans × 2 rôles, 404, **dépublication → disparition de l'accordéon ET du balisage**, sujet vidé → section et balisage absents, 10 pages publiques intactes |
| 4 · parcours navigateur (CDP) | 57 | liste + colonne « Accueil » + bandeau, recherche et filtres, **réordonnancement bloqué pendant une recherche**, création avec aperçu vivant, validation en français reliée par `aria-describedby`, publication → accordéon + JSON-LD + **puces réellement affichées**, **changement de sujet mesuré des deux côtés**, « Monter » d'un rang en UN appel, doublon signalé sur les deux lignes, éditeur bridé + **rejeu direct → FORBIDDEN**, suppression, audit |
| 5 · responsive / a11y | 68 | 3 écrans × 5 largeurs (débordement, 44 px, 16 px, noms), contraste AA **clair et sombre** (236 textes), bascule 767/768 px, zoom 200 %, **3 sections FAQ publiques × 5 largeurs bornées à `#faq`**, réponse dépliée à 320 px |

Les cinq suites ont été rejouées d'affilée sur l'arbre final. Banc entièrement
retiré ensuite ; base vérifiée identique à son état de départ (7 questions
publiées, positions 1-7, sujets d'origine, 1 seul profil) — et **`audit_logs`
inchangé à 117 entrées, 0 de type `faq_item.*`**.

### Trois points retenus

1. **Une bascule en base ne casse pas les données : elle rend atteignables des
   états que le fichier TypeScript rendait impossibles.** Deux questions
   identiques n'existaient pas tant que la liste était relue à chaque commit —
   d'où une clé React dupliquée qui dormait depuis toujours (écart nº 114), et
   un JSON-LD qui déclarerait deux fois la même entrée (écart nº 115). Le CMS
   ne déplace pas seulement le contenu, il élargit l'ensemble des états
   possibles. **Chaque lot devrait se demander lesquels.**
2. **Un balisage n'est pas un doublon du contenu visible : il peut en être le
   seul véhicule.** Le texte des réponses n'est pas dans le HTML servi — Radix
   ne monte un accordéon qu'à l'ouverture (découverte nº 45). Ce qui rendait
   l'écart nº 113 anodin en apparence — « ce ne sont que des puces » — le rend
   au contraire structurant : c'est la seule chose qu'un moteur lit.
3. **L'absence de garde propre à un lot se CONSTATE, elle ne se comble pas.**
   Les Lots 8C et 8D en portaient une parce qu'un état faux était atteignable.
   Ici, aucun. Chercher une règle à tout prix aurait produit une contrainte que
   ni la base ni le métier ne portent — la faute que le Lot 8D avait déjà
   nommée.

### Points de vigilance légués

- **⚠️ Un ÉDITEUR peut retirer une question de l'ACCUEIL par un simple
  réordonnancement** (écart nº 120), sans avoir `faq:publish`. Mesuré, conforme
  à la matrice et à la RLS. Moins grave que l'écart nº 104 — la question reste
  en ligne sur la page de son sujet — **sauf pour un sujet `general`, qui n'a
  pas de page à lui**. À rediscuter avec l'écart nº 104 : c'est la même famille
  de décision de produit.
- **Les trous des écarts nº 90, 99 et 102 existent toujours** dans
  `programme.schema.ts`, `article.schema.ts` et `testimonial.schema.ts`. Le
  remède est écrit et éprouvé trois fois (8D, 8E, 8F). À appliquer au Lot 16.
- **`/programmes` annonce « Huit domaines d'intervention » et l'accueil « Voir
  les 8 programmes »** — écart nº 107, toujours ouvert. `src/lib/nombres.ts` est
  prêt ; à traiter en rejouant la recette 8A.
- **Relevé hors périmètre, mesuré et affiché sans être compté** : à 390 px, il
  reste **12 cibles sous 44 px sur l'accueil, 5 sur `/don`, 7 sur
  `/benevolat`** — toutes HORS de la section FAQ (en-tête, bouton « Don », liens
  du pied de page). Les deux qui étaient DANS le périmètre ont été corrigées
  (écart nº 122). Aucune de ces trois pages ne déborde horizontalement à
  390 px. À traiter au Lot 12.
- **Le sitemap ne gagne aucune adresse** : une question n'a pas de page à elle.
  Vérifié (suite 3, I10).

---

## Ce qu'a livré le Lot 8G (détail)

### Fichiers

| Fichier | Rôle |
|---|---|
| `src/core/cms/entities/stat.ts` | `Stat`, `CreateStat`, **`CreateStatRow`** (écart nº 124), `UpdateStat`, `VALEUR_ABSENTE`, `MENTION_VALEUR_ABSENTE`, `VALEUR_MAX`, `chiffreDisponible()`, `libelleValeur()`. Le tiret et sa mention descendent ici : quatre écrans les affichent, quatre recopies auraient fini par diverger |
| `src/core/cms/schemas/stat.schema.ts` | 7 schémas. `value` **nullable** avec un message de TYPE qui nomme les deux issues, `.min(0)`, `.max(2 147 483 647)` ; `z.enum(ICON_NAMES)` ; `key` absent de tout contrat d'entrée |
| `src/core/cms/ports/stat.port.ts` | `findVisible` et `setVisibility` (vocabulaire 8E), plus **`findByKey`** — la seule méthode que `CoreValuePort` n'a pas, et elle n'a qu'un appelant : le contrôle d'unicité à la création |
| `src/core/use-cases/stats/*.ts` | `create` (clé dérivée + unicité), `update` (neutralise `isVisible` **et** `key`), `delete`, `reorder`, `setVisibility`, `get`, `list` (+ `listVisible`) |
| `src/core/testing/in-memory-stat.repository.ts` | Dépôt en mémoire — **même limite de recherche que le vrai** (pas de `ilike` sur `value`), et `input.value` recopié tel quel |
| `src/infrastructure/supabase/mappers/stat.mapper.ts` | **Le fichier le plus sensible du lot** : `toStatUpdate` distingue `undefined` (non transmis), `null` (inconnu) et `0` (valeur). Repli d'icône du Lot 8E |
| `src/infrastructure/supabase/repositories/stat.repository.ts` | Liste blanche de tri (`value`, `to_confirm`, `is_visible` incluses), `findByKey`, `reorder_rows('stats')`, recherche sur `label` et `note` seulement |
| `src/server/deps/stat.deps.ts` | Un seul dépôt : `stats` n'a aucune clé étrangère, dans aucun sens |
| `src/server/actions/stats.actions.ts` | 5 actions. **TROIS étiquettes**, dont `cms:page:impact` qui est nouvelle |
| `src/server/queries/stats.query.ts` | `getChiffresAffiches()` — appelée par **deux** pages, et qui ne filtre PAS les chiffres sans valeur |
| `src/components/dashboard/stats/stat-form.tsx` | 6 champs dont le **premier appelant de `kind: "number"` depuis le Lot 6**. `<ApercuChiffre>` rend le VRAI `<StatCard>` et **démontre l'invariant nº 1 avant enregistrement** |
| `src/components/dashboard/stats/stats-client.tsx` | Liste : 6 colonnes dont « Chiffre » et « À revalider », 3 filtres, **deux bandeaux** (ce que le site montre · ce qui reste à consolider), libellés en double signalés |
| `src/components/dashboard/stats/stat-editeur.tsx` | Fiche : afficher / masquer / supprimer, deux liens « Visible sur », clé technique en lecture seule, et la phrase qui dit ce que le site affiche AUJOURD'HUI |
| `src/app/(dashboard)/dashboard/chiffres/{,nouveau/,[id]/}page.tsx` | Les trois écrans. L'entrée de navigation existait depuis le Lot 5 et menait à une 404 |
| `src/components/cards/stat-card.tsx` | **MODIFIÉ** : lit l'entité de domaine, résout l'icône par `<ContentIcon>`, `stat.value === null` jamais `!stat.value`. Balisage identique à l'octet près |
| `src/components/dashboard/forms/fields/basic-fields.tsx` | **MODIFIÉ** : `NumberField` corrigé (écart nº 126). Décocher la case laisse le champ vide au lieu d'y écrire `0` |
| `src/app/(site)/page.tsx` · `src/app/(site)/impact/page.tsx` | **Bascule** : lecture en base, section conditionnelle, ancre `#chiffres`, et `force-dynamic` sur `/impact` qui était entièrement statique (écart nº 131) |
| `src/content/stats.ts` | En-tête mis à jour — plus importé, gardé comme référence jusqu'au Lot 16 |

### Recette exécutée — 740 vérifications, 0 échec

| Suite | Vérifs | Portée |
|---|---|---|
| 1 · code pur | 265 | entité et invariant (37) dont **les contraintes lues dans les migrations 0005, 0009 et 0012** et une recherche littérale de `?? 0` dans les six fichiers de la chaîne, **7 schémas × 10 charges hostiles**, `value` sous tous ses angles (null, 0, négatif, décimal, borne int4 exacte, champ vide), 66 vérifications de cas d'usage, mappers (**les trois états du PATCH**), matrice RBAC comparée terme à terme à `value:*` |
| 2 · infrastructure (base réelle) | 121 | **les 4 lignes comparées champ par champ à `src/content/stats.ts`**, dont les **deux valeurs autrefois calculées** ; ce que la base autorise vraiment (`22003` au dépassement, `-42` accepté, `icon` libre, `23505` sur la clé, `NULL` par défaut) ; RLS anonyme (insertion **rejetée**, écriture **filtrée**), éditeur (**il masque, il ne crée ni ne supprime**), administrateur ; tri, `NULL` en tête ou en queue, recherche, `reorder_rows`, `ADB04` |
| 3 · HTTP (`next start`) | 113 | les 2 pages publiques alimentées par la base, **la précision sur `/impact` et pas sur l'accueil**, `to_confirm` qui ne fuit pas, 4 200 → « — » → 0 mesurés sur la page servie, **tout masquer fait disparaître titre ET sous-titre**, gardes anonymes, 3 écrans × 2 rôles, 404, 10 pages publiques intactes, sitemap inchangé |
| 4 · parcours navigateur (CDP) | 107 | liste + colonnes + bandeaux, recherche, **création avec la case cochée → `NULL` relu EN BASE**, écart nº 126 mesuré, message des deux issues relié par `aria-describedby`, **null → 4 200 → null → 0** depuis l'interface, masquer/réafficher, « Monter » dans le menu d'actions, suppression nommée, **rejeu de la requête de l'administrateur depuis la session de l'éditeur → `FORBIDDEN`**, audit produit puis purgé |
| 5 · responsive / a11y | 134 | 3 écrans × 5 largeurs (débordement, 44 px, 16 px sous `md:`, noms), contraste AA **clair et sombre** (240 textes), bascule 767/768 px, zoom 200 %, **2 sections publiques × 5 largeurs bornées à `#chiffres`**, tiret et mention à 320 px, zone sensible de la case mesurée au point |

Les cinq suites ont été rejouées d'affilée sur l'arbre final. Banc entièrement
retiré ensuite ; base vérifiée identique à son état de départ (4 chiffres,
`beneficiaires` à `NULL`, positions 1-4, tous visibles, 1 seul profil) — et
**`audit_logs` inchangé à 138 entrées, 0 de type `stat.*`**.

### Trois points retenus

1. **Un champ écrit sans appelant est un champ non livré.** `kind: "number"` et
   sa case « pas encore disponible » dormaient depuis le Lot 6, recettés en
   apparence. Le premier écran à s'en servir a trouvé, en une manipulation, que
   **décocher la case écrivait `0`** — le zéro non décidé, dans le geste même
   qui annule la garde censée l'empêcher. Un composant du design system n'est
   éprouvé que par un écran réel ; le banc de démonstration ne suffit pas.
2. **Une correction non mesurée n'est pas une correction.** La première version
   du remède écrivait `undefined` : elle était juste en intention, et
   **inopérante** — react-hook-form substitue le défaut à toute valeur
   `undefined` (découverte nº 51). La case refusait de se décocher, sans la
   moindre erreur. Ce qui l'a rattrapée n'est pas la relecture, c'est la
   recette navigateur. **Ce lot a produit deux défauts et les a trouvés
   lui-même** : c'est le rôle de la recette, pas un accident.
3. **Une sonde trop stricte est aussi fausse qu'une sonde trop laxiste — et
   plus dangereuse.** Les mesures d'accessibilité ont rapporté 26 fautes par
   écran sur des cibles toutes conformes (découverte nº 49) et exigé 16 px là
   où le design system écrit `md:text-sm` (nº 50). Les « corriger » aurait
   défait le correctif du Lot 8A et condamné tous les écrans recettés depuis le
   Lot 6. La découverte nº 44 se lit dans les deux sens : **corriger
   l'assertion quand elle mesure la mauvaise chose**, et c'était le cas quatre
   fois dans ce lot.

### Points de vigilance légués

- **⚠️ Un ÉDITEUR peut retirer un chiffre de l'accueil ET de `/impact`**
  (écart nº 130). L'écart nº 104 sur la seconde table qui porte `is_visible`.
  Mesuré, conforme à la matrice et à la RLS, **et à rediscuter avec les écarts
  nº 104 et 120** : c'est la même famille de décision de produit, et elle en est
  maintenant à sa troisième occurrence.
- **⚠️ `annees` vaut 6 et ne s'incrémentera plus.** Le seed a figé une valeur qui
  était calculée (`année courante − 2020`). La recette a mesuré qu'elle coïncide
  ENCORE avec le calcul en 2026 ; **au 1ᵉʳ janvier 2027 elle sera fausse.** La
  ligne porte `to_confirm = true` et l'écran de liste la compte, mais rien ne la
  corrigera tout seul. Même remarque pour `programmes`, figé à 8 : il faudra le
  mettre à jour le jour où un neuvième programme est publié.
- **Les trous des écarts nº 90, 99 et 102 existent toujours** dans
  `programme.schema.ts`, `article.schema.ts` et `testimonial.schema.ts`. Le
  remède est écrit et éprouvé quatre fois (8D, 8E, 8F, 8G). À appliquer au
  Lot 16.
- **`/programmes` annonce « Huit domaines d'intervention » et l'accueil « Voir
  les 8 programmes »** — écart nº 107, toujours ouvert. `src/lib/nombres.ts` est
  prêt ; à traiter en rejouant la recette 8A.
- **La section des chiffres, elle, n'a AUCUN titre qui compte** : ni l'accueil
  (`<h2 class="sr-only">Nos chiffres clés</h2>`) ni `/impact` (« Nos chiffres »)
  n'annoncent un nombre. Le défaut de l'écart nº 107 ne se rejoue donc pas ici —
  vérifié, pas supposé.
- **Relevé hors périmètre, mesuré et non compté** : les sondes de cibles et de
  contraste ont été bornées à `#chiffres` sur les deux pages publiques, et
  **rien n'y dépasse**. Le relevé hors périmètre du Lot 8F (12 cibles sous 44 px
  sur l'accueil, 5 sur `/don`, 7 sur `/benevolat`) est inchangé — ce lot n'y a
  ni ajouté ni retranché. À traiter au Lot 12.
- **Le sitemap ne gagne aucune adresse** : un chiffre n'a pas de page à lui.
  Vérifié (suite 3, D21).
- **`rate_limits` et `media_assets` intacts** : 4 lignes et 1 média, comme au
  Lot 8F. Aucune recette de ce lot n'a touché à la limitation de débit.

---

## Ce qu'a livré le Lot 8H (détail)

### Fichiers

| Fichier | Rôle |
|---|---|
| `src/core/cms/entities/gallery.ts` | `GalleryItem`, `GalleryCategory` et leurs types d'écriture, `CATEGORIE_ABSENTE`, `TEINTE_SANS_CATEGORIE`, `apparaitDansUnFiltre()`, `categoriesAffichees()`, `teinteDeLElement()`, `libelleDeLaCategorie()`. **Les trois règles d'affichage de la page publique vivent ici**, parce que le dashboard doit pouvoir les DIRE |
| `src/core/cms/schemas/gallery.schema.ts` | 11 schémas. `mediaId` obligatoire avec un message qui parle de PHOTO ; `categoryId` nullable ; `tone` en `z.enum` ; sentinelle `SANS_CATEGORIE` pour Radix ; messages français aux trois niveaux dès la première version |
| `src/core/cms/ports/gallery.port.ts` | Quatre interfaces (élément × lecture/écriture, catégorie × lecture/écriture) et deux regroupements. **`countByCategory` et `countByMedia`** — les deux clés étrangères de la table la plus liée du Lot 8 |
| `src/core/use-cases/gallery/*.ts` | `create` (catégorie vérifiée), `update` (statut neutralisé, déclassement autorisé), `delete` (renumérotation), `reorder`, `setStatus`, `get`, `list` (+ `listPublished`), et `manage-gallery-categories.ts` (5 fonctions) |
| `src/core/testing/in-memory-gallery.repository.ts` | Deux dépôts en mémoire — **avec la même limite de recherche que les vrais** |
| `src/infrastructure/supabase/mappers/gallery.mapper.ts` | **Le fichier le plus sensible du lot** : `toGalleryItemUpdate` distingue `undefined` (non transmis) de `null` (déclassement). Aucun repli — les deux colonnes sont des énumérés (écart nº 142) |
| `src/infrastructure/supabase/repositories/gallery-item.repository.ts` | Liste blanche de tri, `nullsFirst: false`, `countByCategory`, `countByMedia`, `reorder_rows('gallery_items')`, **et `filter.search` IGNORÉ, avec son motif écrit en tête** |
| `src/infrastructure/supabase/repositories/gallery-category.repository.ts` | Dépôt séparé — les deux tables n'ont pas les mêmes droits en base |
| `src/server/deps/gallery.deps.ts` | Un client, deux dépôts ; deux fabriques d'écriture, deux ports de lecture seule |
| `src/server/actions/gallery.actions.ts` | 5 actions. Deux étiquettes, dont `cms:page:galerie` qui est nouvelle |
| `src/server/actions/gallery-categories.actions.ts` | 4 actions. **`gallery:publish` pour la création** — écart nº 70 qui se rejoue |
| `src/server/queries/gallery.query.ts` | `getElementsGalerie()` et `getCategoriesGalerie()`. L'en-tête compare ligne à ligne ce que faisait la lecture de disque et ce qui la remplace |
| `src/components/dashboard/gallery/gallery-item-form.tsx` | 2 champs — **premier appelant qui EXIGE une photo**. `<ApercuElement>` rend la vraie `<GalleryGrid>` et montre quel filtre atteindra la photo |
| `src/components/dashboard/gallery/gallery-client.tsx` | Liste : 4 colonnes, 2 filtres, recherche sur un texte venu d'une autre table, bandeau à cinq messages (photos en ligne, sans catégorie, catégories vides, doublons, photos illisibles) |
| `src/components/dashboard/gallery/gallery-item-editeur.tsx` | Fiche : publier / dépublier / retirer, lien « Visible sur » sans réserve, avertissement de classement |
| `src/components/dashboard/gallery/gallery-categories-modal.tsx` | Modale : ajout, renommage, **teinte**, réordonnancement, décompte par ligne, droits reproduits à l'identique de la RLS |
| `src/app/(dashboard)/dashboard/galerie/{,nouveau/,[id]/}page.tsx` | Les trois écrans. L'entrée de navigation existait depuis le Lot 5 et menait à une 404 |
| `src/app/(site)/galerie/page.tsx` | **Bascule** : lecture en base, résolution des médias, section conditionnelle, ancre `#galerie`, `force-dynamic` |
| `src/components/galerie/gallery-grid.tsx` | **MODIFIÉ** : boutons de filtre portés à 44 px (écart nº 147). L'API du composant est inchangée |
| `src/infrastructure/storage/storage.ts` | **MODIFIÉ, hors périmètre** : le corps téléversé est ré-étiqueté avec le type réel (écart nº 145) |
| `src/infrastructure/supabase/repositories/media.repository.ts` | **MODIFIÉ, hors périmètre** : « Photo nº position », sans le `+ 1` (écart nº 146) |
| `src/content/galerie.ts` | En-tête récrit — plus importé, gardé comme référence jusqu'au Lot 16 |

### Recette exécutée — 489 vérifications, 0 échec

| Suite | Vérifs | Portée |
|---|---|---|
| 1 · code pur | 124 | entité et règles d'affichage (14), invariants cherchés dans le CODE (9), **11 schémas × 10 charges hostiles** sans un seul message anglais, 33 vérifications de cas d'usage, catégories (22), mappers dont **les trois états du PATCH**, matrice RBAC comparée terme à terme aux permissions réellement déclarées par les 9 actions, et le dépôt en mémoire jusque dans ce qu'il NE FAIT PAS |
| 2 · infrastructure (base réelle) | 74 | **les 4 lignes migrées comparées champ par champ à ce que `src/content/galerie.ts` produisait** (fichier, texte alternatif, catégorie, ordre, dossier, bucket, type MIME, nom régénéré, dimensions) ; **le `Content-Type` réellement servi par le CDN** ; ce que la base autorise vraiment (22P02 sur la teinte, 23502 sans média, 23503 sur les deux clés étrangères, `category_id` nullable, même photo deux fois) ; tri, `null` en queue, `reorder_rows` ; RLS anonyme (insertion **rejetée**, écriture **filtrée**), éditeur (**il crée et modifie, il ne publie ni ne supprime, et ne crée aucune catégorie**), administrateur |
| 3 · HTTP (`next start`) | 80 | `/galerie` alimentée par la base — les quatre textes alternatifs migrés, les quatre boutons, l'ancre, **les vignettes qui viennent de Storage et plus de `/public`** ; 10 pages publiques intactes ; sitemap inchangé et **sans adresse nouvelle** ; gardes anonymes ; 3 écrans × 2 rôles ; 404 sur un identifiant inconnu **et sur un identifiant qui n'est pas un UUID** ; titres d'onglet |
| 4 · parcours navigateur (CDP) | 101 | liste + colonnes + vignettes + bandeaux, **recherche par description ET par nom de fichier**, refus d'enregistrer sans photo (message + `role=alert` + icône), **les 5 options du `<Select>` qui n'apparaissent qu'à l'ouverture**, choix d'un média dans la médiathèque, aperçu, création relue EN BASE, **déclassement → `NULL` relu en base**, publication, effet sur la page publique (5 photos, 5 boutons, filtre qui exclut la non classée, visionneuse), modale des catégories × 2 rôles, **rejeu d'une Server Action depuis la session de l'éditeur → `FORBIDDEN`**, « Monter » d'UN rang, suppression nommée qui laisse le fichier, audit produit puis purgé |
| 5 · responsive / a11y | 110 | 3 écrans × 5 largeurs (débordement, 44 px, noms accessibles, 16 px sous `md:`), bascule 767/768 px, **section `#galerie` × 5 largeurs bornée à son périmètre** (débordement, cibles, nombre de colonnes), zoom 200 %, contraste AA **clair et sombre** sur 4 périmètres (257 couples composés), relevé hors périmètre affiché et non compté |

Les cinq suites ont été rejouées d'affilée sur l'arbre final, toutes à 0 échec et
code de sortie 0. Banc entièrement retiré ensuite ; base vérifiée : 4 éléments
publiés en positions 1-4, 4 catégories, 5 médias, **1 seul profil**, et
**`audit_logs` sans aucune entrée `gallery*`**.

### Trois points retenus

1. **Un chemin de code qu'aucune donnée n'atteint n'est pas éprouvé.** Deux
   défauts réels dormaient depuis le Lot 7, et ils ont été réveillés par la même
   cause : `gallery_items` était VIDE. Le libellé « Photo nº 2 » pour la
   position 1 (écart nº 146) vivait dans une branche qui ne pouvait renvoyer
   aucune ligne ; le téléversement au type ignoré (écart nº 145) n'avait jamais
   rencontré autre chose qu'un navigateur, qui renseigne toujours `File.type`.
   C'est la leçon nº 1 du Lot 8G — « un champ écrit sans appelant est un champ
   non livré » — appliquée non plus à un composant mais à une TABLE.
2. **La sonde qui accuse est plus dangereuse que la sonde qui dort.** Trois fois
   dans ce lot, une mesure a désigné du code correct : les options d'un
   `<Select>` absentes du HTML servi (nº 52), la première capture d'action qui
   était une lecture (nº 54), et surtout un thème forcé que `next-themes`
   reprenait en cours de mesure (nº 55) — cette dernière rapportait **1,06:1 sur
   la barre latérale du Lot 5**, un composant livré et recetté. « Corriger »
   l'un de ces trois aurait cassé quelque chose qui marche. La découverte nº 44
   se lit dans les deux sens, et il faut savoir de quel côté on est AVANT de
   toucher au code.
3. **Un test qui réussit parce que sa donnée manque occupe la place d'une
   vérification** (découverte nº 56). `undefined !== null` vaut `true` ;
   `insuffisants.length === 0` est vrai quand rien n'a été mesuré. Les deux ont
   été trouvés dans ce lot, et les deux passaient en vert. Toute sonde qui
   compte exige désormais `mesures > 0`, et toute assertion sur une donnée lue
   commence par vérifier qu'elle existe.

### Points de vigilance légués

- **⚠️ Déposer un fichier dans `public/images/galerie/` ne fait PLUS rien.**
  C'était la promesse de `src/content/galerie.ts` — « l'association dépose ses
  photos en respectant la convention `categorie-NN.jpg` et elles apparaissent
  automatiquement ». La marche à suivre est désormais : Médiathèque →
  téléverser, puis Galerie → « Ajouter une photo ». C'est un geste de plus, et
  c'est le prix du reste : une photo cataloguée porte sa description
  (obligatoire, WCAG 1.1.1), son auteur, ses usages et son statut.
- **⚠️ Les quatre textes alternatifs migrés sont ceux que le site GÉNÉRAIT** —
  « Action ADEBES — éducation (photo 1) ». Ils ne décrivent pas les photos : ils
  disent seulement de quelle catégorie elles relèvent. Ce n'est pas un contenu
  inventé (c'est exactement ce qui était affiché), et il devient enfin
  corrigeable, depuis la médiathèque. **À reprendre par l'utilisateur, une photo
  à la fois.** C'est le premier vrai bénéfice du lot pour un lecteur d'écran.
- **⚠️ Un ÉDITEUR peut RENOMMER une catégorie et RÉORDONNER la grille** sans
  avoir `gallery:publish`. Renommer change le libellé d'un bouton de filtre sur
  la page publique. Ce n'est PAS de la même famille que les écarts nº 104, 120
  et 130 — rien ne disparaît, aucun contenu n'est retiré du site — mais c'est le
  quatrième endroit où un éditeur modifie ce que voit un visiteur. La liste
  s'allonge ; elle mérite d'être regardée d'un bloc, une fois, plutôt que lot
  par lot.
- **Le relevé hors périmètre de `/galerie` à 390 px** : 4 cibles sous 44 px, et
  **aucune dans `#galerie`** — « Aller au contenu principal » (32 × 16), le
  bouton « Don » de l'en-tête (73 × 36), le téléphone et l'e-mail du pied de
  page (127 × 20 et 136 × 20). Mêmes familles que le relevé du Lot 8F. À traiter
  au Lot 12.
- **Le sitemap ne gagne aucune adresse** : une photo n'a pas de page à elle.
  Vérifié (suite 3, B13).
- **`rate_limits` intact** : 4 lignes, dont les deux clés de l'adresse réelle de
  l'utilisateur. Les recettes n'ont remis à zéro que les clés `connexion:` de la
  boucle locale.
- **Les trous des écarts nº 90, 99 et 102 existent toujours** dans
  `programme.schema.ts`, `article.schema.ts` et `testimonial.schema.ts`. Le
  remède est écrit et éprouvé cinq fois (8D à 8H). À appliquer au Lot 16.
- **`/programmes` annonce « Huit domaines d'intervention » et l'accueil « Voir
  les 8 programmes »** — écart nº 107, toujours ouvert. `src/lib/nombres.ts` est
  prêt. La galerie, elle, n'annonce aucun nombre en dur : son compteur
  (« 4 photos ») est dérivé de la sélection courante, y compris filtrée.

---

## Ce qu'a livré le Lot 8I (détail)

### Fichiers

| Fichier | Rôle |
|---|---|
| `src/core/cms/entities/annual-report.ts` | `AnnualReport` et ses types d'écriture, `ANNEE_MIN`/`ANNEE_MAX`, `aUnDocument()`, `ordreSuitLesAnnees()`, `anneesEnDoublon()`, et **les trois libellés que la page publique affiche** (`MENTION_AVEC_DOCUMENT`, `MENTION_SANS_DOCUMENT`, `PASTILLE_SANS_DOCUMENT`) — descendus ici parce que trois écrans les affichent. L'en-tête écrit AU LONG pourquoi ce lot n'est pas le Lot 8H |
| `src/core/cms/schemas/annual-report.schema.ts` | 7 schémas. `year` bornée et entière, `title` `.trim()` avant `.min()`, `documentMediaId` **nullable** ; messages français aux trois niveaux dès la première version ; **pas de sentinelle**, contrairement au Lot 8H — `MediaField` porte nativement `null` |
| `src/core/cms/ports/annual-report.port.ts` | Deux interfaces et un regroupement. **`findByYear`** — la seule méthode que les huit autres collections n'ont pas |
| `src/core/use-cases/annual-reports/*.ts` | `create` (année unique), `update` (unicité revérifiée hors de soi-même, statut neutralisé), `delete` (renumérotation), `reorder`, `setStatus` (**sans garde, et le fichier dit pourquoi**), `get`, `list` (+ `listPublished`) |
| `src/core/testing/in-memory-annual-report.repository.ts` | Dépôt en mémoire — **avec la même recherche que le vrai, et sans imposer l'unicité** (c'est le cas d'usage qui la porte) |
| `src/infrastructure/supabase/mappers/annual-report.mapper.ts` | Aucun repli (les colonnes sont des énumérés ou des `not null`) ; `toAnnualReportUpdate` distingue `undefined` de `null` sur `documentMediaId` **et** sur `year`, où `0` serait falsy |
| `src/infrastructure/supabase/repositories/annual-report.repository.ts` | Liste blanche de tri, `nullsFirst: false`, `findByYear` en `maybeSingle` (la colonne est `unique`), `countByMedia`, `reorder_rows('annual_reports')`, et **`clauseRecherche()` qui n'ajoute `year` que pour une saisie entière** |
| `src/server/deps/annual-report.deps.ts` | Un client, un dépôt. **La neuvième et dernière fabrique de la série 8** |
| `src/server/actions/annual-reports.actions.ts` | 5 actions. Deux étiquettes, dont `cms:page:impact` **déjà posée par le Lot 8G** |
| `src/server/queries/annual-report.query.ts` | `getRapportsAnnuels()`. L'en-tête compare ligne à ligne ce que faisait le tableau TypeScript et ce qui le remplace |
| `src/components/dashboard/documents/annual-report-form.tsx` | 3 champs — **premier appelant de `<MediaPicker accept="document">`**. `<ApercuRapport>` montre la bascule entre les deux états, et le nom de fichier que le visiteur téléchargera |
| `src/components/dashboard/documents/annual-reports-client.tsx` | Liste : 4 colonnes, 2 filtres, recherche sur titre + année + nom de fichier, bandeau à cinq messages (rapports en ligne, sans PDF, ordre en désaccord, années en double, PDF partagé ou introuvable) |
| `src/components/dashboard/documents/annual-report-editeur.tsx` | Fiche : publier / dépublier / supprimer, lien « Visible sur » vers `#documents`, **quatre phrases d'état** là où le Lot 8H en avait deux |
| `src/app/(dashboard)/dashboard/documents/{,nouveau/,[id]/}page.tsx` | Les trois écrans. L'entrée de navigation existait depuis le Lot 5 et menait à une 404 — **la dernière des neuf** |
| `src/app/(site)/impact/page.tsx` | **MODIFIÉ, bascule** : lecture en base, résolution des médias, section conditionnelle, ancre `#documents`, bouton porté à 44 px. `force-dynamic` **inchangé** — il était déjà là pour les chiffres |
| `src/lib/media-url.ts` | **MODIFIÉ** : `urlTelechargementMedia()` ajouté (écart nº 160) |
| `src/content/equipe.ts` | En-tête récrit — **plus AUCUN export de ce fichier n'est importé**. Le Lot 16 peut le supprimer entièrement |
| `supabase/seed.sql` | **MODIFIÉ** : les deux rapports passent en `'published'` (écart nº 151), avec le motif écrit dans le commentaire |

### Recette exécutée — 475 vérifications, 0 échec

| Suite | Vérifs | Portée |
|---|---|---|
| 1 · code pur | 114 | entité et règles d'ordre (16), **invariants cherchés dans le CODE dépourvu de ses commentaires** (15), 7 schémas × 10 charges hostiles sans un seul message anglais (115 messages inspectés), 38 vérifications de cas d'usage dont **la publication sans PDF**, les trois états du PATCH, matrice RBAC comparée terme à terme aux permissions réellement déclarées, et le dépôt en mémoire jusque dans ce qu'il NE FAIT PAS |
| 2 · infrastructure (base réelle) | 74 | **parité champ à champ avec ce que `src/content/equipe.ts` produisait** (année, titre, absence de PDF, ordre) ; ce que la base autorise vraiment (23505, 23502, 23503, 22P02, **`document_media_id` NULL accepté, publication sans PDF acceptée**) ; dépôt complet, dont la recherche sur colonne `integer` dans les deux sens ; `reorder_rows` et rétablissement ; **la chaîne du DOCUMENT de bout en bout** — PDF réel téléversé, bucket déduit des octets, `Content-Type` servi par le CDN, `?download=` et son `Content-Disposition`, usage bloquant, refus 23503 à la suppression du média ; RLS anonyme, éditeur (**il crée et modifie, il ne publie ni ne supprime**), administrateur (**il publie un rapport SANS PDF**) |
| 3 · HTTP (`next start`) | 59 | `/impact` alimentée par la base — les deux titres, les deux mentions, les deux pastilles, l'ancre, **et l'ancien chemin `/documents/*.pdf` disparu** ; 11 pages publiques intactes ; sitemap inchangé et **sans adresse nouvelle** ; gardes anonymes ; 3 écrans × 2 rôles ; 404 sur un identifiant inconnu **et sur un identifiant qui n'est pas un UUID** ; titres d'onglet ; commandes de la fiche par rôle |
| 4 · parcours navigateur (CDP) | 96 | liste + colonnes + bandeau, **recherche par année ENTIÈRE et PARTIELLE**, les options du filtre qui n'apparaissent qu'à l'ouverture, **menu de ligne ouvert × 2 rôles**, refus d'enregistrer à vide et hors bornes (messages français), aperçu qui suit la saisie, création relue EN BASE, **`<MediaPicker>` en mode document**, **publication SANS PDF puis effet sur `/impact`**, avertissement d'ordre qui apparaît, persiste après un « Monter » et **disparaît après le second**, modification par l'éditeur relue en base, suppression nommée, audit produit puis purgé |
| 5 · responsive / a11y | 132 | 3 écrans × 5 largeurs (débordement, 44 px avec les trois parades de la découverte nº 49, noms accessibles, 16 px sous `md:`), bascule 767/768 px, **section `#documents` × 5 largeurs bornée à son périmètre**, zoom 200 %, contraste AA **clair et sombre** sur 4 périmètres (158 couples composés), relevé hors périmètre affiché et non compté |

Les cinq suites ont été rejouées d'affilée sur l'arbre final, toutes à 0 échec et
code de sortie 0. Banc entièrement retiré ensuite ; base vérifiée : **2 rapports
publiés en positions 1 et 2, sans PDF**, 5 médias (aucun PDF), 4 éléments de
galerie, **1 seul profil**, `audit_logs` **sans aucune entrée `annual_report*` ni
aucune entrée datée d'aujourd'hui**, et le dossier `rapports` du bucket
`documents` vide.

### Trois points retenus

1. **Le lot qui ressemble le plus au précédent est celui où il faut le moins le
   recopier.** `document_media_id` est une référence de média en
   `on delete restrict`, exactement comme `gallery_items.media_id` — à un mot
   près : elle est NULLABLE. Ce mot renverse la garde de publication, le
   comportement d'un média non résolu (affiché ici, retiré là), la nécessité
   d'une sentinelle dans le schéma, et jusqu'au nombre de phrases d'état de la
   fiche. Le fichier `set-annual-report-status.ts` porte le tableau comparatif
   des quatre lots à garde, non pas pour expliquer ce qu'il fait, mais pour que
   personne ne « répare » plus tard une garde qui n'a jamais manqué.
2. **Un défaut qu'aucune lecture n'atteint n'est pas un défaut — jusqu'à la
   bascule.** Le seed écrivait les deux rapports en `draft` avec un motif
   plausible et faux. Personne ne lisait la table : l'erreur était invisible, et
   elle serait devenue une régression complète de la section Documents au moment
   exact où la page a commencé à lire la base. C'est le motif du Lot 8 dans sa
   forme la plus pure — **la bascule ne casse rien, elle rend atteignable ce que
   le fichier TypeScript rendait impossible** — appliqué cette fois non à un
   composant ni à une table, mais à une DONNÉE seedée.
3. **Une recette doit rendre l'état numérique, pas seulement les lignes.** Trois
   défauts du banc ont été trouvés à la vérification finale, et aucun n'était
   visible sur une suite prise isolément : `process.exit()` dans un `try` sautait
   la purge (découverte nº 59), la suppression de lignes de recette laissait les
   vraies en positions 2 et 3 (nº 60), et la suite navigateur réordonnait les
   deux rapports de l'utilisateur sans les remettre (nº 60 encore). Les trois se
   sont manifestés par des échecs qui désignaient du code correct, sur trois
   suites différentes. **C'est l'enchaînement des suites qui les a révélés, pas
   leur exécution individuelle.**

### Points de vigilance légués

- **⚠️ Déposer un PDF dans `public/documents/` ne fait PLUS rien** — et ce
  dossier n'a d'ailleurs jamais existé. La marche à suivre est : Médiathèque →
  téléverser le PDF, puis Documents → ouvrir le rapport et choisir le fichier.
  C'est un geste de plus, et c'est le prix du reste : un document catalogué
  porte son poids, son type réel et ses usages, et ne peut plus être supprimé
  par accident tant qu'un rapport pointe dessus.
- **⚠️ Les deux rapports sont EN LIGNE et SANS PDF**, ce qui est exactement ce
  que le site affichait déjà. Le premier vrai PDF déposé fera apparaître son
  bouton « Télécharger » sans autre geste. **C'est le premier bénéfice concret
  du lot pour l'utilisateur**, et il ne demande aucune intervention technique.
- **⚠️ L'ordre des rapports et leurs années peuvent diverger.** Un rapport créé
  se place en FIN de liste, quelle que soit son année. L'écran le signale, il ne
  corrige pas. C'est la seule collection du projet dans ce cas, et c'est aussi
  le seul endroit où une recette peut abîmer des données réelles sans le voir —
  voir la découverte nº 60.
- **⚠️ `errors.ts` traduit tout 23505 par « Cette adresse est déjà utilisée »**,
  avec un `fieldErrors.slug`. C'est faux pour toute collection sans `slug`, et
  ce lot le contourne en vérifiant l'unicité en amont. Le remède général — lire
  le nom de la contrainte violée — est à écrire **au Lot 16**.
- **⚠️ La section Documents de `/impact` n'est pas un composant.** Son balisage
  est écrit en clair dans la page, et l'aperçu du dashboard le redessine
  (écart nº 165). Seuls les libellés sont partagés, via le domaine. **Le Lot 9,
  qui extrait des blocs de rendu, est l'occasion de la sortir.**
- **Le relevé hors périmètre de `/impact` à 390 px** : 5 cibles sous 44 px, et
  **aucune dans `#documents`** — « Aller au contenu principal » (32 × 16), le
  bouton « Don » de l'en-tête (73 × 36), **« Nos programmes » (115 × 17)**, le
  téléphone et l'e-mail du pied de page (127 × 20 et 136 × 20). Les quatre
  premières familles sont celles des Lots 8F et 8H ; **« Nos programmes » est
  nouvelle** — c'est le lien en ligne de la section « Zones d'intervention » de
  cette page. À traiter au Lot 12.
- **Le sitemap ne gagne aucune adresse** : un rapport n'a pas de page à lui.
  Vérifié (suite 3, B13).
- **Les trous des écarts nº 90, 99 et 102 existent toujours** dans
  `programme.schema.ts`, `article.schema.ts` et `testimonial.schema.ts`. Le
  remède est écrit et éprouvé six fois (8D à 8I). À appliquer au Lot 16.
- **`/programmes` annonce « Huit domaines d'intervention » et l'accueil « Voir
  les 8 programmes »** — écart nº 107, toujours ouvert. `src/lib/nombres.ts` est
  prêt.
- **La liste des endroits où un ÉDITEUR modifie ce que voit un visiteur
  s'allonge encore** : après les écarts nº 104, 120, 130 et le renommage de
  catégorie du Lot 8H, il peut désormais **réordonner les rapports d'activité et
  corriger leur titre en ligne**. Rien ne disparaît, aucun contenu n'est retiré,
  mais c'est le cinquième endroit. **Le Lot 8 est clos : cette liste mérite
  d'être regardée d'un bloc, une fois, plutôt que lot par lot.**

---

## Prochaine étape : Lot 9 — constructeur de pages et de sections

**La série 8 est close.** Les neuf collections sont livrées, recettées, et
aucune page publique ne lit plus `src/content/` pour une donnée de collection.

Le Lot 9 est décrit au §9 du Rapport 2 — « la Famille B, le lot le plus
structurant du CMS » : les **17 blocs** du §10 du Rapport 1, chacun avec
`schema`, `defaults`, `fields` et `Renderer`, plus le registre qui les agrège,
et l'écran qui compose une page à partir d'eux.

Ce que la série 8 lègue et qui compte pour le Lot 9 :

- **`BlockDescriptor` NE POURRA PAS vivre dans `core/`** — écart nº 41, consigné
  dès le Lot 6 dans `core/cms/blocks/types.ts` pour que le Lot 9 ne découvre pas
  le mur en cours de route. Le §10 le déclare avec `icon: LucideIcon` et
  `Renderer: ComponentType`, deux types que la règle de dépendance interdit à
  `core/`. Le partage devra suivre le patron de `MediaTone` (écart nº 6).
- **`page_sections` porte déjà 30 sections SQUELETTES** (écart nº 15) :
  `block_type` et `position` sont posés, `content` est vide, et
  `SectionRenderer` ignore une section invalide sans casser la page. Le contenu
  est explicitement le travail de ce lot.
- **Le gabarit est stable sur NEUF collections**, en deux variantes : à cycle
  éditorial (8A–8D, 8F, 8H, 8I) et à visibilité binaire (8E, 8G). Les écrans du
  Lot 9 ne ressemblent à aucun des deux — une page n'est pas une collection —
  mais `<SchemaForm>`, `<DataTable>`, `<FormModal>` et `<ConfirmDialog>` sont
  désormais éprouvés par neuf appelants réels.
- **Trois sections publiques attendent d'être extraites en composants** : les
  lignes de la section Documents de `/impact` (écart nº 165), et plus
  généralement tout ce que les pages écrivent en clair. Un `Renderer` de bloc
  est exactement la forme qui le permet.
- **Le module CDP est à réécrire à chaque lot**, et ses parades sont acquises :
  dimensionner avant de mesurer (nº 31, 41), attendre une condition (nº 33) et
  la BONNE (nº 48, nº 61), saisie relue (nº 37), contexte isolé par rôle
  (nº 36), purge à l'entrée (nº 40) **et rétablissement des positions (nº 60)**,
  bornage au périmètre (nº 42–43, **nº 63**), IIFE async (nº 46), attendre la
  mutation (nº 47), zone sensible composée (nº 49), 16 px sous `md:` (nº 50),
  options de Radix absentes du HTML (nº 52), capture choisie par son contenu
  (nº 54), thème écrit dans `localStorage` puis rechargé (nº 55), sonde qui
  mesure zéro (nº 56), libellé préfixe d'un autre (nº 57), **vrai clic de souris
  pour un `DropdownMenu` (nº 58)**, **code de sortie rendu et non `exit()`
  (nº 59)**, **sonde de code privée de ses commentaires (nº 62)**.
- **Purger le journal d'audit en fin de recette** : quatre lots de suite l'ont
  fait, et le contrôle qui compte est la mesure DATÉE, pas le compteur global.
- **Vérifier le disque AVANT de commencer** (nº 35) : `npm-cache` d'abord, puis
  `.next/cache`. Il restait **2,6 Go** au démarrage de ce lot — la marge est
  désormais mince. `npm cache clean --force` et la purge de `.next/cache` ont
  rendu 260 Mo, ce qui a suffi, mais ce sera à surveiller de près au Lot 9, qui
  touchera beaucoup plus de fichiers.

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
