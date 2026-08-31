import { useEffect, useMemo, useState } from 'react'
import { newExercise } from './lib/model.js'
import Editor from './components/Editor.jsx'
import PreviewPanel from './components/PreviewPanel.jsx'
import PublishPanel from './components/PublishPanel.jsx'
import { buildExerciseHtml } from './lib/export.js'
import { MASTER_PROMPT } from './lib/prompt.js'

const LS_KEY = 'hggsp-editor-exercise'

function loadSaved() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export default function App() {
  const [ex, setEx] = useState(() => loadSaved() || newExercise())
  const [tab, setTab] = useState('edit')
  const [copied, setCopied] = useState(false)

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(MASTER_PROMPT)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // fallback pour contextes sans API presse-papiers
      const ta = document.createElement('textarea')
      ta.value = MASTER_PROMPT
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    }
  }

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(ex))
    } catch {
      /* ignore quota */
    }
  }, [ex])

  const html = useMemo(() => {
    try {
      return buildExerciseHtml(ex)
    } catch {
      return ''
    }
  }, [ex])

  const patch = (p) => setEx((prev) => ({ ...prev, ...p }))

  return (
    <div className="app">
      <div className="app-top">
        <div>
          <h1>Appli de révision</h1>
          <div className="sub">
            Créez des exercices de révision et publiez-les sur GitHub Pages. Tout est
            enregistré automatiquement dans votre navigateur.
          </div>
        </div>
        <div className="row">
          <button className="btn ghost" onClick={copyPrompt} title="Copie le prompt à envoyer à un LLM pour générer notions/QCM/appariements">
            {copied ? 'Prompt copié ✓' : 'Copier le prompt'}
          </button>
          <button className="btn ghost" onClick={() => { if (confirm('Créer un nouvel exercice ?')) { setEx(newExercise()) } }}>
            Nouveau
          </button>
          <a className="btn ghost" download={`${(ex.title || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'exercice'}.html`} href={html ? `data:text/html;charset=utf-8,${encodeURIComponent(html)}` : '#'}>
            Télécharger le HTML
          </a>
        </div>
      </div>

      <div className="tabs">
        <button className={tab === 'edit' ? 'active' : ''} onClick={() => setTab('edit')}>
          Éditeur
        </button>
        <button className={tab === 'preview' ? 'active' : ''} onClick={() => setTab('preview')}>
          Aperçu
        </button>
        <button className={tab === 'publish' ? 'active' : ''} onClick={() => setTab('publish')}>
          Publier sur GitHub
        </button>
      </div>

      {tab === 'edit' ? (
        <Editor ex={ex} patch={patch} setEx={setEx} />
      ) : tab === 'preview' ? (
        <PreviewPanel html={html} ex={ex} />
      ) : (
        <PublishPanel ex={ex} html={html} />
      )}
    </div>
  )
}
