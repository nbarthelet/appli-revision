import { useRef, useState } from 'react'
import { uid } from '../lib/model.js'
import { parseCsv, toObjects, decodeCsvBuffer } from '../lib/csv.js'
import { readImageFile } from '../lib/image.js'
import ZoneEditor from './ZoneEditor.jsx'

// Palette par catégorie (les repères de même nature share une couleur)
const CAT_COLORS = {
  'État': '#2563eb',
  'Territoire': '#7c3aed',
  'Ville': '#dc2626',
  'Espace maritime': '#0891b2',
  'Détroit': '#0d9488',
  "Cours d'eau": '#0284c7',
  'Zone de conflit': '#ea580c',
  'Peuple': '#c026d3',
  'Zone': '#ca8a04',
  'Ressources': '#16a34a',
}

export default function MapPanel({ ex, setEx }) {
  const maps = ex.maps || []
  const [activeIdx, setActiveIdx] = useState(0)
  const fileRef = useRef(null)
  const csvRef = useRef(null)

  const map = maps[activeIdx] || maps[0]
  if (!map) return null

  const patchMap = (p) =>
    setEx((prev) => ({
      ...prev,
      maps: prev.maps.map((m, i) => (i === activeIdx ? { ...m, ...p } : m)),
    }))

  const addMap = () => {
    const nm = {
      id: uid('map-'),
      mode: 'image',
      imageDataUrl: '',
      imageName: '',
      imageWidth: 0,
      imageHeight: 0,
      markers: [],
      defaultSymbol: 'circle',
      zones: [],
      center: [46.6, 2.4],
      zoom: 5,
    }
    setEx((prev) => ({ ...prev, maps: [...prev.maps, nm] }))
    setActiveIdx(prev.maps.length)
  }
  const removeMap = (i) => {
    setEx((prev) => ({ ...prev, maps: prev.maps.filter((_, idx) => idx !== i) }))
    if (activeIdx >= i) setActiveIdx(Math.max(0, activeIdx - 1))
  }

  const setZones = (zones) => patchMap({ zones })
  const setDecorations = (decorations) => patchMap({ decorations })

  // Import d'un CSV de repères :
  //   nom;forme;x1;y1;x2;y2;categorie;symbole;taille;position_etiquette;police
  // forme = circle (x1,y1 = centre, x2 = rayon en %) | rect (x1,y1 et x2,y2 = coins)
  //       | marker (x1,y1 = position)
  // x et y sont des pourcentages de l'image (0-100).
  const onCsv = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const text = decodeCsvBuffer(evt.target.result)
        const rows = parseCsv(text)
        if (!rows.length) {
          alert('Le fichier CSV est vide.')
          return
        }
        const objs = toObjects(rows, 0)
        const num = (v) => {
          const n = parseFloat(String(v ?? '').replace(',', '.'))
          return Number.isFinite(n) ? n : null
        }
        const zones = []
        for (const o of objs) {
          const v = Object.values(o)
          const nom = String(v[0] ?? '').trim()
          const forme = String(v[1] ?? 'circle').trim().toLowerCase()
          const x1 = num(v[2])
          const y1 = num(v[3])
          const x2 = num(v[4])
          const y2 = num(v[5])
          const cat = String(v[6] ?? '').trim()
          const symbole = String(v[7] ?? 'pin').trim()
          const taille = num(v[8])
          const position = String(v[9] ?? 'right').trim()
          const police = num(v[10])
          if (!nom || x1 === null || y1 === null) continue
          const color = CAT_COLORS[cat] || '#2563eb'
          const base = { id: uid('z-'), label: nom, color, opacity: 0.25, geo: [], radiusKm: 0 }

          if (forme === 'rect') {
            if (x2 === null || y2 === null) continue
            zones.push({
              ...base,
              shape: 'rect',
              radiusPct: 0,
              img: [
                { x: Math.min(x1, x2) / 100, y: Math.min(y1, y2) / 100 },
                { x: Math.max(x1, x2) / 100, y: Math.max(y1, y2) / 100 },
              ],
            })
          } else if (forme === 'marker' || forme === 'symbole' || forme === 'repere') {
            zones.push({
              ...base,
              shape: 'marker',
              radiusPct: 0,
              img: [{ x: x1 / 100, y: y1 / 100 }],
              symbol: symbole,
              size: taille || 22,
              fontSize: police || 12,
              labelPos: position,
            })
          } else {
            zones.push({
              ...base,
              shape: 'circle',
              img: [{ x: x1 / 100, y: y1 / 100 }],
              // radiusPct = fraction de la largeur de l'image (0-1)
              radiusPct: Math.max(0.008, (x2 ?? 2) / 100),
            })
          }
        }
        if (!zones.length) {
          alert(
            'Aucun repère reconnu. Format attendu :\n' +
              'nom;forme;x1;y1;x2;y2;categorie;symbole;taille;position;police'
          )
          return
        }
        const remplacer =
          (map.zones?.length || 0) > 0 &&
          confirm(
            `Cette carte contient déjà ${map.zones.length} zone(s).\n` +
              'OK = remplacer par les repères importés, Annuler = les ajouter.'
          )
        patchMap({ zones: remplacer ? zones : [...(map.zones || []), ...zones] })
        alert(`${zones.length} repère(s) ${remplacer ? 'remplacent' : 'ajoutés à'} la carte.`)
      } catch (err) {
        alert('Erreur lecture CSV : ' + err.message)
      }
    }
    reader.readAsArrayBuffer(f)
    e.target.value = ''
  }

  const onFile = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      const img = await readImageFile(f)
      patchMap({
        mode: 'image',
        markers: [],
        imageDataUrl: img.dataUrl,
        imageName: img.name,
        imageWidth: img.width,
        imageHeight: img.height,
      })
    } catch (err) {
      alert(err.message)
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="card">
      <div className="space">
        <h2 style={{ margin: 0 }}>Repérage sur carte</h2>
        <div className="row">
          {maps.length > 1 &&
            maps.map((m, i) => (
              <button
                key={m.id}
                className={`btn small ${i === activeIdx ? '' : 'ghost'}`}
                style={{ background: i === activeIdx ? '#2563eb' : '#fff', color: i === activeIdx ? '#fff' : '#1e293b' }}
                onClick={() => setActiveIdx(i)}
              >
                {i + 1}
              </button>
            ))}
          <button className="btn small" onClick={addMap}>+ Carte</button>
          {maps.length > 1 && (
            <button className="btn danger small" onClick={() => removeMap(activeIdx)}>✕</button>
          )}
        </div>
      </div>
      <p className="hint">
        Chargez une carte en image, placez des repères (rectangles, cercles ou symboles : épingles,
        étoiles, losanges…), réglez leur couleur / transparence / taille et renseignez l’étiquette
        attendue. L’élève devra glisser (ou cliquer) chaque étiquette sur le bon repère.
      </p>

      <div className="row" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        <button className="btn small ghost" onClick={() => fileRef.current?.click()}>
          {map.imageDataUrl ? 'Changer l’image' : 'Charger une image'}
        </button>
        <button className="btn small ghost" onClick={() => csvRef.current?.click()}>
          Importer des repères (CSV)
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFile} />
        <input ref={csvRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={onCsv} />
      </div>

      <p className="hint" style={{ marginBottom: 12 }}>
        Import CSV : une ligne par repère, colonnes{' '}
        <span className="mono">
          nom;forme;x1;y1;x2;y2;categorie;symbole;taille;position;police
        </span>{' '}
        — x et y en pourcentage de l’image (0 à 100). <em>circle</em> : x1,y1 = centre, x2 =
        rayon en % ; <em>rect</em> : x1,y1 et x2,y2 = deux coins ; <em>marker</em> : x1,y1 =
        position, puis symbole (pin, star, square…), taille, position de l’étiquette, police.
      </p>

      {map.imageDataUrl ? (
        <ZoneEditor
          zones={map.zones}
          onChange={setZones}
          decorations={map.decorations || []}
          onDecorationsChange={setDecorations}
          imageUrl={map.imageDataUrl}
          height={Math.min(500, map.imageHeight || 400)}
          ratio={map.imageWidth && map.imageHeight ? map.imageWidth / map.imageHeight : null}
        />
      ) : (
        <p className="hint">Chargez d’abord une image de carte pour placer des zones.</p>
      )}
    </div>
  )
}
