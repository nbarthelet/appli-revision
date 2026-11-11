// Annotations dessinées sur le fond de carte (repérage).
// Ce ne sont PAS des réponses : c'est de la décoration (traits, légendes,
// zones colorées ou hachurées) qui apparaît dans la page élève.
//
// Coordonnées : fractions de l'image (0-1), comme les zones.

export const DECO_TYPES = {
  line: 'Ligne',
  text: 'Texte',
  symbol: 'Symbole',
  zone: 'Zone colorée',
  hatch: 'Zone hachurée',
}

const clamp = (n, min, max) => Math.max(min, Math.min(max, n))
const num = (v, d = 0) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : d
}

export function newDecoration(type, patch = {}) {
  const id = 'd-' + Math.random().toString(36).slice(2, 9)
  const base = { type, color: '#dc2626' }
  let deco
  if (type === 'line') deco = { ...base, points: [], width: 3 }
  else if (type === 'text') deco = { ...base, text: '', x: 0.5, y: 0.5, size: 18, bold: false }
  else if (type === 'symbol') deco = { ...base, symbol: 'star', x: 0.5, y: 0.5, size: 26 }
  else deco = { ...base, shape: 'rect', x: 0.2, y: 0.2, w: 0.15, h: 0.1, opacity: 0.25 }
  // Le patch prime sur les valeurs par défaut, mais l'identifiant reste le nôtre.
  return { ...deco, ...patch, id }
}

export function normalizeDecoration(d) {
  if (!d || !DECO_TYPES[d.type]) return null
  const base = { id: d.id || newDecoration(d.type).id, type: d.type, color: d.color || '#dc2626' }
  if (d.type === 'line') {
    const points = (d.points || [])
      .filter((p) => p && typeof p.x === 'number' && typeof p.y === 'number')
      .map((p) => ({ x: clamp(p.x, 0, 1), y: clamp(p.y, 0, 1) }))
    if (points.length < 2) return null
    return { ...base, points, width: clamp(num(d.width, 3), 1, 14) }
  }
  if (d.type === 'text') {
    const text = String(d.text || '').trim()
    if (!text) return null
    return {
      ...base,
      text,
      x: clamp(num(d.x), 0, 1),
      y: clamp(num(d.y), 0, 1),
      size: clamp(num(d.size, 18), 8, 72),
      bold: !!d.bold,
    }
  }
  if (d.type === 'symbol') {
    return {
      ...base,
      symbol: d.symbol || 'star',
      x: clamp(num(d.x), 0, 1),
      y: clamp(num(d.y), 0, 1),
      size: clamp(num(d.size, 26), 8, 96),
    }
  }
  // zone / hatch
  const shape = d.shape === 'circle' ? 'circle' : 'rect'
  if (shape === 'circle') {
    return {
      ...base,
      shape,
      cx: clamp(num(d.cx), 0, 1),
      cy: clamp(num(d.cy), 0, 1),
      r: clamp(num(d.r, 0.1), 0.005, 1),
      opacity: clamp(num(d.opacity, 0.25), 0, 0.9),
    }
  }
  const x = clamp(num(d.x), 0, 1)
  const y = clamp(num(d.y), 0, 1)
  const w = clamp(num(d.w, 0.1), 0.005, 1)
  const h = clamp(num(d.h, 0.1), 0.005, 1)
  return { ...base, shape: 'rect', x, y, w, h, opacity: clamp(num(d.opacity, 0.25), 0, 0.9) }
}

// Géométrie calculée d'une annotation : commune à l'éditeur et à l'export,
// pour éviter toute divergence entre les deux rendus.
//
// `aspect` = largeur / hauteur de l'image. Les longueurs et les angles sont
// calculés en pixels (et non dans un espace isotrope), sinon une diagonale
// serait tracée avec le mauvais angle sur une image rectangulaire.
export function decoGeometry(d, glyphOf, aspect = 1) {
  const ratio = aspect > 0 ? aspect : 1
  if (d.type === 'line') {
    const segments = []
    for (let i = 1; i < d.points.length; i++) {
      const a = d.points[i - 1]
      const b = d.points[i]
      const dx = b.x - a.x // fraction de la largeur
      const dy = (b.y - a.y) / ratio // fraction de la hauteur -> ramenée à la largeur
      const len = Math.hypot(dx, dy)
      if (len < 0.0005) continue
      segments.push({
        x1: a.x * 100,
        y1: a.y * 100,
        len: len * 100,
        ang: (Math.atan2(dy, dx) * 180) / Math.PI,
      })
    }
    return { kind: 'line', segments, color: d.color, width: d.width || 3 }
  }
  if (d.type === 'text') {
    return { kind: 'text', x: d.x * 100, y: d.y * 100, text: d.text, color: d.color, size: d.size, bold: d.bold }
  }
  if (d.type === 'symbol') {
    return {
      kind: 'symbol',
      x: d.x * 100,
      y: d.y * 100,
      glyph: glyphOf ? glyphOf(d.symbol) : '●',
      color: d.color,
      size: d.size,
    }
  }
  if (d.shape === 'circle') {
    return {
      kind: d.type,
      shape: 'circle',
      cx: d.cx * 100,
      cy: d.cy * 100,
      r: d.r * 100,
      color: d.color,
      opacity: d.opacity,
    }
  }
  return {
    kind: d.type,
    shape: 'rect',
    x: d.x * 100,
    y: d.y * 100,
    w: d.w * 100,
    h: d.h * 100,
    color: d.color,
    opacity: d.opacity,
  }
}
