import { useRef } from 'react'
import { uid } from '../lib/model.js'
import { decodeCsvBuffer } from '../lib/csv.js'

// Normalisation d'une étiquette : minuscules, sans accents, espaces compactés,
// BOM retiré, séparateurs internes (tiret, tiret bas, point) supprimés.
function normKey(s) {
  return String(s || '')
    .replace(/^\uFEFF/, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Clé de comparaison d'un nom de colonne : sans accent, sans séparateur.
function colKey(s) {
  return normKey(s).replace(/[-_ .]/g, '')
}

// Alias acceptés pour les trois colonnes du CSV.
// Chaque règle teste une cellule déjà normalisée (colKey) : préfixe ou valeur exacte.
const COL_RULES = {
  categorie: (c) =>
    c.startsWith('cat') || c.startsWith('rubriqu') || c === 'bloc' || c === 'type' || c === 'section',
  sous: (c) =>
    c.startsWith('sous') || c.startsWith('sub') || c === 'precision' || c === 'detail' || c === 'partie',
  texte: (c) =>
    c.startsWith('texte') ||
    c.startsWith('text') ||
    c === 'libelle' ||
    c === 'intitule' ||
    c === 'contenu' ||
    c === 'description' ||
    c === 'valeur',
}

const findCol = (cells, kind) => cells.findIndex((c) => COL_RULES[kind](c))

// Catégorie -> bloc de la fiche. Tolère la casse, les accents et les libellés
// étendus (ex. « Notions et vocabulaire », « Grandes lignes du cours à savoir »).
function blockOf(cat, sub) {
  const c = normKey(cat)
  const s = normKey(sub)
  if (c === 'meta') return s === 'titre' ? 'titre' : null
  if (c.startsWith('repere') || c === 'dates' || c === 'lieux' || c === 'date' || c === 'lieu')
    return 'reperes'
  if (c.includes('vocabulaire') || c.includes('notion')) return 'vocabulaire'
  if (c.includes('explication') || c.includes('grandes lignes') || c.includes('cours a savoir'))
    return 'explications'
  return null
}

// Découpe une ligne CSV en champs, en respectant les guillemets.
function splitCsvLine(line, sep = ',') {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === sep && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result.map((c) => c.trim().replace(/^"|"$/g, ''))
}

// Séparateur le plus probable : celui qui donne au moins 3 colonnes sur
// le plus grand nombre de lignes.
function bestSeparator(lines) {
  let best = ','
  let bestScore = -1
  for (const s of [',', ';', '\t', '|']) {
    let score = 0
    for (const l of lines) {
      if (!l.trim()) continue
      if (splitCsvLine(l, s).length >= 3) score++
    }
    if (score > bestScore) {
      bestScore = score
      best = s
    }
  }
  return best
}

export default function ObjectifsPanel({ ex, setEx }) {
  const objectifs = ex.objectifs || { reperes: [], vocabulaire: {}, explications: [], titre: '' }
  const fileInputRef = useRef(null)

  const patch = (p) =>
    setEx((prev) => ({
      ...prev,
      objectifs: { ...prev.objectifs, ...p },
    }))

  const patchVocab = (sousCat, mots) =>
    setEx((prev) => ({
      ...prev,
      objectifs: {
        ...prev.objectifs,
        vocabulaire: { ...prev.objectifs.vocabulaire, [sousCat]: mots },
      },
    }))

  const addRepere = () =>
    setEx((prev) => ({
      ...prev,
      objectifs: { ...prev.objectifs, reperes: [...(prev.objectifs.reperes || []), ''] },
    }))

  const removeRepere = (i) =>
    setEx((prev) => ({
      ...prev,
      objectifs: { ...prev.objectifs, reperes: (prev.objectifs.reperes || []).filter((_, idx) => idx !== i) },
    }))

  const updateRepere = (i, texte) =>
    setEx((prev) => ({
      ...prev,
      objectifs: {
        ...prev.objectifs,
        reperes: (prev.objectifs.reperes || []).map((r, idx) => (idx === i ? texte : r)),
      },
    }))

  const addExplication = () =>
    setEx((prev) => ({
      ...prev,
      objectifs: { ...prev.objectifs, explications: [...(prev.objectifs.explications || []), ''] },
    }))

  const removeExplication = (i) =>
    setEx((prev) => ({
      ...prev,
      objectifs: { ...prev.objectifs, explications: (prev.objectifs.explications || []).filter((_, idx) => idx !== i) },
    }))

  const updateExplication = (i, texte) =>
    setEx((prev) => ({
      ...prev,
      objectifs: {
        ...prev.objectifs,
        explications: (prev.objectifs.explications || []).map((e, idx) => (idx === i ? texte : e)),
      },
    }))

  const addVocabCategory = () =>
    setEx((prev) => {
      const newCat = `CAT${Object.keys(prev.objectifs.vocabulaire || {}).length + 1}`
      return {
        ...prev,
        objectifs: { ...prev.objectifs, vocabulaire: { ...prev.objectifs.vocabulaire, [newCat]: [''] } },
      }
    })

  const removeVocabCategory = (cat) =>
    setEx((prev) => {
      const { [cat]: _, ...rest } = prev.objectifs.vocabulaire || {}
      return { ...prev, objectifs: { ...prev.objectifs, vocabulaire: rest } }
    })

  const updateVocabItem = (cat, idx, texte) =>
    setEx((prev) => {
      const mots = [...(prev.objectifs.vocabulaire?.[cat] || [])]
      mots[idx] = texte
      return {
        ...prev,
        objectifs: {
          ...prev.objectifs,
          vocabulaire: { ...prev.objectifs.vocabulaire, [cat]: mots },
        },
      }
    })

  const addVocabItem = (cat) =>
    setEx((prev) => {
      const mots = [...(prev.objectifs.vocabulaire?.[cat] || []), '']
      return {
        ...prev,
        objectifs: {
          ...prev.objectifs,
          vocabulaire: { ...prev.objectifs.vocabulaire, [cat]: mots },
        },
      }
    })

  const removeVocabItem = (cat, idx) =>
    setEx((prev) => {
      const mots = (prev.objectifs.vocabulaire?.[cat] || []).filter((_, i) => i !== idx)
      return {
        ...prev,
        objectifs: {
          ...prev.objectifs,
          vocabulaire: { ...prev.objectifs.vocabulaire, [cat]: mots },
        },
      }
    })

  return (
    <div className="card">
      <div className="space">
        <h2 style={{ margin: 0 }}>Fiche d'objectifs (PDF)</h2>
      </div>

      <label className="field" style={{ marginBottom: 16 }}>
        <span>Titre de la fiche</span>
        <input
          type="text"
          value={objectifs.titre}
          onChange={(e) => patch({ titre: e.target.value })}
          placeholder="FICHE D'OBJECTIFS : HISTOIRE, T1, CHAP 1"
        />
      </label>

      <div className="hint" style={{ marginBottom: 12 }}>
        Ces données servent à générer la fiche PDF prof (A4 paysage, 3 blocs : Repères / Vocabulaire / Explications).
      </div>

      {/* IMPORT CSV */}
      <div style={{ marginBottom: 16, padding: '12px', background: '#f0f7ff', borderRadius: 12, border: '1px dashed #4a90d9' }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>
          📁 Importer un fichier CSV{' '}
          <span style={{ fontWeight: 400, opacity: 0.6, fontSize: '0.85em' }}>(parseur v2)</span>
        </div>
        <div className="hint" style={{ marginBottom: 8 }}>
          Format : <code>categorie,sous_categorie,texte</code> — catégories reconnues (casse et
          accents indifférents) : <code>Repères</code>, <code>Notions et vocabulaire</code>,{' '}
          <code>Grandes lignes du cours à savoir</code>. Ligne optionnelle pour le titre :{' '}
          <code>meta,titre,MON TITRE</code>.
        </div>
        <input
          type="file"
          accept=".csv,text/csv"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={(e) => handleCsvImport(e)}
        />
        <button className="btn small" type="button" onClick={() => fileInputRef.current?.click()}>
          Choisir un fichier CSV
        </button>
      </div>

      {/* REPÈRES */}
      <details open style={{ marginBottom: 16 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '1.05rem' }}>
          🟢 Repères chronologiques / géographiques ({objectifs.reperes?.length || 0})
        </summary>
        <div style={{ marginTop: 8 }}>
          {(objectifs.reperes || []).map((r, i) => (
            <div key={i} className="row" style={{ marginBottom: 8, alignItems: 'flex-start' }}>
              <textarea
                rows={2}
                placeholder="Ex: Situer la cité d'Athènes dans le monde grec"
                value={r}
                onChange={(e) => updateRepere(i, e.target.value)}
                style={{ flex: 1, minWidth: 0 }}
              />
              <button className="btn danger small" onClick={() => removeRepere(i)}>Suppr.</button>
            </div>
          ))}
          {(objectifs.reperes || []).length === 0 && <p className="hint">Aucun repère.</p>}
          <button className="btn small" onClick={addRepere}>+ Repère</button>
        </div>
      </details>

      {/* VOCABULAIRE */}
      <details open style={{ marginBottom: 16 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '1.05rem' }}>
          🟠 Vocabulaire par sous-catégorie ({Object.keys(objectifs.vocabulaire || {}).length})
        </summary>
        <div style={{ marginTop: 8 }}>
          {Object.entries(objectifs.vocabulaire || {}).map(([cat, mots]) => (
            <div key={cat} className="expand" style={{ marginBottom: 12, padding: '12px', background: '#fafafa', borderRadius: 12 }}>
              <div className="row" style={{ marginBottom: 8 }}>
                <input
                  type="text"
                  value={cat}
                  onChange={(e) => {
                    if (e.target.value !== cat) {
                      setEx((prev) => {
                        const { [cat]: _, ...rest } = prev.objectifs.vocabulaire || {}
                        return { ...prev, objectifs: { ...prev.objectifs, vocabulaire: { ...rest, [e.target.value]: mots } } }
                      })
                    }
                  }}
                  placeholder="Nom de la catégorie (ex: ATHÈNES, ROME)"
                  style={{ flex: 1 }}
                />
                <button className="btn danger small" onClick={() => removeVocabCategory(cat)}>Suppr. cat.</button>
              </div>
              {(mots || []).map((m, idx) => (
                <div key={idx} className="row" style={{ marginBottom: 6, alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Terme (ex: isonomie, misthos)"
                    value={m}
                    onChange={(e) => updateVocabItem(cat, idx, e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button className="btn danger small" onClick={() => removeVocabItem(cat, idx)}>×</button>
                </div>
              ))}
              <button className="btn small" onClick={() => addVocabItem(cat)}>+ Terme</button>
            </div>
          ))}
          {Object.keys(objectifs.vocabulaire || {}).length === 0 && <p className="hint">Aucune catégorie.</p>}
          <button className="btn small" onClick={addVocabCategory}>+ Catégorie</button>
        </div>
      </details>

      {/* EXPLICATIONS */}
      <details open style={{ marginBottom: 16 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '1.05rem' }}>
          🟡 Explications (grandes lignes du cours) ({objectifs.explications?.length || 0})
        </summary>
        <div style={{ marginTop: 8 }}>
          {(objectifs.explications || []).map((e, i) => (
            <div key={i} className="row" style={{ marginBottom: 8, alignItems: 'flex-start' }}>
              <textarea
                rows={2}
                placeholder="Ex: Expliquer le fonctionnement de la démocratie athénienne"
                value={e}
                onChange={(e) => updateExplication(i, e.target.value)}
                style={{ flex: 1, minWidth: 0 }}
              />
              <button className="btn danger small" onClick={() => removeExplication(i)}>Suppr.</button>
            </div>
          ))}
          {(objectifs.explications || []).length === 0 && <p className="hint">Aucune explication.</p>}
          <button className="btn small" onClick={addExplication}>+ Explication</button>
        </div>
      </details>
    </div>
  )

  function handleCsvImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const text = decodeCsvBuffer(evt.target.result)
        const parsed = parseCsvObjectifs(text)
        setEx((prev) => ({ ...prev, objectifs: parsed }))
        const nbVoc = Object.values(parsed.vocabulaire || {}).reduce((a, v) => a + v.length, 0)
        const total = parsed.reperes.length + parsed.explications.length + nbVoc
        if (!total) {
          const first = (text.split(/\r\n|\n|\r/).find((l) => l.trim()) || '(vide)').slice(0, 120)
          alert(
            "CSV lu, mais aucun contenu reconnu.\n" +
              "Colonnes attendues : categorie, sous_categorie, texte.\n" +
              "Première ligne lue : " + first
          )
        } else {
          alert(
            `Fiche d'objectifs remplie : ${parsed.reperes.length} repère(s), ` +
              `${nbVoc} terme(s) de vocabulaire, ${parsed.explications.length} explication(s).`
          )
        }
      } catch (err) {
        alert('Erreur lecture CSV : ' + err.message)
      }
    }
    reader.readAsArrayBuffer(file)
    // reset input to allow re-selecting same file
    e.target.value = ''
  }

  function parseCsvObjectifs(text) {
    const clean = String(text || '').replace(/^\uFEFF/, '')
    const rawLines = clean.split(/\r\n|\n|\r/)
    const nonEmpty = rawLines.filter((l) => l.trim())
    if (nonEmpty.length < 2) return { reperes: [], vocabulaire: {}, explications: [], titre: '' }

    // 1) En-tête : première ligne (parmi les 15 premières) qui contient une
    //    colonne « categorie » ET une colonne « texte ». Il peut donc être
    //    décalé (lignes de commentaire, ligne meta/titre en tête...).
    let headerIdx = -1
    let sep = null
    let headers = []
    for (let i = 0; i < Math.min(rawLines.length, 15); i++) {
      const line = rawLines[i].trim()
      if (!line) continue
      for (const s of [',', ';', '\t', '|']) {
        const cells = line.split(s).map((c) => colKey(c))
        const ci = findCol(cells, 'categorie')
        const ti = findCol(cells, 'texte')
        if (ci !== -1 && ti !== -1) {
          headerIdx = i
          sep = s
          headers = cells
          break
        }
      }
      if (headerIdx !== -1) break
    }

    // 2) Aucun en-tête reconnu : repli sur 3 colonnes positionnelles.
    let catIdx = 0
    let subIdx = 1
    let txtIdx = 2
    if (headerIdx === -1) {
      sep = bestSeparator(rawLines)
    } else {
      catIdx = findCol(headers, 'categorie')
      subIdx = findCol(headers, 'sous')
      txtIdx = findCol(headers, 'texte')
    }

    const reperes = []
    const explications = []
    const vocabulaire = {}
    let titre = ''

    for (let i = 0; i < rawLines.length; i++) {
      if (i === headerIdx) continue // la ligne d'en-tête n'est pas une donnée
      const line = rawLines[i].trim()
      if (!line) continue
      const cols = parseCsvLine(line, sep)
      if (cols.length <= Math.max(catIdx, txtIdx)) continue
      const cat = (cols[catIdx] || '').trim()
      const sub = subIdx >= 0 ? (cols[subIdx] || '').trim() : ''
      const txt = (cols[txtIdx] || '').trim()
      if (!txt) continue

      const block = blockOf(cat, sub)
      if (block === 'titre') {
        titre = txt
      } else if (block === 'reperes') {
        reperes.push(txt)
      } else if (block === 'explications') {
        explications.push(txt)
      } else if (block === 'vocabulaire') {
        const key = sub || 'Vocabulaire'
        if (!vocabulaire[key]) vocabulaire[key] = []
        vocabulaire[key].push(txt)
      }
    }

    return {
      titre: titre || 'FICHE D\'OBJECTIFS DE RÉVISION',
      reperes,
      vocabulaire,
      explications,
    }
  }

  function parseCsvLine(line, sep = ',') {
    return splitCsvLine(line, sep)
  }
}