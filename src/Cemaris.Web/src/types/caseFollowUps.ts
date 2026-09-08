import type { GraveDetails } from './cases'

export type CaseFollowUpStatus = 'Open' | 'Completed' | 'Cancelled'
export type CaseFollowUpAction = 'change' | 'complete' | 'cancel' | 'reopen'
export interface CaseFollowUpState {
  id: string
  caseId: string
  title: string
  description: string | null
  dueDate: string
  status: CaseFollowUpStatus
  version: number
  createdAtUtc: string
  updatedAtUtc: string
}
export interface CaseFollowUpRevision {
  id: string
  state: CaseFollowUpState
  operation: 'Created' | 'Changed' | 'Completed' | 'Cancelled' | 'Reopened'
  reason: string | null
  actorId: string
  actorDisplayName: string
  occurredAtUtc: string
}
export interface CaseFollowUp { state: CaseFollowUpState; revisions: CaseFollowUpRevision[] }
export interface CaseFollowUpListItem {
  id: string
  caseId: string
  title: string
  dueDate: string
  status: CaseFollowUpStatus
  grave: GraveDetails
}
export interface CaseFollowUpPage {
  items: CaseFollowUpListItem[]
  totalMatches: number
  page: number
  pageSize: number
  totalPages: number
}
export interface CaseFollowUpInput { title: string; description: string; dueDate: string }
