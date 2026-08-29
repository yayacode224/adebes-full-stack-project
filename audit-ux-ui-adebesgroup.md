# Audit UX/UI, Design & Frontend — adebesgroup.com (ADEBES)

**Site audité :** https://adebesgroup.com
**Organisation :** ADEBES – Association pour le Développement et le Bien-être Social (Cameroun)
**Date de l'audit :** Août 2026
**Objectif :** évaluer le site actuel et poser les bases d'une refonte complète — mobile-first, moderne, intuitive et convaincante.

---

## Note méthodologique

Cet audit s'appuie sur une inspection directe du code et du contenu du site en ligne (structure HTML, navigation, liens, images, métadonnées) ainsi que sur une recherche de la présence en ligne de l'association. Les éléments **structurels, fonctionnels et de contenu** ci-dessous sont des constats directs et vérifiables. Les éléments **purement visuels** (rendu pixel-perfect, contrastes exacts, comportements JavaScript en conditions réelles) n'ont pas pu être observés dans un navigateur et sont signalés comme *« à tester »* avec l'outil recommandé (Lighthouse, PageSpeed Insights, WAVE, tests sur appareils réels). Cette distinction est volontaire : mieux vaut un audit honnête qu'une liste de suppositions.

---

## 1. Résumé exécutif

**Verdict : une refonte complète est justifiée, pas une simple retouche.**

Le site repose sur une structure de type « template caritatif » générique, mono-page (tout le contenu est chargé sur une seule URL avec des ancres `#section`). Le message de mission est clair et touchant, mais l'exécution actuelle nuit à la crédibilité de l'association plutôt qu'elle ne la sert :

- **Parcours utilisateurs cassés** : le bouton principal « Devenir Bénévole » et les 8 liens « En savoir plus » des programmes ne mènent nulle part.
- **Contenu daté** : les actualités les plus récentes remontent à janvier 2025 (plus de 18 mois), ce qui donne l'impression d'une association à l'arrêt.
- **Un seul canal de conversion** : dons et contact reposent exclusivement sur WhatsApp — aucun moyen de paiement direct (Mobile Money, carte), aucun formulaire, aucune collecte d'e-mail.
- **Visuels incohérents** : photos réutilisées d'une section à l'autre, noms de fichiers révélant des images issues de recherches Google/Bing Images plutôt que d'une photothèque propre à l'association.
- **Absence quasi totale de visibilité en ligne** : aucune trace de l'association dans les résultats de recherche généraux ni dans les annuaires d'ONG où des structures camerounaises similaires apparaissent.
- **Aucune page dédiée** : impossible de partager un programme ou une actualité précise sur les réseaux sociaux — tout renvoie à la page d'accueil.

Le site a de bonnes fondations (message clair, structure de sections logique, meta viewport mobile présent) mais doit être repensé en profondeur : architecture multi-pages, parcours de don réel, contenu vivant, et identité visuelle propre à ADEBES plutôt qu'à un template générique.

---

## 2. Points forts à conserver

Une refonte ne doit pas jeter ce qui fonctionne :

