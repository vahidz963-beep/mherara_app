import { useState } from 'react'
import { useApp } from '../../store/AppContext'
import { useAsync } from '../../store/hooks'
import { Badge, Button, Card, EmptyState, Progress, SectionTitle, Spinner, StatCard } from '../../components/ui'
import { WeekGrid } from '../../components/WeekGrid'
import { addDaysIso, faDate, faNum, faWeekRangeLabel, startOfFaWeek, todayIso } from '../../lib/jalali'
import { PLAN_STATUS_COLOR, PLAN_STATUS_LABEL, type Plan, type PlanItem, type Profile } from '../../lib/types'

export function ParentPlan() {
  const { backend, profile } = useApp()
  const [weekStart, setWeekStart] = useState(startOfFaWeek(todayIso()))

  const { data, loading } = useAsync(
    async () => {
      const children = await backend.listChildren(profile!.id)
      const child = children[0] || null
      if (!child) return { child: null, plans: [] as Plan[], items: [] as PlanItem[] }
      const allPlans = await backend.listPlans(child.id)
      const plans = allPlans.filter((p) => (p.parentShare ?? 'shared') === 'shared' && p.visibility !== 'private')
      const active = plans.find((p) => p.status === 'active') || plans[0] || null
      const items = active ? await backend.listPlanItems(active.id) : []
      return { child, plans, items, active }
    },
    [backend, profile?.id],
    { child: null as Profile | null, plans: [] as Plan[], items: [] as PlanItem[], active: null as Plan | null },
  )

  if (loading) return <Spinner />
  if (!data.child) return <EmptyState title="ابتدا به پرونده‌ی فرزندتان وصل شوید" body="از صفحه‌ی خانه شماره موبایل فرزند را وارد کنید." icon="🔗" />

  const weekItems = data.items.filter((i) => i.date >= weekStart && i.date <= addDaysIso(weekStart, 6))
  const done = data.items.filter((i) => i.done).length
  const totalMinutes = data.items.reduce((s, i) => s + (i.minutes || 0), 0)
  const weekMinutes = weekItems.reduce((s, i) => s + (i.minutes || 0), 0)

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle
          title={`برنامه‌ی ${data.child.fullName}`}
          subtitle="نمای خواندنی برای والدین — برای تغییر برنامه با مشاور صحبت کنید"
          icon={<span>📘</span>}
          action={
            data.active ? (
              <div className="flex items-center gap-2">
                <Badge tone="slate" className={PLAN_STATUS_COLOR[data.active.status]}>{PLAN_STATUS_LABEL[data.active.status]}</Badge>
                <Button size="sm" variant="ghost" onClick={() => setWeekStart(startOfFaWeek(todayIso()))}>هفته‌ی جاری</Button>
              </div>
            ) : null
          }
        />
        {!data.active ? (
          <EmptyState title="برنامه‌ای ثبت نشده" icon="📘" />
        ) : (
          <>
            <p className="text-xs text-slate-500 mb-3">
              {data.active.title} · {faDate(data.active.startDate)} تا {faDate(data.active.endDate)}
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <StatCard label="مجموع ساعت برنامه" value={faNum(Math.round(totalMinutes / 60))} unit="ساعت" tone="brand" />
              <StatCard label="انجام‌شده" value={`${faNum(done)}/${faNum(data.items.length)}`} tone="green" />
              <StatCard label="درصد پیشرفت" value={`${faNum(data.items.length ? Math.round((done / data.items.length) * 100) : 0)}٪`} tone="violet" />
              <StatCard label="ساعت برنامه‌ی این هفته" value={faNum(Math.round(weekMinutes / 60))} unit="ساعت" tone="amber" />
            </div>
            <Progress value={data.items.length ? (done / data.items.length) * 100 : 0} tone="green" className="mb-4" />

            <div className="flex items-center justify-between mb-3">
              <Button variant="ghost" size="sm" onClick={() => setWeekStart(addDaysIso(weekStart, 7))}>هفته‌ی بعد ›</Button>
              <p className="text-xs font-bold text-slate-700">{faWeekRangeLabel(weekStart)}</p>
              <Button variant="ghost" size="sm" onClick={() => setWeekStart(addDaysIso(weekStart, -7))}>‹ هفته‌ی قبل</Button>
            </div>

            <WeekGrid startIso={weekStart} items={weekItems} emptyHint="برای این روز موردی ثبت نشده" />
          </>
        )}
      </Card>

      <Card>
        <SectionTitle title="برنامه‌های دیگر" subtitle="تاریخچه" />
        <div className="space-y-2">
          {data.plans.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-2 border border-slate-200 rounded-2xl p-3">
              <p className="text-xs font-bold text-slate-700 flex-1">{p.title}</p>
              <Badge tone="slate" className={PLAN_STATUS_COLOR[p.status]}>{PLAN_STATUS_LABEL[p.status]}</Badge>
              <span className="text-[11px] text-slate-500">{faDate(p.startDate)} تا {faDate(p.endDate)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
