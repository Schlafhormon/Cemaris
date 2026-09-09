import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { NoticeDraftLineItemsEditor } from './NoticeDraftLineItems'
import { amountCents, emptyLine, exactAmount, formatExactAmount, lineTotal } from './noticeDraftMoney'

describe('Manuelle Positionen', () => {
  it('überträgt Centbeträge und den Höchstbetrag exakt', () => {
    expect(exactAmount('9999999999999999,99')).toBe('9999999999999999.99')
    expect(formatExactAmount('9999999999999999.99')).toBe('9.999.999.999.999.999,99 EUR')
    expect(lineTotal([{ ...emptyLine(), description: 'A', amount: '0,10' }, { ...emptyLine(), description: 'B', amount: '0.20' }])).toBe('0.30')
    for (const amount of ['0', '-1', '1.001', '1e2', '', '10000000000000000', ' 1']) expect(amountCents(amount)).toBeNull()
    expect(lineTotal([{ ...emptyLine(), description: 'A', amount: '9999999999999999.99' }, { ...emptyLine(), description: 'B', amount: '0.01' }])).toBeNull()
  })
  it('ermöglicht Hinzufügen, Tastaturreihenfolge und Entfernen ohne gültig scheinende Fehlsumme', async () => {
    function Editor() { const [lines, setLines] = useState([emptyLine()]); return <NoticeDraftLineItemsEditor lines={lines} onChange={setLines} /> }
    render(<Editor />)
    const user = userEvent.setup()
    expect(screen.getByRole('button', { name: 'Position 1 entfernen' })).toBeDisabled()
    await user.type(screen.getByLabelText('Bezeichnung Position 1'), 'Leistung A')
    await user.type(screen.getByLabelText('Betrag Position 1 in EUR'), '100,10')
    await user.click(screen.getByRole('button', { name: 'Position hinzufügen' }))
    expect(screen.getByRole('status')).toHaveTextContent('unvollständig oder ungültig')
    await user.type(screen.getByLabelText('Bezeichnung Position 2'), 'Leistung B')
    await user.type(screen.getByLabelText('Betrag Position 2 in EUR'), '25,40')
    expect(screen.getByRole('status')).toHaveTextContent('125,50 EUR')
    screen.getByRole('button', { name: 'Position 2 nach oben' }).focus()
    await user.keyboard('{Enter}')
    expect(screen.getByLabelText('Bezeichnung Position 1')).toHaveValue('Leistung B')
    await user.click(screen.getByRole('button', { name: 'Position 2 entfernen' }))
    expect(screen.getByRole('status')).toHaveTextContent('25,40 EUR')
    await user.clear(screen.getByLabelText('Betrag Position 1 in EUR'))
    await user.type(screen.getByLabelText('Betrag Position 1 in EUR'), '0')
    expect(screen.getByRole('status')).toHaveTextContent('unvollständig oder ungültig')
    expect(screen.getByLabelText('Betrag Position 1 in EUR')).toHaveAttribute('aria-invalid', 'true')
  })
})
