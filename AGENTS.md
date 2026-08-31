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
- Import CSV (notions, QCM, appariements) avec séparateur auto-détecté
- Prompt maître copiable pour générer des CSV via IA
- Export HTML autonome avec page d'accueil (grille d'exercices)
- Progress bars après vérification
- Bouton "Recommencer" sur tous les types
- Flashcards avec flip 3D
- Zones drag & drop pour frise/carte image

## Notes
- `npm.cmd run build` (pas `npm run build`) sur ce PC Windows
- Le fichier CSV de test QCM est à `C:\Users\nicolas B\Desktop\qcm.csv`
- L'utilsiteur est un prof HGGSP, ses élèves utilisent des smartphones
