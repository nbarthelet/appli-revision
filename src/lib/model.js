// Modèle de données de l'éditeur d'exercices HGGSP.
// Ce fichier décrit la structure d'un exercice ainsi que les fonctions
// de normalisation (parsing) et quelques utilitaires partagés.

export const EXERCISE_TYPES = {
  matching: 'Appariement',
  flashcards: 'Flashcards',
  map: 'Repérage sur carte',
  timeline: 'Frise chronologique',
  cloze: 'Texte à trous',
  qcm: 'QCM - document',
}

export const SYMBOLS = {
  circle: { label: 'Rond', glyph: '●' },
  pin: { label: 'Épingle', glyph: '📍' },
  square: { label: 'Carré', glyph: '■' },
  triangle: { label: 'Triangle', glyph: '▲' },
  diamond: { label: 'Losange', glyph: '◆' },
  star: { label: 'Étoile', glyph: '★' },
  cross: { label: 'Croix', glyph: '✚' },
  rect: { label: 'Rectangle', glyph: '▬' },
}

export const DEFAULT_INSTRUCTIONS = {
  matching:
    "Chaque paire relie un élément A (ex. argument) à un élément B (ex. notion). L'ordre des colonnes est mélangé pour l'élève.",
  flashcards:
    'Retournez chaque carte pour lire la réponse, puis attribuez un statut : V maîtrisé, ~ à consolider, ? à revoir.',
  map: "Cliquez ou touchez la carte pour placer chaque lieu à l'endroit attendu, puis vérifiez vos réponses.",
  timeline:
    'Placez chaque événement sur la frise à la bonne date (glisser-déposer ou clic), puis vérifiez vos réponses.',
  cloze: "Cliquez sur un mot de la banque, puis sur un emplacement du texte pour le placer (ou glissez-le). Touchez un mot placé pour le retirer.",
  qcm: 'Lisez attentivement le document, puis répondez à chaque question en choisissant une seule proposition.',
}

export function uid(prefix = '') {
  return (
    prefix +
    Math.random().toString(36).slice(2, 9) +
    Date.now().toString(36)
  )
}

export function slugify(text) {
  return (
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'exercice'
  )
}

// ---------- Normalisation des marqueurs / zones ----------

export function normalizeSymbol(sym) {
  return sym && sym in SYMBOLS ? sym : 'circle'
}

function validImg(p) {
  return p && typeof p.x === 'number' && typeof p.y === 'number'
}
function validGeo(p) {
  return Array.isArray(p) && typeof p[0] === 'number' && typeof p[1] === 'number'
}

let zoneCounter = 0

export function newZone(shape = 'rect') {
  zoneCounter++
  const common = {
    id: uid('z-'),
    label: '',
    color: '#2563eb',
    opacity: 0.3,
    radiusPct: 0,
  }
  if (shape === 'circle') {
    return { ...common, shape: 'circle', img: [{ x: 0.5, y: 0.5 }], radiusPct: 0.1, geo: [] }
  }
  return {
    ...common,
    shape: 'rect',
    img: [
      { x: 0.3, y: 0.3 },
      { x: 0.6, y: 0.55 },
    ],
    geo: [],
  }
}

// Retourne la géométrie d'affichage d'une zone en coordonnées relatives (0-1)
export function zoneGeometry(z, stageW, stageH) {
  if (!z) return null
  if (z.shape === 'circle' && z.img.length >= 1) {
    const c = z.img[0]
    // rayon en fraction de la largeur de la scène
    const rPct = Math.max(0.01, z.radiusPct || 0.1)
    return { shape: 'circle', cx: c.x, cy: c.y, r: rPct, color: z.color, opacity: z.opacity }
  }
  if (z.shape === 'rect' && z.img.length >= 2) {
    const p1 = z.img[0]
    const p2 = z.img[1]
    const x1 = Math.min(p1.x, p2.x)
    const y1 = Math.min(p1.y, p2.y)
    const x2 = Math.max(p1.x, p2.x)
    const y2 = Math.max(p1.y, p2.y)
    return {
      shape: 'rect',
      x: x1,
      y: y1,
      w: x2 - x1,
      h: y2 - y1,
      color: z.color,
      opacity: z.opacity,
    }
  }
  return null
}

