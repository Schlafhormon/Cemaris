export type SystemRole = 'Sachbearbeitung' | 'Administration'

export interface CurrentAccount {
  id: string
  username: string
  displayName: string
  role: SystemRole
  mustChangePassword: boolean
  firstName?: string | null
  lastName?: string | null
  contactPoint?: string | null
  room?: string | null
  phone?: string | null
  email?: string | null
}

export interface LocalAccount {
  id: string
  username: string
  displayName: string
  role: SystemRole
  isActive: boolean
  mustChangePassword: boolean
  createdAtUtc: string
  updatedAtUtc: string
  version: string
  firstName?: string | null
  lastName?: string | null
  contactPoint?: string | null
  room?: string | null
  phone?: string | null
  email?: string | null
}

export interface CreateAccountInput {
  username: string
  displayName: string
  role: SystemRole
  password: string
  firstName: string
  lastName: string
  contactPoint: string
  room: string
  phone: string
  email: string
}

export interface UpdateAccountInput {
  username: string
  displayName: string
  role: SystemRole
  version: string
  firstName: string
  lastName: string
  contactPoint: string
  room: string
  phone: string
  email: string
}
