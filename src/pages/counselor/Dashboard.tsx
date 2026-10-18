import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../../store/AppContext'
import { useAsync } from '../../store/hooks'
import { Avatar, Badge, Button, Card, EmptyState, Progress, SectionTitle, Spinner, StatCard } from '../../components/ui'
import { addDaysIso, faDate, faNum, faRelative, startOfFaWeek, todayIso } from '../../lib/jalali'
import { PLAN_STATUS_LABEL, PLAN_STATUS_COLOR, type Checkin, type Plan, type PlanItem, type Profile, type SessionRow } from '../../lib/types'
import { QuickStudentStrip, ReminderStrip, useReminders } from '../../components/Reminders'
import { IconBook, IconCalendar, IconClipboard, IconSpark, IconUsers } from '../../components/icons'

export function CounselorDashboard() {
  const { backend, profile } = useApp()
  const nav = useNavigate()
  const today = todayIso()
  const weekStart = startOfFaWeek(today)

  const { data, loading } = useAsync(
    async () => {
      const students = await backend.listStudents(profile!.id)
      const perStudent = await Promise.all(
        students.map(async (s) => {
          const [plans, sessions, tasks, checkins] = await Promise.all([
            backend.listPlans(s.id),
            backend.listSessions(s.id),
            backend.listTasks(s.id),
            backend.listCheckins(s.id, 7),
          ])
          const activePlan = plans.find((p) => p.status === 'active') || plans[0] || null
          let items: PlanItem[] = []
          if (activePlan) items = await backend.listPlanItems(activePlan.id)
          return { student: s, plans, sessions, tasks, checkins, activePlan, items }
        }),
      )
      return perStudent
    },
    [backend, profile?.id],
    [] as {
      student: Profile
      plans: Plan[]
      sessions: SessionRow[]
      tasks: { id: string; status: string; title: string }[]
      checkins: Checkin[]
      activePlan: Plan | null
      items: PlanItem[]
    }[],
  )

  const { reminders } = useReminders()

  const pendingPlans = data.flatMap((d) => d.plans.filter((p) => p.status === 'pending').map((p) => ({ plan: p, student: d.student })))
  const todaysSessions = data.flatMap((d) => d.sessions.filter((s) => s.date === today && s.status === 'scheduled').map((s) => ({ s, student: d.student })))
  const weekSessions = data.flatMap((d) =>
    d.sessions.filter((s) => s.status === 'scheduled' && s.date >= weekStart && s.date <= addDaysIso(weekStart, 6)).map((s) => ({ s, student: d.student })),
  )
  const openTasks = data.flatMap((d) => d.tasks.filter((t) => t.status !== 'done').map((t) => ({ t, student: d.student })))

  const tips: string[] = []
  data.forEach((d) => {
    const last = d.checkins[0]
    if (last) {
      const days = Math.round((new Date(today).getTime() - new Date(last.date).getTime()) / 86400000)
      if (days >= 3) tips.push(`${d.student.fullName} ${faNum(days)} روز است چک‌این نداده؛ یک پیام کوتاه بفرست یا در برنامه‌ی این هفته هدف کوچک بگذار.`)
      if (last.mood <= 2) tips.push(`حال ${d.student.fullName} پایین ثبت شده (${faNum(last.mood)}/۵)؛ پیشنهاد: یک تمرین کوتاه تنفس و کاهش بار مطالعه‌ی یک روز.`)
    } else tips.push(`${d.student.fullName} هنوز چک‌اینی ثبت نکرده؛ ثبت روزانه را با هم شروع کنید.`)
    const doneRatio = d.items.length ? d.items.filter((i) => i.done).length / d.items.length : 0
    if (d.items.length > 4 && doneRatio < 0.4)
      tips.push(`درصد انجام برنامه‌ی ${d.student.fullName} پایین است (${faNum(Math.round(doneRatio * 100))}٪)؛ برنامه را واقع‌بینانه‌تر بازچینی کنید.`)
    if (d.plans.some((p) => p.status === 'pending')) tips.push(`برنامه‌ی در انتظار تأیید ${d.student.fullName} را پیگیری کنید.`)
  })
  tips.push('هر هفته یک بازبینی ۱۰ دقیقه‌ای با دانش‌آموز بگذارید: چه چیزی جواب داد؟ چه چیزی نداد؟')
  tips.push('برای والدین خلاصهٔ هفتگی بفرستید تا هم‌راستا باشند، ولی جزئیات خصوصی جلسات را حفظ کنید.')

  if (loading) return <Spinner />

  return (
    <div className="space-y-5">
      <Card className="bg-gradient-to-l from-brand-600 to-violet-600 text-white border-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs text-white/80">{faDate(today, { withWeekday: true })}</p>
            <h2 className="text-lg font-black mt-1">سلام {profile?.fullName} 👋</h2>
            <p className="text-xs text-white/85 mt-1">
              {todaysSessions.length ? `${faNum(todaysSessions.length)} جلسه امروز داری.` : 'امروز جلسه‌ای ثبت نشده.'}{' '}
              {pendingPlans.length ? `${faNum(pendingPlans.length)} برنامه منتظر تأیید دانش‌آموز است.` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-white/95" onClick={() => nav('/c/students')}>
              <IconUsers className="w-4 h-4" /> دانش‌آموزان
            </Button>
            <Button variant="outline" className="bg-white/95" onClick={() => nav('/c/invites')}>
              کد دعوت جدید
            </Button>
          </div>
        </div>
      </Card>

      <ReminderStrip reminders={reminders} />

      {data.length > 0 && (
        <QuickStudentStrip
          students={data.map((d) => {
            const total = d.items.length
            const done = d.items.filter((i) => i.done).length
            const last = d.checkins[0]
            return {
              ...d.student,
              pct: total ? Math.round((done / total) * 100) : 0,
              lastMood: last?.mood,
              gap: last ? Math.round((new Date(today).getTime() - new Date(last.date).getTime()) / 86400000) : 99,
            }
          })}
          onOpen={(id) => nav(`/c/student/${id}`)}
        />
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="دانش‌آموزان" value={faNum(data.length)} icon={<IconUsers className="w-4 h-4" />} tone="brand" />
        <StatCard label="برنامه‌های در انتظار تأیید" value={faNum(pendingPlans.length)} tone="amber" icon={<IconBook className="w-4 h-4" />} />
        <StatCard label="جلسات این هفته" value={faNum(weekSessions.length)} tone="violet" icon={<IconCalendar className="w-4 h-4" />} />
        <StatCard label="تمرین‌های باز" value={faNum(openTasks.length)} tone="green" icon={<IconClipboard className="w-4 h-4" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <SectionTitle
              title="وضعیت دانش‌آموزان"
              subtitle="پیشرفت برنامه‌ی هفته، حال آخرین چک‌این و کارهای باز"
              icon={<IconUsers className="w-4 h-4" />}
            />
            {data.length === 0 ? (
              <EmptyState
                title="هنوز دانش‌آموزی وصل نشده"
                body="یک کد دعوت بساز و به دانش‌آموز بده؛ با ثبت کد، پرونده‌اش اینجا ساخته می‌شود."
                action={<Button onClick={() => nav('/c/invites')}>ساخت کد دعوت</Button>}
                icon="🧑‍🎓"
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {data.map((d) => {
                  const total = d.items.length
                  const done = d.items.filter((i) => i.done).length
                  const pct = total ? Math.round((done / total) * 100) : 0
                  const last = d.checkins[0]
                  return (
                    <div key={d.student.id} className="py-3 flex items-center gap-3">
                      <Avatar name={d.student.fullName} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Link to={`/c/student/${d.student.id}`} className="text-sm font-bold text-slate-800 hover:text-brand-700 truncate">
                            {d.student.fullName}
                          </Link>
                          <Badge tone="slate">
                            {d.student.grade} {d.student.field ? `· ${d.student.field}` : ''}
                          </Badge>
                          {d.activePlan && (
                            <Badge className={PLAN_STATUS_COLOR[d.activePlan.status]} tone="slate">
                              {PLAN_STATUS_LABEL[d.activePlan.status]}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Progress value={pct} className="max-w-[160px]" tone={pct > 70 ? 'green' : pct > 40 ? 'brand' : 'amber'} />
                          <span className="text-[10px] text-slate-500">
                            {faNum(done)}/{faNum(total)} آیتم · {faNum(pct)}٪
                          </span>
                        </div>
                      </div>
                      <div className="text-left hidden sm:block">
                        <p className="text-[10px] text-slate-400">آخرین چک‌این</p>
                        <p className="text-[11px] text-slate-600">
                          {last ? `${faDate(last.date, { short: true })} · حال ${faNum(last.mood)}/۵` : 'ثبت نشده'}
                        </p>
                      </div>
                      <Button size="sm" variant="soft" onClick={() => nav(`/c/student/${d.student.id}`)}>
                        پرونده
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle title="جلسات پیش‌رو" icon={<IconCalendar className="w-4 h-4" />} action={<Button size="sm" variant="outline" onClick={() => nav('/c/sessions')}>همه جلسات</Button>} />
            {weekSessions.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">جلسه‌ای برای این هفته ثبت نشده.</p>
            ) : (
              <div className="space-y-2">
                {weekSessions
                  .sort((a, b) => a.s.date.localeCompare(b.s.date))
                  .map(({ s, student }) => (
                    <div key={s.id} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                      <div className="text-center bg-white rounded-lg px-2.5 py-1.5 border border-slate-200">
                        <p className="text-[10px] text-slate-500">{faRelative(s.date)}</p>
                        <p className="text-xs font-bold text-slate-700">{faDate(s.date, { short: true })}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-700 truncate">{student.fullName}</p>
                        <p className="text-[11px] text-slate-500 truncate">{s.topic}</p>
                      </div>
                      {s.time && <Badge tone="brand">{faNum(s.time)}</Badge>}
                    </div>
                  ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <SectionTitle title="پیشنهادهای رادمهر برای تو" subtitle="بر اساس دادهٔ همین هفته‌ی دانش‌آموزان" icon={<IconSpark className="w-4 h-4" />} />
            <ul className="space-y-2">
              {tips.slice(0, 6).map((t, i) => (
                <li key={i} className="text-[11px] leading-6 text-slate-600 bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                  {t}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <SectionTitle title="صف تأیید و اصلاح" icon={<IconBook className="w-4 h-4" />} />
            {pendingPlans.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">چیزی در صف نیست.</p>
            ) : (
              <div className="space-y-2">
                {pendingPlans.map(({ plan, student }) => (
                  <button
                    key={plan.id}
                    onClick={() => nav(`/c/plan/${plan.id}`)}
                    className="w-full text-right bg-amber-50 border border-amber-100 rounded-xl p-2.5 hover:border-amber-300 transition"
                  >
                    <p className="text-xs font-bold text-slate-700">{plan.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {student.fullName} · هفته‌ی {faDate(plan.startDate, { short: true })}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
