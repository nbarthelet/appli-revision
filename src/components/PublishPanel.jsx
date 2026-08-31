import { useEffect, useMemo, useState } from 'react'
import { slugify } from '../lib/model.js'
import { getSettings, saveSettings, testConnection, publishFile } from '../lib/github.js'
import { buildExerciseHtml } from '../lib/export.js'

export default function PublishPanel({ ex }) {
  const [settings, setSettings] = useState(getSettings)
  const [liveOwner, setLiveOwner] = useState('')
  const [folder, setFolder] = useState('')
  const [slug, setSlug] = useState('revision')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [tested, setTested] = useState(false)
  const [publishedUrl, setPublishedUrl] = useState('')

  const html = useMemo(() => {
    try {
      return buildExerciseHtml(ex)
    } catch (e) {
      console.error(e)
      return ''
    }
  }, [ex])

  useEffect(() => {
    setSlug(slugify(ex.title || 'revision'))
  }, [ex.title])

  // Dérive le login à partir du dépôt <user>.github.io ou du user tapé
  const owner = liveOwner.trim() || deriveOwner(settings.repo)
  const repo = normalizeRepo(settings.repo, owner)

  function deriveOwner(repoStr) {
    if (!repoStr) return ''
    const clean = repoStr.trim().replace(/\.git$/, '').split('/').pop()
    if (/\.github\.io$/.test(clean)) return clean.replace(/\.github\.io$/, '')
    return ''
  }
  function normalizeRepo(repoStr, o) {
    if (!repoStr) return ''
    const clean = repoStr.trim().replace(/\.git$/, '')
    if (clean.includes('/')) {
      const parts = clean.split('/')
      return parts[parts.length - 1]
    }
    return clean
  }

  const path = joinPath(folder, `${slug}.html`)
  function joinPath(f, s) {
    const parts = [f, s].filter(Boolean).map((p) => p.replace(/^\/+|\/+$/g, ''))
    return parts.join('/')
  }

  const onSave = () => {
    saveSettings({ ...settings })
    setStatus('Paramètres enregistrés dans ce navigateur.')
  }

  const onTest = async () => {
    setBusy(true)
    setStatus('')
    try {
      await testConnection({ settings, owner, repo })
      setTested(true)
      setStatus(`Connexion établie avec ${repo}. Prêt à publier.`)
    } catch (e) {
      setTested(false)
      setStatus(`Échec : ${e.message}`)
    } finally {
      setBusy(false)
    }
  }

  const onPublish = async () => {
    if (!html) {
      setStatus('Veuillez d’abord créer un exercice.')
      return
    }
    setBusy(true)
    setStatus('')
    try {
      await publishFile({
        settings,
        owner,
        repo,
        branch: settings.branch || 'main',
        path,
        content: html,
        message: `Révision : ${ex.title}`,
      })
      const url = `https://${owner}.github.io/${repo}/${path}`
      setPublishedUrl(url)
      setStatus(`Publiée avec succès !`)
    } catch (e) {
      setStatus(`Échec : ${e.message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="notice">
        <strong>Comment ça marche :</strong> vous choisissez le dossier (par exemple
        <span className="mono"> seconde/histoire/chapitre-1</span>), l’application envoie le
        fichier HTML vers votre dépôt GitHub et vous donne le lien public à coller dans le
        Digipad. Le jeton est stocké uniquement dans votre navigateur et restreint au seul
        dépôt de révisions.
      </div>

      <div className="card">
        <h2>1. Connexion GitHub (une seule fois)</h2>
        <label className="field">
          <span>Jeton (fine-grained) — collé ici</span>
          <input
            type="password"
            placeholder="github_pat_…"
            value={settings.token}
            onChange={(e) => setSettings({ ...settings, token: e.target.value })}
          />
        </label>
        <label className="field">
          <span>Dépôt de révisions</span>
          <input
            type="text"
            placeholder="revision-hg  (ou votre-compte.github.io)"
            value={settings.repo}
            onChange={(e) => setSettings({ ...settings, repo: e.target.value })}
          />
        </label>
        <div className="row">
          <label className="field" style={{ flex: '0 0 240px' }}>
            <span>Propriétaire (si besoin)</span>
            <input
              type="text"
              placeholder="nbarthelet"
              value={liveOwner}
              onChange={(e) => setLiveOwner(e.target.value)}
            />
          </label>
          <label className="field" style={{ flex: '0 0 140px' }}>
            <span>Branche</span>
            <input
              type="text"
              value={settings.branch}
              onChange={(e) => setSettings({ ...settings, branch: e.target.value })}
            />
          </label>
        </div>
        <div className="row">
          <button className="btn ghost" onClick={onSave} disabled={busy}>Enregistrer</button>
          <button className="btn ghost" onClick={onTest} disabled={busy || !settings.token || !repo}>
            {busy ? '…' : 'Tester la connexion'}
          </button>
        </div>
        {tested && <p className="ok">Connexion vérifiée.</p>}
      </div>

      <div className="card">
        <h2>2. Emplacement du fichier</h2>
        <div className="row">
          <label className="field" style={{ flex: '1 1 100%' }}>
            <span>Dossier (par niveau / matière)</span>
            <input
              type="text"
              placeholder="seconde/histoire/chapitre-1"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
            />
          </label>
        </div>
        <div className="mono" style={{ margin: '8px 0' }}>
          Chemin : {owner ? `${owner}/${repo}/` : '<propriétaire>/<dépôt>/'}
          {path || 'second/histoire/…/revision.html'}
        </div>
      </div>

      <div className="card">
        <h2>3. Publier</h2>
        <p className="hint">
          Le fichier <span className="mono">{path || slug + '.html'}</span> sera créé ou
          mis à jour dans {owner ? `${owner}/${repo}` : 'votre dépôt'}.
        </p>
        <button
          className="btn"
          disabled={busy || !settings.token || !owner || !repo}
          onClick={onPublish}
        >
          {busy ? 'Publication en cours…' : 'Publier sur GitHub'}
        </button>
        {status && <p className={status.startsWith('Échec') ? 'err' : 'ok'}>{status}</p>}
        {publishedUrl && (
          <div style={{ marginTop: 12 }}>
            <strong>Lien à coller dans le Digipad :</strong>
            <div className="mono">{publishedUrl}</div>
            <div className="row" style={{ marginTop: 8 }}>
              <button
                className="btn small"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(publishedUrl)
                    setStatus('Lien copié dans le presse-papier.')
                  } catch {
                    setStatus('Copie impossible : sélectionnez le lien à la main.')
                  }
                }}
              >
                Copier le lien
              </button>
              <a className="btn small ghost" href={publishedUrl} target="_blank" rel="noreferrer">
                Ouvrir
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
