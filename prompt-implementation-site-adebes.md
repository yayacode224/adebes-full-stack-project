# Prompt d'implémentation — Refonte complète du site ADEBES

> **Comment utiliser ce document :** copiez-collez l'intégralité de ce fichier dans une session Claude (idéalement Claude Code) pour lancer l'implémentation. Ce document est autonome — il contient le contexte, le contenu réel de l'association, les corrections issues de l'audit, la stack technique, l'architecture complète et les conventions de nommage des images.

---

## 0. Rôle et mission

Tu es **architecte logiciel**, **développeur Frontend expert** et **expert UX/UI (mobile-first et desktop)**. Tu dois concevoir et implémenter, **from scratch**, le nouveau site vitrine de l'association **ADEBES**, en te basant sur :
1. Le contenu réel de l'ancien site (fourni en section 3) ;
2. Les corrections issues d'un audit UX/UI complet (fourni en section 2) ;
3. Le cahier des charges technique et design ci-dessous.

Le code source de l'ancien site n'existe plus : tu repars entièrement de zéro. Si tu identifies des points importants omis dans ce brief (accessibilité, SEO, sécurité, performance, structure), **ajoute-les** et signale-les clairement dans ta réponse.

---

## 1. Contexte de l'organisation

**ADEBES** (Association pour le Développement et le Bien-être Social) est une association camerounaise à but non lucratif basée à Douala, intervenant à Douala, Yaoundé et dans les régions de l'intérieur du Cameroun.

**Objectifs du site :**
- Présenter l'association, sa mission, ses valeurs et ses réalisations de façon crédible et moderne.
- Convertir des visiteurs en **donateurs** et en **bénévoles**.
- Donner une image professionnelle et digne de confiance à une organisation qui vit de la générosité du public.

**Logo fourni** (voir fichier logo transmis par l'utilisateur) : un cœur formé par deux rubans (bleu à gauche, vert à droite) contenant trois silhouettes humaines stylisées aux mains levées/jointes (une petite figure orange, une figure centrale bleue, une figure verte), portées par deux mains ouvertes ; une pousse/feuille verte émerge en haut du cœur. À droite du pictogramme : le nom **« ADEBES »** en grand, gras, bleu marine foncé, séparé par une fine ligne verticale ; en dessous, la baseline *« Association pour le Développement et le Bien-être Social »* en bleu marine ; puis la devise *« Solidarité – Développement – Bien-être »* en vert, encadrée de petits tirets.

---

## 2. Corrections obligatoires issues de l'audit du site existant

Ces problèmes ont été identifiés sur l'ancien site et **ne doivent en aucun cas être reproduits** :

| # | Problème constaté sur l'ancien site | Exigence pour le nouveau site |
|---|---|---|
| 1 | Bouton « Devenir Bénévole » et liens « En savoir plus » pointant vers `#` (liens morts) | **Aucun** `href="#"` ou bouton non fonctionnel. Chaque CTA mène à une vraie page ou déclenche une vraie action. |
| 2 | Actualités jamais mises à jour (18+ mois de retard) | Structure de contenu pensée pour être facilement mise à jour ; dates gérées dynamiquement, jamais codées en dur sans intention. |
| 3 | Un seul canal de conversion (WhatsApp uniquement, aucun formulaire) | De vrais formulaires (contact, bénévolat) en plus du WhatsApp ; prévoir l'emplacement pour des moyens de paiement supplémentaires (Mobile Money). |
| 4 | Images dupliquées entre sections sans rapport, noms de fichiers révélant des images non originales (`OIP (2).webp`, `telechargement-2.jpeg`) | Une image = un usage. Convention de nommage stricte (section 8). Aucune image ne doit être réutilisée entre deux sections thématiquement différentes. |
| 5 | Site mono-page (tout sur `#ancres`), aucune page indexable individuellement | Architecture **multi-pages** avec URL propre par contenu (voir section 5). |
| 6 | Aucune mention légale, ni politique de confidentialité, ni numéro d'enregistrement | Pages légales dédiées, même avec des placeholders `[À COMPLÉTER]` si l'info exacte manque. |
| 7 | Aucun lien vers des réseaux sociaux | Emplacements Facebook, Instagram, TikTok dans le header et le footer. |
| 8 | Compteurs chiffrés à « 0 » sans fallback si JS échoue | Les valeurs réelles doivent être présentes dans le HTML dès le rendu serveur ; l'animation ne fait qu'accompagner visuellement une valeur déjà correcte. |
| 9 | Aucune donnée structurée, aucun sitemap, mauvaise visibilité en ligne | `sitemap.xml`, `robots.txt`, métadonnées uniques par page, JSON-LD `NGO`. |

---

## 3. Contenu réel à reprendre (issu de l'ancien site — à réécrire de façon plus courte, jamais inventé sur les faits)

> Consigne de rédaction : **moins de texte, plus d'images**. Réécris ce contenu en phrases courtes et scannables (listes à puces plutôt que paragraphes denses), sans changer les faits (lieux, chiffres, noms de programmes).

**Accroche (hero) :** *« Construisons un avenir meilleur ensemble. »*
**Sous-titre :** ADEBES œuvre pour le développement humain, la solidarité et le bien-être social à travers des actions concrètes au service des communautés camerounaises.

**Qui sommes-nous :** organisation camerounaise à but non lucratif intervenant dans l'éducation, la santé, l'inclusion sociale et le développement communautaire, principalement à Douala, Yaoundé et dans les régions de l'intérieur. *(Ancienneté affichée sur l'ancien site : 5+ années au service des communautés — à confirmer/mettre à jour avant publication.)*

