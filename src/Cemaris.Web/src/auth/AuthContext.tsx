import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import {
  ApiError,
  getCurrentAccount,
  login as apiLogin,
  logout as apiLogout,
  setUnauthorizedHandler,
} from '../api/cemarisApi'
import type { CurrentAccount } from '../types/identity'
import { AuthContext, type AuthState } from './authContextValue'

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>('loading')
  const [account, setAccount] = useState<CurrentAccount>()

  const markAnonymous = useCallback(() => {
    setAccount(undefined)
    setState('anonymous')
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(markAnonymous)
    const controller = new AbortController()
    getCurrentAccount(controller.signal)
      .then((current) => {
        setAccount(current)
        setState('authenticated')
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
        markAnonymous()
      })
    return () => {
      controller.abort()
      setUnauthorizedHandler(undefined)
    }
  }, [markAnonymous])

  const login = useCallback(async (username: string, password: string) => {
    const current = await apiLogin(username, password)
    setAccount(current)
    setState('authenticated')
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) {
        throw error
      }
    } finally {
      markAnonymous()
    }
  }, [markAnonymous])

  const value = useMemo(
    () => ({ state, account, login, logout, markAnonymous }),
    [state, account, login, logout, markAnonymous],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
