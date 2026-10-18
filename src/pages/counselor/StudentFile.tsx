import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../store/AppContext'
import { useAsync } from '../../store/hooks'
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  Progress,
  Rating,
  SectionTitle,
  Select,
  Spinner,
  StatCard,
  Tabs,
  Textarea,
} from '../../components/ui'
import { CheckinChart, Sparkline } from '../../components/CheckinChart'
import { TestsSummary } from '../../components/ItemProgress'
import { LEISURE_ITEMS, leisureCounts } from '../../lib/leisure'
import { FeedbackThread } from '../../components/FeedbackThread'
import { CounselorAssessments } from '../../components/Assessments'
import { TaskLibraryModal, type NewTaskFromLibrary } from '../../components/TaskLibraryModal'
import { SessionModal, TaskModal } from '../../components/modals'
import { TASK_LIBRARY, suggestLibraryTasks, type LibraryTask } from '../../lib/taskLibrary'
import { addDaysIso, faDate, faNum, faRelative, startOfFaWeek, todayIso, isoToJalali, toGregorian } from '../../lib/jalali'
import {
  PLAN_STATUS_COLOR,
  PLAN_STATUS_LABEL,
  TASK_STATUS_LABEL,
  VISIBILITY_LABEL,
  type Checkin,
  type Plan,
  type PlanItem,
  type PlanVisibility,
  type SessionRow,
  type Task,
  type TaskStatus,
} from '../../lib/types'
import { IconBook, IconCalendar, IconClipboard, IconHeart, IconPlus, IconUser } from '../../components/icons'

type TabKey = 'overview' | 'plans' | 'tasks' | 'checkins' | 'sessions' | 'exams' | 'chat'

