// Browser boundary probe; real PDFs are rendered by reference_printing --render-pdf
// and the production browser checks. This isolates transport/lifecycle options.
import puppeteer from '../printing-runtime/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'
import { htmlToPdf } from '../printing-runtime/render.mjs'
const calls=[]
puppeteer.launch=async options=>{
  calls.push({launch:options})
  return {newPage:async()=>({goto:async(url,options)=>calls.push({url,options}),pdf:async options=>{calls.push({pdf:options});return Buffer.from('%PDF-SYNTHETIC')}}),close:async()=>calls.push({closed:true})}
}
await htmlToPdf('<html><body>Übung Ä ß</body></html>','/synthetic/browser',process.argv[2]??'chrome')
process.stdout.write(JSON.stringify(calls))
