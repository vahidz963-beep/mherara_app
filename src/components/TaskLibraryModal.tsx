import { useMemo, useState } from 'react'
import { Badge, Button, Field, Input, Modal, Textarea, cn } from './ui'
import { LIBRARY_CATEGORIES, TASK_LIBRARY, type LibraryCategory } from '../lib/taskLibrary'
import { addDaysIso, faDate, faNum, todayIso } from '../lib/jalali'
import { IconCheck, IconSpark } from './icons'

export type NewTaskFromLibrary = {
  title: string
  description: string
  dueDate?: string
  category?: string
  saveAsTemplate?: boolean
}

export function TaskLibraryModal({
  open,
  onClose,
  suggestedIds = [],
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  suggestedIds?: string[]
  onSubmit: (tasks: NewTaskFromLibrary[]) => Promise<void> | void
}) {
  const [category, setCategory] = useState<'all' | LibraryCategory>('all')
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [edits, setEdits] = useState<Record<string, { title: string; description: string; days: number }>>({})
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)
  const [busy, setBusy] = useState(false)

  const list = useMemo(() => {
    const base = category === 'all' ? TASK_LIBRARY : TASK_LIBRARY.filter((t) => t.category === category)
    if (!q.trim()) return base
    const s = q.trim()
    return base.filter((t) => (t.title + t.description).includes(s))
  }, [category, q])

  const toggle = (id: string) => {
    setSelected((sel) => (sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]))
    setEdits((e) => (e[id] ? e : { ...e, [id]: { title: TASK_LIBRARY.find((t) => t.id === id)!.title, description: TASK_LIBRARY.find((t) => t.id === id)!.description, days: TASK_LIBRARY.find((t) => t.id === id)!.days } }))
  }

  const submit = async () => {
    setBusy(true)
    try {
      const tasks: NewTaskFromLibrary[] = selected.map((id) => {
        const base = TASK_LIBRARY.find((t) => t.id === id)!
        const e = edits[id] || { title: base.title, description: base.description, days: base.days }
        return {
          title: e.title,
          description: e.description,
          dueDate: addDaysIso(todayIso(), e.days),
          category: base.category,
          saveAsTemplate,
        }
      })
      await onSubmit(tasks)
      setSelected([])
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="بانک تمرین‌های استاندارد"
      wide
      footer={
        <>
          {selected.length > 0 && <span className="text-[11px] text-slate-500 ml-auto">{faNum(selected.length)} تمرین انتخاب شده</span>}
          <Button variant="outline" onClick={onClose}>
            انصراف
          </Button>
          <Button onClick={submit} disabled={busy || selected.length === 0}>
            {busy ? 'در حال افزودن…' : `افزودن ${selected.length ? faNum(selected.length) : ''} تمرین`}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جست‌وجو در تمرین‌ها…" className="max-w-[220px] text-xs" />
          <button
            onClick={() => setCategory('all')}
            className={cn('text-[11px] px-2.5 py-1.5 rounded-lg border', category === 'all' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-slate-200 text-slate-600')}
          >
            همه
          </button>
          {(Object.keys(LIBRARY_CATEGORIES) as LibraryCategory[]).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn('text-[11px] px-2.5 py-1.5 rounded-lg border', category === c ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-slate-200 text-slate-600')}
            >
              {LIBRARY_CATEGORIES[c].emoji} {LIBRARY_CATEGORIES[c].label}
            </button>
          ))}
        </div>

        {suggestedIds.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3">
            <p className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5 mb-1">
              <IconSpark className="w-4 h-4" /> پیشنهاد بر اساس داده‌ی این دانش‌آموز
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestedIds
                .map((id) => TASK_LIBRARY.find((t) => t.id === id))
                .filter(Boolean)
                .map((t) => (
                  <button
                    key={t!.id}
                    onClick={() => toggle(t!.id)}
                    className={cn(
                      'text-[11px] px-2.5 py-1 rounded-full border transition',
                      selected.includes(t!.id) ? 'bg-amber-600 text-white border-amber-600' : 'bg-white border-amber-200 text-amber-900 hover:border-amber-400',
                    )}
                  >
                    {t!.title}
                  </button>
                ))}
            </div>
          </div>
        )}

        <div className="space-y-2 max-h-[46vh] overflow-y-auto pl-1">
          {list.map((t) => {
            const isSel = selected.includes(t.id)
            const e = edits[t.id]
            const cat = LIBRARY_CATEGORIES[t.category]
            return (
              <div key={t.id} className={cn('border rounded-2xl p-3 transition', isSel ? 'border-brand-400 bg-brand-50/50' : 'border-slate-200 hover:border-brand-200')}>
                <div className="flex items-start gap-2.5">
                  <button
                    onClick={() => toggle(t.id)}
                    className={cn('mt-0.5 w-5 h-5 rounded-md border grid place-items-center shrink-0', isSel ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-slate-300')}
                    aria-label="انتخاب تمرین"
                  >
                    {isSel && <IconCheck className="w-3.5 h-3.5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-slate-800">{t.title}</p>
                      <Badge tone="slate" className={cat.color}>
                        {cat.emoji} {cat.label}
                      </Badge>
                      <span className="text-[10px] text-slate-400">پیشنهاد: {faNum(t.days)} روز</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1.5 leading-5">{t.description}</p>

                    {isSel && (
                      <div className="mt-2.5 grid sm:grid-cols-4 gap-2">
                        <Field label="عنوان (قابل ویرایش)" className="sm:col-span-3">
                          <Input
                            value={e?.title ?? t.title}
                            onChange={(ev) => setEdits((x) => ({ ...x, [t.id]: { title: ev.target.value, description: x[t.id]?.description ?? t.description, days: x[t.id]?.days ?? t.days } }))}
                            className="text-xs"
                          />
                        </Field>
                        <Field label="مهلت (روز)">
                          <Input
                            dir="ltr"
                            type="number"
                            value={e?.days ?? t.days}
                            onChange={(ev) => setEdits((x) => ({ ...x, [t.id]: { title: x[t.id]?.title ?? t.title, description: x[t.id]?.description ?? t.description, days: Number(ev.target.value) } }))}
                            className="text-xs"
                          />
                        </Field>
                        <Field label="توضیح" className="sm:col-span-4">
                          <Textarea
                            value={e?.description ?? t.description}
                            onChange={(ev) => setEdits((x) => ({ ...x, [t.id]: { title: x[t.id]?.title ?? t.title, description: ev.target.value, days: x[t.id]?.days ?? t.days } }))}
                            className="text-xs min-h-[64px]"
                          />
                        </Field>
                        <p className="text-[10px] text-slate-500 sm:col-span-4">مهلت پیشنهادی: {faDate(addDaysIso(todayIso(), e?.days ?? t.days))}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          {list.length === 0 && <p className="text-xs text-slate-400 text-center py-6">موردی پیدا نشد.</p>}
        </div>

        <label className="flex items-center gap-2 text-[11px] text-slate-600">
          <input type="checkbox" checked={saveAsTemplate} onChange={(e) => setSaveAsTemplate(e.target.checked)} />
          این تمرین‌ها را در «قالب‌های من» هم ذخیره کن (برای استفاده‌ی بعدی با یک کلیک)
        </label>
      </div>
    </Modal>
  )
}
