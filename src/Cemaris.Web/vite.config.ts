import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, '.', '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': environment.VITE_API_PROXY_TARGET ?? 'http://localhost:5050',
        '/health': environment.VITE_API_PROXY_TARGET ?? 'http://localhost:5050',
      },
    },
  }
})
