import { useEffect, useState } from 'react'
import { Button, Field, Input, Modal, Select, Textarea } from './ui'
import { todayIso, isoToJalali, toGregorian, faNum } from '../lib/jalali'
import type { SessionRow, Task, TaskStatus } from '../lib/types'

export function SessionModal({
  open,
  onClose,
  onSave,
  onDelete,
  initial,
  studentName,
  defaultDate,
}: {
  open: boolean
  onClose: () => void
  onSave: (s: Partial<SessionRow> & { studentId?: string }) => Promise<void> | void
  onDelete?: (id: string) => Promise<void> | void
  initial?: SessionRow | null
  studentName?: string
  defaultDate?: string
}) {
  const [form, setForm] = useState({
    date: todayIso(),
    time: '17:00',
    mode: 'online' as SessionRow['mode'],
    topic: '',
    summary: '',
    nextSteps: '',
    status: 'scheduled' as SessionRow['status'],
  })
  const [jDate, setJDate] = useState('')

  useEffect(() => {
    if (!open) return
    const base = initial
      ? {
          date: initial.date,
          time: initial.time || '17:00',
          mode: initial.mode,
          topic: initial.topic,
          summary: initial.summary || '',
          nextSteps: initial.nextSteps || '',
          status: initial.status,
        }
      : { date: defaultDate || todayIso(), time: '17:00', mode: 'online' as const, topic: '', summary: '', nextSteps: '', status: 'scheduled' as const }
    setForm(base)
    const { jy, jm, jd } = isoToJalali(base.date)
    setJDate(`${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`)
  }, [open, initial, defaultDate])

  const applyJDate = (v: string) => {
    setJDate(v)
    const m = v.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/)
    if (m) {
      const g = toGregorian(Number(m[1]), Number(m[2]), Number(m[3]))
      setForm((f) => ({ ...f, date: `${g.gy}-${String(g.gm).padStart(2, '0')}-${String(g.gd).padStart(2, '0')}` }))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'ویرایش جلسه' : `جلسه‌ی جدید${studentName ? ` — ${studentName}` : ''}`}
      wide
      footer={
        <>
          {initial && onDelete && (
            <Button
              variant="ghost"
              className="text-rose-600 ml-auto"
              onClick={async () => {
                await onDelete(initial.id)
                onClose()
              }}
            >
              حذف جلسه
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            انصراف
          </Button>
          <Button
            disabled={!form.topic.trim()}
            onClick={async () => {
              await onSave({
                id: initial?.id,
                ...form,
                time: form.time || undefined,
                summary: form.summary || undefined,
                nextSteps: form.nextSteps || undefined,
              })
              onClose()
            }}
          >
            ذخیره
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <Field label="موضوع جلسه">
          <Input value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))} placeholder="مثلاً پیگیری برنامه و اضطراب آزمون" />
        </Field>
        <div className="grid sm:grid-cols-4 gap-3">
          <Field label="تاریخ (شمسی)">
            <Input dir="ltr" value={faNum(jDate)} onChange={(e) => applyJDate(e.target.value.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))))} />
          </Field>
          <Field label="ساعت">
            <Input dir="ltr" type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} />
          </Field>
          <Field label="نوع">
            <Select value={form.mode} onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value as SessionRow['mode'] }))}>
              <option value="online">آنلاین</option>
              <option value="in_person">حضوری</option>
              <option value="phone">تلفنی</option>
            </Select>
          </Field>
          <Field label="وضعیت">
            <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as SessionRow['status'] }))}>
              <option value="scheduled">برنامه‌ریزی‌شده</option>
              <option value="done">برگزار شد</option>
              <option value="canceled">لغو شد</option>
            </Select>
          </Field>
        </div>
        <Field label="خلاصهٔ جلسه (خصوصی مشاور)">
          <Textarea value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} placeholder="موضوعات مطرح‌شده، مشاهدات، ارجاع‌ها…" />
        </Field>
        <Field label="قدم‌های بعدی (برای دانش‌آموز قابل مشاهده)">
          <Textarea value={form.nextSteps} onChange={(e) => setForm((f) => ({ ...f, nextSteps: e.target.value }))} placeholder="مثلاً: ثبت چک‌این روزانه، تمرین تنفس شبانه" />
        </Field>
      </div>
    </Modal>
  )
}

export function TaskModal({
  open,
  onClose,
  onSave,
  onDelete,
  initial,
  studentName,
  isCounselor = true,
}: {
  open: boolean
  onClose: () => void
  onSave: (t: Partial<Task>) => Promise<void> | void
  onDelete?: (id: string) => Promise<void> | void
  initial?: Task | null
  studentName?: string
  isCounselor?: boolean
}) {
  const [form, setForm] = useState({ title: '', description: '', dueDate: '', status: 'todo' as TaskStatus })

  useEffect(() => {
    if (!open) return
    setForm(
      initial
        ? {
            title: initial.title,
            description: initial.description || '',
            dueDate: initial.dueDate || '',
            status: initial.status,
          }
        : { title: '', description: '', dueDate: '', status: 'todo' },
    )
  }, [open, initial])

  const [jDate, setJDate] = useState('')
  useEffect(() => {
    if (!open) return
    if (!form.dueDate) return setJDate('')
    const { jy, jm, jd } = isoToJalali(form.dueDate)
    setJDate(`${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, form.dueDate])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'ویرایش تمرین / تکلیف' : `تمرین جدید${studentName ? ` — ${studentName}` : ''}`}
      footer={
        <>
          {initial && onDelete && (
            <Button
              variant="ghost"
              className="text-rose-600 ml-auto"
              onClick={async () => {
                await onDelete(initial.id)
                onClose()
              }}
            >
              حذف
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            انصراف
          </Button>
          <Button
            disabled={!form.title.trim()}
            onClick={async () => {
              await onSave({
                id: initial?.id,
                title: form.title.trim(),
                description: form.description || undefined,
                dueDate: form.dueDate || undefined,
                status: form.status,
              })
              onClose()
            }}
          >
            ذخیره
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <Field label="عنوان">
          <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="مثلاً تمرین تنفس ۴-۷-۸ قبل از خواب" />
        </Field>
        <Field label="توضیح">
          <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="چطور انجام شود؟ چند بار؟ چه مدت؟" />
        </Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="مهلت (شمسی)" hint="مثلاً ۱۴۰۵/۰۸/۰۲">
            <Input
              dir="ltr"
              placeholder="۱۴۰۵/۰۸/۰۲"
              value={faNum(jDate)}
              onChange={(e) => {
                const v = e.target.value.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
                setJDate(v)
                const m = v.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/)
                if (m) {
                  const g = toGregorian(Number(m[1]), Number(m[2]), Number(m[3]))
                  setForm((f) => ({ ...f, dueDate: `${g.gy}-${String(g.gm).padStart(2, '0')}-${String(g.gd).padStart(2, '0')}` }))
                }
              }}
            />
          </Field>
          <Field label="وضعیت">
            <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TaskStatus }))}>
              <option value="todo">شروع نشده</option>
              <option value="doing">در حال انجام</option>
              <option value="done">انجام شد</option>
            </Select>
          </Field>
        </div>
        {!isCounselor && <p className="text-[11px] text-slate-500">وضعیت و یادداشت خودت را در همین صفحه به‌روز کن؛ مشاور آن را می‌بیند.</p>}
      </div>
    </Modal>
  )
}
