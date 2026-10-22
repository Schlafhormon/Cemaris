/* Contract fee/transaction views, browser handlers and dialogs ported from Sunrise CMS.
 * Copyright (c) 2026 The Corporation of the City of Sault Ste. Marie.
 * MIT notice: /THIRD-PARTY-NOTICES.txt. */
import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { formatDate, formatCurrency } from './format'
import { request } from './api'
import type { Translate } from './i18n'
import { ErrorMessage, Modal } from './ui'

type Row = Record<string, unknown>
type Labels = (key: string) => string
const str = (row: Row, key: string) => row[key] == null ? '' : String(row[key])
const rows = (row: Row, key: string): Row[] => Array.isArray(row[key]) ? row[key] as Row[] : []
const money = formatCurrency

export const financeLabels: Record<string, [string, string]> = {
  fee: ['Fee', 'Gebühr'], addFee: ['Add Fee', 'Gebühr hinzufügen'], deleteFee: ['Delete Fee', 'Gebühr löschen'],
  deleteFeeConfirm: ['Are you sure you want to delete this fee?', 'Möchten Sie diese Gebühr löschen?'],
  noFees: ['There are no fees associated with this contract.', 'Diesem Vertrag sind keine Gebühren zugeordnet.'],
  feeSearch: ['Fee Search', 'Gebührensuche'], filterFees: ['Filter Fees', 'Gebühren filtern'],
  availableFeesLoading: ['Loading available fees...', 'Verfügbare Gebühren werden geladen…'],
  addFeeGroup: ['Add Fee Group', 'Gebührengruppe hinzufügen'], feeGroupAdded: ['Fee Group Added Successfully', 'Gebührengruppe erfolgreich hinzugefügt'],
  saveBeforeFees: ['Please save all unsaved changes before adding fees.', 'Bitte speichern Sie alle ungespeicherten Änderungen, bevor Sie Gebühren hinzufügen.'],
  unitCost: ['Unit Cost', 'Einzelpreis'], editQuantity: ['Edit Quantity', 'Menge bearbeiten'], updateQuantity: ['Update Quantity', 'Menge aktualisieren'],
  setQuantity: ['Set Quantity', 'Menge festlegen'], setAmount: ['Set Fee Amount', 'Gebührenbetrag festlegen'], feeAmount: ['Fee Amount', 'Gebührenbetrag'],
  setAmountAdd: ['Set Amount and Add Fee', 'Betrag festlegen und Gebühr hinzufügen'], setQuantityAdd: ['Set Quantity and Add Fee', 'Menge festlegen und Gebühr hinzufügen'],
  addTransaction: ['Add Transaction', 'Transaktion hinzufügen'], editTransaction: ['Edit Transaction', 'Transaktion bearbeiten'],
  updateTransaction: ['Update Transaction', 'Transaktion aktualisieren'], deleteTransaction: ['Delete Transaction', 'Transaktion löschen'],
  deleteTransactionConfirm: ['Are you sure you want to delete this transaction?', 'Möchten Sie diese Transaktion löschen?'],
  noTransactions: ['There are no transactions associated with this contract.', 'Diesem Vertrag sind keine Transaktionen zugeordnet.'],
  transactionAmount: ['Transaction Amount', 'Transaktionsbetrag'], transactionDate: ['Transaction Date', 'Transaktionsdatum'],
  transactionTime: ['Transaction Time', 'Transaktionszeit'], transactionTotal: ['Transaction Total', 'Transaktionssumme'],
  paymentType: ['Payment Type', 'Zahlungsart'], paymentTaken: ['Payment Taken', 'Zahlung erhalten'], note: ['Note', 'Notiz'],
  outstanding: ['Outstanding Balance', 'Offener Betrag'], overpayment: ['Overpayment', 'Überzahlung'],
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return <div className="form-field"><label htmlFor={id}>{label}</label>{children}</div>
}
function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return <section className="panel"><div className="panel-heading places-panel-heading"><h2>{title}</h2>{action}</div><div className="panel-body">{children}</div></section>
}

