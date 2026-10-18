import { useState } from 'react'
import { useApp } from '../store/AppContext'
import { useAsync } from '../store/hooks'
import { Avatar, Badge, Button, Card, Field, Input, SectionTitle, Select, Spinner, Textarea } from '../components/ui'
import { ROLE_LABEL } from '../lib/types'
import { faDate, faNum } from '../lib/jalali'
import { IconUser } from '../components/icons'
import type { Profile } from '../lib/types'

const GRADES = ['هفتم', 'هشتم', 'نهم', 'دهم', 'یازدهم', 'دوازدهم', 'کنکوری', 'فارغ‌التحصیل']
const FIELDS = ['علوم تجربی', 'ریاضی و فیزیک', 'علوم انسانی', 'فنی و حرفه‌ای', 'هنر', 'عمومی']

export function ProfilePage() {
  const { backend, profile, refreshProfile, toast } = useApp()
  const { data, loading, reload } = useAsync(
    async () => {
      const me = await backend.getProfile(profile!.id)
      const counselor = me?.counselorId ? await backend.getProfile(me.counselorId) : null
      const children = me?.role === 'parent' ? await backend.listChildren(me.id) : []
      const students = me?.role === 'counselor' ? await backend.listStudents(me.id) : []
      return { me: me as Profile, counselor: counselor as Profile | null, children, students }
    },
    [backend, profile?.id],
    { me: null as Profile | null, counselor: null as Profile | null, children: [] as Profile[], students: [] as Profile[] },
  )

  const [form, setForm] = useState({ fullName: '', grade: '', field: '', school: '', bio: '' })
  const [pw, setPw] = useState('')
  const [loadedId, setLoadedId] = useState('')

  if (loading) return <Spinner />
  const me = data.me
  if (!me) return null

  if (loadedId !== me.id) {
    setLoadedId(me.id)
    setForm({ fullName: me.fullName, grade: me.grade || '', field: me.field || '', school: me.school || '', bio: me.bio || '' })
  }

  const save = async () => {
    try {
      await backend.updateProfile(me.id, form)
      await refreshProfile()
      toast('پروفایل ذخیره شد', 'ok')
      reload()
    } catch (e: any) {
      toast(e?.message || 'ذخیره نشد', 'err')
    }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <Card className="lg:col-span-1">
        <div className="flex flex-col items-center text-center py-2">
          <Avatar name={me.fullName} size={72} tone={me.role === 'counselor' ? 'violet' : me.role === 'parent' ? 'amber' : 'brand'} />
          <p className="font-black text-slate-800 mt-3">{me.fullName}</p>
          <Badge tone="brand" className="mt-1.5">{ROLE_LABEL[me.role]}</Badge>
          <p dir="ltr" className="text-xs text-slate-500 mt-2">{faNum(me.phone)}</p>
          <p className="text-[11px] text-slate-400 mt-1">عضویت از {faDate(me.createdAt.slice(0, 10))}</p>
        </div>

        <div className="mt-4 space-y-2 text-[11px] text-slate-600">
          {me.role === 'student' && data.counselor && (
            <p className="bg-violet-50 border border-violet-100 rounded-xl p-2.5">
              مشاور شما: <b>{data.counselor.fullName}</b>
            </p>
          )}
          {me.role === 'counselor' && (
            <p className="bg-brand-50 border border-brand-100 rounded-xl p-2.5">
              {faNum(data.students.length)} دانش‌آموز در پرونده‌ی شما
            </p>
          )}
          {me.role === 'parent' && (
            <p className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5">
              {data.children.length ? `فرزند متصل: ${data.children.map((c) => c.fullName).join('، ')}` : 'هنوز فرزندی متصل نشده'}
            </p>
          )}
        </div>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <SectionTitle title="تغییر رمز عبور" />
          <div className="space-y-2.5">
            <Field label="رمز عبور جدید" hint="حداقل ۶ کاراکتر">
              <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
            </Field>
            <Button
              variant="outline"
              className="w-full"
              disabled={pw.length < 6 || !backend.updatePassword}
              onClick={async () => {
                try {
                  await backend.updatePassword?.(pw)
                  setPw('')
                  toast('رمز عبور تغییر کرد', 'ok')
                } catch (e: any) {
                  toast(e?.message || 'تغییر رمز ناموفق بود', 'err')
                }
              }}
            >
              ذخیره‌ی رمز جدید
            </Button>
          </div>
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <SectionTitle title="اطلاعات من" subtitle="این اطلاعات را مشاور و والد (در حد لازم) می‌بینند" icon={<IconUser className="w-4 h-4" />} />
        <div className="space-y-4">
          <Field label="نام و نام خانوادگی">
            <Input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
          </Field>

          {me.role === 'student' && (
            <>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="پایه">
                  <Select value={form.grade} onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}>
                    <option value="">انتخاب کنید…</option>
                    {GRADES.map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="رشته">
                  <Select value={form.field} onChange={(e) => setForm((f) => ({ ...f, field: e.target.value }))}>
                    <option value="">انتخاب کنید…</option>
                    {FIELDS.map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="مدرسه">
                <Input value={form.school} onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))} />
              </Field>
            </>
          )}

          <Field label={me.role === 'counselor' ? 'معرفی و تخصص‌ها' : 'درباره‌ی من (اختیاری)'}>
            <Textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              placeholder={me.role === 'counselor' ? 'مثلاً: کارشناسی ارشد روان‌شناسی تربیتی، ۶ سال تجربه‌ی مشاوره‌ی کنکور' : 'چند خط درباره‌ی خودت…'}
            />
          </Field>

          <div className="flex justify-end">
            <Button onClick={save}>ذخیره‌ی تغییرات</Button>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-4">
          <p className="text-[11px] text-slate-500 leading-6">
            <b>حریم خصوصی:</b> خلاصه‌ی جلسه‌های مشاوره فقط برای مشاور ذخیره می‌شود. والدین «قدم‌های بعدی» و خلاصه‌ی وضعیت را می‌بینند، ولی
            محتوای حساس جلسه نه. اگر می‌خواهید برخی آیتم‌های برنامه برای والدین پنهان بماند، از گزینه‌ی «فقط مشاور» در تنظیمات برنامه
            استفاده کنید.
          </p>
        </div>
      </Card>
    </div>
  )
}
