# Où déposer les images

Chaque dossier attend des fichiers précis. **Déposez-les au bon chemin : le site les affiche automatiquement, sans modification de code.** Tant qu'un fichier est absent, un emplacement coloré s'affiche à sa place (avec le chemin attendu écrit dessus en mode développement).

## Le format n'a pas d'importance — l'ordre de priorité, si

Les extensions sont interchangeables : peu importe celle écrite dans le tableau ci-dessous, le site sert le fichier réellement présent. Quand **plusieurs formats du même nom** cohabitent dans le dossier, c'est cet ordre qui tranche :

| Priorité | Extension |
|---|---|
| 1 | `.png` |
| 2 | `.jpeg` (puis `.jpg`) |
| 3 | `.svg` |
| dernier recours | `.webp`, `.avif` |

Concrètement : déposer `cover.png` à côté d'un `cover.jpeg` existant **remplace** le visuel partout où il est affiché, sans supprimer l'ancien fichier ni modifier une ligne de code. Pour revenir en arrière, il suffit de retirer le `.png`.

| Dossier | Fichiers attendus | Format |
|---|---|---|
| `logo/` | `logo-full-color.svg`, `logo-full-white.svg`, `logo-compact-color.svg`, `logo-compact-white.svg`, `icon-192.png`, `icon-512.png`, `og-image.jpg` | SVG ; OG en 1200×630 — voir ci-dessous |
| `hero/` | `hero-home.jpg`, `hero-a-propos.jpg`, `hero-biographie.jpg`, `hero-programmes.jpg`, `hero-actualites.jpg`, `hero-galerie.jpg`, `hero-impact.jpg`, `hero-don.jpg`, `hero-benevolat.jpg`, `hero-contact.jpg` | 1920×1080 min., 16:9 ou plus large |
| `a-propos/` | `histoire-01.jpg`, `histoire-02.jpg`, `equipe-<id>.jpg` | 3:4 pour les portraits |
| `biographie/` | `portrait.jpg` | 3:4 (portrait vertical) |
| `programmes/<slug>/` | `cover.jpg`, `01.jpg`, `02.jpg`, `03.jpg` | 4:3 |
| `actualites/` | `<slug-de-larticle>-cover.jpg` | 3:2 |
| `galerie/` | `education-01.jpg`, `sante-01.jpg`, `communaute-01.jpg`, `environnement-01.jpg`… | carré ou 4:3 |
| `temoignages/` | `temoignage-<id>.jpg` | portrait carré |

## Les quatre fichiers du logo

Le logo est le seul visuel affiché sur **toutes** les pages, sur fond clair comme sur fond sombre et par-dessus les photos de hero. Il lui faut donc quatre déclinaisons du même dessin :

| Fichier | Contenu | Où il sert |
|---|---|---|
| `logo-full-color.svg` | verrouillage complet : pictogramme + ADEBES + raison sociale + signature | pied de page (fond bleu nuit) |
| `logo-full-white.svg` | le même, entièrement blanc | pied de page, thème sombre |
| `logo-compact-color.svg` | pictogramme + « ADEBES » seul | header, menu mobile (thème clair) |
| `logo-compact-white.svg` | le même, entièrement blanc | header sur photo, thème sombre |

Trois règles pour que le remplacement se passe bien :

1. **Cadrez au plus près.** Aucune marge vide autour du dessin : la mise en page ajoute ses propres espacements. Une marge intégrée au fichier réduit d'autant la taille visible du logo dans un header de 64 px.
2. **La version blanche doit être réellement blanche** (`fill="#ffffff"`), pas une copie de la version foncée : sinon le logo disparaît purement et simplement en thème sombre.
3. **La version compacte n'est pas facultative.** Les trois lignes de texte du verrouillage complet ne deviennent lisibles qu'à partir de ~80 px de haut ; dans le header elles ne produisent qu'une bouillie grise.

## La galerie est automatique

Déposez autant de photos que vous voulez dans `galerie/` en respectant `categorie-NN.jpg` : elles sont détectées au build et rangées dans le bon filtre. Catégories reconnues : `education`, `sante`, `communaute`, `environnement`.

Pour des textes alternatifs descriptifs, créez `galerie/legendes.json` :

```json
{
  "education-01.jpg": "Atelier de soutien scolaire à Bonabéri, Douala",
  "sante-01.jpg": "Consultation lors de la campagne médicale de Nkongsamba"
}
```

## Règles

- **Moins de 400 Ko par image.** Compressez avant import ([Squoosh](https://squoosh.app), [TinyPNG](https://tinypng.com)). Le public navigue majoritairement sur données mobiles.
- **Une photo = un usage.** Ne réutilisez jamais la même image entre deux sections sans rapport.
- **Provenance maîtrisée uniquement** : photos de l'association, ou droits clairs.
- **Accord des personnes photographiées**, en particulier pour les portraits.
- **Aucune vidéo dans ce dossier** : hébergez-les en externe (voir le README à la racine).