export function ContractFinance({ contract, options, editable, dirty = false, t, l }: { contract: Row; options: Row; editable: boolean; dirty?: boolean; t: Translate; l: Labels }) {
  const [fees, setFees] = useState(rows(contract, 'contractFees'))
  const [transactions, setTransactions] = useState(rows(contract, 'contractTransactions'))
  const [picker, setPicker] = useState(false)
  const [quantityEditor, setQuantityEditor] = useState<Row | null>(null)
  const [transactionEditor, setTransactionEditor] = useState<Row | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)
  const subtotal = fees.reduce((sum, fee) => sum + Number(fee.feeAmount ?? 0) * Number(fee.quantity ?? 0), 0)
  const tax = fees.reduce((sum, fee) => sum + Number(fee.taxAmount ?? 0) * Number(fee.quantity ?? 0), 0)
  // Source uses this order of operations for the payment limits and balance.
  const feeTotal = fees.reduce((sum, fee) => sum + (Number(fee.feeAmount ?? 0) + Number(fee.taxAmount ?? 0)) * Number(fee.quantity ?? 0), 0)
  const transactionTotal = transactions.reduce((sum, entry) => sum + Number(entry.transactionAmount ?? 0), 0)
  const difference = feeTotal - transactionTotal
  const receiptLabel = str(options, 'externalReceiptNumberAlias') || l('receipt')
  async function remove(kind: 'Fee' | 'Transaction', row: Row) {
    if (!window.confirm(l(kind === 'Fee' ? 'deleteFeeConfirm' : 'deleteTransactionConfirm'))) return
    setBusy(true); setError(null)
    try {
      const result = await request<Row>(`/api/contracts/doDeleteContract${kind}`, { contractId: contract.contractId, ...(kind === 'Fee' ? { feeId: row.feeId } : { transactionIndex: row.transactionIndex }) })
      if (kind === 'Fee') setFees(rows(result, 'contractFees'))
      else setTransactions(rows(result, 'contractTransactions'))
    } catch (reason) { setError(reason) } finally { setBusy(false) }
  }
  return <>{error ? <ErrorMessage error={error} t={t} /> : null}<div className="contract-finance-grid">
    <Panel title={l('fees')} action={editable && <button id="button--addFee" className="small success" type="button" disabled={busy} onClick={() => { if (dirty) window.alert(l('saveBeforeFees')); else setPicker(true) }}>{l('addFee')}</button>}>
      <div id="container--contractFees">{!fees.length ? <p className="notification info">{l('noFees')}</p> : <div className="table-scroll"><table className="contract-fees-table"><thead><tr><th>{l('fee')}</th><th><span className="sr-only">{l('unitCost')}</span></th><th><span className="sr-only">×</span></th><th><span className="sr-only">{l('quantity')}</span></th><th><span className="sr-only">=</span></th><th className="finance-number">{l('total')}</th>{editable && <th><span className="sr-only">{t('actions')}</span></th>}</tr></thead><tbody>{fees.map((fee) => <tr key={str(fee, 'feeId')} className="container--contractFee" data-fee-id={str(fee, 'feeId')} data-include-quantity={fee.includeQuantity ? '1' : '0'}><td colSpan={fee.quantity === 1 ? 5 : 1}>{str(fee, 'feeName')}<br /><span className="tag">{str(fee, 'feeCategory')}</span></td>{fee.quantity !== 1 && <><td className="finance-number">{fee.feeAmount == null ? '–' : money(fee.feeAmount)}</td><td>×</td><td className="finance-number">{str(fee, 'quantity')}</td><td>=</td></>}<td className="finance-number">{money(Number(fee.feeAmount ?? 0) * Number(fee.quantity ?? 0))}</td>{editable && <td><div className="places-actions">{Boolean(fee.includeQuantity) && <button className="small button--editQuantity" type="button" disabled={busy} onClick={() => setQuantityEditor(fee)}>{t('edit')}</button>}<button className="small danger button--delete" type="button" title={l('deleteFee')} aria-label={`${l('deleteFee')}: ${str(fee, 'feeName')}`} disabled={busy} onClick={() => remove('Fee', fee)}>{t('delete')}</button></div></td>}</tr>)}</tbody><tfoot><tr><th colSpan={5}>{l('subtotal')}</th><td className="finance-number" id="contractFees--feeAmountTotal">{money(subtotal)}</td>{editable && <td />}</tr><tr><th colSpan={5}>{l('tax')}</th><td className="finance-number" id="contractFees--taxAmountTotal">{money(tax)}</td>{editable && <td />}</tr><tr><th colSpan={5}>{l('grandTotal')}</th><td className="finance-number" id="contractFees--grandTotal">{money(subtotal + tax)}</td>{editable && <td />}</tr></tfoot></table></div>}</div>
    </Panel>
    {(editable || fees.length > 0 || transactions.length > 0) && <Panel title={l('transactions')} action={editable && <button id="button--addTransaction" className="small success" type="button" disabled={busy} onClick={() => setTransactionEditor({})}>{l('addTransaction')}</button>}>
      <div id="container--contractTransactions">{!transactions.length ? <p className={`notification ${editable && fees.length ? 'warning' : 'info'}`}>{l('noTransactions')}</p> : <>{editable && feeTotal.toFixed(2) !== transactionTotal.toFixed(2) && <p className={`notification finance-balance ${difference < 0 ? 'danger' : 'warning'}`} role="status"><span>{l(difference < 0 ? 'overpayment' : 'outstanding')}</span><strong>{money(Math.abs(difference))}</strong></p>}<div className="table-scroll"><table><thead><tr><th>{l('transactionDate')}</th><th>{receiptLabel}</th><th className="finance-number">{l('amount')}</th>{editable && <th><span className="sr-only">{t('actions')}</span></th>}</tr></thead><tbody>{transactions.map((entry) => <tr key={str(entry, 'transactionIndex')} className="container--contractTransaction" data-transaction-index={str(entry, 'transactionIndex')}><td>{formatDate(str(entry, 'transactionDateString'))}{Boolean(entry.isInvoiced) && <><br /><span className="tag">{l('invoiced')}</span></>}</td><td>{str(entry, 'externalReceiptNumber') && <>{str(entry, 'externalReceiptNumber')}<br /></>}<small className="preserve-lines">{str(entry, 'transactionNote')}</small></td><td className="finance-number">{money(entry.transactionAmount)}</td>{editable && <td><div className="places-actions"><button className="small button--edit" type="button" title={l('editTransaction')} aria-label={`${l('editTransaction')}: ${str(entry, 'transactionIndex')}`} disabled={busy} onClick={() => setTransactionEditor(entry)}>{t('edit')}</button><button className="small danger button--delete" type="button" title={l('deleteTransaction')} aria-label={`${l('deleteTransaction')}: ${str(entry, 'transactionIndex')}`} disabled={busy} onClick={() => remove('Transaction', entry)}>{t('delete')}</button></div></td>}</tr>)}</tbody><tfoot><tr><th colSpan={2}>{l('transactionTotal')}</th><td id="contractTransactions--grandTotal" className="finance-number">{money(transactionTotal)}</td>{editable && <td />}</tr></tfoot></table></div></>}</div>
    </Panel>}
  </div>{picker && <FeePicker contractId={contract.contractId} fees={fees} t={t} l={l} onClose={() => setPicker(false)} onSaved={setFees} />}{quantityEditor && <QuantityEditor contractId={contract.contractId} fee={quantityEditor} t={t} l={l} onClose={() => setQuantityEditor(null)} onSaved={(next) => { setFees(next); setQuantityEditor(null) }} />}{transactionEditor && <TransactionEditor contractId={contract.contractId} transaction={transactionEditor} feeTotal={feeTotal} transactionTotal={transactionTotal} receiptLabel={receiptLabel} t={t} l={l} onClose={() => setTransactionEditor(null)} onSaved={(next) => { setTransactions(next); setTransactionEditor(null) }} />}</>
}

