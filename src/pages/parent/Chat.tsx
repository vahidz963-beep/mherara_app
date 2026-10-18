import { useApp } from '../../store/AppContext'
import { useAsync } from '../../store/hooks'
import { Avatar, Card, EmptyState, SectionTitle, Spinner } from '../../components/ui'
import { FeedbackThread } from '../../components/FeedbackThread'
import type { Profile } from '../../lib/types'

export function ParentChat() {
  const { backend, profile } = useApp()

  const { data, loading } = useAsync(
    async () => {
      const children = await backend.listChildren(profile!.id)
      const child = children[0] || null
      const counselor = child?.counselorId ? await backend.getProfile(child.counselorId) : null
      return { child, counselor: counselor as Profile | null }
    },
    [backend, profile?.id],
    { child: null as Profile | null, counselor: null as Profile | null },
  )

  if (loading) return <Spinner />
  if (!data.child) return <EmptyState title="ابتدا به پرونده‌ی فرزندتان وصل شوید" icon="🔗" />

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2">
        <FeedbackThread
          targetType="student"
          targetId={data.child.id}
          studentId={data.child.id}
          title="گفت‌وگوی والدین و مشاور"
          subtitle="پیام‌های شما در همین گفت‌وگوی مشترک دیده می‌شود — لطفاً از جزئیات خصوصی جلسه‌ی فرزندتان نپرسید"
        />
      </div>
      <div className="space-y-5">
        <Card>
          <SectionTitle title="مشاور فرزندم" />
          {data.counselor ? (
            <div className="flex items-center gap-3">
              <Avatar name={data.counselor.fullName} size={46} tone="violet" />
              <div>
                <p className="text-sm font-bold text-slate-800">{data.counselor.fullName}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-5">{data.counselor.bio || 'مشاور تحصیلی و روان‌شناختی'}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">هنوز مشاوری به پرونده وصل نشده.</p>
          )}
        </Card>
        <Card className="border-brand-200 bg-brand-50/50">
          <SectionTitle title="راهنمای گفت‌وگو" />
          <ul className="text-[11px] text-slate-700 space-y-2 leading-6">
            <li>• برای هماهنگی زمان جلسه، پیام بگذارید.</li>
            <li>• اگر نگرانی جدی درباره‌ی حال فرزندتان دارید، صریح بنویسید تا مشاور پیگیری کند.</li>
            <li>• برای دیدن پیشرفت هفتگی، از صفحه‌ی «گزارش» استفاده کنید.</li>
            <li>• محرمانگی جلسه‌های مشاوره شرط اعتماد فرزندتان است؛ آن را حفظ کنیم.</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