- **Message de mission clair dès le hero** : « Construisons un avenir meilleur ensemble » + description concise du rôle de l'association.
- **Structure de sections cohérente** dans l'intention : présentation, valeurs, programmes, impact, galerie, actualités, don, contact, FAQ.
- **Meta viewport correctement configuré** — la base technique du responsive est en place.
- **Meta description SEO présente et pertinente** sur la page d'accueil.
- **Filtre de galerie par catégorie** (Tous / Éducation / Santé / Communauté / Environnement) — bon pattern UX, à fiabiliser.
- **WhatsApp comme canal de contact** : c'est un réflexe culturellement pertinent et à fort taux de réponse au Cameroun — à **conserver en complément**, pas à remplacer, d'autres canaux.
- **Alt text descriptifs** présents sur plusieurs images (bon réflexe d'accessibilité, à généraliser).
- **FAQ intégrée** qui répond à de vraies questions de donateurs (utilisation des dons, comment devenir bénévole).

---

## 3. Constats critiques — bugs et liens morts recensés

| # | Élément concerné | Problème constaté | Impact |
|---|---|---|---|
| 1 | Bouton « Devenir Bénévole » (en-tête + pied de page) | Pointe vers l'ancre `#benevolat` : aucune section correspondante détectée sur la page | 🔴 Élevé — CTA principal mort |
| 2 | Les 8 liens « En savoir plus » (programmes) | Tous pointent vers `#` (aucune destination) | 🔴 Élevé — impossible d'approfondir un programme |
| 3 | Les liens « Lire plus » (actualités) | Tous pointent vers `#` — pas de vraies pages d'articles | 🔴 Élevé — pas de partage possible, pas de détail |
| 4 | Un visuel de la galerie | Balise image sans source définie → image cassée | 🟠 Moyen |
| 5 | Second numéro WhatsApp en pied de page (+237 696 99 07 23) | Le lien pointe en réalité vers le premier numéro | 🟠 Moyen — confusion, numéro affiché inutilisable |
| 6 | Lien de navigation « Nos Actions » | Aucune section dédiée distincte de « Nos Programmes » n'a été identifiée | 🟠 Moyen — confusion d'architecture |
| 7 | Compteurs chiffrés (bénéficiaires, projets, bénévoles, années) | Affichent « 0 » dans le contenu ; l'un des libellés apparaît fusionné avec une valeur (« +30 Projets ») de façon incohérente | 🟠 Moyen — chiffres invisibles si JS lent/absent, incohérence visuelle probable |
| 8 | Visuels réutilisés entre sections sans rapport | Ex. une même photo sert à la fois de photo héros, d'illustration « Inclusion sociale » et de photo de galerie « Aide communautaire » ; la photo « Santé » ré-apparaît en actualité « Campagne santé » | 🟠 Moyen — dilue la crédibilité du contenu |
| 9 | Noms de fichiers image exposés publiquement (`OIP (2).webp`, `telechargement-2.jpeg`, `WhatsApp Image 2026-07-26 at 15.08.03.jpeg`) | Ces noms trahissent des images récupérées depuis Bing/Google Images ou exportées telles quelles depuis WhatsApp, plutôt qu'une photothèque propre et libre de droits | 🔴 Élevé — risque de droits d'auteur + image non professionnelle |
| 10 | Actualités les plus récentes datées de janvier 2025 | Plus de 18 mois sans publication visible, alors qu'au moins une photo datée de juillet 2026 existe déjà sur le site | 🔴 Élevé — impression d'association inactive |

---

## 4. Analyse détaillée par thématique

### 4.1 Architecture de l'information & navigation

Le site est **entièrement mono-page** : chaque item de navigation (Accueil, À propos, Nos Actions, Nos Programmes, Galerie, Actualités, Faire un Don, Contact) renvoie vers une ancre de la même URL. C'est acceptable pour un site vitrine très simple, mais devient un frein dès qu'il y a :
- 8 programmes différents qui mériteraient chacun leur propre page (détails, chiffres, témoignages, mises à jour) ;
- des actualités qu'on voudrait partager individuellement ;
- un besoin de référencement naturel sur des requêtes précises (ex. « aide éducation Douala », « ONG santé Cameroun »).

La navigation contient aussi une incohérence (« Nos Actions » vs « Nos Programmes », voir constat #6) qui doit être clarifiée avant toute refonte visuelle.

### 4.2 Contenu, fraîcheur & crédibilité

Le contenu institutionnel (mission, valeurs, présentation) est correctement écrit. En revanche :
- Les statistiques d'impact et les actualités ne sont pas tenues à jour, ce qui est particulièrement dommageable pour une organisation qui vit de la confiance des donateurs.
- Aucune histoire individuelle (témoignage d'un bénéficiaire, d'un bénévole, d'un partenaire) n'est mise en avant — seul du texte générique décrit chaque programme.
- Aucun rapport annuel, financier ou d'activité n'est publié en ligne, alors que le site promet un « rapport » envoyé sur demande pour chaque don : rendre une partie de cette transparence **publique** renforcerait fortement la confiance.

### 4.3 Expérience de don & de bénévolat (le cœur de la conversion)

C'est la zone la plus critique pour une association :
- **Un seul canal** : tout don ou contact passe par un lien WhatsApp pré-rempli. Cela exclut les donateurs sans WhatsApp, les diasporas souhaitant payer par carte, et ne permet aucune collecte d'e-mail pour des campagnes futures.
- **Aucun montant suggéré, aucune récurrence** (don ponctuel vs mensuel), aucune option de paiement mobile money (Orange Money, MTN Mobile Money) directement intégrée, alors que ce sont les moyens de paiement les plus utilisés localement.
- **Le parcours bénévole est cassé** (voir constat #1) : le bouton le plus visible du site ne mène à rien de concret.

### 4.4 Images, identité visuelle & cohérence de marque

- Mélange de formats (`.jpg`, `.jpeg`, `.png`, `.webp`) et de provenances hétérogènes, sans direction artistique commune (cadrage, colorimétrie, style).
- Réutilisation des mêmes photos sur des sujets différents (constat #8), ce qui casse l'illusion d'un reportage photo authentique sur le terrain.
- Le nom de domaine (`adebesgroup.com`) ne correspond pas au nom affiché de l'association (« ADEBES »), ni au diminutif attendu — un point à clarifier pour la cohérence de marque et le référencement de marque.
- Le style général (cartes avec icônes, compteurs animés, grille de programmes, galerie filtrable, FAQ en accordéon) correspond à un patron de template caritatif très répandu, sans élément distinctif propre à ADEBES.

### 4.5 Mobile-first & responsive

Le point positif : la balise meta viewport est bien présente, ce qui est la base minimale requise. Cependant, plusieurs risques classiques de ce type de template sont **à tester activement sur appareils réels** :
- Menu hamburger : bon fonctionnement du menu et des sous-éléments au toucher.
- Zones de clic (boutons, liens de la grille de programmes) : respect d'une taille minimale confortable au doigt (~44×44 px).
- Images en fond de section (hero) : comportement au redimensionnement, poids sur réseau mobile.
- Barre de compteurs et cartes de programmes : absence de débordement horizontal sur petits écrans.

Un test réel avec Chrome DevTools (mode responsive), puis sur au moins un appareil Android et un iPhone d'entrée de gamme, est indispensable avant toute mise en production.

### 4.6 Performance technique

Impossible de mesurer un score Lighthouse exact sans rendu navigateur, mais plusieurs signaux structurels indiquent un **risque de poids de page élevé** :
- Des images visiblement issues directement d'un export WhatsApp ou d'un téléphone (souvent 1 à 5 Mo, non redimensionnées) utilisées telles quelles.
- Aucun indice de compression cohérente (mélange de `.jpeg` lourds et de `.webp`).
- Pas d'indice de chargement différé (*lazy loading*) visible sur la galerie, qui contient pourtant de nombreuses images.

Pour un public qui navigue majoritairement sur données mobiles au Cameroun, le poids de page est un enjeu direct de taux d'abandon, pas seulement une question de score technique. **Recommandation immédiate :** lancer le site sur [PageSpeed Insights](https://pagespeed.web.dev/) et [GTmetrix](https://gtmetrix.com/) pour objectiver le diagnostic.

### 4.7 SEO & visibilité en ligne

- Le titre de page et la meta description de l'accueil sont corrects.
- En revanche, une recherche large sur le nom de l'association et sur `site:adebesgroup.com` ne fait remonter **aucun résultat** — ni page indexée visible, ni réseau social, ni présence sur des annuaires d'ONG (des associations camerounaises comparables, elles, y figurent).
- L'architecture mono-page limite structurellement le référencement : une seule URL ne peut pas se positionner sur plusieurs requêtes distinctes (éducation, santé, environnement, dons…).
- Aucune donnée structurée (schema.org `NGO`/`Organization`) n'a été détectée, ce qui prive Google d'informations qui pourraient enrichir l'affichage dans les résultats de recherche.

### 4.8 Accessibilité

- Points positifs : plusieurs images ont un texte alternatif descriptif.
- Points à vérifier en profondeur (non testables sans rendu navigateur) : contraste des textes superposés aux photos (hero, cartes), navigabilité au clavier du menu, du filtre de galerie et de l'accordéon FAQ, visibilité des états de focus.
- **Recommandation :** passer le site refondu dans [WAVE](https://wave.webaim.org/) et viser une conformité WCAG 2.1 niveau AA.

### 4.9 Conformité & transparence institutionnelle

- Aucune mention légale, politique de confidentialité ou numéro d'enregistrement officiel de l'association n'apparaît sur le site — un manque important pour une structure qui collecte des dons.
- Aucun lien vers des réseaux sociaux n'a été trouvé, ce qui prive l'association d'un canal de preuve sociale et de mise à jour facile entre deux refontes de site.
- Aucune carte (Google Maps) ni adresse physique précise, seulement la mention de la ville.

---

## 5. Priorisation des recommandations

| Priorité | Action | Effort | Impact |
|---|---|---|---|
| 🔴 Quick win | Corriger ou masquer tous les liens morts (« En savoir plus », « Lire plus », bouton bénévolat) | Faible | Élevé |
| 🔴 Quick win | Corriger le lien du 2ᵉ numéro WhatsApp | Très faible | Moyen |
| 🔴 Quick win | Publier au moins 2–3 actualités récentes pour rafraîchir la première impression | Faible | Élevé |
| 🔴 Quick win | Remplacer/supprimer l'image cassée de la galerie | Très faible | Moyen |
| 🔴 Quick win | Ajouter mentions légales + politique de confidentialité + numéro d'enregistrement | Faible | Élevé (confiance) |
| 🟠 Moyen terme | Ajouter un moyen de don alternatif (Mobile Money direct, lien de paiement) | Moyen | Élevé |
| 🟠 Moyen terme | Créer un vrai formulaire de contact et de candidature bénévole | Moyen | Élevé |
| 🟠 Moyen terme | Créer des liens vers les réseaux sociaux existants (ou les créer) | Faible | Moyen |
| 🟢 Refonte | Passer d'un site mono-page à une architecture multi-pages avec URLs dédiées | Élevé | Élevé (SEO + partage) |
| 🟢 Refonte | Nouvelle direction visuelle propre à ADEBES (photographie, palette, typographie) | Élevé | Élevé (crédibilité) |
| 🟢 Refonte | Refonte mobile-first complète avec design system | Élevé | Élevé |
| 🟢 Refonte | Mise en place d'un CMS pour que l'équipe publie du contenu sans développeur | Moyen-Élevé | Élevé (fraîcheur durable) |

---

## 6. Proposition d'architecture cible (sitemap)

```
Accueil
├── Qui sommes-nous
│   ├── Mission, vision, valeurs
│   ├── Équipe / gouvernance
│   └── Rapports annuels & transparence financière
├── Nos Programmes (page listing)
│   └── Fiche détaillée par programme (Éducation, Santé, Inclusion, Environnement, etc.)
├── Actualités / Blog
│   └── Page individuelle par article (partageable)
├── Galerie
├── Impact & Transparence (chiffres vérifiés, rapports)
├── Faire un don
│   └── Choix du montant / récurrence / moyen de paiement (Mobile Money, carte, WhatsApp en option)
├── Devenir bénévole
│   └── Formulaire réel + FAQ bénévolat
├── Contact
│   └── Formulaire + carte + réseaux sociaux + WhatsApp
└── Mentions légales / Politique de confidentialité
```

L'accueil garde un rôle de vitrine synthétique (hero, chiffres clés, aperçu des programmes, dernières actualités, CTA don/bénévolat) mais **renvoie vers de vraies pages** plutôt que de tout contenir.

---

## 7. Direction de design recommandée

- **Photographie** : investir dans une séance photo/vidéo sur le terrain (ou au minimum une curation rigoureuse des meilleures photos existantes), avec un traitement colorimétrique cohérent — pour remplacer les visuels d'origine incertaine et les doublons.
- **Palette de couleurs** : une identité propre à ADEBES plutôt que les couleurs par défaut d'un template — à construire avec parcimonie, sans sur-utiliser les couleurs du drapeau camerounais de façon décorative.
- **Typographie** : un couple simple et lisible — une police humaniste pour le corps de texte, une police à plus de caractère pour les titres, avec une hiérarchie claire (H1/H2/H3 cohérente sur toutes les pages).
- **Micro-interactions** : compteurs animés déclenchés au scroll (à corriger, pas à retirer), transitions douces sur les cartes, états de survol clairs sur desktop, retours visuels au tap sur mobile.
- **Mobile-first concret** : une barre d'action fixe en bas d'écran sur mobile (« Faire un don » + « WhatsApp ») pour garder la conversion accessible à tout moment du scroll ; tout le contenu conçu d'abord en une colonne, puis étendu au desktop — pas l'inverse.

---

## 8. Recommandations techniques

- **CMS / gestion de contenu** : privilégier une solution permettant à l'équipe d'ADEBES de publier des actualités et modifier les programmes sans intervention technique (headless CMS type WordPress, ou un site builder no-code selon le budget et les compétences internes).
- **Paiement** : étudier l'intégration d'agrégateurs de paiement présents en Afrique centrale/francophone (ex. CinetPay) permettant Mobile Money (Orange Money, MTN Mobile Money) et carte bancaire, en complément du don via WhatsApp — à valider selon les conditions et frais en vigueur au moment du choix.
- **Images** : format WebP/AVIF systématique, redimensionnement et compression automatiques, chargement différé (*lazy loading*) hors zone visible.
- **Analytics** : mettre en place Google Analytics 4 ou Matomo, ainsi que Google Search Console, pour mesurer objectivement les résultats de la refonte.

---

## 9. Indicateurs à suivre après la refonte

- Temps de chargement mobile (objectif : score Lighthouse mobile > 85)
- Taux de rebond sur la page d'accueil
- Taux de clic sur les CTA « Faire un don » et « Devenir bénévole »
- Nombre de dons / candidatures bénévoles complétés via le nouveau parcours
- Nombre de pages indexées par Google et positions sur les requêtes clés (« association Douala », « ONG éducation Cameroun », etc.)
- Répartition du trafic mobile vs desktop

---

## 10. Feuille de route proposée

1. **Corrections immédiates (1–2 semaines)** : liens morts, contenu daté, mentions légales, image cassée — sans attendre la refonte complète.
2. **Cadrage (2–3 semaines)** : nouvelle architecture de l'information, choix du CMS et des moyens de paiement, définition de la direction visuelle (moodboard, palette, typographie).
3. **Design & développement (4–8 semaines)** : maquettes mobile-first puis desktop, développement multi-pages, intégration du CMS et des paiements.
4. **Contenu & lancement (en parallèle puis continu)** : rédaction des pages, collecte de témoignages, séance photo, tests d'accessibilité et de performance, mise en ligne, suivi des indicateurs.

---

## Conclusion

Le site actuel transmet une mission sincère mais la desservait par une exécution digne d'un modèle générique non finalisé : parcours de conversion cassés, contenu daté, visuels incohérents et quasi-absence de visibilité en ligne. Une refonte complète — multi-pages, mobile-first, avec une vraie identité visuelle et de vrais canaux de don — n'est pas un luxe esthétique ici : c'est ce qui sépare aujourd'hui une association crédible aux yeux d'un donateur ou d'un bénévole potentiel, d'un site qui, en l'état, peut involontairement décourager l'un comme l'autre.
