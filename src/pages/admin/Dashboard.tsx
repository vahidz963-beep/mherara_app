import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../../store/AppContext'
import { useAsync } from '../../store/hooks'
import { Avatar, Badge, Card, EmptyState, Input, SectionTitle, Select, Spinner, cn } from '../../components/ui'
import { faNum } from '../../lib/jalali'
import { ROLE_LABEL, type Profile, type Role } from '../../lib/types'

const ROLES: Role[] = ['admin', 'counselor', 'student', 'parent']

/**
 * پنل مدیر اصلی (رادمهر)
 * - فهرست همه‌ی کاربران، شمارش به تفکیک نقش
 * - تغییر نقش و فعال/غیرفعال‌سازی حساب
 * - دسترسی به نمای مشاور برای کار روزمره
 * فقط برای نقش admin قابل دیدن است (در App.tsx محافظت شده).
 */
export function AdminDashboard() {
  const { backend, profile, toast, mode } = useApp()
  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all')
  const [busyId, setBusyId] = useState<string | null>(null)

  const { data, loading, reload } = useAsync(
    async () => backend.listProfiles(),
    [backend],
    [] as Profile[],
  )

  const counts = useMemo(() => {
    const c: Record<Role, { total: number; active: number }> = {
      admin: { total: 0, active: 0 },
      counselor: { total: 0, active: 0 },
      student: { total: 0, active: 0 },
      parent: { total: 0, active: 0 },
    }
    for (const p of data) {
      c[p.role].total++
      if (p.isActive) c[p.role].active++
    }
    return c
  }, [data])

  const filtered = data.filter((p) => {
    if (roleFilter !== 'all' && p.role !== roleFilter) return false
    const hay = `${p.fullName} ${p.phone || ''} ${p.grade || ''} ${p.school || ''}`.toLowerCase()
    return hay.includes(q.trim().toLowerCase())
  })

  const changeRole = async (p: Profile, role: Role) => {
    if (p.id === profile?.id && role !== 'admin') {
      toast('نمی‌توانی نقش خودت را از مدیر تغییر دهی', 'err')
      return
    }
    setBusyId(p.id)
    try {
      await backend.updateProfile(p.id, { role })
      toast(`نقش ${p.fullName} به «${ROLE_LABEL[role]}» تغییر کرد`, 'ok')
      reload()
    } catch (e: any) {
      toast(e?.message || 'تغییر نقش ناموفق بود', 'err')
    } finally {
      setBusyId(null)
    }
  }

  const toggleActive = async (p: Profile) => {
    if (p.id === profile?.id) {
      toast('نمی‌توانی حساب خودت را غیرفعال کنی', 'err')
      return
    }
    setBusyId(p.id)
    try {
      await backend.updateProfile(p.id, { isActive: !p.isActive })
      toast(p.isActive ? 'حساب غیرفعال شد' : 'حساب فعال شد', 'ok')
      reload()
    } catch (e: any) {
      toast(e?.message || 'به‌روزرسانی ناموفق بود', 'err')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle
          title="مدیریت کاربران رادمهر"
          subtitle={`حالت اتصال: ${mode === 'supabase' ? 'Supabase (داده‌ی واقعی)' : 'دمو (داده‌ی نمونه، داخل همین مرورگر)'}`}
        />
        <div className="flex gap-2">
          <Link to="/c/invites" className="text-xs font-bold text-white bg-brand-600 rounded-xl px-3 py-2">
            ساخت کد دعوت مشاور
          </Link>
          <Link to="/c" className="text-xs font-bold text-brand-700 bg-brand-50 border border-brand-100 rounded-xl px-3 py-2">
            نمای مشاور
          </Link>
          <Link to="/setup" className="text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2">
            بررسی راه‌اندازی
          </Link>
        </div>
      </div>

      {/* شمارش نقش‌ها */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {ROLES.map((r) => (
          <Card key={r} className="p-4">
            <p className="text-xs text-slate-500">{ROLE_LABEL[r]}</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{faNum(counts[r].total)}</p>
            <p className="text-[11px] text-slate-500 mt-1">فعال: {faNum(counts[r].active)}</p>
          </Card>
        ))}
      </div>

      {/* فیلترها */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input placeholder="جستجوی نام، شماره یا مدرسه…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as 'all' | Role)} className="sm:w-56">
            <option value="all">همه‌ی نقش‌ها</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* فهرست */}
      {loading && data.length === 0 ? (
        <Spinner label="در حال بارگذاری کاربران…" />
      ) : filtered.length === 0 ? (
        <EmptyState title="کاربری پیدا نشد" body="فیلترها را تغییر بده یا جستجو را پاک کن." />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="text-right font-bold px-4 py-3">کاربر</th>
                  <th className="text-right font-bold px-4 py-3">شماره / ورود</th>
                  <th className="text-right font-bold px-4 py-3">نقش</th>
                  <th className="text-right font-bold px-4 py-3">وضعیت</th>
                  <th className="text-right font-bold px-4 py-3">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const isMe = p.id === profile?.id
                  return (
                    <tr key={p.id} className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={p.fullName} size={32} tone={p.role === 'admin' ? 'violet' : 'brand'} />
                          <div>
                            <p className="font-bold text-slate-800">
                              {p.fullName} {isMe && <span className="text-[10px] text-brand-700">(شما)</span>}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {[p.grade, p.school].filter(Boolean).join(' · ') || '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600" dir="ltr">
                        {p.phone ? faNum(p.phone) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={p.role}
                          disabled={busyId === p.id || (isMe && p.role === 'admin')}
                          onChange={(e) => changeRole(p, e.target.value as Role)}
                          className="text-xs py-1.5"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABEL[r]}
                            </option>
                          ))}
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={p.isActive ? 'green' : 'rose'}>{p.isActive ? 'فعال' : 'غیرفعال'}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          disabled={busyId === p.id || isMe}
                          onClick={() => toggleActive(p)}
                          className={cn(
                            'text-xs font-bold rounded-lg px-3 py-1.5 border transition disabled:opacity-40',
                            p.isActive
                              ? 'text-rose-700 border-rose-200 bg-rose-50 hover:bg-rose-100'
                              : 'text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100',
                          )}
                        >
                          {p.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <p className="text-[11px] text-slate-500 leading-6">
        نکته: ساخت حساب مدیر جدید فقط از طریق SQL (تابع bootstrap_admin) انجام می‌شود تا کسی از طریق اپ مدیر نشود. راهنما: SETUP.md بخش مدیر اصلی.
      </p>
    </div>
  )
}
