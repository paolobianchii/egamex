import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',  // Usa percorsi relativi per evitare problemi su Netlify
  build: {
    outDir: 'dist',  // Assicura che Vite generi i file dentro dist/
  },
  define: {
    'process.env': process.env, // Se hai bisogno di accedere a process.env per altre variabili globali
  },
})
