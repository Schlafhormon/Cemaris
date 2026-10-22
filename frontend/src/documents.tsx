import { appUrl } from './paths'
/* Attachment dialogs and print selection ported from Sunrise CMS.
 * Copyright (c) 2026 The Corporation of the City of Sault Ste. Marie.
 * MIT notice: /THIRD-PARTY-NOTICES.txt. */
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { formatTimestamp } from './format'
import { ApiError, request } from './api'
import type { Translate } from './i18n'
import { ErrorMessage, Modal } from './ui'

type Row = Record<string, unknown>
type Labels = (key: string) => string
const str = (row: Row, key: string) => row[key] == null ? '' : String(row[key])
const rows = (row: Row, key: string): Row[] => Array.isArray(row[key]) ? row[key] as Row[] : []
export interface PrintChoice { path: string; title: string }
export const documentLabels: Record<string, [string, string]> = {
  attachmentsTitle: ['Attachments', 'Anhänge'], attachmentTitle: ['Title', 'Titel'], attachmentDetails: ['Details', 'Details'], attachmentUploaded: ['Uploaded', 'Hochgeladen'],
  noAttachments: ['No attachments have been uploaded.', 'Es wurden keine Anhänge hochgeladen.'], uploadAttachment: ['Upload Attachment', 'Anhang hochladen'],
  editAttachment: ['Edit Attachment', 'Anhang bearbeiten'], deleteAttachment: ['Delete Attachment', 'Anhang löschen'],
  deleteAttachmentConfirm: ['Are you sure you want to delete this attachment? This action cannot be undone.', 'Möchten Sie diesen Anhang unwiderruflich löschen?'],
  upload: ['Upload', 'Hochladen'], uploading: ['Uploading...', 'Wird hochgeladen...'], attachmentFile: ['File', 'Datei'],
  attachmentOptionalTitle: ['Title (optional)', 'Titel (optional)'], attachmentOptionalDetails: ['Details (optional)', 'Details (optional)'],
  attachmentFilenameHint: ['Leave blank to use filename', 'Für den Dateinamen leer lassen'],
  attachmentDetailsHint: ['Additional details about this attachment', 'Weitere Angaben zu diesem Anhang'],
  attachmentSize: ['Maximum file size:', 'Maximale Dateigröße:'],
  attachmentFormats: ['Supported formats: PDF, Word documents, images, text files, spreadsheets.', 'Unterstützte Formate: PDF, Word-Dokumente, Bilder, Textdateien, Tabellen.'],
  attachmentTooLarge: ['File exceeds the maximum size limit.', 'Die Datei überschreitet die maximale Dateigröße.'],
  attachmentUploadSuccess: ['Attachment uploaded successfully.', 'Anhang erfolgreich hochgeladen.'],
  attachmentUpdateSuccess: ['Attachment updated successfully.', 'Anhang erfolgreich aktualisiert.'],
  attachmentDeleteSuccess: ['Attachment deleted successfully.', 'Anhang erfolgreich gelöscht.'],
}

export function printUrl(choice: PrintChoice, kind: 'contract' | 'workOrder', id: unknown): string {
  return `/print/${choice.path}?${kind}Id=${encodeURIComponent(String(id))}`
}

export function PrintMenu({ kind, id, t }: { kind: 'contract' | 'workOrder'; id: unknown; t: Translate }) {
  const [choices, setChoices] = useState<PrintChoice[]>([])
  const [error, setError] = useState<unknown>(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setChoices([]); setError(null)
    request<{ prints: PrintChoice[] }>(`/api/print/options?${kind}Id=${encodeURIComponent(String(id))}`, undefined, controller.signal)
      .then((value) => { if (!controller.signal.aborted) setChoices(value.prints) })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason) })
    return () => controller.abort()
  }, [kind, id, attempt])
  if (error) return <div className="print-error"><ErrorMessage error={error} t={t} /><button type="button" onClick={() => setAttempt((value) => value + 1)}>{t('cemaris:retry')}</button></div>
  if (!choices.length) return null
  return <details className="print-menu" data-print-kind={kind}><summary className="button" aria-label={t('print')}>{t('print')} ▾</summary><div className="print-menu-items">{choices.map((choice) => <a key={choice.path} href={appUrl(printUrl(choice, kind, id))} target="_blank" rel="noopener noreferrer">{choice.title}</a>)}</div></details>
}

