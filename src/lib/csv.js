// Utilitaire de parsing CSV compatible Excel français.
// Le séparateur est détecté automatiquement (; de préférence, puis , ou tabulation).
// Gère les champs entre guillemets, les retours à la ligne dans les champs,
// et les virgules (ou points-virgules) à l'intérieur des champs quotés.

export function parseCsv(text) {
  const t = String(text || '').replace(/\uFEFF/g, '') // retire le BOM
  if (!t.trim()) return []

  // Détection du séparateur sur la première ligne non vide
  const firstLine =
    t.split(/\r\n|\n|\r/).find((l) => l.trim() !== '') || ''
  const cands = [';', ',', '\t', '|']
  let sep = ';'
  let best = -1
  for (const s of cands) {
    const n = (firstLine.match(new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
    if (n > best) {
      best = n
      sep = s
    }
  }
  if (best <= 0) sep = ';'

  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  const pushField = () => {
    let f = field
    if (f.startsWith('"') && f.endsWith('"') && f.length >= 2) f = f.slice(1, -1)
    row.push(f)
    field = ''
  }
  const pushRow = () => {
    pushField()
    rows.push(row)
    row = []
  }

  for (let i = 0; i < t.length; i++) {
    const ch = t[i]
    if (inQuotes) {
      if (ch === '"') {
        if (t[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === sep) {
      pushField()
    } else if (ch === '\r' || ch === '\n') {
      if (t[i] === '\r' && t[i + 1] === '\n') i++
      pushRow()
      // saute les lignes vides supplémentaires
      while (i + 1 < t.length && (t[i + 1] === '\r' || t[i + 1] === '\n')) {
        if (t[i + 1] === '\r' && t[i + 2] === '\n') i++
        i++
      }
    } else {
      field += ch
    }
  }
  // dernière ligne
  if (field !== '' || row.length) pushRow()

  return rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some((c) => c !== ''))
}

// Interprète une cellule comme un nombre (gère la virgule décimale)
export function parseNumber(cell) {
  const c = String(cell ?? '').trim().replace(/[^\d.,\-]/g, '')
  if (!c) return null
  const n = parseFloat(c.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

// Convertit des lignes en tableau d'objets à partir de l'en-tête
export function toObjects(rows, headerIdx = 0) {
  if (!rows.length) return []
  const start = Math.min(headerIdx, rows.length - 1)
  const header = rows[start].map((h) => h.toLowerCase().trim())
  const out = []
  for (let i = start + 1; i < rows.length; i++) {
    const obj = {}
    rows[i].forEach((cell, ci) => {
      if (ci < header.length) obj[header[ci]] = cell
    })
    out.push(obj)
  }
  return out
}
