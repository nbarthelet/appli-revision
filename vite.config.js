import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base relative pour pouvoir héberger sur GitHub Pages dans un sous-dossier.
// Peut être écrasé par l'env var BASE_URL (ex: /atelier-hggsp/) en build.
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_URL || './',
})
