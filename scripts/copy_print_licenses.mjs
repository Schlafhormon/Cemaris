// Copy dependency notices without executing dependency install scripts.
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const runtime=fileURLToPath(new URL('../backend/printing-runtime/',import.meta.url))
const lock=JSON.parse(await fs.readFile(path.join(runtime,'package-lock.json'),'utf8'))
const output=path.join(runtime,'licenses')
await fs.mkdir(output,{recursive:true})
const entries=[]
for(const [key,info] of Object.entries(lock.packages)) {
  if(!key)continue
  const directory=path.join(runtime,key), manifest=JSON.parse(await fs.readFile(path.join(directory,'package.json'),'utf8'))
  const files=(await fs.readdir(directory)).filter(name=>/^(licen[cs]e|notice|copying)/i.test(name))
  const copied=[]
  for(const name of files){
    if(!(await fs.stat(path.join(directory,name))).isFile())continue
    const filename=key.replaceAll('node_modules/','').replaceAll('/','_')+'-'+name
    await fs.copyFile(path.join(directory,name),path.join(output,filename));copied.push(filename)
  }
  if(!copied.length){
    const source=manifest.name==='jsbarcode'?'https://raw.githubusercontent.com/lindell/JsBarcode/v3.12.3/MIT-LICENSE.txt':
      'https://raw.githubusercontent.com/puppeteer/puppeteer/puppeteer-v25.10.0/LICENSE'
    const response=await fetch(source)
    if(!response.ok)throw new Error(`License fetch failed: ${source}`)
    const filename=manifest.name.replaceAll('/','_')+'-LICENSE.txt'
    await fs.writeFile(path.join(output,filename),await response.text());copied.push(filename)
  }
  entries.push({name:manifest.name,version:info.version,license:manifest.license,integrity:info.integrity,notices:copied})
}
await fs.writeFile(path.join(output,'manifest.json'),JSON.stringify(entries,null,2)+'\n')
console.log(`${entries.length} printing dependency notice entries`)
