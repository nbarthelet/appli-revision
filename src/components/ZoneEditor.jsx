import { useRef, useState } from 'react'
import {
  zoneGeometry,
  SYMBOLS,
  SYMBOL_GLYPH,
  SYMBOL_GROUPS,
  LABEL_POSITIONS,
  EMOJI_SYMBOLS,
} from '../lib/model.js'
import { DECO_TYPES, newDecoration, decoGeometry } from '../lib/deco.js'

const HANDLE_SIZE = 12

// Éditeur de zones réutilisable (frise + carte image).
// Les coordonnées sont stockées en fractions (0-1) relatives à la scène affichée.
// - Rectangle : 2 points (p1, p2), déplaçable, redimensionnable par UNE poignée
//   (coin bas-droit) qui étire en largeur et en hauteur.
// - Cercle : centre + rayon, déplaçable et redimensionnable par poignée sur la circonférence.
// - Annotations (decorations) : décor dessinées sur le fond (ligne, texte, symbole,
//   zone colorée, hachure). Ce ne sont pas des réponses.
export default function ZoneEditor({
  zones,
  onChange,
  decorations = [],
  onDecorationsChange,
  imageUrl,
  label = '',
  height = 420,
  ratio = null,
}) {
  const stageRatio = ratio && ratio > 0 ? ratio : null
  const stageRef = useRef(null)
  const dragRef = useRef(null) // { zoneId, op, startX, startY, orig }
  const [openId, setOpenId] = useState(null) // zone dont les réglages sont déployés
  // Outils d'annotation (dessin sur le fond de carte)
  const [tool, setTool] = useState('select')
  const [draft, setDraft] = useState(null)
  const [decoOpts, setDecoOpts] = useState({ color: '#dc2626', size: 18, symbol: 'star' })
  const drawRef = useRef(null)

  const addDeco = (d) => {
    if (onDecorationsChange) onDecorationsChange([...(decorations || []), d])
  }
  const patchDeco = (id, p) => {
    if (onDecorationsChange)
      onDecorationsChange((decorations || []).map((d) => (d.id === id ? { ...d, ...p } : d)))
  }
  const removeDeco = (id) => {
    if (onDecorationsChange) onDecorationsChange((decorations || []).filter((d) => d.id !== id))
  }

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
        if (z.shape === 'marker') {
          return {
            ...z,
            img: [{ x: Math.max(0, Math.min(1, geo.cx)), y: Math.max(0, Math.min(1, geo.cy)) }],
          }
        }
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

    if (g.shape === 'circle' || g.shape === 'marker') {
      const cx = g.cx + dx
      const cy = g.cy + dy
      if (d.op === 'move' || g.shape === 'marker') {
        next = { shape: g.shape, cx, cy, r: g.r }
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
        // une seule poignée (coin bas-droit) : étire en largeur ET en hauteur,
        // l'angle haut-gauche restant fixe.
        const min = 0.02
        w = Math.max(min, Math.min(1 - x, g.w + dx))
        h = Math.max(min, Math.min(1 - y, g.h + dy))
      }
      next = { shape: 'rect', x, y, w, h }
    }
    patchZone(d.zoneId, next)
  }

  const onPointerUp = () => {
    dragRef.current = null
  }

  // ---------------- Outils de dessin sur le fond ----------------
  const draftFrom = (type, points, opts) => {
    if (type === 'line' || type === 'linefree')
      return { type: 'line', points, color: opts.color, width: 3 }
    const xs = points.map((p) => p.x)
    const ys = points.map((p) => p.y)
    const x = Math.min(...xs)
    const y = Math.min(...ys)
    return {
      type,
      shape: 'rect',
      x,
      y,
      w: Math.max(0.004, Math.max(...xs) - x),
      h: Math.max(0.004, Math.max(...ys) - y),
      color: opts.color,
      opacity: 0.25,
    }
  }

  const onDrawDown = (e) => {
    if (tool === 'select') {
      dragRef.current = null
      return
    }
    e.preventDefault()
    e.stopPropagation()
    const p = toFrac(e.clientX, e.clientY)
    if (tool === 'text') {
      // Pas de fenêtre système : le texte est créé et se modifie dans la liste.
      addDeco(
        newDecoration('text', {
          text: 'Texte',
          x: p.x,
          y: p.y,
          size: decoOpts.size,
          color: decoOpts.color,
        })
      )
      setTool('select')
      return
    }
    if (tool === 'symbol') {
      addDeco(
        newDecoration('symbol', {
          symbol: decoOpts.symbol,
          x: p.x,
          y: p.y,
          size: decoOpts.size,
          color: decoOpts.color,
        })
      )
      setTool('select')
      return
    }
    drawRef.current = { type: tool, points: [p] }
    setDraft(draftFrom(tool, [p], decoOpts))
  }

  const onDrawMove = (e) => {
    const d = drawRef.current
    if (!d) return
    const p = toFrac(e.clientX, e.clientY)
    if (d.type === 'linefree') {
      // main levée : on accumule les points au fil du tracé
      const last = d.points[d.points.length - 1]
      if (Math.hypot(p.x - last.x, p.y - last.y) > 0.004) {
        d.points = [...d.points, p]
        setDraft(draftFrom(d.type, d.points, decoOpts))
      }
    } else if (d.type === 'line') {
      // droite : deux points seulement (départ → arrivée)
      d.points = [d.points[0], p]
      setDraft(draftFrom(d.type, d.points, decoOpts))
    } else {
      d.points = [d.points[0], p]
      setDraft(draftFrom(d.type, d.points, decoOpts))
    }
  }

  const onDrawUp = () => {
    const d = drawRef.current
    drawRef.current = null
    if (!d) return
    setDraft(null)
    if (d.type === 'line' || d.type === 'linefree') {
      if (d.points.length >= 2) addDeco({ ...newDecoration('line'), points: d.points, color: decoOpts.color, width: 3 })
    } else {
      const r = draftFrom(d.type, d.points, decoOpts)
      if (r.w > 0.006 && r.h > 0.006) addDeco({ ...newDecoration(d.type), ...r })
    }
  }

  const addRect = () =>
    onChange([...zones, newZoneLocal('rect')])
  const addCircle = () =>
    onChange([...zones, newZoneLocal('circle')])
  const addMarker = () =>
    onChange([...zones, newZoneLocal('marker')])
  const newZoneLocal = (shape) => {
    const id = 'z-' + Math.random().toString(36).slice(2, 9)
    if (shape === 'circle')
      return { id, label: '', color: '#2563eb', opacity: 0.3, shape: 'circle', img: [{ x: 0.5, y: 0.5 }], radiusPct: 0.1, geo: [] }
    if (shape === 'marker')
      return {
        id, label: '', color: '#2563eb', opacity: 0.3, shape: 'marker', img: [{ x: 0.5, y: 0.5 }],
        geo: [], symbol: 'pin', size: 22, fontSize: 12, labelPos: 'right',
      }
    return { id, label: '', color: '#2563eb', opacity: 0.3, shape: 'rect', img: [{ x: 0.3, y: 0.3 }, { x: 0.6, y: 0.55 }], geo: [] }
  }
  const removeZone = (id) => onChange(zones.filter((z) => z.id !== id))
  const setZone = (id, p) => onChange(zones.map((z) => (z.id === id ? { ...z, ...p } : z)))

  // Étiquettes en double : la banque d'étiquettes de l'élève est dédoublonnée,
  // donc un doublon rend l'exercice impossible à finir.
  const doublons = (() => {
    const seen = new Map()
    zones.forEach((z) => {
      const l = (z.label || '').trim()
      if (!l) return
      seen.set(l, (seen.get(l) || 0) + 1)
    })
    return [...seen.entries()].filter(([, n]) => n > 1).map(([l]) => l)
  })()

  // Changement de forme : on conserve le centre (et la taille pour les zones).
  const changeShape = (id, shape) =>
    onChange(
      zones.map((z) => {
        if (z.id !== id) return z
        const g = zoneGeometry(z)
        if (!g) return z
        const cx = g.shape === 'rect' ? g.x + g.w / 2 : g.cx
        const cy = g.shape === 'rect' ? g.y + g.h / 2 : g.cy
        if (shape === 'marker') {
          return {
            ...z,
            shape: 'marker',
            img: [{ x: cx, y: cy }],
            radiusPct: 0,
            symbol: z.symbol || 'pin',
            size: z.size || 22,
            fontSize: z.fontSize || 12,
            labelPos: z.labelPos || 'right',
          }
        }
        if (shape === 'circle') {
          const r = g.shape === 'rect' ? Math.max(0.02, Math.hypot(g.w, g.h) / 2) : z.radiusPct || 0.05
          return { ...z, shape: 'circle', img: [{ x: cx, y: cy }], radiusPct: r }
        }
        const w = g.shape === 'rect' ? g.w : 0.12
        const h = g.shape === 'rect' ? g.h : 0.08
        return {
          ...z,
          shape: 'rect',
          img: [
            { x: cx, y: cy },
            { x: Math.min(0.99, cx + w), y: Math.min(0.99, cy + h) },
          ],
        }
      })
    )

  return (
    <div className="zone-editor">
      <div className="row" style={{ marginBottom: 8, flexWrap: 'wrap' }}>
        <button className="btn small" onClick={addRect}>+ Rectangle</button>
        <button className="btn small" onClick={addCircle}>+ Cercle</button>
        <button className="btn small" onClick={addMarker}>+ Symbole</button>
        {onDecorationsChange && (
          <>
            <span style={{ width: 12 }} />
            <span className="hint" style={{ margin: 0 }}>Dessiner sur la carte :</span>
            {[
              ['select', '✋ Repères'],
              ['line', '／ Droite'],
              ['linefree', '〜 Main levée'],
              ['text', 'T Texte'],
              ['symbol', '✦ Symbole'],
              ['zone', '▧ Zone'],
              ['hatch', '▨ Hachure'],
            ].map(([k, label]) => (
              <button
                key={k}
                className={'btn small' + (tool === k ? '' : ' ghost')}
                onClick={() => setTool(k)}
                title={
                  k === 'select'
                    ? 'Déplacer et redimensionner les repères'
                    : k === 'line'
                      ? 'Tracer une droite : glisse du point de départ au point d\'arrivée'
                      : k === 'linefree'
                        ? 'Dessiner un trait à main levée (glisser sur la carte)'
                        : k === 'text'
                          ? 'Placer un texte (clic sur la carte)'
                          : k === 'symbol'
                            ? 'Placer un symbole (clic sur la carte)'
                            : k === 'zone'
                              ? 'Tracer une zone colorée (glisser)'
                              : 'Tracer une zone hachurée (glisser)'
                }
              >
                {label}
              </button>
            ))}
          </>
        )}
      </div>

      {tool !== 'select' && onDecorationsChange && (
        <div className="row" style={{ marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(decoOpts.color) ? decoOpts.color : '#dc2626'}
            onChange={(e) => setDecoOpts((o) => ({ ...o, color: e.target.value }))}
            title="Couleur de l'annotation"
            style={{ width: 44, height: 32, border: '1px solid #e2e8f0', borderRadius: 6, padding: 2, cursor: 'pointer' }}
          />
          {tool !== 'zone' && tool !== 'hatch' && (
            <label className="field" style={{ margin: 0 }}>
              <span>Taille</span>
              <input
                type="number"
                min={8}
                max={96}
                value={decoOpts.size}
                onChange={(e) => setDecoOpts((o) => ({ ...o, size: Number(e.target.value) || 18 }))}
                style={{ width: 70 }}
              />
            </label>
          )}
          {tool === 'symbol' && (
            <select
              value={decoOpts.symbol}
              onChange={(e) => setDecoOpts((o) => ({ ...o, symbol: e.target.value }))}
              title="Symbole"
            >
              {Object.entries(SYMBOLS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.glyph} {v.label}
                </option>
              ))}
            </select>
          )}
          <span className="hint" style={{ margin: 0 }}>
            {tool === 'line'
              ? 'Glisse du point de départ au point d’arrivée : la droite est tracée entre les deux.'
              : tool === 'linefree'
                ? 'Glisse sur la carte pour dessiner le trait à main levée.'
                : tool === 'text'
                  ? 'Clique sur la carte pour placer le texte.'
                  : tool === 'symbol'
                    ? 'Clique sur la carte pour placer le symbole.'
                    : 'Glisse sur la carte pour tracer la zone.'}
          </span>
        </div>
      )}
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

          if (g.shape === 'marker') {
            const glyph = SYMBOL_GLYPH[z.symbol] || '●'
            const flexDir =
              z.labelPos === 'left'
                ? 'row-reverse'
                : z.labelPos === 'top'
                  ? 'column-reverse'
                  : z.labelPos === 'bottom'
                    ? 'column'
                    : 'row'
            return (
              <div
                key={z.id}
                className="zone zone-marker"
                style={{
                  position: 'absolute',
                  left: `${g.cx * 100}%`,
                  top: `${g.cy * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  flexDirection: flexDir,
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'move',
                  zIndex: 2,
                }}
                onPointerDown={(e) => onPointerDown(e, z.id, 'move')}
              >
                <span className="mk-sym" style={{ fontSize: z.size || 22, lineHeight: 1, color }}>
                  {glyph}
                </span>
                <span
                  className="mk-lbl"
                  style={{
                    fontSize: z.fontSize || 12,
                    background: 'rgba(255,255,255,.9)',
                    padding: '1px 6px',
                    borderRadius: 4,
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                  }}
                >
                  {z.label || '?'}
                </span>
              </div>
            )
          }

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
          // Une seule poignée (coin bas-droit) : étire dans les deux dimensions.
          return (
            <div key={z.id} className="zone" style={{ ...style, position: 'absolute', cursor: 'move', zIndex: 2 }}
              onPointerDown={(e) => onPointerDown(e, z.id, 'move')}>
              <span className="zid">{z.label || '?'}</span>
              <div
                className="zone-handle"
                data-dir="se"
                style={{
                  position: 'absolute',
                  right: -HANDLE_SIZE / 2,
                  bottom: -HANDLE_SIZE / 2,
                  width: HANDLE_SIZE,
                  height: HANDLE_SIZE,
                  background: '#fff',
                  border: `2px solid ${color}`,
                  borderRadius: 4,
                  cursor: 'nwse-resize',
                  zIndex: 3,
                }}
                title="Étirer (largeur et hauteur)"
                onPointerDown={(e) => onPointerDown(e, z.id, 'se')}
              />
            </div>
          )
        })}
        <div
          style={{ position: 'absolute', inset: 0, background: 'transparent', zIndex: tool === 'select' ? 1 : 5 }}
          onPointerDown={onDrawDown}
          onPointerMove={(e) => (tool === 'select' ? onPointerMove(e) : onDrawMove(e))}
          onPointerUp={(e) => (tool === 'select' ? onPointerUp(e) : onDrawUp(e))}
          onPointerLeave={(e) => (tool === 'select' ? onPointerUp(e) : onDrawUp(e))}
        />
        <DecoLayer
          decorations={[...(decorations || []), ...(draft ? [draft] : [])]}
          aspect={stageRatio || 1}
        />
      </div>

      {/* Réglages de chaque zone */}
      {zones.map((z) => {
        const g = zoneGeometry(z)
        const shapeLabel = !g
          ? '—'
          : z.shape === 'marker'
            ? `Symbole ${SYMBOLS[z.symbol]?.label || z.symbol} (${Math.round(g.cx * 100)}%, ${Math.round(g.cy * 100)}%)`
            : z.shape === 'circle'
              ? `Cercle (centre ${Math.round(g.cx * 100)}%, ${Math.round(g.cy * 100)}%, rayon ${Math.round((g.r || 0) * 100)}%)`
              : `Rectangle (${Math.round(g.x * 100)}%, ${Math.round(g.y * 100)}% → ${Math.round((g.x + g.w) * 100)}%, ${Math.round((g.y + g.h) * 100)}%)`
        return (
          <div key={z.id} className="expand zone-set">
            <div className="row" style={{ marginBottom: 8, flexWrap: 'wrap' }}>
              <span
                className="zone-swatch"
                style={{ background: z.color || '#2563eb', width: 16, height: 16, borderRadius: 4, flex: '0 0 auto' }}
              />
              <input
                type="text"
                placeholder="Étiquette attendue (réponse)"
                value={z.label}
                onChange={(e) => setZone(z.id, { label: e.target.value })}
                style={{ flex: '2 1 160px', minWidth: 120 }}
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
              <select
                value={z.shape}
                onChange={(e) => changeShape(z.id, e.target.value)}
                title="Forme du repère"
                style={{ width: 130 }}
              >
                <option value="circle">Cercle (zone)</option>
                <option value="rect">Rectangle (zone)</option>
                <option value="marker">Symbole (repère)</option>
              </select>
              <button
                className="btn small"
                onClick={() => setOpenId(openId === z.id ? null : z.id)}
                title="Réglages détaillés"
              >
                {openId === z.id ? '▲' : '▼'}
              </button>
              <button className="btn danger small" onClick={() => removeZone(z.id)}>Suppr.</button>
            </div>

            {openId === z.id && (
              <>
                {z.shape === 'marker' && (
                  <>
                    <div className="sym-bank">
                      {SYMBOL_GROUPS.map((grp) => (
                        <div key={grp.name} className="sym-group">
                          <div className="sym-title">{grp.name}</div>
                          <div className="sym-grid">
                            {grp.keys.map((k) => (
                              <button
                                key={k}
                                type="button"
                                title={
                                  SYMBOLS[k]?.label + (EMOJI_SYMBOLS.has(k) ? ' (couleur fixe)' : '')
                                }
                                className={'sym-btn' + ((z.symbol || 'pin') === k ? ' active' : '')}
                                onClick={() => setZone(z.id, { symbol: k })}
                              >
                                {SYMBOLS[k]?.glyph || k}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                      <p className="hint" style={{ marginTop: 8, marginBottom: 0 }}>
                        Les emoji (📍 🧭 🌊…) gardent leur couleur d'origine : pour un symbole
                        coloré à l'identique de la carte, utilise les formes géométriques ou la
                        famille « traits fins ».
                      </p>
                    </div>

                    <div className="row" style={{ marginBottom: 8, flexWrap: 'wrap' }}>
                      <label className="field" style={{ margin: 0 }}>
                        <span>Taille</span>
                        <input
                          type="number"
                          min={8}
                          max={72}
                          value={z.size || 22}
                          onChange={(e) => setZone(z.id, { size: Number(e.target.value) || 22 })}
                          style={{ width: 70 }}
                        />
                      </label>
                      <label className="field" style={{ margin: 0 }}>
                        <span>Étiquette</span>
                        <select
                          value={z.labelPos || 'right'}
                          onChange={(e) => setZone(z.id, { labelPos: e.target.value })}
                        >
                          {Object.entries(LABEL_POSITIONS).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="field" style={{ margin: 0 }}>
                        <span>Police (px)</span>
                        <input
                          type="number"
                          min={7}
                          max={28}
                          value={z.fontSize || 12}
                          onChange={(e) => setZone(z.id, { fontSize: Number(e.target.value) || 12 })}
                          style={{ width: 70 }}
                        />
                      </label>
                    </div>
                  </>
                )}

                {z.shape === 'circle' && (
                  <div className="row" style={{ marginBottom: 8 }}>
                    <label className="field" style={{ margin: 0 }}>
                      <span>Rayon (% de la largeur)</span>
                      <input
                        type="number"
                        min={0.2}
                        max={40}
                        step={0.5}
                        value={Math.round((z.radiusPct || 0) * 1000) / 10}
                        onChange={(e) =>
                          setZone(z.id, {
                            radiusPct: Math.max(0.002, (Number(e.target.value) || 2) / 100),
                          })
                        }
                        style={{ width: 90 }}
                      />
                    </label>
                  </div>
                )}
              </>
            )}

            <div className="row">
              <span className="hint" style={{ flex: '1' }}>{shapeLabel}</span>
              <span className="hint">Opacité : {Math.round((z.opacity ?? 0.3) * 100)}%</span>
            </div>
          </div>
        )
      })}
      {onDecorationsChange && (decorations || []).length > 0 && (
        <div className="expand" style={{ marginTop: 10 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            Annotations du fond ({decorations.length})
          </div>
          <p className="hint" style={{ marginTop: 0 }}>
            Ces éléments sont décoratifs : ils apparaissent sur la carte mais ne sont pas des
            réponses à placer.
          </p>
          {(decorations || []).map((d) => (
            <div key={d.id} className="row" style={{ marginBottom: 6, flexWrap: 'wrap' }}>
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(d.color || '') ? d.color : '#dc2626'}
                onChange={(e) => patchDeco(d.id, { color: e.target.value })}
                title="Couleur"
                style={{ width: 40, height: 30, border: '1px solid #e2e8f0', borderRadius: 6, padding: 2, cursor: 'pointer' }}
              />
              <span style={{ flex: '1 1 140px', fontSize: '0.88rem' }}>
                {d.type === 'line'
                  ? (d.points?.length > 2 ? 'Ligne (main levée)' : 'Droite')
                  : d.type === 'text'
                    ? `Texte : « ${d.text} »`
                    : d.type === 'symbol'
                      ? `Symbole ${SYMBOLS[d.symbol]?.glyph || ''} ${SYMBOLS[d.symbol]?.label || ''}`
                      : d.type === 'hatch'
                        ? 'Zone hachurée'
                        : 'Zone colorée'}
              </span>
              {d.type === 'text' && (
                <input
                  type="text"
                  value={d.text}
                  onChange={(e) => patchDeco(d.id, { text: e.target.value })}
                  style={{ flex: '1 1 160px', minWidth: 120 }}
                />
              )}
              {d.type === 'text' && (
                <input
                  type="number"
                  min={8}
                  max={72}
                  value={d.size}
                  onChange={(e) => patchDeco(d.id, { size: Number(e.target.value) || 12 })}
                  title="Taille du texte (px)"
                  style={{ width: 68 }}
                />
              )}
              {d.type === 'symbol' && (
                <>
                  <select
                    value={d.symbol}
                    onChange={(e) => patchDeco(d.id, { symbol: e.target.value })}
                    title="Symbole"
                  >
                    {Object.entries(SYMBOLS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.glyph} {v.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={8}
                    max={96}
                    value={d.size}
                    onChange={(e) => patchDeco(d.id, { size: Number(e.target.value) || 26 })}
                    title="Taille (px)"
                    style={{ width: 68 }}
                  />
                </>
              )}
              {d.type === 'line' && (
                <input
                  type="number"
                  min={1}
                  max={14}
                  value={d.width}
                  onChange={(e) => patchDeco(d.id, { width: Number(e.target.value) || 3 })}
                  title="Épaisseur (px)"
                  style={{ width: 68 }}
                />
              )}
              <button className="btn danger small" onClick={() => removeDeco(d.id)}>Suppr.</button>
            </div>
          ))}
        </div>
      )}

      {!zones.length && <p className="hint">Aucune zone. Ajoutez un rectangle, un cercle ou un symbole, puis tirez sur les poignées pour le redimensionner et le déplacer.</p>}      {zones.length > 0 && doublons.length > 0 && (
        <p
          style={{
            background: '#fff3cd',
            border: '1px solid #ffd97a',
            color: '#7a5200',
            padding: '8px 12px',
            borderRadius: 10,
            fontSize: '0.85rem',
            marginTop: 10,
          }}
        >
          Étiquette utilisée plusieurs fois : {doublons.join(', ')}. L’élève ne peut poser qu’une
          étiquette de ce nom — renomme ou fusionne ces repères.
        </p>
      )}
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

// Rendu des annotations (décor du fond). Même géométrie que l'export (deco.js).
function DecoLayer({ decorations, aspect = 1 }) {
  return (
    <div className="deco-layer">
      {decorations.map((d, i) => {
        const g = decoGeometry(d, (s) => SYMBOL_GLYPH[s] || '●', aspect)
        const key = d.id || `draft-${i}`
        if (g.kind === 'line') {
          return (
            <div key={key} style={{ position: 'absolute', inset: 0, color: g.color }}>
              {g.segments.map((s, j) => (
                <span
                  key={j}
                  className="deco-seg"
                  style={{
                    left: `${s.x1}%`,
                    top: `${s.y1}%`,
                    width: `${s.len}%`,
                    transform: `rotate(${s.ang}deg)`,
                    '--w': `${g.width}px`,
                  }}
                />
              ))}
            </div>
          )
        }
        if (g.kind === 'text') {
          return (
            <span
              key={key}
              className="deco-text"
              style={{
                left: `${g.x}%`,
                top: `${g.y}%`,
                color: g.color,
                fontSize: `${g.size}px`,
                fontWeight: g.bold ? 800 : 600,
              }}
            >
              {g.text}
            </span>
          )
        }
        if (g.kind === 'symbol') {
          return (
            <span
              key={key}
              className="deco-sym"
              style={{ left: `${g.x}%`, top: `${g.y}%`, color: g.color, fontSize: `${g.size}px` }}
            >
              {g.glyph}
            </span>
          )
        }
        if (g.shape === 'circle') {
          return (
            <span
              key={key}
              className="deco-zone"
              style={{
                left: `${g.cx - g.r}%`,
                top: `${g.cy - g.r}%`,
                width: `${g.r * 2}%`,
                height: `${g.r * 2}%`,
                background: hexToRgba(g.color, g.opacity),
                borderColor: g.color,
              }}
            />
          )
        }
        return (
          <span
            key={key}
            className={'deco-' + g.kind}
            style={{
              left: `${g.x}%`,
              top: `${g.y}%`,
              width: `${g.w}%`,
              height: `${g.h}%`,
              '--c': g.color,
              ...(g.kind === 'zone' ? { background: hexToRgba(g.color, g.opacity), borderColor: g.color } : {}),
            }}
          />
        )
      })}
    </div>
  )
}
