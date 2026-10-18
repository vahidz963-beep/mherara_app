import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../store/AppContext'
import { useAsync } from '../../store/hooks'
import { Avatar, Badge, Button, Card, EmptyState, Field, Input, Modal, SectionTitle, Spinner } from '../../components/ui'
import { faDate, faNum } from '../../lib/jalali'
import { IconPlus, IconTicket, IconUser, IconUsers } from '../../components/icons'
import { normalizePhone } from '../../lib/backend'
import type { Profile } from '../../lib/types'

export function Students() {
  const { backend, profile, toast } = useApp()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [addPhone, setAddPhone] = useState('')
  const [busy, setBusy] = useState(false)

  const { data, loading, reload } = useAsync(async () => {
    const [students, all] = await Promise.all([backend.listStudents(profile!.id), backend.listProfiles()])
    const invites = await backend.listInvites(profile!.id)
    const others = all.filter(
      (p) => p.role === 'student' && !students.some((s) => s.id === p.id),
    )
    return { students, others, invites }
  }, [backend, profile?.id], { students: [] as Profile[], others: [] as Profile[], invites: [] as any[] })

  const filtered = data.students.filter((s) =>
    (s.fullName + s.phone + (s.grade || '') + (s.school || '')).toLowerCase().includes(q.toLowerCase()),
  )

  const createInvite = async () => {
    try {
      const inv = await backend.createInvite({ role: 'student', createdBy: profile!.id, note: 'دعوت دانش‌آموز' })
      toast(`کد دعوت ساخته شد: ${inv.code}`, 'ok')
      reload()
    } catch (e: any) {
      toast(e?.message || 'ساخت کد ناموفق بود', 'err')
    }
  }

  const linkByPhone = async () => {
    setBusy(true)
    try {
      const phone = normalizePhone(addPhone)
      const target = data.others.find((o) => normalizePhone(o.phone) === phone) || (await backend.listProfiles()).find((p) => p.role === 'student' && normalizePhone(p.phone) === phone)
      if (!target) throw new Error('دانش‌آموزی با این شماره ثبت‌نام نکرده است. برایش کد دعوت بفرست.')
      await backend.linkStudent(profile!.id, target.id)
      await backend.updateProfile(target.id, { counselorId: profile!.id })
      toast(`${target.fullName} به فهرست شما اضافه شد`, 'ok')
      setAddOpen(false)
      setAddPhone('')
      reload()
    } catch (e: any) {
      toast(e?.message || 'افزودن ناموفق بود', 'err')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle
          title="دانش‌آموزان من"
          subtitle="پرونده‌ی هر دانش‌آموز شامل برنامه، چک‌این، تمرین و جلسه‌هاست"
          icon={<IconUsers className="w-4 h-4" />}
          action={
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={createInvite}>
                <IconTicket className="w-4 h-4" /> کد دعوت
              </Button>
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <IconPlus className="w-4 h-4" /> افزودن
              </Button>
            </div>
          }
        />

        <Input placeholder="جست‌وجو بر اساس نام، شماره یا مدرسه…" value={q} onChange={(e) => setQ(e.target.value)} className="mb-3" />

        {loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="دانش‌آموزی پیدا نشد"
            body="با کد دعوت یا شماره موبایل، دانش‌آموز را به پرونده‌ی خودت اضافه کن."
            icon="🧑‍🎓"
            action={<Button onClick={() => setAddOpen(true)}>افزودن دانش‌آموز</Button>}
          />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {filtered.map((s) => (
              <div key={s.id} className="border border-slate-200 rounded-2xl p-3.5 hover:border-brand-300 transition">
                <div className="flex items-start gap-3">
                  <Avatar name={s.fullName} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 text-sm truncate">{s.fullName}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {s.grade} {s.field ? `· ${s.field}` : ''} {s.school ? `· ${s.school}` : ''}
                    </p>
                    <p dir="ltr" className="text-[11px] text-slate-400 mt-0.5">
                      {faNum(s.phone)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <Badge tone="slate">ثبت‌نام {faDate(s.createdAt.slice(0, 10), { short: true })}</Badge>
                  <Button size="sm" variant="soft" onClick={() => nav(`/c/student/${s.id}`)}>
                    پرونده
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="افزودن دانش‌آموز"
        footer={
          <>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              انصراف
            </Button>
            <Button onClick={linkByPhone} disabled={busy || addPhone.length < 10}>
              اتصال
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="شماره موبایل دانش‌آموز" hint="دانش‌آموز باید قبلاً در رادمهر ثبت‌نام کرده باشد">
            <Input dir="ltr" inputMode="tel" placeholder="09xxxxxxxxx" value={addPhone} onChange={(e) => setAddPhone(e.target.value)} />
          </Field>
          {data.others.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-2">یا از بین ثبت‌نام‌شده‌های بدون مشاور انتخاب کن:</p>
              <div className="space-y-1.5 max-h-44 overflow-y-auto">
                {data.others.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setAddPhone(o.phone)}
                    className="w-full flex items-center gap-2 text-right bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 hover:border-brand-300"
                  >
                    <IconUser className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-700 flex-1">{o.fullName}</span>
                    <span dir="ltr" className="text-[10px] text-slate-400">
                      {faNum(o.phone)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
