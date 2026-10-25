import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../../store/AppContext'
import { Button, Card, Field, Input, Select, Segmented } from '../../components/ui'
import { isValidPhone } from '../../lib/backend'
import { homePath } from '../../App'
import type { Role } from '../../lib/types'

const GRADES = ['هفتم', 'هشتم', 'نهم', 'دهم', 'یازدهم', 'دوازدهم', 'کنکوری', 'فارغ‌التحصیل']
const FIELDS = ['علوم تجربی', 'ریاضی و فیزیک', 'علوم انسانی', 'فنی و حرفه‌ای', 'هنر', 'عمومی']

export function Signup() {
  const { signUp, toast } = useApp()
  const nav = useNavigate()
  const [role, setRole] = useState<Role>('student')
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    password: '',
    grade: 'دوازدهم',
    field: 'علوم تجربی',
    school: '',
    relation: 'مادر',
    childCode: '',
    inviteCode: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!isValidPhone(form.phone)) {
      setError('شماره موبایل را به شکل 09xxxxxxxxx وارد کنید')
      return
    }
    if (form.password.length < 6) {
      setError('رمز عبور باید حداقل ۶ کاراکتر باشد')
      return
    }
    if (!form.fullName.trim()) {
      setError('نام و نام خانوادگی را وارد کنید')
      return
    }
    if (role === 'counselor' && !form.inviteCode.trim()) {
      setError('ثبت‌نام مشاور فقط با کد دعوت مدیر رادمهر امکان‌پذیر است')
      return
    }
    setBusy(true)
    try {
      const p = await signUp({ ...form, role })
      toast('حساب شما ساخته شد 🎉', 'ok')
      nav(homePath(p.role))
    } catch (err: any) {
      setError(err?.message || 'ثبت‌نام ناموفق بود')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-5 bg-gradient-to-b from-brand-50 to-[#f6f7fb]">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-5 justify-center">
          <div className="w-11 h-11 rounded-2xl bg-brand-600 grid place-items-center text-white font-black text-xl">ر</div>
          <div>
            <p className="font-black text-slate-800">رادمهر</p>
            <p className="text-[11px] text-slate-500">ساخت حساب جدید</p>
          </div>
        </div>

        <Card className="shadow-md">
          <div className="mb-4">
            <p className="text-xs font-medium text-slate-600 mb-2">من کی هستم؟</p>
            <Segmented
              value={role}
              onChange={(v) => setRole(v)}
              options={[
                { value: 'student' as Role, label: 'دانش‌آموز' },
                { value: 'counselor' as Role, label: 'مشاور (با کد مدیر)' },
                { value: 'parent' as Role, label: 'والد' },
              ]}
            />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <Field label="نام و نام خانوادگی">
              <Input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="مثلاً علی محمدی" />
            </Field>

            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="شماره موبایل">
                <Input dir="ltr" inputMode="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="0912xxxxxxx" />
              </Field>
              <Field label="رمز عبور" hint="حداقل ۶ کاراکتر">
                <Input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} />
              </Field>
            </div>

            {role === 'student' && (
              <>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="پایه">
                    <Select value={form.grade} onChange={(e) => set('grade', e.target.value)}>
                      {GRADES.map((g) => (
                        <option key={g}>{g}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="رشته">
                    <Select value={form.field} onChange={(e) => set('field', e.target.value)}>
                      {FIELDS.map((g) => (
                        <option key={g}>{g}</option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Field label="مدرسه (اختیاری)">
                  <Input value={form.school} onChange={(e) => set('school', e.target.value)} placeholder="نام دبیرستان" />
                </Field>
                <Field label="کد دعوت مشاور (اختیاری)" hint="اگر مشاورت کد دعوت داده، اینجا وارد کن تا پرونده‌ات به او وصل شود">
                  <Input dir="ltr" value={form.inviteCode} onChange={(e) => set('inviteCode', e.target.value.toUpperCase())} placeholder="مثلاً ALI1405" />
                </Field>
              </>
            )}

            {role === 'parent' && (
              <>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="نسبت با دانش‌آموز">
                    <Select value={form.relation} onChange={(e) => set('relation', e.target.value)}>
                      {['مادر', 'پدر', 'سرپرست', 'سایر'].map((g) => (
                        <option key={g}>{g}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="شماره موبایل دانش‌آموز">
                    <Input dir="ltr" value={form.childCode} onChange={(e) => set('childCode', e.target.value)} placeholder="0912xxxxxxx" />
                  </Field>
                </div>
                <p className="text-[11px] text-slate-500 leading-5 bg-slate-50 border border-slate-200 rounded-xl p-3">
                  والدین فقط <b>مشاهده‌کننده</b> هستند: برنامه، وضعیت مطالعه و خلاصه‌ی جلسات را می‌بینند ولی نمی‌توانند برنامه را
                  تغییر دهند. اگر می‌خواهید فرزندتان نتواند برخی جزئیات را ببیند، در پروفایل تنظیمات حریم خصوصی را ببینید.
                </p>
              </>
            )}

            {role === 'counselor' && (
              <>
                <Field label="کد دعوت مشاور (الزامی)" hint="این کد را مدیر رادمهر به شما می‌دهد؛ اعتبار آن محدود و یک‌بارمصرف است">
                  <Input
                    dir="ltr"
                    value={form.inviteCode}
                    onChange={(e) => set('inviteCode', e.target.value.toUpperCase())}
                    placeholder="مثلاً K7QF2M"
                  />
                </Field>
                <p className="text-[11px] text-slate-500 leading-5 bg-slate-50 border border-slate-200 rounded-xl p-3">
                  بدون کد مدیر، حساب مشاور ساخته نمی‌شود. بعد از ثبت‌نام، می‌توانی کد دعوت دانش‌آموزان خودت را بسازی.
                </p>
              </>
            )}

            {error && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{error}</p>}

            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? 'در حال ثبت‌نام…' : 'ساخت حساب'}
            </Button>
          </form>

          <p className="text-xs text-slate-500 mt-4 text-center">
            حساب دارید؟{' '}
            <Link to="/login" className="text-brand-700 font-bold">
              وارد شوید
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
