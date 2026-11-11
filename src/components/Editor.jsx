import { useState } from 'react'
import { closureWords } from '../lib/model.js'
import NotionsPanel from './NotionsPanel.jsx'
import MatchingPanel from './MatchingPanel.jsx'
import FlashcardsPanel from './FlashcardsPanel.jsx'
import MapPanel from './MapPanel.jsx'
import TimelinePanel from './TimelinePanel.jsx'
import ClozePanel from './ClozePanel.jsx'
import QcmPanel from './QcmPanel.jsx'
import ObjectifsPanel from './ObjectifsPanel.jsx'

const SECTIONS = [
  { id: 'general', label: 'Général', emoji: '⚙️' },
  { id: 'notions', label: 'Notions', emoji: '📚' },
  { id: 'qcm', label: 'QCM', emoji: '📝' },
  { id: 'appariements', label: 'Appariements', emoji: '🔗' },
  { id: 'flashcards', label: 'Flashcards', emoji: '🃏' },
  { id: 'reperage', label: 'Repérage', emoji: '📍' },
  { id: 'frise', label: 'Frise', emoji: '📅' },
  { id: 'trous', label: 'Texte à trous', emoji: '✏️' },
  { id: 'objectifs', label: 'Fiche objectifs', emoji: '📋' },
]

export default function Editor({ ex, patch, setEx }) {
  const [section, setSection] = useState('general')
  const setTitle = (title) => patch({ title })

  const counts = {
    notions: (ex.notions || []).length,
    qcm: (ex.qcms || []).reduce((n, q) => n + (q.questions || []).length, 0),
    appariements: (ex.pairs || []).length,
    flashcards: (ex.cards || []).length,
    reperage: (ex.maps || []).reduce((n, m) => n + (m.zones || []).length, 0),
    frise: (ex.timelines || []).reduce((n, t) => n + (t.zones || []).length, 0),
    trous: (ex.clozes || []).reduce((n, c) => n + closureWords(c.text || '').length, 0),
    objectifs: (ex.objectifs?.reperes?.length || 0) + (ex.objectifs?.explications?.length || 0) + Object.keys(ex.objectifs?.vocabulaire || {}).length,
  }

  return (
    <div>
      <div className="editor-tabs" role="tablist">
        {SECTIONS.map((s) => {
          const n = counts[s.id]
          return (
            <button
              key={s.id}
              role="tab"
              aria-selected={section === s.id}
              className={'editor-tab' + (section === s.id ? ' active' : '')}
              onClick={() => setSection(s.id)}
            >
              <span className="tab-emoji">{s.emoji}</span>
              {s.label}
              {typeof n === 'number' && n > 0 && <span className="editor-dot">{n}</span>}
            </button>
          )
        })}
      </div>

      {section === 'general' && (
        <div className="card">
          <h2>Général</h2>
          <label className="field">
            <span>Titre de l’exercice</span>
            <input type="text" value={ex.title} onChange={(e) => setTitle(e.target.value)} />
          </label>
        </div>
      )}
      {section === 'notions' && <NotionsPanel ex={ex} setEx={setEx} />}
      {section === 'qcm' && <QcmPanel ex={ex} setEx={setEx} />}
      {section === 'appariements' && <MatchingPanel ex={ex} setEx={setEx} />}
      {section === 'flashcards' && <FlashcardsPanel ex={ex} setEx={setEx} />}
      {section === 'reperage' && <MapPanel ex={ex} setEx={setEx} />}
      {section === 'frise' && <TimelinePanel ex={ex} setEx={setEx} />}
      {section === 'trous' && <ClozePanel ex={ex} setEx={setEx} />}
      {section === 'objectifs' && <ObjectifsPanel ex={ex} setEx={setEx} />}
    </div>
  )
}
