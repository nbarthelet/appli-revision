// Génération de l'exercice HTML autonome.
// Produit un fichier unique, sans dépendance externe (CSS + JS embarqués),
// adapté aux tablettes (interactions tactiles) et utilisable hors-ligne.

import { SYMBOLS, SYMBOL_GLYPH, closureWords, normalizeKey } from './model.js'
import { decoGeometry } from './deco.js'

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ---------- CSS du runtime exporté ----------
const RUNTIME_CSS = `
:root{
  --cream:#FAF7F2;
  --orange:#FF5B00;
  --orange-soft:#FFE3CC;
  --ink:#281811;
  --ink-60:rgba(40,24,17,.62);
  --rose:#FFD4E5;
  --sky:#CFE2FF;
  --lime:#A2FF79;
  --line:#F0EAE1;
}
*{box-sizing:border-box}
body{margin:0;background:var(--cream);font-family:'Nunito','Poppins',ui-rounded,'Segoe UI',system-ui,-apple-system,sans-serif;color:var(--ink);line-height:1.5;-webkit-font-smoothing:antialiased}
button{font-family:inherit;font-size:0.95rem}
:focus-visible{outline:3px solid var(--orange);outline-offset:2px;border-radius:8px}
.ex-wrap{max-width:900px;margin:0 auto;padding:16px}
/* Header / bannière forte */
.ex-head{background:var(--orange);color:#fff;border-radius:26px;padding:18px 20px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:18px;box-shadow:none}
.ex-title{font-size:1.3rem;font-weight:800;margin:0;letter-spacing:-.01em}
.theme-dot{width:16px;height:16px;border-radius:50%;display:inline-block;background:#fff}
/* Sélecteur en pilules */
.selector{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;background:#FFE9D6;border-radius:999px;padding:6px}
.selector button{padding:9px 16px;border:none;background:transparent;border-radius:999px;cursor:pointer;font-size:0.92rem;font-weight:700;color:var(--ink-60);transition:background .15s,color .15s}
.selector button.active{background:#fff;color:var(--orange);box-shadow:0 2px 8px rgba(255,91,0,.18)}
.section-label{font-size:0.75rem;text-transform:uppercase;letter-spacing:.08em;color:var(--ink-60);margin:20px 0 8px;font-weight:800}
.instructions{background:#fff;border-left:6px solid var(--orange);padding:14px 16px;border-radius:16px;font-size:0.95rem;margin-bottom:16px;color:var(--ink-60);font-weight:500}
/* Boutons */
.primary{background:var(--orange);color:#fff;border:none;padding:12px 20px;border-radius:18px;cursor:pointer;font-weight:800;font-size:0.98rem;transition:transform .1s,background .15s}
.primary:active{transform:scale(.97)}
.ghost{background:#fff;border:2px solid var(--line);padding:10px 18px;border-radius:18px;cursor:pointer;font-weight:700;color:var(--ink);transition:border-color .15s}
.ghost:active{transform:scale(.97)}
.actions-row{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap}
/* Appariement */
.match{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.match-col{background:#fff;border:1px solid var(--line);border-radius:20px;padding:10px}
.match-item{padding:12px;border:2px solid var(--line);border-radius:14px;margin-bottom:8px;cursor:pointer;user-select:none;background:#fff;transition:background .15s,border-color .15s,color .15s;font-weight:600}
.match-item:hover{border-color:var(--orange)}
.match-item.sel{border-color:var(--orange);background:var(--orange-soft);color:var(--orange)}
.match-item.done{border-color:var(--lime);background:var(--lime);cursor:default;color:var(--ink)}
.match-item.err{animation:shake .3s}
@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
.match-feedback{margin-top:10px;font-weight:700}
/* Flashcards (retournement 3D) */
.flash-deck{display:flex;flex-direction:column;gap:14px}
.flash{background:#fff;border:1px solid var(--line);border-radius:22px;overflow:hidden}
.flash-card{perspective:1200px;cursor:pointer;overflow:hidden}
.flash-inner{position:relative;width:100%;height:160px;transition:transform .55s cubic-bezier(.4,.2,.2,1);transform-style:preserve-3d}
.flash.open .flash-inner{transform:rotateY(180deg)}
.flash-face{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:18px;backface-visibility:hidden;-webkit-backface-visibility:hidden;font-size:1.05rem;line-height:1.45}
.flash-front{background:var(--sky);color:var(--ink);font-weight:800}
.flash-back{background:var(--orange-soft);color:var(--ink);transform:rotateY(180deg);font-weight:500}
.flash-status{display:flex;gap:8px;padding:12px;border-top:1px dashed var(--line)}
.flash-status button{flex:1;padding:9px;border-radius:14px;border:2px solid var(--line);background:#fff;cursor:pointer;font-weight:700}
.flash-status .s-known{border-color:var(--lime);color:#4a7d33}
.flash-status .s-mid{border-color:#ffcf8a;color:#b06a00}
.flash-status .s-again{border-color:#ffb8b8;color:#c0392b}
.flash-status button.sel{color:#fff}
.sel-known{background:var(--lime)!important;color:var(--ink)!important;border-color:var(--lime)!important}
.sel-mid{background:#ffd67a!important;color:var(--ink)!important;border-color:#ffd67a!important}
.sel-again{background:#ff9d9d!important;color:var(--ink)!important;border-color:#ff9d9d!important}
/* Carte (image + OSM) */
.map-stage{position:relative;background:#fff;border:1px solid var(--line);border-radius:22px;overflow:hidden;touch-action:none;user-select:none}
.map-stage img{display:block;width:100%;height:auto;pointer-events:none}
.map-legend{margin-top:8px;font-size:.85rem;color:var(--ink-60)}
.zone{position:absolute;pointer-events:auto}
.zone-marker{min-width:34px;min-height:34px;justify-content:center}
.zone-marker .mk-sym{filter:drop-shadow(0 1px 2px rgba(0,0,0,.28))}
.zone-marker .zplaced{position:static;transform:none;margin:0;font-size:inherit;background:#fff;padding:2px 7px;border-radius:8px;font-weight:700}
.zone .zlabel{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:.7rem;background:rgba(255,255,255,.9);padding:2px 8px;border-radius:10px;pointer-events:none;text-align:center;max-width:90%}
.zone.droptarget{outline:3px solid var(--orange);outline-offset:3px;border-radius:12px}
.drop-bank{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 6px;padding:12px;background:#fff;border:1px solid var(--line);border-radius:20px;min-height:44px}
.drop-chip{padding:10px 16px;background:var(--orange);color:#fff;border-radius:16px;cursor:grab;font-size:.9rem;font-weight:700;user-select:none;box-shadow:none;touch-action:none;transition:transform .1s}
.drop-chip:active{transform:scale(.96)}
.drop-chip.sel{outline:3px solid #9333ea;outline-offset:2px}
.drop-chip.used{background:var(--lime);color:var(--ink);cursor:default}
.drop-chip.used.all{opacity:.5}
.drop-chip.dragging{opacity:.4}
.drop-chip.ghost{position:fixed;left:0;top:0;z-index:99999;pointer-events:none;cursor:grabbing;box-shadow:0 4px 12px rgba(0,0,0,.25);transform:scale(1.05)}
.drop-chip.ghost.used{background:var(--orange)}
.drop-head{margin-top:6px;font-size:.8rem;color:var(--ink-60);font-weight:700;text-transform:uppercase;letter-spacing:.05em}
.zone .zplaced{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:#fff;border:1px solid var(--line);padding:3px 10px;border-radius:12px;font-size:.75rem;font-weight:700;pointer-events:none;box-shadow:0 1px 2px rgba(0,0,0,.12);max-width:90%}
.zone.good .zplaced{background:var(--lime);border-color:var(--lime);color:var(--ink)}
.zone.zone-marker .zplaced{position:static;left:auto;top:auto;transform:none;margin:0;font-size:inherit;background:#fff;border:1px solid var(--line);padding:2px 7px;border-radius:8px;font-weight:700;max-width:none;white-space:nowrap}
.zone.zone-marker .zplaced.good{background:var(--lime);border-color:var(--lime);color:var(--ink)}
.zone.zone-marker .zplaced.bad{background:#ff9d9d;border-color:#ff9d9d;color:var(--ink)}
  /* Annotations décoratives du fond (non cliquables) */
  .deco-layer{position:absolute;inset:0;pointer-events:none;z-index:1}
  .deco-group{position:absolute;inset:0}
  .deco-seg{position:absolute;height:var(--w,3px);background:currentColor;transform-origin:0 50%;margin-top:calc(var(--w,3px) / -2);border-radius:2px}
  .deco-text{position:absolute;transform:translate(7px,-50%);font-weight:600;text-shadow:0 1px 2px rgba(255,255,255,.9),0 0 4px rgba(255,255,255,.7);white-space:nowrap}
  .deco-sym{position:absolute;transform:translate(-50%,-50%);line-height:1;filter:drop-shadow(0 1px 2px rgba(255,255,255,.9))}
  .deco-zone{position:absolute;border:1px solid rgba(0,0,0,.25)}
  .deco-hatch{position:absolute;border:1px solid var(--c,#dc2626);background-image:repeating-linear-gradient(45deg,var(--c,#dc2626) 0 2px,transparent 2px 7px)}
.zone.bad .zplaced{background:#ff9d9d;border-color:#ff9d9d;color:var(--ink)}
/* Frise */
.tl-wrap{background:#fff;border:1px solid var(--line);border-radius:22px;padding:14px;position:relative;overflow:hidden}
.tl-stage{position:relative;background:#fff;border:1px solid var(--line);border-radius:22px;overflow:hidden;touch-action:none;user-select:none}
.tl-stage img{display:block;width:100%;height:auto;pointer-events:none}
.tl-title{margin:0 0 8px;font-size:1.1rem;color:var(--ink);font-weight:800}
/* Texte à trous */
.cloze-bank{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;min-height:40px}
.cloze-word{padding:10px 14px;background:var(--orange);color:#fff;border-radius:16px;cursor:pointer;font-size:.9rem;font-weight:700;transition:transform .1s}
.cloze-word:active{transform:scale(.96)}
.cloze-word.selected{outline:3px solid var(--ink);transform:scale(1.08)}
.cloze-word.used{background:var(--lime);color:var(--ink);pointer-events:none;text-decoration:none;opacity:.55}
.cloze-text{background:#fff;border:1px solid var(--line);border-radius:20px;padding:18px;font-size:1.05rem;line-height:2.2}
.cloze-gap{display:inline-block;min-width:90px;padding:4px 10px;border:2px dashed var(--orange);border-radius:14px;text-align:center;color:#bbb;cursor:pointer;margin:2px;font-weight:600}
.cloze-gap.filled{background:var(--orange-soft);color:var(--ink);border-style:solid}
.cloze-gap.ok{background:var(--lime);border-color:var(--lime);color:var(--ink)}
.cloze-gap.err{background:#ffe0e0;border-color:#ff9d9d;color:#c0392b}
/* QCM */
.qcm-doc{background:#fff;border:1px solid var(--line);border-radius:20px;padding:18px;margin-bottom:14px;font-size:.98rem;white-space:pre-wrap}
.qcm-doc img{max-width:100%;height:auto;display:block;margin:0 auto;border-radius:16px}
.qcm-q{background:#fff;border:1px solid var(--line);border-radius:20px;padding:16px;margin-bottom:12px}
.qcm-qnum{font-weight:800}
.qcm-opts{display:flex;flex-direction:column;gap:8px;margin-top:10px}
.qcm-opt{padding:12px 14px;border:2px solid var(--line);border-radius:14px;cursor:pointer;background:#fff;transition:border-color .15s,background .15s;font-weight:600}
.qcm-opt:hover{border-color:var(--orange)}
.qcm-opt.sel{border-color:var(--orange);background:var(--orange-soft);color:var(--orange)}
.qcm-opt.ok{border-color:var(--lime);background:var(--lime);color:var(--ink)}
.qcm-opt.err{border-color:#ff9d9d;background:#ffe0e0;color:#c0392b}
.qcm-result{margin-top:6px;font-weight:700}
.result-panel{background:#fff;border:1px solid var(--line);border-radius:20px;padding:18px;text-align:center;margin-top:14px;font-weight:700;color:var(--ink)}
.result-panel strong{color:var(--orange)}
.result-panel .progress{margin-top:10px}
.progress-wrap{margin-top:8px}
.progress{width:100%;height:8px;background:var(--line);border-radius:999px;overflow:hidden}
.progress-fill{height:100%;border-radius:999px;background:var(--orange);transition:width .4s ease}
.progress-fill.perfect{background:var(--lime)}
.hidden{display:none!important}
/* Page d'accueil */
.homepage{max-width:900px;margin:0 auto;padding:20px 16px 60px}
.homepage .home-head{background:var(--orange);color:#fff;border-radius:26px;padding:22px 24px;margin-bottom:24px}
.homepage .home-head h1{margin:0;font-size:1.4rem;font-weight:800;letter-spacing:-.01em}
.homepage .home-sub{color:var(--ink-60);font-size:.92rem;margin-top:6px;font-weight:500}
.exercises-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.exercise-card{display:flex;flex-direction:column;align-items:center;text-align:center;background:#fff;border:1.5px solid var(--line);border-radius:22px;padding:24px 14px;text-decoration:none;color:var(--ink);transition:transform .12s,border-color .15s,box-shadow .15s}
.exercise-card:hover{border-color:var(--orange);transform:translateY(-2px);box-shadow:0 6px 20px -6px rgba(255,91,0,.18)}
.exercise-card:active{transform:scale(.97)}
.card-icon{font-size:2.2rem;margin-bottom:8px;line-height:1}
.card-label{font-size:.95rem;font-weight:800;color:var(--ink);margin-bottom:4px}
.card-count{font-size:.78rem;font-weight:600;color:var(--ink-60);background:var(--orange-soft);padding:2px 10px;border-radius:999px}
.exercise-section .ex-head .ghost{margin-left:auto}
/* --- Mobile : étiquettes pleine largeur et confort au doigt --- */
@media (max-width:640px){
  .ex-wrap{padding:10px}
  .ex-head{border-radius:20px;padding:14px 16px}
  .drop-head{font-size:.75rem}
  .drop-bank{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;padding:8px}
  .drop-chip{justify-content:center;text-align:center;padding:12px 8px;font-size:.95rem;min-height:48px;border-radius:14px}
  .zone .zplaced{font-size:.7rem;padding:2px 5px}
}
@media (pointer:coarse){
  .map-stage,.tl-stage{cursor:zoom-in}
}
.map-stage,.tl-stage{will-change:transform}
`

