# Ce qu'il reste à fournir avant la mise en ligne

Ce document liste **tout ce qui n'a pas pu être écrit à votre place**, parce qu'il s'agit d'informations factuelles que seule ADEBES détient. Aucun chiffre, aucun nom et aucun témoignage n'a été inventé : c'est délibéré, et c'est ce qui distingue un site crédible d'un site de démonstration.

Les éléments sont classés par ordre de priorité. Cochez au fur et à mesure.

---

## 🔴 Bloquant — à faire avant toute mise en ligne publique

### 1. Informations légales

Fichier : `src/lib/site-config.ts`, objet `legal`.

- [ ] **Numéro d'enregistrement officiel** de l'association (`registrationNumber`)
- [ ] **Autorité d'enregistrement** — ministère ou préfecture (`registrationAuthority`)
- [ ] **Directeur / directrice de la publication** (`publicationDirector`)
- [ ] **Adresse postale précise** du siège (`contact.streetAddress`, `contact.postalCode`)

> Un site qui collecte des dons sans mentions légales complètes n'inspire pas confiance et peut poser un problème réglementaire. C'était l'un des manques les plus graves de l'ancien site.

### 2. Le logo

Fichier : `public/images/logo/`

- [x] `logo-full-color.svg` — verrouillage complet, bleu marine (pied de page)
- [x] `logo-full-white.svg` — le même en blanc (fonds sombres)
- [x] `logo-compact-color.svg` — pictogramme + « ADEBES » (header, menu mobile)
- [x] `logo-compact-white.svg` — le même en blanc (header sur photo, mode sombre)
- [ ] `icon-192.png` et `icon-512.png` — pictogramme seul, fond transparent ou navy
- [ ] `og-image.jpg` — 1200×630, image affichée lors d'un partage sur les réseaux

> Les quatre fichiers du logo ont été dérivés du fichier officiel fourni : recadrés au plus près du dessin, déclinés en bleu marine et en blanc, et allégés d'une version compacte lisible dans le header. Voir `public/images/README.md` pour les règles à respecter en cas de remplacement.

### 3. Configuration de l'envoi des formulaires

Fichier : `.env.local` (et variables Vercel)

