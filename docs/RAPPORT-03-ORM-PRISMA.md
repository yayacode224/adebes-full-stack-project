# Rapport 3 — Faut-il un ORM (Prisma) sur ce projet ?

> **Objet.** Décider si l'accès aux données passe par Prisma ou reste sur le
> client Supabase, tel que le fixe la décision D7 du
> [Rapport 1](./RAPPORT-01-ARCHITECTURE.md).
>
> **Moment.** La question se tranche avant le Lot 3. Le Lot 1 (11 migrations,
> 2 231 lignes de SQL) est écrit ; les Lots 2 et 3 ne le sont pas. C'est le
> dernier point où le choix coûte peu.

---

## Verdict

**Non. Pas de Prisma sur ce projet.** On continue comme prévu.

Ce n'est pas un rejet de Prisma — c'est un bon outil, et il y a des projets où
je le recommanderais sans hésiter. C'est un constat sur **cette** architecture :
la sécurité du CMS repose sur les politiques RLS de PostgreSQL, et Prisma, par
construction, ne les fait pas fonctionner. Adopter Prisma ici, ce n'est pas
changer d'outil de requêtage, c'est **retirer la troisième barrière de sécurité**
du §9 du Rapport 1 et la remplacer par de la discipline applicative.

Le reste de ce rapport détaille pourquoi, puis dit honnêtement dans quels cas la
réponse serait inverse.

---

## 1. Ce que Prisma apporterait réellement

Commençons par le pour, sans le minimiser.

| Apport | Réel ? | Commentaire |
|---|:---:|---|
| Sécurité de type de bout en bout | ⚠️ | Réel, mais **déjà obtenu autrement** — voir §5. |
| Ergonomie des jointures | ✅ | Vrai avantage. `include: { category: true }` est plus lisible qu'un `select()` imbriqué PostgREST. |
| Migrations versionnées | ⚠️ | Déjà en place, et Prisma en exprime mal le contenu — voir §2.3. |
| Portabilité hors Supabase | ⚠️ | Déjà obtenue par les Ports & Adapters — voir §5. |
| `prisma studio`, DX familière | ✅ | Vrai confort. Supabase Studio couvre à peu près le même besoin. |
| Écriture de requêtes complexes | ✅ | Agrégations, `groupBy`, relations profondes : Prisma est plus à l'aise. |

Deux apports authentiques, donc : **l'ergonomie relationnelle** et **le confort
de développement**. Retenons-les, ils reviendront au §6.

---

## 2. Les cinq points de rupture avec l'architecture décidée

### 2.1 Prisma ne sait pas qui est l'utilisateur — et la RLS non plus

C'est le point décisif. Tout le reste est secondaire.

**Comment la sécurité fonctionne aujourd'hui.** Le client Supabase parle à
PostgREST en HTTP, en joignant le JWT de l'utilisateur. PostgREST ouvre la
transaction en posant ce JWT dans une variable de session PostgreSQL. C'est ce
qui fait que `auth.uid()` renvoie une valeur, donc que
`public.app_current_role()` renvoie un rôle, donc que **les 92 politiques du
fichier `0009_rls_policies.sql` s'appliquent**.

**Ce que fait Prisma.** Prisma ouvre une connexion PostgreSQL classique, via une
chaîne de connexion, avec **un seul rôle de base pour toute l'application**. Il
n'y a plus de JWT, plus d'utilisateur courant. Deux issues, toutes deux
mauvaises :

- Connexion avec le rôle propriétaire (`postgres`, celui de la chaîne de
  connexion Supabase par défaut) : **le propriétaire d'une table contourne la
  RLS**. Les politiques ne sont pas violées, elles ne sont simplement jamais
  évaluées. Toutes les données sont lisibles et modifiables par toute requête
  que l'application émet.
- Connexion avec un rôle non privilégié : `auth.uid()` renvoie `null`,
  `app_current_role()` renvoie `null`, **aucune politique ne matche** et
  l'application ne voit plus rien.

Il existe un contournement : encapsuler chaque requête dans une transaction qui
pose manuellement les variables de session (`SET LOCAL`) à partir du JWT, via une
extension Prisma Client. Ça fonctionne. Mais :

- il faut que **100 %** des requêtes passent par cette extension — une seule qui
  y échappe s'exécute sans RLS, silencieusement ;
- `SET LOCAL` n'est fiable **que dans une transaction** ; hors transaction, avec
  un pooler en mode `transaction`, le réglage peut fuiter vers la requête
  suivante d'un autre utilisateur ;
- on réintroduit à la main, et de façon faillible, ce que PostgREST fait
  nativement et de façon vérifiable.

Or le §9 du Rapport 1 décrit la RLS comme la barrière qui « protège **même en
cas de bug applicatif ou de clé anon fuitée** ». Une barrière dont la validité
dépend de la discipline applicative n'est plus une troisième barrière : c'est un
doublon de la deuxième.

