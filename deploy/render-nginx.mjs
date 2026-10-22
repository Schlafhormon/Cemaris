// Build-time URL prefix: the same input as Vite and the Python auth settings.
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Synced with AuthSettings and Vite by public-path tests.
export const RESERVED_PREFIX_SEGMENTS = new Set([
  'admin', 'api', 'assets', 'branding', 'burialsites', 'cemeteries', 'contracts',
  'dashboard', 'funeralhomes', 'healthz', 'index.html', 'licenses', 'locales',
  'login', 'print', 'public-internal', 'reports', 'robots.txt', 'src',
  'third-party-notices.txt', 'third_party_notices.md', 'workorders',
])

export function normalizePrefix(value = '') {
  const prefix = value.replace(/\/+$/, '')
  if (prefix && (!/^\/(?:[A-Za-z0-9_.-]+)(?:\/[A-Za-z0-9_.-]+)*$/.test(prefix)
      || prefix.split('/').some(segment => segment === '.' || segment === '..'))) {
    throw new Error('CEMARIS_URL_PREFIX must be empty or an absolute ASCII path without dot segments')
  }
  if (prefix && RESERVED_PREFIX_SEGMENTS.has(prefix.split('/')[1].toLowerCase())) {
    throw new Error('CEMARIS_URL_PREFIX starts with a reserved application route or asset segment')
  }
  return prefix
}

export function renderNginx(source, value = '', trustedProxy) {
  const prefix = normalizePrefix(value)
  const escaped = prefix.replaceAll('.', '\\.')
  const prefixRules = prefix ? `
    # Keep the configured application below its public prefix. The original
    # request URI also survives internal SPA and API rewrites.
    if ($request_uri !~ "^(/healthz(?:[?]|$)|${escaped}(?:/|[?]|$))") { return 404; }
    location = ${prefix} { return 308 ${prefix}/$is_args$args; }
    rewrite ^${escaped}(/.*)$ $1 last;
` : ''
  let output = source.replace('    # CEMARIS_PREFIX_RULES', prefixRules)
  if (trustedProxy !== undefined) {
    if (!/^[0-9a-fA-F:.]+(?:\/[0-9]{1,3})?$/.test(trustedProxy)) throw new Error('Expected a proxy IP address or CIDR')
    output = output.replaceAll('${CEMARIS_TRUSTED_PROXY_CIDR}', trustedProxy)
  }
  return output
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [source, destination, prefix = '', trustedProxy] = process.argv.slice(2)
  if (!source || !destination) throw new Error('Usage: render-nginx.mjs SOURCE DESTINATION [PREFIX] [TRUSTED_PROXY_CIDR]')
  await fs.writeFile(destination, renderNginx(await fs.readFile(source, 'utf8'), prefix, trustedProxy), 'utf8')
}