- [ ] Compte [Resend](https://resend.com) créé et domaine `adebes.cm` vérifié
- [ ] `RESEND_API_KEY` renseignée
- [ ] `CONTACT_EMAIL_FROM` renseignée
- [ ] Test réel : envoyer un message depuis `/contact` et vérifier sa réception

> Tant que ce n'est pas fait, les formulaires affichent honnêtement un message renvoyant vers l'e-mail et WhatsApp. Ils ne prétendent jamais avoir envoyé un message qui n'est pas parti.

### 4. Remplacer les contenus d'exemple

Ces contenus portent un badge orange **« Exemple — à remplacer »** visible sur le site.

- [ ] **3 articles d'actualité** — `src/content/actualites.ts` (supprimer `placeholder: true`)
- [ ] **3 témoignages** — `src/content/temoignages.ts` (citations réelles + accord des personnes)
- [ ] **3 membres de l'équipe** — `src/content/equipe.ts` (noms, rôles, photos)

---

## 🟠 Important — à faire dans les jours qui suivent

### 5. Les chiffres d'impact

Fichier : `src/content/stats.ts`

- [ ] **Bénéficiaires accompagnés** — actuellement `null`, s'affiche « — ». Fournir le chiffre issu de vos rapports d'activité.
- [ ] **Projets menés** — la valeur `30` provient de l'ancien site. À confirmer ou corriger.
- [ ] **Année de création** — `siteConfig.foundingYear` vaut `2020`, déduit du « 5+ années » affiché sur l'ancien site. À corriger : le nombre d'années d'activité en est calculé automatiquement.

> Aucun chiffre n'a été arrondi ni extrapolé. Si un chiffre reste indisponible, il vaut mieux laisser le tiret que publier une estimation.

### 6. Les photographies

Voir la section « Ajouter vos images et vos vidéos » du [README](./README.md) pour l'arborescence complète.

- [ ] 10 images de hero (une par page)
- [ ] 2 photos pour la page « Qui sommes-nous »
- [ ] 1 portrait pour la page « Biographie »
- [ ] 4 photos par programme × 8 programmes (1 couverture + 3 photos de terrain)
- [ ] 1 photo de couverture par article
- [ ] Photos de galerie (autant que souhaité, nommage `categorie-NN.jpg`)
- [ ] `legendes.json` pour les textes alternatifs de la galerie

> Priorité absolue : `hero-home.jpg`. C'est la première image que voit chaque visiteur, et elle détermine la crédibilité de tout le reste.

### 7. Réseaux sociaux

Fichier : `.env.local`

- [ ] `NEXT_PUBLIC_FACEBOOK_URL`
- [ ] `NEXT_PUBLIC_INSTAGRAM_URL`
- [ ] `NEXT_PUBLIC_TIKTOK_URL`

> Si un compte n'existe pas encore, laissez la variable vide : l'icône reste grisée avec la mention « compte à venir ». Aucun lien mort n'est jamais produit.

### 8. Vérification du contenu des programmes

Fichier : `src/content/programmes.ts`

Les descriptions d'une phrase que vous aviez fournies ont été déclinées en listes d'actions et de publics. Ces listes décrivent des **types d'activité**, jamais des résultats chiffrés — mais elles doivent être relues.

- [ ] Relire les 8 programmes : les actions listées correspondent-elles à la réalité du terrain ?
- [ ] Ajuster les « besoins » (ce que finance un don) pour qu'ils reflètent vos vrais postes de dépense

### 9. Second numéro de téléphone

Fichier : `src/lib/site-config.ts`

L'ancien site affichait un second numéro (+237 696 99 07 23) dont le lien pointait en réalité vers le premier.

- [ ] Ce numéro est-il réellement distinct et utilisable ? Si oui, renseigner `secondaryPhoneE164` et `secondaryPhoneDisplay`. Sinon, ne rien faire : il reste absent.

### 10. Compléter la biographie

Fichier : `src/content/biographie.ts` — page `/biographie`

La page reprend **exactement** les éléments transmis sur M. Tana TEBOH Taduis : aucune date, aucune fonction et aucun mandat n'a été ajouté par déduction. Ce qui manque est listé sur la page elle-même, sous le badge orange « Biographie à compléter ».

- [ ] **Parcours détaillé** — formation, dates et étapes clés
- [ ] **Fonctions et mandats politiques** exercés, avec leurs dates
- [ ] **Lien avec ADEBES** — fonction exercée dans l'association, ou nature du soutien apporté
- [ ] `public/images/hero/hero-biographie.jpg` — photo de couverture (1920×1080 min.)
- [ ] `public/images/biographie/portrait.jpg` — portrait vertical 3:4

> Une fois les précisions fournies, retirez les entrées correspondantes de `informationsAFournir` : la section « Informations en attente » disparaît d'elle-même dès que la liste est vide.

---

## 🟢 Souhaitable — quand vous le pourrez

### 11. Rapports d'activité

- [ ] Déposer les PDF dans `public/documents/` (`rapport-activite-2025.pdf`, etc.)

> Le bouton de téléchargement n'apparaît sur `/impact` que si le fichier existe. Publier ne serait-ce qu'un rapport change beaucoup la perception d'une association qui collecte des dons.

### 12. Vidéo de présentation

- [ ] Héberger la vidéo sur YouTube (non répertorié), Vimeo ou Cloudinary
- [ ] Renseigner l'identifiant dans `src/app/galerie/page.tsx` (composant `VideoEmbed`)
- [ ] Déposer l'image d'aperçu `public/images/galerie/video-poster.jpg`

### 13. Coordonnées de paiement

Fichier : `src/app/don/page.tsx`

- [ ] Numéros Orange Money / MTN Mobile Money, si vous souhaitez les afficher publiquement
- [ ] Coordonnées bancaires pour les virements et partenariats
- [ ] Décider si un agrégateur de paiement en ligne (CinetPay ou équivalent) sera intégré

### 14. Après la mise en ligne

- [ ] Rattacher le domaine sur Vercel et mettre `NEXT_PUBLIC_SITE_URL` à jour
- [ ] Déclarer le site dans [Google Search Console](https://search.google.com/search-console) et soumettre le sitemap
- [ ] Vérifier les données structurées : [test des résultats enrichis](https://search.google.com/test/rich-results)
- [ ] Mesurer la performance : [PageSpeed Insights](https://pagespeed.web.dev/)
- [ ] Tester l'accessibilité : [WAVE](https://wave.webaim.org/)
- [ ] Tester sur un Android d'entrée de gamme et un iPhone réels
- [ ] Inscrire l'association dans les annuaires d'ONG camerounais

---

## Comment repérer ce qui manque, dans le site lui-même

| Ce que vous voyez | Ce que cela signifie |
|---|---|
| Un rectangle coloré avec une icône d'appareil photo | Image absente — le chemin attendu est écrit dessus en mode développement |
| `[À COMPLÉTER]` | Information légale ou institutionnelle à fournir dans `site-config.ts` |
| Badge orange « Exemple — à remplacer » | Contenu de démonstration |
| Un tiret « — » à la place d'un chiffre | Chiffre non encore fourni |
| « Bientôt disponible » | Fonctionnalité prévue, en attente d'une information de votre part |

Aucune de ces mentions n'est une erreur : ce sont des emplacements en attente, volontairement visibles pour qu'aucun ne soit oublié.
