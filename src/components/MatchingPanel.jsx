import { uid } from '../lib/model.js'
import { parseCsv, toObjects } from '../lib/csv.js'
import CsvImportButton from './CsvImportButton.jsx'

export default function MatchingPanel({ ex, setEx }) {
  const pairs = ex.pairs || []
  const update = (id, patch) =>
    setEx((prev) => ({
      ...prev,
      pairs: prev.pairs.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }))
  const add = () =>
    setEx((prev) => ({ ...prev, pairs: [...prev.pairs, { id: uid(), a: '', b: '' }] }))
  const remove = (id) =>
    setEx((prev) => ({ ...prev, pairs: prev.pairs.filter((p) => p.id !== id) }))

  const onImport = (text) => {
    const rows = parseCsv(text)
    if (!rows.length) {
      alert('Le fichier CSV est vide.')
      return
    }
    const objs = toObjects(rows, 0)
    const imported = objs.map((o) => {
      const key = (name) => Object.keys(o).find((k) => k.includes(name))
      const kLeft =
        key('arg') || key('elementa') || key('a') || key('gauche') || key('paire') || 'col0'
      const kRight =
        key('notion') || key('elementb') || key('b') || key('droite') || key('definition') || 'col1'
      return {
        id: uid(),
        a: o[kLeft] || '',
        b: o[kRight] || '',
      }
    })
    setEx((prev) => ({
      ...prev,
      pairs: [...prev.pairs, ...imported],
    }))
    alert(`${imported.filter((i) => i.a && i.b).length} paire(s) importée(s).`)
  }

  return (
    <div className="card">
      <div className="space">
        <h2 style={{ margin: 0 }}>Appariement</h2>
        <div className="row">
          <CsvImportButton onFile={onImport} label="Importer CSV" />
          <button className="btn small" onClick={add}>+ Ajouter</button>
        </div>
      </div>
      <p className="hint">
        Chaque ligne relie un élément A (à gauche) à un élément B (à droite). L’ordre est
        mélangé pour l’élève. Import CSV : colonnes <span className="mono">arg;notion</span>.
      </p>
      {pairs.map((p, i) => (
        <div key={p.id} className="list-item">
          <span className="badge">{i + 1}</span>
          <input
            type="text"
            placeholder="Élément A (ex : argument)"
            value={p.a}
            onChange={(e) => update(p.id, { a: e.target.value })}
          />
          <input
            type="text"
            placeholder="Élément B (ex : notion)"
            value={p.b}
            onChange={(e) => update(p.id, { b: e.target.value })}
          />
          <button className="btn danger small" onClick={() => remove(p.id)}>✕</button>
        </div>
      ))}
      {pairs.length === 0 && <p className="hint">Aucune paire pour l’instant.</p>}
    </div>
  )
}