export function normalizeZone(z) {
  if (!z || (z.shape !== 'rect' && z.shape !== 'circle')) return null
  const img = (z.img || []).filter(validImg)
  const ok =
    z.shape === 'rect' ? img.length >= 2 : z.shape === 'circle' ? img.length >= 1 : false
  if (!ok) return null
  return {
    id: z.id || uid('z-'),
    label: z.label || '',
    shape: z.shape,
    img,
    geo: (z.geo || []).filter(validGeo),
    radiusKm: typeof z.radiusKm === 'number' ? z.radiusKm : 0,
    radiusPct: typeof z.radiusPct === 'number' ? z.radiusPct : 0,
    color: z.color || '#2563eb',
    opacity: typeof z.opacity === 'number' ? Math.max(0.05, Math.min(0.9, z.opacity)) : 0.3,
  }
}

// ---------- Types spécifiques ----------

const MARKER_DEFAULT = { size: 22, color: '#2563eb', opacity: 1 }

function normalizeMarkerStyle(m) {
  const x = m?.size, f = typeof m?.color === 'string' ? m.color : '', o = m?.opacity
  return {
    size:
      typeof x === 'number' && x >= 8 && x <= 80 ? Math.round(x) : MARKER_DEFAULT.size,
    color: /^#[0-9a-f]{3,8}$/i.test(f.trim()) ? f.trim() : MARKER_DEFAULT.color,
    opacity: typeof o === 'number' ? Math.max(0.1, Math.min(1, o)) : MARKER_DEFAULT.opacity,
  }
}

export function emptyMap() {
  return {
    id: uid('map-'),
    mode: 'osm',
    imageDataUrl: '',
    imageName: '',
    imageWidth: 0,
    imageHeight: 0,
    center: [46.6, 2.4],
    zoom: 5,
    markers: [],
    defaultSymbol: 'circle',
    zones: [],
  }
}

export function normalizeMap(m) {
  return {
    id: m?.id || uid('map-'),
    mode: m?.mode === 'image' ? 'image' : 'osm',
    imageDataUrl: m?.imageDataUrl || '',
    imageName: m?.imageName || '',
    imageWidth: m?.imageWidth || 0,
    imageHeight: m?.imageHeight || 0,
    center: m?.center || [46.6, 2.4],
    zoom: m?.zoom || 5,
    markers: (m?.markers || []).map((x) => ({
      ...x,
      symbol: normalizeSymbol(x.symbol),
      ...normalizeMarkerStyle(x),
    })),
    defaultSymbol: normalizeSymbol(m?.defaultSymbol),
    zones: (m?.zones || []).map(normalizeZone).filter((x) => x !== null),
  }
}

const clamp = (n) => Math.max(0, Math.min(1, n))
const round3 = (n) => Math.round(n * 1000) / 1000

