import { createContext } from 'react'
import type { CurrentAccount } from '../types/identity'

export type AuthState = 'loading' | 'anonymous' | 'authenticated'

export interface AuthContextValue {
  state: AuthState
  account?: CurrentAccount
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  markAnonymous: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
