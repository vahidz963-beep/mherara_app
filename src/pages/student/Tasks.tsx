import { useState } from 'react'
import { useApp } from '../../store/AppContext'
import { useAsync } from '../../store/hooks'
import { Badge, Button, Card, EmptyState, Input, SectionTitle, Spinner, Tabs } from '../../components/ui'
import { faDate, faNum, faRelative } from '../../lib/jalali'
import { TASK_STATUS_LABEL, type Task, type TaskStatus } from '../../lib/types'
import { IconClipboard } from '../../components/icons'

export function StudentTasks() {
  const { backend, profile, toast } = useApp()
  const [tab, setTab] = useState<'open' | 'all' | 'done'>('open')
  const [noteFor, setNoteFor] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')

  const { data, loading, reload } = useAsync(async () => backend.listTasks(profile!.id), [backend, profile?.id], [] as Task[])

  if (loading) return <Spinner />

  const list =
    tab === 'open' ? data.filter((t) => t.status !== 'done') : tab === 'done' ? data.filter((t) => t.status === 'done') : data

  const setStatus = async (t: Task, status: TaskStatus) => {
    await backend.saveTask({ id: t.id, studentId: profile!.id, status })
    if (status === 'done')
      await backend.addFeedback({
        targetType: 'task',
        targetId: t.id,
        studentId: profile!.id,
        authorId: profile!.id,
        authorRole: 'student',
        authorName: profile!.fullName,
        kind: 'edit',
        body: `تمرین «${t.title}» را انجام دادم ✅`,
      })
    toast('وضعیت به‌روز شد', 'ok')
    reload()
  }

  return (
    <Card>
      <SectionTitle
        title="تمرین‌ها و تکالیف من"
        subtitle="تمرین‌های روان‌شناختی و تکالیف درسی که مشاور داده است"
        icon={<IconClipboard className="w-4 h-4" />}
      />

      <div className="mb-4">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'open', label: 'باز', count: data.filter((t) => t.status !== 'done').length },
            { value: 'done', label: 'انجام‌شده', count: data.filter((t) => t.status === 'done').length },
            { value: 'all', label: 'همه', count: data.length },
          ]}
        />
      </div>

      {list.length === 0 ? (
        <EmptyState title="تمرینی در این بخش نیست" icon="🧩" />
      ) : (
        <div className="space-y-3">
          {list.map((t) => (
            <div key={t.id} className="border border-slate-200 rounded-2xl p-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-slate-800 flex-1 min-w-[150px]">{t.title}</p>
                <Badge tone={t.status === 'done' ? 'green' : t.status === 'doing' ? 'amber' : 'slate'}>{TASK_STATUS_LABEL[t.status]}</Badge>
              </div>
              {t.description && <p className="text-xs text-slate-600 mt-2 leading-6">{t.description}</p>}
              {t.dueDate && (
                <p className="text-[11px] text-slate-500 mt-1.5">
                  مهلت: {faDate(t.dueDate)} · {faRelative(t.dueDate)}
                </p>
              )}

              {t.counselorFeedback && (
                <div className="mt-2 bg-violet-50 border border-violet-100 rounded-xl p-2.5">
                  <p className="text-[10px] font-bold text-violet-700 mb-1">بازخورد مشاور</p>
                  <p className="text-[11px] text-slate-700">{t.counselorFeedback}</p>
                </div>
              )}

              {t.studentNote && (
                <div className="mt-2 bg-brand-50 border border-brand-100 rounded-xl p-2.5">
                  <p className="text-[10px] font-bold text-brand-700 mb-1">یادداشت من</p>
                  <p className="text-[11px] text-slate-700">{t.studentNote}</p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-3">
                {t.status !== 'done' && (
                  <>
                    {t.status === 'todo' && (
                      <Button size="sm" variant="outline" onClick={() => setStatus(t, 'doing')}>
                        شروع کردم
                      </Button>
                    )}
                    <Button size="sm" variant="success" onClick={() => setStatus(t, 'done')}>
                      انجام شد ✅
                    </Button>
                  </>
                )}
                {t.status === 'done' && (
                  <Button size="sm" variant="ghost" onClick={() => setStatus(t, 'doing')}>
                    برگردان به در حال انجام
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setNoteFor(noteFor === t.id ? null : t.id)
                    setNoteText(t.studentNote || '')
                  }}
                >
                  یادداشت
                </Button>
              </div>

              {noteFor === t.id && (
                <div className="mt-2 flex gap-2">
                  <Input
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="چطور پیش رفت؟ چه مانعی داشتی؟"
                    className="text-xs"
                  />
                  <Button
                    size="sm"
                    onClick={async () => {
                      await backend.saveTask({ id: t.id, studentId: profile!.id, studentNote: noteText })
                      toast('یادداشت ذخیره شد؛ مشاورت می‌بیند', 'ok')
                      setNoteFor(null)
                      reload()
                    }}
                  >
                    ذخیره
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-slate-500 mt-4 bg-slate-50 border border-slate-200 rounded-xl p-3 leading-6">
        نکته: تمرین‌های کوتاه و روزانه (مثل تنفس یا مرور ۱۰ دقیقه‌ای) معمولاً اثر بیشتری از تمرین‌های طولانی یک‌باره دارند.
        اگر تمرینی برایت سنگین است، همان‌جا یادداشت بگذار یا از صفحه‌ی گفت‌وگو به مشاور بگو.
      </p>
    </Card>
  )
}
