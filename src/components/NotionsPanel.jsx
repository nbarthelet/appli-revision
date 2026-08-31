import { uid } from '../lib/model.js'
import { parseCsv, toObjects } from '../lib/csv.js'
import CsvImportButton from './CsvImportButton.jsx'

export default function NotionsPanel({ ex, setEx }) {
  const notions = ex.notions || []
  const update = (id, patch) =>
    setEx((prev) => ({
      ...prev,
      notions: prev.notions.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    }))
  const add = () =>
    setEx((prev) => ({
      ...prev,
      notions: [...prev.notions, { id: uid(), term: '', definition: '', context: '' }],
    }))
  const remove = (id) =>
    setEx((prev) => ({ ...prev, notions: prev.notions.filter((n) => n.id !== id) }))

  const onImport = (text) => {
    const rows = parseCsv(text)
    if (!rows.length) {
      alert('Le fichier CSV est vide.')
      return
    }
    const objs = toObjects(rows, 0)
    const imported = objs.map((o) => {
      // Colonnes détectées par en-tête (insensible à la casse ET aux accents), sinon par position
      const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const key = (name) => Object.keys(o).find((k) => norm(k).includes(norm(name)))
      const kt = key('terme') || key('nom') || key('ter') || 'col0'
      const kd = key('definit') || key('def')
      const kc = key('contexte') || key('context') || key('exemple')
      return {
        id: uid(),
        term: o[kt] || '',
        definition: kd ? o[kd] || '' : (o['col1'] || ''),
        context: kc ? o[kc] || '' : (o['col2'] || ''),
      }
    })
    setEx((prev) => ({
      ...prev,
      notions: [...prev.notions, ...imported],
    }))
    alert(`${imported.filter((i) => i.term).length} notion(s) importée(s).`)
  }

  return (
    <div className="card">
      <div className="space">
        <h2 style={{ margin: 0 }}>Notions</h2>
        <div className="row">
          <CsvImportButton onFile={onImport} label="Importer CSV" />
          <button className="btn small" onClick={add}>+ Ajouter</button>
        </div>
      </div>
      <p className="hint">
        Import CSV : une ligne par notion, colonnes <span className="mono">terme;définition;contexte</span>.
        Ces notions servent aussi à générer les flashcards et les QCM.
      </p>
      {notions.map((n) => (
        <div key={n.id} className="expand">
          <div className="row" style={{ marginBottom: 8 }}>
            <input
              type="text"
              placeholder="Terme (ex : Puissance)"
              value={n.term}
              onChange={(e) => update(n.id, { term: e.target.value })}
            />
            <button className="btn danger small" onClick={() => remove(n.id)}>Suppr.</button>
          </div>
          <label className="field">
            <span>Définition</span>
            <textarea
              rows={2}
              value={n.definition}
              onChange={(e) => update(n.id, { definition: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Contexte / exemple</span>
            <textarea
              rows={2}
              value={n.context}
              onChange={(e) => update(n.id, { context: e.target.value })}
            />
          </label>
        </div>
      ))}
      {notions.length === 0 && <p className="hint">Aucune notion pour l’instant.</p>}
    </div>
  )
}
