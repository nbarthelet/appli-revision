// Utilitaires de chargement / redimensionnement d'images (côté éditeur).

export function readImageFile(file, maxWidth = 1600) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Lecture du fichier impossible.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Image illisible ou non supportée.'))
      img.onload = () => {
        try {
          const scale = Math.min(1, maxWidth / img.width)
          const w = Math.max(1, Math.round(img.width * scale))
          const h = Math.max(1, Math.round(img.height * scale))
          const canvas = document.createElement('canvas')
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext('2d')
          if (!ctx) reject(new Error('Canvas indisponible dans ce navigateur.'))
          ctx.drawImage(img, 0, 0, w, h)
          const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
          resolve({
            dataUrl: canvas.toDataURL(mime, 0.85),
            width: w,
            height: h,
            name: file.name,
          })
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)))
        }
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}
