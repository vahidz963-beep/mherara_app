import { useEffect, useState } from 'react'
import { useApp } from '../store/AppContext'
import { Badge, Button, Field, Input, Modal, SectionTitle, Select, Textarea, cn } from './ui'
import { isoToJalali, toGregorian, faNum, todayIso } from '../lib/jalali'
import {
  EXAM_SCOPE_LABEL,
  MISTAKE_REASON_LABEL,
  subjectPercent,
  type Exam,
  type ExamScope,
  type ExamSubject,
  type MistakeReason,
} from '../lib/types'
import { IconPlus, IconTrash } from './icons'

type Row = {
  id?: string
  /** درصد مستقیم؛ وقتی تعداد سؤال در دست نیست */
  percent?: string
  subject: string
  total: string
  correct: string
  wrong: string
  blank: string
  targetPercent: string
  mistakeReason?: MistakeReason
  mistakeNote?: string
}

const emptyRow = (): Row => ({ subject: '', total: '', correct: '', wrong: '', blank: '', targetPercent: '' })

/**
 * ثبت/ویرایش آزمون: درصد هر درس + علت غلط‌ها در یک فرم.
 * برای آزمون‌های آزمایشی می‌توان فقط «درصد» را داد (تعداد سؤال خالی باشد).
 */
