import type { Backend } from './backend'
import { DemoBackend } from './demoBackend'
import { SupabaseBackend } from './supabaseBackend'
import { isSupabaseConfigured } from './supabaseClient'

let instance: Backend | null = null

export function getBackend(): Backend {
  if (!instance) instance = isSupabaseConfigured ? new SupabaseBackend() : new DemoBackend()
  return instance
}

export { isSupabaseConfigured }
export * from './backend'
export * from './types'
export * from './jalali'
