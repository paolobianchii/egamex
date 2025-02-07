import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/egamex/', // Aggiungi il nome del repository GitHub qui
  build: {
    outDir: 'dist', // Cartella di build
  },
  define: {
    'process.env': process.env, // Se hai bisogno di accedere a process.env per altre variabili globali
  },
  plugins: [react()],
})