function FeePicker({ contractId, fees, t, l, onClose, onSaved }: { contractId: unknown; fees: Row[]; t: Translate; l: Labels; onClose: () => void; onSaved: (fees: Row[]) => void }) {
  const [categories, setCategories] = useState<Row[] | null>(null)
  const [filter, setFilter] = useState('')
  const [error, setError] = useState<unknown>(null)
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [selection, setSelection] = useState<Row | null>(null)
  const [stage, setStage] = useState<'amount' | 'quantity'>('amount')
  const [feeAmount, setFeeAmount] = useState('')
  const [quantity, setQuantity] = useState('1')
  const searchRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const controller = new AbortController(); setCategories(null); setError(null)
    request<Row>('/api/contracts/doGetFees', { contractId }, controller.signal).then((result) => { if (!controller.signal.aborted) setCategories(rows(result, 'feeCategories')) }).catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason) })
    return () => controller.abort()
  }, [contractId, attempt])
  useEffect(() => { if (categories && !selection) searchRef.current?.focus() }, [categories, selection])
  async function addFee(fee: Row, amount?: string, count = '1') {
    setBusy(true); setError(null); setNotice('')
    try { const result = await request<Row>('/api/contracts/doAddContractFee', { contractId, feeId: fee.feeId, quantity: count, ...(amount !== undefined ? { feeAmount: amount } : {}) }); onSaved(rows(result, 'contractFees')); setSelection(null) } catch (reason) { setError(reason) } finally { setBusy(false) }
  }
  function choose(fee: Row) {
    setError(null); setNotice(''); setFeeAmount(''); setQuantity('1')
    if (!fee.feeFunction && fee.feeAmount === null) { setSelection(fee); setStage('amount') }
    else if (fee.includeQuantity) { setSelection(fee); setStage('quantity') }
    else void addFee(fee)
  }
  async function addGroup(category: Row) {
    setBusy(true); setError(null); setNotice('')
    try { const result = await request<Row>('/api/contracts/doAddContractFeeCategory', { contractId, feeCategoryId: category.feeCategoryId }); onSaved(rows(result, 'contractFees')); setNotice(l('feeGroupAdded')) } catch (reason) { setError(reason) } finally { setBusy(false) }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selection) return
    if (stage === 'amount' && selection.includeQuantity) { setStage('quantity'); return }
    void addFee(selection, !selection.feeFunction && selection.feeAmount === null ? feeAmount : undefined, stage === 'quantity' ? quantity : '1')
  }
  const pieces = filter.trim().toLowerCase().split(' ')
  const available: (Row & { filteredFees: Row[] })[] = (categories || []).map((category) => ({ ...category, filteredFees: rows(category, 'fees').filter((fee) => !fees.some((applied) => str(applied, 'feeId') === str(fee, 'feeId') && !applied.includeQuantity) && pieces.every((piece) => `${category.feeCategory} ${fee.feeName} ${fee.feeDescription}`.toLowerCase().includes(piece))) })).filter((category) => category.filteredFees.length)
  return <Modal title={l(selection ? stage === 'amount' ? 'setAmount' : 'setQuantity' : 'addFee')} onClose={() => { if (!busy) { if (selection) { setSelection(null); setError(null) } else onClose() } }}><fieldset disabled={busy}>{selection ? <form id={stage === 'amount' ? 'form--contractFeeAmount' : 'form--contractFeeQuantity'} onSubmit={submit}><p><strong>{str(selection, 'feeName')}</strong></p>{stage === 'amount' ? <Field id="contractFeeAmount--feeAmount" label={l('feeAmount')}><div className="input-addons"><span className="finance-unit">€</span><input key="amount" autoFocus id="contractFeeAmount--feeAmount" name="feeAmount" type="number" min="0" step="0.01" required value={feeAmount} onChange={(e) => setFeeAmount(e.target.value)} /></div></Field> : <Field id="contractFeeQuantity--quantity" label={l('quantity')}><div className="input-addons"><input key="quantity" autoFocus id="contractFeeQuantity--quantity" name="quantity" type="number" min="1" max="1000" step="1" required value={quantity} onChange={(e) => setQuantity(e.target.value)} /><span className="finance-unit" id="contractFeeQuantity--quantityUnit">{str(selection, 'quantityUnit')}</span></div></Field>}{error ? <ErrorMessage error={error} t={t} /> : null}<div className="actions"><button type="button" onClick={() => { setSelection(null); setError(null) }}>{t('cancel')}</button><button className="primary" type="submit">{l(stage === 'amount' ? 'setAmountAdd' : 'setQuantityAdd')}</button></div></form> : <><form id="form--feeSelect" onSubmit={(e) => e.preventDefault()}><Field id="feeSelect--feeName" label={l('feeSearch')}><input ref={searchRef} id="feeSelect--feeName" name="feeName" value={filter} placeholder={l('filterFees')} disabled={!categories} onChange={(e) => setFilter(e.target.value)} /></Field></form>{error ? <><ErrorMessage error={error} t={t} />{!categories && <button type="button" onClick={() => setAttempt((value) => value + 1)}>{t('cemaris:retry')}</button>}</> : null}{notice && <p className="notification success" role="status">{notice}</p>}<div id="resultsContainer--feeSelect">{!categories ? !error && <p role="status">{l('availableFeesLoading')}</p> : !available.length ? <p className="notification info">{t('noResults')}</p> : available.map((category) => <section className="finance-fee-category container--feeCategory" key={str(category, 'feeCategoryId')} data-fee-category-id={str(category, 'feeCategoryId')}><div className="finance-category-heading"><h3>{str(category, 'feeCategory')}</h3>{Boolean(category.isGroupedFee) && <button type="button" className="small success" data-fee-category-id={str(category, 'feeCategoryId')} onClick={() => addGroup(category)}>{l('addFeeGroup')}</button>}</div>{category.filteredFees.map((fee) => category.isGroupedFee ? <div className="finance-fee-option container--fee" key={str(fee, 'feeId')} data-fee-id={str(fee, 'feeId')}><strong>{str(fee, 'feeName')}</strong><br /><small className="preserve-lines">{str(fee, 'feeDescription')}</small></div> : <button className="finance-fee-option container--fee" type="button" key={str(fee, 'feeId')} data-fee-id={str(fee, 'feeId')} data-fee-category-id={str(category, 'feeCategoryId')} onClick={() => choose(fee)}><strong>{str(fee, 'feeName')}</strong><br /><small className="preserve-lines">{str(fee, 'feeDescription')}</small></button>)}</section>)}</div><div className="actions"><button type="button" onClick={onClose}>{t('close')}</button></div></>}</fieldset></Modal>
}

