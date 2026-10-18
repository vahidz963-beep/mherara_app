import { useEffect, useState } from 'react'
import { useApp } from '../../store/AppContext'
import { useAsync } from '../../store/hooks'
import { Badge, Button, Card, Field, Input, Rating, SectionTitle, Spinner, StatCard, Textarea } from '../../components/ui'
import { CheckinChart, Sparkline } from '../../components/CheckinChart'
import { addDaysIso, faDate, faNum, faRelative, todayIso } from '../../lib/jalali'
import type { Checkin } from '../../lib/types'
import { LEISURE_ITEMS, leisureCounts } from '../../lib/leisure'
import { IconCheck, IconHeart, IconSpark } from '../../components/icons'

const MOOD_WORDS = ['خیلی بد', 'بد', 'متوسط', 'خوب', 'خیلی خوب']

export function StudentCheckin() {
  const { backend, profile, toast } = useApp()
  const today = todayIso()
  const [form, setForm] = useState({
    mood: 3,
    energy: 3,
    focus: 3,
    studyMinutes: 120,
    sleepHours: 7,
    screenHours: 2,
    exerciseMinutes: 0,
    leisure: [] as string[],
    note: '',
  })
  const [busy, setBusy] = useState(false)

  const { data, loading, reload } = useAsync(async () => backend.listCheckins(profile!.id, 30), [backend, profile?.id], [] as Checkin[])

  useEffect(() => {
    const mine = data.find((c) => c.date === today)
    if (mine)
      setForm({
        mood: mine.mood,
        energy: mine.energy,
        focus: mine.focus,
        studyMinutes: mine.studyMinutes,
        sleepHours: mine.sleepHours,
        screenHours: mine.screenHours ?? 0,
        exerciseMinutes: mine.exerciseMinutes ?? 0,
        leisure: mine.leisure || [],
        note: mine.note || '',
      })
  }, [data, today])

  const save = async () => {
    setBusy(true)
    try {
      await backend.saveCheckin({ studentId: profile!.id, date: today, ...form })
      toast('چک‌این امروز ثبت شد ✅ مشاورت آن را می‌بیند', 'ok')
      reload()
    } catch (e: any) {
      toast(e?.message || 'ثبت نشد', 'err')
    } finally {
      setBusy(false)
    }
  }

  const avg = (f: 'mood' | 'energy' | 'focus') =>
    data.length ? (data.slice(0, 7).reduce((s, c) => s + c[f], 0) / Math.min(7, data.length)).toFixed(1) : '—'

  const week = data.slice(0, 7)
  const sleepAvg = week.length ? (week.reduce((s, c) => s + (c.sleepHours || 0), 0) / week.length).toFixed(1) : '—'
  const screenAvg = week.length ? (week.reduce((s, c) => s + (c.screenHours || 0), 0) / week.length).toFixed(1) : '—'
  const exerciseWeek = week.reduce((s, c) => s + (c.exerciseMinutes || 0), 0)
  const leisureWeek = leisureCounts(data, addDaysIso(today, -6), today)
  const leisureTotal = Object.values(leisureWeek).reduce((a, b) => a + b, 0)
  const toggleLeisure = (id: string) =>
    setForm((f) => ({ ...f, leisure: f.leisure.includes(id) ? f.leisure.filter((x) => x !== id) : [...f.leisure, id] }))

  if (loading) return <Spinner />

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="میانگین حال (۷ روز)" value={faNum(avg('mood'))} unit="از ۵" tone="brand" />
        <StatCard label="میانگین انرژی" value={faNum(avg('energy'))} unit="از ۵" tone="green" />
        <StatCard label="میانگین تمرکز" value={faNum(avg('focus'))} unit="از ۵" tone="violet" />
        <StatCard label="مطالعه‌ی ۷ روز اخیر" value={faNum(Math.round(week.reduce((s, c) => s + c.studyMinutes, 0) / 60))} unit="ساعت" tone="amber" />
        <StatCard label="میانگین خواب" value={faNum(sleepAvg)} unit="ساعت" tone="violet" />
        <StatCard
          label="میانگین فضای مجازی"
          value={faNum(screenAvg)}
          unit="ساعت در روز"
          tone={Number(screenAvg) >= 4 ? 'rose' : 'amber'}
        />
        <StatCard label="ورزش ۷ روز اخیر" value={faNum(exerciseWeek)} unit="دقیقه" tone="green" />
        <StatCard label="تفریح سالم (۷ روز)" value={faNum(leisureTotal)} unit="تیک" tone="brand" />
      </div>

      <Card>
        <SectionTitle title={`چک‌این ${faDate(today, { withWeekday: true })}`} subtitle="یک دقیقه وقت بگذار؛ این داده به مشاورت کمک می‌کند برنامه را با حال تو تنظیم کند" icon={<IconHeart className="w-4 h-4" />} />

        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-600">حال کلی امروز</span>
              <span className="text-[11px] text-slate-500">{MOOD_WORDS[form.mood - 1]}</span>
            </div>
            <Rating value={form.mood} onChange={(v) => setForm((f) => ({ ...f, mood: v }))} />
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <span className="block text-xs font-medium text-slate-600 mb-2">انرژی</span>
              <Rating value={form.energy} onChange={(v) => setForm((f) => ({ ...f, energy: v }))} />
            </div>
            <div>
              <span className="block text-xs font-medium text-slate-600 mb-2">تمرکز</span>
              <Rating value={form.focus} onChange={(v) => setForm((f) => ({ ...f, focus: v }))} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Field label="مطالعه‌ی امروز (دقیقه)">
              <Input dir="ltr" type="number" min={0} step={15} value={form.studyMinutes} onChange={(e) => setForm((f) => ({ ...f, studyMinutes: Number(e.target.value) }))} />
            </Field>
            <Field label="خواب دیشب (ساعت)">
              <Input dir="ltr" type="number" min={0} max={14} step={0.5} value={form.sleepHours} onChange={(e) => setForm((f) => ({ ...f, sleepHours: Number(e.target.value) }))} />
            </Field>
            <Field label="فضای مجازی (ساعت)" hint="گوشی، شبکه‌های اجتماعی، بازی، تماشا">
              <Input dir="ltr" type="number" min={0} max={24} step={0.5} value={form.screenHours} onChange={(e) => setForm((f) => ({ ...f, screenHours: Number(e.target.value) }))} />
            </Field>
            <Field label="ورزش (دقیقه)" hint="پیاده‌روی هم حساب است">
              <Input dir="ltr" type="number" min={0} step={5} value={form.exerciseMinutes} onChange={(e) => setForm((f) => ({ ...f, exerciseMinutes: Number(e.target.value) }))} />
            </Field>
          </div>

          {form.screenHours >= 4 && (
            <p className="text-[11px] bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-2.5 leading-6">
              <IconSpark className="w-3.5 h-3.5 inline align-[-3px] ml-1" />
              امروز {faNum(String(form.screenHours))} ساعت فضای مجازی داشتی. به‌جای «کم‌کردن زوری»، یک مورد از تفریح‌های پایین را جایگزین نیم‌ساعت از آن کن؛ خیلی پایدارتر است.
            </p>
          )}

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <span className="text-xs font-medium text-slate-600">تفریح‌های امروز</span>
              <span className="text-[11px] text-slate-500">
                {form.leisure.length ? `${faNum(form.leisure.length)} مورد انتخاب شده` : 'معمولاً ۱ تا ۲ مورد کافی است'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              یکی‌دو کار کوچک و سالم که امروز برای خودت انجام دادی — نه تفریح دراز و پرهزینه؛ همان چیزهای ساده که حال آدم را خوب می‌کند.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {LEISURE_ITEMS.map((l) => {
                const on = form.leisure.includes(l.id)
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => toggleLeisure(l.id)}
                    className={
                      'text-right border rounded-2xl p-2.5 transition flex items-center gap-2 ' +
                      (on ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-300')
                    }
                  >
                    <span className="text-lg leading-none">{l.emoji}</span>
                    <span className="min-w-0 flex-1 text-[11px] font-bold text-slate-700 leading-5">{l.label}</span>
                    <span
                      className={
                        'w-5 h-5 rounded-lg border grid place-items-center shrink-0 ' +
                        (on ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-slate-300')
                      }
                    >
                      {on ? <IconCheck className="w-3 h-3" /> : null}
                    </span>
                  </button>
                )
              })}
            </div>
            {leisureTotal > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {Object.entries(leisureWeek).sort((a, b) => b[1] - a[1]).map(([id, n]) => (
                  <Badge key={id} tone="brand">
                    {LEISURE_ITEMS.find((l) => l.id === id)?.emoji} {LEISURE_ITEMS.find((l) => l.id === id)?.label} — {faNum(n)} روز
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Field label="یادداشت امروز (اختیاری)" hint="مثلاً: چه چیزی خوب پیش رفت؟ چه چیزی اذیتت کرد؟">
            <Textarea value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="امروز…" />
          </Field>

          <Button size="lg" className="w-full" onClick={save} disabled={busy}>
            {busy ? 'در حال ذخیره…' : data.some((c) => c.date === today) ? 'به‌روزرسانی چک‌این امروز' : 'ثبت چک‌این امروز'}
          </Button>
        </div>
      </Card>

      <Card>
        <SectionTitle title="روند ۱۴ روز اخیر" subtitle="ستون‌ها: دقایق مطالعه — نقطه‌ها: حال روزانه" />
        <CheckinChart data={data} />
        <div className="grid sm:grid-cols-3 gap-3 mt-3">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[11px] font-bold text-slate-600 mb-1">حال</p>
            <Sparkline data={data} field="mood" />
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[11px] font-bold text-slate-600 mb-1">انرژی</p>
            <Sparkline data={data} field="energy" />
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[11px] font-bold text-slate-600 mb-1">تمرکز</p>
            <Sparkline data={data} field="focus" />
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle title="تاریخچه‌ی چک‌این‌ها و پاسخ مشاور" />
        {data.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">هنوز چیزی ثبت نشده.</p>
        ) : (
          <div className="space-y-2.5">
            {data.map((c) => (
              <div key={c.id} className="border border-slate-200 rounded-2xl p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-bold text-slate-700">{faDate(c.date, { withWeekday: true })}</p>
                  <Badge tone={c.mood >= 4 ? 'green' : c.mood >= 3 ? 'amber' : 'rose'}>حال {faNum(c.mood)}/۵</Badge>
                  <Badge tone="brand">{faNum(c.studyMinutes)}′ مطالعه</Badge>
                  <Badge tone="slate">خواب {faNum(String(c.sleepHours))} ساعت</Badge>
                  {c.screenHours !== undefined && (
                    <Badge tone={c.screenHours >= 4 ? 'rose' : 'slate'}>فضای مجازی {faNum(String(c.screenHours))} ساعت</Badge>
                  )}
                  {!!c.exerciseMinutes && <Badge tone="green">ورزش {faNum(c.exerciseMinutes)}′</Badge>}
                  <span className="text-[10px] text-slate-400">{faRelative(c.date)}</span>
                </div>
                {!!(c.leisure || []).length && (
                  <p className="text-[11px] text-slate-600 mt-2 flex flex-wrap gap-1.5">
                    {(c.leisure || []).map((id) => {
                      const l = LEISURE_ITEMS.find((x) => x.id === id)
                      return (
                        <span key={id} className="bg-brand-50 border border-brand-100 rounded-lg px-1.5 py-0.5">
                          {l?.emoji} {l?.label || id}
                        </span>
                      )
                    })}
                  </p>
                )}
                {c.note && <p className="text-[11px] text-slate-600 mt-2 bg-slate-50 rounded-xl p-2.5">{c.note}</p>}
                {c.counselorReply && (
                  <div className="mt-2 bg-violet-50 border border-violet-100 rounded-xl p-2.5">
                    <p className="text-[10px] font-bold text-violet-700 mb-1">پاسخ مشاور</p>
                    <p className="text-[11px] text-slate-700">{c.counselorReply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
