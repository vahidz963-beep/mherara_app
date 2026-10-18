import { faDate, faNum, FA_WEEKDAYS, faWeekdayIndex } from '../lib/jalali'
import type { Checkin } from '../lib/types'

export function CheckinChart({ data }: { data: Checkin[] }) {
  const list = [...data].slice(0, 14).reverse()
  if (!list.length) return <p className="text-xs text-slate-400 text-center py-6">هنوز چک‌اینی ثبت نشده است.</p>
  const max = Math.max(...list.map((c) => c.studyMinutes || 0), 60)
  const W = Math.max(list.length * 46, 320)
  const H = 130
  const barW = 24

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H + 34}`} className="min-w-full" style={{ direction: 'ltr' }} height={170}>
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line key={g} x1="0" x2={W} y1={H - H * g} y2={H - H * g} stroke="#e2e8f0" strokeDasharray="4 6" />
        ))}
        <line x1="0" x2={W} y1={H} y2={H} stroke="#cbd5e1" />
        {list.map((c, i) => {
          const x = i * 46 + 10
          const h = Math.max(3, ((c.studyMinutes || 0) / max) * (H - 8))
          const moodRatio = (c.mood - 1) / 4
          return (
            <g key={c.id}>
              <rect x={x} y={H - h} width={barW} height={h} rx="6" fill="url(#g1)" />
              <circle cx={x + barW / 2} cy={H - 8 - moodRatio * (H - 40)} r="4" fill={c.mood >= 4 ? '#10b981' : c.mood >= 3 ? '#f59e0b' : '#f43f5e'} />
              <text x={x + barW / 2} y={H + 14} textAnchor="middle" fontSize="9" fill="#64748b">
                {faNum(c.studyMinutes || 0)}
              </text>
              <text x={x + barW / 2} y={H + 26} textAnchor="middle" fontSize="8" fill="#94a3b8">
                {FA_WEEKDAYS[faWeekdayIndex(c.date)]}
              </text>
            </g>
          )
        })}
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#c7d2fe" />
          </linearGradient>
        </defs>
      </svg>
      <div className="flex items-center gap-4 text-[10px] text-slate-500 mt-1 justify-center">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-brand-500 inline-block" /> دقایق مطالعه
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> حال خوب
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> حال نامساعد
        </span>
      </div>
    </div>
  )
}

export function Sparkline({ data, field = 'mood' }: { data: Checkin[]; field?: 'mood' | 'energy' | 'focus' }) {
  const list = [...data].slice(0, 14).reverse()
  if (list.length < 2) return <span className="text-[10px] text-slate-400">داده کافی نیست</span>
  const pts = list.map((c, i) => {
    const x = (i / (list.length - 1)) * 100
    const y = 30 - ((c[field] - 1) / 4) * 26
    return `${x},${y}`
  })
  return (
    <div>
      <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="w-full h-8" style={{ direction: 'ltr' }}>
        <polyline points={pts.join(' ')} fill="none" stroke="#6366f1" strokeWidth="1.6" />
      </svg>
      <p className="text-[10px] text-slate-400 text-center">
        آخرین ثبت: {faDate(list[list.length - 1].date, { short: true })} — میانگین {faNum((list.reduce((s, c) => s + c[field], 0) / list.length).toFixed(1))}
      </p>
    </div>
  )
}
