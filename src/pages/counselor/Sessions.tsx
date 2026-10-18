import { useState } from 'react'
import { useApp } from '../../store/AppContext'
import { useAsync } from '../../store/hooks'
import { Badge, Button, Card, EmptyState, Field, SectionTitle, Select, Spinner, StatCard, Tabs } from '../../components/ui'
import { SessionModal } from '../../components/modals'
import { faDate, faNum, faRelative, faTime, todayIso } from '../../lib/jalali'
import type { Profile, SessionRow } from '../../lib/types'
import { IconCalendar, IconPlus } from '../../components/icons'

export function Sessions() {
  const { backend, profile, toast } = useApp()
  const [studentId, setStudentId] = useState('')
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState<SessionRow | null>(null)
  const [tab, setTab] = useState<'upcoming' | 'past' | 'all'>('upcoming')

  const { data, loading, reload } = useAsync(
    async () => {
      const students = await backend.listStudents(profile!.id)
      const rows: { session: SessionRow; student: Profile }[] = []
      for (const s of students) {
        const list = await backend.listSessions(s.id)
        list.forEach((x) => rows.push({ session: x, student: s }))
      }
      return { students, rows: rows.sort((a, b) => (a.session.date < b.session.date ? 1 : -1)) }
    },
    [backend, profile?.id],
    { students: [] as Profile[], rows: [] as { session: SessionRow; student: Profile }[] },
  )

  const today = todayIso()
  const upcoming = data.rows.filter((r) => r.session.date >= today && r.session.status === 'scheduled')
  const past = data.rows.filter((r) => r.session.date < today || r.session.status !== 'scheduled')
  const rows = tab === 'upcoming' ? upcoming : tab === 'past' ? past : data.rows

  if (loading) return <Spinner />

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="جلسات پیش‌رو" value={faNum(upcoming.length)} tone="brand" icon={<IconCalendar className="w-4 h-4" />} />
        <StatCard label="جلسات امروز" value={faNum(data.rows.filter((r) => r.session.date === today).length)} tone="violet" />
        <StatCard label="برگزارشده" value={faNum(data.rows.filter((r) => r.session.status === 'done').length)} tone="green" />
        <StatCard label="کل جلسات" value={faNum(data.rows.length)} tone="amber" />
      </div>

      <Card>
        <SectionTitle
          title="جلسه‌های مشاوره"
          subtitle="خلاصه‌ی جلسه محرمانه می‌ماند؛ فقط «قدم‌های بعدی» به دانش‌آموز و والد نشان داده می‌شود"
          icon={<IconCalendar className="w-4 h-4" />}
          action={
            <div className="flex items-center gap-2">
              <Select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="text-xs max-w-[170px]">
                <option value="">انتخاب دانش‌آموز…</option>
                {data.students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName}
                  </option>
                ))}
              </Select>
              <Button size="sm" disabled={!studentId} onClick={() => { setEdit(null); setOpen(true) }}>
                <IconPlus className="w-4 h-4" /> جلسه‌ی جدید
              </Button>
            </div>
          }
        />

        <div className="mb-3">
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'upcoming', label: 'پیش‌رو', count: upcoming.length },
              { value: 'past', label: 'گذشته', count: past.length },
              { value: 'all', label: 'همه', count: data.rows.length },
            ]}
          />
        </div>

        {rows.length === 0 ? (
          <EmptyState title="جلسه‌ای ثبت نشده" body="جلسه‌ی بعدی را ثبت کن تا دانش‌آموز و والد در جریان باشند." icon="📅" />
        ) : (
          <div className="space-y-2.5">
            {rows.map(({ session: x, student }) => (
              <button
                key={x.id}
                onClick={() => {
                  setStudentId(student.id)
                  setEdit(x)
                  setOpen(true)
                }}
                className="w-full text-right border border-slate-200 rounded-2xl p-3.5 hover:border-brand-300 transition"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="brand">{student.fullName}</Badge>
                  <p className="text-sm font-bold text-slate-800 flex-1 min-w-[160px]">{x.topic}</p>
                  <Badge tone={x.status === 'done' ? 'green' : x.status === 'canceled' ? 'rose' : 'amber'}>
                    {x.status === 'done' ? 'برگزار شد' : x.status === 'canceled' ? 'لغو شد' : 'برنامه‌ریزی‌شده'}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  {faDate(x.date, { withWeekday: true })} {x.time ? `· ${faTime(x.time)}` : ''} · {faRelative(x.date)} ·{' '}
                  {x.mode === 'online' ? 'آنلاین' : x.mode === 'in_person' ? 'حضوری' : 'تلفنی'}
                </p>
                {x.nextSteps && <p className="text-[11px] text-slate-600 mt-2 bg-emerald-50 border border-emerald-100 rounded-lg p-2">قدم‌های بعدی: {x.nextSteps}</p>}
              </button>
            ))}
          </div>
        )}
      </Card>

      <SessionModal
        open={open}
        onClose={() => setOpen(false)}
        initial={edit}
        defaultDate={todayIso()}
        studentName={data.students.find((s) => s.id === studentId)?.fullName}
        onSave={async (x) => {
          await backend.saveSession({ ...x, studentId, counselorId: profile!.id } as any)
          toast('جلسه ذخیره شد', 'ok')
          if (x.nextSteps)
            await backend.addFeedback({
              targetType: 'session',
              targetId: (x as any).id || 'new',
              studentId,
              authorId: profile!.id,
              authorRole: 'counselor',
              authorName: profile!.fullName,
              kind: 'comment',
              body: `جمع‌بندی جلسه‌ی «${x.topic}»: ${x.nextSteps}`,
            })
          reload()
        }}
        onDelete={async (id) => {
          await backend.deleteSession(id)
          toast('جلسه حذف شد', 'ok')
          reload()
        }}
      />
    </div>
  )
}
