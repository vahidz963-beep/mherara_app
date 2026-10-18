import { useState } from 'react'
import { useApp } from '../../store/AppContext'
import { useAsync } from '../../store/hooks'
import { Badge, Button, Card, EmptyState, Field, Input, SectionTitle, Select, Spinner } from '../../components/ui'
import { faDate, faNum, faRelative } from '../../lib/jalali'
import type { Invite } from '../../lib/types'
import { IconTicket } from '../../components/icons'

export function Invites() {
  const { backend, profile, toast } = useApp()
  const [role, setRole] = useState<Invite['role']>('student')
  const [note, setNote] = useState('')

  const { data, loading, reload } = useAsync(async () => backend.listInvites(profile!.id), [backend, profile?.id], [] as Invite[])

  const create = async () => {
    try {
      const inv = await backend.createInvite({ role, createdBy: profile!.id, note: note || undefined })
      setNote('')
      toast(`کد ساخته شد: ${inv.code}`, 'ok')
      reload()
    } catch (e: any) {
      toast(e?.message || 'ساخت کد ناموفق بود', 'err')
    }
  }

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      toast('کد کپی شد', 'ok')
    } catch {
      toast(`کد: ${code}`, 'info')
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <Card className="lg:col-span-1">
        <SectionTitle title="ساخت کد دعوت" subtitle="کد را به دانش‌آموز بده؛ هنگام ثبت‌نام آن را وارد می‌کند و به پرونده‌ی تو وصل می‌شود" icon={<IconTicket className="w-4 h-4" />} />
        <div className="space-y-3.5">
          <Field label="نوع دعوت">
            <Select value={role} onChange={(e) => setRole(e.target.value as Invite['role'])}>
              <option value="student">دانش‌آموز</option>
              <option value="parent">والد (اتصال به یک دانش‌آموز)</option>
            </Select>
          </Field>
          <Field label="یادداشت (اختیاری)">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="مثلاً برای علی — کلاس ریاضی" />
          </Field>
          <Button className="w-full" onClick={create}>ساخت کد</Button>
          <p className="text-[11px] text-slate-500 leading-5 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
            کدها ۳۰ روز اعتبار دارند و یک‌بارمصرف‌اند. برای افزودن سریع، می‌توانی دانش‌آموزِ ثبت‌نام‌شده را از صفحه‌ی «دانش‌آموزان» با شماره‌اش وصل کنی.
          </p>
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <SectionTitle title="کدهای من" subtitle="وضعیت استفاده و اعتبار" icon={<IconTicket className="w-4 h-4" />} />
        {data.length === 0 ? (
          <EmptyState title="هنوز کدی نساخته‌ای" icon="🎟" />
        ) : (
          <div className="space-y-2.5">
            {data.map((inv) => (
              <div key={inv.code} className="flex flex-wrap items-center gap-3 border border-slate-200 rounded-2xl p-3.5">
                <div className="bg-slate-900 text-white rounded-xl px-3 py-2 font-black tracking-[0.2em]" dir="ltr">
                  {inv.code}
                </div>
                <div className="flex-1 min-w-[150px]">
                  <p className="text-xs font-bold text-slate-700">{inv.note || (inv.role === 'student' ? 'دعوت دانش‌آموز' : 'دعوت والد')}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ساخته‌شده {faDate(inv.createdAt.slice(0, 10), { short: true })}
                    {inv.expiresAt ? ` · اعتبار تا ${faDate(inv.expiresAt, { short: true })} (${faRelative(inv.expiresAt)})` : ''}
                  </p>
                </div>
                {inv.usedBy ? <Badge tone="green">استفاده شد</Badge> : <Badge tone="amber">استفاده نشده</Badge>}
                <Button size="sm" variant="soft" onClick={() => copy(inv.code)}>کپی</Button>
              </div>
            ))}
          </div>
        )}
        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="text-[11px] text-slate-500 leading-6">
            <b>برای والدین:</b> کد والد را بساز و بده؛ هنگام ثبت‌نام شماره‌ی موبایل دانش‌آموز را هم وارد می‌کند تا پرونده وصل شود. والد دسترسی
            خواندنی دارد: برنامه، گزارش مطالعه و خلاصه‌ی جلسه (قدم‌های بعدی) را می‌بیند، ولی محتوای خصوصی جلسه‌ها را نه.
          </p>
        </div>
      </Card>
    </div>
  )
}
