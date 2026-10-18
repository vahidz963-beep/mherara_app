import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../store/AppContext'
import { useAsync } from '../../store/hooks'
import { Badge, Button, Card, EmptyState, Input, Progress, SectionTitle, Spinner, StatCard } from '../../components/ui'
import { WeekGrid } from '../../components/WeekGrid'
import { ItemProgressModal, TestsSummary } from '../../components/ItemProgress'
import { PlanItemModal } from '../../components/PlanItemModal'
import { FeedbackThread } from '../../components/FeedbackThread'
import { addDaysIso, faDate, faNum, faWeekRangeLabel, startOfFaWeek, todayIso } from '../../lib/jalali'
import { PLAN_STATUS_COLOR, PLAN_STATUS_LABEL, VISIBILITY_LABEL, type Plan, type PlanItem } from '../../lib/types'

export function StudentPlanDetail() {
  const { planId = '' } = useParams()
  const { backend, profile, toast } = useApp()
  const nav = useNavigate()

  const { data, loading, reload } = useAsync(
    async () => {
      const plan = await backend.getPlan(planId)
      if (!plan) throw new Error('برنامه پیدا نشد')
      const [items, counselor] = await Promise.all([
        backend.listPlanItems(plan.id),
        plan.counselorId ? backend.getProfile(plan.counselorId) : Promise.resolve(null),
      ])
      return { plan, items, counselor }
    },
    [backend, planId],
    { plan: null as Plan | null, items: [] as PlanItem[], counselor: null as any },
  )

  const [weekStart, setWeekStart] = useState(startOfFaWeek(todayIso()))
  const [modal, setModal] = useState<{ open: boolean; item: PlanItem | null; date: string }>({ open: false, item: null, date: todayIso() })
  const [noteFor, setNoteFor] = useState<PlanItem | null>(null)
  const [progressFor, setProgressFor] = useState<PlanItem | null>(null)
  const [noteText, setNoteText] = useState('')

  if (loading) return <Spinner />
  const plan = data.plan
  if (!plan) return <EmptyState title="برنامه پیدا نشد" icon="🔍" />

  const editable = plan.visibility === 'student_editable'
  const weekItems = data.items.filter((i) => i.date >= weekStart && i.date <= addDaysIso(weekStart, 6))
  const done = data.items.filter((i) => i.done).length
  const totalMinutes = data.items.reduce((s, i) => s + (i.minutes || 0), 0)

  const moveItem = async (item: PlanItem, newDate: string) => {
    await backend.saveItem({ id: item.id, planId, date: newDate })
    await backend.addFeedback({
      targetType: 'item',
      targetId: item.id,
      studentId: profile!.id,
      authorId: profile!.id,
      authorRole: 'student',
      authorName: profile!.fullName,
      kind: 'edit',
      body: `جابه‌جایی «${item.title}» به ${faDate(newDate, { withWeekday: true })}`,
    })
    toast('جابه‌جا شد ✅', 'ok')
    reload()
  }

  const toggleDone = async (item: PlanItem) => {
    await backend.saveItem({ id: item.id, planId, done: !item.done, doneAt: !item.done ? new Date().toISOString() : undefined })
    await backend.addFeedback({
      targetType: 'item',
      targetId: item.id,
      studentId: profile!.id,
      authorId: profile!.id,
      authorRole: 'student',
      authorName: profile!.fullName,
      kind: 'edit',
      body: !item.done ? `انجام شد: ${item.title}` : `علامت انجام‌شدن برداشته شد: ${item.title}`,
    })
    reload()
  }

  const saveProgress = async (patch: { testsTotal?: number | null; testsCorrect?: number | null; stages?: number[] }) => {
    const item = progressFor
    if (!item) return
    await backend.saveItem({ id: item.id, planId, ...patch })
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
          ? `ثبت مراحل مطالعه برای «${item.title}»${(patch.stages || []).length ? `: مرحله‌ی ${patch.stages!.join('، ')}` : ''}`
          : `ثبت تست «${item.title}»: ${patch.testsCorrect}/${patch.testsTotal}${
              (patch.stages || []).length ? ` · مرحله‌ی ${patch.stages!.join('، ')}` : ''
            }`,
    })
    toast('ثبت شد ✅', 'ok')
    reload()
  }

  const respondPlan = async (kind: 'approve' | 'request_change', body: string) => {
    await backend.updatePlan(plan.id, { status: kind === 'approve' ? 'active' : 'needs_revision' })
    await backend.addFeedback({
      targetType: 'plan',
      targetId: plan.id,
      studentId: profile!.id,
      authorId: profile!.id,
      authorRole: 'student',
      authorName: profile!.fullName,
      kind,
      body,
    })
    toast(kind === 'approve' ? 'برنامه تأیید و فعال شد 🎉' : 'درخواست اصلاح ارسال شد', 'ok')
    reload()
  }

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-[220px]">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-black text-slate-800">{plan.title}</h2>
              <Badge tone="slate" className={PLAN_STATUS_COLOR[plan.status]}>{PLAN_STATUS_LABEL[plan.status]}</Badge>
              <Badge tone="slate">{VISIBILITY_LABEL[plan.visibility]}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              {faDate(plan.startDate)} تا {faDate(plan.endDate)}
              {data.counselor ? ` · مشاور: ${data.counselor.fullName}` : ''}
            </p>
            {plan.note && <p className="text-xs text-slate-600 mt-2 bg-slate-50 rounded-xl p-2.5 leading-6">{plan.note}</p>}
          </div>
          <Button variant="outline" size="sm" onClick={() => nav('/s/plan')}>بازگشت</Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <StatCard label="آیتم‌ها" value={faNum(data.items.length)} tone="brand" />
          <StatCard label="انجام‌شده" value={`${faNum(done)}/${faNum(data.items.length)}`} tone="green" />
          <StatCard label="مجموع ساعت" value={faNum(Math.round(totalMinutes / 60))} tone="violet" />
          <StatCard label="درصد پیشرفت" value={`${faNum(data.items.length ? Math.round((done / data.items.length) * 100) : 0)}٪`} tone="amber" />
        </div>
        <Progress className="mt-3" value={data.items.length ? (done / data.items.length) * 100 : 0} tone="green" />

        {plan.status === 'pending' && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-3.5">
            <p className="text-sm font-bold text-amber-900">این برنامه منتظر تأیید توست</p>
            <p className="text-[11px] text-amber-800 mt-1 leading-6">
              اگر با ساعت کلاس‌ها، خواب یا توانت جور نیست، «درخواست اصلاح» بزن و دقیق بنویس کدام بخش را چطور تغییر بدهیم. اگر خوب است،
              تأیید کن تا فعال شود.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button size="sm" variant="success" onClick={() => respondPlan('approve', 'برنامه را دیدم و تأیید می‌کنم ✅')}>
                تأیید می‌کنم
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const el = document.getElementById('plan-thread')
                  el?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                درخواست اصلاح (در بخش گفت‌وگو)
              </Button>
            </div>
          </div>
        )}

        {plan.status === 'needs_revision' && (
          <p className="mt-4 text-[11px] bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-3">
            درخواست اصلاح ثبت شد؛ منتظر نسخه‌ی اصلاح‌شده‌ی مشاور باش.
          </p>
        )}
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setWeekStart(addDaysIso(weekStart, 7))}>هفته‌ی بعد ›</Button>
            <p className="text-xs font-bold text-slate-700">{faWeekRangeLabel(weekStart)}</p>
            <Button variant="ghost" size="sm" onClick={() => setWeekStart(addDaysIso(weekStart, -7))}>‹ هفته‌ی قبل</Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setWeekStart(startOfFaWeek(todayIso()))}>هفته‌ی جاری</Button>
            {editable && (
              <Button size="sm" onClick={() => setModal({ open: true, item: null, date: weekStart })}>+ آیتم جدید</Button>
            )}
          </div>
        </div>

        {!editable && (
          <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-2.5 mb-3">
            این برنامه در حالت «فقط مشاهده» است؛ می‌توانی انجام‌شدن را تیک بزنی و یادداشت بگذاری، ولی برای جابه‌جایی بلوک‌ها از مشاور بخواه
            یا در گفت‌وگو بنویس.
          </p>
        )}

        <WeekGrid
          startIso={weekStart}
          items={weekItems}
          editable={editable}
          onToggleDone={toggleDone}
          onEdit={(item) => setModal({ open: true, item, date: item.date })}
          onAdd={(d) => setModal({ open: true, item: null, date: d })}
          onMoveItem={moveItem}
          onLogProgress={(x) => setProgressFor(x)}
          onOpenItem={(x) => {
            setNoteFor(x)
            setNoteText(x.studentNote || '')
          }}
        />

        <div className="mt-3">
          <TestsSummary items={weekItems} title={`هفته‌ی ${faWeekRangeLabel(weekStart)}`} />
        </div>

        <ItemProgressModal
          open={!!progressFor}
          onClose={() => setProgressFor(null)}
          item={progressFor}
          onSave={saveProgress}
        />

        {noteFor && (
          <div className="mt-3 bg-brand-50 border border-brand-100 rounded-2xl p-3">
            <p className="text-xs font-bold text-brand-800 mb-1.5">یادداشت من روی «{noteFor.title}»</p>
            <Input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="مثلاً: این بازه را جابه‌جا کردم چون کلاس داشتم." className="text-xs" />
            <div className="flex justify-end gap-2 mt-2">
              <Button size="sm" variant="ghost" onClick={() => setNoteFor(null)}>بستن</Button>
              <Button
                size="sm"
                onClick={async () => {
                  await backend.saveItem({ id: noteFor.id, planId, studentNote: noteText })
                  toast('یادداشت ذخیره شد', 'ok')
                  setNoteFor(null)
                  reload()
                }}
              >
                ذخیره
              </Button>
            </div>
          </div>
        )}
      </Card>

      <div id="plan-thread">
        <FeedbackThread
          targetType="plan"
          targetId={plan.id}
          studentId={profile!.id}
          title="گفت‌وگو درباره‌ی این برنامه"
          subtitle="اینجا می‌توانی «درخواست اصلاح» بزنی یا سؤالت را بپرسی"
        />
      </div>

      <PlanItemModal
        open={modal.open}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
        planId={plan.id}
        dateIso={modal.date}
        initial={modal.item}
        subjects={Array.from(new Set(data.items.map((i) => i.subject).filter(Boolean)))}
        onSave={async (item) => {
          await backend.saveItem(item)
          await backend.addFeedback({
            targetType: 'item',
            targetId: (item as any).id || 'new',
            studentId: profile!.id,
            authorId: profile!.id,
            authorRole: 'student',
            authorName: profile!.fullName,
            kind: 'edit',
            body: `${modal.item ? 'ویرایش' : 'افزودن'} آیتم: ${item.title}${item.date ? ` (${faDate(item.date, { short: true })})` : ''}`,
          })
          reload()
        }}
        onDelete={async (id) => {
          await backend.deleteItem(id)
          toast('آیتم حذف شد', 'ok')
          reload()
        }}
      />
    </div>
  )
}
