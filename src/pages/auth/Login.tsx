import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../../store/AppContext'
import { Button, Card, Field, Input } from '../../components/ui'
import { DEMO_ACCOUNTS, resetDemoData } from '../../lib/demoBackend'
import { homePath } from '../../App'
import { faNum } from '../../lib/jalali'

export function Login() {
  const { signIn, mode, toast } = useApp()
  const nav = useNavigate()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const p = await signIn(phone, password)
      toast(`${p.fullName} خوش آمدی 👋`, 'ok')
      nav(homePath(p.role))
    } catch (err: any) {
      setError(err?.message || 'ورود ناموفق بود')
    } finally {
      setBusy(false)
    }
  }

  const quick = async (idx: number) => {
    const a = DEMO_ACCOUNTS[idx]
    setPhone(a.phone)
    setPassword(a.password)
    setBusy(true)
    try {
      const p = await signIn(a.phone, a.password)
      nav(homePath(p.role))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* ستون برند */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-brand-700 via-brand-600 to-violet-600 text-white p-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/15 grid place-items-center font-black text-xl backdrop-blur">ر</div>
          <div>
            <p className="font-black text-lg">رادمهر</p>
            <p className="text-xs text-white/70">پلتفرم مشاوره‌ی تحصیلی و روان‌شناختی</p>
          </div>
        </div>

        <div className="space-y-6 max-w-md">
          <h2 className="text-3xl font-black leading-[1.6]">با هم برنامه‌ای متناسب با خودمان می‌نویسیم تا زندگی را بهتر کنیم.</h2>
          <p className="text-sm text-white/80 leading-7">
            یک فضای مشترک برای مشاهده، ویرایش، تأیید و ثبت بازخورد روی برنامه‌های درسی و تمرین‌های روانی — با پیگیری روزانه و
            گزارش برای والدین.
          </p>
          <ul className="space-y-3 text-sm">
            {[
              'برنامه‌ی هفتگی و روزانه با تأیید دوطرفه',
              'چک‌این حال، انرژی و تمرکز + دفترچه‌ی مشاور',
              'تمرین‌ها و تکالیف با بازخورد مشاور',
              'نمای والدین (خواندنی) و گفت‌وگوی امن',
            ].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/20 grid place-items-center text-[11px]">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[11px] text-white/60">ساخته‌شده برای ایران · فارسی و راست‌به‌چپ · موبایل‌محور</p>
      </div>

      {/* فرم */}
      <div className="flex items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-brand-600 grid place-items-center text-white font-black text-xl">ر</div>
            <div>
              <p className="font-black text-slate-800">رادمهر</p>
              <p className="text-[11px] text-slate-500">مشاوره‌ی تحصیلی و روان‌شناختی</p>
            </div>
          </div>

          <h1 className="text-xl font-black text-slate-800">ورود به حساب</h1>
          <p className="text-xs text-slate-500 mt-1 mb-5">با شماره موبایل و رمز عبور وارد شوید.</p>

          <form onSubmit={submit} className="space-y-4">
            <Field label="شماره موبایل">
              <Input
                dir="ltr"
                inputMode="tel"
                placeholder="0912xxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="username"
              />
            </Field>
            <Field label="رمز عبور">
              <Input
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </Field>

            {error && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{error}</p>}

            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? 'در حال ورود…' : 'ورود'}
            </Button>
          </form>

          <p className="text-xs text-slate-500 mt-4 text-center">
            حساب ندارید؟{' '}
            <Link to="/signup" className="text-brand-700 font-bold">
              ثبت‌نام کنید
            </Link>
          </p>
          <p className="text-[11px] text-center mt-2">
            <Link to="/setup" className="text-slate-500 underline">
              بررسی اتصال به Supabase (صفحه‌ی راه‌اندازی)
            </Link>
          </p>

          {mode === 'demo' && (
            <Card className="mt-6 bg-slate-50/70">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-700">ورود سریع با حساب‌های نمونه</p>
                <button
                  className="text-[10px] text-slate-500 underline"
                  onClick={() => {
                    resetDemoData()
                    toast('داده‌های نمونه بازنشانی شد', 'ok')
                  }}
                >
                  بازنشانی داده‌ها
                </button>
              </div>
              <div className="space-y-1.5">
                {DEMO_ACCOUNTS.map((a, i) => (
                  <button
                    key={a.phone}
                    onClick={() => quick(i)}
                    disabled={busy}
                    className="w-full flex items-center justify-between text-right text-[11px] bg-white border border-slate-200 rounded-xl px-3 py-2 hover:border-brand-300 transition"
                  >
                    <span className="font-medium text-slate-700">{a.name}</span>
                    <span dir="ltr" className="text-slate-400">
                      {faNum(a.phone)} / {faNum(a.password)}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 mt-2 leading-5">
                در حالت دمو همه‌چیز داخل همین مرورگر ذخیره می‌شود؛ بعد از اتصال به Supabase، حساب‌های واقعی جای این‌ها را می‌گیرند.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
