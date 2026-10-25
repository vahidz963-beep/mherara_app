import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { Avatar, Badge, Button, cn } from './ui'
import {
  IconBook,
  IconCalendar,
  IconChat,
  IconClipboard,
  IconHeart,
  IconHome,
  IconLogout,
  IconTicket,
  IconTrend,
  IconUser,
  IconUsers,
} from './icons'
import { ROLE_LABEL } from '../lib/types'
import { faNum } from '../lib/jalali'

type NavItem = { to: string; label: string; icon: ReactNode; end?: boolean }

const NAV: Record<string, NavItem[]> = {
  admin: [
    { to: '/a', label: 'مدیریت کاربران', icon: <IconUsers />, end: true },
    { to: '/c', label: 'نمای مشاور', icon: <IconHome /> },
    { to: '/c/students', label: 'دانش‌آموزان', icon: <IconUsers /> },
    { to: '/c/plans', label: 'برنامه‌ها', icon: <IconBook /> },
    { to: '/c/assessments', label: 'آزمون‌ها', icon: <IconTrend /> },
    { to: '/c/invites', label: 'کدهای دعوت', icon: <IconTicket /> },
  ],
  counselor: [
    { to: '/c', label: 'داشبورد', icon: <IconHome />, end: true },
    { to: '/c/students', label: 'دانش‌آموزان', icon: <IconUsers /> },
    { to: '/c/plans', label: 'برنامه‌ها', icon: <IconBook /> },
    { to: '/c/sessions', label: 'جلسات', icon: <IconCalendar /> },
    { to: '/c/assessments', label: 'آزمون‌ها', icon: <IconTrend /> },
    { to: '/c/invites', label: 'دعوت‌ها', icon: <IconTicket /> },
  ],
  student: [
    { to: '/s', label: 'خانه', icon: <IconHome />, end: true },
    { to: '/s/plan', label: 'برنامه‌ی من', icon: <IconBook /> },
    { to: '/s/tasks', label: 'تمرین‌ها', icon: <IconClipboard /> },
    { to: '/s/checkin', label: 'چک‌این', icon: <IconHeart /> },
    { to: '/s/assessments', label: 'آزمون‌ها', icon: <IconTrend /> },
    { to: '/s/chat', label: 'گفت‌وگو', icon: <IconChat /> },
  ],
  parent: [
    { to: '/p', label: 'خانه', icon: <IconHome />, end: true },
    { to: '/p/plan', label: 'برنامه‌ی فرزندم', icon: <IconBook /> },
    { to: '/p/report', label: 'گزارش', icon: <IconClipboard /> },
    { to: '/p/chat', label: 'گفت‌وگو', icon: <IconChat /> },
  ],
}

