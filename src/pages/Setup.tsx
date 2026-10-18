import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'
import { Badge, Button, Card, SectionTitle, cn } from '../components/ui'
import { IconAlert, IconCheck, IconSpark } from '../components/icons'

type CheckState = 'pending' | 'ok' | 'fail' | 'skip'
type Check = {
  id: string
  title: string
  detail?: string
  fix?: string
  state: CheckState
  required?: boolean
}

const TABLES = [
  'profiles',
  'counselor_students',
  'parent_students',
  'invites',
  'plans',
  'plan_items',
  'tasks',
  'checkins',
  'sessions',
  'feedback',
  'exams',
  'exam_subjects',
  'mistakes',
  'plan_templates',
  'task_templates',
]

/**
 * صفحه‌ی «بررسی راه‌اندازی» — برای اینکه بدون حدس‌زدن بفهمی Supabase درست وصل شده یا نه.
 * آدرس: /setup  (نیاز به ورود ندارد)
 */
export function SetupPage() {
  const [checks, setChecks] = useState<Check[]>([])
  const [running, setRunning] = useState(false)

  const set = (id: string, patch: Partial<Check>) =>
    setChecks((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)))

  const run = useCallback(async () => {
    setRunning(true)
    const list: Check[] = [
      { id: 'env', title: 'متغیرهای محیطی (VITE_SUPABASE_URL / ANON_KEY)', state: 'pending', required: true },
      { id: 'reach', title: 'دسترسی به پروژه‌ی Supabase', state: 'pending' },
      { id: 'auth', title: 'تنظیمات ورود (ثبت‌نام فعال باشد)', state: 'pending' },
      { id: 'tables', title: 'جدول‌ها ساخته شده‌اند (۳ مایگریشن)', state: 'pending', required: true },
      { id: 'rpc', title: 'توابع دعوت و قالب (create_invite / redeem_invite)', state: 'pending' },
      { id: 'fn', title: 'تابع ثبت‌نام بدون ایمیل (phone-signup)', state: 'pending' },
      { id: 'key', title: 'کلیدهای عمومی درست است (نه service_role)', state: 'pending', required: true },
    ]
    setChecks(list)

    // ۱) متغیرهای محیطی
    if (!isSupabaseConfigured || !supabase) {
      set('env', {
        state: 'fail',
        detail: 'اپ در حالت دمو است، چون فایل .env ساخته نشده یا خالی است.',
        fix: 'فایل .env.example را به .env کپی کن، مقادیر Project URL و anon key را بگذار و سرور را دوباره اجرا کن (npm run dev).',
      })
      ;['reach', 'auth', 'tables', 'rpc', 'fn', 'key'].forEach((id) => set(id, { state: 'skip', detail: 'تا وقتی .env تنظیم نشده قابل بررسی نیست.' }))
      setRunning(false)
      return
    }
    const url = (import.meta.env.VITE_SUPABASE_URL || '').trim()
    const key = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()
    const jwtRole = (() => {
      try {
        const payload = JSON.parse(atob(key.split('.')[1] || ''))
        return payload.role as string
      } catch {
        return ''
      }
    })()
    set('env', { state: 'ok', detail: `آدرس پروژه: ${url}` })
    set('key', {
      state: jwtRole === 'service_role' ? 'fail' : 'ok',
      detail: jwtRole ? `نوع کلید: ${jwtRole}` : 'کلید در قالب جدید (publishable) است — مشکلی ندارد.',
      fix: jwtRole === 'service_role' ? 'این کلید اجازه‌ی دور زدن همه‌ی قوانین را دارد. کلید anon/publishable را در .env بگذار.' : undefined,
    })

    // ۲) دسترسی
    try {
      const res = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const settings = await res.json()
      set('reach', { state: 'ok', detail: `پاسخ ${res.status} از ${new URL(url).host}` })
      const emailOn = settings.external?.email !== false
      set('auth', {
        state: emailOn ? 'ok' : 'fail',
        detail: emailOn ? 'ورود با ایمیل/رمز فعال است (ما شماره را به ایمیل داخلی نگاشت می‌کنیم).' : 'ورود با ایمیل خاموش است.',
        fix: emailOn ? undefined : 'Authentication → Sign In / Providers → Email را روشن کن.',
      })
    } catch (e: any) {
      set('reach', { state: 'fail', detail: String(e?.message || e), fix: 'آدرس پروژه یا اینترنت را بررسی کن (از ایران ممکن است به VPN نیاز باشد).' })
      set('auth', { state: 'skip' })
    }

    // ۳) جدول‌ها
    try {
      const sb = supabase
      const missing: string[] = []
      for (const t of TABLES) {
        const { error } = await sb.from(t).select('*', { count: 'exact', head: true })
        if (error) missing.push(t)
      }
      if (missing.length === 0) set('tables', { state: 'ok', detail: `همه‌ی ${TABLES.length} جدول پاسخ دادند.` })
      else
        set('tables', {
          state: 'fail',
          detail: `این جدول‌ها پیدا نشد: ${missing.join('، ')}`,
          fix: 'در Supabase → SQL Editor این سه فایل را به ترتیب اجرا کن: 0001_init.sql، 0002_assessments_templates.sql، 0003_parent_share.sql (+ 0004_invite_privacy.sql).',
        })
    } catch (e: any) {
      set('tables', { state: 'fail', detail: String(e?.message || e) })
    }

    // ۴) توابع (بدون ورود، تابع خطای «ورود لازم است» می‌دهد؛ همین نشانه‌ی وجودش است)
    try {
      const { error } = await supabase.rpc('create_invite', { p_role: 'student', p_student: null, p_note: null })
      const msg = error?.message || ''
      if (/could not find the function|does not exist|schema cache/i.test(msg))
        set('rpc', {
          state: 'fail',
          detail: msg,
          fix: 'مایگریشن 0001 را کامل اجرا کن (بخش ۸: RPC ساخت کد دعوت و استفاده از کد).',
        })
      else if (/ورود لازم است|JWT|not authenticated/i.test(msg))
        set('rpc', { state: 'ok', detail: 'تابع وجود دارد و درست هم محافظت شده (بدون ورود اجازه نمی‌دهد).' })
      else set('rpc', { state: 'ok', detail: msg || 'بدون خطا پاسخ داد.' })
    } catch (e: any) {
      set('rpc', { state: 'fail', detail: String(e?.message || e) })
    }

    // ۵) تابع Edge
    try {
      const { data, error } = await supabase.functions.invoke('phone-signup', {
        body: { email: 'setup-check@example.com', password: 'x' },
      })
      if (error) {
        set('fn', {
          state: 'fail',
          detail: error.message || 'درخواست ناموفق',
          fix: 'تابع phone-signup را در Supabase → Edge Functions بساز و کدش را پیست کن؛ گزینه‌ی Verify JWT را خاموش کن. اگر نمی‌خواهی دیپلوی کنی، در Authentication گزینه‌ی Confirm email را خاموش کن.',
        })
      } else if (data && (data as any).ok === false) {
        set('fn', { state: 'ok', detail: `تابع فعال است (پاسخ کنترل‌شده: ${(data as any).error})` })
      } else {
        set('fn', { state: 'ok', detail: 'تابع پاسخ داد.' })
      }
    } catch (e: any) {
      set('fn', { state: 'fail', detail: String(e?.message || e) })
    }

    setRunning(false)
  }, [])

  useEffect(() => {
    run()
  }, [run])

  const failed = checks.filter((c) => c.state === 'fail')
  const report = checks
    .map((c) => `${c.state === 'ok' ? '✅' : c.state === 'fail' ? '❌' : '➖'} ${c.title}${c.detail ? ` — ${c.detail}` : ''}`)
    .join('\n')

  return (
    <div className="min-h-screen bg-[#f6f7fb] p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-600 grid place-items-center text-white font-black text-xl">ر</div>
            <div>
              <p className="font-black text-slate-800">بررسی راه‌اندازی</p>
              <p className="text-[11px] text-slate-500">اتصال اپ به Supabase و آماده‌بودن جدول‌ها</p>
            </div>
          </div>
          <Link to="/login" className="text-xs text-brand-700 font-bold">
            بازگشت به ورود
          </Link>
        </div>

        <Card>
          <SectionTitle
            title={failed.length === 0 ? 'همه‌چیز آماده است 🎉' : `${failed.length} مورد نیاز به رسیدگی دارد`}
            subtitle="اگر همه سبز شد، می‌توانی ثبت‌نام واقعی کنی و اپ را روی Netlify منتشر کنی."
            icon={<IconSpark className="w-4 h-4" />}
            action={
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={run} disabled={running}>
                  {running ? 'در حال بررسی…' : 'بررسی دوباره'}
                </Button>
                <Button
                  size="sm"
                  variant="soft"
                  onClick={() => {
                    navigator.clipboard?.writeText(report)
                  }}
                >
                  کپی گزارش
                </Button>
              </div>
            }
          />

          <div className="space-y-2.5">
            {checks.map((c) => (
              <div
                key={c.id}
                className={cn(
                  'border rounded-2xl p-3',
                  c.state === 'ok' && 'border-emerald-200 bg-emerald-50/60',
                  c.state === 'fail' && 'border-rose-200 bg-rose-50/60',
                  (c.state === 'pending' || c.state === 'skip') && 'border-slate-200 bg-slate-50',
                )}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={cn(
                      'w-7 h-7 rounded-lg grid place-items-center shrink-0 text-white',
                      c.state === 'ok' ? 'bg-emerald-500' : c.state === 'fail' ? 'bg-rose-500' : 'bg-slate-300',
                    )}
                  >
                    {c.state === 'ok' ? <IconCheck className="w-4 h-4" /> : c.state === 'fail' ? <IconAlert className="w-4 h-4" /> : <span className="text-xs">…</span>}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-slate-800">{c.title}</p>
                      {c.required && <Badge tone="rose">ضروری</Badge>}
                      {c.state === 'skip' && <Badge tone="slate">بررسی نشد</Badge>}
                    </div>
                    {c.detail && <p className="text-[11px] text-slate-600 mt-1 leading-5 break-words">{c.detail}</p>}
                    {c.state === 'fail' && c.fix && (
                      <p className="text-[11px] text-rose-800 mt-1.5 bg-white border border-rose-100 rounded-xl p-2 leading-5">راه‌حل: {c.fix}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {checks.length === 0 && <p className="text-xs text-slate-400 text-center py-6">در حال بررسی…</p>}
          </div>
        </Card>

        <Card>
          <SectionTitle title="مسیر پیشنهادی انتشار" subtitle="به همین ترتیب، هر مرحله کوتاه است" />
          <ol className="text-[11px] text-slate-700 space-y-2 leading-6 list-decimal pr-4">
            <li>پروژه در Supabase ساخته شود و سه/چهار مایگریشن اجرا شود.</li>
            <li>فایل <code className="bg-slate-100 px-1 rounded">.env</code> محلی پر شود و همین صفحه سبز شود.</li>
            <li>پروژه در GitHub Desktop کامیت و Publish شود.</li>
            <li>Netlify از همان مخزن بسازد و دو متغیر محیطی را بگیرد.</li>
            <li>بعد از Deploy، آدرس سایت را در Supabase → Authentication → URL Configuration بگذار.</li>
            <li>دو حساب آزمایشی (مشاور و دانش‌آموز) بساز و جدایی داده‌ها را بسنج.</li>
          </ol>
        </Card>
      </div>
    </div>
  )
}
