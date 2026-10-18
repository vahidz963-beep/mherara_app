import { useState } from 'react'
import { useApp } from '../../store/AppContext'
import { useAsync } from '../../store/hooks'
import { Badge, Button, Card, EmptyState, Field, Input, Modal, SectionTitle, Select, Spinner, Tabs, Textarea, cn } from '../../components/ui'
import { ExamInsights, examAverage, type ExamRow } from '../../components/ExamInsights'
import { ExamModal } from '../../components/ExamModal'
import { faDate, faNum, faRelative } from '../../lib/jalali'
import {
  MISTAKE_REASON_COLOR,
  MISTAKE_REASON_LABEL,
  subjectPercent,
  type Exam,
  type ExamMistake,
  type MistakeReason,
} from '../../lib/types'
import { IconPlus } from '../../components/icons'

export function StudentAssessments() {
  const { backend, profile, toast } = useApp()
  const [modal, setModal] = useState<{ open: boolean; exam: Exam | null }>({ open: false, exam: null })
  const [tab, setTab] = useState<'overview' | 'list'>('overview')
  const [selfOpen, setSelfOpen] = useState(false)
  const [sf, setSf] = useState({ examId: '', subject: '', reason: 'careless' as MistakeReason, note: '' })

  const { data, loading, reload } = useAsync(
    async () => {
      const exams = await backend.listExams(profile!.id)
      const rows: ExamRow[] = []
      for (const e of exams) rows.push({ exam: e, subjects: await backend.listExamSubjects(e.id) })
      const mistakes = await backend.listMistakes(profile!.id)
      return { exams, rows, mistakes }
    },
    [backend, profile?.id],
    { exams: [] as Exam[], rows: [] as ExamRow[], mistakes: [] as ExamMistake[] },
  )

  if (loading) return <Spinner />

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle
          title="آزمون‌های من"
          subtitle="درصد هر درس را ثبت کن و علت غلط‌ها را بنویس؛ مشاورت از همین داده برنامه می‌چیند"
          icon={<span>📝</span>}
          action={
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setSelfOpen(true)} disabled={data.exams.length === 0}>
                دفتر اشتباهات من
              </Button>
              <Button size="sm" onClick={() => setModal({ open: true, exam: null })}>
                <IconPlus className="w-4 h-4" /> ثبت آزمون
              </Button>
            </div>
          }
        />
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'overview', label: 'تحلیل روند' },
            { value: 'list', label: 'فهرست آزمون‌ها', count: data.rows.length },
          ]}
        />
      </Card>

      {tab === 'overview' && <ExamInsights rows={data.rows} mistakes={data.mistakes} />}

      {tab === 'list' && (
        <Card>
          {data.rows.length === 0 ? (
            <EmptyState title="هنوز آزمونی ثبت نکرده‌ای" body="با ثبت اولین آزمون، روند و نقاط قوت/ضعف‌ات ساخته می‌شود." icon="📈" action={<Button onClick={() => setModal({ open: true, exam: null })}>ثبت آزمون</Button>} />
          ) : (
            <div className="space-y-2.5">
              {data.rows.map(({ exam, subjects }) => {
                const avg = examAverage(subjects)
                return (
                  <button key={exam.id} onClick={() => setModal({ open: true, exam })} className="w-full text-right border border-slate-200 rounded-2xl p-3.5 hover:border-brand-300">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-slate-800 flex-1 min-w-[150px]">{exam.title}</p>
                      <Badge tone={avg >= 60 ? 'green' : avg >= 40 ? 'amber' : 'rose'}>میانگین {faNum(avg)}%</Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {faDate(exam.date, { withWeekday: true })} · {faRelative(exam.date)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {subjects.map((s) => (
                        <Badge key={s.id} tone={subjectPercent(s) >= 60 ? 'green' : subjectPercent(s) >= 40 ? 'amber' : 'rose'}>
                          {s.subject} {faNum(subjectPercent(s))}%
                        </Badge>
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </Card>
      )}

      {/* دفتر اشتباهات شخصی دانش‌آموز */}
      <Modal
        open={selfOpen}
        onClose={() => setSelfOpen(false)}
        title="دفتر اشتباهات من"
        wide
        footer={<Button variant="outline" onClick={() => setSelfOpen(false)}>بستن</Button>}
      >
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-2 items-end">
            <Field label="آزمون">
              <Select value={sf.examId} onChange={(e) => setSf((f) => ({ ...f, examId: e.target.value }))}>
                <option value="">انتخاب…</option>
                {data.exams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="درس">
              <Input value={sf.subject} onChange={(e) => setSf((f) => ({ ...f, subject: e.target.value }))} className="text-xs" placeholder="فیزیک" />
            </Field>
            <Field label="علت غلط">
              <Select value={sf.reason} onChange={(e) => setSf((f) => ({ ...f, reason: e.target.value as MistakeReason }))}>
                {Object.entries(MISTAKE_REASON_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="توضیح">
              <Input value={sf.note} onChange={(e) => setSf((f) => ({ ...f, note: e.target.value }))} className="text-xs" placeholder="چرا این سؤال را غلط زدم؟" />
            </Field>
            <Button
              size="sm"
              className="sm:col-span-2"
              disabled={!sf.examId}
              onClick={async () => {
                await backend.saveMistake({ examId: sf.examId, studentId: profile!.id, subject: sf.subject, reason: sf.reason, note: sf.note })
                setSf({ examId: '', subject: '', reason: 'careless', note: '' })
                toast('ثبت شد — جمعه‌ها همین دفتر را مرور کن', 'ok')
                reload()
              }}
            >
              افزودن به دفتر اشتباهات
            </Button>
          </div>

          <div className="space-y-2 max-h-[46vh] overflow-y-auto">
            {data.mistakes.length === 0 && <p className="text-xs text-slate-400 text-center py-4">هنوز موردی ثبت نکرده‌ای.</p>}
            {data.mistakes.map((m) => (
              <div key={m.id} className={cn('border rounded-2xl p-2.5', MISTAKE_REASON_COLOR[m.reason])}>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge tone="slate">{MISTAKE_REASON_LABEL[m.reason]}</Badge>
                  <span className="text-[11px] font-bold">{m.subject}</span>
                  {m.examDate && <span className="text-[10px] opacity-70">{faDate(m.examDate, { short: true })}</span>}
                  <label className="mr-auto flex items-center gap-1.5 text-[10px]">
                    <input
                      type="checkbox"
                      checked={m.resolved}
                      onChange={async (e) => {
                        await backend.saveMistake({ id: m.id, examId: m.examId, studentId: profile!.id, resolved: e.target.checked })
                        reload()
                      }}
                    />
                    حلش کردم
                  </label>
                </div>
                {m.note && <p className="text-[11px] mt-1.5 leading-5">{m.note}</p>}
              </div>
            ))}
          </div>

          <Textarea readOnly className="hidden" value="" />
          <p className="text-[11px] text-slate-500 leading-6">
            نکته: اگر علت بیشتر غلط‌هایت «بی‌دقتی» است، تمرین «دفتر اشتباهات روزانه» را انجام بده؛ اگر «نبودِ دانش» است، اولویت مطالعه‌ات
            همان فصل‌هاست.
          </p>
        </div>
      </Modal>

      <ExamModal
        open={modal.open}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
        studentId={profile!.id}
        exam={modal.exam}
        onSaved={reload}
      />
    </div>
  )
}
