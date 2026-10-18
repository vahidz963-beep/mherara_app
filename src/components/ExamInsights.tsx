import { useMemo, useState } from 'react'
import { faDate, faNum } from '../lib/jalali'
import { MISTAKE_REASON_COLOR, MISTAKE_REASON_LABEL, subjectPercent, type Exam, type ExamMistake, type ExamSubject, type MistakeReason } from '../lib/types'
import { Badge, Card, EmptyState, Progress, SectionTitle, cn } from './ui'
import { IconChart } from './icons'

export type ExamRow = { exam: Exam; subjects: ExamSubject[] }

/** میانگین درصد هر آزمون (وزنی بر اساس تعداد سؤال) */
export const examAverage = (subjects: ExamSubject[]) => {
  if (!subjects.length) return 0
  const totalQ = subjects.reduce((s, x) => s + (x.total || 0), 0)
  if (totalQ) return Math.round((subjects.reduce((s, x) => s + subjectPercent(x) * (x.total || 0), 0) / totalQ) * 10) / 10
  return Math.round((subjects.reduce((s, x) => s + subjectPercent(x), 0) / subjects.length) * 10) / 10
}

export function ExamTrend({ rows }: { rows: ExamRow[] }) {
  const chrono = useMemo(() => [...rows].sort((a, b) => (a.exam.date < b.exam.date ? -1 : 1)), [rows])
  if (chrono.length < 2)
    return <p className="text-xs text-slate-400 py-6 text-center">برای دیدن روند، حداقل دو آزمون ثبت کنید.</p>

  const W = Math.max(chrono.length * 62, 320)
  const H = 140
  const points = chrono.map((r, i) => {
    const x = chrono.length === 1 ? W / 2 : 30 + (i * (W - 60)) / (chrono.length - 1)
    const y = H - 20 - (examAverage(r.subjects) / 100) * (H - 45)
    return { x, y, avg: examAverage(r.subjects), exam: r.exam }
  })

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H + 30}`} height={185} style={{ direction: 'ltr' }} className="min-w-full">
        {[0, 25, 50, 75, 100].map((g) => (
          <g key={g}>
            <line x1="20" x2={W - 10} y1={H - 20 - (g / 100) * (H - 45)} y2={H - 20 - (g / 100) * (H - 45)} stroke="#e2e8f0" strokeDasharray="4 6" />
            <text x="6" y={H - 17 - (g / 100) * (H - 45)} fontSize="8" fill="#94a3b8">
              {g}%
            </text>
          </g>
        ))}
        <polyline points={points.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#6366f1" strokeWidth="2" />
        {points.map((p) => (
          <g key={p.exam.id}>
            <circle cx={p.x} cy={p.y} r="4.5" fill="#fff" stroke="#4f46e5" strokeWidth="2" />
            <text x={p.x} y={p.y - 9} textAnchor="middle" fontSize="9" fill="#4f46e5" fontWeight="bold">
              {faNum(p.avg)}
            </text>
            <text x={p.x} y={H + 8} textAnchor="middle" fontSize="8" fill="#64748b">
              {faDate(p.exam.date, { short: true })}
            </text>
          </g>
        ))}
      </svg>
      <p className="text-[10px] text-slate-500 text-center mt-1">روند میانگین درصد آزمون‌ها (وزن‌دار بر اساس تعداد سؤال)</p>
    </div>
  )
}

export function SubjectComparison({ rows }: { rows: ExamRow[] }) {
  const chrono = [...rows].sort((a, b) => (a.exam.date < b.exam.date ? -1 : 1))
  const latest = chrono[chrono.length - 1]
  const previous = chrono[chrono.length - 2]
  if (!latest) return <p className="text-xs text-slate-400 py-4 text-center">آزمونی ثبت نشده است.</p>

  const subjects = latest.subjects
  return (
    <div className="space-y-2.5">
      {subjects.map((s) => {
        const p = subjectPercent(s)
        const target = s.targetPercent ?? null
        const prev = previous?.subjects.find((x) => x.subject === s.subject)
        const delta = prev ? Math.round((p - subjectPercent(prev)) * 10) / 10 : null
        return (
          <div key={s.id}>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="font-medium text-slate-700 w-16 shrink-0">{s.subject}</span>
              <span className="font-bold text-slate-800">{faNum(p)}%</span>
              {delta !== null && (
                <span className={cn('text-[10px]', delta >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                  {delta >= 0 ? '▲' : '▼'} {faNum(Math.abs(delta))}
                </span>
              )}
              {target ? <span className="text-[10px] text-slate-400">هدف {faNum(target)}%</span> : null}
              <span className="text-[10px] text-slate-400 mr-auto">
                {faNum(s.correct)} درست · {faNum(s.wrong)} غلط · {faNum(s.blank)} نزده
              </span>
            </div>
            <div className="relative mt-1">
              <Progress value={p} tone={p >= 60 ? 'green' : p >= 40 ? 'brand' : 'amber'} />
              {target ? (
                <span
                  className="absolute -top-1 w-[2px] h-4 bg-slate-800/60 rounded"
                  style={{ right: `calc(${Math.min(100, target)}% - 1px)` }}
                  title={`هدف: ${target}%`}
                />
              ) : null}
            </div>
          </div>
        )
      })}
      <p className="text-[10px] text-slate-500 pt-1">
        مقایسه با آزمون قبلی ({previous ? faDate(previous.exam.date, { short: true }) : '—'}) · خط تیره‌ی عمودی = درصد هدف
      </p>
    </div>
  )
}

export function MistakeBreakdown({ mistakes }: { mistakes: ExamMistake[] }) {
  const [filter, setFilter] = useState<'all' | 'open'>('open')
  const list = filter === 'open' ? mistakes.filter((m) => !m.resolved) : mistakes
  const counts = (Object.keys(MISTAKE_REASON_LABEL) as MistakeReason[]).map((r) => ({
    reason: r,
    count: list.filter((m) => m.reason === r).length,
  }))
  const max = Math.max(...counts.map((c) => c.count), 1)

  const topSubjects = Array.from(
    list.reduce((map, m) => {
      map.set(m.subject || 'بدون درس', (map.get(m.subject || 'بدون درس') || 0) + 1)
      return map
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('open')}
          className={cn('text-[11px] px-2.5 py-1 rounded-lg border', filter === 'open' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200')}
        >
          حل‌نشده‌ها ({faNum(mistakes.filter((m) => !m.resolved).length)})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={cn('text-[11px] px-2.5 py-1 rounded-lg border', filter === 'all' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200')}
        >
          همه ({faNum(mistakes.length)})
        </button>
      </div>

      <div className="space-y-2">
        {counts.map((c) => (
          <div key={c.reason} className="flex items-center gap-2">
            <span className="text-[11px] text-slate-600 w-24 shrink-0">{MISTAKE_REASON_LABEL[c.reason]}</span>
            <div className="flex-1 h-4 bg-slate-100 rounded-md overflow-hidden">
              <div
                className={cn('h-full rounded-md', c.reason === 'knowledge' ? 'bg-rose-400' : c.reason === 'careless' ? 'bg-amber-400' : c.reason === 'time' ? 'bg-violet-400' : c.reason === 'misread' ? 'bg-teal-400' : 'bg-slate-400')}
                style={{ width: `${(c.count / max) * 100}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-slate-700 w-8 text-left">{faNum(c.count)}</span>
          </div>
        ))}
      </div>

      {topSubjects.length > 0 && (
        <div>
          <p className="text-[11px] font-bold text-slate-600 mb-1.5">بیشترین غلط در کدام درس‌ها؟</p>
          <div className="flex flex-wrap gap-1.5">
            {topSubjects.map(([s, n]) => (
              <Badge key={s} tone="rose">
                {s}: {faNum(n)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-72 overflow-y-auto">
        {list.length === 0 && <p className="text-[11px] text-slate-400 text-center py-3">موردی ثبت نشده 🎉</p>}
        {list.map((m) => (
          <div key={m.id} className={cn('rounded-xl border p-2.5', MISTAKE_REASON_COLOR[m.reason])}>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge tone="slate">{MISTAKE_REASON_LABEL[m.reason]}</Badge>
              {m.subject && <span className="text-[11px] font-bold">{m.subject}</span>}
              {m.examDate && <span className="text-[10px] opacity-70">{faDate(m.examDate, { short: true })}</span>}
              {m.resolved && <Badge tone="green">حل شد</Badge>}
            </div>
            {m.note && <p className="text-[11px] mt-1.5 text-slate-700 leading-5">{m.note}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

export function ExamInsights({ rows, mistakes }: { rows: ExamRow[]; mistakes: ExamMistake[] }) {
  if (!rows.length)
    return (
      <Card>
        <EmptyState
          title="هنوز آزمونی ثبت نشده"
          body="با ثبت درصد هر درس و علت غلط‌ها، برنامه‌ی هفته‌ی بعد از دل داده بیرون می‌آید — نه از حدس."
          icon="📝"
        />
      </Card>
    )

  const chrono = [...rows].sort((a, b) => (a.exam.date < b.exam.date ? -1 : 1))
  const latest = chrono[chrono.length - 1]
  const previous = chrono[chrono.length - 2]
  const avg = examAverage(latest.subjects)
  const prevAvg = previous ? examAverage(previous.subjects) : null
  const best = [...latest.subjects].sort((a, b) => subjectPercent(b) - subjectPercent(a))[0]
  const worst = [...latest.subjects].sort((a, b) => subjectPercent(a) - subjectPercent(b))[0]
  const topReason = (Object.keys(MISTAKE_REASON_LABEL) as MistakeReason[])
    .map((r) => ({ r, n: mistakes.filter((m) => m.reason === r && !m.resolved).length }))
    .sort((a, b) => b.n - a.n)[0]

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle
          title="تحلیل آزمون‌ها"
          subtitle={`آخرین آزمون: ${latest.exam.title} — ${faDate(latest.exam.date, { withWeekday: true })}`}
          icon={<IconChart className="w-4 h-4" />}
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-3">
            <p className="text-[11px] text-brand-700">میانگین آخرین آزمون</p>
            <p className="text-xl font-black text-slate-800">{faNum(avg)}%</p>
            {prevAvg !== null && (
              <p className={cn('text-[10px]', avg >= prevAvg ? 'text-emerald-600' : 'text-rose-600')}>
                {avg >= prevAvg ? '▲' : '▼'} {faNum(Math.abs(Math.round((avg - prevAvg) * 10) / 10))} نسبت به قبل
              </p>
            )}
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-[11px] text-emerald-700">قوی‌ترین درس</p>
            <p className="text-sm font-black text-slate-800">{best?.subject || '—'}</p>
            <p className="text-[10px] text-slate-600">{best ? `${faNum(subjectPercent(best))}%` : ''}</p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3">
            <p className="text-[11px] text-rose-700">ضعیف‌ترین درس</p>
            <p className="text-sm font-black text-slate-800">{worst?.subject || '—'}</p>
            <p className="text-[10px] text-slate-600">{worst ? `${faNum(subjectPercent(worst))}%` : ''}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-[11px] text-amber-800">بیشترین علت غلط</p>
            <p className="text-sm font-black text-slate-800">{topReason && topReason.n > 0 ? MISTAKE_REASON_LABEL[topReason.r] : 'ثبت نشده'}</p>
            <p className="text-[10px] text-slate-600">{topReason ? `${faNum(topReason.n)} مورد حل‌نشده` : ''}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <div>
            <p className="text-xs font-bold text-slate-700 mb-2">درصد درس‌ها (آخرین آزمون)</p>
            <SubjectComparison rows={rows} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700 mb-2">روند کلی</p>
            <ExamTrend rows={rows} />
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle title="دفتر اشتباهات" subtitle="علت هر غلط را دسته‌بندی کن؛ مرور جمعه‌ها روی همین دفتر باشد" icon={<IconChart className="w-4 h-4" />} />
        <MistakeBreakdown mistakes={mistakes} />
      </Card>
    </div>
  )
}