// ---------- Rendu des blocs dans le HTML ----------
function renderBlock(m, block) {
   switch (block.kind) {
     case 'matching':
       return matchingHTML(m.pairs, m.instructions.matching)
     case 'flashcards':
       return flashcardsHTML(m.cards, m.instructions.flashcards)
     case 'map':
       return mapHTML(m.maps[block.index], m.instructions.map)
     case 'timeline':
       return timelineHTML(m.timelines[block.index], m.instructions.timeline)
     case 'cloze':
       return clozeHTML(m.clozes[block.index], m.instructions.cloze)
     case 'qcm':
       return qcmHTML(m.qcms[block.index], m.instructions.qcm)
     default:
       return ''
   }
 }

 function getExerciseEmoji(kind) {
   const emojis = {
     matching: '🔗',
     flashcards: '🃏',
     map: '📍',
     timeline: '📅',
     cloze: '✏️',
     qcm: '📝'
   }
   return emojis[kind] || '❓'
 }

function matchingHTML(pairs, instr) {
  const shuffled = (arr) =>
    arr
      .map((v) => ({ v, k: Math.random() }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.v)
  const left = shuffled(pairs)
  const right = shuffled(pairs)
  const li = left
    .map(
      (p, i) =>
        `<div class="match-item side-l" data-id="${p.id}" data-val="${i}">${esc(p.a)}</div>`,
    )
    .join('')
  const ri = right
    .map(
      (p, i) =>
        `<div class="match-item side-r" data-id="${p.id}" data-val="${i}">${esc(p.b)}</div>`,
    )
    .join('')
  return `
<div class="match-block" data-instr="${esc(instr)}">
  <div class="match">
    <div class="match-col side-l" id="ml">${li}</div>
    <div class="match-col side-r" id="mr">${ri}</div>
  </div>
  <div class="match-actions">
    <button class="primary" data-action="check-match">Vérifier</button>
    <button class="ghost" data-action="reset-match">Recommencer</button>
  </div>
  <div class="match-feedback" style="margin-top:10px"></div>
</div>`
}

function flashcardsHTML(cards, instr) {
  const items = cards
    .map(
      (c) => `
  <div class="flash">
    <div class="flash-card" tabindex="0">
      <div class="flash-inner">
        <div class="flash-face flash-front">${esc(c.question)}</div>
        <div class="flash-face flash-back">${esc(c.answer)}</div>
      </div>
    </div>
    <div class="flash-status">
      <button class="s-known" data-s="known">✓ Maîtrisé</button>
      <button class="s-mid" data-s="mid">~ Consolidé</button>
      <button class="s-again" data-s="again">? À revoir</button>
    </div>
  </div>`,
    )
    .join('')
  return `
<div class="flash-block" data-instr="${esc(instr)}">
  <div class="flash-deck">${items}</div>
  <div class="result-panel" id="flash-result"></div>
  <div class="flash-actions">
    <button class="ghost" data-action="reset-flash">Recommencer</button>
  </div>
</div>`
}

function symbolGlyph(sym, color) {
  const s = SYMBOLS[sym] || SYMBOLS.circle
  return `<span class="sym" style="color:${color};font-size:20px">${esc(s.glyph)}</span>`
}

// Rendu partagé des zones (frise + carte) : rectangles et cercles draggables/drop
function zonesHTML(zones, prefix) {
  return (zones || [])
    .map((z, i) => {
      if (!z) return ''
      const color = z.color || '#2563eb'
      const a = (z.opacity ?? 0.3) * 255
      const alpha = Math.round(a).toString(16).padStart(2, '0')
      const label = (z.label || '').trim()
      const dataLabel = label ? ` data-label="${esc(label)}"` : ''
      if (z.shape === 'marker' && z.img && z.img.length >= 1) {
        const c = z.img[0]
        const glyph = SYMBOL_GLYPH[z.symbol] || '●'
        const size = z.size || 22
        const fs = z.fontSize || 12
        const pos = z.labelPos || 'right'
        const dir =
          pos === 'left'
            ? 'row-reverse'
            : pos === 'top'
              ? 'column-reverse'
              : pos === 'bottom'
                ? 'column'
                : 'row'
        // NB : aucune étiquette visible ici — c'est la réponse que l'élève doit placer.
        return `<div class="zone zone-marker" data-pf="${prefix}" data-zone="${i}"${dataLabel} style="left:${c.x * 100}%;top:${c.y * 100}%;transform:translate(-50%,-50%);display:flex;flex-direction:${dir};align-items:center;gap:6px;padding:8px;font-size:${fs}px">
          <span class="mk-sym" style="font-size:${size}px;line-height:1;color:${color}">${glyph}</span>
        </div>`
      }
      if (z.shape === 'circle' && z.img && z.img.length >= 1) {
        const c = z.img[0]
        const r = Math.max(0.01, z.radiusPct || 0.1)
        return `<div class="zone" data-pf="${prefix}" data-zone="${i}"${dataLabel} style="left:${c.x * 100}%;top:${c.y * 100}%;width:${r * 200}%;height:${r * 200}%;margin-left:${-r * 100}%;margin-top:${-r * 100}%;background:${color}${alpha};border-radius:50%"></div>`
      }
      if (z.shape === 'rect' && z.img && z.img.length >= 2) {
        const x1 = Math.min(z.img[0].x, z.img[1].x) * 100
        const y1 = Math.min(z.img[0].y, z.img[1].y) * 100
        const x2 = Math.max(z.img[0].x, z.img[1].x) * 100
        const y2 = Math.max(z.img[0].y, z.img[1].y) * 100
        return `<div class="zone" data-pf="${prefix}" data-zone="${i}"${dataLabel} style="left:${x1}%;top:${y1}%;width:${x2 - x1}%;height:${y2 - y1}%;background:${color}${alpha}"></div>`
      }
      return ''
    })
    .join('')
}

// Banque d'étiquettes (seulement les bonnes réponses, dédoublonnées)
function dropBankHTML(zones) {
  const seen = new Set()
  const labels = []
  ;(zones || []).forEach((z) => {
    const l = (z && z.label || '').trim()
    if (l && !seen.has(l)) {
      seen.add(l)
      labels.push(l)
    }
  })
  if (!labels.length) return ''
  return (
    `<div class="drop-head">Glissez ou cliquez sur l’étiquette puis sur la bonne zone</div>` +
    `<div class="drop-bank">${labels.map((l) => `<div class="drop-chip" draggable="true" data-label="${esc(l)}">${esc(l)}</div>`).join('')}</div>`
  )
}

// Annotations décoratives du fond (lignes, textes, symboles, zones, hachures).
// Elles sont sous les zones de réponse et ne sont pas des cibles de dépôt.
function decorationsHTML(decos, aspect = 1) {
  if (!decos || !decos.length) return ''
  const out = []
  for (const d of decos) {
    const g = decoGeometry(d, (s) => SYMBOL_GLYPH[s] || '●', aspect)
    if (g.kind === 'line') {
      const segs = g.segments
        .map(
          (s) =>
            `<span class="deco-seg" style="left:${s.x1}%;top:${s.y1}%;width:${s.len}%;transform:rotate(${s.ang}deg);--w:${g.width}px"></span>`
        )
        .join('')
      out.push(`<div class="deco-group" style="color:${g.color}">${segs}</div>`)
    } else if (g.kind === 'text') {
      out.push(
        `<span class="deco-text" style="left:${g.x}%;top:${g.y}%;color:${g.color};font-size:${g.size}px;font-weight:${g.bold ? 800 : 600}">${esc(g.text)}</span>`
      )
    } else if (g.kind === 'symbol') {
      out.push(
        `<span class="deco-sym" style="left:${g.x}%;top:${g.y}%;color:${g.color};font-size:${g.size}px">${g.glyph}</span>`
      )
    } else if (g.shape === 'circle') {
      const a = Math.round(g.opacity * 255)
        .toString(16)
        .padStart(2, '0')
      out.push(
        `<span class="deco-zone" style="left:${g.cx - g.r}%;top:${g.cy - g.r}%;width:${g.r * 2}%;height:${g.r * 2}%;background:${g.color}${a};border-color:${g.color}"></span>`
      )
    } else {
      const a = Math.round(g.opacity * 255)
        .toString(16)
        .padStart(2, '0')
      const bg = g.kind === 'zone' ? `background:${g.color}${a};border-color:${g.color};` : ''
      out.push(
        `<span class="deco-${g.kind}" style="left:${g.x}%;top:${g.y}%;width:${g.w}%;height:${g.h}%;--c:${g.color};${bg}"></span>`
      )
    }
  }
  return `<div class="deco-layer">${out.join('')}</div>`
}

function mapHTML(map, instr) {
  // Mode zones (étiquettes à poser) : la consigne par défaut ne convient pas.
  const consigne =
    (map.zones?.length || 0) > 0
      ? "Glissez ou cliquez chaque étiquette sur le bon repère de la carte, puis vérifiez vos réponses."
      : instr
  const zones = zonesHTML(map.zones, 'map')
  const aspect = map.imageWidth && map.imageHeight ? map.imageWidth / map.imageHeight : 1
  const decos = decorationsHTML(map.decorations, aspect)
  return `
<div class="map-block" data-instr="${esc(consigne)}" data-mode="${esc(map.mode)}" data-center="${esc(JSON.stringify(map.center || [0, 0]))}" data-zoom="${map.zoom || 5}">
  <div class="map-stage">
    ${map.imageDataUrl ? `<img src="${map.imageDataUrl}" data-bg="1" />` : ''}
    ${decos}
    ${zones}
    <div class="map-msg" style="position:absolute;bottom:8px;left:8px;background:rgba(255,255,255,.9);padding:4px 10px;border-radius:6px;font-size:.8rem"></div>
  </div>
  ${dropBankHTML(map.zones)}
  <div class="actions-row">
    <button class="primary" data-action="check-map">Vérifier</button>
    <button class="ghost" data-action="reset-map">Recommencer</button>
  </div>
  <div class="result-panel hidden" id="map-result"></div>
</div>`
}

function timelineHTML(tl, instr) {
  const title = (tl.title || 'Frise chronologique').trim()
  const zones = zonesHTML(tl.zones, 'tl')
  // Rendu image+frise (mode éditeur zones) si une image est fournie
  if (tl.imageDataUrl) {
    return `
<div class="tl-block" data-instr="${esc(instr)}">
  <h3 class="tl-title">${esc(title)}</h3>
  <div class="tl-stage">
    <img src="${tl.imageDataUrl}" data-bg="1" />
    ${zones}
  </div>
  ${dropBankHTML(tl.zones)}
  <div class="actions-row">
    <button class="primary" data-action="check-tl">Vérifier</button>
    <button class="ghost" data-action="reset-tl">Recommencer</button>
  </div>
  <div class="result-panel hidden" id="tl-result"></div>
</div>`
  }
  // Frise sans image : l'axe chronologique (mode historique) est abandonné.
  // On ne propose donc rien tant qu'aucune zone n'a été placée.
  return `
<div class="tl-block" data-instr="${esc(instr)}">
  <div class="tl-title">${esc(title)}</div>
  <div class="tl-wrap" style="padding:20px;color:var(--ink-60)">
    Ajoute une image de frise et place des repères pour construire cet exercice.
  </div>
</div>`
}

function clozeHTML(cloze, instr) {
  const words = closureWords(cloze.text)
  const distractors = (cloze.distractors || []).filter((d) => d && !words.includes(d))
  // Transforme [mot] en gap, en échappant correctement le texte (mais pas le span injecté)
  const parts = []
  const re = /\[([^\]]+)\]/g
  let last = 0
  let mm
  while ((mm = re.exec(cloze.text))) {
    parts.push(esc(cloze.text.slice(last, mm.index)))
    const word = mm[1].trim()
    parts.push(`<span class="cloze-gap" data-word="${esc(word)}">_</span>`)
    last = re.lastIndex
  }
  parts.push(esc(cloze.text.slice(last)))
  const html = parts.join('')
  return `
<div class="cloze-block" data-instr="${esc(instr)}" data-distractors="${esc(distractors.join('|'))}">
  <div class="cloze-bank"></div>
  <div class="cloze-text">${html}</div>
  <div class="cloze-actions">
    <button class="primary" data-action="check-cloze">Vérifier</button>
    <button class="ghost" data-action="reset-cloze">Recommencer</button>
  </div>
  <div class="result-panel hidden" id="cloze-result"></div>
</div>`
}

