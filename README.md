# Site ADEBES

Site vitrine de l'**Association pour le Développement et le Bien-être Social** (Cameroun) — refonte complète, multi-pages, mobile-first.

> Ce projet remplace un site mono-page dont l'audit avait relevé des parcours de conversion cassés, un contenu daté, des visuels d'origine incertaine et une absence totale de visibilité en ligne. Chaque correction est documentée dans le code, à l'endroit où elle s'applique.

---

## Démarrage rapide

```bash
npm install
cp .env.example .env.local   # puis renseignez les variables
npm run dev                  # http://localhost:3000
```

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement (Turbopack) |
| `npm run build` | Build de production |
| `npm start` | Sert le build de production |
| `npm run lint` | ESLint |

Prérequis : **Node.js 20.9+**.

---

## Ajouter vos images et vos vidéos

C'est la seule chose qui reste à faire pour que le site soit complet.

**Le principe :** le code référence déjà les chemins définitifs de chaque visuel. Tant qu'un fichier est absent, un emplacement coloré s'affiche à sa place (avec, en développement, le chemin attendu écrit dessus). **Dès que vous déposez le fichier au bon chemin, l'image réelle apparaît — sans aucune modification de code.**

Les extensions `.jpg`, `.jpeg`, `.webp`, `.png` et `.avif` sont interchangeables : si le code attend `cover.jpg` et que vous fournissez `cover.webp`, cela fonctionne.

### Arborescence attendue

```
public/images/
├── logo/
│   ├── logo-full-color.svg      verrouillage complet (pied de page)
│   ├── logo-full-white.svg      le même en blanc (fonds sombres)
│   ├── logo-compact-color.svg   pictogramme + ADEBES (header, menu mobile)
│   ├── logo-compact-white.svg   le même en blanc (header sur photo, mode sombre)
│   ├── icon-192.png             icône d'application
│   ├── icon-512.png
│   └── og-image.jpg             1200×630 — image de partage réseaux sociaux
│
├── hero/                        1920×1080 minimum, format large
│   ├── hero-home.jpg            plan large et humain (image la plus vue du site)
│   ├── hero-a-propos.jpg
│   ├── hero-biographie.jpg
│   ├── hero-programmes.jpg
│   ├── hero-actualites.jpg
│   ├── hero-galerie.jpg
│   ├── hero-impact.jpg
│   ├── hero-don.jpg
│   ├── hero-benevolat.jpg
│   └── hero-contact.jpg
│
├── a-propos/
│   ├── histoire-01.jpg
│   ├── histoire-02.jpg
│   └── equipe-direction.jpg     une photo par membre (voir src/content/equipe.ts)
│
├── biographie/
│   └── portrait.jpg             portrait vertical 3:4 (page /biographie)
│
├── programmes/<slug>/           cover.jpg, 01.jpg, 02.jpg, 03.jpg
│   ├── developpement-communautaire/
│   ├── education/
│   ├── sante/
│   ├── accompagnement-familles/
│   ├── inclusion-sociale/
│   ├── protection-environnement/
│   ├── youth-empowerment/
│   └── women-empowerment/
│
├── actualites/
│   └── <slug-de-larticle>-cover.jpg
│
├── galerie/                     education-01.jpg, sante-01.jpg, communaute-01.jpg, environnement-01.jpg…
│   └── legendes.json            (facultatif — voir ci-dessous)
│
└── temoignages/
    └── temoignage-<id>.jpg
```

### La galerie se remplit toute seule

Contrairement au reste du site, la galerie **lit le contenu réel du dossier** au moment du build. Déposez autant de photos que vous voulez en respectant le nommage `categorie-NN.jpg` (catégories : `education`, `sante`, `communaute`, `environnement`) : elles apparaissent et se rangent automatiquement dans le bon filtre.

Pour donner à chaque photo un texte alternatif descriptif — important pour l'accessibilité et le référencement — créez `public/images/galerie/legendes.json` :

```json
{
  "education-01.jpg": "Atelier de soutien scolaire à Bonabéri, Douala",
  "sante-01.jpg": "Consultation lors de la campagne médicale de Nkongsamba"
}
```

### Recommandations pour les photos

