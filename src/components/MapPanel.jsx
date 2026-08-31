import { useRef, useState } from 'react'
import { uid } from '../lib/model.js'
import { readImageFile } from '../lib/image.js'
import ZoneEditor from './ZoneEditor.jsx'

export default function MapPanel({ ex, setEx }) {
  const maps = ex.maps || []
  const [activeIdx, setActiveIdx] = useState(0)
  const fileRef = useRef(null)

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
        Chargez une carte en image, placez des zones (rectangles ou cercles), réglez leur
        couleur / transparence et renseignez l’étiquette attendue. L’élève devra glisser
        (ou cliquer) chaque étiquette sur la bonne zone.
      </p>

      <div className="row" style={{ marginBottom: 12 }}>
        <button className="btn small ghost" onClick={() => fileRef.current?.click()}>
          {map.imageDataUrl ? 'Changer l’image' : 'Charger une image'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFile} />
      </div>

      {map.imageDataUrl ? (
        <ZoneEditor
          zones={map.zones}
          onChange={setZones}
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
