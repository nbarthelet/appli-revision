import { useRef } from 'react'
import { uid } from '../lib/model.js'
import { readImageFile } from '../lib/image.js'
import ZoneEditor from './ZoneEditor.jsx'

export default function TimelinePanel({ ex, setEx }) {
  const timelines = ex.timelines || []
  const fileRef = useRef(null)

  const patch = (i, p) =>
    setEx((prev) => ({
      ...prev,
      timelines: prev.timelines.map((t, idx) => (idx === i ? { ...t, ...p } : t)),
    }))
  const add = () =>
    setEx((prev) => ({
      ...prev,
      timelines: [
        ...prev.timelines,
        { id: uid('tl-'), title: `Frise ${prev.timelines.length + 1}`, imageDataUrl: '', imageName: '', imageWidth: 0, imageHeight: 0, markers: [], zones: [] },
      ],
    }))
  const remove = (i) =>
    setEx((prev) => ({ ...prev, timelines: prev.timelines.filter((_, idx) => idx !== i) }))

  const onFile = async (e, i) => {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      const img = await readImageFile(f, 2000)
      patch(i, {
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
        <h2 style={{ margin: 0 }}>Frise chronologique</h2>
        <button className="btn small" onClick={add}>+ Frise</button>
      </div>
      <p className="hint">
        Chargez une frise en image (ou importez une trame), placez des zones aux bons
        endroits et renseignez l’étiquette attendue. L’élève glisse (ou clique) chaque
        étiquette sur la bonne zone.
      </p>
      {timelines.map((tl, i) => (
        <div key={tl.id} className="expand">
          <div className="row" style={{ marginBottom: 8 }}>
            <input
              type="text"
              placeholder="Titre de la frise"
              value={tl.title}
              onChange={(e) => patch(i, { title: e.target.value })}
            />
            <button className="btn small ghost" onClick={() => fileRef.current?.click()}>
              {tl.imageDataUrl ? 'Changer l’image' : 'Charger une image'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => onFile(e, i)}
            />
            <button className="btn danger small" onClick={() => remove(i)}>Suppr.</button>
          </div>
          {tl.imageDataUrl ? (
            <ZoneEditor
              zones={tl.zones || []}
              onChange={(zones) => patch(i, { zones })}
              imageUrl={tl.imageDataUrl}
              height={Math.min(500, tl.imageHeight || 360)}
              ratio={tl.imageWidth && tl.imageHeight ? tl.imageWidth / tl.imageHeight : null}
            />
          ) : (
            <p className="hint">Chargez une image de frise pour placer des zones.</p>
          )}
        </div>
      ))}
      {timelines.length === 0 && <p className="hint">Aucune frise.</p>}
    </div>
  )
}