export function StudentFile() {
  const { id = '' } = useParams()
  const { backend, profile, toast } = useApp()
  const nav = useNavigate()
  const [tab, setTab] = useState<TabKey>('overview')

  const { data, loading, reload } = useAsync(
    async () => {
      const [student, plans, tasks, checkins, sessions] = await Promise.all([
        backend.getProfile(id),
        backend.listPlans(id),
        backend.listTasks(id),
        backend.listCheckins(id, 30),
        backend.listSessions(id),
      ])
      const itemsByPlan: Record<string, number> = {}
      const doneByPlan: Record<string, number> = {}
      let allItems: PlanItem[] = []
      for (const p of plans) {
        const items = await backend.listPlanItems(p.id)
        itemsByPlan[p.id] = items.length
        doneByPlan[p.id] = items.filter((i) => i.done).length
        allItems = allItems.concat(items)
      }
      const [exams, mistakes] = await Promise.all([backend.listExams(id), backend.listMistakes(id)])
      let lastExamPercent: number | undefined
      if (exams[0]) {
        const subjects = await backend.listExamSubjects(exams[0].id)
        const totalQ = subjects.reduce((s, x) => s + (x.total || 0), 0)
        if (subjects.length)
          lastExamPercent = totalQ
            ? Math.round((subjects.reduce((s, x) => s + ((x.percent ?? (x.correct / (x.total || 1)) * 100) * (x.total || 0)), 0) / totalQ) * 10) / 10
            : Math.round(subjects.reduce((s, x) => s + (x.percent ?? 0), 0) / subjects.length)
      }
      return { student, plans, tasks, checkins, sessions, itemsByPlan, doneByPlan, allItems, exams, mistakes, lastExamPercent }
    },
    [backend, id],
    {
      student: null as any,
      plans: [] as Plan[],
      tasks: [] as Task[],
      checkins: [] as Checkin[],
      sessions: [] as SessionRow[],
      itemsByPlan: {} as Record<string, number>,
      doneByPlan: {} as Record<string, number>,
      allItems: [] as PlanItem[],
      exams: [] as any[],
      mistakes: [] as any[],
      lastExamPercent: undefined as number | undefined,
    },
  )

  const [planOpen, setPlanOpen] = useState(false)
  const [planForm, setPlanForm] = useState({ title: '', startDate: todayIso(), kind: 'week', visibility: 'student_editable' as PlanVisibility, note: '' })
  const [jStart, setJStart] = useState('')
  const [taskOpen, setTaskOpen] = useState(false)
  const [libOpen, setLibOpen] = useState(false)
  const [taskEdit, setTaskEdit] = useState<Task | null>(null)
  const [sessionOpen, setSessionOpen] = useState(false)
  const [sessionEdit, setSessionEdit] = useState<SessionRow | null>(null)
  const [editProfile, setEditProfile] = useState(false)
  const [pForm, setPForm] = useState({ fullName: '', grade: '', field: '', school: '', phone: '' })

  if (loading) return <Spinner />
  const s = data.student
  if (!s) return <EmptyState title="دانش‌آموز پیدا نشد" icon="🤷" />

  const weekStart = startOfFaWeek(todayIso())
  const weekCheckins = data.checkins.filter((c) => c.date >= weekStart)
  const weekStudy = weekCheckins.reduce((sum, c) => sum + (c.studyMinutes || 0), 0)
  const openTasks = data.tasks.filter((t) => t.status !== 'done')
  const suggestions = suggestLibraryTasks({
    avgMood: data.checkins.slice(0, 7).length ? data.checkins.slice(0, 7).reduce((a, c) => a + c.mood, 0) / data.checkins.slice(0, 7).length : 3,
    avgSleep: data.checkins.slice(0, 7).length ? data.checkins.slice(0, 7).reduce((a, c) => a + c.sleepHours, 0) / data.checkins.slice(0, 7).length : 7,
    avgFocus: data.checkins.slice(0, 7).length ? data.checkins.slice(0, 7).reduce((a, c) => a + c.focus, 0) / data.checkins.slice(0, 7).length : 3,
    checkinGapDays: data.checkins[0] ? Math.round((Date.now() - new Date(data.checkins[0].date + 'T00:00:00').getTime()) / 86400000) : 30,
    lastExamPercent: data.lastExamPercent,
  }).map((t) => ({ task: t, why: suggestWhy(t.id, data) }))
  const activePlan = data.plans.find((p) => p.status === 'active')
  const pendingPlan = data.plans.find((p) => p.status === 'pending')

  const openNewPlan = () => {
    const start = addDaysIso(weekStart, 7)
    const { jy, jm, jd } = isoToJalali(start)
    setPlanForm({ title: `برنامه‌ی هفته‌ی ${faNum(jd)} ${''}`.trim(), startDate: start, kind: 'week', visibility: 'student_editable', note: '' })
    setJStart(`${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`)
    setPlanOpen(true)
  }

  const createPlan = async () => {
    try {
      const plan = await backend.createPlan({
        studentId: s.id,
        counselorId: profile!.id,
        title: planForm.title || 'برنامه‌ی هفتگی',
        kind: planForm.kind as Plan['kind'],
        startDate: planForm.startDate,
        endDate: addDaysIso(planForm.startDate, planForm.kind === 'week' ? 6 : 29),
        visibility: planForm.visibility,
        note: planForm.note,
        status: 'draft',
        createdBy: profile!.id,
      })
      await backend.addFeedback({
        targetType: 'plan',
        targetId: plan.id,
        studentId: s.id,
        authorId: profile!.id,
        authorRole: 'counselor',
        authorName: profile!.fullName,
        kind: 'comment',
        body: 'برنامه‌ی جدید ساخته شد و در حال آماده‌سازی است.',
      })
      toast('برنامه ساخته شد؛ حالا آیتم‌ها را بچین', 'ok')
      setPlanOpen(false)
      nav(`/c/plan/${plan.id}`)
    } catch (e: any) {
      toast(e?.message || 'ساخت برنامه ناموفق بود', 'err')
    }
  }

  const saveProfile = async () => {
    try {
      await backend.updateProfile(s.id, {
        fullName: pForm.fullName,
        grade: pForm.grade,
        field: pForm.field,
        school: pForm.school,
      })
      toast('اطلاعات ذخیره شد', 'ok')
      setEditProfile(false)
      reload()
    } catch (e: any) {
      toast(e?.message || 'ذخیره نشد', 'err')
    }
  }

  const setPlanStatus = async (plan: Plan, status: Plan['status'], msg: string) => {
    try {
      await backend.updatePlan(plan.id, { status })
      if (msg)
        await backend.addFeedback({
          targetType: 'plan',
          targetId: plan.id,
          studentId: s.id,
          authorId: profile!.id,
          authorRole: 'counselor',
          authorName: profile!.fullName,
          kind: status === 'pending' ? 'comment' : 'approve',
          body: msg,
        })
      toast('به‌روزرسانی شد', 'ok')
      reload()
    } catch (e: any) {
      toast(e?.message || 'انجام نشد', 'err')
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Avatar name={s.fullName} size={64} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-slate-800">{s.fullName}</h2>
              <Badge tone="brand">{s.grade || '—'}</Badge>
              {s.field && <Badge tone="violet">{s.field}</Badge>}
              {s.school && <Badge tone="slate">{s.school}</Badge>}
            </div>
            <p dir="ltr" className="text-xs text-slate-500 mt-1 text-right">
              {faNum(s.phone)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPForm({ fullName: s.fullName, grade: s.grade || '', field: s.field || '', school: s.school || '', phone: s.phone })
                setEditProfile(true)
              }}
            >
              <IconUser className="w-4 h-4" /> ویرایش پروفایل
            </Button>
            <Button size="sm" onClick={openNewPlan}>
              <IconPlus className="w-4 h-4" /> برنامه‌ی جدید
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <StatCard label="مطالعه‌ی این هفته" value={faNum(Math.round(weekStudy / 60))} unit="ساعت" tone="brand" />
          <StatCard
            label="آخرین چک‌این"
            value={data.checkins[0] ? faNum(data.checkins[0].mood) + '/۵' : '—'}
            hint={data.checkins[0] ? faRelative(data.checkins[0].date) : 'ثبت نشده'}
            tone="green"
          />
          <StatCard label="تمرین‌های باز" value={faNum(openTasks.length)} tone="amber" />
          <StatCard
            label="میانگین آخرین آزمون"
            value={data.lastExamPercent !== undefined ? `${faNum(data.lastExamPercent)}٪` : '—'}
            hint={data.exams[0] ? `${data.exams[0].title} · ${faDate(data.exams[0].date, { short: true })}` : 'آزمونی ثبت نشده'}
            tone="violet"
          />
        </div>

        <div className="mt-4">
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'overview', label: 'نمای کلی' },
              { value: 'plans', label: 'برنامه‌ها', count: data.plans.length },
              { value: 'tasks', label: 'تمرین‌ها', count: data.tasks.length },
              { value: 'checkins', label: 'چک‌این‌ها', count: data.checkins.length },
              { value: 'sessions', label: 'جلسات', count: data.sessions.length },
              { value: 'exams', label: 'آزمون‌ها', count: data.exams.length },
              { value: 'chat', label: 'بازخورد و گفت‌وگو' },
            ]}
          />
        </div>
      </Card>

      {tab === 'overview' && (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <Card>
              <SectionTitle title="برنامه‌ی جاری" icon={<IconBook className="w-4 h-4" />} action={activePlan ? <Button size="sm" variant="soft" onClick={() => nav(`/c/plan/${activePlan.id}`)}>ویرایش برنامه</Button> : null} />
              {data.allItems.length > 0 && (
                <div className="mb-3">
                  <TestsSummary items={data.allItems} title="تست‌ها و مراحل مطالعه‌ی ثبت‌شده" />
                </div>
              )}
              {activePlan ? (
                <div className="rounded-2xl border border-slate-200 p-3.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-800 text-sm">{activePlan.title}</p>
                    <Badge tone="slate" className={PLAN_STATUS_COLOR[activePlan.status]}>
                      {PLAN_STATUS_LABEL[activePlan.status]}
                    </Badge>
                    <Badge tone="slate">{VISIBILITY_LABEL[activePlan.visibility]}</Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {faDate(activePlan.startDate)} تا {faDate(activePlan.endDate)}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <Progress
                      value={
                        data.itemsByPlan[activePlan.id]
                          ? Math.round((data.doneByPlan[activePlan.id] / data.itemsByPlan[activePlan.id]) * 100)
                          : 0
                      }
                      className="flex-1"
                    />
                    <span className="text-[11px] text-slate-500">
                      {faNum(data.doneByPlan[activePlan.id] || 0)} از {faNum(data.itemsByPlan[activePlan.id] || 0)}
                    </span>
                  </div>
                </div>
              ) : (
                <EmptyState title="برنامه‌ی فعالی وجود ندارد" body="برای این هفته یک برنامه بساز و بعد از چیدن آیتم‌ها برای تأیید بفرست." action={<Button onClick={openNewPlan}>ساخت برنامه</Button>} icon="📘" />
              )}

              {pendingPlan && (
                <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-900">
                  «{pendingPlan.title}» در انتظار تأیید دانش‌آموز است. {faRelative(pendingPlan.startDate)} شروع می‌شود.
                </div>
              )}
            </Card>

            <Card>
              <SectionTitle title="روند حال و مطالعه" icon={<IconHeart className="w-4 h-4" />} action={<Button size="sm" variant="outline" onClick={() => setTab('checkins')}>جزئیات</Button>} />
              <CheckinChart data={data.checkins} />
              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[11px] font-bold text-slate-600 mb-1">حال (mood)</p>
                  <Sparkline data={data.checkins} field="mood" />
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[11px] font-bold text-slate-600 mb-1">تمرکز (focus)</p>
                  <Sparkline data={data.checkins} field="focus" />
                </div>
              </div>
            </Card>

            <Card>
              <SectionTitle title="پیشنهادهای تمرین بر اساس داده" subtitle="از بانک تمرین‌های استاندارد یا فهرست خودت" icon={<IconClipboard className="w-4 h-4" />} />
              {suggestions.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">هنوز داده‌ی کافی برای پیشنهاد دقیق نیست.</p>
              ) : (
                <div className="space-y-2">
                  {suggestions.map(({ task, why }) => (
                    <div key={task.id} className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl p-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-amber-900">{task.title}</p>
                        <p className="text-[10px] text-amber-800 mt-0.5">چرا؟ {why}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="soft"
                        onClick={async () => {
                          await backend.saveTask({
                            studentId: s.id,
                            counselorId: profile!.id,
                            title: task.title,
                            description: task.description,
                            dueDate: addDaysIso(todayIso(), task.days),
                          })
                          toast('تمرین افزوده شد', 'ok')
                          reload()
                        }}
                      >
                        افزودن
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => setLibOpen(true)}>
                باز کردن بانک تمرین‌ها ({faNum(TASK_LIBRARY.length)} تمرین)
              </Button>
            </Card>

            <Card>
              <SectionTitle title="تمرین‌های باز" icon={<IconClipboard className="w-4 h-4" />} action={<Button size="sm" variant="outline" onClick={() => { setTaskEdit(null); setTaskOpen(true) }}>تمرین جدید</Button>} />
              {openTasks.length === 0 ? (
                <p className="text-xs text-slate-400 py-3">تمرین بازی وجود ندارد.</p>
              ) : (
                <div className="space-y-2">
                  {openTasks.map((t) => (
                    <button key={t.id} onClick={() => { setTaskEdit(t); setTaskOpen(true) }} className="w-full text-right bg-slate-50 border border-slate-200 rounded-xl p-3 hover:border-brand-300">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-700 flex-1">{t.title}</p>
                        <Badge tone={t.status === 'doing' ? 'amber' : 'slate'}>{TASK_STATUS_LABEL[t.status]}</Badge>
                      </div>
                      {t.dueDate && <p className="text-[10px] text-slate-500 mt-1">مهلت: {faDate(t.dueDate)} ({faRelative(t.dueDate)})</p>}
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-5">
            <Card>
              <SectionTitle title="نکته‌های این دانش‌آموز" icon={<IconUser className="w-4 h-4" />} />
              <ul className="text-[11px] text-slate-600 space-y-2 leading-6">
                <li>• نسبت انجام برنامه: {faNum(data.itemsByPlan[activePlan?.id || ''] ? Math.round((data.doneByPlan[activePlan?.id || ''] / data.itemsByPlan[activePlan?.id || '']) * 100) : 0)}٪</li>
                <li>• میانگین مطالعه‌ی هفته: {faNum(Math.round(weekStudy / 7))} دقیقه در روز</li>
                <li>• آخرین جلسه: {data.sessions[0] ? `${faDate(data.sessions[0].date, { short: true })} — ${data.sessions[0].topic}` : 'بدون جلسه'}</li>
                <li>• چک‌این‌های این هفته: {faNum(weekCheckins.length)} از ۷ روز</li>
              </ul>
            </Card>
            <FeedbackThread
              targetType="student"
              targetId={s.id}
              studentId={s.id}
              title="یادداشت و پیام برای دانش‌آموز"
              subtitle="هر دو طرف می‌بینند و می‌توانند پاسخ دهند"
            />
          </div>
        </div>
      )}

      {tab === 'plans' && (
        <Card>
          <SectionTitle
            title="برنامه‌های این دانش‌آموز"
            subtitle="پس از چیدن آیتم‌ها، برنامه را برای تأیید بفرست؛ بعد از تأیید به «فعال» تبدیل می‌شود"
            icon={<IconBook className="w-4 h-4" />}
            action={<Button size="sm" onClick={openNewPlan}><IconPlus className="w-4 h-4" /> برنامه‌ی جدید</Button>}
          />
          {data.plans.length === 0 ? (
            <EmptyState title="برنامه‌ای ثبت نشده" action={<Button onClick={openNewPlan}>ساخت اولین برنامه</Button>} />
          ) : (
            <div className="space-y-3">
              {data.plans.map((p) => {
                const total = data.itemsByPlan[p.id] || 0
                const done = data.doneByPlan[p.id] || 0
                return (
                  <div key={p.id} className="border border-slate-200 rounded-2xl p-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-sm text-slate-800 flex-1 min-w-[160px]">{p.title}</p>
                      <Badge tone="slate" className={PLAN_STATUS_COLOR[p.status]}>{PLAN_STATUS_LABEL[p.status]}</Badge>
                      <Badge tone="slate">{VISIBILITY_LABEL[p.visibility]}</Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {faDate(p.startDate)} تا {faDate(p.endDate)} · {faNum(total)} آیتم
                    </p>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <Progress value={total ? Math.round((done / total) * 100) : 0} className="flex-1 min-w-[120px]" />
                      <span className="text-[10px] text-slate-500">{faNum(done)}/{faNum(total)} انجام‌شده</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Button size="sm" variant="soft" onClick={() => nav(`/c/plan/${p.id}`)}>ویرایش آیتم‌ها</Button>
                      {p.status === 'draft' && (
                        <Button size="sm" onClick={() => setPlanStatus(p, 'pending', 'برنامه آماده است؛ لطفاً بررسی کن و اگر موردی هست بگو یا تأیید کن.')}>
                          ارسال برای تأیید
                        </Button>
                      )}
                      {p.status === 'pending' && (
                        <Button size="sm" variant="success" onClick={() => setPlanStatus(p, 'active', 'برنامه فعال شد. خوب پیش برو، من بازخوردها را می‌خوانم.')}>
                          تأیید و فعال‌سازی
                        </Button>
                      )}
                      {p.status === 'needs_revision' && (
                        <Button size="sm" onClick={() => setPlanStatus(p, 'pending', 'طبق بازخوردت اصلاح کردم؛ یک بار دیگر ببین.')}>
                          اصلاح شد — ارسال دوباره
                        </Button>
                      )}
                      {p.status !== 'archived' && (
                        <Button size="sm" variant="ghost" onClick={() => setPlanStatus(p, 'archived', '')}>
                          بایگانی
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}

      {tab === 'tasks' && (
        <Card>
          <SectionTitle
            title="تمرین‌ها و تکالیف"
            subtitle="تمرین‌های روان‌شناختی، تکالیف درسی و کارهای بین جلسه"
            icon={<IconClipboard className="w-4 h-4" />}
            action={
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setLibOpen(true)}>
                  بانک تمرین
                </Button>
                <Button size="sm" onClick={() => { setTaskEdit(null); setTaskOpen(true) }}>
                  <IconPlus className="w-4 h-4" /> تمرین جدید
                </Button>
              </div>
            }
          />
          {data.tasks.length === 0 ? (
            <EmptyState title="تمرینی ثبت نشده" icon="🧩" />
          ) : (
            <div className="space-y-2">
              {data.tasks.map((t) => (
                <div key={t.id} className="border border-slate-200 rounded-2xl p-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-slate-800 flex-1">{t.title}</p>
                    <Badge tone={t.status === 'done' ? 'green' : t.status === 'doing' ? 'amber' : 'slate'}>{TASK_STATUS_LABEL[t.status]}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => { setTaskEdit(t); setTaskOpen(true) }}>ویرایش</Button>
                  </div>
                  {t.description && <p className="text-xs text-slate-600 mt-2 leading-6">{t.description}</p>}
                  {t.dueDate && <p className="text-[10px] text-slate-500 mt-1">مهلت: {faDate(t.dueDate)} ({faRelative(t.dueDate)})</p>}
                  {t.studentNote && (
                    <div className="mt-2 bg-brand-50 border border-brand-100 rounded-xl p-2.5">
                      <p className="text-[10px] font-bold text-brand-700 mb-1">یادداشت دانش‌آموز</p>
                      <p className="text-[11px] text-slate-700">{t.studentNote}</p>
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      placeholder="بازخورد مشاور به این تمرین…"
                      defaultValue={t.counselorFeedback || ''}
                      onBlur={async (e) => {
                        if (e.target.value === (t.counselorFeedback || '')) return
                        await backend.saveTask({ id: t.id, studentId: s.id, counselorFeedback: e.target.value })
                        toast('بازخورد ذخیره شد', 'ok')
                        reload()
                      }}
                      className="text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'checkins' && (
        <div className="space-y-5">
          <Card>
            <SectionTitle title="روند چک‌این روزانه" subtitle="حال، انرژی، تمرکز، خواب، فضای مجازی، ورزش و دقایق مطالعه" icon={<IconHeart className="w-4 h-4" />} />
            <CheckinChart data={data.checkins} />

            <div className="mt-3 flex flex-wrap gap-1.5">
              {(() => {
                const counts = leisureCounts(data.checkins, weekStart, addDaysIso(weekStart, 6))
                const total = Object.values(counts).reduce((a, b) => a + b, 0)
                if (!total)
                  return <p className="text-[11px] text-slate-400">در این هفته تفریح سالمی تیک نخورده — با دانش‌آموز یک‌دو مورد کوچک انتخاب کن.</p>
                return Object.entries(counts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([lid, n]) => {
                    const l = LEISURE_ITEMS.find((x) => x.id === lid)
                    return (
                      <Badge key={lid} tone="brand">
                        {l?.emoji} {l?.label || lid} — {faNum(n)} روز
                      </Badge>
                    )
                  })
              })()}
            </div>
          </Card>
          <Card>
            <SectionTitle title="لاگ چک‌این‌ها" />
            {data.checkins.length === 0 ? (
              <EmptyState title="چک‌اینی ثبت نشده" />
            ) : (
              <div className="space-y-3">
                {data.checkins.map((c) => (
                  <div key={c.id} className="border border-slate-200 rounded-2xl p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-slate-700">{faDate(c.date, { withWeekday: true })}</p>
                      <Badge tone={c.mood >= 4 ? 'green' : c.mood >= 3 ? 'amber' : 'rose'}>حال {faNum(c.mood)}/۵</Badge>
                      <Badge tone="brand">مطالعه {faNum(c.studyMinutes)}′</Badge>
                      <Badge tone="slate">خواب {faNum(String(c.sleepHours))} ساعت</Badge>
                      {c.screenHours !== undefined && <Badge tone={c.screenHours >= 4 ? 'rose' : 'slate'}>فضای مجازی {faNum(String(c.screenHours))} ساعت</Badge>}
                      {!!c.exerciseMinutes && <Badge tone="green">ورزش {faNum(c.exerciseMinutes)}′</Badge>}
                      {!!(c.leisure || []).length && (
                        <Badge tone="brand">
                          تفریح: {(c.leisure || []).map((id) => LEISURE_ITEMS.find((x) => x.id === id)?.label || id).join('، ')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500">
                      <span>انرژی:</span> <Rating value={c.energy} readOnly />
                      <span>تمرکز:</span> <Rating value={c.focus} readOnly />
                    </div>
                    {c.note && <p className="text-xs text-slate-600 mt-2 bg-slate-50 rounded-xl p-2.5">{c.note}</p>}
                    {c.counselorReply ? (
                      <div className="mt-2 bg-violet-50 border border-violet-100 rounded-xl p-2.5">
                        <p className="text-[10px] font-bold text-violet-700 mb-1">پاسخ مشاور</p>
                        <p className="text-[11px] text-slate-700">{c.counselorReply}</p>
                      </div>
                    ) : (
                      <div className="mt-2 flex gap-2">
                        <Input
                          placeholder="پاسخ کوتاه به این چک‌این…"
                          onKeyDown={async (e) => {
                            if (e.key !== 'Enter') return
                            const v = (e.target as HTMLInputElement).value
                            if (!v.trim()) return
                            await backend.saveCheckin({ studentId: s.id, date: c.date, counselorReply: v })
                            toast('پاسخ ثبت شد', 'ok')
                            reload()
                          }}
                          className="text-xs"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === 'sessions' && (
        <Card>
          <SectionTitle
            title="جلسه‌ها"
            subtitle="خلاصه‌ی جلسه محرمانه است؛ «قدم‌های بعدی» برای دانش‌آموز نمایش داده می‌شود"
            icon={<IconCalendar className="w-4 h-4" />}
            action={<Button size="sm" onClick={() => { setSessionEdit(null); setSessionOpen(true) }}><IconPlus className="w-4 h-4" /> جلسه‌ی جدید</Button>}
          />
          {data.sessions.length === 0 ? (
            <EmptyState title="جلسه‌ای ثبت نشده" icon="📅" />
          ) : (
            <div className="space-y-2">
              {data.sessions.map((x) => (
                <button key={x.id} onClick={() => { setSessionEdit(x); setSessionOpen(true) }} className="w-full text-right border border-slate-200 rounded-2xl p-3 hover:border-brand-300">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-slate-800 flex-1">{x.topic}</p>
                    <Badge tone={x.status === 'done' ? 'green' : x.status === 'canceled' ? 'rose' : 'brand'}>
                      {x.status === 'done' ? 'برگزار شد' : x.status === 'canceled' ? 'لغو شد' : 'برنامه‌ریزی‌شده'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {faDate(x.date, { withWeekday: true })} {x.time ? `· ساعت ${faNum(x.time)}` : ''} ·{' '}
                    {x.mode === 'online' ? 'آنلاین' : x.mode === 'in_person' ? 'حضوری' : 'تلفنی'}
                  </p>
                  {x.summary && <p className="text-[11px] text-slate-600 mt-2 bg-slate-50 rounded-lg p-2">{x.summary}</p>}
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'exams' && <CounselorAssessments studentId={s.id} />}

      {tab === 'chat' && (
        <FeedbackThread targetType="student" targetId={s.id} studentId={s.id} title="گفت‌وگوی مشاور و دانش‌آموز" subtitle="بازخورد، درخواست تغییر و پاسخ‌ها" />
      )}

      {/* مودال‌ها */}
      <Modal
        open={planOpen}
        onClose={() => setPlanOpen(false)}
        title="ساخت برنامه‌ی جدید"
        footer={
          <>
            <Button variant="outline" onClick={() => setPlanOpen(false)}>انصراف</Button>
            <Button onClick={createPlan}>ساخت و ویرایش آیتم‌ها</Button>
          </>
        }
      >
        <div className="space-y-3.5">
          <Field label="عنوان برنامه">
            <Input value={planForm.title} onChange={(e) => setPlanForm((f) => ({ ...f, title: e.target.value }))} placeholder="مثلاً برنامه‌ی هفته‌ی آزمون" />
          </Field>
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="بازه">
              <Select value={planForm.kind} onChange={(e) => setPlanForm((f) => ({ ...f, kind: e.target.value }))}>
                <option value="week">یک هفته</option>
                <option value="month">یک ماه</option>
                <option value="term">یک ترم</option>
              </Select>
            </Field>
            <Field label="تاریخ شروع (شمسی)">
              <Input
                dir="ltr"
                value={faNum(jStart)}
                onChange={(e) => {
                  const v = e.target.value.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
                  setJStart(v)
                  const m = v.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/)
                  if (m) {
                    const g = toGregorian(Number(m[1]), Number(m[2]), Number(m[3]))
                    setPlanForm((f) => ({ ...f, startDate: `${g.gy}-${String(g.gm).padStart(2, '0')}-${String(g.gd).padStart(2, '0')}` }))
                  }
                }}
              />
            </Field>
            <Field label="دسترسی دانش‌آموز">
              <Select value={planForm.visibility} onChange={(e) => setPlanForm((f) => ({ ...f, visibility: e.target.value as PlanVisibility }))}>
                <option value="student_view">فقط مشاهده</option>
                <option value="student_editable">قابل ویرایش</option>
                <option value="private">فقط مشاور</option>
              </Select>
            </Field>
          </div>
          <Field label="یادداشت برنامه (اختیاری)">
            <Textarea value={planForm.note} onChange={(e) => setPlanForm((f) => ({ ...f, note: e.target.value }))} placeholder="هدف کلی این برنامه چیست؟" />
          </Field>
        </div>
      </Modal>

      <TaskLibraryModal
        open={libOpen}
        onClose={() => setLibOpen(false)}
        suggestedIds={[]}
        onSubmit={async (tasks: NewTaskFromLibrary[]) => {
          for (const t of tasks) {
            await backend.saveTask({
              studentId: s.id,
              counselorId: profile!.id,
              title: t.title,
              description: t.description,
              dueDate: t.dueDate,
            })
            if (t.saveAsTemplate)
              await backend.saveTaskTemplate({
                counselorId: profile!.id,
                title: t.title,
                description: t.description,
                category: t.category,
                days: 7,
              })
          }
          toast(`${faNum(tasks.length)} تمرین افزوده شد`, 'ok')
          reload()
        }}
      />

      <TaskModal
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        initial={taskEdit}
        studentName={s.fullName}
        onSave={async (t) => {
          await backend.saveTask({ ...t, studentId: s.id, counselorId: profile!.id } as any)
          toast('تمرین ذخیره شد', 'ok')
          await backend.addFeedback({
            targetType: 'task',
            targetId: (t as any).id || 'new',
            studentId: s.id,
            authorId: profile!.id,
            authorRole: 'counselor',
            authorName: profile!.fullName,
            kind: 'comment',
            body: `تمرین «${t.title}» ثبت شد${t.dueDate ? ` — مهلت ${faDate(t.dueDate)}` : ''}.`,
          })
          reload()
        }}
        onDelete={async (id) => {
          await backend.deleteTask(id)
          toast('حذف شد', 'ok')
          reload()
        }}
      />

      <SessionModal
        open={sessionOpen}
        onClose={() => setSessionOpen(false)}
        initial={sessionEdit}
        studentName={s.fullName}
        onSave={async (x) => {
          await backend.saveSession({ ...x, studentId: s.id, counselorId: profile!.id } as any)
          toast('جلسه ذخیره شد', 'ok')
          reload()
        }}
        onDelete={async (id) => {
          await backend.deleteSession(id)
          toast('جلسه حذف شد', 'ok')
          reload()
        }}
      />

      <Modal
        open={editProfile}
        onClose={() => setEditProfile(false)}
        title="ویرایش مشخصات دانش‌آموز"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditProfile(false)}>انصراف</Button>
            <Button onClick={saveProfile}>ذخیره</Button>
          </>
        }
      >
        <div className="space-y-3.5">
          <Field label="نام و نام خانوادگی">
            <Input value={pForm.fullName} onChange={(e) => setPForm((f) => ({ ...f, fullName: e.target.value }))} />
          </Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="پایه">
              <Input value={pForm.grade} onChange={(e) => setPForm((f) => ({ ...f, grade: e.target.value }))} />
            </Field>
            <Field label="رشته">
              <Input value={pForm.field} onChange={(e) => setPForm((f) => ({ ...f, field: e.target.value }))} />
            </Field>
          </div>
          <Field label="مدرسه">
            <Input value={pForm.school} onChange={(e) => setPForm((f) => ({ ...f, school: e.target.value }))} />
          </Field>
          <p className="text-[11px] text-slate-500">شماره موبایل شناسه‌ی ورود است و از سمت مشاور تغییر نمی‌کند.</p>
        </div>
      </Modal>
    </div>
  )
}

/** توضیح «چرا این پیشنهاد» — خوانا برای مشاور */
function suggestWhy(id: string, d: { checkins: Checkin[]; mistakes: any[]; lastExamPercent?: number }) {
  const recent = d.checkins.slice(0, 7)
  const avg = (f: 'mood' | 'energy' | 'focus') => (recent.length ? recent.reduce((a, c) => a + c[f], 0) / recent.length : 3)
  const sleep = recent.length ? recent.reduce((a, c) => a + c.sleepHours, 0) / recent.length : 7
  const gap = d.checkins[0] ? Math.round((Date.now() - new Date(d.checkins[0].date + 'T00:00:00').getTime()) / 86400000) : 30
  switch (id) {
    case 'sleep-window':
      return `میانگین خواب ${faNum(sleep.toFixed(1))} ساعت است`
    case 'pomodoro':
    case 'phone-fence':
      return 'میانگین تمرکز پایین ثبت شده'
    case 'breath478':
    case 'worry-time':
      return 'حال کلی چند روز اخیر پایین بوده'
    case 'habit-chain':
      return `${faNum(gap)} روز است چک‌این ثبت نشده`
    case 'mistake-notebook':
      return `${faNum(d.mistakes.filter((m) => !m.resolved).length)} مورد حل‌نشده در دفتر اشتباهات`
    case 'exam-analysis':
      return `میانگین آخرین آزمون ${faNum(d.lastExamPercent ?? 0)}٪ بوده`
    default:
      return 'برای همه‌ی دانش‌آموزان مفید است'
  }
}
