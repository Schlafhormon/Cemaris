export type SystemRole = 'Sachbearbeitung' | 'Administration'

export interface CurrentAccount {
  id: string
  username: string
  displayName: string
  role: SystemRole
  mustChangePassword: boolean
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
}

export interface CreateAccountInput {
  username: string
  displayName: string
  role: SystemRole
  password: string
}

export interface UpdateAccountInput {
  username: string
  displayName: string
  role: SystemRole
  version: string
}
