import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'

const target = new URL('../dist/licenses/', import.meta.url)
await mkdir(target, { recursive: true })

const packages = ['react', 'react-dom', 'scheduler', 'leaflet']
const notices = ['Cemaris bundled frontend runtime dependencies', '']
for (const name of packages) {
  const source = new URL(`../node_modules/${name}/`, import.meta.url)
  const manifest = JSON.parse(await readFile(new URL('package.json', source), 'utf8'))
  await copyFile(new URL('LICENSE', source), new URL(`${name}-LICENSE.txt`, target))
  notices.push(`${name} ${manifest.version}: ${name}-LICENSE.txt`)
}
await writeFile(new URL('README.txt', target), `${notices.join('\n')}\n`, 'utf8')
console.log(`Copied ${packages.length} bundled runtime license notices to dist/licenses.`)
