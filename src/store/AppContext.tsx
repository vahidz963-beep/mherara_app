import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getBackend, isSupabaseConfigured } from '../lib'
import type { Backend, SignUpInput } from '../lib/backend'
import type { Profile } from '../lib/types'

type Toast = { id: number; text: string; tone: 'ok' | 'err' | 'info' }

type Ctx = {
  backend: Backend
  mode: 'demo' | 'supabase'
  profile: Profile | null
  ready: boolean
  signIn: (phone: string, password: string) => Promise<Profile>
  signUp: (input: SignUpInput) => Promise<Profile>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  toast: (text: string, tone?: Toast['tone']) => void
  toasts: Toast[]
}

const AppCtx = createContext<Ctx>(null as unknown as Ctx)

export function AppProvider({ children }: { children: ReactNode }) {
  const backend = useMemo(() => getBackend(), [])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [ready, setReady] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((text: string, tone: Toast['tone'] = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, text, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200)
  }, [])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const p = await backend.currentProfile()
        if (alive) setProfile(p)
      } finally {
        if (alive) setReady(true)
      }
    })()
    return () => {
      alive = false
    }
  }, [backend])

  const refreshProfile = useCallback(async () => {
    const p = await backend.currentProfile()
    setProfile(p)
  }, [backend])

  const value: Ctx = {
    backend,
    mode: isSupabaseConfigured ? 'supabase' : 'demo',
    profile,
    ready,
    signIn: async (phone, password) => {
      const p = await backend.signIn(phone, password)
      setProfile(p)
      return p
    },
    signUp: async (input) => {
      const p = await backend.signUp(input)
      setProfile(p)
      return p
    },
    signOut: async () => {
      await backend.signOut()
      setProfile(null)
    },
    refreshProfile,
    toast,
    toasts,
  }

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export const useApp = () => useContext(AppCtx)
