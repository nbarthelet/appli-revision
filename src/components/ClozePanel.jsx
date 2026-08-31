import { uid, closureWords } from '../lib/model.js'

export default function ClozePanel({ ex, setEx }) {
  const clozes = ex.clozes || []
  const patch = (i, p) =>
    setEx((prev) => ({
      ...prev,
      clozes: prev.clozes.map((c, idx) => (idx === i ? { ...c, ...p } : c)),
    }))
  const add = () =>
    setEx((prev) => ({
      ...prev,
      clozes: [...prev.clozes, { id: uid('cz-'), title: `Texte ${prev.clozes.length + 1}`, text: '', distractors: [] }],
    }))
  const remove = (i) =>
    setEx((prev) => ({ ...prev, clozes: prev.clozes.filter((_, idx) => idx !== i) }))

  return (
    <div className="card">
      <div className="space">
        <h2 style={{ margin: 0 }}>Texte à trous</h2>
        <button className="btn small" onClick={add}>+ Texte</button>
      </div>
      <p className="hint" style={{ marginBottom: 12 }}>
        Rédigez un texte et encadrez les mots à deviner avec des crochets, par exemple :{' '}
        <span className="mono">Les États cherchent à accroître leur [puissance].</span>
      </p>
      {clozes.map((c, i) => {
        const words = closureWords(c.text)
        return (
          <div key={c.id} className="expand">
            <div className="row" style={{ marginBottom: 8 }}>
              <input
                type="text"
                placeholder="Titre du texte"
                value={c.title}
                onChange={(e) => patch(i, { title: e.target.value })}
              />
              <button className="btn danger small" onClick={() => remove(i)}>Suppr.</button>
            </div>
            <textarea
              rows={5}
              placeholder="Texte avec [mots] entre crochets…"
              value={c.text}
              onChange={(e) => patch(i, { text: e.target.value })}
            />
            <div className="row" style={{ marginTop: 8 }}>
              <input
                type="text"
                placeholder="Distracteurs (séparés par ;) — mots qui n'ont pas leur place"
                value={(c.distractors || []).join(' ; ')}
                onChange={(e) =>
                  patch(i, { distractors: e.target.value.split(';').map((s) => s.trim()).filter(Boolean) })
                }
              />
            </div>
            <p className="hint" style={{ marginTop: 8 }}>
              {words.length
                ? `Mots à trouver (${words.length}) : ${words.join(', ')}`
                : 'Aucun mot entre crochets pour l’instant.'}
            </p>
          </div>
        )
      })}
      {clozes.length === 0 && <p className="hint">Aucun texte à trous.</p>}
    </div>
  )
}
