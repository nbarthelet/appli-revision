import { useMemo } from 'react'

export default function PreviewPanel({ html, ex }) {
  const canPreview = useMemo(() => html && html.length > 100, [html])

  const openFull = () => {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  }

  return (
    <div className="card">
      <div className="space">
        <h2 style={{ margin: 0 }}>Aperçu avant export</h2>
        <div className="row">
          <button className="btn small" disabled={!canPreview} onClick={openFull}>
            Ouvrir en plein écran
          </button>
        </div>
      </div>
      <p className="hint">
        Voici le rendu exact que verront vos élèves (même fichier HTML que l’export et la
        publication). Testez l’interactivité : glissez ou cliquez les étiquettes, répondez,
        vérifiez. L’aperçu se met à jour automatiquement à chaque modification.
      </p>

      {canPreview ? (
        <iframe
          title="Aperçu"
          srcDoc={html}
          style={{
            width: '100%',
            height: '70vh',
            minHeight: 420,
            border: '1px solid var(--border)',
            borderRadius: 10,
            background: '#fff',
          }}
        />
      ) : (
        <p className="hint">Ajoutez du contenu (notions, appariement, etc.) pour voir un aperçu.</p>
      )}
    </div>
  )
}
