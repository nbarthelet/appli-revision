import { useRef } from 'react'
import { decodeCsvBuffer } from '../lib/csv.js'

// Bouton d'import CSV générique. Lit le fichier (UTF-8/UTF-16/CP850/Win-1252)
// et appelle onFile(texte, nomDuFichier).
export default function CsvImportButton({ onFile, label = 'Importer CSV', accept = '.csv,text/csv,text/plain', small = false }) {
  const ref = useRef(null)
  const handle = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onerror = () => alert('Lecture du fichier impossible.')
    reader.onload = () => {
      try {
        onFile(decodeCsvBuffer(reader.result), f.name)
      } catch (err) {
        alert('Lecture du fichier impossible : ' + (err?.message || err))
      }
    }
    reader.readAsArrayBuffer(f)
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
