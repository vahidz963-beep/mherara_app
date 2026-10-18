import { useCallback, useEffect, useState } from 'react'
import { useApp } from '../store/AppContext'
import { Avatar, Badge, Button, Card, Textarea, cn } from './ui'
import type { Feedback, FeedbackKind, TargetType } from '../lib/types'
import { faDate, faTime } from '../lib/jalali'
import { IconChat, IconCheck } from './icons'

export function FeedbackThread({
  targetType,
  targetId,
  studentId,
  title = 'گفت‌وگو و بازخورد',
  subtitle,
  compact,
  defaultKind = 'comment',
}: {
  targetType: TargetType
  targetId: string
  studentId: string
  title?: string
  subtitle?: string
  compact?: boolean
  defaultKind?: FeedbackKind
}) {
  const { backend, profile, toast } = useApp()
  const [list, setList] = useState<Feedback[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setList(await backend.listFeedback({ targetType, targetId }))
    } finally {
      setLoading(false)
    }
  }, [backend, targetType, targetId])

  useEffect(() => {
    load()
  }, [load])

  const send = async (kind: FeedbackKind = defaultKind) => {
    if (!profile || !text.trim()) return
    try {
      await backend.addFeedback({
        targetType,
        targetId,
        studentId,
        authorId: profile.id,
        kind,
        body: text.trim(),
        authorName: profile.fullName,
        authorRole: profile.role,
      })
      setText('')
      await load()
    } catch (e: any) {
      toast(e?.message || 'ارسال نشد', 'err')
    }
  }

  const readOnly = profile?.role === 'parent'

  return (
    <Card className={cn(compact && 'p-3')}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 grid place-items-center">
          <IconChat className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">{title}</p>
          {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
        </div>
      </div>

      <div className={cn('space-y-2.5 overflow-y-auto pl-1', compact ? 'max-h-64' : 'max-h-96')}>
        {loading && <p className="text-xs text-slate-400 py-3 text-center">در حال بارگذاری…</p>}
        {!loading && list.length === 0 && (
          <p className="text-[11px] text-slate-400 text-center py-3">هنوز پیامی رد و بدل نشده. اولین نکته را همین‌جا بنویسید.</p>
        )}
        {list.map((f) => {
          const mine = f.authorId === profile?.id
          const isCounselor = f.authorRole === 'counselor'
          return (
            <div key={f.id} className={cn('flex gap-2', mine && 'flex-row-reverse')}>
              <Avatar name={f.authorName || 'کاربر'} size={30} tone={isCounselor ? 'violet' : f.authorRole === 'parent' ? 'amber' : 'brand'} />
              <div className={cn('rounded-2xl px-3 py-2 max-w-[80%] border', isCounselor ? 'bg-violet-50 border-violet-100' : 'bg-slate-50 border-slate-200')}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[11px] font-bold text-slate-700">{f.authorName}</span>
                  {isCounselor && <Badge tone="violet">مشاور</Badge>}
                  {f.kind === 'approve' && (
                    <Badge tone="green">
                      <IconCheck className="w-3 h-3" /> تأیید
                    </Badge>
                  )}
                  {f.kind === 'request_change' && <Badge tone="amber">درخواست اصلاح</Badge>}
                  <span className="text-[10px] text-slate-400">
                    {faDate(f.createdAt.slice(0, 10), { short: true })} {faTime(f.createdAt.slice(11, 16))}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-6 whitespace-pre-wrap">{f.body}</p>
              </div>
            </div>
          )
        })}
      </div>

      {!readOnly && (
        <div className="mt-3 space-y-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="پیام یا بازخوردت را بنویس… (مثلاً: دوشنبه‌ها کلاس دارم، این بلوک را جابه‌جا کنیم)"
            className="min-h-[70px] text-xs"
          />
          <div className="flex items-center justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => send('request_change')} disabled={!text.trim()}>
              درخواست اصلاح
            </Button>
            <Button size="sm" onClick={() => send('comment')} disabled={!text.trim()}>
              ارسال پیام
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
