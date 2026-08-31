import { useRef } from 'react'
import { zoneGeometry } from '../lib/model.js'

const HANDLE_SIZE = 12

// Éditeur de zones réutilisable (frise + carte image).
// Les coordonnées sont stockées en fractions (0-1) relatives à la scène affichée.
// - Rectangle : 2 points (p1, p2), déplaçable et redimensionnable par poignées (coins + bords)
// - Cercle : centre + rayon, déplaçable et redimensionnable par poignée sur la circonférence
export default function ZoneEditor({
  zones,
  onChange,
  imageUrl,
  label = '',
  height = 420,
  ratio = null,
}) {
  const stageRatio = ratio && ratio > 0 ? ratio : null
  const stageRef = useRef(null)
  const dragRef = useRef(null) // { zoneId, op, startX, startY, orig }

  const stagePx = () => stageRef.current?.getBoundingClientRect() || { left: 0, top: 0, width: 300, height: 300 }
  const toFrac = (clientX, clientY) => {
    const r = stagePx()
    return {
      x: Math.max(0, Math.min(1, (clientX - r.left) / r.width)),
      y: Math.max(0, Math.min(1, (clientY - r.top) / r.height)),
    }
  }

  const patchZone = (id, geo) => {
    onChange(
      zones.map((z) => {
        if (z.id !== id) return z
        if (z.shape === 'circle') {
          return {
            ...z,
            img: [{ x: Math.max(0, Math.min(1, geo.cx)), y: Math.max(0, Math.min(1, geo.cy)) }],
            radiusPct: Math.max(0.01, geo.r),
          }
        }
        const x1 = Math.max(0, Math.min(1, geo.x))
        const y1 = Math.max(0, Math.min(1, geo.y))
        const x2 = Math.max(0, Math.min(1, geo.x + geo.w))
        const y2 = Math.max(0, Math.min(1, geo.y + geo.h))
        const minSize = 0.02
        return {
          ...z,
          img: [
            { x: x1, y: y1 },
            { x: Math.max(x1 + minSize, x2), y: Math.max(y1 + minSize, y2) },
          ],
        }
      }),
    )
  }

  const onPointerDown = (e, zoneId, op) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    const zone = zones.find((z) => z.id === zoneId)
    const g = zoneGeometry(zone)
    dragRef.current = { zoneId, op, startX: e.clientX, startY: e.clientY, orig: g }
  }

  const onPointerMove = (e) => {
    const d = dragRef.current
    if (!d) return
    const r = stagePx()
    const dx = (e.clientX - d.startX) / r.width
    const dy = (e.clientY - d.startY) / r.height
    const g = d.orig
    let next

    if (g.shape === 'circle') {
      const cx = g.cx + dx
      const cy = g.cy + dy
      if (d.op === 'move') {
        next = { shape: 'circle', cx, cy, r: g.r }
      } else {
        // resize : garde le centre, ajuste le rayon
        next = { shape: 'circle', cx: g.cx, cy: g.cy, r: Math.max(0.01, g.r + dx) }
      }
    } else {
      let { x, y, w, h } = g
      if (d.op === 'move') {
        x = Math.max(0, Math.min(1 - w, g.x + dx))
        y = Math.max(0, Math.min(1 - h, g.y + dy))
      } else {
        if (d.op.includes('e')) w = g.w + dx
        if (d.op.includes('s')) h = g.h + dy
        if (d.op.includes('w')) {
          w = g.w - dx
          x = g.x + dx
        }
        if (d.op.includes('n')) {
          h = g.h - dy
          y = g.y + dy
        }
        const min = 0.02
        if (w < min) {
          if (d.op.includes('w')) { x = g.x + g.w - min }
          w = min
        }
        if (h < min) {
          if (d.op.includes('n')) { y = g.y + g.h - min }
          h = min
        }
      }
      next = { shape: 'rect', x, y, w, h }
    }
    patchZone(d.zoneId, next)
  }

  const onPointerUp = () => {
    dragRef.current = null
  }

  const addRect = () =>
    onChange([...zones, newZoneLocal('rect')])
  const addCircle = () =>
    onChange([...zones, newZoneLocal('circle')])
  const newZoneLocal = (shape) => {
    if (shape === 'circle')
      return { id: 'z-' + Math.random().toString(36).slice(2, 9), label: '', color: '#2563eb', opacity: 0.3, shape: 'circle', img: [{ x: 0.5, y: 0.5 }], radiusPct: 0.1, geo: [] }
    return { id: 'z-' + Math.random().toString(36).slice(2, 9), label: '', color: '#2563eb', opacity: 0.3, shape: 'rect', img: [{ x: 0.3, y: 0.3 }, { x: 0.6, y: 0.55 }], geo: [] }
  }
  const removeZone = (id) => onChange(zones.filter((z) => z.id !== id))
  const setZone = (id, p) => onChange(zones.map((z) => (z.id === id ? { ...z, ...p } : z)))

  return (
    <div className="zone-editor">
      <div className="row" style={{ marginBottom: 8 }}>
        <button className="btn small" onClick={addRect}>+ Rectangle</button>
        <button className="btn small" onClick={addCircle}>+ Cercle</button>
      </div>
      <div
        ref={stageRef}
        className="map-stage-editor"
        style={{
          position: 'relative',
          width: '100%',
          height: imageUrl ? undefined : 120,
          aspectRatio: imageUrl && stageRatio ? `${stageRatio}` : undefined,
          overflow: 'hidden',
          touchAction: 'none',
          userSelect: 'none',
          cursor: 'default',
        }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="fond"
            style={{ width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none', display: 'block' }}
            draggable={false}
          />
        ) : (
          <div style={{ padding: 20, color: '#64748b' }}>{label || 'Chargez une image pour placer des zones.'}</div>
        )}
        {zones.map((z) => {
          const g = zoneGeometry(z)
          if (!g) return null
          const color = g.color || '#2563eb'
          const opacity = g.opacity ?? 0.3
          const boxStroke = '2px solid ' + color
          const fill = hexToRgba(color, opacity)

          if (g.shape === 'circle') {
            const style = {
              left: `${g.cx * 100}%`,
              top: `${g.cy * 100}%`,
              width: `${g.r * 200}%`,
              height: `${g.r * 200}%`,
              marginLeft: `-${g.r * 100}%`,
              marginTop: `-${g.r * 100}%`,
              border: boxStroke,
              background: fill,
              borderRadius: '50%',
            }
            return (
              <div key={z.id} className="zone" style={{ ...style, position: 'absolute', cursor: 'move', zIndex: 2 }}
                onPointerDown={(e) => onPointerDown(e, z.id, 'move')}>
                <span className="zid">{z.label || '?'}</span>
                {/* poignée de redimensionnement sur le bord droit */}
                <div
                  className="zone-handle"
                  style={{
                    position: 'absolute',
                    right: -HANDLE_SIZE / 2,
                    top: '50%',
                    width: HANDLE_SIZE,
                    height: HANDLE_SIZE,
                    marginTop: -HANDLE_SIZE / 2,
                    background: '#fff',
                    border: `2px solid ${color}`,
                    borderRadius: '50%',
                    cursor: 'nwse-resize',
                    zIndex: 3,
                  }}
                  onPointerDown={(e) => onPointerDown(e, z.id, 'resize')}
                />
              </div>
            )
          }

          // rectangle
          const style = {
            left: `${g.x * 100}%`,
            top: `${g.y * 100}%`,
            width: `${g.w * 100}%`,
            height: `${g.h * 100}%`,
            border: boxStroke,
            background: fill,
          }
          const handles = [
            ['nw', -1, -1, 'nwse-resize'],
            ['n', 0.5, -1, 'ns-resize'],
            ['ne', 1, -1, 'nesw-resize'],
            ['e', 1, 0.5, 'ew-resize'],
            ['se', 1, 1, 'nwse-resize'],
            ['s', 0.5, 1, 'ns-resize'],
            ['sw', 0, 1, 'nesw-resize'],
            ['w', 0, 0.5, 'ew-resize'],
          ]
          return (
            <div key={z.id} className="zone" style={{ ...style, position: 'absolute', cursor: 'move', zIndex: 2 }}
              onPointerDown={(e) => onPointerDown(e, z.id, 'move')}>
              <span className="zid">{z.label || '?'}</span>
              {handles.map(([dir, hx, hy, cur]) => (
                <div
                  key={dir}
                  className="zone-handle"
                  data-dir={dir}
                  style={{
                    position: 'absolute',
                    left: `${hx * 100}%`,
                    top: `${hy * 100}%`,
                    width: HANDLE_SIZE,
                    height: HANDLE_SIZE,
                    marginLeft: -HANDLE_SIZE / 2,
                    marginTop: -HANDLE_SIZE / 2,
                    background: '#fff',
                    border: `2px solid ${color}`,
                    borderRadius: hx === 0.5 || hy === 0.5 ? 3 : '50%',
                    cursor: cur,
                    zIndex: 3,
                  }}
                  onPointerDown={(e) => onPointerDown(e, z.id, dir)}
                />
              ))}
            </div>
          )
        })}
        <div
          style={{ position: 'absolute', inset: 0, background: 'transparent', zIndex: 1 }}
          onPointerDown={() => { dragRef.current = null }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        />
      </div>

      {/* Réglages de chaque zone */}
      {zones.map((z) => {
        const g = zoneGeometry(z)
        const shapeLabel = z.shape === 'circle'
          ? `Cercle (centre ${Math.round(g?.cx * 100)}%, ${Math.round(g?.cy * 100)}%, rayon ${Math.round((g?.r || 0) * 100)}%)`
          : `Rectangle (${Math.round(g?.x * 100)}%, ${Math.round(g?.y * 100)}% → ${Math.round((g?.x + g?.w) * 100)}%, ${Math.round((g?.y + g?.h) * 100)}%)`
        return (
          <div key={z.id} className="expand" style={{ marginTop: 8 }}>
            <div className="row" style={{ marginBottom: 8 }}>
              <input
                type="text"
                placeholder="Étiquette attendue (réponse)"
                value={z.label}
                onChange={(e) => setZone(z.id, { label: e.target.value })}
                style={{ flex: '2' }}
              />
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(z.color || '') ? z.color : '#2563eb'}
                onChange={(e) => setZone(z.id, { color: e.target.value })}
                title="Couleur"
                style={{ width: 44, height: 36, border: '1px solid #e2e8f0', borderRadius: 6, padding: 2, cursor: 'pointer' }}
              />
              <input
                type="number"
                min={0}
                max={100}
                value={Math.round((z.opacity ?? 0.3) * 100)}
                onChange={(e) => {
                  const v = e.target.value
                  setZone(z.id, { opacity: v === '' ? 0 : Math.max(0, Math.min(1, Number(v) / 100)) })
                }}
                title="Transparence (%)"
                style={{ width: 70 }}
              />
              <button className="btn danger small" onClick={() => removeZone(z.id)}>Suppr.</button>
            </div>
            <div className="row">
              <span className="hint" style={{ flex: '1' }}>{shapeLabel}</span>
              <span className="hint">Opacité : {Math.round((z.opacity ?? 0.3) * 100)}%</span>
            </div>
          </div>
        )
      })}
      {!zones.length && <p className="hint">Aucune zone. Ajoutez un rectangle ou un cercle, puis tirez sur les poignées pour le redimensionner et le déplacer.</p>}
    </div>
  )
}

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const num = parseInt(full, 16)
  if (Number.isNaN(num)) return `rgba(37,99,235,${alpha})`
  const r = (num >> 16) & 255
  const gr = (num >> 8) & 255
  const b = num & 255
  return `rgba(${r},${gr},${b},${alpha})`
}
