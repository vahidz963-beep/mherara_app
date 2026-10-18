import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../store/AppContext'
import { useAsync } from '../../store/hooks'
import { Badge, Button, Card, EmptyState, Field, Input, Progress, SectionTitle, Spinner, StatCard } from '../../components/ui'
import { CheckinChart } from '../../components/CheckinChart'
import { addDaysIso, faDate, faNum, faRelative, startOfFaWeek, todayIso } from '../../lib/jalali'
import type { Checkin, Plan, PlanItem, Profile, SessionRow, Task } from '../../lib/types'
import { IconBook, IconCalendar, IconHeart, IconSpark } from '../../components/icons'

export function ParentHome() {
  const { backend, profile, toast } = useApp()
  const nav = useNavigate()
  const [childCode, setChildCode] = useState('')
  const [linking, setLinking] = useState(false)

  const today = todayIso()
  const weekStart = startOfFaWeek(today)

  const { data, loading, reload } = useAsync(
    async () => {
      const children = await backend.listChildren(profile!.id)
      const child = children[0] || null
      if (!child) return { child: null, plans: [], items: [], tasks: [], checkins: [], sessions: [], counselor: null }
      const [allPlans, items, tasks, checkins, sessions] = await Promise.all([
        backend.listPlans(child.id),
        backend.listPlanItemsByRange(child.id, addDaysIso(today, -14), addDaysIso(today, 14)),
        backend.listTasks(child.id),
        backend.listCheckins(child.id, 21),
        backend.listSessions(child.id),
      ])
      const plans = allPlans.filter((p) => (p.parentShare ?? 'shared') === 'shared' && p.visibility !== 'private')
      const visibleIds = new Set(plans.map((p) => p.id))
      const safeItems = items.filter((i) => visibleIds.has(i.planId))
      const counselor = child.counselorId ? await backend.getProfile(child.counselorId) : null
      return { child, plans, items: safeItems, tasks, checkins, sessions, counselor }
    },
    [backend, profile?.id],
    {
      child: null as Profile | null,
      plans: [] as Plan[],
      items: [] as PlanItem[],
      tasks: [] as Task[],
      checkins: [] as Checkin[],
      sessions: [] as SessionRow[],
      counselor: null as Profile | null,
    },
  )

  const link = async () => {
    setLinking(true)
    try {
      const child = await backend.linkChild(profile!.id, childCode)
      toast(`${child.fullName} به حساب شما وصل شد`, 'ok')
      setChildCode('')
      reload()
    } catch (e: any) {
      toast(e?.message || 'اتصال ناموفق بود', 'err')
    } finally {
      setLinking(false)
    }
  }

  if (loading) return <Spinner />

  if (!data.child)
    return (
      <Card>
        <SectionTitle title="اتصال به پرونده‌ی فرزند" subtitle="برای مشاهده‌ی برنامه و پیشرفت، شماره موبایل فرزندتان را وارد کنید (باید در رادمهر ثبت‌نام کرده باشد)" />
        <div className="max-w-sm space-y-3">
          <Field label="شماره موبایل دانش‌آموز">
            <Input dir="ltr" inputMode="tel" value={childCode} onChange={(e) => setChildCode(e.target.value)} placeholder="09xxxxxxxxx" />
          </Field>
          <Button onClick={link} disabled={linking || childCode.length < 10}>اتصال</Button>
        </div>
        <p className="text-[11px] text-slate-500 mt-4 leading-6 bg-slate-50 border border-slate-200 rounded-xl p-3">
          شما به‌عنوان والد، دسترسی <b>خواندنی</b> دارید: برنامه‌ی هفتگی، درصد انجام کارها، روند حال و مطالعه و خلاصه‌ی جلسات
          (قدم‌های بعدی). جزئیات خصوصی جلسه‌های مشاوره محرمانه می‌ماند — این برای اعتماد فرزندتان به فضای مشاوره مهم است.
        </p>
      </Card>
    )

  const child = data.child
  const activePlan = data.plans.find((p) => p.status === 'active') || data.plans[0]
  const planItems = activePlan ? data.items.filter((i) => i.planId === activePlan.id) : []
  const done = planItems.filter((i) => i.done).length
  const weekCheckins = data.checkins.filter((c) => c.date >= weekStart)
  const weekStudy = weekCheckins.reduce((s, c) => s + c.studyMinutes, 0)
  const nextSession = data.sessions.filter((s) => s.date >= today && s.status === 'scheduled').sort((a, b) => a.date.localeCompare(b.date))[0]
  const lastCheckin = data.checkins[0]

  return (
    <div className="space-y-5">
      <Card className="bg-gradient-to-l from-emerald-600 to-teal-600 text-white border-0">
        <p className="text-xs text-white/85">{faDate(today, { withWeekday: true })}</p>
        <h2 className="text-lg font-black mt-1">سلام {profile?.fullName} 👋</h2>
        <p className="text-xs text-white/85 mt-1">
          وضعیت {child.fullName} — {child.grade} {child.field ? `· ${child.field}` : ''}
        </p>
        <div className="flex gap-2 mt-3">
          <Button variant="outline" className="bg-white/95" onClick={() => nav('/p/report')}>گزارش هفتگی</Button>
          <Button variant="outline" className="bg-white/95" onClick={() => nav('/p/plan')}>برنامه‌ی هفته</Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="مطالعه‌ی این هفته" value={faNum(Math.round(weekStudy / 60))} unit="ساعت" tone="brand" icon={<IconBook className="w-4 h-4" />} />
        <StatCard label="انجام برنامه" value={`${faNum(planItems.length ? Math.round((done / planItems.length) * 100) : 0)}٪`} tone="green" hint={`${faNum(done)} از ${faNum(planItems.length)} کار`} />
        <StatCard
          label="حال آخرین چک‌این"
          value={lastCheckin ? `${faNum(lastCheckin.mood)}/۵` : '—'}
          hint={lastCheckin ? faRelative(lastCheckin.date) : 'ثبت نشده'}
          tone="violet"
          icon={<IconHeart className="w-4 h-4" />}
        />
        <StatCard label="چک‌این این هفته" value={faNum(weekCheckins.length)} unit="از ۷ روز" tone="amber" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <SectionTitle
              title="برنامه‌ی جاری"
              subtitle={activePlan ? `${activePlan.title} — ${faDate(activePlan.startDate)} تا ${faDate(activePlan.endDate)}` : 'برنامه‌ای فعال نیست'}
              icon={<IconBook className="w-4 h-4" />}
              action={<Button size="sm" variant="outline" onClick={() => nav('/p/plan')}>مشاهده‌ی هفته</Button>}
            />
            {!activePlan ? (
              <EmptyState title="برنامه‌ای ثبت نشده" icon="📘" />
            ) : (
              <>
                <Progress value={planItems.length ? (done / planItems.length) * 100 : 0} tone="green" />
                <div className="mt-3 space-y-2">
                  {data.items
                    .filter((i) => i.planId === activePlan.id && i.date >= today && i.date <= addDaysIso(today, 3))
                    .slice(0, 6)
                    .map((i) => (
                      <div key={i.id} className="flex items-center gap-2 bg-slate-50 rounded-xl p-2.5">
                        <Badge tone={i.done ? 'green' : 'slate'}>{i.done ? '✓ انجام شد' : 'در انتظار'}</Badge>
                        <p className="text-xs text-slate-700 flex-1">{i.title}</p>
                        <span className="text-[10px] text-slate-500">{faDate(i.date, { short: true })}</span>
                      </div>
                    ))}
                </div>
              </>
            )}
          </Card>

          <Card>
            <SectionTitle title="روند حال و مطالعه" subtitle="۲۱ روز اخیر — افزایش یا کاهش را با هم ببینیم" icon={<IconHeart className="w-4 h-4" />} />
            <CheckinChart data={data.checkins} />
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <SectionTitle title="جلسه‌ی بعدی" icon={<IconCalendar className="w-4 h-4" />} />
            {nextSession ? (
              <div className="bg-brand-50 border border-brand-100 rounded-2xl p-3">
                <p className="text-sm font-bold text-brand-800">{nextSession.topic}</p>
                <p className="text-[11px] text-brand-700 mt-1">
                  {faDate(nextSession.date, { withWeekday: true })} {nextSession.time ? `· ${faNum(nextSession.time)}` : ''} · {faRelative(nextSession.date)}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3">جلسه‌ای برنامه‌ریزی نشده.</p>
            )}
            {data.counselor && (
              <p className="text-[11px] text-slate-500 mt-3">
                مشاور: <b>{data.counselor.fullName}</b>
              </p>
            )}
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/60">
            <SectionTitle title="پیشنهاد برای والدین" icon={<IconSpark className="w-4 h-4" />} />
            <ul className="text-[11px] text-slate-700 space-y-2 leading-6">
              <li>• به‌جای پرسیدن «چقدر خواندی؟»، بپرس «امروز کدام قسمتش را بیشتر دوست داشتی؟»</li>
              <li>• نمره و ساعت مطالعه را با هم قضاوت نکنیم؛ روند مهم‌تر از یک روز است.</li>
              <li>• اگر حال فرزندتان پایین است، از بچه‌ها نپرسید «چرا؟» — بپرسید «چه چیزی کمکت می‌کند؟»</li>
              <li>• خلاصه‌ی جلسه را با فرزندتان نخوانید؛ در عوض بگذارید خودش بگوید.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
