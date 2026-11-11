import { useEffect, useMemo, useRef, useState } from 'react'
import { newExercise } from './lib/model.js'
import Editor from './components/Editor.jsx'
import PreviewPanel from './components/PreviewPanel.jsx'
import PublishPanel from './components/PublishPanel.jsx'
import { buildExerciseHtml } from './lib/export.js'
import { MASTER_PROMPT } from './lib/prompt.js'

const LS_KEY = 'hggsp-editor-exercise'
const SAVE_DELAY = 600 // ms : évite de re-sérialiser l'exercice à chaque frappe
const PREVIEW_DELAY = 350 // ms : l'aperçu n'est recalculé qu'après une pause

function loadSaved() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function slugifyTitle(t) {
  return (
    String(t || '')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 60) || 'exercice'
  )
}

export default function App() {
  const [ex, setEx] = useState(() => loadSaved() || newExercise())
  const [tab, setTab] = useState('edit')
  const [copied, setCopied] = useState(false)
  const [saveError, setSaveError] = useState('')

  // ---------- Sauvegarde locale (différée) ----------
  const exRef = useRef(ex)
  exRef.current = ex

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(ex))
        setSaveError('')
      } catch {
        setSaveError(
          "Sauvegarde automatique impossible : le stockage du navigateur est plein. " +
            'Pense à télécharger ton exercise HTML avant de fermer.'
        )
      }
    }, SAVE_DELAY)
    return () => clearTimeout(t)
  }, [ex])

  // Sauvegarde immédiate à la fermeture de l'onglet
  useEffect(() => {
    const saveNow = () => {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(exRef.current))
      } catch {
        /* quota dépassé : rien à faire */
      }
    }
    window.addEventListener('beforeunload', saveNow)
    return () => window.removeEventListener('beforeunload', saveNow)
  }, [])

  // ---------- Aperçu : calculé seulement quand on en a besoin ----------
  const [previewEx, setPreviewEx] = useState(ex)
  useEffect(() => {
    const t = setTimeout(() => setPreviewEx(ex), PREVIEW_DELAY)
    return () => clearTimeout(t)
  }, [ex])

  const html = useMemo(() => {
    if (tab === 'edit') return '' // inutile de générer l'export pendant l'édition
    try {
      return buildExerciseHtml(previewEx)
    } catch (e) {
      console.error('Génération du HTML impossible :', e)
      return ''
    }
  }, [tab, previewEx])

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

  // ---------- Téléchargement : Blob (les URL data: cassent sur les gros fichiers) ----------
  const downloadHtml = () => {
    let content = html
    if (!content) {
      try {
        content = buildExerciseHtml(ex)
      } catch (e) {
        alert("Le HTML n'a pas pu être généré : " + (e?.message || e))
        return
      }
    }
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = slugifyTitle(ex.title) + '.html'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 4000)
  }

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
          {saveError && (
            <div
              style={{
                marginTop: 8,
                background: '#fff3cd',
                border: '1px solid #ffd97a',
                color: '#7a5200',
                padding: '8px 12px',
                borderRadius: 10,
                fontSize: '0.88rem',
              }}
            >
              {saveError}
            </div>
          )}
        </div>
        <div className="row">
          <button className="btn ghost" onClick={copyPrompt} title="Copie le prompt à envoyer à un LLM pour générer notions/QCM/appariements">
            {copied ? 'Prompt copié ✓' : 'Copier le prompt'}
          </button>
          <button className="btn ghost" onClick={() => { if (confirm('Créer un nouvel exercice ?')) { setEx(newExercise()) } }}>
            Nouveau
          </button>
          <button className="btn ghost" onClick={downloadHtml}>
            Télécharger le HTML
          </button>
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
