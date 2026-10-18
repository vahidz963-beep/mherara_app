import { useApp } from '../../store/AppContext'
import { useAsync } from '../../store/hooks'
import { Avatar, Badge, Card, EmptyState, SectionTitle, Spinner } from '../../components/ui'
import { FeedbackThread } from '../../components/FeedbackThread'
import { faDate, faNum, faRelative, faTime } from '../../lib/jalali'
import type { Profile, SessionRow } from '../../lib/types'
import { IconCalendar } from '../../components/icons'

export function StudentChat() {
  const { backend, profile } = useApp()

  const { data, loading } = useAsync(
    async () => {
      const [sessions, counselor] = await Promise.all([
        backend.listSessions(profile!.id),
        profile!.counselorId ? backend.getProfile(profile!.counselorId) : Promise.resolve(null),
      ])
      return { sessions, counselor: counselor as Profile | null }
    },
    [backend, profile?.id],
    { sessions: [] as SessionRow[], counselor: null as Profile | null },
  )

  if (loading) return <Spinner />

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2">
        <FeedbackThread
          targetType="student"
          targetId={profile!.id}
          studentId={profile!.id}
          title="گفت‌وگو با مشاور"
          subtitle="سؤال، ابهام یا درخواست تغییر برنامه را همین‌جا بنویس؛ مشاورت می‌بیند و پاسخ می‌دهد"
        />
      </div>

      <div className="space-y-5">
        <Card>
          <SectionTitle title="مشاور من" />
          {data.counselor ? (
            <div className="flex items-center gap-3">
              <Avatar name={data.counselor.fullName} size={46} tone="violet" />
              <div>
                <p className="text-sm font-bold text-slate-800">{data.counselor.fullName}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-5">{data.counselor.bio || 'مشاور تحصیلی و روان‌شناختی'}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">هنوز مشاوری به پرونده‌ات وصل نشده. با کد دعوت می‌توانی وصل شوی.</p>
          )}
        </Card>

        <Card>
          <SectionTitle title="جلسه‌های من" icon={<IconCalendar className="w-4 h-4" />} />
          {data.sessions.length === 0 ? (
            <EmptyState title="جلسه‌ای ثبت نشده" icon="📅" />
          ) : (
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto">
              {data.sessions.map((s) => (
                <div key={s.id} className="border border-slate-200 rounded-2xl p-3">
                  <div className="flex items-center gap-2">
                    <Badge tone={s.status === 'done' ? 'green' : s.status === 'canceled' ? 'rose' : 'brand'}>
                      {s.status === 'done' ? 'برگزار شد' : s.status === 'canceled' ? 'لغو شد' : 'برنامه‌ریزی‌شده'}
                    </Badge>
                    <span className="text-[10px] text-slate-500">{faRelative(s.date)}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-700 mt-1.5">{s.topic}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {faDate(s.date, { withWeekday: true })} {s.time ? `· ${faTime(s.time)}` : ''}
                  </p>
                  {s.nextSteps && (
                    <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg p-2 mt-2 leading-6">
                      قدم‌های بعدی: {s.nextSteps}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    خلاصه‌ی جزئیات جلسه محرمانه می‌ماند.{' '}
                    {s.status === 'done' ? `توافق‌های جلسه در بالا آمده.` : `با ${faNum(1)} روز قبل خبر می‌دهیم.`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
