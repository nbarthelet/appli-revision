// Utilitaire de parsing CSV compatible Excel français.
// Le séparateur est détecté automatiquement (; de préférence, puis , ou tabulation).
// Gère les champs entre guillemets, les retours à la ligne dans les champs,
// et les virgules (ou points-virgules) à l'intérieur des champs quotés.

// Décodage CP850 (DOS) : mappe les octets accentués vers leurs caractères.
// TextDecoder ne supportant pas CP850, on traduit octet par octet.
const CP850 = new Map([
  [0x82, 'é'], [0x83, 'â'], [0x84, 'ä'], [0x85, 'à'], [0x86, 'å'],
  [0x87, 'ç'], [0x88, 'ê'], [0x89, 'ë'], [0x8A, 'è'], [0x8B, 'ï'],
  [0x8C, 'î'], [0x8D, 'ì'], [0x8E, 'Ä'], [0x8F, 'Å'],
  [0x90, 'É'], [0x91, 'æ'], [0x92, 'Æ'], [0x93, 'ô'], [0x94, 'ö'],
  [0x95, 'ò'], [0x96, 'û'], [0x97, 'ù'], [0x98, 'ÿ'], [0x99, 'Ö'],
  [0x9A, 'Ü'], [0x9B, '¢'], [0x9C, '£'], [0xA0, 'á'], [0xA1, 'í'],
  [0xA2, 'ó'], [0xA3, 'ú'], [0xA4, 'ñ'], [0xA5, 'Ñ'], [0xA8, '¿'],
  [0xA9, '⌐'], [0xE0, 'É'], [0xE1, 'æ'], [0xE2, 'Æ'], [0xE4, 'ä'],
  [0xE6, 'å'], [0xE7, 'Ç'], [0xE8, 'ê'], [0xE9, 'è'], [0xEA, 'è'],
  [0xEB, 'ï'], [0xEE, 'î'], [0xEF, 'ì'], [0xB0, '░'],
])

function decodeCp850(view) {
  let out = ''
  for (let i = 0; i < view.length; i++) {
    const b = view[i]
    out += b < 0x80 ? String.fromCharCode(b) : CP850.get(b) || '\uFFFD'
  }
  return out
}

// Décode un fichier CSV quel que soit son encodage (UTF-8, UTF-16, CP850, Win-1252).
// Retourne toujours du texte sans BOM en tête.
export function decodeCsvBuffer(buffer) {
  const view = new Uint8Array(buffer)
  let text
  if (view[0] === 0xFF && view[1] === 0xFE) {
    text = new TextDecoder('utf-16le').decode(buffer.slice(2))
  } else if (view[0] === 0xFE && view[1] === 0xFF) {
    text = new TextDecoder('utf-16be').decode(buffer.slice(2))
  } else if (view[0] === 0xEF && view[1] === 0xBB && view[2] === 0xBF) {
    text = new TextDecoder('utf-8').decode(buffer.slice(3))
  } else {
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(buffer)
    } catch {
      // Windows-1252 ne gère pas les octets DOS (ex. 0x82 é) :
      // détecter si le fichier contient des octets bas "DOS-like"
      const hasDosAccents = [0x82, 0x83, 0x84, 0x85, 0x87, 0x88, 0x89,
        0x8A, 0x8B, 0x90, 0x91, 0x92, 0x94, 0x95, 0x96, 0x97, 0x98,
        0xA0, 0xA2, 0xA4, 0xA8, 0xA9, 0xE0, 0xE1, 0xE6, 0xE7, 0xE8,
        0xE9, 0xEA, 0xEB, 0xEE, 0xEF].some((b) => view.includes(b))
      text = hasDosAccents ? decodeCp850(view) : new TextDecoder('windows-1252').decode(buffer)
    }
  }
  return text.replace(/^\uFEFF/, '')
}

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