**Nos 4 valeurs :**
1. **Solidarité** — l'union fait la force, chaque geste compte.
2. **Respect** — chaque individu traité avec dignité, sans distinction.
3. **Innovation** — des approches créatives pour maximiser l'impact.
4. **Impact Social** — des résultats mesurés et durables.

**Nos 8 programmes** (chacun doit avoir sa propre page détail, voir section 5) :
1. **Développement communautaire** — renforcer les capacités des communautés pour un développement autonome.
2. **Éducation** — soutien scolaire, alphabétisation, bourses pour enfants et jeunes défavorisés.
3. **Santé** — campagnes médicales et accès aux soins dans les zones rurales.
4. **Accompagnement des familles** — assistance sociale, aide alimentaire, soutien psychosocial.
5. **Inclusion sociale** — intégration des personnes en situation de handicap et des personnes marginalisées.
6. **Protection de l'environnement** — sensibilisation écologique, plantation d'arbres, initiatives vertes.
7. **Youth Empowerment** — formation professionnelle, leadership, entrepreneuriat des jeunes.
8. **Women's Empowerment** — autonomisation des femmes par la formation, l'artisanat, le soutien économique.

**FAQ à conserver et enrichir :**
- Comment faire un don à ADEBES ? *(mettre à jour la réponse pour mentionner tous les moyens disponibles, pas uniquement WhatsApp)*
- Mon don est-il bien utilisé ? (transparence, rapport disponible sur demande — idéalement rendre une partie publique)
- Comment devenir bénévole ?
- Où intervenez-vous au Cameroun ?