function QuantityEditor({ contractId, fee, t, l, onClose, onSaved }: { contractId: unknown; fee: Row; t: Translate; l: Labels; onClose: () => void; onSaved: (fees: Row[]) => void }) {
  const [quantity, setQuantity] = useState(String(fee.quantity ?? 0))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null)
    try { const result = await request<Row>('/api/contracts/doUpdateContractFeeQuantity', { contractId, feeId: fee.feeId, quantity }); onSaved(rows(result, 'contractFees')) } catch (reason) { setError(reason) } finally { setBusy(false) }
  }
  return <Modal title={l('editQuantity')} onClose={() => { if (!busy) onClose() }}><form id="form--contractFeeQuantity" onSubmit={save}><fieldset disabled={busy}><input id="contractFeeQuantity--contractId" name="contractId" type="hidden" value={String(contractId)} /><input id="contractFeeQuantity--feeId" name="feeId" type="hidden" value={str(fee, 'feeId')} /><Field id="contractFeeQuantity--quantity" label={l('quantity')}><div className="input-addons"><input autoFocus id="contractFeeQuantity--quantity" name="quantity" type="number" min="1" max="1000" step="1" required value={quantity} onChange={(e) => setQuantity(e.target.value)} /><span className="finance-unit" id="contractFeeQuantity--quantityUnit">{str(fee, 'quantityUnit')}</span></div></Field>{error ? <ErrorMessage error={error} t={t} /> : null}<div className="actions"><button type="button" onClick={onClose}>{t('cancel')}</button><button className="primary" type="submit">{l('updateQuantity')}</button></div></fieldset></form></Modal>
}

