import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { loadRefreshToken, saveRefreshToken, clearRefreshToken } from './storage'
import * as client from './client'
import type { User } from './client'
import { makeAuthFetch, type AuthFetch } from './authFetch'

export type SessionStatus = 'loading' | 'authed' | 'anon'
export type Session = {
  status: SessionStatus
  user: User | null
  accessToken: string | null
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: 'invalid_credentials' | 'network' }>
  logout: () => Promise<void>
  authFetch: AuthFetch
}

const Ctx = createContext<Session | null>(null)
export function useSession(): Session {
  const s = useContext(Ctx)
  if (!s) throw new Error('useSession must be used within <SessionProvider>')
  return s
}

export function SessionProvider({ identityBaseUrl, handoffCode, children }: { identityBaseUrl: string; handoffCode?: string; children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading')
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const accessRef = useRef<string | null>(null)
  const booted = useRef(false)

  function setAccess(t: string | null) { accessRef.current = t; setAccessToken(t) }

  async function adopt(tokens: client.Tokens): Promise<boolean> {
    saveRefreshToken(tokens.refresh)
    setAccess(tokens.access)
    const me = await client.fetchMe(identityBaseUrl, tokens.access)
    if (!me.ok) return false
    setUser(me.user)
    return true
  }

  function reset() {
    clearRefreshToken(); setAccess(null); setUser(null); setStatus('anon')
  }

  // Single-flight refresh used by authFetch and boot.
  async function doRefresh(): Promise<string | null> {
    const rt = loadRefreshToken()
    if (!rt) { reset(); return null }
    const r = await client.refresh(identityBaseUrl, rt)
    if (!r.ok) { reset(); return null }
    saveRefreshToken(r.tokens.refresh)
    setAccess(r.tokens.access)
    return r.tokens.access
  }

  const authFetchRef = useRef<AuthFetch>(makeAuthFetch(() => accessRef.current, doRefresh))

  useEffect(() => {
    if (booted.current) return // StrictMode double-invoke guard
    booted.current = true
    void (async () => {
      const rt = loadRefreshToken()
      if (rt) {
        const r = await client.refresh(identityBaseUrl, rt)
        if (r.ok && (await adopt(r.tokens))) setStatus('authed')
        else reset()
        return
      }
      // no stored session on this origin — accept a one-time SSO handoff code if the launcher passed one
      if (handoffCode) {
        const ex = await client.exchangeHandoff(identityBaseUrl, handoffCode)
        if (ex.ok && (await adopt(ex.tokens))) { setStatus('authed'); return }
      }
      setStatus('anon')
    })()
  }, [identityBaseUrl, handoffCode])

  async function login(email: string, password: string) {
    const r = await client.login(identityBaseUrl, email, password)
    if (!r.ok) return r
    if (await adopt(r.tokens)) { setStatus('authed'); return { ok: true as const } }
    reset(); return { ok: false as const, error: 'network' as const }
  }

  async function logout() {
    const rt = loadRefreshToken()
    if (rt) await client.logout(identityBaseUrl, rt)
    reset()
  }

  const value: Session = { status, user, accessToken, login, logout, authFetch: authFetchRef.current }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
