import { useRef } from 'react'
import { uid } from '../lib/model.js'
import { readImageFile } from '../lib/image.js'
import { parseCsv, toObjects } from '../lib/csv.js'
import CsvImportButton from './CsvImportButton.jsx'

function detectCorrect(header, row) {
  // Cherche la colonne explicitement nommée (bonne réponse / correct / réponse)
  for (let hi = 0; hi < header.length; hi++) {
    const h = header[hi].toLowerCase()
    if (/(bonne|correct|reponse|reponse_bonne|reponse_bonne)/.test(h)) {
      const raw = String(row[hi] ?? '').trim()
      // Si c'est un nombre -> index (1-based → 0-based)
      const num = parseInt(raw, 10)
      if (!Number.isNaN(num)) return num - 1
      // Si c'est une lettre seule A/B/C/D (avec ou sans espaces) -> index direct
      const letterMatch = raw.match(/^([A-Da-d])(\s|$)/)
      if (letterMatch) return letterMatch[1].toUpperCase().charCodeAt(0) - 65
      // Si c'est "Proposition A" ou similaires -> extraire la lettre -> index direct
      const propMatch = raw.match(/^Proposition\s*[A-Da-d]/)
      if (propMatch) return propMatch[0].slice(-1).toUpperCase().charCodeAt(0) - 65
      // Sinon, comportement précédent : retour du texte pour matching par libellé
      return { text: raw }
    }
  }
  // Colonne contenant un index numérique explicite
  for (let hi = 0; hi < header.length; hi++) {
    if (/^idx|^index|^num/.test(header[hi].toLowerCase())) {
      const num = parseInt(row[hi], 10)
      if (!Number.isNaN(num)) return num - 1
    }
  }
  return null
}

