import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LegalBasisVersionsPage } from './LegalBasisVersionsPage'

describe('LegalBasisVersionsPage', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('legt unveränderliche Versionen inaktiv an und aktiviert nur per ETag', async () => {
    let activationEtag = ''
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path=String(input)
      if(path.includes('activeOnly=false')) return json([])
      if(path.endsWith('/api/auth/csrf')) return json({requestToken:'csrf'})
      if(path.endsWith('/api/master-data/legal-basis-versions')&&init?.method==='POST') return json(basis(false,1),201,{ETag:'"1"'})
      if(path.endsWith('/active')&&init?.method==='PUT'){activationEtag=new Headers(init.headers).get('If-Match')??'';return json(basis(true,2),200,{ETag:'"2"'})}
      throw new Error(`Unerwarteter Testaufruf: ${path}`)
    }))
    const user=userEvent.setup(); render(<LegalBasisVersionsPage />)
    await user.type(await screen.findByLabelText('Satzungsname'),'Synthetische Satzung')
    await user.type(screen.getByLabelText('Fassungsstand'),'2026-01-01')
    await user.click(screen.getByRole('button',{name:'Inaktive Version anlegen'}))
    expect(await screen.findByText('Neue unveränderliche Satzungsversion wurde inaktiv angelegt.')).toBeInTheDocument()
    expect(screen.getByText('Inaktiv')).toBeInTheDocument()
    await user.click(screen.getByRole('button',{name:'Aktivieren'}))
    expect(await screen.findByText('Satzungsversion aktiviert.')).toBeInTheDocument()
    expect(activationEtag).toBe('"1"')
    expect(screen.getByText('Aktiv')).toBeInTheDocument()
  })
})

function basis(isActive:boolean,version:number){return{id:'65000000-0000-0000-0000-000000000001',name:'Synthetische Satzung',versionDate:'2026-01-01',isActive,version,createdAtUtc:'2026-08-28T00:00:00Z',updatedAtUtc:'2026-08-28T00:00:00Z'}}
function json(value:unknown,status=200,headers:Record<string,string>={}){return new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json',...headers}})}