// ----------------- Frise chronologique -----------------
export function normalizeTimeline(m) {
  const out = {
    id: m?.id || uid('tl-'),
    title: m?.title || '',
    imageDataUrl: m?.imageDataUrl || '',
    imageName: m?.imageName || '',
    imageWidth: m?.imageWidth || 0,
    imageHeight: m?.imageHeight || 0,
    markers: [],
    zones: [],
  }
  const marks = (m?.markers || [])
    .filter(
      (e) => !!e && typeof e.x === 'number' && typeof e.y === 'number' && typeof e.label === 'string',
    )
    .map((e) => ({
      ...e,
      symbol: normalizeSymbol(e.symbol),
      tolerancePct: typeof e.tolerancePct === 'number' ? e.tolerancePct : 4,
      year: typeof e.year === 'number' ? e.year : null,
      ...normalizeMarkerStyle(e),
    }))
  const zones = (m?.zones || []).map(normalizeZone).filter((x) => x !== null)
  const slots = m?.slots || []
  const events = m?.events || []

  // Conversion des anciens formats "events/slots" vers markers/zones
  if (!marks.length && !zones.length && events.length) {
    const slotDefs = slots.filter(
      (d) => !!d && typeof d.x === 'number' && typeof d.y === 'number',
    )
    const slotMap = new Map(slotDefs.map((d) => [d.id, d]))
    let counted = 0
    events.forEach((ev) => {
      if (!ev?.label) return
      const slot = ev.slotId ? slotMap.get(ev.slotId) : undefined
      counted++
      if (slot && slot.kind === 'range') {
        zones.push({
          id: uid('z-'),
          label: ev.label,
          shape: 'rect',
          img: [
            { x: clamp(slot.x), y: clamp(slot.y) },
            { x: clamp(typeof slot.x2 === 'number' ? slot.x2 : slot.x + 0.05), y: clamp(typeof slot.y2 === 'number' ? slot.y2 : slot.y) },
          ],
          geo: [],
          radiusKm: 0,
          radiusPct: 5,
        })
      } else {
        marks.push({
          id: ev.id || uid('mk-'),
          label: ev.label,
          symbol: 'circle',
          lat: 0,
          lng: 0,
          toleranceKm: 50,
          x: clamp(slot ? slot.x : 0.5),
          y: clamp(slot ? slot.y : 0.5),
          tolerancePct: 4,
          year: slot && typeof slot.year === 'number' ? slot.year : ev.date,
        })
      }
    })
    if (!counted) {
      const dated = events.filter((y) => typeof y.date === 'number' && !!y.label)
      if (dated.length) {
        let min = Infinity,
          max = -Infinity
        dated.forEach((r) => {
          if (r.date < min) min = r.date
          if (r.date > max) max = r.date
        })
        if (max === min) max = min + 1
        dated.forEach((r) => {
          marks.push({
            id: r.id || uid('mk-'),
            label: r.label,
            symbol: 'circle',
            lat: 0,
            lng: 0,
            toleranceKm: 50,
            x: round3(Math.max(0.05, Math.min(0.95, (r.date - min) / (max - min)))),
            y: 0.5,
            tolerancePct: 4,
            year: r.date,
          })
        })
      }
    }
  }
  out.markers = marks
  out.zones = zones
  return out
}

// ----------------- QCM -----------------
export function emptyQcm() {
  return {
    id: uid('qcm-'),
    title: 'QCM 1',
    docMode: 'text',
    docText: '',
    docImageDataUrl: '',
    docImageName: '',
    docImageWidth: 0,
    docImageHeight: 0,
    questions: [],
  }
}

export function normalizeQcm(m) {
  const qs = (m?.questions || [])
    .filter(
      (q) =>
        q &&
        typeof q.prompt === 'string' &&
        Array.isArray(q.options) &&
        q.options.length >= 2 &&
        typeof q.correctIndex === 'number' &&
        q.correctIndex >= 0 &&
        q.correctIndex < q.options.length,
    )
    .map((q) => ({
      id: q.id || uid('qq-'),
      prompt: q.prompt,
      options: q.options.map((o) => String(o ?? '')),
      correctIndex: q.correctIndex,
    }))
  return {
    id: m?.id || uid('qcm-'),
    title: m?.title || 'QCM',
    docMode: m?.docMode === 'image' ? 'image' : 'text',
    docText: m?.docText || '',
    docImageDataUrl: m?.docImageDataUrl || '',
    docImageName: m?.docImageName || '',
    docImageWidth: m?.docImageWidth || 0,
    docImageHeight: m?.docImageHeight || 0,
    questions: qs,
  }
}

