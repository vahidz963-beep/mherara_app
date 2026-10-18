import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../store/AppContext'
import { useAsync } from '../../store/hooks'
import { Badge, Button, Card, EmptyState, Field, Input, Modal, Progress, SectionTitle, Segmented, Select, Spinner, StatCard, Textarea } from '../../components/ui'
import { WeekGrid } from '../../components/WeekGrid'
import { ItemProgressModal, TestsSummary } from '../../components/ItemProgress'
import { PlanItemModal } from '../../components/PlanItemModal'
import { FeedbackThread } from '../../components/FeedbackThread'
import { TemplateRunnerModal } from '../../components/TemplatesModal'
import { addDaysIso, faDate, faNum, faWeekRangeLabel, isoToJalali, startOfFaWeek, toGregorian, todayIso } from '../../lib/jalali'
import {
  PARENT_SHARE_LABEL,
  PLAN_STATUS_COLOR,
  PLAN_STATUS_LABEL,
  VISIBILITY_LABEL,
  type ParentShare,
  type Plan,
  type PlanItem,
  type PlanVisibility,
} from '../../lib/types'
import { IconBook, IconPlus } from '../../components/icons'

export function PlanEditor() {
  const { planId = '' } = useParams()
  const { backend, profile, toast } = useApp()
  const nav = useNavigate()

  const { data, loading, reload } = useAsync(
    async () => {
      const plan = await backend.getPlan(planId)
      if (!plan) throw new Error('برنامه پیدا نشد')
      const [items, student] = await Promise.all([backend.listPlanItems(plan.id), backend.getProfile(plan.studentId)])
      return { plan, items, student }
    },
    [backend, planId],
    { plan: null as Plan | null, items: [] as PlanItem[], student: null as any },
  )

  const [weekStart, setWeekStart] = useState('')
  const [itemModal, setItemModal] = useState<{ open: boolean; item: PlanItem | null; date: string }>({ open: false, item: null, date: todayIso() })
  const [metaOpen, setMetaOpen] = useState(false)
  const [progressFor, setProgressFor] = useState<PlanItem | null>(null)
  const [tplOpen, setTplOpen] = useState(false)
  const [scope, setScope] = useState<'week' | 'all'>('week')

  const plan = data.plan
  const effectiveWeek = weekStart || (plan ? startOfFaWeek(plan.startDate) : startOfFaWeek(todayIso()))
  const weekItems = useMemo(
    () => data.items.filter((i) => i.date >= effectiveWeek && i.date <= addDaysIso(effectiveWeek, 6)),
    [data.items, effectiveWeek],
  )

  const [meta, setMeta] = useState<{
    title: string
    kind: Plan['kind']
    startDate: string
    endDate: string
    visibility: PlanVisibility
    parentShare: ParentShare
    note: string
  }>({ title: '', kind: 'week', startDate: '', endDate: '', visibility: 'student_editable', parentShare: 'shared', note: '' })
  const [jStart, setJStart] = useState('')
  const [jEnd, setJEnd] = useState('')

  if (loading) return <Spinner />
  if (!plan || !data.student) return <EmptyState title="برنامه پیدا نشد" icon="🔍" />

  const subjects = Array.from(new Set(data.items.map((i) => i.subject).filter(Boolean)))
  const done = data.items.filter((i) => i.done).length
  const totalMin = data.items.reduce((s, i) => s + (i.minutes || 0), 0)

  const openMeta = () => {
    setMeta({
      title: plan.title,
      kind: plan.kind,
      startDate: plan.startDate,
      endDate: plan.endDate,
      visibility: plan.visibility,
      parentShare: plan.parentShare ?? 'shared',
      note: plan.note || '',
    })
    const s = isoToJalali(plan.startDate)
    const e = isoToJalali(plan.endDate)
    setJStart(`${s.jy}/${String(s.jm).padStart(2, '0')}/${String(s.jd).padStart(2, '0')}`)
    setJEnd(`${e.jy}/${String(e.jm).padStart(2, '0')}/${String(e.jd).padStart(2, '0')}`)
    setMetaOpen(true)
  }

  const saveMeta = async () => {
    await backend.updatePlan(plan.id, meta)
    toast('مشخصات برنامه ذخیره شد', 'ok')
    setMetaOpen(false)
    reload()
  }

  const saveItem = async (item: Partial<PlanItem> & { planId: string }) => {
    await backend.saveItem(item)
    reload()
  }

  const changeStatus = async (status: Plan['status'], body: string) => {
    await backend.updatePlan(plan.id, { status })
    if (body)
      await backend.addFeedback({
        targetType: 'plan',
        targetId: plan.id,
        studentId: plan.studentId,
        authorId: profile!.id,
        authorRole: 'counselor',
        authorName: profile!.fullName,
        kind: status === 'pending' ? 'comment' : 'approve',
        body,
      })
    toast('وضعیت برنامه به‌روز شد', 'ok')
    reload()
  }

  const copyPreviousWeek = async () => {
    const prev = addDaysIso(effectiveWeek, -7)
    const source = data.items.filter((i) => i.date >= prev && i.date <= addDaysIso(prev, 6))
    if (!source.length) {
      toast('هفته‌ی قبل آیتمی نداشت', 'err')
      return
    }
    for (const it of source) {
      await backend.saveItem({
        planId: plan.id,
        date: addDaysIso(it.date, 7),
        title: it.title,
        subject: it.subject,
        kind: it.kind,
        minutes: it.minutes,
        startTime: it.startTime,
        priority: it.priority,
        note: it.note,
      })
    }
    toast(`${faNum(source.length)} آیتم به این هفته کپی شد`, 'ok')
    reload()
  }

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-[220px]">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-black text-slate-800">{plan.title}</h2>
              <Badge tone="slate" className={PLAN_STATUS_COLOR[plan.status]}>{PLAN_STATUS_LABEL[plan.status]}</Badge>
              <Badge tone="slate">{VISIBILITY_LABEL[plan.visibility]}</Badge>
              <Badge tone={plan.parentShare === 'hidden' ? 'amber' : 'slate'}>{PARENT_SHARE_LABEL[plan.parentShare ?? 'shared']}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              برای {data.student.fullName} · {faDate(plan.startDate)} تا {faDate(plan.endDate)} · نسخه {faNum(plan.version)}
            </p>
            {plan.note && <p className="text-xs text-slate-600 mt-2 bg-slate-50 rounded-xl p-2.5 leading-6">{plan.note}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => nav(`/c/student/${plan.studentId}`)}>پرونده دانش‌آموز</Button>
            <Button variant="outline" size="sm" onClick={openMeta}>مشخصات برنامه</Button>
            <Button variant="outline" size="sm" onClick={() => setTplOpen(true)}>قالب‌ها</Button>
            {plan.status === 'draft' && (
              <Button size="sm" onClick={() => changeStatus('pending', 'برنامه آماده است؛ لطفاً بررسی کن و اگر جایی با کلاس‌ها یا توانت نمی‌خورد بگو تا اصلاح کنم.')}>
                ارسال برای تأیید دانش‌آموز
              </Button>
            )}
            {plan.status === 'pending' && (
              <Button size="sm" variant="success" onClick={() => changeStatus('active', 'برنامه فعال شد ✅')}>
                تأیید نهایی و فعال‌سازی
              </Button>
            )}
            {plan.status === 'active' && (
              <Button size="sm" variant="outline" onClick={() => changeStatus('archived', 'این برنامه بایگانی شد. برای هفته‌ی بعد برنامه‌ی جدید می‌سازیم.')}>
                بایگانی برنامه
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <StatCard label="آیتم‌های برنامه" value={faNum(data.items.length)} tone="brand" />
          <StatCard label="انجام‌شده توسط دانش‌آموز" value={`${faNum(done)}/${faNum(data.items.length)}`} tone="green" />
          <StatCard label="مجموع زمان برنامه" value={faNum(Math.round(totalMin / 60))} unit="ساعت" tone="violet" />
          <StatCard label="درصد پیشرفت" value={`${faNum(data.items.length ? Math.round((done / data.items.length) * 100) : 0)}٪`} tone="amber" />
        </div>
        <Progress className="mt-3" value={data.items.length ? (done / data.items.length) * 100 : 0} tone="green" />
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setWeekStart(addDaysIso(effectiveWeek, 7))}>هفته‌ی بعد ›</Button>
            <div className="text-center">
              <p className="text-xs font-bold text-slate-700">{faWeekRangeLabel(effectiveWeek)}</p>
              <button className="text-[10px] text-brand-600" onClick={() => setWeekStart(startOfFaWeek(todayIso()))}>
                بازگشت به هفته‌ی جاری
              </button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setWeekStart(addDaysIso(effectiveWeek, -7))}>‹ هفته‌ی قبل</Button>
          </div>
          <div className="flex items-center gap-2">
            <Segmented value={scope} onChange={setScope} options={[{ value: 'week', label: 'این هفته' }, { value: 'all', label: 'کل برنامه' }]} />
            <Button variant="outline" size="sm" onClick={copyPreviousWeek}>کپی از هفته‌ی قبل</Button>
            <Button size="sm" onClick={() => setItemModal({ open: true, item: null, date: effectiveWeek })}>
              <IconPlus className="w-4 h-4" /> آیتم جدید
            </Button>
          </div>
        </div>

        <WeekGrid
          startIso={scope === 'week' ? effectiveWeek : startOfFaWeek(data.items[0]?.date || effectiveWeek)}
          items={scope === 'week' ? weekItems : data.items}
          editable
          onAdd={(date) => setItemModal({ open: true, item: null, date })}
          onEdit={(item) => setItemModal({ open: true, item, date: item.date })}
          onToggleDone={async (item) => {
            await backend.saveItem({ id: item.id, planId: plan.id, done: !item.done, doneAt: !item.done ? new Date().toISOString() : undefined })
            reload()
          }}
          onMoveItem={async (item, newDate) => {
            await backend.saveItem({ id: item.id, planId: plan.id, date: newDate })
            toast(`«${item.title}» جابه‌جا شد`, 'ok')
            reload()
          }}
          onLogProgress={(x) => setProgressFor(x)}
          emptyHint="خالی — با + اضافه کن"
        />

        <div className="mt-3">
          <TestsSummary
            items={scope === 'week' ? weekItems : data.items}
            title={scope === 'week' ? 'جمع تست‌های این هفته' : 'جمع تست‌های کل برنامه'}
          />
        </div>

        <ItemProgressModal
          open={!!progressFor}
          onClose={() => setProgressFor(null)}
          item={progressFor}
          viewer="counselor"
          onSave={async (patch) => {
            const item = progressFor
            if (!item) return
            await backend.saveItem({ id: item.id, planId: plan.id, ...patch })
            toast('ثبت شد ✅', 'ok')
            reload()
          }}
        />
      </Card>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <FeedbackThread
            targetType="plan"
            targetId={plan.id}
            studentId={plan.studentId}
            title="بازخورد و توافق روی این برنامه"
            subtitle="دانش‌آموز می‌تواند تأیید کند یا درخواست اصلاح بدهد"
          />
        </div>
        <Card>
          <SectionTitle title="چطور این برنامه را بهتر کنیم؟" icon={<IconBook className="w-4 h-4" />} />
          <ul className="text-[11px] text-slate-600 space-y-2 leading-6">
            <li>• هر بلوک مطالعه را با «خروجی مشخص» بنویس (مثلاً ۲۰ تست تابع، نه «ریاضی»).</li>
            <li>• بین بلوک‌های سنگین، یک استراحت ۱۵ دقیقه‌ای یا ورزش کوتاه بگذار.</li>
            <li>• هفته‌ای یک بازه‌ی «جبرانی» بگذار تا اگر عقب افتاد، برنامه فرو نریزد.</li>
            <li>• آیتم‌های حساس را در حالت «قابل ویرایش» بگذار تا دانش‌آموز خودش جابه‌جا کند.</li>
            <li>• یادداشت دانش‌آموز روی هر آیتم را بخوان؛ همان‌جا نشانه‌ی افت تمرکز یا فشار است.</li>
          </ul>
          {subjects.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] font-bold text-slate-600 mb-1.5">درس‌های این برنامه</p>
              <div className="flex flex-wrap gap-1.5">
                {subjects.map((s) => (
                  <Badge key={s} tone="brand">{s}</Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      <PlanItemModal
        open={itemModal.open}
        onClose={() => setItemModal((m) => ({ ...m, open: false }))}
        planId={plan.id}
        dateIso={itemModal.date}
        initial={itemModal.item}
        subjects={subjects}
        onSave={saveItem}
        onDelete={async (id) => {
          await backend.deleteItem(id)
          reload()
        }}
      />

      <TemplateRunnerModal
        open={tplOpen}
        onClose={() => setTplOpen(false)}
        presetPlan={{ plan, items: data.items }}
        onDone={(p) => nav(`/c/plan/${p.id}`)}
      />

      <Modal
        open={metaOpen}
        onClose={() => setMetaOpen(false)}
        title="مشخصات برنامه"
        footer={
          <>
            <Button variant="outline" onClick={() => setMetaOpen(false)}>انصراف</Button>
            <Button onClick={saveMeta}>ذخیره</Button>
          </>
        }
      >
        <div className="space-y-3.5">
          <Field label="عنوان">
            <Input value={meta.title} onChange={(e) => setMeta((m) => ({ ...m, title: e.target.value }))} />
          </Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="تاریخ شروع (شمسی)">
              <Input
                dir="ltr"
                value={faNum(jStart)}
                onChange={(e) => {
                  const v = e.target.value.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
                  setJStart(v)
                  const m = v.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/)
                  if (m) {
                    const g = toGregorian(Number(m[1]), Number(m[2]), Number(m[3]))
                    setMeta((f) => ({ ...f, startDate: `${g.gy}-${String(g.gm).padStart(2, '0')}-${String(g.gd).padStart(2, '0')}` }))
                  }
                }}
              />
            </Field>
            <Field label="تاریخ پایان (شمسی)">
              <Input
                dir="ltr"
                value={faNum(jEnd)}
                onChange={(e) => {
                  const v = e.target.value.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
                  setJEnd(v)
                  const m = v.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/)
                  if (m) {
                    const g = toGregorian(Number(m[1]), Number(m[2]), Number(m[3]))
                    setMeta((f) => ({ ...f, endDate: `${g.gy}-${String(g.gm).padStart(2, '0')}-${String(g.gd).padStart(2, '0')}` }))
                  }
                }}
              />
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="نوع بازه">
              <Select value={meta.kind} onChange={(e) => setMeta((m) => ({ ...m, kind: e.target.value as Plan['kind'] }))}>
                <option value="week">هفتگی</option>
                <option value="month">ماهانه</option>
                <option value="term">ترمی</option>
              </Select>
            </Field>
            <Field label="سطح دسترسی دانش‌آموز">
              <Select value={meta.visibility} onChange={(e) => setMeta((m) => ({ ...m, visibility: e.target.value as PlanVisibility }))}>
                <option value="student_view">فقط مشاهده</option>
                <option value="student_editable">قابل ویرایش</option>
                <option value="private">فقط مشاور</option>
              </Select>
            </Field>
          </div>
          <Field label="اشتراک با والدین" hint="اگر «پنهان» باشد، این برنامه و آیتم‌هایش در نمای والدین دیده نمی‌شود">
            <Select value={meta.parentShare} onChange={(e) => setMeta((m) => ({ ...m, parentShare: e.target.value as ParentShare }))}>
              <option value="shared">برای والدین قابل مشاهده</option>
              <option value="hidden">پنهان از والدین</option>
            </Select>
          </Field>
          <Field label="یادداشت">
            <Textarea value={meta.note} onChange={(e) => setMeta((m) => ({ ...m, note: e.target.value }))} />
          </Field>
        </div>
      </Modal>
    </div>
  )
}