- **Poids** : moins de 400 Ko par image. Compressez avant import ([Squoosh](https://squoosh.app), [TinyPNG](https://tinypng.com)). Le public vise majoritairement sur données mobiles : le poids de page est un enjeu de taux d'abandon, pas de score technique.
- **Ratios** : 16:9 ou plus large pour les heros ; 4:3 ou 3:2 pour les cartes.
- **Une photo = un usage.** Ne réutilisez jamais la même image entre deux sections sans rapport : c'était l'un des défauts les plus visibles de l'ancien site.
- **Provenance maîtrisée uniquement.** Photos prises par l'association, ou dont les droits sont clairs. Pas de captures de recherche d'images.
- **Accord des personnes** photographiées, en particulier pour les portraits et les témoignages.

### Vidéos

**Ne commitez aucun fichier vidéo dans le dépôt** : cela alourdit le déploiement et dégrade la performance. Hébergez-les sur YouTube (non répertorié), Vimeo, Cloudinary ou Mux, puis renseignez l'identifiant dans le composant `VideoEmbed` :

```tsx
<VideoEmbed
  source={{ provider: "youtube", id: "IDENTIFIANT_DE_LA_VIDEO" }}
  title="Présentation d'ADEBES"
  poster="/images/galerie/video-poster.jpg"
  posterAlt="…"
/>
```

Le lecteur n'est chargé qu'au clic : aucune donnée mobile n'est consommée avant que le visiteur ne lance la lecture. Tant que `source` vaut `null`, l'emplacement s'affiche sans bouton de lecture — jamais un lecteur qui ne lit rien.

---

## Modifier le contenu

Tout le contenu éditorial est regroupé dans `src/content/` et `src/lib/site-config.ts`. Aucun texte n'est écrit en dur dans les pages.

| Fichier | Contenu |
|---|---|
| `src/lib/site-config.ts` | Coordonnées, horaires, WhatsApp, mentions légales, réseaux sociaux |
| `src/content/programmes.ts` | Les 8 programmes (résumé, actions, publics, besoins) |
| `src/content/actualites.ts` | Articles — **contient 3 exemples à remplacer** |
| `src/content/stats.ts` | Chiffres clés |
| `src/content/temoignages.ts` | Témoignages — **gabarits à remplacer** |
| `src/content/equipe.ts` | Équipe, gouvernance, rapports annuels |
| `src/content/biographie.ts` | Biographie de M. Tana TEBOH Taduis — **parcours et mandats à compléter** |
| `src/content/faq.ts` | Questions fréquentes |
| `src/content/valeurs.ts` | Les 4 valeurs |

👉 **La liste complète de ce qui reste à renseigner est dans [`CONTENU-A-COMPLETER.md`](./CONTENU-A-COMPLETER.md).**

### Publier une actualité

1. Ajoutez une entrée dans `src/content/actualites.ts` (sans la propriété `placeholder`).
2. Déposez `public/images/actualites/<slug>-cover.jpg`.
3. Redéployez.

La page, l'URL partageable, l'entrée du sitemap, les données structurées `Article` et les boutons de partage sont générés automatiquement.

### Rapports annuels

Déposez le PDF dans `public/documents/` sous la forme `rapport-activite-2025.pdf`. Le bouton de téléchargement n'apparaît sur `/impact` **que si le fichier existe réellement** — jamais de lien mort.

---

## Variables d'environnement

Voir [`.env.example`](./.env.example) pour la liste commentée.

| Variable | Obligatoire | Rôle |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Oui en production | URL canonique (metadata, sitemap, partage) |
| `RESEND_API_KEY` | Pour les formulaires | Clé API [Resend](https://resend.com) |
| `CONTACT_EMAIL_FROM` | Pour les formulaires | Expéditeur (domaine vérifié chez Resend) |
| `CONTACT_EMAIL_TO` | Non | Destinataire (défaut : `contact@adebes.cm`) |
| `NEXT_PUBLIC_FACEBOOK_URL` | Non | Lien Facebook |
| `NEXT_PUBLIC_INSTAGRAM_URL` | Non | Lien Instagram |
| `NEXT_PUBLIC_TIKTOK_URL` | Non | Lien TikTok |

Sans clé Resend, les formulaires **n'échouent pas silencieusement** : ils affichent un message invitant à écrire par e-mail ou WhatsApp. Un message de bénévole perdu sans trace serait pire qu'une erreur visible.

Tant qu'une URL de réseau social est vide, l'icône correspondante s'affiche grisée avec la mention « compte à venir » — jamais un lien mort.

---

## Déploiement sur Vercel

1. Poussez le dépôt sur GitHub / GitLab.
2. Sur [vercel.com](https://vercel.com) → **Add New… → Project** → importez le dépôt.
3. Le framework est détecté automatiquement (Next.js). Aucune configuration de build n'est nécessaire.
4. **Settings → Environment Variables** : ajoutez les variables du tableau ci-dessus pour `Production` et `Preview`.
5. **Deploy**.
6. **Settings → Domains** : rattachez `adebesgroup.com`, puis mettez `NEXT_PUBLIC_SITE_URL` à jour et redéployez.

Après la mise en ligne :

- Déclarez le site dans [Google Search Console](https://search.google.com/search-console) et soumettez `https://votre-domaine/sitemap.xml`.
- Vérifiez les données structurées avec le [test des résultats enrichis](https://search.google.com/test/rich-results).
- Mesurez la performance réelle avec [PageSpeed Insights](https://pagespeed.web.dev/).

---

## Architecture

```
/                            Accueil
/a-propos                    Mission, valeurs, équipe, gouvernance
/biographie                  Biographie de M. Tana TEBOH Taduis
/programmes                  Liste des 8 programmes
/programmes/[slug]           Détail d'un programme
/actualites                  Liste filtrable par catégorie
/actualites/[slug]           Article (partageable, données structurées Article)
/galerie                     Grille filtrable + visionneuse plein écran
/impact                      Chiffres, engagements, rapports téléchargeables
/don                         Montants, moyens de paiement, FAQ dons
/benevolat                   Domaines d'engagement + formulaire de candidature
/contact                     Formulaire + coordonnées + carte
/mentions-legales
/politique-confidentialite
```

Les 29 routes sont **pré-générées statiquement** au build : le serveur ne calcule rien à la volée.

### Stack

| Domaine | Choix |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript strict, Turbopack) |
| Style | Tailwind CSS v4, tokens dérivés du logo |
| Composants | shadcn/ui (base Radix) |
| Animations | Motion (`motion/react`) |
| Thème | `next-themes` (clair / sombre / système) |
| Formulaires | `react-hook-form` + `zod`, Server Actions |
| E-mail | Resend |
| Icônes | `lucide-react` + `react-icons` (marques) |
| Polices | Sora (titres) + Inter (texte), via `next/font` |

### Organisation du code

```
src/
├── app/                 Routes (App Router)
│   ├── actions/         Server Actions (envoi des formulaires)
│   ├── sitemap.ts       robots.ts, manifest.ts, icon.svg
│   ├── error.tsx        global-error.tsx, not-found.tsx
│   └── …
├── components/
│   ├── ui/              shadcn/ui
│   ├── ui-ext/          Extensions ADEBES (SectionHeading, CTABanner, Reveal…)
│   ├── layout/          Header, Footer, barre d'action mobile, hero de page
│   ├── media/           MediaImage, placeholders, intégration vidéo
│   ├── cards/           ProgrammeCard, NewsCard, StatCard, ValueCard…
│   ├── forms/           Formulaires contact et bénévolat
│   └── seo/             Données structurées JSON-LD
├── content/             Contenu éditorial typé
└── lib/                 Configuration, navigation, schémas, résolution des médias
```

---

## Choix structurants

**Design system.** Les couleurs viennent du logo, mais les teintes posées derrière du texte blanc ont été assombries pour atteindre un contraste AA : le bleu `#2E8BC0` du ruban devient `#1B6FA8` (5,3:1) et le vert `#4CAF50` devient `#2E7D32` (5,1:1). Le mode sombre utilise un bleu nuit `#0B1B2B`, jamais du noir pur, pour rester fidèle à l'identité.

**Cibles tactiles.** Les hauteurs par défaut de shadcn/ui (32–36 px) ont été relevées à 44 px minimum dans `src/components/ui/button.tsx`.

**Compteurs.** La valeur réelle est présente dans le HTML rendu par le serveur ; l'animation ne fait que l'accompagner. Sans JavaScript, le bon chiffre s'affiche quand même.

**Animations.** Fondu discret + 16 px, une seule fois par élément, jamais au-dessus de la ligne de flottaison, désactivées si `prefers-reduced-motion` est demandé, et neutralisées par une règle `<noscript>` pour les visiteurs sans JavaScript.

**Chiffres non fournis.** Un chiffre absent s'affiche « — » avec une mention explicite, jamais un zéro ni une valeur inventée. Pour une structure qui vit de la confiance des donateurs, un chiffre d'impact fabriqué serait la faute la plus coûteuse possible.

**Contenus d'exemple.** Les articles et témoignages de démonstration portent un badge orange « Exemple — à remplacer » visible sur le site. Un gabarit non signalé finit toujours par être pris pour un contenu réel.

---

## Pistes pour la suite

- **CMS** — le contenu est isolé dans `src/content/` avec des types explicites, ce qui rend la migration vers un CMS headless (Sanity, Payload, Strapi) mécanique le jour où l'équipe voudra publier sans développeur.
- **Paiement en ligne** — les emplacements Mobile Money / carte existent déjà sur `/don`. Un agrégateur présent en Afrique centrale (CinetPay, par exemple) permettrait Orange Money, MTN Mobile Money et carte bancaire.
- **Mesure d'audience** — Vercel Analytics ou Matomo, avec le bandeau de consentement correspondant et une mise à jour de la politique de confidentialité.
- **Limitation de débit** sur les Server Actions si le volume de spam le justifie, en complément du champ piège déjà en place.
# adebes-project
# adebes-full-stack-project
