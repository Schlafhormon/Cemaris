import './NoticeDraftLineItems.css'
import type { NoticeDraftLineItem } from '../types/noticeDrafts'
import type { useFormFeedback } from './useFormFeedback'

import { amountCents, emptyLine, formatExactAmount, lineTotal, type LineInput } from './noticeDraftMoney'

export function NoticeDraftLineItemsEditor({ lines, onChange, disabled = false, feedback }: {
  lines: LineInput[]; onChange: (value: LineInput[]) => void; disabled?: boolean
  feedback?: ReturnType<typeof useFormFeedback>
}) {
  const total = lineTotal(lines)
  function move(index: number, delta: number) {
    const next = [...lines]
    ;[next[index], next[index + delta]] = [next[index + delta], next[index]]
    onChange(next)
  }
  return <fieldset disabled={disabled} className="notice-line-editor">
    <legend>Manuelle Gebührenpositionen</legend>
    <p>1 bis 100 Positionen. Positive EUR-Beträge mit höchstens zwei Nachkommastellen; die Summe wird verbindlich aus allen Positionen gebildet.</p>
    {lines.map((line, index) => <fieldset key={line.key} className="notice-line-row">
      <legend>Position {index + 1}</legend>
      <label>Bezeichnung Position {index + 1}<textarea name={`lineItems[${index}].description`} value={line.description} maxLength={500} required {...feedback?.fieldProps(`lineItems[${index}].description`)} onChange={event => onChange(lines.map((x, i) => i === index ? { ...x, description: event.target.value } : x))} />{feedback?.fieldErrors(`lineItems[${index}].description`)}</label>
      <label>Betrag Position {index + 1} in EUR<input name={`lineItems[${index}].amount`} inputMode="decimal" value={line.amount} required onChange={event => onChange(lines.map((x, i) => i === index ? { ...x, amount: event.target.value } : x))} aria-invalid={line.amount !== '' && amountCents(line.amount) === null} {...feedback?.fieldProps(`lineItems[${index}].amount`)} />{feedback?.fieldErrors(`lineItems[${index}].amount`)}</label>
      {line.amount !== '' && amountCents(line.amount) === null && <span className="field-error">Positiven Betrag mit höchstens zwei Nachkommastellen eingeben.</span>}
      <div className="notice-line-actions">
        <button type="button" className="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`Position ${index + 1} nach oben`}>↑ Nach oben</button>
        <button type="button" className="button" disabled={index === lines.length - 1} onClick={() => move(index, 1)} aria-label={`Position ${index + 1} nach unten`}>↓ Nach unten</button>
        <button type="button" className="button" disabled={lines.length === 1} onClick={() => onChange(lines.filter((_, i) => i !== index))} aria-label={`Position ${index + 1} entfernen`}>Entfernen</button>
      </div>
    </fieldset>)}
    <button type="button" className="button" disabled={lines.length === 100} onClick={() => onChange([...lines, emptyLine()])}>Position hinzufügen</button>
    <p role="status"><strong>{total === null ? 'Gesamtsumme: Eingaben unvollständig oder ungültig' : `Gesamtsumme: ${formatExactAmount(total)}`}</strong></p>
  </fieldset>
}

export function NoticeDraftLineItemsView({ lines }: { lines?: NoticeDraftLineItem[] }) {
  if (!lines?.length) return null
  return <ol className="notice-line-list">{lines.map(line => <li key={line.id}><span>{line.description}</span><strong>{formatExactAmount(line.amountExact)}</strong></li>)}</ol>
}
