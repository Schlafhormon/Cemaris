import type { RefObject } from 'react'
import type { FormFeedbackState } from './useFormFeedback'

export function FormErrorSummary({ feedback, summaryRef }: {
  feedback: FormFeedbackState | undefined
  summaryRef: RefObject<HTMLDivElement | null>
}) {
  if (!feedback) return null

  return (
    <div className="form-error-summary" ref={summaryRef} role="alert" tabIndex={-1}>
      <strong>{feedback.title}</strong>
      {feedback.unknownFields.length > 0 && (
        <ul>
          {feedback.unknownFields.flatMap(({ field, messages }) => messages.map((message, index) => (
            <li key={`${field}-${index}`}>{field}: {message}</li>
          ))) }
        </ul>
      )}
    </div>
  )
}