export function Layout({ children }: { children: ReactNode }) {
  const { profile, signOut, mode } = useApp()
  const nav = useNavigate()
  const loc = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    setSidebarOpen(false)
  }, [loc.pathname])

  if (!profile) return null
  const items = NAV[profile.role] || []

  return (
    <div className="min-h-screen flex bg-[#f6f7fb]">
      {/* سایدبار */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 right-0 h-screen w-[248px] bg-white border-l border-slate-200 z-40 flex flex-col transition-transform',
          sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0',
        )}
      >
        <div className="px-4 py-4 border-b border-slate-100 flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 grid place-items-center text-white font-black text-lg shadow-md shadow-brand-200">
            هـ
          </div>
          <div>
            <p className="font-black text-slate-800 leading-5">رادمهر</p>
            <p className="text-[10px] text-slate-500">مشاوره‌ی تحصیلی و روانی</p>
          </div>
        </div>

        <nav className="p-3 flex-1 overflow-y-auto space-y-1">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50',
                )
              }
            >
              {it.icon}
              {it.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <Avatar name={profile.fullName} size={38} tone={profile.role === 'counselor' ? 'violet' : profile.role === 'parent' ? 'amber' : 'brand'} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-700 truncate">{profile.fullName}</p>
              <p className="text-[10px] text-slate-500">{ROLE_LABEL[profile.role]}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => nav('/profile')}
            >
              <IconUser className="w-4 h-4" /> پروفایل
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await signOut()
                nav('/login')
              }}
            >
              <IconLogout className="w-4 h-4" />
            </Button>
          </div>
          {mode === 'demo' && (
            <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5 leading-4">
              حالت دمو: داده‌ها فقط در همین مرورگر ذخیره می‌شوند. برای اتصال به Supabase فایل <code>.env</code> را پر کنید.
            </p>
          )}
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-slate-900/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* محتوا */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-white/85 backdrop-blur border-b border-slate-200 px-3 sm:px-5 py-3 flex items-center gap-3 no-print">
          <button className="lg:hidden w-9 h-9 rounded-lg border border-slate-200 grid place-items-center" onClick={() => setSidebarOpen(true)} aria-label="منو">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-slate-800 text-sm sm:text-base truncate">{pageTitle(loc.pathname, profile.role)}</h1>
          </div>
          {profile.role === 'student' && profile.grade && (
            <Badge tone="brand">
              {profile.grade} {profile.field ? `— ${profile.field}` : ''}
            </Badge>
          )}
          <Badge tone={mode === 'supabase' ? 'green' : 'amber'}>
            {mode === 'supabase' ? 'متصل به Supabase' : 'حالت دمو'}
          </Badge>
        </header>

        <main className="flex-1 p-3 sm:p-5 max-w-[1200px] w-full mx-auto">{children}</main>

        {/* نوار پایین موبایل */}
        <nav className="lg:hidden sticky bottom-0 bg-white border-t border-slate-200 flex items-center gap-0.5 overflow-x-auto px-1 pt-1 pb-[max(4px,env(safe-area-inset-bottom))] no-print">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className={({ isActive }) =>
                cn('flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] font-medium min-w-[58px] shrink-0', isActive ? 'text-brand-700 bg-brand-50' : 'text-slate-500')
              }
            >
              <span className="[&>svg]:w-5 [&>svg]:h-5">{it.icon}</span>
              {it.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}

function pageTitle(path: string, role: string) {
  if (path === '/profile') return 'پروفایل من'
  const map: Record<string, string> = {
    '/a': 'مدیریت کاربران',
    '/c': 'داشبورد مشاور',
    '/c/students': 'دانش‌آموزان',
    '/c/plans': 'همه‌ی برنامه‌ها',
    '/c/sessions': 'جلسه‌ها',
    '/c/invites': 'کدهای دعوت',
    '/c/assessments': 'آزمون‌ها و دفتر اشتباهات',
    '/s': 'خانه‌ی من',
    '/s/plan': 'برنامه‌ی من',
    '/s/tasks': 'تمرین‌ها و تکالیف',
    '/s/checkin': 'چک‌این روزانه',
    '/s/assessments': 'آزمون‌ها و کارنامه‌ها',
    '/s/chat': 'گفت‌وگو با مشاور',
    '/p': 'خانه‌ی والد',
    '/p/plan': 'برنامه‌ی فرزندم',
    '/p/report': 'گزارش هفتگی',
    '/p/chat': 'گفت‌وگو با مشاور',
  }
  if (map[path]) return map[path]
  if (path.startsWith('/c/student/')) return 'پرونده‌ی دانش‌آموز'
  if (path.startsWith('/c/plan/')) return 'ویرایش برنامه'
  if (path.startsWith('/s/plan/')) return 'جزئیات برنامه'
  return role === 'counselor' ? 'داشبورد مشاور' : role === 'parent' ? 'خانه‌ی والد' : 'خانه‌ی من'
}

export function QuickStat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className="text-sm font-bold text-slate-800">
        {typeof value === 'number' ? faNum(value) : value}
      </p>
      {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
    </div>
  )
}
