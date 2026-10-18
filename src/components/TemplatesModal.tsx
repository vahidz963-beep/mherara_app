import { useState } from 'react'
import { useApp } from '../store/AppContext'
import { useAsync } from '../store/hooks'
import { Badge, Button, Card, EmptyState, Field, Input, Modal, SectionTitle, Spinner, Tabs, Textarea } from './ui'
import { addDaysIso, faDate, faNum, faWeekRangeLabel, isoToJalali, startOfFaWeek, todayIso, toGregorian } from '../lib/jalali'
import type { Plan, PlanItem, PlanTemplate, Profile, TaskTemplate } from '../lib/types'
import { IconBook, IconClipboard, IconPlus, IconSpark, IconTrash } from './icons'

/** انتخاب دانش‌آموز + تاریخ شروع برای ساخت برنامه از قالب */
export function TemplateRunnerModal({
  open,
  onClose,
  onDone,
  presetStudentId,
  presetPlan,
}: {
  open: boolean
  onClose: () => void
  onDone?: (plan: Plan) => void
  /** اگر از داخل پرونده‌ی یک دانش‌آموز باز شود */
  presetStudentId?: string
  /** اگر بخواهیم برنامه‌ی جاری را به‌عنوان قالب ذخیره کنیم */
  presetPlan?: { plan: Plan; items: PlanItem[] } | null
}) {
  const { backend, profile, toast } = useApp()
  const [tab, setTab] = useState<'use' | 'save'>('use')
  const [studentId, setStudentId] = useState(presetStudentId || '')
  const [startDate, setStartDate] = useState(addDaysIso(startOfFaWeek(todayIso()), 7))
  const [jStart, setJStart] = useState('')
  const [tplTitle, setTplTitle] = useState(presetPlan?.plan.title || '')
  const [tplNote, setTplNote] = useState('')
  const [newTplTitle, setNewTplTitle] = useState('')
  const [newTplDesc, setNewTplDesc] = useState('')
  const [newTplDays, setNewTplDays] = useState(7)
  const [busy, setBusy] = useState(false)

  const { data, loading, reload } = useAsync(
    async () => {
      const [students, planTemplates, taskTemplates] = await Promise.all([
        backend.listStudents(profile!.id),
        backend.listPlanTemplates(profile!.id),
        backend.listTaskTemplates(profile!.id),
      ])
      return { students, planTemplates, taskTemplates }
    },
    [backend, profile?.id],
    { students: [] as Profile[], planTemplates: [] as PlanTemplate[], taskTemplates: [] as TaskTemplate[] },
  )

  if (loading) return <Modal open={open} onClose={onClose} title="قالب‌ها"><Spinner /></Modal>

  const apply = async (tpl: PlanTemplate) => {
    if (!studentId) {
      toast('اول دانش‌آموز را انتخاب کن', 'err')
      return
    }
    setBusy(true)
    try {
      const plan = await backend.applyPlanTemplate({ templateId: tpl.id, studentId, counselorId: profile!.id, startDate })
      toast('برنامه از قالب ساخته شد ✅', 'ok')
      onDone?.(plan)
      onClose()
    } catch (e: any) {
      toast(e?.message || 'اجرای قالب ناموفق بود', 'err')
    } finally {
      setBusy(false)
    }
  }

  const savePlanTemplate = async () => {
    if (!presetPlan) return
    setBusy(true)
    try {
      const first = presetPlan.items.reduce((min, i) => (i.date < min ? i.date : min), presetPlan.items[0]?.date || presetPlan.plan.startDate)
      const items = presetPlan.items.map((i) => ({
        dayOffset: Math.max(0, Math.round((new Date(i.date).getTime() - new Date(first).getTime()) / 86400000)),
        title: i.title,
        subject: i.subject,
        kind: i.kind,
        minutes: i.minutes,
        startTime: i.startTime,
        priority: i.priority,
        note: i.note,
      }))
      await backend.savePlanTemplate({
        counselorId: profile!.id,
        title: tplTitle || presetPlan.plan.title,
        kind: presetPlan.plan.kind,
        note: tplNote || presetPlan.plan.note,
        items,
      })
      toast('قالب ذخیره شد؛ از این به بعد با یک کلیک قابل استفاده است', 'ok')
      reload()
      setTab('use')
    } catch (e: any) {
      toast(e?.message || 'ذخیره‌ی قالب ناموفق بود', 'err')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="قالب‌های من"
      wide
      footer={<Button variant="outline" onClick={onClose}>بستن</Button>}
    >
      <div className="space-y-4">
        {presetPlan && (
          <div className="mb-1">
            <Tabs
              value={tab}
              onChange={setTab}
              tabs={[
                { value: 'use', label: 'استفاده از قالب' },
                { value: 'save', label: 'ذخیره‌ی برنامه‌ی جاری به‌عنوان قالب' },
              ]}
            />
          </div>
        )}

        {tab === 'use' && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="دانش‌آموز">
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm"
                  disabled={!!presetStudentId}
                >
                  <option value="">انتخاب کن…</option>
                  {data.students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="تاریخ شروع (شمسی)" hint={faWeekRangeLabel(startOfFaWeek(startDate))}>
                <Input
                  dir="ltr"
                  placeholder="۱۴۰۵/۰۸/۰۱"
                  value={jStart || (() => { const j = isoToJalali(startDate); return `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}` })()}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
                    setJStart(v)
                    const m = v.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/)
                    if (m) {
                      const g = toGregorian(Number(m[1]), Number(m[2]), Number(m[3]))
                      setStartDate(`${g.gy}-${String(g.gm).padStart(2, '0')}-${String(g.gd).padStart(2, '0')}`)
                    }
                  }}
                />
              </Field>
            </div>

            <div>
              <SectionTitle title="قالب‌های برنامه" subtitle="ساختار هفتگی آماده — با انتخاب دانش‌آموز و تاریخ، برنامه ساخته می‌شود" icon={<IconBook className="w-4 h-4" />} />
              {data.planTemplates.length === 0 ? (
                <EmptyState title="هنوز قالب برنامه‌ای نساخته‌ای" body="یک برنامه‌ی خوب بساز و از همین پنجره به‌عنوان قالب ذخیره کن؛ دفعه‌ی بعد یک کلیک کافی است." icon="🧩" />
              ) : (
                <div className="space-y-2">
                  {data.planTemplates.map((t) => (
                    <div key={t.id} className="flex flex-wrap items-center gap-2 border border-slate-200 rounded-2xl p-3">
                      <div className="flex-1 min-w-[160px]">
                        <p className="text-sm font-bold text-slate-800">{t.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {t.kind === 'week' ? 'هفتگی' : t.kind === 'month' ? 'ماهانه' : 'ترمی'} · {faNum(t.items.length)} آیتم
                          {t.items.length ? ` · ${faNum(Math.round(t.items.reduce((s, i) => s + (i.minutes || 0), 0) / 60))} ساعت` : ''}
                        </p>
                      </div>
                      <Button size="sm" disabled={busy} onClick={() => apply(t)}>
                        ساخت برنامه
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-rose-600"
                        onClick={async () => {
                          await backend.deletePlanTemplate(t.id)
                          toast('قالب حذف شد', 'ok')
                          reload()
                        }}
                      >
                        <IconTrash className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <SectionTitle title="قالب‌های تمرین" subtitle="تمرین‌های ذخیره‌شده‌ی من — برای افزودن، از دکمه‌ی «افزودن» استفاده کن" icon={<IconClipboard className="w-4 h-4" />} />
              {data.taskTemplates.length === 0 ? (
                <p className="text-[11px] text-slate-400">هنوز قالب تمرینی ذخیره نکرده‌ای (در بانک تمرین‌ها گزینه‌ی ذخیره را تیک بزن).</p>
              ) : (
                <div className="space-y-2">
                  {data.taskTemplates.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 border border-slate-200 rounded-2xl p-2.5">
                      <p className="text-xs font-medium text-slate-700 flex-1">{t.title}</p>
                      <Badge tone="slate">{faNum(t.days)} روز</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-rose-600"
                        onClick={async () => {
                          await backend.deleteTaskTemplate(t.id)
                          reload()
                        }}
                      >
                        <IconTrash className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'save' && presetPlan && (
          <Card className="bg-slate-50">
            <SectionTitle
              title="ذخیره‌ی این برنامه به‌عنوان قالب"
              subtitle={`«${presetPlan.plan.title}» با ${faNum(presetPlan.items.length)} آیتم ذخیره می‌شود؛ روزها نسبت به اولین آیتم محاسبه می‌شوند.`}
              icon={<IconSpark className="w-4 h-4" />}
            />
            <div className="space-y-3">
              <Field label="عنوان قالب">
                <Input value={tplTitle} onChange={(e) => setTplTitle(e.target.value)} placeholder="مثلاً الگوی هفته‌ی آزمون" />
              </Field>
              <Field label="توضیح قالب (اختیاری)">
                <Textarea value={tplNote} onChange={(e) => setTplNote(e.target.value)} className="min-h-[70px]" />
              </Field>
              <Button onClick={savePlanTemplate} disabled={busy}>
                <IconPlus className="w-4 h-4" /> ذخیره‌ی قالب
              </Button>
            </div>
          </Card>
        )}

        {tab === 'use' && (
          <div className="border-t border-slate-100 pt-4">
            <SectionTitle title="ساخت قالب تمرین دستی" subtitle="برای تمرین‌هایی که در بانک نیستند" />
            <div className="grid sm:grid-cols-4 gap-2 items-end">
              <Field label="عنوان" className="sm:col-span-2">
                <Input value={newTplTitle} onChange={(e) => setNewTplTitle(e.target.value)} className="text-xs" />
              </Field>
              <Field label="مهلت (روز)">
                <Input dir="ltr" type="number" value={newTplDays} onChange={(e) => setNewTplDays(Number(e.target.value))} className="text-xs" />
              </Field>
              <Button
                size="sm"
                disabled={!newTplTitle.trim()}
                onClick={async () => {
                  await backend.saveTaskTemplate({
                    counselorId: profile!.id,
                    title: newTplTitle,
                    description: newTplDesc,
                    days: newTplDays,
                  })
                  setNewTplTitle('')
                  setNewTplDesc('')
                  toast('قالب تمرین ذخیره شد', 'ok')
                  reload()
                }}
              >
                ذخیره
              </Button>
              <Field label="توضیح" className="sm:col-span-4">
                <Input value={newTplDesc} onChange={(e) => setNewTplDesc(e.target.value)} className="text-xs" />
              </Field>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