**Coordonnées :** Douala, Cameroun · Lun–Sam 8h–18h · contact@adebes.cm · WhatsApp +237 680 67 89 39 *(le second numéro affiché sur l'ancien site pointait par erreur vers le premier — à corriger ou supprimer s'il n'est pas distinct)*.

**Ce qui doit être créé (n'existait pas avant) :** de vraies pages détail par programme et par actualité, des témoignages avec de vraies citations courtes, des liens réseaux sociaux réels, une page impact/transparence, des pages légales.

---

## 4. Stack technique imposée

| Domaine | Choix | Notes |
|---|---|---|
| Framework | **Next.js** (dernière version stable, App Router, TypeScript strict) | Utiliser Server Components par défaut, Client Components uniquement là où l'interactivité l'exige. |
| Style | **Tailwind CSS** | Design tokens personnalisés dérivés du logo (section 6). |
| Composants UI | **shadcn/ui** (`npx shadcn@latest init`, composants ajoutés à la demande via `npx shadcn@latest add …`) | Base : Button, Card, Sheet, Accordion, Dialog, Input, Textarea, Select, Tabs, Tooltip, Toast/Sonner, Avatar, Badge, Separator. |
| Animations | **Motion** (anciennement Framer Motion — package `motion`, import `from "motion/react"`; le package historique `framer-motion` reste utilisable si plus stable au moment du build) | Usage mesuré, voir règles section 9. |
| Icônes | `lucide-react` pour les icônes UI génériques + `react-icons` (ou `simple-icons`) pour les icônes de marque (Facebook, Instagram, TikTok, WhatsApp) | lucide-react ne couvre pas les logos de marque. |
| Thème clair/sombre | `next-themes` | Voir section 10. |
| Images | `next/image` exclusivement (jamais de balise `<img>` brute) | Formats AVIF/WebP automatiques, `sizes` défini sur chaque image responsive. |
| Formulaires | `react-hook-form` + `zod` pour la validation | Soumission via Server Actions Next.js. |
| Emailing | `Resend` (ou Nodemailer + SMTP en repli) | Clé API en variable d'environnement, jamais commitée. |
| Police | `next/font/google` | Voir proposition typographique section 6. |
| Déploiement | **Vercel** | Le projet doit être prêt à déployer sans configuration supplémentaire (hors variables d'environnement). |

---

## 5. Architecture du site (multi-pages)

```
/                                Accueil
/a-propos                        Qui sommes-nous (histoire, valeurs, équipe, gouvernance)
/programmes                      Liste des 8 programmes
/programmes/[slug]                Détail d'un programme
    developpement-communautaire
    education
    sante
    accompagnement-familles
    inclusion-sociale
    protection-environnement
    youth-empowerment
    women-empowerment
/actualites                      Liste des actualités (filtrable par catégorie)
/actualites/[slug]                Détail d'un article
/galerie                         Galerie photo/vidéo filtrable
/impact                          Impact & transparence (chiffres, rapports téléchargeables)
/don                             Faire un don
/benevolat                       Devenir bénévole (formulaire réel)
/contact                         Contact (formulaire réel + coordonnées + carte)
/mentions-legales                Mentions légales
/politique-confidentialite       Politique de confidentialité
```

Fichiers Next.js à prévoir en complément : `app/sitemap.ts`, `app/robots.ts`, `app/not-found.tsx` (404 personnalisée cohérente avec le design), `app/error.tsx` (erreur globale), `loading.tsx` par segment avec contenu dynamique (squelettes de chargement).

---

## 6. Identité visuelle dérivée du logo

> Ces valeurs sont des **points de départ indicatifs**. Affine-les avec le fichier logo source (idéalement un SVG) via un outil pipette pour obtenir les teintes exactes avant de figer le design system.

**Palette proposée :**

| Rôle | Couleur | Hex indicatif |
|---|---|---|
| Bleu marine (texte de marque, titres, mode clair) | Navy | `#0F2D52` |
| Bleu (ruban gauche du cœur, accents) | Bleu | `#2E8BC0` |
| Vert (ruban droit, feuille, devise) | Vert | `#4CAF50` |
| Orange (petite silhouette, accent rare) | Orange | `#F2994A` |
| Fond clair | Blanc cassé | `#FAFAFA` |
| Fond sombre (pas de noir pur — prolonger la teinte navy du logo) | Bleu nuit | `#0B1B2B` |

**Typographie proposée** (à charger via `next/font/google`) :
- Titres : **Sora** (géométrique, arrondie, moderne — fait écho aux formes arrondies du pictogramme).
- Texte courant : **Inter** (excellente lisibilité, très bon rendu des accents français).

**Règles d'usage du logo :**
- Toujours visible dans le header (jamais masqué par le scroll — header sticky avec fond qui apparaît au scroll).
- Espace de respiration minimal autour du logo (ne jamais le coller à un bord ou un autre élément).
- Le logo actuel a un texte en bleu marine foncé : **prévoir une variante claire/blanche** pour les fonds sombres (footer, mode sombre) — soit une version fournie par l'utilisateur (`logo-white.svg`), soit le logo posé sur une petite plaque blanche arrondie pour préserver le contraste.
- Utiliser le pictogramme seul (sans le texte) comme favicon et icône d'application.

---

## 7. Design system & composants réutilisables

Construire une bibliothèque de composants cohérents, tous **responsive mobile-first**, tous compatibles thème clair/sombre :

- **Button** — variantes `primary` (vert ou bleu selon contexte), `secondary`, `outline`, `ghost`, et une variante `whatsapp` dédiée (icône + couleur reconnaissable) pour les CTA de don/contact rapide.
- **SectionHeading** — titre + sous-titre + badge optionnel, réutilisé en tête de chaque section pour garantir une hiérarchie visuelle cohérente sur tout le site.
- **ProgramCard**, **NewsCard**, **ValueCard**, **StatCard**, **TestimonialCard** — cartes avec image, micro-interaction au survol (légère élévation/zoom d'image, jamais agressive).
- **AnimatedCounter** — valeur réelle présente dans le HTML, animation de comptage déclenchée au scroll (`whileInView`, `once: true`).
- **Navbar** — logo, liens, `ThemeToggle`, CTA « Faire un don » toujours visible ; sur mobile, menu plein écran type `Sheet` (shadcn).
- **StickyMobileActionBar** — barre fixe en bas d'écran sur mobile uniquement, avec deux actions : « Faire un don » et « WhatsApp ».
- **Footer** — logo (variante claire), mission en une phrase, liens rapides, réseaux sociaux, coordonnées, liens légaux, copyright à année dynamique.
- **ImageGallery / Lightbox** — grille filtrable par catégorie + visionneuse plein écran.
- **FAQAccordion** — basé sur le composant Accordion de shadcn.
- **ContactForm / VolunteerForm** — `react-hook-form` + `zod`, états de chargement/succès/erreur, confirmation via `sonner` (toast).
- **CTABanner** — bandeau réutilisable pour les appels à l'action de fin de page (don, bénévolat).
- **Breadcrumb** — sur les pages de détail (programme, actualité).

---

## 8. Convention de nommage des images (dossier fourni par l'utilisateur)

L'utilisateur ajoutera ses propres images avant l'implémentation finale. Utilise dès maintenant les emplacements et noms ci-dessous dans le code (avec des placeholders visuels — fond coloré + icône — en attendant les vraies images), afin qu'il suffise de déposer les fichiers aux bons chemins :

```
/public/images/
├── logo/
│   ├── logo-full-color.svg        (logo principal, déjà fourni)
│   ├── logo-white.svg             (variante claire pour fonds sombres — à fournir)
│   ├── favicon.ico
│   ├── icon-192.png / icon-512.png
│   └── og-image.jpg               (1200x630 — image de partage réseaux sociaux)
│
├── hero/
│   ├── hero-home.jpg              (1920x1080 min, plan large et humain)
│   ├── hero-home-video.mp4        (optionnel — voir note vidéo ci-dessous)
│   ├── hero-a-propos.jpg
│   ├── hero-programmes.jpg
│   ├── hero-galerie.jpg
│   ├── hero-actualites.jpg
│   ├── hero-impact.jpg
│   ├── hero-don.jpg
│   ├── hero-benevolat.jpg
│   └── hero-contact.jpg
│
├── a-propos/
│   ├── histoire-01.jpg, histoire-02.jpg
│   └── equipe-[prenom-nom].jpg    (une photo par membre affiché)
│
├── programmes/
│   ├── developpement-communautaire/  cover.jpg, 01.jpg, 02.jpg, 03.jpg
│   ├── education/                    cover.jpg, 01.jpg, 02.jpg, 03.jpg
│   ├── sante/                        cover.jpg, 01.jpg, 02.jpg, 03.jpg
│   ├── accompagnement-familles/      cover.jpg, 01.jpg, 02.jpg, 03.jpg
│   ├── inclusion-sociale/            cover.jpg, 01.jpg, 02.jpg, 03.jpg
│   ├── protection-environnement/     cover.jpg, 01.jpg, 02.jpg, 03.jpg
│   ├── youth-empowerment/            cover.jpg, 01.jpg, 02.jpg, 03.jpg
│   └── women-empowerment/            cover.jpg, 01.jpg, 02.jpg, 03.jpg
│
├── actualites/
│   └── [slug-de-larticle]-cover.jpg  (une image de couverture par article)
│
├── galerie/
│   ├── education-01.jpg … 0N.jpg
│   ├── sante-01.jpg … 0N.jpg
│   ├── communaute-01.jpg … 0N.jpg
│   └── environnement-01.jpg … 0N.jpg
│
└── temoignages/
    └── temoignage-[prenom].jpg        (avec l'accord de la personne représentée)
```

**Recommandations à transmettre à l'utilisateur pour ses images :**
- Format : `.jpg` ou `.webp`, poids idéalement < 400 Ko par image (compresser avant import, ex. via Squoosh ou TinyPNG).
- Ratio hero : large format (16:9 ou plus large) ; ratio cartes programmes/actualités : 4:3 ou 3:2.
- Une photo = un contexte réel, jamais réutilisée entre deux sections thématiquement différentes (voir correction #4 de l'audit).
- Éviter toute image dont la provenance n'est pas maîtrisée (capture d'écran, résultat de recherche d'images) : utiliser uniquement des photos prises par l'association ou dont les droits sont clairs.

**Note sur la vidéo :** pour toute vidéo (hero, témoignage, reportage terrain), **ne pas committer de fichiers vidéo volumineux dans le dépôt Git/Vercel** — cela alourdit le déploiement et dégrade la performance. Héberger les vidéos sur une plateforme externe (YouTube non répertorié, Vimeo, ou un service comme Cloudinary/Mux) et les intégrer par lecteur léger ou `iframe`, avec une image d'aperçu (`poster`) locale optimisée.

---

## 9. Règles d'animation (Motion / Framer Motion)

- Animations d'entrée discrètes uniquement : fondu + léger déplacement (10–20px), durée ~0.4–0.6s, courbe douce (`ease-out`).
- `whileInView` avec `viewport={{ once: true }}` — l'animation ne se déclenche qu'une fois, jamais à chaque scroll aller-retour (économie de performance).
- Le contenu critique au-dessus de la ligne de flottaison (hero) doit être visible immédiatement au premier rendu : ne jamais partir d'un `opacity: 0` sans fallback pour le SEO et les utilisateurs sans JavaScript.
- Respecter `prefers-reduced-motion: reduce` — désactiver ou réduire fortement les animations pour les utilisateurs qui en font la demande système.
- Pas de librairie d'animation supplémentaire ; pas de vidéo de fond lourde en autoplay.

---

## 10. Thème clair / sombre

- `next-themes` avec détection de `prefers-color-scheme` par défaut, choix mémorisé.
- Variables CSS Tailwind (pattern shadcn `--background`, `--foreground`, etc.), jamais de couleurs codées en dur dans les composants.
- Mode sombre : fond bleu nuit (voir palette section 6), jamais noir pur, pour rester fidèle à l'identité du logo.
- Contraste vérifié AA (WCAG 2.1) dans les deux thèmes, y compris pour le texte superposé aux photos (toujours un scrim/overlay semi-transparent derrière le texte du hero).
- Toggle clair/sombre accessible et visible dans le header (icône soleil/lune).

---

## 11. Mobile-first & responsive — règles concrètes

- Concevoir chaque section d'abord pour un écran de 375px de large, puis étendre avec les breakpoints Tailwind (`sm`, `md`, `lg`, `xl`).
- Zones tactiles ≥ 44×44px.
- Menu mobile en panneau plein écran (`Sheet`), fermeture facile, piégeage du focus pour l'accessibilité.
- `StickyMobileActionBar` (don + WhatsApp) visible en permanence sur mobile, sans jamais masquer de contenu (prévoir le `padding-bottom` nécessaire).
- Toutes les images passent par `next/image` avec un attribut `sizes` correct pour ne jamais livrer une image desktop à un mobile.

---

## 12. Performance & SEO

- `generateMetadata` unique par page (titre, description, Open Graph, Twitter Card).
- `app/sitemap.ts` et `app/robots.ts`.
- Données structurées JSON-LD : `Organization`/`NGO` sur l'accueil, `Article` sur les pages actualités.
- Toutes les images en `next/image`, lazy loading natif hors zone visible du hero.
- `next/font` pour éviter le layout shift lié aux polices.
- Objectif : score Lighthouse mobile > 90 sur Performance, Accessibilité, SEO et Bonnes pratiques.

---

## 13. Accessibilité (WCAG 2.1 AA)

- Contraste suffisant partout, y compris texte sur image (overlay obligatoire).
- Navigation complète au clavier, focus visible sur tous les éléments interactifs.
- `alt` descriptif et spécifique sur chaque image (jamais de `alt=""` sauf image purement décorative).
- Landmarks sémantiques (`<nav>`, `<main>`, `<footer>`, `<header>`).
- Formulaires : `label` associé à chaque champ, messages d'erreur annoncés (`aria-live`), pas uniquement une couleur pour signaler une erreur.

---

## 14. Formulaires, emails et anti-spam

- **Contact** et **Bénévolat** : formulaires réels (`react-hook-form` + `zod`), soumis via Server Actions, envoyés par email (Resend ou SMTP) vers l'adresse de l'association.
- Champ honeypot invisible (ou Cloudflare Turnstile si un niveau de protection supplémentaire est souhaité) contre le spam automatisé.
- Confirmation visuelle immédiate (toast) après envoi, avec message clair en cas d'échec.
- Variables d'environnement documentées dans un fichier `.env.example` (jamais de secret commité).

---

## 15. Réseaux sociaux & partage

- Icônes Facebook, Instagram, TikTok dans le footer (bien visibles) et éventuellement en discret dans le header.
- URLs réelles à insérer par l'utilisateur — utiliser des placeholders clairs (`https://facebook.com/[À_COMPLETER]`) en attendant.
- Boutons de partage sur les pages actualités : API Web Share native sur mobile, liens directs de repli sur desktop.

---

## 16. Pages de don et de bénévolat — logique fonctionnelle

**Page /don :**
- Explication courte de l'usage des dons (transparence).
- Montants suggérés en boutons rapides + montant libre (l'affichage seulement — pas de passerelle de paiement automatisée à ce stade, sauf si l'utilisateur fournit un prestataire précis).
- CTA principal WhatsApp pré-rempli (comme sur l'ancien site, mais avec un message à jour).
- Emplacement clairement identifié pour de futurs moyens de paiement (Mobile Money, virement) — même en `[Bientôt disponible]`.
- FAQ dons intégrée.

**Page /benevolat :**
- Présentation des domaines de bénévolat possibles (en lien avec les 8 programmes).
- Vrai formulaire de candidature (nom, contact, domaine d'intérêt, disponibilité, message).
- Bouton WhatsApp en alternative.

---

## 17. Ce qu'il ne faut jamais faire

- Aucun `href="#"` ni bouton sans action réelle.
- Aucune statistique dupliquée deux fois sur la même page (défaut constaté sur l'ancien site).
- Aucun compteur qui reste vide sans JavaScript.
- Aucune image réutilisée entre deux sections sans rapport thématique.
- Aucune dépendance ajoutée en dehors de la stack définie sans raison justifiée.
- Aucune animation qui retarde ou masque l'affichage du contenu critique (hero, CTA principaux).

---

## 18. Points ajoutés à ce brief (non explicitement demandés, mais nécessaires)

- Pages légales (`mentions-legales`, `politique-confidentialite`) avec contenu générique à adapter.
- `not-found.tsx` et `error.tsx` personnalisés, cohérents avec le design.
- `loading.tsx` (squelettes) sur les segments avec contenu dynamique.
- Anti-spam sur les formulaires (honeypot).
- `.env.example` documenté + section déploiement dans le `README`.
- Recommandation d'hébergement externe pour les vidéos (voir section 8).
- Bandeau simple de consentement aux cookies/analytics si Google Analytics/Vercel Analytics est ajouté ultérieurement.
- Emplacement pour rapports annuels téléchargeables (PDF) sur la page `/impact`.

---

## 19. Livrables attendus

1. Projet Next.js (TypeScript, App Router) complet et fonctionnel, prêt pour `vercel deploy` sans configuration supplémentaire (hors variables d'environnement à renseigner).
2. Toutes les pages listées en section 5, responsive et testées mentalement mobile/desktop.
3. Contenu réel de la section 3 intégré (réécrit plus court), placeholders `[À COMPLÉTER]` uniquement là où une information n'existe pas encore (numéro d'enregistrement légal, adresse postale précise, URLs réseaux sociaux).
4. Toutes les images référencées selon la convention de la section 8, avec des placeholders visuels en attendant les vraies images.
5. `README.md` avec instructions d'installation, variables d'environnement requises, et étapes de déploiement sur Vercel.
6. Aucun des défauts listés en section 17.

---

*Fin du prompt d'implémentation.*
