export type NoticeDraftStatus = 'Draft' | 'Discarded'

export interface NoticeDraftRevision {
  id: string
  resultingVersion: number
  mutationType: string
  reason: string | null
  occurredAtUtc: string
  actorId: string
  actorDisplayName: string
  caseId: string
  payerPartyId: string
  payerDisplayNameSnapshot: string
  noticeNumber: string
  assignmentYear: number
  runningNumber: number
  noticeNumberConfigurationId: string
  noticeNumberConfigurationVersion: number
  financialProductSnapshot: string
  runningNumberWidthSnapshot: number
  amountMode?: 'LegacyTotal' | 'LineItems'
  totalAmountExact?: string
  lineItems?: NoticeDraftLineItem[]
  totalAmount: number
  currency: string
  noticeDate: string
  dueDate: string
  accountAssignment: string
  feeReasonOrSource: string
  status: NoticeDraftStatus
  createdAtUtc: string
  updatedAtUtc: string
}

export interface NoticeDraft {
  id: string
  caseId: string
  payerPartyId: string
  payerDisplayNameSnapshot: string
  noticeNumber: string
  assignmentYear: number
  runningNumber: number
  noticeNumberConfigurationId: string
  noticeNumberConfigurationVersion: number
  financialProductSnapshot: string
  runningNumberWidthSnapshot: number
  amountMode?: 'LegacyTotal' | 'LineItems'
  totalAmountExact?: string
  lineItems?: NoticeDraftLineItem[]
  totalAmount: number
  currency: string
  noticeDate: string
  dueDate: string
  accountAssignment: string
  feeReasonOrSource: string
  status: NoticeDraftStatus
  version: number
  createdAtUtc: string
  updatedAtUtc: string
  revisions: NoticeDraftRevision[]
}

export type NoticeDraftListItem = Omit<NoticeDraft, 'assignmentYear' | 'runningNumber' | 'noticeNumberConfigurationId' | 'noticeNumberConfigurationVersion' | 'financialProductSnapshot' | 'runningNumberWidthSnapshot' | 'revisions'>

export interface NoticeNumberConfigurationRevision {
  id: string
  resultingVersion: number
  mutationType: string
  reason: string | null
  occurredAtUtc: string
  actorId: string
  actorDisplayName: string
  financialProduct: string
  runningNumberWidth: number
}

export interface NoticeNumberConfiguration {
  id: string
  financialProduct: string
  runningNumberWidth: number
  version: number
  createdAtUtc: string
  updatedAtUtc: string
  revisions: NoticeNumberConfigurationRevision[]
}

export interface LegalBasisVersion {
  id: string
  name: string
  versionDate: string
  isActive: boolean
  version: number
  createdAtUtc: string
  updatedAtUtc: string
}

export type NoticeGenerationFormat = 'Docx' | 'Pdf'

export interface NoticeDraftLineItem {
  id: string
  position: number
  description: string
  amountExact: string
}