export function ExamModal({
  open,
  onClose,
  studentId,
  counselorId,
  exam,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  studentId: string
  counselorId?: string | null
  exam?: Exam | null
  onSaved?: () => void
}) {
  const { backend, profile, toast } = useApp()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(todayIso())
  const [jDate, setJDate] = useState('')
  const [scope, setScope] = useState<ExamScope>('mock')
  const [note, setNote] = useState('')
  const [rows, setRows] = useState<Row[]>([emptyRow()])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    ;(async () => {
      if (exam) {
        setTitle(exam.title)
        setDate(exam.date)
        setScope(exam.scope)
        setNote(exam.note || '')
        const subjects = await backend.listExamSubjects(exam.id)
        const mistakes = await backend.listMistakes(studentId, exam.id)
        const list: Row[] = subjects.map((s: ExamSubject) => {
          const m = mistakes.find((x) => x.subject === s.subject && !x.resolved) || mistakes.find((x) => x.subject === s.subject)
          return {
            id: s.id,
            subject: s.subject,
            total: String(s.total ?? ''),
            correct: String(s.correct ?? ''),
            wrong: String(s.wrong ?? ''),
            blank: String(s.blank ?? ''),
            targetPercent: s.targetPercent !== undefined && s.targetPercent !== null ? String(s.targetPercent) : '',
            mistakeReason: m?.reason,
            mistakeNote: m?.note,
          }
        })
        setRows(list.length ? list : [emptyRow()])
      } else {
        setTitle('')
        setDate(todayIso())
        setScope('mock')
        setNote('')
        setRows([emptyRow()])
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, exam?.id])

  useEffect(() => {
    const { jy, jm, jd } = isoToJalali(date)
    setJDate(`${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`)
  }, [date])

  const save = async () => {
    if (!title.trim()) return
    setBusy(true)
    try {
      const saved = await backend.saveExam({
        id: exam?.id,
        studentId,
        counselorId: counselorId ?? undefined,
        title: title.trim(),
        date,
        scope,
        note: note || undefined,
      })
      const existing = exam ? await backend.listExamSubjects(saved.id) : []
      // حذف درس‌های حذف‌شده
      for (const e of existing) {
        if (!rows.some((r) => r.id === e.id)) await backend.deleteExamSubject(e.id)
      }
      for (const r of rows) {
        if (!r.subject.trim()) continue
        const total = Number(r.total) || 0
        const correct = Number(r.correct) || 0
        const wrong = Number(r.wrong) || 0
        const blank = Number(r.blank) || 0
        await backend.saveExamSubject({
          id: r.id,
          examId: saved.id,
          subject: r.subject.trim(),
          total,
          correct,
          wrong,
          blank,
          percent: total ? undefined : (r as any).percent === '' || (r as any).percent === undefined ? undefined : Number((r as any).percent),
          targetPercent: r.targetPercent === '' ? undefined : Number(r.targetPercent),
        })
        if (r.mistakeReason) {
          const list = await backend.listMistakes(studentId, saved.id)
          const found = list.find((m) => m.subject === r.subject.trim())
          await backend.saveMistake({
            id: found?.id,
            examId: saved.id,
            studentId,
            subject: r.subject.trim(),
            reason: r.mistakeReason,
            note: r.mistakeNote,
            resolved: found?.resolved ?? false,
          })
        }
      }
      toast('آزمون ثبت شد 📝', 'ok')
      onSaved?.()
      onClose()
    } catch (e: any) {
      toast(e?.message || 'ثبت آزمون ناموفق بود', 'err')
    } finally {
      setBusy(false)
    }
  }

  const set = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={exam ? 'ویرایش آزمون' : 'ثبت آزمون جدید'}
      wide
      footer={
        <>
          {exam && (
            <Button
              variant="ghost"
              className="text-rose-600 ml-auto"
              onClick={async () => {
                await backend.deleteExam(exam.id)
                toast('آزمون حذف شد', 'ok')
                onSaved?.()
                onClose()
              }}
            >
              حذف آزمون
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            انصراف
          </Button>
          <Button onClick={save} disabled={busy || !title.trim()}>
            {busy ? 'در حال ذخیره…' : 'ذخیره'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid sm:grid-cols-4 gap-3">
          <Field label="عنوان آزمون" className="sm:col-span-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً آزمون آزمایشی شماره ۵" />
          </Field>
          <Field label="تاریخ (شمسی)">
            <Input
              dir="ltr"
              value={faNum(jDate)}
              onChange={(e) => {
                const v = e.target.value.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
                setJDate(v)
                const m = v.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/)
                if (m) {
                  const g = toGregorian(Number(m[1]), Number(m[2]), Number(m[3]))
                  setDate(`${g.gy}-${String(g.gm).padStart(2, '0')}-${String(g.gd).padStart(2, '0')}`)
                }
              }}
            />
          </Field>
          <Field label="نوع">
            <Select value={scope} onChange={(e) => setScope(e.target.value as ExamScope)}>
              {Object.entries(EXAM_SCOPE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <SectionTitle title="درصد درس‌ها" subtitle="اگر تعداد سؤال را نداری، فقط «درصد» را بنویس" />
            <Button size="sm" variant="soft" onClick={() => setRows((r) => [...r, emptyRow()])}>
              <IconPlus className="w-4 h-4" /> درس
            </Button>
          </div>

          <div className="space-y-2">
            {rows.map((r, i) => {
              const total = Number(r.total) || 0
              const pct = total ? (Number(r.correct) || 0) / total : null
              return (
                <div key={i} className="border border-slate-200 rounded-2xl p-2.5">
                  <div className="grid grid-cols-2 sm:grid-cols-8 gap-2 items-end">
                    <Field label="درس" className="col-span-2 sm:col-span-2">
                      <Input value={r.subject} onChange={(e) => set(i, { subject: e.target.value })} placeholder="ریاضی" className="text-xs" />
                    </Field>
                    <Field label="کل سؤال">
                      <Input dir="ltr" type="number" value={r.total} onChange={(e) => set(i, { total: e.target.value })} className="text-xs" />
                    </Field>
                    <Field label="درست">
                      <Input dir="ltr" type="number" value={r.correct} onChange={(e) => set(i, { correct: e.target.value })} className="text-xs" />
                    </Field>
                    <Field label="غلط">
                      <Input dir="ltr" type="number" value={r.wrong} onChange={(e) => set(i, { wrong: e.target.value })} className="text-xs" />
                    </Field>
                    <Field label="نزده">
                      <Input dir="ltr" type="number" value={r.blank} onChange={(e) => set(i, { blank: e.target.value })} className="text-xs" />
                    </Field>
                    <Field label="درصد">
                      {total ? (
                        <Input dir="ltr" value={faNum(Math.round(((Number(r.correct) || 0) / total) * 100))} disabled className="text-xs bg-slate-50" />
                      ) : (
                        <Input
                          dir="ltr"
                          type="number"
                          value={(r as any).percent ?? ''}
                          onChange={(e) => set(i, { ...( { percent: e.target.value } as any) })}
                          placeholder="مثلاً 55"
                          className="text-xs"
                        />
                      )}
                    </Field>
                    <Field label="هدف %">
                      <Input dir="ltr" type="number" value={r.targetPercent} onChange={(e) => set(i, { targetPercent: e.target.value })} className="text-xs" />
                    </Field>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-2 mt-2 items-end">
                    <Field label="علت بیشترین غلط (اختیاری)">
                      <Select
                        value={r.mistakeReason || ''}
                        onChange={(e) => set(i, { mistakeReason: (e.target.value || undefined) as MistakeReason })}
                        className="text-xs"
                      >
                        <option value="">— ثبت نکن —</option>
                        {Object.entries(MISTAKE_REASON_LABEL).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="یادداشت غلط" className="sm:col-span-2">
                      <Input
                        value={r.mistakeNote || ''}
                        onChange={(e) => set(i, { mistakeNote: e.target.value })}
                        placeholder="مثلاً: دو سؤال آخر وقت نرسید"
                        className="text-xs"
                      />
                    </Field>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    {pct !== null && (
                      <Badge tone={pct >= 0.6 ? 'green' : pct >= 0.4 ? 'amber' : 'rose'}>درصد محاسبه‌شده: {faNum(Math.round(pct * 1000) / 10)}%</Badge>
                    )}
                    <button
                      onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))}
                      className={cn('text-rose-500 hover:bg-rose-50 rounded-lg p-1.5 mr-auto')}
                      aria-label="حذف درس"
                    >
                      <IconTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <Field label="نتیجه‌گیری کلی از آزمون (اختیاری)">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="چه چیزی خوب بود؟ هفته‌ی بعد روی چه چیزی تمرکز کنیم؟" className="min-h-[70px]" />
        </Field>

        {profile?.role === 'student' && (
          <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-2.5 leading-6">
            همین که علت غلط‌ها را دسته‌بندی کنی، مشاورت دقیق‌تر می‌تواند برایت برنامه بچیند. اگر درصدی را نمی‌دانی، خالی بگذار.
          </p>
        )}
      </div>
    </Modal>
  )
}
