// EJS compatibility boundary for Sunrise CMS templates (MIT; licenses/Sunrise-LICENSE.md).
// Python owns authentication, SQL Server and print allowlists. Templates/index.js
// are administrator-installed executable code, just as in the source application.
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'
import ejs from 'ejs'
import camelcase from 'camelcase'
import generateBarcodeSvg from '@cityssm/jsbarcode-svg'
import * as dateTimeFunctions from '@cityssm/utils-datetime'
import puppeteer from 'puppeteer-core'
import { Configurator } from '@cityssm/configurator'
import * as contractFunctions from './contracts.helpers.mjs'
import { configDefaultValues } from './config.defaults.mjs'

const runtime = path.dirname(fileURLToPath(import.meta.url))
export async function customizationPrints(customizationsPath) {
  if (!customizationsPath || customizationsPath === '.') return {}
  const configuration = (await import(pathToFileURL(path.resolve(customizationsPath, 'index.js')).href)).default
  return configuration?.prints?.pdf ?? {}
}
export function exportFilename(config, parameters) {
  const first = config.params?.[0]
  return `${camelcase(config.title)}${typeof parameters[first] === 'string' ? `-${parameters[first]}` : ''}.pdf`
}
export async function renderHtml(input) {
  const configurator = new Configurator(configDefaultValues, input.configuration ?? {})
  const getConfigProperty = (key, fallback) => configurator.getConfigProperty(key, fallback)
  const configFunctions = {
    getConfigProperty,
    isAuditLoggingEnabled: getConfigProperty('settings.auditLog.enabled') && process.env.DISABLE_AUDIT_LOG !== 'true',
    keepAliveMillis: getConfigProperty('session.doKeepAlive') ? Math.max(getConfigProperty('session.maxAgeMillis') / 2, getConfigProperty('session.maxAgeMillis') - 10000) : 0,
  }
  configFunctions.default = { getConfigProperty: configFunctions.getConfigProperty }
  const data = {
    ...input.data, configFunctions, contractFunctions, dateTimeFunctions,
    barcodeFunctions: { generateBarcodeSvg },
    settingFunctions: { getSettingValue: key => input.settings?.[key] ?? '' },
    urlPrefix: input.configuration?.['reverseProxy.urlPrefix'] ?? '',
  }
  if (input.now) {
    // Comparison hook only; production does not provide this field.
    const RealDate = Date
    globalThis.Date = class extends RealDate { constructor(...args) { super(...(args.length ? args : [input.now])) } }
  }
  try { return await ejs.renderFile(input.template, data) }
  finally { if (input.now) globalThis.Date = Object.getPrototypeOf(globalThis.Date) }
}
export async function htmlToPdf(html, executablePath, browserType = 'chrome') {
  let browser
  const watchdog = setTimeout(() => {
    // Browser close has its own bounded deadline, before Python's tree cleanup.
    const hardExit = setTimeout(() => {
      const pid = browser?.process()?.pid
      if (pid) {
        if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true, timeout: 3000, stdio: 'ignore' })
        else { try { process.kill(-pid, 'SIGKILL') } catch { try { process.kill(pid, 'SIGKILL') } catch {} } }
      }
      process.exit(124)
    }, 5000)
    Promise.resolve(browser?.close()).finally(() => { clearTimeout(hardExit); process.exit(124) })
  }, 85000)
  try {
    browser = await puppeteer.launch({ executablePath, browser: browserType, headless: true, timeout: 30000, args: ['--no-sandbox', '--disable-setuid-sandbox'] })
    const page = await browser.newPage()
    // A4 is the municipal document default. Explicit UTF-8 also supports
    // administrator templates that omit their own charset declaration.
    await page.goto(`data:text/html;charset=utf-8;base64,${Buffer.from(html).toString('base64')}`, { timeout: 60000, waitUntil: browserType === 'firefox' ? 'domcontentloaded' : 'networkidle0' })
    return Buffer.from(await page.pdf({ format: 'A4', printBackground: true }))
  } finally { try { await browser?.close() } finally { clearTimeout(watchdog) } }
}
export async function run(input) {
  if (input.operation === 'customizations') return { prints: await customizationPrints(input.customizationsPath) }
  if (input.operation === 'filename') return { filename: exportFilename(input.config, input.parameters) }
  const html = await renderHtml(input)
  if (input.operation !== 'pdf') return { html }
  return { pdf: (await htmlToPdf(html, input.executablePath, input.browser)).toString('base64') }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // Administrator templates/modules may log; stdout is exclusively the JSON
  // protocol so ordinary diagnostic output must use the stderr channel.
  for (const name of ['log', 'info', 'debug']) console[name] = (...args) => console.error(...args)
  try {
    let raw = ''; for await (const chunk of process.stdin) raw += chunk
    const result = await run(JSON.parse(raw))
    process.stdout.write(JSON.stringify(result))
  } catch (error) { process.stderr.write(String(error.stack ?? error)); process.exitCode = 1 }
}
