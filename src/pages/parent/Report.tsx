import { useState } from 'react'
import { useApp } from '../../store/AppContext'
import { useAsync } from '../../store/hooks'
import { Badge, Button, Card, EmptyState, Progress, SectionTitle, Spinner, StatCard } from '../../components/ui'
import { CheckinChart } from '../../components/CheckinChart'
import { TestsSummary } from '../../components/ItemProgress'
import { LEISURE_ITEMS, leisureCounts } from '../../lib/leisure'
import { addDaysIso, faDate, faNum, faRelative, startOfFaWeek, todayIso } from '../../lib/jalali'
import type { Checkin, Plan, PlanItem, Profile, SessionRow, Task } from '../../lib/types'
import { IconChart } from '../../components/icons'

export function ParentReport() {
  const { backend, profile } = useApp()
  const [offset, setOffset] = useState(0)
  const weekStart = addDaysIso(startOfFaWeek(todayIso()), offset * 7)
  const weekEnd = addDaysIso(weekStart, 6)

  const { data, loading } = useAsync(
    async () => {
      const children = await backend.listChildren(profile!.id)
      const child = children[0] || null
      if (!child) return { child: null, plans: [], items: [], checkins: [], sessions: [], tasks: [] }
      const [allPlans, allItems, checkins, sessions, tasks] = await Promise.all([
        backend.listPlans(child.id),
        backend.listPlanItemsByRange(child.id, weekStart, weekEnd),
        backend.listCheckins(child.id, 60),
        backend.listSessions(child.id),
        backend.listTasks(child.id),
      ])
      const visiblePlans = allPlans.filter((p) => (p.parentShare ?? 'shared') === 'shared' && p.visibility !== 'private')
      const plans = visiblePlans
      const visibleIds = new Set(visiblePlans.map((p) => p.id))
      const items = allItems.filter((i) => visibleIds.has(i.planId))
      const exams = await backend.listExams(child.id)
      let examRows: { exam: any; subjects: any[] }[] = []
      for (const e of exams.slice(0, 4)) examRows.push({ exam: e, subjects: await backend.listExamSubjects(e.id) })
      return { child, plans, items, checkins, sessions, tasks, exams, examRows }
    },
    [backend, profile?.id, weekStart],
    {
      child: null as Profile | null,
      plans: [] as Plan[],
      items: [] as PlanItem[],
      checkins: [] as Checkin[],
      sessions: [] as SessionRow[],
      tasks: [] as Task[],
      exams: [] as any[],
      examRows: [] as { exam: any; subjects: any[] }[],
    },
  )

  if (loading) return <Spinner />

  if (!data.child)
    return (
      <Card>
        <EmptyState title="ابتدا به پرونده‌ی فرزندتان وصل شوید" body="از صفحه‌ی خانه، شماره موبایل فرزند را وارد کنید." icon="🔗" />
      </Card>
    )

  const weekCheckins = data.checkins.filter((c) => c.date >= weekStart && c.date <= weekEnd)
  const studyMinutes = weekCheckins.reduce((s, c) => s + c.studyMinutes, 0)
  const done = data.items.filter((i) => i.done).length
  const avgMood = weekCheckins.length ? weekCheckins.reduce((s, c) => s + c.mood, 0) / weekCheckins.length : 0
  const avgSleep = weekCheckins.length ? weekCheckins.reduce((s, c) => s + c.sleepHours, 0) / weekCheckins.length : 0
  const avgScreen = weekCheckins.length ? weekCheckins.reduce((s, c) => s + (c.screenHours || 0), 0) / weekCheckins.length : 0
  const exerciseWeek = weekCheckins.reduce((s, c) => s + (c.exerciseMinutes || 0), 0)
  const leisureWeek = leisureCounts(data.checkins, weekStart, weekEnd)
  const leisureTotal = Object.values(leisureWeek).reduce((a, b) => a + b, 0)
  const testItems: PlanItem[] = data.items
  const testsTotal = testItems.reduce((sum: number, i) => sum + (i.testsTotal || 0), 0)
  const testsCorrect = testItems.reduce((sum: number, i) => sum + Math.min(i.testsCorrect || 0, i.testsTotal || 0), 0)
  const weekSessions = data.sessions.filter((x) => x.date >= weekStart && x.date <= weekEnd)
  const tasksDone = data.tasks.filter((t) => t.status === 'done' && t.updatedAt?.slice(0, 10) >= weekStart && t.updatedAt?.slice(0, 10) <= weekEnd)

  return (
    <div className="space-y-5">
      <Card className="no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">گزارش هفتگی</p>
            <p className="text-sm font-bold text-slate-800">
              {faDate(weekStart)} تا {faDate(weekEnd)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOffset((o) => o - 1)}>هفته‌ی قبل</Button>
            <Button variant="outline" size="sm" onClick={() => setOffset(0)}>هفته‌ی جاری</Button>
            <Button variant="ghost" size="sm" onClick={() => setOffset((o) => Math.min(0, o + 1))}>هفته‌ی بعد</Button>
            <Button size="sm" onClick={() => window.print()}>چاپ / PDF</Button>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle title={`گزارش ${data.child.fullName}`} subtitle={`${data.child.grade || ''} ${data.child.field ? `· ${data.child.field}` : ''}`} icon={<IconChart className="w-4 h-4" />} />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="مطالعه‌ی هفته" value={faNum(Math.round(studyMinutes / 60))} unit="ساعت" tone="brand" />
          <StatCard label="انجام برنامه" value={`${faNum(data.items.length ? Math.round((done / data.items.length) * 100) : 0)}٪`} hint={`${faNum(done)} از ${faNum(data.items.length)} کار`} tone="green" />
          <StatCard label="میانگین حال" value={weekCheckins.length ? faNum(avgMood.toFixed(1)) : '—'} unit="از ۵" tone="violet" />
          <StatCard label="میانگین خواب" value={weekCheckins.length ? faNum(avgSleep.toFixed(1)) : '—'} unit="ساعت" tone="amber" />
          <StatCard label="میانگین فضای مجازی" value={weekCheckins.length ? faNum(avgScreen.toFixed(1)) : '—'} unit="ساعت در روز" tone={avgScreen >= 4 ? 'rose' : 'violet'} />
          <StatCard label="ورزش این هفته" value={faNum(exerciseWeek)} unit="دقیقه" tone="green" />
          <StatCard label="تفریح‌های سالم" value={faNum(leisureTotal)} unit="تیک در هفته" tone="brand" />
          <StatCard
            label="تست‌های این هفته"
            value={`${faNum(testsCorrect)}/${faNum(testsTotal)}`}
            hint="درست از کل"
            tone="green"
          />
        </div>

        <div className="mt-4">
          <TestsSummary items={data.items} title="جمع تست‌ها و مراحل مطالعه‌ی این هفته" />
        </div>

        {leisureTotal > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {Object.entries(leisureWeek)
              .sort((a, b) => b[1] - a[1])
              .map(([id, n]) => {
                const l = LEISURE_ITEMS.find((x) => x.id === id)
                return (
                  <Badge key={id} tone="brand">
                    {l?.emoji} {l?.label || id} — {faNum(n)} روز
                  </Badge>
                )
              })}
          </div>
        )}

        <div className="mt-4 grid lg:grid-cols-2 gap-5">
          <div>
            <p className="text-xs font-bold text-slate-700 mb-2">کارهای انجام‌شده در این هفته</p>
            {data.items.length === 0 ? (
              <p className="text-[11px] text-slate-400">برای این هفته آیتمی ثبت نشده است.</p>
            ) : (
              <div className="space-y-2">
                {data.items.map((i) => (
                  <div key={i.id} className="flex items-center gap-2 bg-slate-50 rounded-xl p-2.5">
                    <Badge tone={i.done ? 'green' : 'slate'}>{i.done ? '✓ انجام شد' : 'انجام نشد'}</Badge>
                    <p className="text-[11px] text-slate-700 flex-1">{i.title}</p>
                    <span className="text-[10px] text-slate-500">{faDate(i.date, { short: true })}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-bold text-slate-700 mb-2">چک‌این‌های هفته</p>
            {weekCheckins.length === 0 ? (
              <p className="text-[11px] text-slate-400">چک‌اینی ثبت نشده.</p>
            ) : (
              <div className="space-y-2">
                {weekCheckins.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 bg-slate-50 rounded-xl p-2.5">
                    <Badge tone={c.mood >= 4 ? 'green' : c.mood >= 3 ? 'amber' : 'rose'}>حال {faNum(c.mood)}/۵</Badge>
                    <p className="text-[11px] text-slate-600 flex-1">
                      {faDate(c.date, { short: true })} · مطالعه {faNum(c.studyMinutes)}′ · خواب {faNum(String(c.sleepHours))} س
                      {c.screenHours ? ` · فضای مجازی ${faNum(String(c.screenHours))} س` : ''}
                      {c.exerciseMinutes ? ` · ورزش ${faNum(c.exerciseMinutes)}′` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs font-bold text-slate-700 mb-2 mt-4">جلسه‌های هفته</p>
            {weekSessions.length === 0 ? (
              <p className="text-[11px] text-slate-400">جلسه‌ای در این هفته ثبت نشده.</p>
            ) : (
              <div className="space-y-2">
                {weekSessions.map((x) => (
                  <div key={x.id} className="bg-slate-50 rounded-xl p-2.5">
                    <div className="flex items-center gap-2">
                      <Badge tone={x.status === 'done' ? 'green' : 'brand'}>{x.status === 'done' ? 'برگزار شد' : faRelative(x.date)}</Badge>
                      <p className="text-[11px] font-bold text-slate-700">{x.topic}</p>
                    </div>
                    {x.nextSteps && <p className="text-[11px] text-slate-600 mt-1.5">قدم‌های بعدی: {x.nextSteps}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {data.examRows.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-bold text-slate-700 mb-2">آزمون‌ها و کارنامه‌ها</p>
            <div className="space-y-2">
              {data.examRows.map(({ exam, subjects }) => (
                <div key={exam.id} className="border border-slate-200 rounded-2xl p-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-bold text-slate-700">{exam.title}</p>
                    <span className="text-[10px] text-slate-500">{faDate(exam.date, { short: true })}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {subjects.map((s: any) => {
                      const p = s.percent ?? (s.total ? Math.round((s.correct / s.total) * 1000) / 10 : 0)
                      return (
                        <Badge key={s.id} tone={p >= 60 ? 'green' : p >= 40 ? 'amber' : 'rose'}>
                          {s.subject} {faNum(p)}%
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5">
          <p className="text-xs font-bold text-slate-700 mb-2">روند ۱۴ روز اخیر</p>
          <CheckinChart data={data.checkins} />
        </div>

        <div className="mt-4 grid sm:grid-cols-3 gap-3">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
            <p className="text-[11px] font-bold text-emerald-800 mb-1">نقاط قوت</p>
            <p className="text-[11px] text-slate-700 leading-6">
              {done > 0 ? `در این هفته ${faNum(done)} کار از برنامه انجام شد.` : 'ثبات در ثبت چک‌این ارزشمند است.'}{' '}
              {weekCheckins.length >= 4 ? 'ثبت منظم چک‌این نشانه‌ی خودآگاهی خوب است.' : ''}
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
            <p className="text-[11px] font-bold text-amber-800 mb-1">نکته‌ها</p>
            <p className="text-[11px] text-slate-700 leading-6">
              {weekCheckins.length < 4 ? 'تعداد چک‌این‌ها کم است؛ یک یادآور روزانه بگذارید.' : 'روند ثبت خوب است.'}{' '}
              {avgSleep && avgSleep < 6.5 ? 'میانگین خواب کمتر از ۶.۵ ساعت است؛ روی ساعت خواب گفت‌وگو کنید.' : ''}{' '}
              {avgScreen >= 4 ? 'میانگین فضای مجازی بالای ۴ ساعت است؛ بهتر است تفریح‌های جایگزین را با هم انتخاب کنید.' : ''}
            </p>
          </div>
          <div className="bg-brand-50 border border-brand-100 rounded-xl p-3">
            <p className="text-[11px] font-bold text-brand-800 mb-1">قدم پیشنهادی</p>
            <p className="text-[11px] text-slate-700 leading-6">
              این گزارش را به مشاور نشان دهید و بخواهید برای هفته‌ی بعد یک هدف کوچک و قابل اندازه‌گیری تعیین کند.
            </p>
          </div>
        </div>

        <Progress className="mt-5" value={data.items.length ? (done / data.items.length) * 100 : 0} tone="green" />
        <p className="text-[10px] text-slate-400 mt-2">
          این گزارش فقط برای والدین تولید شده و جزئیات خصوصی جلسه‌های مشاوره را شامل نمی‌شود. تعداد تمرین‌های تکمیل‌شده در این هفته: {faNum(tasksDone.length)}
        </p>
      </Card>
    </div>
  )
}