// ----------------- Texte à trous -----------------
export function closureWords(text) {
  const out = []
  const re = /\[([^\]]+)\]/g
  let mm
  while ((mm = re.exec(text))) {
    const w = mm[1].trim()
    if (w) out.push(w)
  }
  return out
}

export const normalizeKey = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()

// ----------------- Exercice complet -----------------
export function newExercise() {
  return {
    id: uid('ex-'),
    title: 'Titre de l’exercice',
    notions: [
      {
        id: uid(),
        term: 'Puissance',
        definition:
          "Capacité d'un État à influencer durablement les relations internationales.",
        context:
          'Paradoxe : la puissance repose autant sur des ressources matérielles (armée, économie) que sur des ressources immatérielles (image, réputation).',
      },
    ],
    type: 'matching',
    instructions: { ...DEFAULT_INSTRUCTIONS },
    pairs: [],
    cards: [],
    maps: [emptyMap()],
    timelines: [normalizeTimeline({ id: uid('tl-'), title: 'Frise 1' })],
    clozes: [{ id: uid('cz-'), title: 'Texte 1', text: '', distractors: [] }],
    qcms: [emptyQcm()],
  }
}

export function normalizeExercise(m) {
  const maps = m?.maps?.length
    ? m.maps.map(normalizeMap)
    : m?.map
      ? [normalizeMap(m.map)]
      : [emptyMap()]
  const timelines = m?.timelines?.length
    ? m.timelines.map(normalizeTimeline)
    : m?.events
      ? [normalizeTimeline({ id: uid('tl-'), title: 'Frise 1', events: m.events })]
      : [normalizeTimeline({ id: uid('tl-'), title: 'Frise 1' })]
  const clozes = m?.clozes?.length
    ? m.clozes
    : [{ id: uid('cz-'), title: 'Texte 1', text: '', distractors: [] }]
  const qcms = m?.qcms?.length ? m.qcms.map(normalizeQcm) : [emptyQcm()]
  return {
    ...newExercise(),
    ...m,
    instructions: { ...DEFAULT_INSTRUCTIONS, ...(m?.instructions || {}) },
    maps,
    timelines,
    clozes,
    qcms,
  }
}

// ----------------- Liste des blocs d'un exercice (pour l'export) -----------------
export function exerciseBlocks(m) {
  const blocks = []
  if (m.pairs.length) blocks.push({ kind: 'matching', index: 0, label: 'Appariement' })
  if (m.cards.length) blocks.push({ kind: 'flashcards', index: 0, label: 'Flashcards' })
  m.maps.forEach((map, i) => {
    if (map.markers.length || map.zones.length)
      blocks.push({
        kind: 'map',
        index: i,
        label: m.maps.length > 1 ? `Repérage ${i + 1}` : 'Repérage',
      })
  })
  m.timelines.forEach((tl, i) => {
    if ((tl.markers?.length || 0) > 0 || (tl.zones?.length || 0) > 0)
      blocks.push({
        kind: 'timeline',
        index: i,
        label:
          m.timelines.length > 1
            ? `Frise ${i + 1}${tl.title && tl.title !== `Frise ${i + 1}` ? ` - ${tl.title}` : ''}`
            : tl.title || 'Frise chronologique',
      })
  })
  m.clozes.forEach((c, i) => {
    if (closureWords(c.text).length)
      blocks.push({
        kind: 'cloze',
        index: i,
        label:
          m.clozes.length > 1
            ? `Texte à trous ${i + 1}${c.title && c.title !== `Texte ${i + 1}` ? ` - ${c.title}` : ''}`
            : c.title || 'Texte à trous',
      })
  })
  m.qcms.forEach((q, i) => {
    if ((q.questions || []).length)
      blocks.push({
        kind: 'qcm',
        index: i,
        label: q.title || 'QCM - document',
      })
  })
  return blocks
}
