# État d'implémentation du mini CMS ADEBES

> **Objet.** Fichier de suivi **vivant**. Il dit à tout moment où en est le chantier
> décrit par le [Rapport 1](./RAPPORT-01-ARCHITECTURE.md) (décisions) et le
> [Rapport 2](./RAPPORT-02-PLAN-IMPLEMENTATION.md) (ordre des travaux).
>
> Les deux rapports sont **figés** : ils décrivent la cible. Ce fichier est le seul qui
> bouge. Toute divergence entre le code et les rapports se consigne ici, dans le
> [registre des écarts](#registre-des-écarts), avant d'être corrigée ou entérinée.

**Dernière mise à jour :** 2026-08-28
**Lot en cours :** aucun — chantier non démarré
**Prochaine action :** Lot 0 — §0.1 installation des dépendances

---

## Comment tenir ce fichier

Cinq règles. Elles évitent que le suivi devienne du folklore.

1. **Mettre à jour à chaque fin de séance de travail**, pas seulement à la fin d'un lot.
   Un lot dure plusieurs jours ; un suivi mis à jour une fois par lot ne sert à rien le
   jour où l'on reprend après une interruption.
2. **Un lot n'est `✅ Terminé` que si toute sa recette est cochée**, recette responsive
   comprise. Un lot à 90 % est `🟡 En cours` — jamais « terminé, il reste juste… ».
   C'est la règle 1 du Rapport 2, appliquée au suivi.
3. **Renseigner le commit** qui clôt le lot : c'est ce qui permet de revenir en arrière
   sans archéologie.
4. **Tout écart par rapport aux rapports se consigne**, même mineur, même justifié. Un
   écart non écrit devient une surprise trois lots plus tard.
5. **Ne rien anticiper.** On ne coche pas ce qui n'a pas été vérifié, on n'écrit pas
   « fait » pour un lot dont la recette n'a pas été passée. Ce fichier n'a de valeur que
   s'il est exact.

### Légende des statuts

| Symbole | Signification |
|---|---|
| ⬜ | Non commencé |
| 🟡 | En cours |
| 🔵 | Livré, recette en cours |
| ✅ | Terminé — recette complète cochée, `build` et `tsc` verts |
| ⛔ | Bloqué — la cause est décrite dans [Blocages](#blocages-en-cours) |
| ⏭️ | Volontairement reporté — la décision est datée et justifiée |

---

## Tableau de bord général

| Lot | Titre | Statut | Début | Fin | Commit de clôture |
|---|---|:---:|---|---|---|
| 0 | Préparation du terrain | ⬜ | — | — | — |
| 1 | Base de données et RLS | ⬜ | — | — | — |
| 2 | Noyau de domaine | ⬜ | — | — | — |
| 3 | Infrastructure Supabase | ⬜ | — | — | — |
| 4 | Authentification, session, RBAC | ⬜ | — | — | — |
| 5 | Coquille du dashboard | ⬜ | — | — | — |
| 6 | Design system du dashboard | ⬜ | — | — | — |
| 7 | Médiathèque | ⬜ | — | — | — |
| 8A | Programmes (référence) | ⬜ | — | — | — |
| 8B | Actualités | ⬜ | — | — | — |
| 8C | Témoignages | ⬜ | — | — | — |
| 8D | Équipe | ⬜ | — | — | — |
| 8E | Valeurs | ⬜ | — | — | — |
| 8F | Questions fréquentes | ⬜ | — | — | — |
| 8G | Chiffres clés | ⬜ | — | — | — |
| 8H | Galerie | ⬜ | — | — | — |
| 8I | Documents | ⬜ | — | — | — |
| 9 | Constructeur de pages | ⬜ | — | — | — |
| 10 | Réglages du site | ⬜ | — | — | — |
| 11 | Éditeur de thème | ⬜ | — | — | — |
| 12 | Workflow éditorial | ⬜ | — | — | — |
| 13 | Utilisateurs et audit | ⬜ | — | — | — |
| 14 | Boîte de réception | ⬜ | — | — | — |
| 15 | Bascule du site public et cache | ⬜ | — | — | — |
| 16 | Durcissement et mise en ligne | ⬜ | — | — | — |

**Avancement :** 0 / 25 lots terminés.

### Santé du dépôt

Relevé à chaque fin de séance. Une case rouge bloque le lot suivant (règles 2 et 3 du
Rapport 2).

| Vérification | Commande | État | Dernier passage |
|---|---|:---:|---|
| Build | `npm run build` | ⬜ | — |
| Types | `npx tsc --noEmit` | ⬜ | — |
| Lint | `npx eslint .` | ⬜ | — |
| Types Supabase à jour | `npm run db:types` | ⬜ | — |

---

## Suivi de la responsivité

Le dashboard doit être **full responsive** : cette exigence est fixée au §12 du
Rapport 1 et rappelée en règle 8 du Rapport 2. Elle se suit ici séparément, parce
qu'elle se vérifie écran par écran et qu'un écran non vérifié est un écran non conforme.

### Matrice de conformité par écran

Cinq largeurs de référence : **320** (petit téléphone / zoom 200 %), **390** (téléphone
courant), **768** (tablette portrait), **1024** (portable), **1440** (bureau).
Un écran n'est conforme que si les cinq colonnes sont vertes.

| Écran | Lot | 320 | 390 | 768 | 1024 | 1440 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Connexion / mot de passe oublié | 4 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Coquille (sidebar + topbar) | 5 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Tableau de bord d'accueil | 5 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| `/dashboard/_demo` (banc d'essai) | 6 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Médiathèque + `MediaPicker` | 7 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Liste Programmes | 8A | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Formulaire Programme | 8A | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Actualités (liste + formulaire) | 8B | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Témoignages | 8C | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Équipe | 8D | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Valeurs | 8E | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Questions fréquentes | 8F | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Chiffres clés | 8G | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Galerie | 8H | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Documents | 8I | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Liste des pages | 9 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Éditeur de page (3 zones / onglets) | 9 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Réglages (6 écrans) | 10 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Éditeur de thème | 11 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Historique des versions | 12 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Utilisateurs | 13 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Journal d'audit | 13 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Boîte de réception | 14 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

### Invariants responsive à vérifier sur chaque écran

Ces sept points sont ce que « conforme » veut dire dans la matrice ci-dessus.

- [ ] Aucun défilement horizontal de page :
      `document.documentElement.scrollWidth === window.innerWidth`.
- [ ] Toutes les actions disponibles au bureau sont **atteignables** au téléphone
      (déplacées si nécessaire, jamais supprimées).
- [ ] Toutes les cibles tactiles ≥ 44 px, à **toutes** les largeurs.
- [ ] Aucune information ni action portée uniquement par le survol.
- [ ] Les surfaces plein écran utilisent `dvh`, jamais `vh`.
- [ ] Les barres fixes en bas respectent `env(safe-area-inset-bottom)`.
- [ ] Champs de saisie ≥ 16 px sous `md:` (pas de zoom automatique iOS).

### Vérifications globales de fin de chantier (Lot 16)

- [ ] `grep -rn "min-h-screen\|h-screen\|100vh" src/components/dashboard/ src/app/\(dashboard\)/` → vide
- [ ] `grep -rn "window.innerWidth\|matchMedia" src/ --include=*.ts --include=*.tsx` → uniquement `src/hooks/use-breakpoint.ts`
- [ ] Aucun point de rupture personnalisé ni `@media` en dur
- [ ] Lighthouse mobile ≥ 90 (Performance, Accessibilité, Bonnes pratiques)
- [ ] Test sur un téléphone **réel**, pas seulement en émulation

---

## Fiches de lot

Une fiche par lot. Elle se remplit **pendant** le lot, pas après.
Modèle à recopier pour tout nouveau lot :

```markdown
### Lot X — Titre
**Statut :** ⬜ · **Début :** — · **Fin :** — · **Commit :** —

**Livré**
- (fichiers ou fonctionnalités effectivement en place)

**Recette** — cocher uniquement ce qui a été vérifié
- [ ] (reprendre la recette du Rapport 2)
- [ ] Recette responsive (si lot d'interface)

**Écarts / décisions** — voir le registre des écarts
**Reste à faire**
```

---

### Lot 0 — Préparation du terrain

**Statut :** ⬜ · **Début :** — · **Fin :** — · **Commit :** —

**Livré**
- —

**Recette** *(Rapport 2, recette du Lot 0)*
- [ ] `npm run build` passe, site public inchangé
- [ ] Projet Supabase créé (`eu-west-3`) et lié
- [ ] `.env.local` renseigné, `.env.example` documenté, aucun secret commité
- [ ] `remotePatterns` Supabase ajouté à `next.config.ts`
- [ ] Règles ESLint d'architecture actives et **testées** (import interdit → erreur)

**Écarts / décisions**
- —

**Reste à faire**
- Tout.

---

### Lot 1 — Base de données et RLS

**Statut :** ⬜ · **Début :** — · **Fin :** — · **Commit :** —

**Livré**
- —

**Recette**
- [ ] `npx supabase db reset` sans erreur (11 migrations + seed)
- [ ] `database.types.ts` généré et compilable
- [ ] Pas de récursion RLS sur `profiles`
- [ ] Tests `anon` : 8 programmes, 0 membre d'équipe, erreur sur `profiles`
- [ ] Trigger « dernier super_admin » vérifié
- [ ] `stats.beneficiaires.value IS NULL`

**Écarts / décisions**
- —

---

### Lot 2 — Noyau de domaine

**Statut :** ⬜ · **Début :** — · **Fin :** — · **Commit :** —

**Recette**
- [ ] `src/core/` sans import interdit (ESLint le confirme)
- [ ] Matrice RBAC : les 3 cas de `can()` du Rapport 2 renvoient `false`
- [ ] `slugify` : les 2 cas français attendus
- [ ] Registre de 22 icônes, repli `Sparkles` fonctionnel
- [ ] Cas d'usage testables avec un port en mémoire

**Écarts / décisions**
- —

---

### Lot 3 — Infrastructure Supabase

**Statut :** ⬜ · **Début :** — · **Fin :** — · **Commit :** —

**Recette**
- [ ] `npm run db:types` opérationnel
- [ ] Une implémentation Supabase par port
- [ ] `createAdminClient` importé dans 4 fichiers au plus
- [ ] Erreur d'unicité → `AppError('CONFLICT')` en français
- [ ] `reorder_rows` : refus sur `profiles`, succès sur `programmes`

**Écarts / décisions**
- —

---

### Lot 4 — Authentification, session, RBAC

**Statut :** ⬜ · **Début :** — · **Fin :** — · **Commit :** —

**Recette**
- [ ] 29 routes publiques OK après déplacement en `(site)`
- [ ] Redirections `/dashboard` ⇄ `/connexion` conformes
- [ ] Dashboard sans `SiteHeader` ni `SiteFooter`
- [ ] Compte désactivé refusé avec le message dédié
- [ ] Action protégée appelée par un `editor` → `{ ok: false, code: 'FORBIDDEN' }`
- [ ] Session persistante après rechargement et 1 h d'inactivité
- [ ] Aucun `middleware` dans le code (`proxy.ts` uniquement)
- [ ] Écrans d'authentification conformes à la matrice responsive

**Écarts / décisions**
- —

---

### Lot 5 — Coquille du dashboard

**Statut :** ⬜ · **Début :** — · **Fin :** — · **Commit :** —

**Recette fonctionnelle**
- [ ] Sidebar complète, utilisateur identifié
- [ ] Entrées interdites **absentes du DOM** pour un `editor`
- [ ] État rétracté persistant
- [ ] Thème clair/sombre opérationnel
- [ ] Clavier et focus visible partout

**Recette responsive** *(socle de tous les lots suivants)*
- [ ] Aucun défilement horizontal aux 5 largeurs
- [ ] Tiroir `Sheet` sous 1024 px, fermé à la navigation, `h-dvh` effectif
- [ ] Sidebar rétractée : `aria-label` sur chaque icône
- [ ] `grep` `h-screen` / `100vh` → vide
- [ ] `grep` `window.innerWidth` / `matchMedia` → `use-breakpoint.ts` seul
- [ ] `pb-action-bar` retiré des routes du dashboard

**Écarts / décisions**
- —

---

### Lot 6 — Design system du dashboard

**Statut :** ⬜ · **Début :** — · **Fin :** — · **Commit :** —

**Recette fonctionnelle**
- [ ] 6 composants livrés et exercés sur `/dashboard/_demo`
- [ ] `<DataTable>` : 4 états
- [ ] Confirmation de fermeture si `isDirty`, pas sinon
- [ ] `<SchemaForm>` : 11 types de champs, erreurs Zod sur le bon champ
- [ ] Champ `number` nullable → `null` enregistrable
- [ ] Clavier + `role="alert"` + contraste AA (clair et sombre)

**Recette responsive**
- [ ] Bascule cartes ⇄ tableau au pixel (767 / 768 px), `<table>` absent du DOM en mobile
- [ ] Squelettes dans les deux formes, sans saut de mise en page
- [ ] `<FormModal>` en `Sheet` plein écran à 390 px, en-tête et pied fixes
- [ ] Aucun clignotement de modale (valeur SSR stable de `useIsDesktop`)
- [ ] Pas de zoom iOS à la mise au point (champs ≥ 16 px)
- [ ] Glisser-déposer sans faux déclenchement au défilement + alternative Monter/Descendre
- [ ] Actions groupées atteignables au téléphone
- [ ] Zoom 200 % sans perte de fonctionnalité

**Écarts / décisions**
- —

---

### Lot 7 — Médiathèque

**Statut :** ⬜ · **Début :** — · **Fin :** — · **Commit :** —

**Recette**
- [ ] 5 Mo accepté, 12 Mo refusé avec message clair
- [ ] `.exe` renommé `.jpg` refusé (MIME réel)
- [ ] Texte alternatif obligatoire
- [ ] Image affichée via `next/image` sans erreur de domaine
- [ ] Suppression d'un média utilisé : usages listés + confirmation
- [ ] `editor` : téléverse mais ne supprime pas
- [ ] Nom de fichier régénéré (`<uuid>.<ext>`)
- [ ] Responsive : grille 2 colonnes à 390 px, détail plein écran, prise de photo
      (`capture="environment"`) fonctionnelle

**Écarts / décisions**
- —

---

### Lot 8A — Programmes *(implémentation de référence)*

**Statut :** ⬜ · **Début :** — · **Fin :** — · **Commit :** —

**Recette**
- [ ] Création visible sur `/programmes` **après publication seulement**
- [ ] Slug proposé, modifiable, doublon refusé sur le bon champ
- [ ] Réordonnancement persistant et reflété sur le site
- [ ] `editor` : pas de bouton « Publier », action directe → `FORBIDDEN`
- [ ] Suppression d'un programme référencé : message explicite
- [ ] Les 8 programmes rendus à l'identique
- [ ] Formulaire bénévolat alimenté par la base
- [ ] Journal d'audit : une entrée par mutation
- [ ] **Parcours complet réalisé à 390 px** (lister → créer → enregistrer → publier)
- [ ] `npm run build` passe

**Écarts / décisions**
- —

> Ce lot est le gabarit des huit suivants. Toute imperfection non corrigée ici sera
> répliquée huit fois.

---

### Lots 8B → 8I — Les huit autres collections

| Lot | Collection | Statut | CRUD | Réordre | Publication | Site public | Responsive | Commit |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| 8B | Actualités | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| 8C | Témoignages | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| 8D | Équipe | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| 8E | Valeurs | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| 8F | Questions fréquentes | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| 8G | Chiffres clés | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| 8H | Galerie | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| 8I | Documents | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |

**Points de vigilance rappelés** (Rapport 2) : 8C consentement obligatoire ·
8G `NULL` jamais converti en `0` · 8H `legendes.json` migré vers `alt_text` ·
8I lien masqué si le PDF est absent.

**Suivi du retrait de `src/content/`** — une collection n'est finie que si plus aucune
page ne l'importe :

| Fichier | Encore importé ? |
|---|:---:|
| `programmes.ts` | ⬜ oui |
| `actualites.ts` | ⬜ oui |
| `temoignages.ts` | ⬜ oui |
| `equipe.ts` | ⬜ oui |
| `valeurs.ts` | ⬜ oui |
| `faq.ts` | ⬜ oui |
| `stats.ts` | ⬜ oui |
| `galerie.ts` | ⬜ oui |
| `biographie.ts` | ⬜ oui |

---

### Lot 9 — Constructeur de pages

**Statut :** ⬜ · **Début :** — · **Fin :** — · **Commit :** —

**Suivi des 17 blocs**

| Bloc | Schéma | Champs | Renderer | Bloc | Schéma | Champs | Renderer |
|---|:---:|:---:|:---:|---|:---:|:---:|:---:|
| `page-hero` | ⬜ | ⬜ | ⬜ | `cta-banner` | ⬜ | ⬜ | ⬜ |
| `rich-text` | ⬜ | ⬜ | ⬜ | `gallery-preview` | ⬜ | ⬜ | ⬜ |
| `image-text` | ⬜ | ⬜ | ⬜ | `video` | ⬜ | ⬜ | ⬜ |
| `stats-grid` | ⬜ | ⬜ | ⬜ | `documents-list` | ⬜ | ⬜ | ⬜ |
| `values-grid` | ⬜ | ⬜ | ⬜ | `contact-info` | ⬜ | ⬜ | ⬜ |
| `programmes-grid` | ⬜ | ⬜ | ⬜ | `donation-options` | ⬜ | ⬜ | ⬜ |
| `news-grid` | ⬜ | ⬜ | ⬜ | `feature-list` | ⬜ | ⬜ | ⬜ |
| `testimonials` | ⬜ | ⬜ | ⬜ | | | | |
| `team-grid` | ⬜ | ⬜ | ⬜ | | | | |
| `faq` | ⬜ | ⬜ | ⬜ | | | | |

**Migration des 10 pages éditoriales** *(rendu identique avant/après)*

| Page | Sections migrées | Rendu vérifié |
|---|:---:|:---:|
| `/` | ⬜ | ⬜ |
| `/a-propos` | ⬜ | ⬜ |
| `/biographie` | ⬜ | ⬜ |
| `/programmes` | ⬜ | ⬜ |
| `/impact` | ⬜ | ⬜ |
| `/actualites` | ⬜ | ⬜ |
| `/galerie` | ⬜ | ⬜ |
| `/don` | ⬜ | ⬜ |
| `/benevolat` | ⬜ | ⬜ |
| `/contact` | ⬜ | ⬜ |

**Recette**
- [ ] Ajouter / réordonner / masquer / dupliquer / supprimer une section persiste
- [ ] Formulaire de bloc **entièrement généré**
- [ ] `content` corrompu → page intacte, anomalie signalée
- [ ] Page `is_system` non supprimable (message clair)
- [ ] 18ᵉ bloc de test : un fichier + une entrée, puis retiré
- [ ] **À 390 px, l'éditeur est exploitable en 3 onglets** de bout en bout
- [ ] Onglet actif conservé au rechargement (`?onglet=`)
- [ ] Barre d'action toujours visible sur téléphone
- [ ] Bascule 2 zones / 3 zones à 1280 px, vérifiée au pixel

**Écarts / décisions**
- —

---

### Lot 10 — Réglages du site

**Statut :** ⬜ · **Début :** — · **Fin :** — · **Commit :** —

| Groupe | Écran | Répercussion site |
|---|:---:|:---:|
| `identity` | ⬜ | ⬜ |
| `contact` | ⬜ | ⬜ |
| `legal` | ⬜ | ⬜ |
| `socials` | ⬜ | ⬜ |
| `seo` | ⬜ | ⬜ |
| `theme` (Lot 11) | ⬜ | ⬜ |
| `navigation` | ⬜ | ⬜ |

**Recette**
- [ ] `[À COMPLÉTER]` préservé et listé au tableau de bord
- [ ] « Compte pas encore créé » → icône grisée, **pas de lien mort**
- [ ] Téléphone secondaire identique au principal refusé
- [ ] Réordonnancement du menu principal effectif
- [ ] `editor` sans accès (route directe comprise)
- [ ] Onglets de groupes défilants dans leur conteneur à 390 px

---

### Lot 11 — Éditeur de thème

**Statut :** ⬜ · **Début :** — · **Fin :** — · **Commit :** —

**Recette**
- [ ] `--primary` modifié → boutons du site changés
- [ ] Aucun flash de couleur (réseau ralenti)
- [ ] Contraste 3:1 sur couple critique refusé avec explication
- [ ] « Rétablir » restaure exactement `globals.css`
- [ ] Mode sombre éditable indépendamment
- [ ] Valeur CSS hostile rejetée
- [ ] À 390 px : sélecteurs empilés, ratio visible pendant la modification

---

### Lot 12 — Workflow éditorial

**Statut :** ⬜ · **Début :** — · **Fin :** — · **Commit :** —

**Recette**
- [ ] `editor` : « À relire » oui, publication non
- [ ] Publication → version créée ; restauration fonctionnelle
- [ ] Prévisualisation : brouillons visibles pour l'éditeur, invisibles pour le public
- [ ] Bannière de prévisualisation + sortie
- [ ] Publication programmée effective après passage du cron
- [ ] Purge au-delà de 20 versions
- [ ] Bannière et écran d'historique conformes à la matrice responsive

---

### Lot 13 — Utilisateurs et journal d'audit

**Statut :** ⬜ · **Début :** — · **Fin :** — · **Commit :** —

**Recette**
- [ ] Invitation → e-mail → mot de passe → dashboard avec le bon rôle
- [ ] `admin` ne change pas de rôle (bouton absent + action refusée)
- [ ] Dernier `super_admin` protégé (message de la base)
- [ ] Désactivation effective à la requête suivante
- [ ] Journal complet avec différentiel
- [ ] `editor` sans accès au journal
- [ ] Journal en cartes à 390 px, différentiel défilant dans son conteneur

---

### Lot 14 — Boîte de réception

**Statut :** ⬜ · **Début :** — · **Fin :** — · **Commit :** —

**Recette**
- [ ] Message de `/contact` visible au dashboard
- [ ] `RESEND_API_KEY` vide → message **quand même enregistré**
- [ ] Honeypot : rien en base, réponse « ok »
- [ ] Compteur de non-lus à jour
- [ ] Export CSV lisible dans un tableur francophone (UTF-8 BOM, `;`)
- [ ] `editor` lit sans supprimer
- [ ] À 390 px : liste et détail en deux écrans successifs

---

### Lot 15 — Bascule du site public et cache

**Statut :** ⬜ · **Début :** — · **Fin :** — · **Commit :** —

**Décision `cacheComponents`** : ⬜ activé · ⬜ repli `revalidateTag(tag, 'max')` (D4)
Justification : —

**Mesures avant / après**

| Route | LCP avant | LCP après | TTFB avant | TTFB après | Verdict |
|---|---|---|---|---|---|
| `/` | — | — | — | — | ⬜ |
| `/programmes` | — | — | — | — | ⬜ |
| `/actualites/[slug]` | — | — | — | — | ⬜ |

**Recette**
- [ ] `grep -r "@/content" src/` → vide
- [ ] 29 routes en 200
- [ ] Publication visible en moins de 5 s
- [ ] Accueil sans requête base à chaque visite
- [ ] `sitemap.xml` : URL publiées uniquement
- [ ] LCP non dégradé de plus de 20 %
- [ ] `npm run build` sans avertissement de cache

---

### Lot 16 — Durcissement, recette et mise en ligne

**Statut :** ⬜ · **Début :** — · **Fin :** — · **Commit :** —

**Recette**
- [ ] Limitation de débit effective (connexion, mot de passe, formulaires, upload)
- [ ] CSP passée de `Report-Only` à bloquant, toutes pages testées
- [ ] `/dashboard/_demo` supprimée, `console.log` nettoyés
- [ ] `eslint` et `tsc` sans erreur ni avertissement
- [ ] `docs/GUIDE-UTILISATEUR.md` rédigé, `README.md` et `.env.example` à jour
- [ ] Déploiement Vercel (`cdg1`), crons, premier `super_admin`, sauvegardes
- [ ] Parcours administrateur et parcours éditeur complets
- [ ] Non-régression du site public (29 routes, formulaires, sombre, liens, chiffres)
- [ ] **Recette responsive finale** : matrice complète verte, Lighthouse mobile ≥ 90,
      test sur téléphone réel
- [ ] Recette sécurité complète

---

## Registre des écarts

Tout ce qui diffère des rapports. Une ligne par écart, jamais supprimée : un écart
corrigé passe en `Résolu`, il ne disparaît pas.

| # | Date | Lot | Écart constaté | Décision | État |
|---|---|---|---|---|---|
| — | — | — | *(aucun pour l'instant)* | — | — |

**Colonne « Décision » :** `Corrigé` (le code rejoint le rapport) · `Entériné` (le
rapport doit être amendé, préciser lequel et quelle section) · `Reporté` (avec le lot
cible).

---

## Blocages en cours

| # | Depuis | Lot | Blocage | Ce qui débloquerait | Qui |
|---|---|---|---|---|---|
| — | — | — | *(aucun)* | — | — |

---

## Journal des séances

Le plus récent en haut. Trois lignes suffisent : ce qui a été fait, ce qui a été vérifié,
ce qui vient ensuite.

### 2026-08-28 — Cadrage

- Rapports 1 et 2 complétés par le volet **responsivité** : §12 du Rapport 1 (contrat de
  points de rupture, comportement par zone, dix règles, interdits, matrice de recette),
  règle 8 et critères par lot dans le Rapport 2.
- Création de ce fichier de suivi.
- **Ensuite :** Lot 0 — dépendances, projet Supabase, variables d'environnement,
  `remotePatterns`, règles ESLint d'architecture.
