import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../store/AppContext'
import { useAsync } from '../../store/hooks'
import { Badge, Button, Card, EmptyState, Input, Progress, SectionTitle, Spinner, StatCard } from '../../components/ui'
import { ItemRow } from '../../components/WeekGrid'
import { ItemProgressModal, TestsSummary } from '../../components/ItemProgress'
import { CheckinChart } from '../../components/CheckinChart'
import { ReminderStrip, useReminders } from '../../components/Reminders'
import { StudentExamSummary } from '../../components/Assessments'
import { addDaysIso, faDate, faNum, faRelative, faTime, startOfFaWeek, todayIso } from '../../lib/jalali'
import { TASK_STATUS_LABEL, type Checkin, type Feedback, type Plan, type PlanItem, type Profile, type SessionRow, type Task } from '../../lib/types'
import { IconBook, IconCalendar, IconCheck, IconClipboard, IconHeart, IconSpark } from '../../components/icons'

export function StudentHome() {
  const { backend, profile, toast } = useApp()
  const nav = useNavigate()
  const today = todayIso()
  const weekStart = startOfFaWeek(today)

  const { data, loading, reload } = useAsync(
    async () => {
      const [plans, weekItems, allItems, tasks, checkins, sessions, notes, counselor] = await Promise.all([
        backend.listPlans(profile!.id),
        backend.listPlanItemsByRange(profile!.id, weekStart, addDaysIso(weekStart, 6)),
        backend.listPlanItemsByRange(profile!.id, addDaysIso(today, -60), addDaysIso(today, 60)),
        backend.listTasks(profile!.id),
        backend.listCheckins(profile!.id, 30),
        backend.listSessions(profile!.id),
        backend.listFeedback({ targetType: 'student', targetId: profile!.id }),
        profile!.counselorId ? backend.getProfile(profile!.counselorId) : Promise.resolve(null),
      ])
      return { plans, weekItems, allItems, tasks, checkins, sessions, notes, counselor: counselor as Profile | null }
    },
    [backend, profile?.id],
    { plans: [] as Plan[], weekItems: [] as PlanItem[], allItems: [] as PlanItem[], tasks: [] as Task[], checkins: [] as Checkin[], sessions: [] as SessionRow[], notes: [] as Feedback[], counselor: null },
  )

  const { reminders } = useReminders(
    profile!.id,
    data.tasks.filter((t) => t.status !== 'done'),
    data.checkins,
    data.sessions,
    data.plans,
    data.allItems,
  )

  const [openItem, setOpenItem] = useState<PlanItem | null>(null)
  const [progressFor, setProgressFor] = useState<PlanItem | null>(null)
  const [itemNote, setItemNote] = useState('')

  const todayItems = data.allItems.filter((i) => i.date === today)
  const todayDone = todayItems.filter((i) => i.done).length
  const activePlan = data.plans.find((p) => p.status === 'active')
  const pendingPlan = data.plans.find((p) => p.status === 'pending')
  const todayCheckin = data.checkins.find((c) => c.date === today)
  const openTasks = data.tasks.filter((t) => t.status !== 'done')
  const nextSession = [...data.sessions].filter((s) => s.date >= today && s.status === 'scheduled').sort((a, b) => a.date.localeCompare(b.date))[0]
  const weekStudy = data.checkins.filter((c) => c.date >= weekStart).reduce((s, c) => s + (c.studyMinutes || 0), 0)
  const streak = (() => {
    let n = 0
    for (let i = 0; i < 30; i++) {
      const d = addDaysIso(today, -i)
      if (data.checkins.some((c) => c.date === d)) n++
      else break
    }
    return n
  })()

  const toggleDone = async (item: PlanItem) => {
    await backend.saveItem({ id: item.id, planId: item.planId, done: !item.done, doneAt: !item.done ? new Date().toISOString() : undefined })
    await backend.addFeedback({
      targetType: 'item',
      targetId: item.id,
      studentId: profile!.id,
      authorId: profile!.id,
      authorRole: 'student',
      authorName: profile!.fullName,
      kind: 'edit',
      body: !item.done ? `انجام شد: ${item.title}` : `علامت «انجام شد» برداشته شد: ${item.title}`,
    })
    toast(!item.done ? 'آفرین! ثبت شد ✅' : 'به‌روزرسانی شد', 'ok')
    reload()
  }

  const saveItemNote = async () => {
    if (!openItem || !itemNote.trim()) return
    await backend.saveItem({ id: openItem.id, planId: openItem.planId, studentNote: itemNote.trim() })
    toast('یادداشتت ذخیره شد و مشاور می‌بیند', 'ok')
    setOpenItem(null)
    setItemNote('')
    reload()
  }

  const saveProgress = async (patch: { testsTotal?: number | null; testsCorrect?: number | null; stages?: number[] }) => {
    const item = progressFor
    if (!item) return
    await backend.saveItem({ id: item.id, planId: item.planId, ...patch })
    await backend.addFeedback({
      targetType: 'item',
      targetId: item.id,
      studentId: profile!.id,
      authorId: profile!.id,
      authorRole: 'student',
      authorName: profile!.fullName,
      kind: 'edit',
      body:
        patch.testsTotal === null || patch.testsTotal === undefined
          ? `ثبت مراحل مطالعه برای «${item.title}»`
          : `ثبت تست «${item.title}»: ${patch.testsCorrect}/${patch.testsTotal}`,
    })
    toast('ثبت شد ✅ — مشاورت هم می‌بیند', 'ok')
    reload()
  }

  if (loading) return <Spinner />

  const lastCounselorNote = [...data.notes].reverse().find((n) => n.authorRole === 'counselor')

  return (
    <div className="space-y-5">
      <ItemProgressModal
        open={!!progressFor}
        onClose={() => setProgressFor(null)}
        item={progressFor}
        onSave={saveProgress}
      />

      <Card className="bg-gradient-to-l from-brand-600 to-violet-600 text-white border-0">
        <p className="text-xs text-white/80">{faDate(today, { withWeekday: true })}</p>
        <h2 className="text-lg font-black mt-1">سلام {profile?.fullName} 👋</h2>
        <p className="text-xs text-white/85 mt-1">
          امروز {faNum(todayDone)} از {faNum(todayItems.length)} کار انجام شده. {streak > 0 ? `${faNum(streak)} روز پیوسته چک‌این داده‌ای! 🔥` : 'امروز چک‌این را ثبت کن.'}
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <Button variant="outline" className="bg-white/95" onClick={() => nav('/s/checkin')}>
            <IconHeart className="w-4 h-4" /> ثبت چک‌این امروز
          </Button>
          <Button variant="outline" className="bg-white/95" onClick={() => nav('/s/plan')}>
            <IconBook className="w-4 h-4" /> برنامه‌ی من
          </Button>
        </div>
      </Card>

      {pendingPlan && (
        <Card className="border-amber-300 bg-amber-50">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-900">برنامه‌ی جدید در انتظار تأیید توست</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                «{pendingPlan.title}» — {faDate(pendingPlan.startDate)} شروع می‌شود. ببین با کلاس‌ها و توانت می‌خورد یا نه.
              </p>
            </div>
            <Button size="sm" onClick={() => nav(`/s/plan/${pendingPlan.id}`)}>بررسی و تأیید</Button>
          </div>
        </Card>
      )}

      <ReminderStrip reminders={reminders} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="مطالعه‌ی این هفته" value={faNum(Math.round(weekStudy / 60))} unit="ساعت" tone="brand" />
        <StatCard label="کارهای امروز" value={`${faNum(todayDone)}/${faNum(todayItems.length)}`} tone="green" icon={<IconCheck className="w-4 h-4" />} />
        <StatCard label="تمرین‌های باز" value={faNum(openTasks.length)} tone="amber" icon={<IconClipboard className="w-4 h-4" />} />
        <StatCard label="روزهای پیوسته چک‌این" value={faNum(streak)} tone="violet" icon={<IconHeart className="w-4 h-4" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <SectionTitle
              title="کارهای امروز"
              subtitle={activePlan ? `از برنامه: ${activePlan.title}` : 'برنامه‌ی فعالی نداری'}
              icon={<IconBook className="w-4 h-4" />}
              action={<Button size="sm" variant="outline" onClick={() => nav('/s/plan')}>کل هفته</Button>}
            />
            {todayItems.length === 0 ? (
              <EmptyState title="برای امروز کاری ثبت نشده" body="می‌توانی از صفحه‌ی برنامه، آیتم اضافه کنی (اگر برنامه قابل ویرایش باشد)." icon="🌤" />
            ) : (
              <div className="space-y-2">
                {todayItems.map((it) => (
                  <div key={it.id}>
                    <ItemRow
                      item={it}
                      onToggleDone={toggleDone}
                      onLogProgress={(x) => setProgressFor(x)}
                      onOpenItem={(x) => { setOpenItem(x); setItemNote(x.studentNote || '') }}
                    />
                  </div>
                ))}
              </div>
            )}
            {data.weekItems.length > 0 && (
              <div className="mt-3">
                <TestsSummary items={data.weekItems} title="تست‌های این هفته" compact />
              </div>
            )}
            {openItem && (
              <div className="mt-3 bg-slate-50 border border-slate-200 rounded-2xl p-3">
                <p className="text-xs font-bold text-slate-700 mb-1.5">یادداشت تو روی «{openItem.title}»</p>
                <Input value={itemNote} onChange={(e) => setItemNote(e.target.value)} placeholder="چی خوب پیش رفت؟ چه چیزی مانع شد؟" className="text-xs" />
                <div className="flex justify-end gap-2 mt-2">
                  <Button size="sm" variant="ghost" onClick={() => setOpenItem(null)}>بستن</Button>
                  <Button size="sm" onClick={saveItemNote}>ذخیره</Button>
                </div>
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle title="روند حال و مطالعه" subtitle="۱۴ روز گذشته" icon={<IconHeart className="w-4 h-4" />} action={<Button size="sm" variant="outline" onClick={() => nav('/s/checkin')}>چک‌این جدید</Button>} />
            <CheckinChart data={data.checkins} />
          </Card>
        </div>

        <div className="space-y-5">
          <StudentExamSummary studentId={profile!.id} />

          <Card>
            <SectionTitle title="جلسه‌ی بعدی" icon={<IconCalendar className="w-4 h-4" />} action={<Button size="sm" variant="ghost" onClick={() => nav('/s/chat')}>همه جلسات</Button>} />
            {nextSession ? (
              <div className="bg-brand-50 border border-brand-100 rounded-2xl p-3">
                <p className="text-sm font-bold text-brand-800">{nextSession.topic}</p>
                <p className="text-[11px] text-brand-700 mt-1">
                  {faDate(nextSession.date, { withWeekday: true })} {nextSession.time ? `· ساعت ${faTime(nextSession.time)}` : ''}
                </p>
                <Badge tone="brand" className="mt-2">{faRelative(nextSession.date)}</Badge>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3">جلسه‌ای برنامه‌ریزی نشده.</p>
            )}
          </Card>

          <Card>
            <SectionTitle title="پیام مشاور" icon={<IconSpark className="w-4 h-4" />} action={<Button size="sm" variant="ghost" onClick={() => nav('/s/chat')}>گفت‌وگو</Button>} />
            {lastCounselorNote ? (
              <div className="bg-violet-50 border border-violet-100 rounded-2xl p-3">
                <p className="text-[10px] text-violet-700 font-bold mb-1">{lastCounselorNote.authorName} · {faRelative(lastCounselorNote.createdAt.slice(0, 10))}</p>
                <p className="text-xs text-slate-700 leading-6">{lastCounselorNote.body}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3">پیامی از مشاور نداری.</p>
            )}
            {data.counselor && (
              <p className="text-[11px] text-slate-500 mt-3">
                مشاور شما: <b>{data.counselor.fullName}</b>
              </p>
            )}
          </Card>

          <Card>
            <SectionTitle title="تمرین‌های باز" icon={<IconClipboard className="w-4 h-4" />} action={<Button size="sm" variant="ghost" onClick={() => nav('/s/tasks')}>همه</Button>} />
            {openTasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">تمرین بازی نداری 🎉</p>
            ) : (
              <div className="space-y-2">
                {openTasks.slice(0, 4).map((t) => (
                  <div key={t.id} className="bg-slate-50 rounded-xl p-2.5">
                    <p className="text-xs font-medium text-slate-700">{t.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-slate-500">{t.dueDate ? `مهلت ${faDate(t.dueDate, { short: true })}` : 'بدون مهلت'}</span>
                      <Badge tone={t.status === 'doing' ? 'amber' : 'slate'}>{TASK_STATUS_LABEL[t.status]}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle title="چک‌این امروز" icon={<IconHeart className="w-4 h-4" />} />
            {todayCheckin ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>حال</span>
                  <span className="font-bold">{faNum(todayCheckin.mood)}/۵</span>
                </div>
                <Progress value={(todayCheckin.mood / 5) * 100} tone={todayCheckin.mood >= 4 ? 'green' : todayCheckin.mood >= 3 ? 'brand' : 'amber'} />
                <p className="text-[11px] text-slate-500">
                  مطالعه {faNum(todayCheckin.studyMinutes)} دقیقه · خواب {faNum(String(todayCheckin.sleepHours))} ساعت
                </p>
                {todayCheckin.counselorReply && (
                  <p className="text-[11px] text-violet-700 bg-violet-50 border border-violet-100 rounded-xl p-2">پاسخ مشاور: {todayCheckin.counselorReply}</p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-500 mb-2">امروز ثبت نکرده‌ای. یک دقیقه وقت بگذار؛ مشاورت این را می‌بیند.</p>
                <Button size="sm" className="w-full" onClick={() => nav('/s/checkin')}>ثبت چک‌این</Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