function TransactionEditor({ contractId, transaction, feeTotal, transactionTotal, receiptLabel, t, l, onClose, onSaved }: { contractId: unknown; transaction: Row; feeTotal: number; transactionTotal: number; receiptLabel: string; t: Translate; l: Labels; onClose: () => void; onSaved: (transactions: Row[]) => void }) {
  const edit = transaction.transactionIndex != null
  const prefix = `contractTransaction${edit ? 'Edit' : 'Add'}`
  const [form, setForm] = useState<Row>(edit ? { ...transaction, transactionAmount: Number(transaction.transactionAmount).toFixed(2), isInvoiced: transaction.isInvoiced ? '1' : '0' } : { transactionAmount: Math.max(feeTotal - transactionTotal, 0).toFixed(2), isInvoiced: '0', externalReceiptNumber: '', transactionNote: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const setValue = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }))
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null)
    try { const result = await request<Row>(`/api/contracts/do${edit ? 'Update' : 'Add'}ContractTransaction`, Object.fromEntries(new FormData(event.currentTarget))); onSaved(rows(result, 'contractTransactions')) } catch (reason) { setError(reason) } finally { setBusy(false) }
  }
  return <Modal title={l(edit ? 'editTransaction' : 'addTransaction')} onClose={() => { if (!busy) onClose() }}><form id={`form--${prefix}`} onSubmit={save}><fieldset disabled={busy}><input id={`${prefix}--contractId`} name="contractId" type="hidden" value={String(contractId)} />{edit && <input id={`${prefix}--transactionIndex`} name="transactionIndex" type="hidden" value={str(transaction, 'transactionIndex')} />}<div className="two-columns"><Field id={`${prefix}--transactionAmount`} label={l('transactionAmount')}><div className="input-addons"><span className="finance-unit">€</span><input autoFocus id={`${prefix}--transactionAmount`} name="transactionAmount" type="number" step="0.01" min={edit ? undefined : (-transactionTotal).toFixed(2)} max={edit ? undefined : Math.max(feeTotal - transactionTotal, 0).toFixed(2)} required value={str(form, 'transactionAmount')} onChange={(e) => setValue('transactionAmount', e.target.value)} /></div></Field><Field id={`${prefix}--isInvoiced`} label={l('paymentType')}><select id={`${prefix}--isInvoiced`} name="isInvoiced" value={str(form, 'isInvoiced')} onChange={(e) => setValue('isInvoiced', e.target.value)}><option value="0">{l('paymentTaken')}</option><option value="1">{l('invoiced')}</option></select></Field></div><Field id={`${prefix}--externalReceiptNumber`} label={receiptLabel}><input id={`${prefix}--externalReceiptNumber`} name="externalReceiptNumber" maxLength={100} autoComplete="off" value={str(form, 'externalReceiptNumber')} onChange={(e) => setValue('externalReceiptNumber', e.target.value)} /></Field><Field id={`${prefix}--transactionNote`} label={l('note')}><textarea id={`${prefix}--transactionNote`} name="transactionNote" rows={3} value={str(form, 'transactionNote')} onChange={(e) => setValue('transactionNote', e.target.value)} /></Field>{edit && <div className="two-columns"><Field id={`${prefix}--transactionDateString`} label={l('transactionDate')}><input id={`${prefix}--transactionDateString`} name="transactionDateString" type="date" required value={str(form, 'transactionDateString')} onChange={(e) => setValue('transactionDateString', e.target.value)} /></Field><Field id={`${prefix}--transactionTimeString`} label={l('transactionTime')}><input id={`${prefix}--transactionTimeString`} name="transactionTimeString" type="time" required value={str(form, 'transactionTimeString')} onChange={(e) => setValue('transactionTimeString', e.target.value)} /></Field></div>}{error ? <ErrorMessage error={error} t={t} /> : null}<div className="actions"><button type="button" onClick={onClose}>{t('cancel')}</button><button className="primary" type="submit">{l(edit ? 'updateTransaction' : 'addTransaction')}</button></div></fieldset></form></Modal>
}
