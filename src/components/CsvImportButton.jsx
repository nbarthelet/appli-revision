import { useRef } from 'react'

// Bouton d'import CSV générique. Lit le fichier en texte et appelle onFile(text).
export default function CsvImportButton({ onFile, label = 'Importer CSV', accept = '.csv,text/csv,text/plain', small = false }) {
  const ref = useRef(null)
  const handle = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onerror = () => alert('Lecture du fichier impossible.')
    reader.onload = () => {
      onFile(String(reader.result || ''), f.name)
    }
    reader.readAsText(f, 'utf-8')
    e.target.value = ''
  }
  return (
    <>
      <button className={`btn ghost ${small ? 'small' : ''}`} onClick={() => ref.current?.click()} type="button">
        {label}
      </button>
      <input ref={ref} type="file" accept={accept} style={{ display: 'none' }} onChange={handle} />
    </>
  )
}
