// Prompt maître à envoyer à un LLM (ChatGPT, Claude, Gemini, Perplexity…).
// Adapté aux formats CSV réellement importés par l'Atelier HGGSP :
//   notions.csv / qcm.csv / appariement.csv
export const MASTER_PROMPT = `# PROMPT MAÎTRE — Génération d'exercices CSV pour l'Atelier HGGSP

Tu es un générateur d'exercices pédagogiques pour un cours d'Histoire-Géographie-Géopolitique (HGGSP, niveau Terminale). Je vais te fournir un cours et, éventuellement, un ou plusieurs documents support (carte, graphique, photographie, texte).

À partir de ce contenu, tu dois produire **3 fichiers CSV**, strictement conformes aux modèles ci-dessous, aucun autre livrable (pas d'application, pas de résumé formaté, pas de tableau Markdown, pas d'explications longues). Aucune information ne doit provenir d'ailleurs que du cours et des documents fournis — si une notion est ambiguë ou absente, signale-le plutôt que d'inventer.

Ces fichiers seront importés tels quels dans l'Atelier HGGSP : respecte exactement les en-têtes et les règles, sinon l'import échouera.


---


## RÈGLES GÉNÉRALES DES 3 CSV (obligatoires)


- Encodage UTF-8, séparateur point-virgule \`;\`
- Première ligne = en-têtes, reprises **exactement telles quelles** ci-dessous (accents, casse, ordre des colonnes)
- Une ligne = un exercice ; aucune cellule ne contient de retour à la ligne
- Pas de colonnes supplémentaires, pas de colonne id
- Génère de vrais fichiers, jamais le CSV en bloc de texte à copier-coller
- N'importe quel contenu entre guillemets peut contenir des virgules et des guillemets (les échapper en \`""\`)


---


## 1. notions.csv


En-tête exacte :
\`\`\`
Terme;Définition;Contexte ou paradoxe
\`\`\`


Chaque terme est utilisable ensuite pour générer des flashcards (terme → définition) et des QCM. Donc :
- **Terme** : une notion clé du cours
- **Définition** : définition précise, fidèle au cours, en une phrase claire
- **Contexte ou paradoxe** : un élément de contexte (historique, géographique, politique) ou une tension/paradoxe — jamais une simple reformulation de la définition


---


## 2. qcm.csv


En-tête exacte :
\`\`\`
Question;Proposition A;Proposition B;Proposition C;Proposition D;Proposition E;Proposition F;Bonne réponse
\`\`\`


- Toujours **4 propositions renseignées (A à D)** ; les colonnes **Proposition E et F restent vides**
- **Bonne réponse** : uniquement la lettre (A, B, C ou D)
- Niveau Terminale — compétence visée : **analyser un document en mobilisant ses connaissances**
- Chaque question suit le schéma : élément observable (dans le document, s'il y en a un) → mobilisation d'une connaissance du cours → interprétation
- Les 4 propositions doivent être **toutes plausibles** (pas de distracteur absurde)
- À proscrire : la lecture purement littérale (couleur, légende, identification directe d'un lieu/date sans raisonnement)
- Fais varier les types de raisonnement (mécanismes, interdépendances, causalités, conséquences, comparaisons entre espaces/acteurs)
- Si un document est fourni : il doit servir de point de départ réel, et chaque question doit pouvoir être justifiée à la fois par le document ET par le cours


---


## 3. appariement.csv


En-tête exacte :
\`\`\`
Élément A;Élément B
\`\`\`


- Chaque ligne est une paire à mettre en relation (notion/définition courte, acteur/rôle, cause/conséquence, date/événement…)
- Chaque paire doit nécessiter une vraie mise en relation intellectuelle, pas une évidence triviale ni une paire mot=mot
- Dans l'application les deux colonnes sont mélangées pour l'élève ; le sens A→B doit donc être lisible dans les deux sens


---


## CONTRÔLE FINAL (à vérifier silencieusement avant de livrer)


- En-têtes copiées exactement (accents, majuscules, ordre des colonnes) ?
- qcm.csv : exactement 4 propositions (E et F vides), une seule lettre en bonne réponse, raisonnement réel exigé ?
- Document fourni → effectivement mobilisé dans les questions ?
- Aucune information hors cours/documents ?
- Séparateur \`;\`, UTF-8, aucune cellule multi-lignes ?


---


## LIVRAISON


1. Présente brièvement (nombre de notions, de QCM, d'appariements)
2. Fournis les 3 fichiers séparément : \`notions.csv\`, \`qcm.csv\`, \`appariement.csv\`
3. Ne regroupe jamais les trois types dans un seul fichier
`;

// Court prompt « pour un chapitre déjà couvert » si l'utilisateur veut relancer sans tout répéter
export function promptWithCourse(course) {
  return (
    MASTER_PROMPT +
    '\n\n---\n\n## COURS À TRAITER\n\nSi tu disposes déjà du prompt complet ci-dessus et que je ne te fournis que le cours ci-dessous, traite uniquement ce contenu selon les règles énoncées.\n\n' +
    course
  )
}
