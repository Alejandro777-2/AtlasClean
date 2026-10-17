import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { asistenteVisita } from './server/asistenteVisita.js'

// https://vite.dev/config/
// - asistenteVisita: API local del Asistente de visita (IA) en /api/asistente-visita. Lee la clave del .env
//   solo en el servidor (loadEnv con prefijo ''); nunca llega al navegador.
// - proxy /api: el resto de rutas /api va al backend FastAPI (backend/main.py) en el puerto 8000.
//   El plugin atiende primero /api/asistente-visita; lo demás sigue al proxy.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), asistenteVisita(env)],
    server: {
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true
        }
      }
    }
  }
})
