import { useEffect, useState } from 'react'
import { Button, Field, Input, Modal, Select, Textarea } from './ui'
import { ITEM_KIND_LABEL, type ItemKind, type PlanItem } from '../lib/types'
import { isoToJalali, toGregorian, faNum } from '../lib/jalali'

type Props = {
  open: boolean
  onClose: () => void
  onSave: (item: Partial<PlanItem> & { planId: string }) => Promise<void> | void
  onDelete?: (id: string) => Promise<void> | void
  planId: string
  dateIso: string
  initial?: PlanItem | null
  subjects?: string[]
}

export function PlanItemModal({ open, onClose, onSave, onDelete, planId, dateIso, initial, subjects = [] }: Props) {
  const [form, setForm] = useState({
    title: '',
    subject: '',
    kind: 'study' as ItemKind,
    minutes: 60,
    startTime: '',
    priority: 'mid' as PlanItem['priority'],
    note: '',
    date: dateIso,
  })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    if (initial) {
      setForm({
        title: initial.title,
        subject: initial.subject || '',
        kind: initial.kind,
        minutes: initial.minutes,
        startTime: initial.startTime || '',
        priority: initial.priority,
        note: initial.note || '',
        date: initial.date,
      })
    } else {
      setForm({ title: '', subject: '', kind: 'study', minutes: 60, startTime: '', priority: 'mid', note: '', date: dateIso })
    }
  }, [open, initial, dateIso])

  const save = async () => {
    if (!form.title.trim()) return
    setBusy(true)
    try {
      await onSave({
        id: initial?.id,
        planId,
        title: form.title.trim(),
        subject: form.subject.trim(),
        kind: form.kind,
        minutes: Number(form.minutes) || 0,
        startTime: form.startTime || undefined,
        priority: form.priority,
        note: form.note || undefined,
        date: form.date,
      })
      onClose()
    } finally {
      setBusy(false)
    }
  }

  // ورودی تاریخ شمسی
  const [jDate, setJDate] = useState('')
  useEffect(() => {
    if (!open) return
    const { jy, jm, jd } = isoToJalali(form.date)
    setJDate(`${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, form.date])

  const applyJDate = (v: string) => {
    setJDate(v)
    const m = v.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/)
    if (m) {
      const g = toGregorian(Number(m[1]), Number(m[2]), Number(m[3]))
      const iso = `${g.gy}-${String(g.gm).padStart(2, '0')}-${String(g.gd).padStart(2, '0')}`
      setForm((f) => ({ ...f, date: iso }))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'ویرایش آیتم برنامه' : 'افزودن آیتم به برنامه'}
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
              حذف
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            انصراف
          </Button>
          <Button onClick={save} disabled={busy || !form.title.trim()}>
            ذخیره
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <Field label="عنوان کار">
          <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="مثلاً زیست — فصل ۵ گوارش" />
        </Field>

        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="درس / موضوع">
            <Input list="subjects-list" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="زیست" />
            <datalist id="subjects-list">
              {subjects.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </Field>
          <Field label="نوع">
            <Select value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as ItemKind }))}>
              {Object.entries(ITEM_KIND_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="اولویت">
            <Select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as PlanItem['priority'] }))}>
              <option value="high">بالا</option>
              <option value="mid">متوسط</option>
              <option value="low">پایین</option>
            </Select>
          </Field>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="تاریخ (شمسی)" hint="قالب: ۱۴۰۵/۰۷/۲۴">
            <Input dir="ltr" value={faNum(jDate)} onChange={(e) => applyJDate(e.target.value.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))))} />
          </Field>
          <Field label="ساعت شروع">
            <Input dir="ltr" type="time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} />
          </Field>
          <Field label="مدت (دقیقه)">
            <Input dir="ltr" type="number" min={0} step={5} value={form.minutes} onChange={(e) => setForm((f) => ({ ...f, minutes: Number(e.target.value) }))} />
          </Field>
        </div>

        <Field label="توضیح برای دانش‌آموز (اختیاری)">
          <Textarea value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="مثلاً: فقط تست‌های نشان‌دار را بزن، تحلیل هم یادت نرود." />
        </Field>
      </div>
    </Modal>
  )
}