export function ContractAttachments({ contract, editable, t, l }: { contract: Row; editable: boolean; t: Translate; l: Labels }) {
  const [items, setItems] = useState(() => rows(contract, 'contractAttachments'))
  const [editor, setEditor] = useState<Row | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { setItems(rows(contract, 'contractAttachments')) }, [contract])
  async function remove(item: Row) {
    if (!window.confirm(l('deleteAttachmentConfirm'))) return
    setBusy(true); setError(null); setNotice('')
    try {
      const result = await request<Row>('/api/contracts/doDeleteContractAttachment', { contractAttachmentId: item.contractAttachmentId })
      setItems(rows(result, 'contractAttachments')); setNotice(l('attachmentDeleteSuccess'))
    } catch (reason) { setError(reason) } finally { setBusy(false) }
  }
  if (!editable && !items.length) return null
  return <section className="panel" id="panel--contractAttachments"><div className="panel-heading places-panel-heading"><h2>{l('attachmentsTitle')}</h2>{editable && <button id="button--uploadAttachment" className="small success" type="button" disabled={busy} onClick={() => { setError(null); setEditor({}) }}>{l('uploadAttachment')}</button>}</div><div className="panel-body"><div id="container--contractAttachments">{Boolean(error) && <ErrorMessage error={error} t={t} />}{notice && <p role="status" className="notification success">{notice}</p>}{!items.length ? <p className="notification info">{l('noAttachments')}</p> : <div className="table-scroll"><table className="attachments-table"><thead><tr><th>{l('attachmentTitle')}</th><th>{l('attachmentDetails')}</th><th>{l('attachmentUploaded')}</th>{editable && <th>{t('actions')}</th>}</tr></thead><tbody>{items.map((item) => <tr key={str(item, 'contractAttachmentId')} data-attachment-id={str(item, 'contractAttachmentId')}><td><a href={appUrl(`/api/contracts/attachment/${item.contractAttachmentId}`)} target="_blank" rel="noopener noreferrer" download>{str(item, 'attachmentTitle') || str(item, 'fileName')}</a><br /><small>{str(item, 'fileName')}</small></td><td className="preserve-lines">{str(item, 'attachmentDetails')}</td><td>{uploadedDate(item.recordCreate_timeMillis)}</td>{editable && <td><div className="places-actions"><button className="small" type="button" data-cy="edit-attachment" title={l('editAttachment')} disabled={busy} onClick={() => setEditor(item)}>{t('edit')}</button><button className="small danger" type="button" data-cy="delete-attachment" title={l('deleteAttachment')} disabled={busy} onClick={() => remove(item)}>{t('delete')}</button></div></td>}</tr>)}</tbody></table></div>}</div></div>{editor && <AttachmentEditor attachment={editor} contractId={contract.contractId} t={t} l={l} onClose={() => setEditor(null)} onSaved={(next, edit) => { setItems(next); setEditor(null); setNotice(l(edit ? 'attachmentUpdateSuccess' : 'attachmentUploadSuccess')) }} />}</section>
}

const uploadedDate = formatTimestamp

function AttachmentEditor({ attachment, contractId, t, l, onClose, onSaved }: { attachment: Row; contractId: unknown; t: Translate; l: Labels; onClose: () => void; onSaved: (next: Row[], edit: boolean) => void }) {
  const edit = attachment.contractAttachmentId != null
  const prefix = `contractAttachment${edit ? 'Edit' : 'Upload'}`
  const [maximum, setMaximum] = useState<number | null>(null)
  const [title, setTitle] = useState(str(attachment, 'attachmentTitle'))
  const [details, setDetails] = useState(str(attachment, 'attachmentDetails'))
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (edit) return
    const controller = new AbortController()
    request<{ maxAttachmentFileSize: number }>('/api/attachments/options', undefined, controller.signal).then((value) => { if (!controller.signal.aborted) { setMaximum(value.maxAttachmentFileSize); setError(null) } }).catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason) })
    return () => controller.abort()
  }, [edit, attempt])
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null)
    try {
      const body = new FormData(event.currentTarget)
      const result = await request<Row>(`/api/contracts/do${edit ? 'Update' : 'Upload'}ContractAttachment`, edit ? Object.fromEntries(body) : body)
      onSaved(rows(result, 'contractAttachments'), edit)
    } catch (reason) { setError(reason) } finally { setBusy(false) }
  }
  return <Modal title={l(edit ? 'editAttachment' : 'uploadAttachment')} onClose={() => { if (!busy) onClose() }}><form id={`form--${prefix}`} onSubmit={save}><fieldset disabled={busy}><input id={`${prefix}--${edit ? 'contractAttachmentId' : 'contractId'}`} type="hidden" name={edit ? 'contractAttachmentId' : 'contractId'} value={String(edit ? attachment.contractAttachmentId : contractId)} />{!edit && <div className="form-field"><label htmlFor={`${prefix}--file`}>{l('attachmentFile')}</label><input id={`${prefix}--file`} name="file" type="file" autoFocus required disabled={maximum === null} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt,.csv,.xls,.xlsx" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file && maximum !== null && file.size > maximum * 1024 * 1024) { event.currentTarget.value = ''; setError(new ApiError('unavailable', undefined, undefined, 400, l('attachmentTooLarge'))) } else setError(null) }} /><p className="small-text">{l('attachmentSize')} <span id={`${prefix}--maxAttachmentFileSize`}>{maximum ?? '–'}</span> MB. {l('attachmentFormats')}</p></div>}<div className="form-field"><label htmlFor={`${prefix}--attachmentTitle`}>{l(edit ? 'attachmentTitle' : 'attachmentOptionalTitle')}</label><input id={`${prefix}--attachmentTitle`} name="attachmentTitle" maxLength={100} required={edit} autoFocus={edit} value={title} placeholder={edit ? undefined : l('attachmentFilenameHint')} onChange={(event) => setTitle(event.target.value)} /></div><div className="form-field"><label htmlFor={`${prefix}--attachmentDetails`}>{l(edit ? 'attachmentDetails' : 'attachmentOptionalDetails')}</label><textarea id={`${prefix}--attachmentDetails`} name="attachmentDetails" maxLength={500} rows={3} value={details} placeholder={l('attachmentDetailsHint')} onChange={(event) => setDetails(event.target.value)} /></div>{Boolean(error) && <ErrorMessage error={error} t={t} />}{!edit && maximum === null && error != null && <button type="button" onClick={() => setAttempt((value) => value + 1)}>{t('cemaris:retry')}</button>}<div className="actions"><button type="button" onClick={onClose}>{t('cancel')}</button><button className="primary" type="submit" disabled={!edit && maximum === null}>{busy && !edit ? l('uploading') : edit ? t('update') : l('upload')}</button></div></fieldset></form></Modal>
}
