// Execute fixed Sunrise print registries, handlers, helper namespaces and EJS.
// Source worktree is read only. See licenses/Sunrise-LICENSE.md (MIT).
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import ejs from '../backend/printing-runtime/node_modules/ejs/lib/esm/ejs.js'
import camelcase from '../backend/printing-runtime/node_modules/camelcase/index.js'
import generateBarcodeSvg from '../backend/printing-runtime/node_modules/@cityssm/jsbarcode-svg/index.js'
import * as dateTimeFunctions from '../backend/printing-runtime/node_modules/@cityssm/utils-datetime/index.js'
import { Configurator } from '../backend/printing-runtime/node_modules/@cityssm/configurator/index.js'
import { configDefaultValues } from '../backend/printing-runtime/config.defaults.mjs'
import { htmlToPdf, renderHtml } from '../backend/printing-runtime/render.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const reference = path.resolve(root, '../Sunrise-Referenz')
const commit = '451ce034863b16502484367044f3e9b65370111a'
assert.equal(execFileSync('git', ['-C',reference,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),commit)
assert.equal(execFileSync('git', ['-C',reference,'status','--porcelain'],{encoding:'utf8'}).trim(),'')
const hashes = {}
async function source(name) {
  const value = await fs.readFile(path.join(reference,name),'utf8')
  hashes[name] = createHash('sha256').update(value).digest('hex')
  return value
}
const lock = JSON.parse(await source('package-lock.json'))
const runtimeLock = JSON.parse(await fs.readFile(path.join(root,'backend/printing-runtime/package-lock.json'),'utf8'))
const packages = []
for (const [name, info] of Object.entries(runtimeLock.packages)) {
  if (!name) continue
  const packageName = name.slice(name.lastIndexOf('node_modules/')+13)
  const match = Object.entries(lock.packages).find(([key,p]) => key.endsWith('node_modules/'+packageName) && p.version===info.version && p.integrity===info.integrity)
  assert.ok(match, `Runtime dependency must match fixed source archive: ${name}@${info.version}`)
  packages.push({name:packageName,version:info.version,integrity:info.integrity})
}
const work=path.join(root,'.local/reference-printing')
async function lockedPackage(name) {
  const info=lock.packages['node_modules/'+name], directory=path.join(work,'packages',name.replaceAll('/','_'))
  await fs.mkdir(directory,{recursive:true})
  const archive=path.join(directory,`${info.version}.tgz`)
  try{await fs.access(archive)}catch{const response=await fetch(info.resolved);assert.ok(response.ok);await fs.writeFile(archive,Buffer.from(await response.arrayBuffer()))}
  assert.equal('sha512-'+createHash('sha512').update(await fs.readFile(archive)).digest('base64'),info.integrity)
  execFileSync('tar',['-xzf',archive,'-C',directory,'--strip-components=1'])
  packages.push({name,version:info.version,integrity:info.integrity})
  return directory
}
const pdfPackage=await lockedPackage('@cityssm/pdf-puppeteer')
const paperPackage=await lockedPackage('@cityssm/paper-sizes')
const customizationPackage=await lockedPackage('sunrise-cms-customizations')
const customizationTypes=await fs.readFile(path.join(customizationPackage,'types.d.ts'),'utf8').catch(async()=>{
  const names=await fs.readdir(customizationPackage);const name=names.find(value=>value.endsWith('.d.ts'));return fs.readFile(path.join(customizationPackage,name),'utf8')
})
assert.match(customizationTypes,/interface PrintConfig/)
assert.match(customizationTypes,/pdf\??:/)
assert.match(customizationTypes,/params:/)
hashes['sunrise-cms-customizations/types.d.ts']=createHash('sha256').update(customizationTypes).digest('hex')
const pdfSources={}
for(const name of ['index.js','pageToPdf.js','defaultOptions.js']) {
  pdfSources[name]=await fs.readFile(path.join(pdfPackage,name),'utf8')
  hashes['@cityssm/pdf-puppeteer/'+name]=createHash('sha256').update(pdfSources[name]).digest('hex')
}
for (const name of ['helpers/pdf.helpers','helpers/print.helpers','helpers/customizations.helpers','helpers/contracts.helpers','helpers/config.helpers','helpers/config.defaults','handlers/printGet/screen','handlers/printGet/pdf','routes/print']) {
  await source(name+'.ts'); await source(name+'.js')
}
for (const name of ['print/screen/contract.ejs','print/screen/_header-print.ejs','print/screen/_footer-print.ejs','print/pdf/workOrder.ejs','print/pdf/workOrder-commentLog.ejs','print/pdf/_workOrder-header.ejs','print/pdf/style.css']) await source('views/'+name)
await source('public/stylesheets/sunrise.css')
for (const name of ['public/javascripts/workOrders.js','public/javascripts/workOrder.js','views/workOrders/_viewEdit.ejs','views/contracts/_viewEdit.ejs']) {
  try { await source(name) } catch { /* Source spelling checked by inventory. */ }
}
function strip(raw) {
  return raw.replace(/^import .*;\r?$/gm,'').replace(/^export default [\w$]+;?\r?$/gm,'')
    .replace(/^export \{.*;?\r?$/gm,'').replaceAll('export class','class').replaceAll('export const','const')
    .replaceAll('export default async function','async function').replaceAll('export default function','function')
    .replaceAll('export async function','async function').replaceAll('export function','function')
}
const contracts = new Function(strip(await source('helpers/contracts.helpers.js'))+'\nreturn {getFeesByFeeCategory,getFieldValueByContractTypeField,getTransactionTotal}')()
const clock = '2026-10-20T09:05:42+02:00'
process.env.TZ = 'Europe/Berlin'
const RealDate = Date
class Clock extends RealDate { constructor(...args) { super(...(args.length ? args : [clock])) } }
globalThis.Date = Clock
const configuration = {'application.applicationName':'Cemaris','settings.contracts.contractEndDateIsAvailable':true,
  'settings.contracts.prints':['screen/contract','pdf/synthetic','pdf/missing'],
  'settings.workOrders.prints':['pdf/workOrder','pdf/workOrder-commentLog'],'reverseProxy.urlPrefix':''}
const configurator = new Configurator(configDefaultValues,configuration)
const configFunctions = {getConfigProperty:(key,fallback)=>configurator.getConfigProperty(key,fallback),isAuditLoggingEnabled:false,keepAliveMillis:0}
configFunctions.default={getConfigProperty:configFunctions.getConfigProperty}
const settings = {'aliases.externalReceiptNumber':'Synthetic Receipt','aliases.workOrderOpenDate':'Synthetic Open Date','aliases.workOrderCloseDate':'Synthetic Close Date'}
const contract = {contractId:7,contractNumber:'SYN-2026',contractType:'Synthetic Contract <&>',burialSiteId:9,burialSiteName:'Synthetic Site A',cemeteryId:3,cemeteryName:'Synthetic Cemetery',
  contractStartDate:20261020,contractStartDateString:'2026-10-20',contractEndDateString:'',contractFields:[{contractTypeField:'Synthetic Field',fieldValue:'Source value is not contractFieldValue'}],
  contractInterments:[{deceasedName:'Synthetic Person Ä <&>',deceasedAddress1:'1 Synthetic Street',deceasedAddress2:'Unit 2',deceasedCity:'Synthetic City',deceasedProvince:'ON',deceasedPostalCode:'SYN 001',intermentContainerType:'Synthetic Urn',intermentDepth:'Synthetic Depth'}],
  contractComments:[{recordCreate_username:'synthetic-author',recordUpdate_username:'synthetic-editor',commentDate:20261020,commentTime:905,commentDateString:'2026-10-20',commentTimeString:'09:05',comment:'This source screen uses obsolete property names.'}],
  contractFees:[{feeName:'Synthetic Fee',feeCategory:'Synthetic Category',feeAmount:12.345,taxAmount:0.61725,quantity:2},{feeName:'Synthetic Single',feeCategory:'Other',feeAmount:5,taxAmount:0,quantity:1}],
  contractTransactions:[{transactionDateString:'2026-10-20',transactionAmount:10.5,externalReceiptNumber:'SYN-R <&>',transactionNote:'Synthetic Note'}]}
const burialSite = {burialSiteId:9,burialSiteName:'Synthetic Site A',cemeteryName:'Synthetic Cemetery'}
const workOrder = {workOrderId:11,workOrderNumber:'2026-000011',workOrderType:'Synthetic Maintenance',workOrderDescription:'Synthetic Description <&>\nSecond line',workOrderOpenDateString:'2026-10-20',workOrderCloseDate:20261020,workOrderCloseDateString:'2026-10-20',recordCreate_timeMillis:1792480200000,
  workOrderBurialSites:[{...burialSite,burialSiteType:'Synthetic Type',burialSiteStatus:'Synthetic Available'}],workOrderContracts:[contract],
  workOrderComments:[{recordCreate_username:'synthetic-author',recordUpdate_username:'synthetic-editor',commentDateString:'2026-10-20',commentTimePeriodString:'9:05 AM',comment:'Synthetic comment <&>\nSecond line'}],
  workOrderMilestones:[{workOrderMilestoneTypeId:1,workOrderMilestoneType:'Synthetic Milestone',workOrderMilestoneDescription:'Synthetic due',workOrderMilestoneDate:20261020,workOrderMilestoneDateString:'2026-10-20',workOrderMilestoneTime:905,workOrderMilestoneTimePeriodString:'9:05 AM',workOrderMilestoneCompletionDate:20261020},
    {workOrderMilestoneTypeId:null,workOrderMilestoneDescription:'Undated',workOrderMilestoneDate:0,workOrderMilestoneTime:0,workOrderMilestoneCompletionDate:0}]}
const customPath = path.join(root,'backend/tests/fixtures/printing-customizations')
const helperCalls=[]
const dependencies={generateBarcodeSvg,dateTimeFunctions,configFunctions,contractFunctions:contracts,getCachedSettingValue:key=>settings[key]??'',
  getContract:async id=>{helperCalls.push(['contract',id]);return id==='missing'?undefined:contract},getBurialSite:async id=>{helperCalls.push(['burialSite',id]);return burialSite},
  getWorkOrder:async(id,options)=>{helperCalls.push(['workOrder',id,options]);return id==='missing'?undefined:workOrder},
  getCustomizationPdfPrintConfigs:()=>({synthetic:{title:'Synthetic Custom Print',params:['contractId']}})}
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor
const prints=await new AsyncFunction(...Object.keys(dependencies),strip(await source('helpers/print.helpers.js'))+'\nreturn {getReportData,getPrintConfig,getPdfPrintConfig,getScreenPrintConfig}')(...Object.values(dependencies))
const renders=[]
for(const variant of ['full','empty','no-end-date']) {
  const dataContract=structuredClone(contract), dataWorkOrder=structuredClone(workOrder)
  if(variant==='empty') {
    for(const key of ['contractFields','contractInterments','contractComments','contractFees','contractTransactions'])dataContract[key]=[]
    dataContract.burialSiteId=null;dataContract.cemeteryId=null
    for(const key of ['workOrderBurialSites','workOrderContracts','workOrderComments','workOrderMilestones'])dataWorkOrder[key]=[]
    dataWorkOrder.workOrderCloseDate=null
  }
  const config={...configuration,'settings.contracts.contractEndDateIsAvailable':variant!=='no-end-date'}
  for(const name of ['screen/contract','pdf/workOrder','pdf/workOrder-commentLog','pdf/synthetic']) {
    const custom=name==='pdf/synthetic'
    const template=custom?path.join(customPath,'views/print/pdf/synthetic.ejs'):path.join(reference,'views/print',name+'.ejs')
    const title=prints.getPrintConfig(name).title
    const data={headTitle:title,contract:dataContract,burialSite,workOrder:dataWorkOrder}
    const localConfigurator=new Configurator(configDefaultValues,config)
    const locals={...data,configFunctions:{...configFunctions,getConfigProperty:(key,fallback)=>localConfigurator.getConfigProperty(key,fallback)},contractFunctions:contracts,dateTimeFunctions,
      barcodeFunctions:{generateBarcodeSvg},settingFunctions:{getSettingValue:key=>settings[key]??''},urlPrefix:''}
    const original=await ejs.renderFile(template,locals)
    const targetTemplate=custom?template:path.join(root,'backend/printing-runtime/views/print',name+'.ejs')
    const target=await renderHtml({template:targetTemplate,data,settings,configuration:config,now:clock})
    function body(value){return name.startsWith('screen/')?value.slice(value.indexOf('<h1'),value.indexOf('</main>')):value}
    assert.equal(body(target),body(original),name+' '+variant)
    renders.push({name,variant,data,configuration:config,html:body(original),sha256:createHash('sha256').update(body(original)).digest('hex')})
  }
}
const reportCases=[]
for(const [name,query] of [['screen/contract',{contractId:'7'}],['screen/contract',{contractId:7}],['pdf/workOrder',{workOrderId:'11'}],['pdf/workOrder',{workOrderId:11}],['pdf/workOrder',{}],['pdf/synthetic',{contractId:'missing'}]]){
  helperCalls.length=0
  const data=await prints.getReportData(prints.getPrintConfig(name),query)
  reportCases.push({name,query,keys:Object.keys(data).filter(key=>!key.endsWith('Functions')).sort(),calls:structuredClone(helperCalls)})
}
const handlerCases=[]
for(const kind of ['screen','pdf']) {
  const raw=strip(await source(`handlers/printGet/${kind}.js`))
  const handler=await new AsyncFunction('getConfigProperty','getReportData','getScreenPrintConfig','getPdfPrintConfig','generatePdf','camelcase',raw+'\nreturn handler')(
    configFunctions.getConfigProperty,async c=>({headTitle:c.title}),prints.getScreenPrintConfig,prints.getPdfPrintConfig,async()=>Buffer.from('SYNTHETIC PDF BOUNDARY'),camelcase)
  for(const name of [kind==='screen'?'contract':'workOrder','missing','disabled']) {
    const result={kind,name}, response={redirect:value=>result.redirect=value,render:(template,data)=>Object.assign(result,{template,data}),setHeader:(key,value)=>{(result.headers??={})[key]=value},send:value=>result.sent=value.toString()}
    await handler({params:{printName:name},query:{contractId:'7',workOrderId:'11'}},response)
    handlerCases.push(result)
  }
}
globalThis.Date=RealDate
const filenames=[]
for(const title of ['Work Order Field Sheet','Work Order Field Sheet - Comment Log','Synthetic Custom Print','Ünicode PDF 2026','XML PDF Export'])for(const id of ['11','ä & 2'])filenames.push({title,id,filename:camelcase(title)+'-'+id+'.pdf'})
const output={commit,hashes,packages,clock,settings,contract,burialSite,workOrder,renders,reportCases,handlerCases,filenames}
const file=path.join(root,'backend/tests/fixtures/printing-reference.json')
if(process.argv.includes('--check-fixture')) assert.deepEqual(output,JSON.parse(await fs.readFile(file,'utf8')))
else await fs.writeFile(file,JSON.stringify(output,null,2)+'\n')
console.log(JSON.stringify({sourceArtifacts:Object.keys(hashes).length,lockedPackages:packages.length,renders:renders.length,reportCases:reportCases.length,handlerCases:handlerCases.length,filenames:filenames.length}))

if(process.argv.includes('--render-pdf')) {
  // Execute the ORIGINAL locked PdfPuppeteer class and pageToPdf bodies with
  // its real browser calls. Only launcher discovery/exit hooks are injected.
  const {default:puppeteer}=await import('../backend/printing-runtime/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')
  const {getPaperSize}=await import(pathToFileURL(path.join(paperPackage,'index.js')).href)
  const executable=process.env.CEMARIS_PRINT_BROWSER_EXECUTABLE??'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  const pdfOptions=new Function('millisecondsInOneMinute','secondsToMillis',strip(pdfSources['defaultOptions.js'])+'\nreturn {defaultPdfOptions,defaultPdfPuppeteerOptions,defaultPuppeteerOptions,htmlNavigationTimeoutMillis,urlNavigationTimeoutMillis}')(60000,value=>value*1000)
  const pageToPdf=new Function('getPaperSize','Debug','DEBUG_NAMESPACE','defaultPdfOptions',strip(pdfSources['pageToPdf.js'])+'\nreturn pageToPdf')(getPaperSize,()=>()=>{},'synthetic-printing',pdfOptions.defaultPdfOptions)
  const observations=[]
  async function launcher(options){
    const browser=await puppeteer.launch({...options,executablePath:executable})
    const newPage=browser.newPage.bind(browser)
    browser.newPage=async()=>{
      const page=await newPage(),goto=page.goto.bind(page)
      page.goto=async(url,options)=>{await goto(url,options);observations.push({urlPrefix:url.split(',')[0],...await page.evaluate(()=>({charset:document.characterSet,text:document.body.innerText}))})}
      return page
    }
    return browser
  }
  const names={launchPuppeteer:launcher,Debug:()=>()=>{},exitHook:()=>{},DEBUG_NAMESPACE:'synthetic-printing',...pdfOptions,pageToPdf}
  const SourcePdf=new Function(...Object.keys(names),strip(pdfSources['index.js'])+'\nreturn PdfPuppeteer')(...Object.values(names))
  const pdfDirectory=path.join(root,'.local/qa-step11/printing-comparison')
  await fs.mkdir(pdfDirectory,{recursive:true})
  const results=[]
  globalThis.Date=Clock
  const pdfCases=[['pdf/workOrder','full'],['pdf/workOrder-commentLog','full'],['screen/contract','full'],['pdf/workOrder','long'],['pdf/workOrder-commentLog','long']]
    .filter(([,variant])=>!process.argv.includes('--long-only')||variant==='long')
  for(const [name,variant] of pdfCases) {
    const record=structuredClone(renders.find(value=>value.name===name&&value.variant==='full'))
    if(variant==='long') {
      record.data.workOrder.workOrderMilestones=Array.from({length:40},(_,index)=>({...record.data.workOrder.workOrderMilestones[0],workOrderMilestoneDescription:`Synthetic milestone ${String(index+1).padStart(3,'0')} Ä. A realistic long description preserves every task and wraps across the table width.`}))
      record.data.workOrder.workOrderComments=Array.from({length:80},(_,index)=>({...record.data.workOrder.workOrderComments[0],comment:`Synthetic comment ${String(index+1).padStart(3,'0')} Ä. A realistic long comment preserves every entry and wraps across the available table width. Second sentence with source formatting and punctuation.`}))
    }
    const template=path.join(reference,'views/print',name+'.ejs')
    let html=await ejs.renderFile(template,{...record.data,configFunctions,contractFunctions:contracts,dateTimeFunctions,barcodeFunctions:{generateBarcodeSvg},settingFunctions:{getSettingValue:key=>settings[key]??''},urlPrefix:''})
    if(name.startsWith('screen/')){
      const bulma=await fs.readFile(path.join(root,'backend/printing-runtime/node_modules/@cityssm/bulma-sticky-table/bulma-with-sticky-table.css'),'utf8')
      const css=await source('public/stylesheets/sunrise.css')
      html=html.replace(/<link href="\/lib\/cityssm-bulma-sticky-table[^>]+>/,'<style>'+bulma+'</style>').replace(/<link href="\/stylesheets\/sunrise.css"[^>]+>/,'<style>'+css+'</style>').replace(/<link href="\/lib\/fa\/[^>]+>/,'')
    }
    const basename=name.replace('/','-')+(variant==='long'?'-long':'')
    await fs.writeFile(path.join(pdfDirectory,basename+'-source.html'),html)
    const sourcePdf=new SourcePdf({browser:'chrome',disableSandbox:true,browserCloseTimeoutMillis:0})
    await fs.writeFile(path.join(pdfDirectory,basename+'-source.pdf'),await sourcePdf.fromHtml(html))
    await sourcePdf.closeBrowser()
    const targetHtml=await renderHtml({template:name.startsWith('screen/')?path.join(root,'backend/printing-runtime/views/print',name+'.ejs'):template,data:record.data,configuration,settings,now:clock})
    await fs.writeFile(path.join(pdfDirectory,basename+'-target.html'),targetHtml)
    await fs.writeFile(path.join(pdfDirectory,basename+'-target.pdf'),await htmlToPdf(targetHtml,executable))
    const observation=observations.at(-1)
    if(name==='pdf/workOrder'){
      assert.equal(observation.charset,'windows-1252')
      assert.ok(observation.text.includes('Ã„'),observation.text)
    }
    results.push({name,variant,source:observation})
  }
  globalThis.Date=RealDate
  await fs.writeFile(path.join(pdfDirectory,process.argv.includes('--long-only')?'long-source-observations.json':'source-observations.json'),JSON.stringify(results,null,2)+'\n')
  console.log('Original PDF class executed; source encoding anomaly reproduced. Samples: '+pdfDirectory)
}
