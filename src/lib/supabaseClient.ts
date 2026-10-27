import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { normalizePhone } from './backend'

const url = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

export const isSupabaseConfigured = Boolean(url && anon && url.startsWith('http'))

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null

/**
 * ورود با «شماره موبایل + رمز عبور» بدون نیاز به پیامک.
 * Supabase برای ورود با رمز به ایمیل نیاز دارد؛ ما شماره را به یک ایمیل داخلی و
 * یکتا نگاشت می‌کنیم و هرگز ایمیلی ارسال نمی‌شود.
 */
export const phoneToEmail = (phone: string) => `${normalizePhone(phone).replace(/^0+/, '')}@phone.radmehr.app`
