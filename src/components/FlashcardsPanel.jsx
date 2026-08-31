import { uid } from '../lib/model.js'

export default function FlashcardsPanel({ ex, setEx }) {
  const cards = ex.cards || []
  const notions = ex.notions || []
  const update = (id, patch) =>
    setEx((prev) => ({
      ...prev,
      cards: prev.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }))
  const add = () =>
    setEx((prev) => ({
      ...prev,
      cards: [...prev.cards, { id: uid(), question: '', answer: '' }],
    }))
  const remove = (id) =>
    setEx((prev) => ({ ...prev, cards: prev.cards.filter((c) => c.id !== id) }))

  const generateFromNotions = () => {
    const valid = notions.filter((n) => n.term && n.definition)
    if (!valid.length) {
      alert('Aucune notion avec terme et définition. Ajoutez des notions d’abord.')
      return
    }
    const generated = valid.map((n) => ({
      id: uid(),
      question: n.term,
      answer: n.definition,
    }))
    if (
      cards.some((c) => c.question || c.answer) &&
      !confirm('Des flashcards existent déjà. Remplacer par la génération depuis les notions ?')
    ) {
      return
    }
    setEx((prev) => ({ ...prev, cards: generated }))
    alert(`${generated.length} flashcard(s) générée(s) : face = terme, verso = définition.`)
  }

  return (
    <div className="card">
      <div className="space">
        <h2 style={{ margin: 0 }}>Flashcards</h2>
        <div className="row">
          <button
            className="btn small ghost"
            onClick={generateFromNotions}
            disabled={!notions.length}
          >
            ⚙ Générer depuis les notions
          </button>
          <button className="btn small" onClick={add}>+ Ajouter</button>
        </div>
      </div>
      <p className="hint">
        Face : question. Verso : réponse. « Générer depuis les notions » crée une carte par
        notion : face = terme, verso = définition. L’élève retourne la carte puis attribue un
        statut (maîtrisé / à consolider / à revoir).
      </p>
      {cards.map((c) => (
        <div key={c.id} className="expand">
          <div className="row" style={{ marginBottom: 8 }}>
            <input
              type="text"
              placeholder="Question (face)"
              value={c.question}
              onChange={(e) => update(c.id, { question: e.target.value })}
            />
            <button className="btn danger small" onClick={() => remove(c.id)}>Suppr.</button>
          </div>
          <textarea
            rows={2}
            placeholder="Réponse (verso)"
            value={c.answer}
            onChange={(e) => update(c.id, { answer: e.target.value })}
          />
        </div>
      ))}
      {cards.length === 0 && <p className="hint">Aucune carte pour l’instant.</p>}
    </div>
  )
}