export default function QcmPanel({ ex, setEx }) {
  const qcms = ex.qcms || []
  const fileRef = useRef(null)

  const patch = (i, p) =>
    setEx((prev) => ({
      ...prev,
      qcms: prev.qcms.map((q, idx) => (idx === i ? { ...q, ...p } : q)),
    }))
  const add = () =>
    setEx((prev) => ({
      ...prev,
      qcms: [
        ...prev.qcms,
        { id: uid('qcm-'), title: `QCM ${prev.qcms.length + 1}`, docMode: 'text', docText: '', questions: [] },
      ],
    }))
  const remove = (i) =>
    setEx((prev) => ({ ...prev, qcms: prev.qcms.filter((_, idx) => idx !== i) }))

  const onDocFile = async (e, i) => {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      const img = await readImageFile(f)
      patch(i, {
        docMode: 'image',
        docImageDataUrl: img.dataUrl,
        docImageName: img.name,
        docImageWidth: img.width,
        docImageHeight: img.height,
      })
    } catch (err) {
      alert(err.message)
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const onImport = (text) => {
    const rows = parseCsv(text)
    if (!rows.length) {
      alert('Le fichier CSV est vide.')
      return
    }
    const objs = toObjects(rows, 0)
    if (!Object.keys(objs[0]).length && rows.length === 1) {
      alert('Format non reconnu : au moins une ligne d’en-tête est attendue.')
      return
    }
    const header = Object.keys(objs[0])
    const importedQ = []
    let docText = ''
    objs.forEach((row) => {
      // Question = première colonne
      const promptRaw = Object.values(row)[0] || ''
      if (!promptRaw.trim()) return
      // Document optionnel dans une colonne "document"/"texte"
      for (const k of Object.keys(row)) {
        if (/^(document|texte|doc)\b/.test(k.trim().toLowerCase())) {
          if (row[k] && !docText) docText = row[k]
        }
      }
      // Options = colonnes qui ne sont ni la question, ni le document, ni la bonne réponse
      const optionHeaders = header.filter((h) => {
        const low = h.trim().toLowerCase()
        if (low === Object.keys(row)[0].toLowerCase()) return false
        if (/(bonne|correct|reponse|document|texte|doc|idx|index|num)/.test(low)) return false
        return true
      })
      const correct = detectCorrect(header, Object.values(row))
      const options = optionHeaders
        .map((h) => row[h])
        .filter((v) => v !== undefined && String(v).trim() !== '')
      // Résout la bonne réponse si elle est donnée en texte
      let correctIndex = typeof correct === 'number' ? correct : null
      if (correct && correct.text) {
        const found = options.findIndex((o) => String(o).trim() === String(correct.text).trim())
        if (found >= 0) correctIndex = found
      }
      if (options.length >= 2 && correctIndex != null && correctIndex >= 0 && correctIndex < options.length) {
        importedQ.push({ id: uid('qq-'), prompt: promptRaw, options, correctIndex })
      }
    })
    if (!importedQ.length) {
      alert("Aucune question valide importée. Vérifiez la colonne « bonne réponse » (index ou texte).")
      return
    }
    const target = 0
    setEx((prev) => ({
      ...prev,
      qcms: prev.qcms.map((q, i) =>
        i === target
          ? {
              ...q,
              docText: docText || q.docText,
              questions: [...q.questions, ...importedQ],
            }
          : q,
      ),
    }))
    alert(`${importedQ.length} question(s) importée(s).`)
  }

  return (
    <div className="card">
      <div className="space">
        <h2 style={{ margin: 0 }}>QCM – document</h2>
        <div className="row">
          <CsvImportButton onFile={onImport} label="Importer CSV" />
          <button className="btn small" onClick={add}>+ QCM</button>
        </div>
      </div>
      <p className="hint" style={{ marginBottom: 12 }}>
        Import CSV : colonnes <span className="mono">question;option1;option2;…;bonne_réponse</span>.
        La colonne « bonne_réponse » contient l’indice (1, 2, …) ou le texte exact de la bonne option.
        Une colonne « document » (optionnelle) devient le texte du document.
      </p>
      {qcms.map((q, i) => {
        const questions = q.questions || []
        const addQ = () =>
          patch(i, {
            questions: [...questions, { id: uid('qq-'), prompt: '', options: ['', ''], correctIndex: 0 }],
          })
        const updQ = (id, p) =>
          patch(i, { questions: questions.map((qq) => (qq.id === id ? { ...qq, ...p } : qq)) })
        const removeQ = (id) =>
          patch(i, { questions: questions.filter((qq) => qq.id !== id) })
        const setOption = (id, oi, val) => {
          const qq = questions.find((x) => x.id === id)
          const options = qq.options.map((o, idx) => (idx === oi ? val : o))
          updQ(id, { options })
        }
        return (
          <div key={q.id} className="expand">
            <div className="row" style={{ marginBottom: 8 }}>
              <input
                type="text"
                placeholder="Titre du QCM"
                value={q.title}
                onChange={(e) => patch(i, { title: e.target.value })}
              />
              <button className="btn danger small" onClick={() => remove(i)}>Suppr.</button>
            </div>
            <div className="row" style={{ marginBottom: 8 }}>
              <button
                className={`btn small ${q.docMode === 'text' ? '' : 'ghost'}`}
                onClick={() => patch(i, { docMode: 'text' })}
              >
                Document texte
              </button>
              <button
                className={`btn small ${q.docMode === 'image' ? '' : 'ghost'}`}
                onClick={() => patch(i, { docMode: 'image' })}
              >
                Document image
              </button>
              <button className="btn small ghost" onClick={() => fileRef.current?.click()}>
                {q.docMode === 'image' && q.docImageDataUrl ? 'Changer l’image' : 'Charger une image'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => onDocFile(e, i)} />
            </div>
            {q.docMode === 'text' ? (
              <textarea
                rows={4}
                placeholder="Collez ici le texte du document à étudier…"
                value={q.docText}
                onChange={(e) => patch(i, { docText: e.target.value })}
              />
            ) : q.docImageDataUrl ? (
              <img src={q.docImageDataUrl} style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8 }} alt="document" />
            ) : (
              <p className="hint">Aucune image chargée.</p>
            )}
            <div className="sep" />
            {questions.map((qq, qi) => (
              <div key={qq.id} className="expand" style={{ background: '#fff' }}>
                <div className="row" style={{ marginBottom: 8 }}>
                  <input
                    type="text"
                    placeholder={`Question ${qi + 1}`}
                    value={qq.prompt}
                    onChange={(e) => updQ(qq.id, { prompt: e.target.value })}
                  />
                  <button className="btn danger small" onClick={() => removeQ(qq.id)}>✕</button>
                </div>
                {qq.options.map((o, oi) => (
                  <div key={oi} className="list-item">
                    <label className="badge" style={{ width: 'auto' }}>
                      <input
                        type="radio"
                        name={`q-${qq.id}`}
                        checked={qq.correctIndex === oi}
                        onChange={() => updQ(qq.id, { correctIndex: oi })}
                      />
                    </label>
                    <input
                      type="text"
                      placeholder={`Option ${oi + 1}`}
                      value={o}
                      onChange={(e) => setOption(qq.id, oi, e.target.value)}
                    />
                    <button
                      className="btn small ghost"
                      onClick={() => updQ(qq.id, { options: [...qq.options, ''] })}
                    >
                      + opt.
                    </button>
                    {qq.options.length > 2 && (
                      <button
                        className="btn danger small"
                        onClick={() => updQ(qq.id, { options: qq.options.filter((_, x) => x !== oi) })}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))}
            <button className="btn small ghost" style={{ marginTop: 8 }} onClick={addQ}>
              + Question
            </button>
          </div>
        )
      })}
      {qcms.length === 0 && <p className="hint">Aucun QCM.</p>}
    </div>
  )
}
