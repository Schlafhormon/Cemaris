import { useEffect, useId, useRef, useState, type RefObject } from 'react'
import { ApiError } from '../api/cemarisApi'

export interface FormFeedbackState {
  title: string
  fields: Record<string, string[]>
  unknownFields: Array<{ field: string; messages: string[] }>
}

export function useFormFeedback(
  formRef: RefObject<HTMLFormElement | null>,
  fieldMap: Record<string, string | null>,
  onUnhandledError: (error: unknown) => void,
) {
  const [feedback, setFeedback] = useState<FormFeedbackState>()
  const summaryRef = useRef<HTMLDivElement>(null)
  const idPrefix = useId().replace(/:/g, '')

  useEffect(() => {
    if (!feedback) return
    const firstField = Object.keys(feedback.fields)[0]
    const control = firstField ? formRef.current?.elements.namedItem(firstField) : null
    if (control instanceof HTMLElement) control.focus()
    else summaryRef.current?.focus()
  }, [feedback, formRef])

  function clear() {
    setFeedback(undefined)
  }

  function report(error: unknown) {
    if (!(error instanceof ApiError)) {
      setFeedback({
        title: error instanceof Error ? error.message : 'Die Aktion konnte nicht ausgeführt werden.',
        fields: {},
        unknownFields: [],
      })
      return
    }

    if (error.status === 412) {
      onUnhandledError(error)
      return
    }

    const fields: Record<string, string[]> = {}
    const unknownFields: Array<{ field: string; messages: string[] }> = []
    const serverEntries = Object.entries(error.fieldErrors)
    const handled = new Set<string>()
    for (const [configuredField, targetField] of Object.entries(fieldMap)) {
      const match = serverEntries.find(([serverField]) => serverField.toLocaleLowerCase() === configuredField.toLocaleLowerCase())
      if (!match) continue
      handled.add(match[0])
      if (targetField === null) unknownFields.push({ field: match[0], messages: match[1] })
      else fields[targetField] = [...(fields[targetField] ?? []), ...match[1]]
    }
    for (const [serverField, messages] of serverEntries) {
      if (!handled.has(serverField)) unknownFields.push({ field: serverField, messages })
    }

    setFeedback({ title: error.message, fields, unknownFields })
  }

  function fieldProps(name: string) {
    const messages = feedback?.fields[name]
    return messages?.length
      ? { 'aria-invalid': true as const, 'aria-describedby': `${idPrefix}-${name}-errors` }
      : {}
  }

  function fieldErrors(name: string) {
    const messages = feedback?.fields[name]
    return messages?.length
      ? <span className="field-error" id={`${idPrefix}-${name}-errors`}>{messages.join(' ')}</span>
      : null
  }

  return { clear, feedback, fieldErrors, fieldProps, report, summaryRef }
}
