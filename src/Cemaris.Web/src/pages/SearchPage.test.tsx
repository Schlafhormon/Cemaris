import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SearchPage } from './SearchPage'
import type { SearchRecord } from '../types/cases'

describe('Suchpagination', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('navigiert serverseitig und hält Seite sowie Seitengröße in der URL', async () => {
    window.history.replaceState(null, '', '/search')
    const requests: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      requests.push(url)
      const query = new URL(url, 'http://localhost').searchParams
      const page = Number(query.get('page'))
      const pageSize = Number(query.get('pageSize'))
      const start = (page - 1) * pageSize
      const items = Array.from({ length: Math.min(pageSize, 15 - start) }, (_, index) => searchRecord(start + index + 1))
      return new Response(JSON.stringify({ items, totalMatches: 15, limit: pageSize, isTruncated: true, page, pageSize, totalPages: Math.ceil(15 / pageSize) }), { headers: { 'Content-Type': 'application/json' } })
    }))
    const user = userEvent.setup()

    render(<SearchPage />)

    expect(await screen.findByRole('link', { name: 'SYN-10' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Nächste Seite' }))
    expect(await screen.findByRole('link', { name: 'SYN-11' })).toBeInTheDocument()
    expect(window.location.search).toContain('page=2')

    await user.selectOptions(screen.getByRole('combobox', { name: 'Einträge pro Seite' }), '5')
    await waitFor(() => expect(requests.at(-1)).toContain('pageSize=5'))
    expect(window.location.search).toBe('?pageSize=5')
  })
})

function searchRecord(index: number): SearchRecord {
  return {
    caseId: `00000000-0000-0000-0000-${String(index).padStart(12, '0')}`,
    isSynthetic: true,
    cemetery: 'Synthetischer Friedhof',
    field: 'Testfeld',
    graveNumber: `SYN-${index}`,
    deceasedPersons: [],
    burialDates: [],
    entitledPersons: [],
    noticeNumbers: [],
  }
}
