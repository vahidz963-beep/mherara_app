import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../store/AppContext'
import { useAsync } from '../../store/hooks'
import { Badge, Button, Card, EmptyState, Progress, SectionTitle, Select, Spinner, Tabs } from '../../components/ui'
import { faDate, faNum } from '../../lib/jalali'
import { PLAN_STATUS_COLOR, PLAN_STATUS_LABEL, type Plan, type Profile } from '../../lib/types'
import { IconBook } from '../../components/icons'

export function AllPlans() {
  const { backend, profile, toast } = useApp()
  const nav = useNavigate()
  const [filter, setFilter] = useState<'all' | Plan['status']>('all')
  const [studentFilter, setStudentFilter] = useState('all')

  const { data, loading, reload } = useAsync(
    async () => {
      const students = await backend.listStudents(profile!.id)
      const rows: { plan: Plan; student: Profile; total: number; done: number }[] = []
      for (const s of students) {
        const plans = await backend.listPlans(s.id)
        for (const p of plans) {
          const items = await backend.listPlanItems(p.id)
          rows.push({ plan: p, student: s, total: items.length, done: items.filter((i) => i.done).length })
        }
      }
      return { students, rows: rows.sort((a, b) => (a.plan.startDate < b.plan.startDate ? 1 : -1)) }
    },
    [backend, profile?.id],
    { students: [] as Profile[], rows: [] as any[] },
  )

  const rows = data.rows.filter(
    (r) => (filter === 'all' || r.plan.status === filter) && (studentFilter === 'all' || r.student.id === studentFilter),
  )

  const counts = {
    all: data.rows.length,
    draft: data.rows.filter((r) => r.plan.status === 'draft').length,
    pending: data.rows.filter((r) => r.plan.status === 'pending').length,
    active: data.rows.filter((r) => r.plan.status === 'active').length,
    needs_revision: data.rows.filter((r) => r.plan.status === 'needs_revision').length,
    archived: data.rows.filter((r) => r.plan.status === 'archived').length,
  }

  if (loading) return <Spinner />

  return (
    <Card>
      <SectionTitle
        title="همه‌ی برنامه‌ها"
        subtitle="نگاه یک‌جا به وضعیت برنامه‌های همه‌ی دانش‌آموزان"
        icon={<IconBook className="w-4 h-4" />}
        action={
          <Select value={studentFilter} onChange={(e) => setStudentFilter(e.target.value)} className="text-xs max-w-[180px]">
            <option value="all">همه‌ی دانش‌آموزان</option>
            {data.students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName}
              </option>
            ))}
          </Select>
        }
      />

      <div className="mb-4">
        <Tabs
          value={filter}
          onChange={setFilter}
          tabs={[
            { value: 'all', label: 'همه', count: counts.all },
            { value: 'pending', label: 'در انتظار تأیید', count: counts.pending },
            { value: 'draft', label: 'پیش‌نویس', count: counts.draft },
            { value: 'active', label: 'فعال', count: counts.active },
            { value: 'needs_revision', label: 'نیاز به اصلاح', count: counts.needs_revision },
            { value: 'archived', label: 'بایگانی', count: counts.archived },
          ]}
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState title="برنامه‌ای با این فیلتر نیست" icon="📚" />
      ) : (
        <div className="space-y-2.5">
          {rows.map(({ plan, student, total, done }) => (
            <div key={plan.id} className="border border-slate-200 rounded-2xl p-3.5 hover:border-brand-300 transition">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-slate-800 flex-1 min-w-[180px]">{plan.title}</p>
                <Badge tone="slate" className={PLAN_STATUS_COLOR[plan.status]}>{PLAN_STATUS_LABEL[plan.status]}</Badge>
                <Badge tone="brand">{student.fullName}</Badge>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {faDate(plan.startDate)} تا {faDate(plan.endDate)} · {faNum(total)} آیتم · {faNum(done)} انجام‌شده
              </p>
              <div className="flex items-center gap-3 mt-2">
                <Progress value={total ? (done / total) * 100 : 0} className="flex-1" tone={done / (total || 1) > 0.6 ? 'green' : 'brand'} />
                <Button size="sm" variant="soft" onClick={() => nav(`/c/plan/${plan.id}`)}>ویرایش</Button>
                {plan.status === 'draft' && (
                  <Button
                    size="sm"
                    onClick={async () => {
                      await backend.updatePlan(plan.id, { status: 'pending' })
                      await backend.addFeedback({
                        targetType: 'plan',
                        targetId: plan.id,
                        studentId: plan.studentId,
                        authorId: profile!.id,
                        authorRole: 'counselor',
                        authorName: profile!.fullName,
                        kind: 'comment',
                        body: 'برنامه‌ی جدید آماده است؛ بررسی کن و بازخوردت را بنویس.',
                      })
                      toast('برای تأیید ارسال شد', 'ok')
                      reload()
                    }}
                  >
                    ارسال برای تأیید
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