// ---------- Fiche objectifs (PDF) ----------
function objectifsHTML(obj) {
  const titre = (obj?.titre || 'FICHE D\'OBJECTIFS DE RÉVISION').trim()
  const reperes = (obj?.reperes || []).filter(Boolean)
  const explications = (obj?.explications || []).filter(Boolean)
  const vocabulaire = obj?.vocabulaire || {}

  const itemHTML = (text) => `
    <div class="item">
      <div class="cb"></div>
      <span>${esc(text)}</span>
    </div>`

  const subItemHTML = (text) => `
    <div class="sub-item">
      <div class="cb"></div>
      <span>${esc(text)}</span>
    </div>`

  const reperesHTML = reperes.map(itemHTML).join('')
  const explicationsHTML = explications.map(itemHTML).join('')

  const vocabulaireHTML = Object.entries(vocabulaire)
    .map(([cat, mots]) => {
      const motsFiltered = (mots || []).filter(Boolean)
      if (motsFiltered.length === 0) return ''
      return `
        <div>
          <div class="sub-title">${esc(cat)}</div>
          ${motsFiltered.map(subItemHTML).join('')}
        </div>`
    })
    .join('')

  // On récupère le template CSS du fichier template.html (inliné ici pour l'export)
  // Le template complet est dans template.html à la racine du projet
  // Ici on génère un HTML autonome avec le même CSS
  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(titre)}</title>
    <script data-goatcounter="https://mbarth.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700;800&display=swap" rel="stylesheet">
    <style>
        @page {
            size: A4 landscape;
            margin: 12mm;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        html, body {
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 9.5pt;
            line-height: 1.25;
            color: #1a1a2e;
            background: #f0ebe3;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .page {
            background: #f0ebe3;
            padding: 10px 12px;
        }

        /* ===== EN-TÊTE ===== */
        .header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
        }

        .header-icon {
            width: 34px;
            height: 34px;
            background: #1a1a2e;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .header-icon svg {
            width: 20px;
            height: 20px;
            fill: none;
            stroke: #ffffff;
            stroke-width: 2;
            stroke-linecap: round;
            stroke-linejoin: round;
        }

        .header-title {
            flex: 1;
            text-align: center;
        }

        .header-title h1 {
            font-family: 'Poppins', sans-serif;
            font-size: 15pt;
            font-weight: 800;
            color: #1a1a2e;
            letter-spacing: -0.3px;
            line-height: 1.05;
        }

        /* ===== GRILLE HAUT ===== */
        .top-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-bottom: 8px;
        }

        /* ===== BLOCS ===== */
        .card {
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
        }

        .card-label {
            padding: 6px 14px;
            font-family: 'Poppins', sans-serif;
            font-weight: 700;
            font-size: 9pt;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #ffffff;
        }

        .card-label.green {
            background: linear-gradient(135deg, #5b9a8b 0%, #7bc4b5 100%);
        }

        .card-label.orange {
            background: linear-gradient(135deg, #c97b5a 0%, #e09a7a 100%);
        }

        .card-label.yellow {
            background: linear-gradient(135deg, #d4a843 0%, #e8c76a 100%);
            color: #3d3420;
        }

        .card-body {
            padding: 8px 12px;
        }

        /* ===== CHECKBOX ITEMS ===== */
        .item {
            display: flex;
            align-items: flex-start;
            gap: 7px;
            padding: 3px 0;
            font-size: 8.6pt;
            color: #2d2d3a;
        }

        .item + .item {
            border-top: 1px solid #f0ece6;
        }

        .cb {
            width: 13px;
            height: 13px;
            border: 2px solid #c0bdb5;
            border-radius: 4px;
            flex-shrink: 0;
            margin-top: 1px;
            background: #ffffff;
        }

        /* ===== SOUS-CATÉGORIES ===== */
        .sub-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
        }

        .sub-title {
            font-family: 'Poppins', sans-serif;
            font-weight: 700;
            font-size: 8.8pt;
            color: #1a1a2e;
            text-decoration: underline;
            text-decoration-color: #c97b5a;
            text-underline-offset: 3px;
            margin-bottom: 4px;
        }

        .sub-item {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 2px 0;
            font-size: 8.6pt;
            color: #2d2d3a;
        }

        .sub-item .cb {
            width: 12px;
            height: 12px;
        }

        /* ===== BAS ===== */
        .bottom-card {
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
        }

        .bottom-items {
            padding: 8px 12px;
        }
        
        @media print {
            body { background: white; }
            .page { padding: 0; min-height: 0; }
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>
    <div class="page">

        <!-- EN-TÊTE -->
        <div class="header">
            <div class="header-icon">
                <svg viewBox="0 0 24 24">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                    <rect x="9" y="3" width="6" height="4" rx="1"/>
                    <path d="M9 14l2 2 4-4"/>
                </svg>
            </div>
            <div class="header-title">
                <h1>${esc(titre)}</h1>
            </div>
        </div>

        <!-- HAUT : 2 COLONNES -->
        <div class="top-grid">

            <!-- REPÈRES -->
            <div class="card">
                <div class="card-label green">Repères</div>
                <div class="card-body">
                    ${reperesHTML || '<div class="item"><div class="cb"></div><span style="color:#999">Aucun repère saisi</span></div>'}
                </div>
            </div>

            <!-- VOCABULAIRE -->
            <div class="card">
                <div class="card-label orange">Notions & Vocabulaire</div>
                <div class="card-body">
                    <div class="sub-grid">
                        ${vocabulaireHTML || '<div style="grid-column:1/-1;color:#999;padding:8px">Aucun vocabulaire saisi</div>'}
                    </div>
                </div>
            </div>

        </div>

        <!-- BAS : GRANDES LIGNES -->
        <div class="bottom-card">
            <div class="card-label yellow">Grandes lignes du cours à savoir expliquer</div>
            <div class="bottom-items">
                ${explicationsHTML || '<div class="item"><div class="cb"></div><span style="color:#999">Aucune explication saisie</span></div>'}
            </div>
        </div>

    </div>
</body>
</html>`
}

function qcmHTML(qcm, instr) {
  const doc =
    qcm.docMode === 'image' && qcm.docImageDataUrl
      ? `<div class="qcm-doc"><img src="${qcm.docImageDataUrl}" /></div>`
      : `<div class="qcm-doc">${esc(qcm.docText)}</div>`
  const qs = (qcm.questions || [])
    .map(
      (q, qi) => `
  <div class="qcm-q" data-correct="${q.correctIndex}">
    <div class="qcm-qnum" style="font-weight:700">${qi + 1}. ${esc(q.prompt)}</div>
    <div class="qcm-opts">
      ${q.options
        .map(
          (o, oi) =>
            `<div class="qcm-opt" data-oi="${oi}">${esc(o)}</div>`,
        )
        .join('')}
    </div>
  </div>`,
    )
    .join('')
  return `
<div class="qcm-block" data-instr="${esc(instr)}">
  ${doc}
  ${qs}
  <div class="qcm-actions">
    <button class="primary" data-action="check-qcm">Vérifier</button>
    <button class="ghost" data-action="reset-qcm">Recommencer</button>
  </div>
  <div class="result-panel hidden" id="qcm-result"></div>
</div>`
}

// ---------- RUNTIME JS embarqué ----------
const RUNTIME_JS = `
(function(){
  var root=document.querySelector('.ex-wrap');
  if(!root)return;

  function progressHTML(ok,total,label){
    var pct=total?Math.round(ok/total*100):0;
    var cls=pct===100?'progress-fill perfect':'progress-fill';
    return '<div class="progress-wrap"><div class="progress"><div class="'+cls+'" style="width:'+pct+'%"></div></div></div>';
  }

  // Hide all exercise sections, show homepage
  var sections = root.querySelectorAll('.exercise-section');
  var homepage = root.querySelector('.homepage');
  sections.forEach(function(section){ section.classList.add('hidden'); });
  if(homepage) homepage.classList.remove('hidden');

  // Handle clicks on exercise cards (homepage)
  root.addEventListener('click', function(e){
    var link = e.target.closest('a[href^="#"]');
    if(link && link.getAttribute('href').startsWith('#') && link.getAttribute('href').length > 1){
      e.preventDefault();
      var targetId = link.getAttribute('href').substring(1);
      var targetSection = document.getElementById(targetId);
      if(targetSection){
        // Hide homepage, show target section
        if(homepage) homepage.classList.add('hidden');
        sections.forEach(function(section){ section.classList.add('hidden'); });
        targetSection.classList.remove('hidden');
      }
    }
  });

  // Handle back to home buttons
  root.addEventListener('click', function(e){
    if(e.target.matches('[data-action="back-to-home"]')){
      e.preventDefault();
      sections.forEach(function(section){ section.classList.add('hidden'); });
      if(homepage) homepage.classList.remove('hidden');
    }
  });

  // ---- Appariement ----
  function initMatching(){
    Array.prototype.forEach.call(root.querySelectorAll('.match-block'),function(block){
      var selL=null;
      block.addEventListener('click',function(e){
        var item=e.target.closest('.match-item');
        if(!item)return;
        if(item.classList.contains('done'))return;
        if(item.classList.contains('side-l')){
          if(selL)selL.classList.remove('sel');
          selL=(selL===item)?null:item;
          if(selL)selL.classList.add('sel');
        }else{
          if(!selL){return}
          if(selL.getAttribute('data-id')===item.getAttribute('data-id')){
            selL.classList.remove('sel');selL.classList.add('done');
            item.classList.add('done');selL=null;
            var fb=block.querySelector('.match-feedback');
            if(fb){fb.textContent='Bien vu !';fb.style.color='#16a34a'}
          }else{
            item.classList.add('err');
            var t=block.querySelector('.match-feedback');
            if(t){t.textContent='Essaie encore.';t.style.color='#dc2626'}
            setTimeout(function(){item.classList.remove('err')},300);
          }
        }
      });
    });
  }

  // ---- Flashcards ----
  function initFlash(){
    Array.prototype.forEach.call(root.querySelectorAll('.flash'),function(card){
      function flip(){card.classList.toggle('open')}
      var fc=card.querySelector('.flash-card');
      fc.addEventListener('click',flip);
      fc.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();flip()}});
      var btns=card.querySelectorAll('.flash-status button');
      Array.prototype.forEach.call(btns,function(btn){
        btn.addEventListener('click',function(){
          Array.prototype.forEach.call(btns,function(b){b.classList.remove('sel',b.classList.contains('s-known')?'sel-known':'',b.classList.contains('s-mid')?'sel-mid':'',b.classList.contains('s-again')?'sel-again':'')});
          var s=btn.getAttribute('data-s');
          btn.classList.add('sel');
          if(s==='known')btn.classList.add('sel-known');
          if(s==='mid')btn.classList.add('sel-mid');
          if(s==='again')btn.classList.add('sel-again');
          updateFlashResult();
        });
      });
    });
    function updateFlashResult(){
      var known=root.querySelectorAll('.flash-status .s-known.sel').length;
      var again=root.querySelectorAll('.flash-status .s-again.sel').length;
      var total=root.querySelectorAll('.flash').length;
      var r=document.getElementById('flash-result');
      if(r){
        r.innerHTML='<strong>'+known+'</strong> maîtrisé(s) · <strong>'+again+'</strong> à revoir / '+total+progressHTML(known,total);
        r.style.display=(root.querySelectorAll('.flash-status .sel').length>0)?'block':'none';
      }
    }
  }

  // ---- Reset functions ----
  function resetMatching(){
    Array.prototype.forEach.call(root.querySelectorAll('.match-block'),function(block){
      block.querySelectorAll('.match-item').forEach(function(item){
        item.classList.remove('sel','done','err');
      });
      var fb=block.querySelector('.match-feedback');
      if(fb){fb.textContent='';fb.style.color=''}
    });
  }
  function resetFlash(){
    Array.prototype.forEach.call(root.querySelectorAll('.flash'),function(card){
      card.classList.remove('open');
      card.querySelectorAll('.flash-status button').forEach(function(b){
        b.classList.remove('sel','sel-known','sel-mid','sel-again');
      });
    });
    var r=document.getElementById('flash-result');
    if(r){r.innerHTML='';r.style.display='none'}
  }
  function resetCloze(){
    Array.prototype.forEach.call(root.querySelectorAll('.cloze-block'),function(block){
      block.querySelectorAll('.cloze-gap').forEach(function(g){
        g.textContent='_';
        g.classList.remove('filled','ok','err');
      });
      block.querySelectorAll('.cloze-word').forEach(function(c){
        c.classList.remove('used');
      });
      var res=block.querySelector('#cloze-result');
      if(res){res.classList.add('hidden');res.innerHTML=''}
    });
  }
  function resetQcm(){
    Array.prototype.forEach.call(root.querySelectorAll('.qcm-block'),function(block){
      block.querySelectorAll('.qcm-opt').forEach(function(o){
        o.classList.remove('sel','ok','err');
      });
      var res=block.querySelector('#qcm-result');
      if(res){res.classList.add('hidden');res.innerHTML=''}
    });
  }

  // ---- Zones (carte image + frise) : glisser-déposer ET clic ----
  function bindZoneBlock(block){
    var bank=block.querySelector('.drop-bank');
    if(!bank)return;
    var chips=Array.prototype.slice.call(bank.querySelectorAll('.drop-chip'));
    var zones=Array.prototype.slice.call(block.querySelectorAll('.zone'));
    if(!zones.length)return;
    var selected=null;
    var usedBy={}; // label -> chip (le chip est placé)
    function selectChip(chip){
      chips.forEach(function(c){c.classList.remove('sel')});
      selected=chip;
      chip.classList.add('sel');
    }
    function placeOnZone(zone,label){
      var normalizedLabel=normalizeKey(label);
      // retire un chip éventuellement déjà placé dans cette zone
      if(zone.getAttribute('data-placed')){
        var old=zone.getAttribute('data-placed');
        if(usedBy[old]){usedBy[old].classList.remove('used');usedBy[old].removeAttribute('data-zone');}
        zone.removeAttribute('data-placed');
        zone.classList.remove('placed');
        updateUsed(block);
      }
      // marque le chip comme placé
      var chip=usedBy[label];
      if(chip){ // même chip retiré puis re-placé
        chip.classList.add('used');
      } else {
        chip=chips.find(function(c){return normalizeKey(c.getAttribute('data-label'))===normalizedLabel});
        if(chip){chip.classList.add('used');chip.classList.remove('sel');}
      }
      if(chip)usedBy[label]=chip;
      zone.setAttribute('data-placed',label);
      zone.classList.add('placed');
      zone.classList.remove('good','bad');
      var lbl=zone.querySelector('.zplaced');
      if(!lbl){lbl=document.createElement('div');lbl.className='zplaced';zone.appendChild(lbl);}
      lbl.textContent=label;
      if(chip&&selected===chip)selected=null;
      updateUsed(block);
      updateSel(zone);
    }
    function updateUsed(block){
      var used=block.querySelectorAll('.drop-chip.used').length;
      block.querySelectorAll('.drop-chip').forEach(function(c){
        c.classList.toggle('all',used===chips.length);
      });
    }
    function updateSel(){
      if(selected){
        var zi=zones.findIndex(function(z){return !z.getAttribute('data-placed')});
        if(zi<0){selected=null;chips.forEach(function(c){c.classList.remove('sel')});}
      }
    }
    // Drag universel (souris + tactile) par Pointer Events, en complément du clic
    var drag=null;
    function positionGhost(e){
      drag.ghost.style.left=(e.clientX+8)+'px';
      drag.ghost.style.top=(e.clientY+8)+'px';
    }
    function endDrag(e,pointerId){
      if(!drag||drag.pId!==pointerId)return;
      var ghost=drag.ghost;
      if(ghost&&ghost.parentNode)ghost.parentNode.removeChild(ghost);
      if(ghost&&drag.moved){
        var el=document.elementFromPoint(e.clientX,e.clientY);
        var zone=el?el.closest('.zone'):null;
        if(zone)placeOnZone(zone,drag.label);
      }
      drag=null;
    }
    document.addEventListener('pointermove',function(e){
      if(!drag||drag.pId!==e.pointerId)return;
      var dx=e.clientX-drag.sx, dy=e.clientY-drag.sy;
      if(!drag.moved&&Math.hypot(dx,dy)>6){
        drag.moved=true;
        drag.ghost.appendChild(document.createTextNode(drag.label));
        drag.ghost.classList.add('ghost');
        document.body.appendChild(drag.ghost);
      }
      if(drag.moved)positionGhost(e);
    });
    document.addEventListener('pointerup',function(e){endDrag(e,e.pointerId)});
    document.addEventListener('pointercancel',function(e){endDrag(e,e.pointerId)});
    zones.forEach(function(zone){
      zone.addEventListener('click',function(e){
        var placed=zone.getAttribute('data-placed');
        if(selected){ // une étiquette est sélectionnée → la placer (remplace si occupée)
          placeOnZone(zone,selected.getAttribute('data-label'));
          return;
        }
        if(placed){ // pas de sélection : clic sur une zone occupée retire l'étiquette
          if(usedBy[placed]){usedBy[placed].classList.remove('used');usedBy[placed].removeAttribute('data-zone');}
          delete usedBy[placed];
          zone.removeAttribute('data-placed');
          zone.classList.remove('placed','good','bad');
          var lbl=zone.querySelector('.zplaced');
          if(lbl)lbl.remove();
          updateUsed(block);
        }
      });
      if(zone.getAttribute('data-label'))zone.classList.add('haslabel');
    });
    chips.forEach(function(chip){
      chip.addEventListener('pointerdown',function(e){
        e.preventDefault();
        if(chip.classList.contains('used'))return;
        selectChip(chip);
        drag={
          pId:e.pointerId,
          chip:chip,
          label:chip.getAttribute('data-label'),
          sx:e.clientX,
          sy:e.clientY,
          moved:false,
          ghost:document.createElement('div')
        };
      });
    });
    // Recommencer : vide tous les placements, réactive toutes les étiquettes
    function reset(){
      selected=null;
      usedBy={};
      zones.forEach(function(zone){
        zone.removeAttribute('data-placed');
        zone.classList.remove('placed','good','bad');
        var lbl=zone.querySelector('.zplaced');
        if(lbl)lbl.remove();
      });
      chips.forEach(function(chip){
        chip.classList.remove('used','sel');
        chip.removeAttribute('data-zone');
      });
      Array.prototype.forEach.call(block.querySelectorAll('.drop-chip.all'),function(chip){
        chip.classList.remove('all');
      });
      var rp=block.querySelector('.result-panel');
      if(rp)rp.classList.add('hidden');
    }
    return { reset: reset };
  }
  function initZones(block){
    var api=bindZoneBlock(block);
    var stage=block.querySelector('.map-stage')||block.querySelector('.tl-stage');
    if(stage)bindZoom(stage);
    var rb=block.querySelector('[data-action="reset-map"]')||block.querySelector('[data-action="reset-tl"]');
    if(rb&&api)rb.addEventListener('click',api.reset);
  }

  // ---- Zoom tactile (pincer) + pan sur la carte/frise ----
  function bindZoom(stage){
    if(stage.__zb)return;
    stage.__zb=true;
    var pts={},state={scale:1,tx:0,ty:0};
    var baseScale=1,lastDist=1;
    stage.style.transformOrigin='center center';
    function apply(){
      var t='translate('+state.tx+'px,'+state.ty+'px) scale('+state.scale+')';
      stage.style.transform=t;
      stage.setAttribute('data-zoom',state.scale>1.01?'1':'0');
    }
    function ptsList(){return Object.keys(pts).map(function(k){return pts[k]})}
    stage.addEventListener('pointerdown',function(e){
      if(e.pointerType!=='touch')return;
      pts[e.pointerId]={x:e.clientX,y:e.clientY};
      if(Object.keys(pts).length===2){
        var a=ptsList();
        baseScale=state.scale;
        lastDist=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)||1;
        try{stage.setPointerCapture(e.pointerId)}catch(err){}
      }
    });
    stage.addEventListener('pointermove',function(e){
      if(!pts[e.pointerId])return;
      var dx=e.clientX-pts[e.pointerId].x, dy=e.clientY-pts[e.pointerId].y;
      pts[e.pointerId]={x:e.clientX,y:e.clientY};
      var a=ptsList();
      if(a.length===2){
        var dist=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)||1;
        state.scale=Math.max(1,Math.min(5,baseScale*dist/lastDist));
        apply();
      } else if(a.length===1&&state.scale>1&&draggingNothing()){
        state.tx+=dx;state.ty+=dy;
        if(state.tx>stage.offsetWidth)state.tx=stage.offsetWidth;
        if(state.tx<-stage.offsetWidth)state.tx=-stage.offsetWidth;
        if(state.ty>stage.offsetHeight)state.ty=stage.offsetHeight;
        if(state.ty<-stage.offsetHeight)state.ty=-stage.offsetHeight;
        apply();
      }
    });
    function draggingNothing(){return true}
    function up(e){delete pts[e.pointerId]}
    stage.addEventListener('pointerup',up);
    stage.addEventListener('pointercancel',up);
    stage.addEventListener('dblclick',function(){state.scale=1;state.tx=0;state.ty=0;apply();});
  }

  // ---- Carte image (zones) ----
  function initMap(){
    Array.prototype.forEach.call(root.querySelectorAll('.map-block'),function(block){
      if(block.querySelector('.drop-bank')){initZones(block);return}
      var stage=block.querySelector('.map-stage');
      if(stage.getAttribute('data-mode')!=='image')return;
    });
    checkMap();
  }

  // ---- Frise (zones) ----
  function initTimeline(){
    Array.prototype.forEach.call(root.querySelectorAll('.tl-block'),function(block){
      if(block.querySelector('.drop-bank')){initZones(block);return}
    });
    checkTl();
  }

  // ---- Texte à trous ----
  function shuffle(arr){for(var i=arr.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=arr[i];arr[i]=arr[j];arr[j]=t}return arr}
  function initCloze(){
    Array.prototype.forEach.call(root.querySelectorAll('.cloze-block'),function(block){
      var bank=block.querySelector('.cloze-bank');
      var gaps=Array.prototype.slice.call(block.querySelectorAll('.cloze-gap'));
      var answers=gaps.map(function(g){return g.getAttribute('data-word')});
      var words=answers.slice();
      var distractors=block.getAttribute('data-distractors')?block.getAttribute('data-distractors').split('|'):[];
      var bankWords=shuffle(words.concat(distractors));
      bank.innerHTML='';
      var selectedWord=null;
      var selectedChip=null;
      function clearSelection(){
        if(selectedChip){selectedChip.classList.remove('selected')}
        selectedWord=null;
        selectedChip=null;
      }
      bankWords.forEach(function(w){
        if(!w)return;
        var c=document.createElement('span');
        c.className='cloze-word';
        c.textContent=w;
        c.addEventListener('click',function(){
          if(c.classList.contains('used'))return;
          if(selectedChip===c){clearSelection();return}
          clearSelection();
          selectedWord=w;
          selectedChip=c;
          c.classList.add('selected');
        });
        bank.appendChild(c);
      });
      gaps.forEach(function(g){
        g.addEventListener('click',function(){
          if(g.classList.contains('filled')){
            var w=g.textContent;
            g.textContent='_';
            g.classList.remove('filled');
            var chip=Array.prototype.find.call(bank.querySelectorAll('.cloze-word'),function(x){return x.textContent===w&&x.classList.contains('used')});
            if(chip)chip.classList.remove('used');
            return;
          }
          if(!selectedWord)return;
          g.textContent=selectedWord;
          g.classList.add('filled');
          selectedChip.classList.add('used');
          clearSelection();
        });
      });
    });
    checkCloze();
  }

  // ---- QCM ----
  function initQcm(){
    Array.prototype.forEach.call(root.querySelectorAll('.qcm-block'),function(block){
      Array.prototype.forEach.call(block.querySelectorAll('.qcm-q'),function(q){
        Array.prototype.forEach.call(q.querySelectorAll('.qcm-opt'),function(opt){
          opt.addEventListener('click',function(){
            Array.prototype.forEach.call(q.querySelectorAll('.qcm-opt'),function(o){o.classList.remove('sel')});
            opt.classList.add('sel');
          });
        });
      });
    });
    checkQcm();
  }

  // ---- Vérification carte image (zones ou marqueurs) ----
  function checkMap(){
    Array.prototype.forEach.call(root.querySelectorAll('.map-block'),function(block){
      var btn=block.querySelector('[data-action="check-map"]');
      if(!btn)return;
      var res=block.querySelector('#map-result');
      btn.addEventListener('click',function(){
        if(block.querySelector('.drop-bank')){
          var zones=Array.prototype.slice.call(block.querySelectorAll('.zone'));
          var total=zones.filter(function(z){return z.getAttribute('data-label')}).length;
          var ok=0;
          zones.forEach(function(z){
            var expected=z.getAttribute('data-label');
            if(!expected)return;
            var placed=z.getAttribute('data-placed');
            var good=placed&&normalizeKey(placed)===normalizeKey(expected);
            z.classList.toggle('good',good);
            z.classList.toggle('bad',!!placed&&!good);
            if(good)ok++;
          });
          res.classList.remove('hidden');
          res.innerHTML='<strong>'+ok+'</strong> / '+total+' bien placé(s)'+progressHTML(ok,total);
          return;
        }
        var marks=Array.prototype.slice.call(block.querySelectorAll('.map-mark'));
        var ok=marks.filter(function(m){return m.getAttribute('data-ok')==='1'}).length;
        var total=marks.length;
          res.classList.remove('hidden');
          res.innerHTML='<strong>'+ok+'</strong> / '+total+' bien placé(s)'+progressHTML(ok,total);
      });
    });
  }

  // ---- Vérification frise (zones ou axe++) ----
  function checkTl(){
    Array.prototype.forEach.call(root.querySelectorAll('.tl-block'),function(block){
      var btn=block.querySelector('[data-action="check-tl"]');
      if(!btn)return;
      var res=block.querySelector('#tl-result');
      btn.addEventListener('click',function(){
        if(block.querySelector('.drop-bank')){
          var zones=Array.prototype.slice.call(block.querySelectorAll('.zone'));
          var total=zones.filter(function(z){return z.getAttribute('data-label')}).length;
          var ok=0;
          zones.forEach(function(z){
            var expected=z.getAttribute('data-label');
            if(!expected)return;
            var placed=z.getAttribute('data-placed');
            var good=placed&&normalizeKey(placed)===normalizeKey(expected);
            z.classList.toggle('good',good);
            z.classList.toggle('bad',!!placed&&!good);
            if(good)ok++;
          });
          res.classList.remove('hidden');
          res.innerHTML='<strong>'+ok+'</strong> / '+total+' bien placé(s)'+progressHTML(ok,total);
          return;
        }
        var res2=block.querySelector('#tl-result');
        if(res2){res2.classList.remove('hidden');res2.innerHTML='<strong>0</strong> / 0 placé(s)'+progressHTML(0,0);}
      });
    });
  }

  // ---- Vérification texte à trous ----
  function checkCloze(){
    Array.prototype.forEach.call(root.querySelectorAll('.cloze-block'),function(block){
      var btn=block.querySelector('[data-action="check-cloze"]');
      if(!btn)return;
      btn.addEventListener('click',function(){
        var gaps=Array.prototype.slice.call(block.querySelectorAll('.cloze-gap'));
        var ok=0;
        gaps.forEach(function(g){
          if(!g.classList.contains('filled')){g.classList.add('err');return}
          var correct=normalizeKey(g.getAttribute('data-word'));
          var val=normalizeKey(g.textContent);
          if(val===correct){g.classList.add('ok');g.classList.remove('err');ok++}
          else{g.classList.add('err');g.classList.remove('ok')}
        });
        var res=block.querySelector('#cloze-result');
        res.classList.remove('hidden');
        res.innerHTML='<strong>'+ok+'</strong> / '+gaps.length+' correct(s)'+progressHTML(ok,gaps.length);
      });
    });
  }

  // ---- Vérification QCM ----
  function checkQcm(){
    Array.prototype.forEach.call(root.querySelectorAll('.qcm-block'),function(block){
      var btn=block.querySelector('[data-action="check-qcm"]');
      if(!btn)return;
      btn.addEventListener('click',function(){
        var qs=Array.prototype.slice.call(block.querySelectorAll('.qcm-q'));
        var ok=0;
        qs.forEach(function(q){
          var correct=parseInt(q.getAttribute('data-correct'),10);
          var sel=q.querySelector('.qcm-opt.sel');
          Array.prototype.forEach.call(q.querySelectorAll('.qcm-opt'),function(o){
            var oi=parseInt(o.getAttribute('data-oi'),10);
            if(oi===correct){o.classList.add('ok')}
            else if(o===sel){o.classList.add('err')}
          });
          if(sel&&parseInt(sel.getAttribute('data-oi'),10)===correct)ok++;
        });
        var res=block.querySelector('#qcm-result');
        res.classList.remove('hidden');
        res.innerHTML='<strong>'+ok+'</strong> / '+qs.length+' bonne(s) réponse(s)'+progressHTML(ok,qs.length);
      });
    });
  }

  function normalizeKey(s){return String(s).toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').trim()}

  initMatching();
  initFlash();
  initMap();
  initTimeline();
  initCloze();
  initQcm();

  // Reset buttons
  root.querySelectorAll('[data-action="reset-match"]').forEach(function(btn){
    btn.addEventListener('click', resetMatching);
  });
  root.querySelectorAll('[data-action="reset-flash"]').forEach(function(btn){
    btn.addEventListener('click', resetFlash);
  });
  root.querySelectorAll('[data-action="reset-cloze"]').forEach(function(btn){
    btn.addEventListener('click', resetCloze);
  });
  root.querySelectorAll('[data-action="reset-qcm"]').forEach(function(btn){
    btn.addEventListener('click', resetQcm);
  });
})();
`

// ---------- Assemblage final ----------
export function buildExerciseHtml(m) {
  // Pas de copie : la fonction ne modifie jamais l'exercice reçu.
  
  // Grouper les exercices par type
  const exercisesByKind = {
    matching: [],
    flashcards: [],
    map: [],
    timeline: [],
    cloze: [],
    qcm: []
  }
  
  if (m.pairs.length) exercisesByKind.matching.push({ index: 0, label: 'Appariement' })
  if (m.cards.length) exercisesByKind.flashcards.push({ index: 0, label: 'Flashcards' })
  m.maps.forEach((map, i) => {
    if (map.zones.length) exercisesByKind.map.push({ index: i, label: m.maps.length > 1 ? `Repérage ${i + 1}` : 'Repérage' })
  })
  m.timelines.forEach((tl, i) => {
    if ((tl.zones?.length || 0) > 0)
      exercisesByKind.timeline.push({ index: i, label: tl.title || 'Frise chronologique' })
  })
  m.clozes.forEach((cz, i) => {
    if (closureWords(cz.text).length) exercisesByKind.cloze.push({ index: i, label: cz.title || 'Texte à trous' })
  })
  m.qcms.forEach((q, i) => {
    if ((q.questions || []).length) exercisesByKind.qcm.push({ index: i, label: q.title || 'QCM - document' })
  })
  
  // Filtrer pour ne garder que les types qui ont des exercices
  const activeKinds = Object.keys(exercisesByKind).filter(kind => exercisesByKind[kind].length > 0)
  
  // Générer le contenu de la page d'accueil
  const homepage = activeKinds.length > 0 ? `
  <div class="homepage">
    <div class="home-head">
      <h1>${esc(m.title || 'Exercice de révision')}</h1>
      <div class="home-sub">Choisissez un exercice pour commencer</div>
    </div>
    <div class="exercises-grid">
      ${activeKinds.map(kind => `
        <a href="#${kind}-section" class="exercise-card">
          <div class="card-icon">${getExerciseEmoji(kind)}</div>
          <div class="card-label">${exercisesByKind[kind][0].label}</div>
          <div class="card-count">${exercisesByKind[kind].length} ${exercisesByKind[kind].length > 1 ? 'exercices' : 'exercice'}</div>
        </a>
      `).join('')}
    </div>
  </div>` : ''
  
  // Générer les sections d'exercices
  const exerciseSections = activeKinds.map(kind => `
  <section id="${kind}-section" class="exercise-section">
    <div class="ex-wrap">
      <div class="ex-head">
        <h1 class="ex-title">${exercisesByKind[kind][0].label}</h1>
        <button class="ghost" data-action="back-to-home">← Retour à l'accueil</button>
      </div>
      ${exercisesByKind[kind].map((ex, idx) => renderBlock(m, {kind, index: ex.index})).join('')}
    </div>
  </section>`).join('')
  
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${esc(m.title || 'Exercice de révision')}</title>
<script data-goatcounter="https://mbarth.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
<style>${RUNTIME_CSS}</style>
</head>
<body>
<div class="ex-wrap">
  ${homepage}
  ${exerciseSections}
</div>
<script>${RUNTIME_JS}</script>
</body>
</html>`
}

export function buildObjectifsHtml(obj) {
  return objectifsHTML(obj)
}
