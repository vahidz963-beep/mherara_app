import { useEffect, useState } from 'react'
import { Badge, Button, Field, Input, Modal, cn } from './ui'
import { STUDY_STAGES, itemAccuracy, type PlanItem } from '../lib/types'
import { faNum } from '../lib/jalali'
import { IconCheck, IconSpark } from './icons'

/**
 * ثبت پیشرفت روی هر بلوک برنامه:
 * – تعداد کل سؤال و تعداد درست (نمایش کسری مثل ۱۸/۲۵ با درصد صحت)
 * – مراحل مطالعه‌ی اجراشده (۱ تا ۷)
 */
export function ItemProgressModal({
  open,
  onClose,
  item,
  onSave,
  viewer = 'student',
}: {
  open: boolean
  onClose: () => void
  item: PlanItem | null
  onSave: (patch: { testsTotal?: number | null; testsCorrect?: number | null; stages?: number[] }) => Promise<void> | void
  viewer?: 'student' | 'counselor'
}) {
  const [total, setTotal] = useState('')
  const [correct, setCorrect] = useState('')
  const [stages, setStages] = useState<number[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open || !item) return
    setTotal(item.testsTotal !== undefined && item.testsTotal !== null ? String(item.testsTotal) : '')
    setCorrect(item.testsCorrect !== undefined && item.testsCorrect !== null ? String(item.testsCorrect) : '')
    setStages(item.stages || [])
  }, [open, item?.id])

  if (!item) return null

  const t = Number(total) || 0
  const c = Number(correct) || 0
  const pct = t ? Math.round((Math.min(c, t) / t) * 1000) / 10 : null
  const tone = pct === null ? 'slate' : pct >= 70 ? 'green' : pct >= 50 ? 'amber' : 'rose'

  const save = async () => {
    setBusy(true)
    try {
      const patch: { testsTotal?: number | null; testsCorrect?: number | null; stages?: number[] } = {
        stages: [...stages].sort((a, b) => a - b),
      }
      if (total === '' && correct === '') {
        patch.testsTotal = null
        patch.testsCorrect = null
      } else {
        patch.testsTotal = t
        patch.testsCorrect = Math.min(c, t)
      }
      await onSave(patch)
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="ثبت تست‌ها و مرحله‌ی مطالعه"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            انصراف
          </Button>
          <Button onClick={save} disabled={busy}>
            ذخیره
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
          <p className="text-xs font-bold text-slate-800">{item.title}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {item.subject || 'بدون درس'} · {faNum(item.minutes)} دقیقه
            {item.kind === 'test' ? ' · آزمون/تست' : ''}
          </p>
        </div>

        {/* ── کسر تست‌ها ── */}
        <div>
          <p className="text-xs font-bold text-slate-700 mb-2">تست‌های انجام‌شده</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="تعداد درست">
              <Input dir="ltr" type="number" min={0} inputMode="numeric" value={correct} onChange={(e) => setCorrect(e.target.value)} placeholder="مثلاً ۱۸" />
            </Field>
            <Field label="تعداد کل سؤال">
              <Input dir="ltr" type="number" min={0} inputMode="numeric" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="مثلاً ۲۵" />
            </Field>
          </div>

          <div className="mt-3 flex items-center gap-3 bg-white border border-slate-200 rounded-2xl p-3">
            <div className="text-center" dir="ltr">
              <p className="text-2xl font-black text-slate-800 leading-6">
                {faNum(t ? c : 0)}
                <span className="text-slate-300 mx-1">/</span>
                {faNum(t || 0)}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">درست از کل</p>
            </div>
            <div className="flex-1">
              {pct === null ? (
                <p className="text-[11px] text-slate-400">عددها را وارد کن تا درصد صحت همین‌جا محاسبه شود.</p>
              ) : (
                <>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500')}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <p className="text-[11px] mt-1.5">
                    <Badge tone={tone as any}>درصد صحت {faNum(pct)}٪</Badge>{' '}
                    <span className="text-slate-500">
                      {pct >= 70 ? 'عالی — ادامه بده' : pct >= 50 ? 'قابل قبول؛ تحلیل غلط‌ها را جدی بگیر' : 'اینجا جای کار دارد؛ مبحث را دوباره مرور کن'}
                    </span>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── مراحل مطالعه ── */}
        <div>
          <p className="text-xs font-bold text-slate-700 mb-1">مرحله‌ی مطالعه‌ای که برای این مبحث اجرا کردی</p>
          <p className="text-[11px] text-slate-500 mb-2">هر تعداد مرحله را می‌توانی انتخاب کنی (۱ تا ۷).</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {STUDY_STAGES.map((s) => {
              const on = stages.includes(s.n)
              return (
                <button
                  key={s.n}
                  type="button"
                  onClick={() => setStages((v) => (on ? v.filter((x) => x !== s.n) : [...v, s.n]))}
                  className={cn(
                    'text-right border rounded-2xl p-2.5 transition flex items-start gap-2',
                    on ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-300',
                  )}
                >
                  <span
                    className={cn(
                      'w-6 h-6 rounded-lg shrink-0 grid place-items-center text-[11px] font-bold border',
                      on ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-slate-300 text-slate-500',
                    )}
                  >
                    {on ? <IconCheck className="w-3.5 h-3.5" /> : faNum(s.n)}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11.5px] font-bold text-slate-800">{s.label}</span>
                    <span className="block text-[10.5px] text-slate-500 leading-5">{s.hint}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-2.5 leading-6">
          <IconSpark className="w-3.5 h-3.5 inline align-[-3px] ml-1" />
          {viewer === 'student'
            ? 'این عددها به مشاورت نشان می‌دهد کجای راه هستی: «تست زدم ولی تحلیل نکردم» با «مبحث را کامل بستم» زمین تا آسمان تفاوت دارد.'
            : 'می‌توانی این عددها را همراه دانش‌آموز پر کنی؛ روند صحت تست‌ها و مراحل، مبنای برنامه‌ی هفته‌ی بعد است.'}
        </p>
      </div>
    </Modal>
  )
}

/** نوار خلاصه‌ی تست‌ها و مراحل برای یک برنامه یا بازه */
export function TestsSummary({
  items,
  title = 'تست‌ها و مراحل مطالعه',
  compact,
}: {
  items: PlanItem[]
  title?: string
  compact?: boolean
}) {
  const withTests = items.filter((i) => i.testsTotal)
  const total = withTests.reduce((s, i) => s + (i.testsTotal || 0), 0)
  const correct = withTests.reduce((s, i) => s + Math.min(i.testsCorrect || 0, i.testsTotal || 0), 0)
  const pct = total ? Math.round((correct / total) * 1000) / 10 : null
  const stagesUsed = Array.from(new Set(items.flatMap((i) => i.stages || []))).sort((a, b) => a - b)

  if (!withTests.length && !stagesUsed.length)
    return (
      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-3 text-center">
        <p className="text-[11px] text-slate-500">
          هنوز تستی ثبت نشده — روی هر آیتم برنامه، کسر «درست/کل» و مرحله‌ی مطالعه را وارد کن.
        </p>
      </div>
    )

  const stageCounts = STUDY_STAGES.map((s) => ({ ...s, count: items.filter((i) => (i.stages || []).includes(s.n)).length }))

  return (
    <div className={cn('border rounded-2xl p-3 bg-white', compact ? '' : 'sm:p-4')}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-center" dir="ltr">
          <p className="text-xl font-black text-slate-800 leading-6">
            {faNum(correct)}
            <span className="text-slate-300 mx-1">/</span>
            {faNum(total)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">درست از کل</p>
        </div>
        {pct !== null && (
          <Badge tone={pct >= 70 ? 'green' : pct >= 50 ? 'amber' : 'rose'}>درصد صحت {faNum(pct)}٪</Badge>
        )}
        <span className="text-[11px] text-slate-500">
          {faNum(withTests.length)} بلوک با تست · {faNum(items.length)} آیتم برنامه
        </span>
        <span className="text-[11px] text-slate-700 mr-auto font-bold">{title}</span>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1">
        {stageCounts.map((s) => (
          <div
            key={s.n}
            title={`${s.label} — ${s.hint}`}
            className={cn(
              'rounded-xl border p-1.5 text-center',
              s.count ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-slate-50',
            )}
          >
            <p className={cn('text-[11px] font-bold', s.count ? 'text-brand-700' : 'text-slate-400')}>{faNum(s.n)}</p>
            <p className="text-[9px] text-slate-500 leading-3 mt-0.5 h-6 overflow-hidden">{s.label}</p>
            <p className={cn('text-[10px] font-bold mt-0.5', s.count ? 'text-slate-700' : 'text-slate-300')}>{faNum(s.count)}</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-400 mt-2">
        ستون‌ها: هفت مرحله‌ی مطالعه — عدد پایین هر ستون، تعداد بلوک‌هایی است که آن مرحله در آن‌ها ثبت شده.
      </p>
    </div>
  )
}

/** نشان فشرده‌ی کسر تست روی هر آیتم در شبکه‌ی هفتگی */
export function TestBadge({ item }: { item: PlanItem }) {
  const pct = itemAccuracy(item)
  if (!item.testsTotal && !(item.stages || []).length) return null
  const tone = pct === null ? 'slate' : pct >= 70 ? 'green' : pct >= 50 ? 'amber' : 'rose'
  return (
    <span className="inline-flex items-center gap-1 flex-wrap">
      {item.testsTotal ? (
        <span
          dir="ltr"
          className={cn(
            'text-[10px] font-bold rounded-md px-1.5 py-0.5 border',
            tone === 'green' && 'bg-emerald-50 border-emerald-200 text-emerald-700',
            tone === 'amber' && 'bg-amber-50 border-amber-200 text-amber-800',
            tone === 'rose' && 'bg-rose-50 border-rose-200 text-rose-700',
            tone === 'slate' && 'bg-slate-50 border-slate-200 text-slate-600',
          )}
        >
          {faNum(Math.min(item.testsCorrect || 0, item.testsTotal))}/{faNum(item.testsTotal)}
        </span>
      ) : null}
      {(item.stages || []).length ? (
        <span className="text-[10px] rounded-md px-1.5 py-0.5 border bg-white/70 border-slate-300 text-slate-600">
          مرحله {faNum([...(item.stages || [])].sort((a, b) => a - b).join('،'))}
        </span>
      ) : null}
    </span>
  )
}
