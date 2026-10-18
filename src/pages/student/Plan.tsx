import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../store/AppContext'
import { useAsync } from '../../store/hooks'
import { Badge, Button, Card, EmptyState, Progress, SectionTitle, Spinner } from '../../components/ui'
import { WeekGrid } from '../../components/WeekGrid'
import { ItemProgressModal, TestsSummary } from '../../components/ItemProgress'
import { addDaysIso, faDate, faNum, faWeekRangeLabel, startOfFaWeek, todayIso } from '../../lib/jalali'
import { PLAN_STATUS_COLOR, PLAN_STATUS_LABEL, VISIBILITY_LABEL, type Plan, type PlanItem } from '../../lib/types'
import { IconBook } from '../../components/icons'

export function StudentPlan() {
  const { backend, profile, toast } = useApp()
  const nav = useNavigate()
  const weekStart = startOfFaWeek(todayIso())
  const [progressFor, setProgressFor] = useState<PlanItem | null>(null)

  const { data, loading, reload } = useAsync(
    async () => {
      const plans = await backend.listPlans(profile!.id)
      const items = await backend.listPlanItemsByRange(profile!.id, weekStart, addDaysIso(weekStart, 6))
      const counts: Record<string, { total: number; done: number }> = {}
      for (const p of plans) {
        const list = await backend.listPlanItems(p.id)
        counts[p.id] = { total: list.length, done: list.filter((i) => i.done).length }
      }
      return { plans, items, counts }
    },
    [backend, profile?.id, weekStart],
    { plans: [] as Plan[], items: [] as PlanItem[], counts: {} as Record<string, { total: number; done: number }> },
  )

  const toggleDone = async (item: PlanItem) => {
    await backend.saveItem({ id: item.id, planId: item.planId, done: !item.done, doneAt: !item.done ? new Date().toISOString() : undefined })
    toast(!item.done ? 'ثبت شد ✅' : 'به‌روزرسانی شد', 'ok')
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
    toast('ثبت شد ✅', 'ok')
    reload()
  }

  if (loading) return <Spinner />

  const pending = data.plans.filter((p) => p.status === 'pending')
  const active = data.plans.find((p) => p.status === 'active')
  const others = data.plans.filter((p) => p.status !== 'active' && p.status !== 'pending')

  return (
    <div className="space-y-5">
      <ItemProgressModal
        open={!!progressFor}
        onClose={() => setProgressFor(null)}
        item={progressFor}
        onSave={saveProgress}
      />

      {pending.length > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <SectionTitle
            title="منتظر تأیید تو"
            subtitle="اگر برنامه با شرایطت نمی‌خورد، درخواست اصلاح بده و دلیلش را بنویس"
            icon={<IconBook className="w-4 h-4" />}
          />
          <div className="space-y-2">
            {pending.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 bg-white rounded-2xl p-3 border border-amber-200">
                <div className="flex-1 min-w-[180px]">
                  <p className="text-sm font-bold text-slate-800">{p.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {faDate(p.startDate)} تا {faDate(p.endDate)} · {VISIBILITY_LABEL[p.visibility]}
                  </p>
                </div>
                <Button size="sm" onClick={() => nav(`/s/plan/${p.id}`)}>مشاهده و پاسخ</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <SectionTitle
          title="برنامه‌ی این هفته"
          subtitle={faWeekRangeLabel(weekStart)}
          icon={<IconBook className="w-4 h-4" />}
          action={active ? <Button size="sm" variant="outline" onClick={() => nav(`/s/plan/${active.id}`)}>جزئیات برنامه</Button> : null}
        />
        {data.items.length === 0 ? (
          <EmptyState title="این هفته آیتمی ثبت نشده" body="اگر برنامه‌ی فعال داری، ممکن است برای این هفته نباشد. از جزئیات برنامه هفته‌های دیگر را ببین." icon="🗓" />
        ) : (
          <WeekGrid
            startIso={weekStart}
            items={data.items}
            onToggleDone={toggleDone}
            onLogProgress={(x) => setProgressFor(x)}
            onOpenItem={(x) => nav(`/s/plan/${x.planId}`)}
            onMoveItem={async (item, newDate) => {
              await backend.saveItem({ id: item.id, planId: item.planId, date: newDate })
              toast(`«${item.title}» به ${faDate(newDate, { short: true })} منتقل شد`, 'ok')
              reload()
            }}
          />
        )}
        {data.items.length > 0 && (
          <div className="mt-3">
            <TestsSummary items={data.items} title="جمع تست‌های این هفته" />
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle title="همه‌ی برنامه‌های من" icon={<IconBook className="w-4 h-4" />} />
        {data.plans.length === 0 ? (
          <EmptyState title="هنوز برنامه‌ای نداری" body="مشاورت به‌زودی برنامه می‌سازد. تا آن‌وقت می‌توانی چک‌این روزانه را شروع کنی." icon="📘" />
        ) : (
          <div className="space-y-2.5">
            {[...pending, ...(active ? [active] : []), ...others].map((p) => {
              const c = data.counts[p.id] || { total: 0, done: 0 }
              return (
                <button key={p.id} onClick={() => nav(`/s/plan/${p.id}`)} className="w-full text-right border border-slate-200 rounded-2xl p-3.5 hover:border-brand-300 transition">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-slate-800 flex-1 min-w-[160px]">{p.title}</p>
                    <Badge tone="slate" className={PLAN_STATUS_COLOR[p.status]}>{PLAN_STATUS_LABEL[p.status]}</Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {faDate(p.startDate)} تا {faDate(p.endDate)} · {faNum(c.total)} آیتم
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Progress value={c.total ? (c.done / c.total) * 100 : 0} className="flex-1" tone="green" />
                    <span className="text-[10px] text-slate-500">{faNum(c.done)}/{faNum(c.total)}</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
