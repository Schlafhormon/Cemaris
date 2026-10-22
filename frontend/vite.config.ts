import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// Synced with AuthSettings and deploy/render-nginx.mjs by public-path tests.
export const RESERVED_PREFIX_SEGMENTS = new Set([
  'admin', 'api', 'assets', 'branding', 'burialsites', 'cemeteries', 'contracts',
  'dashboard', 'funeralhomes', 'healthz', 'index.html', 'licenses', 'locales',
  'login', 'print', 'public-internal', 'reports', 'robots.txt', 'src',
  'third-party-notices.txt', 'third_party_notices.md', 'workorders',
])

export function normalizePrefix(value = ''): string {
  const prefix = value.replace(/\/+$/, '')
  if (prefix && (!/^\/(?:[A-Za-z0-9._-]+)(?:\/[A-Za-z0-9._-]+)*$/.test(prefix) || prefix.split('/').some(part => part === '.' || part === '..'))) {
    throw new Error('CEMARIS_URL_PREFIX must contain absolute local path segments without dot segments')
  }
  if (prefix && RESERVED_PREFIX_SEGMENTS.has(prefix.split('/')[1].toLowerCase())) {
    throw new Error('CEMARIS_URL_PREFIX starts with a reserved application route or asset segment')
  }
  return prefix
}

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, '..', 'CEMARIS_'), ...process.env }
  const prefix = normalizePrefix(env.CEMARIS_URL_PREFIX || env.CEMARIS_AUTH_URL_PREFIX || '')
  const regexPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const proxy = { target: 'http://127.0.0.1:8000', rewrite: (path: string) => prefix ? path.slice(prefix.length) || '/' : path }
  return {
    base: `${prefix}/`,
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        [`${prefix}/api`]: proxy,
        [`${prefix}/print`]: proxy,
        [`^${regexPrefix}/reports/[^/?]+`]: proxy,
        [`^${regexPrefix}/contracts/do(?:GetContractDetailsForConsignoCloud|StartConsignoCloudWorkflow|GetDynamicsGPDocument)(?:\\?|$)`]: proxy,
        [`${prefix}/public-internal`]: proxy,
      },
    },
  }
})
