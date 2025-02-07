import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: 'https://paolobianchii.github.io/egamex/', // Aggiungi il nome del repository GitHub qui
  build: {
    outDir: 'dist', // Cartella di build
  },
  plugins: [react()],
})
