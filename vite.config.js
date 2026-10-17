import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { asistenteVisita } from './server/asistenteVisita.js'

// https://vite.dev/config/
// loadEnv con prefijo '' lee el .env solo en el servidor local: la clave nunca llega al navegador
// (Vite solo expone al navegador las variables que empiezan con VITE_).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), asistenteVisita(env)],
  }
})
