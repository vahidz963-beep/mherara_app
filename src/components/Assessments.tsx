import { useState } from 'react'
import { useApp } from '../store/AppContext'
import { useAsync } from '../store/hooks'
import { Badge, Button, Card, EmptyState, Input, Progress, SectionTitle, Spinner, Tabs, cn } from './ui'
import { ExamInsights, examAverage, type ExamRow } from './ExamInsights'
import { ExamModal } from './ExamModal'
import { faDate, faNum, faRelative } from '../lib/jalali'
import {
  MISTAKE_REASON_LABEL,
  subjectPercent,
  type Exam,
  type ExamMistake,
  type ExamSubject,
  type MistakeReason,
} from '../lib/types'
import { IconBook, IconChart, IconPlus, IconTrend, IconTrash } from './icons'

/** تب «آزمون‌ها» در پرونده‌ی دانش‌آموز (مشاور) */
export function CounselorAssessments({ studentId }: { studentId: string }) {
  const { backend, profile, toast } = useApp()
  const [modal, setModal] = useState<{ open: boolean; exam: Exam | null }>({ open: false, exam: null })
  const [tab, setTab] = useState<'overview' | 'list' | 'mistakes'>('overview')
  const [quickExam, setQuickExam] = useState<string>('')
  const [quickSubject, setQuickSubject] = useState('')
  const [quickReason, setQuickReason] = useState<MistakeReason>('knowledge')
  const [quickNote, setQuickNote] = useState('')

  const { data, loading, reload } = useAsync(
    async () => {
      const exams = await backend.listExams(studentId)
      const rows: ExamRow[] = []
      for (const e of exams) rows.push({ exam: e, subjects: await backend.listExamSubjects(e.id) })
      const mistakes = await backend.listMistakes(studentId)
      return { exams, rows, mistakes }
    },
    [backend, studentId],
    { exams: [] as Exam[], rows: [] as ExamRow[], mistakes: [] as ExamMistake[] },
  )

  if (loading) return <Spinner />

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle
          title="آزمون‌ها و کارنامه‌ها"
          subtitle="با ثبت درصد درس‌ها و علت غلط‌ها، برنامه‌ی هفته‌ی بعد را از دل داده بچین — نه از حدس"
          icon={<IconChart className="w-4 h-4" />}
          action={
            <Button size="sm" onClick={() => setModal({ open: true, exam: null })}>
              <IconPlus className="w-4 h-4" /> ثبت آزمون
            </Button>
          }
        />

        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'overview', label: 'تحلیل' },
            { value: 'list', label: 'فهرست آزمون‌ها', count: data.rows.length },
            { value: 'mistakes', label: 'دفتر اشتباهات', count: data.mistakes.filter((m) => !m.resolved).length },
          ]}
        />
      </Card>

      {tab === 'overview' && <ExamInsights rows={data.rows} mistakes={data.mistakes} />}

      {tab === 'list' && (
        <Card>
          {data.rows.length === 0 ? (
            <EmptyState
              title="آزمونی ثبت نشده"
              body="اولین آزمون را ثبت کن تا روند و مقایسه‌ی درس‌ها ساخته شود."
              icon="📝"
              action={<Button onClick={() => setModal({ open: true, exam: null })}>ثبت آزمون</Button>}
            />
          ) : (
            <div className="space-y-2.5">
              {data.rows.map(({ exam, subjects }) => {
                const avg = examAverage(subjects)
                return (
                  <div key={exam.id} className="border border-slate-200 rounded-2xl p-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-slate-800 flex-1 min-w-[150px]">{exam.title}</p>
                      <Badge tone={avg >= 60 ? 'green' : avg >= 40 ? 'amber' : 'rose'}>میانگین {faNum(avg)}%</Badge>
                      <Button size="sm" variant="soft" onClick={() => setModal({ open: true, exam })}>
                        ویرایش
                      </Button>
                      <button
                        className="text-rose-500 hover:bg-rose-50 rounded-lg p-1.5"
                        onClick={async () => {
                          await backend.deleteExam(exam.id)
                          toast('آزمون حذف شد', 'ok')
                          reload()
                        }}
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {faDate(exam.date, { withWeekday: true })} · {faRelative(exam.date)} · {faNum(subjects.length)} درس
                    </p>
                    {exam.note && <p className="text-[11px] text-slate-600 mt-1.5 bg-slate-50 rounded-lg p-2 leading-5">{exam.note}</p>}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {subjects.map((s) => (
                        <Badge key={s.id} tone={subjectPercent(s) >= 60 ? 'green' : subjectPercent(s) >= 40 ? 'amber' : 'rose'}>
                          {s.subject} {faNum(subjectPercent(s))}%
                        </Badge>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}

      {tab === 'mistakes' && (
        <div className="grid lg:grid-cols-2 gap-5">
          <Card>
            <SectionTitle title="افزودن سریع به دفتر اشتباهات" subtitle="برای وقتی که سر جلسه هستی و وقت ثبت کامل آزمون را نداری" icon={<IconBook className="w-4 h-4" />} />
            <div className="space-y-2.5">
              <select value={quickExam} onChange={(e) => setQuickExam(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm">
                <option value="">انتخاب آزمون…</option>
                {data.exams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title} — {faDate(e.date, { short: true })}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <Input value={quickSubject} onChange={(e) => setQuickSubject(e.target.value)} placeholder="درس (مثلاً فیزیک)" className="text-xs" />
                <select
                  value={quickReason}
                  onChange={(e) => setQuickReason(e.target.value as MistakeReason)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                >
                  {Object.entries(MISTAKE_REASON_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <Input value={quickNote} onChange={(e) => setQuickNote(e.target.value)} placeholder="توضیح کوتاه: چه اشتباهی رخ داد؟" className="text-xs" />
              <Button
                size="sm"
                disabled={!quickExam}
                onClick={async () => {
                  await backend.saveMistake({ examId: quickExam, studentId, subject: quickSubject, reason: quickReason, note: quickNote })
                  setQuickSubject('')
                  setQuickNote('')
                  toast('به دفتر اشتباهات اضافه شد', 'ok')
                  reload()
                }}
              >
                افزودن
              </Button>
            </div>
          </Card>

          <Card>
            <SectionTitle title="موارد ثبت‌شده" subtitle="با تیک «حل شد» دفتر سبک می‌شود" />
            <div className="space-y-2 max-h-[420px] overflow-y-auto">
              {data.mistakes.length === 0 && <p className="text-xs text-slate-400 text-center py-4">چیزی ثبت نشده.</p>}
              {data.mistakes.map((m) => (
                <div key={m.id} className={cn('border rounded-2xl p-2.5', m.resolved ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200')}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge tone="slate">{MISTAKE_REASON_LABEL[m.reason]}</Badge>
                    <span className="text-[11px] font-bold text-slate-700">{m.subject}</span>
                    {m.examTitle && <span className="text-[10px] text-slate-400">{m.examTitle}</span>}
                    <label className="mr-auto flex items-center gap-1.5 text-[10px] text-slate-600">
                      <input
                        type="checkbox"
                        checked={m.resolved}
                        onChange={async (e) => {
                          await backend.saveMistake({ id: m.id, examId: m.examId, studentId, resolved: e.target.checked })
                          reload()
                        }}
                      />
                      حل شد
                    </label>
                    <button
                      className="text-rose-500 hover:bg-rose-50 rounded-lg p-1"
                      onClick={async () => {
                        await backend.deleteMistake(m.id)
                        reload()
                      }}
                    >
                      <IconTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {m.note && <p className="text-[11px] text-slate-600 mt-1.5">{m.note}</p>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <ExamModal
        open={modal.open}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
        studentId={studentId}
        counselorId={profile!.id}
        exam={modal.exam}
        onSaved={reload}
      />
    </div>
  )
}

/** خلاصه‌ی آخرین آزمون برای خانه‌ی دانش‌آموز */
export function StudentExamSummary({ studentId }: { studentId: string }) {
  const { backend } = useApp()
  const { data } = useAsync(
    async () => {
      const exams = await backend.listExams(studentId)
      if (!exams.length) return { last: null as Exam | null, subjects: [] as ExamSubject[], mistakes: [] as ExamMistake[] }
      const subjects = await backend.listExamSubjects(exams[0].id)
      const mistakes = await backend.listMistakes(studentId)
      return { last: exams[0], subjects, mistakes }
    },
    [backend, studentId],
    { last: null as Exam | null, subjects: [] as ExamSubject[], mistakes: [] as ExamMistake[] },
  )

  if (!data.last) return null
  const avg = examAverage(data.subjects)
  const open = data.mistakes.filter((m) => !m.resolved)

  return (
    <Card>
      <SectionTitle title="آخرین آزمون" subtitle={`${data.last.title} — ${faDate(data.last.date, { withWeekday: true })}`} icon={<IconTrend className="w-4 h-4" />} />
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <p className="text-2xl font-black text-slate-800">{faNum(avg)}%</p>
          <p className="text-[10px] text-slate-500">میانگین وزنی</p>
        </div>
        <div className="flex-1 flex flex-wrap gap-1.5">
          {data.subjects.slice(0, 6).map((s) => (
            <Badge key={s.id} tone={subjectPercent(s) >= 60 ? 'green' : subjectPercent(s) >= 40 ? 'amber' : 'rose'}>
              {s.subject} {faNum(subjectPercent(s))}%
            </Badge>
          ))}
        </div>
      </div>
      {open.length > 0 && (
        <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-2.5">
          <p className="text-[11px] font-bold text-amber-900 mb-1">{faNum(open.length)} مورد در دفتر اشتباهات حل نشده</p>
          <p className="text-[11px] text-amber-800 leading-5">{open.slice(0, 2).map((m) => `${m.subject}: ${MISTAKE_REASON_LABEL[m.reason]}`).join(' · ')}</p>
        </div>
      )}
      <Progress className="mt-3" value={avg} tone={avg >= 60 ? 'green' : avg >= 40 ? 'brand' : 'amber'} />
    </Card>
  )
}
