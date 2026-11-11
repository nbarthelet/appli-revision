# AGENTS.md — Contexte du projet

## Résumé
Application React/Vite pour créer et exporter des exercices de révision HGGSP.
L'élève reçoit un fichier HTML autonome (pas de dépendances, fonctionne hors-ligne/mobile).

## Commandes
- `npm run dev` : serveur de dev (localhost:5173)
- `npm.cmd run build` : build de production
- `npm run preview` : prévisualiser le build

## Architecture clé
- `src/App.jsx` : composant principal (barre sup, onglets, bouton copier prompt)
- `src/components/Editor.jsx` : éditeur (grille 2 colonnes avec emojis par type d'exercice)
- `src/components/*Panel.jsx` : un panneau par type (Notions, QCM, Matching, Flashcards, Map, Timeline, Cloze)
- `src/lib/export.js` : **fichier central** — génère le HTML/CSS/JS autonome pour l'élève (page d'accueil + exercices)
- `src/lib/model.js` : structure de données, uid(), closureWords(), normalizeKey()
- `src/lib/prompt.js` : prompt maître pour générer des CSV via IA
- `src/styles.css` : styles de l'éditeur
- `index.html` : point d'entrée Vite
- `vite.config.js` : config Vite

## Design System
- **Fond** : cream `#FAF7F2` (jamais de blanc pur)
- **Accent** : terracotta `#FF5B00` (fixe, pas de thème color)
- **Texte** : chocolat `#281811`
- **Pastels** : rose `#FFD4E5`, bleu `#CFE2FF`, lime `#A2FF79`
- **Font** : Nunito / Poppins (arrondie, bold 800)
- **Rayons** : cartes 20-26px, boutons 14-18px, pills 999px
- **Pas de shadows lourdes**, relief par blocs de couleur
- **Pas de HTML5 DnD** — tout est en clic + Pointer Events (mobile-friendly)

## Fonctionnalités
- Import CSV (notions, QCM, appariements, fiche d'objectifs, repères de carte) avec séparateur auto-détecté
- Décodeur CSV unique (`src/lib/csv.js` → `decodeCsvBuffer`) : UTF-8, UTF-16, CP850 (DOS), Windows-1252, BOM
- Prompt maître copiable pour générer des CSV via IA
- Export HTML autonome avec page d'accueil (grille d'exercices)
- Progress bars après vérification
- Bouton "Recommencer" sur tous les types
- Flashcards avec flip 3D
- Repères de carte : cercle, rectangle ou symbole (banque de ~65 glyphes, avec taille,
  position et taille de police de l'étiquette). Import CSV de repères géoréférencés.
- Annotations du fond (décor) : ligne à main levée, texte, symbole, zone colorée,
  zone hachurée. Ce ne sont pas des réponses : elles ne sont pas cliquables dans la
  page élève (`pointer-events: none`, sous les repères).
- Zones drag & drop pour frise/carte image
- Sauvegarde automatique différée (600 ms) dans le navigateur + alerte si le quota est atteint
- Téléchargement en Blob (les URL `data:` cassent au-delà de ~2 Mo)

## Repères de carte : format CSV
`nom;forme;x1;y1;x2;y2;categorie;symbole;taille;position;police`
- `circle` : x1,y1 = centre, x2 = rayon en % de la largeur
- `rect`   : x1,y1 et x2,y2 = deux coins
- `marker` : x1,y1 = position, puis symbole (`pin`, `star`, `square`…), taille (px),
  position de l'étiquette (`right`, `left`, `top`, `bottom`), police (px)

## Règles techniques
- `radiusPct` est une **fraction** de la largeur de l'image (0-1), pas un pourcentage.
- Un rectangle se redimensionne par **une seule poignée** (coin bas-droit) qui étire en
  largeur et en hauteur, l'angle haut-gauche restant fixe.
- Les annotations (`src/lib/deco.js`) sont décoratives : elles ne doivent jamais
  devenir des cibles de dépôt. La géométrie est calculée par `decoGeometry()`,
  utilisée par l'éditeur ET par l'export, pour éviter toute divergence.
- `newDecoration(type, patch)` : le `patch` prime sur les valeurs par défaut
  (l'identifiant reste celui de la fonction).
- Les emoji (📍 🧭 🌊…) ne se recolorent pas : utiliser les formes géométriques ou
  la famille « traits fins » pour un symbole à la couleur de la carte.
- L'étiquette attendue n'est jamais visible dans la page élève : elle est placée
  par l'élève (glisser-déposer ou clic).
- Pas de doublon d'étiquette : la banque d'étiquettes de l'élève est dédoublonnée
  (l'éditeur alerte).
- Les anciens « marqueurs » (mode obsolète) sont migrés automatiquement en zones.

## Notes
- `npm.cmd run build` (pas `npm run build`) sur ce PC Windows
- Le fichier CSV de test QCM est à `C:\Users\nicolas B\Desktop\qcm.csv`
- L'utilsiteur est un prof HGGSP, ses élèves utilisent des smartphones