> **Conséquence directe.** La décision D7 (quatre fabriques de clients aux
> garanties distinctes) et le §9 (triple barrière) n'ont plus de sens avec
> Prisma. Ce n'est pas un détail d'implémentation : c'est la colonne vertébrale
> sécurité du CMS.

### 2.2 Prisma ne remplacerait rien — il s'ajouterait

Même avec Prisma, le client Supabase reste **obligatoire** pour :

- l'authentification (`signInWithPassword`, sessions par cookies, `getUser()`) ;
- Supabase Storage (les deux buckets du fichier `0011_storage.sql`, l'upload,
  les URL publiques, les transformations d'image) ;
- l'API d'administration (`auth.admin.inviteUserByEmail()`, Lot 13).

On n'échange donc pas une dépendance contre une autre : on **ajoute** une
seconde pile d'accès aux données, avec sa propre configuration, son propre
cache, son propre modèle de connexion, et une seconde source de vérité sur le
schéma. Pour une équipe d'une personne sur un site associatif, c'est une charge
de maintenance permanente sans contrepartie.

### 2.3 `schema.prisma` ne sait pas exprimer ce qui est déjà écrit

Le Lot 1 contient, en plus des tables :

| Objet | Nombre | Prisma sait le déclarer ? |
|---|---|---|
| Politiques RLS | 92 | ❌ |
| Fonctions SQL / PL/pgSQL | 8 | ❌ |
| Triggers | 27 | ❌ |
| Buckets et politiques Storage | 2 + 4 | ❌ |
| Contrainte `deferrable initially deferred` | 1 | ❌ |
| SQLSTATE personnalisés (`ADB01`–`ADB03`) | 3 | ❌ |
| Types énumérés | 4 | ✅ |
| Tables, colonnes, index, clés étrangères | — | ✅ |

Prisma ne modélise que la dernière ligne et demie. Tout le reste continuerait de
vivre dans des fichiers SQL à part, appliqués par `prisma migrate` en mode
« migration non gérée ». On se retrouverait avec **deux systèmes de migration
qui décrivent la même base**, dont un seul connaît la sécurité. C'est
exactement la configuration où un `prisma migrate dev` finit un jour par
régénérer une table et faire disparaître ses politiques.

### 2.4 Le pooling de connexions en serverless

Le déploiement cible est Vercel (§16.5 du Rapport 2), donc des fonctions
serverless : beaucoup d'instances, chacune de courte durée.

- **Aujourd'hui** : le client Supabase parle en HTTP à PostgREST. Aucune
  connexion PostgreSQL n'est ouverte par l'application. Il n'y a rien à pooler,
  et donc rien à régler.
- **Avec Prisma** : chaque instance ouvre de vraies connexions PostgreSQL. Il
  faut passer par le pooler Supabase en mode transaction, désactiver les
  requêtes préparées côté Prisma, et surveiller la saturation du pool. Ça se
  fait, c'est documenté, mais c'est une classe entière de pannes de production
  que l'architecture actuelle n'a tout simplement pas.

### 2.5 Cache Components (décision D4)

Le §11 du Rapport 1 impose que les lectures publiques mises en cache utilisent
`createPublicClient()` — un client **sans cookies**, qui s'authentifie comme
`anon` et à qui **la RLS ne laisse voir que le contenu publié**. Ce n'est pas
une commodité : c'est ce qui garantit qu'un brouillon ne peut pas fuiter dans
un scope `'use cache'`, même par erreur de requête.

Avec Prisma, ce client n'existe pas. Une requête dans un scope `'use cache'`
verrait tout, et la distinction publié / brouillon redeviendrait une clause
`where` qu'un développeur peut oublier. La règle ESLint déjà en place
(`src/server/queries/**` ne peut pas importer `clients/server`) deviendrait sans
objet.

---

## 3. Le coût réel de la bascule, aujourd'hui

Si la décision était « oui », voici ce qu'il faudrait faire :

1. Écrire `schema.prisma` reflétant les 21 tables (introspection possible, mais
   à relire ligne à ligne).
2. Décider du sort des 11 migrations existantes : les conserver en migrations
   non gérées, ou les rejouer sous Prisma en gardant le SQL de sécurité à part.
3. Écrire et tester l'extension Prisma de propagation du JWT pour la RLS, et
   garantir qu'aucune requête ne la contourne.
4. Configurer le pooler, désactiver les requêtes préparées, tester la charge.
5. Conserver malgré tout le client Supabase pour auth, Storage et admin.
6. Réécrire les décisions D1, D4, D7, le §9, le §11 et le §16 du Rapport 1, et
   les Lots 3, 4, 12 et 15 du Rapport 2.

Estimation : **3 à 5 jours**, dont une part significative sur la sécurité —
c'est-à-dire sur la partie où une erreur ne se voit pas en recette. À comparer
au gain du §1 : de l'ergonomie de jointure.

---

## 4. « Mais alors on n'a pas d'ORM ? »

Si, en réalité — juste pas un ORM acheté sur étagère.

Le §6 du Rapport 1 met déjà en place les trois pièces qui constituent la valeur
d'un ORM dans une architecture propre :

| Pièce | Où | Ce qu'elle apporte |
|---|---|---|
| **Repository** | `core/cms/ports/*.port.ts` + `infrastructure/supabase/repositories/*` | Le domaine ignore totalement la base. C'est *plus* de découplage que Prisma, dont les types fuitent en général jusque dans l'UI. |
| **Mapper / DTO** | `infrastructure/supabase/mappers/*` | Seul endroit qui connaît `snake_case`. Aucun composant ne voit jamais `cover_media_id`. |
| **Types générés** | `database.types.ts` via `supabase gen types typescript` | Types dérivés du **schéma réel**, y compris colonnes nullables et énumérés. |

Sur le point qui inquiète le plus légitimement — la sécurité de type — la
différence est faible : Prisma génère ses types depuis `schema.prisma`, Supabase
depuis la base elle-même. La seconde source est même la plus fiable des deux,
puisqu'elle ne peut pas dériver du réel.

Et sur la portabilité : les Ports & Adapters font que remplacer Supabase par
autre chose (Prisma inclus, un jour) ne touche **aucun fichier de `src/core/`**.
Le choix d'aujourd'hui n'est donc pas irréversible — c'est précisément ce que
l'architecture a été conçue pour garantir.

---

## 5. Quand la réponse serait « oui »

Par honnêteté, les conditions dans lesquelles je recommanderais Prisma :

- **La sécurité ne repose pas sur la RLS** mais entièrement sur la couche
  applicative, et c'est assumé et documenté.
- **Pas de Supabase Auth** : l'identité vient d'ailleurs (NextAuth, Clerk,
  un SSO d'entreprise), donc `auth.uid()` n'existe de toute façon pas.
- **Le modèle relationnel est lourd** : jointures à quatre niveaux, agrégations,
  rapports. Ce n'est pas le cas ici — le CMS fait des listes filtrées par statut
  et triées par `position`.
- **Un serveur long-vécu** (conteneur, VPS) plutôt que du serverless, où le
  pooling de connexions est un non-sujet.
- **Une équipe déjà rodée à Prisma**, où le gain de vitesse compense le reste.

Aucune de ces cinq conditions n'est remplie sur ADEBES. La première et la
deuxième sont même explicitement contredites par les décisions D1 et D7.

---

## 6. Et si le vrai besoin est l'ergonomie des requêtes ?

C'est le seul grief solide contre `supabase-js`, et il mérite une réponse plutôt
qu'un haussement d'épaules. Trois remarques :

1. **PostgREST fait les jointures**, et plutôt bien :
   `select('*, category:article_categories(*), cover:media_assets(*)')` couvre
   la quasi-totalité des besoins de ce CMS.
2. **Quand ça ne suffit pas, on écrit du SQL.** Le §3.4 du Rapport 2 le fait
   déjà pour `reorder_rows()` : une fonction SQL appelée en RPC. C'est la bonne
   réponse pour les cas complexes, et elle reste soumise à la RLS.
3. **La laideur est confinée.** Une requête PostgREST verbeuse vit dans un
   repository, derrière un port. Elle n'est lue ni par le domaine, ni par
   l'interface. C'est exactement le rôle de cette couche.

Si, malgré tout, le confort d'écriture devient un point de blocage réel en cours
de route, l'option à examiner sera **Kysely** (constructeur de requêtes typé,
sans runtime lourd) sur les seules lectures de confiance côté serveur — pas
Prisma, et pas sur les chemins soumis à la RLS. À rouvrir seulement si le besoin
se manifeste concrètement.

---

## Décision

| | |
|---|---|
| **Choix** | Pas de Prisma. Accès aux données par le client Supabase, derrière les Ports & Repositories du §6. |
| **Raison principale** | Prisma neutralise les politiques RLS, c'est-à-dire la troisième barrière de sécurité du §9. |
| **Raison secondaire** | Il s'ajouterait au client Supabase au lieu de le remplacer, et dupliquerait la source de vérité du schéma. |
| **Impact sur les Rapports 1 et 2** | **Aucun.** Les décisions D1, D4, D7, le §9 et le §11 restent valables tels quels. |
| **Réversibilité** | Bonne. Les Ports & Adapters isolent `src/core/` : un changement d'infrastructure ne touche aucun fichier du domaine. |
| **À rouvrir si** | L'une des cinq conditions du §5 devient vraie, ou si l'ergonomie de requêtage bloque réellement — et dans ce cas, examiner Kysely avant Prisma. |
