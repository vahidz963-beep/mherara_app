import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { Avatar, Badge, Button, Card, cn } from './ui'
import { addDaysIso, dayDiff, faDate, faNum, faRelative, todayIso } from '../lib/jalali'
import type { Checkin, Plan, PlanItem, Profile, Reminder, SessionRow, Task } from '../lib/types'
import { IconAlert, IconBell, IconBook, IconCalendar, IconClipboard, IconHeart, IconSpark, IconTrend } from './icons'

/**
 * یادآورهای درون‌برنامه‌ای: به‌جای هزینه‌ی پیامک، تا وقتی کاربر اپ را باز می‌کند
 * کارهای عقب‌افتاده و نکته‌های مهم را در بالای صفحه‌ها نشان می‌دهیم.
 * (بعداً می‌توان همین منطق را به Edge Function + پیامک وصل کرد.)
 */

export function useReminders(studentId?: string, openTasks?: Task[], checkins?: Checkin[], sessions?: SessionRow[], plans?: Plan[], items?: PlanItem[]) {
  const { backend, profile } = useApp()
  const [out, setOut] = useState<Reminder[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!studentId) {
        // مشاور: یادآورهای مربوط به همه‌ی دانش‌آموزان
        if (profile?.role === 'counselor') {
          const students = await backend.listStudents(profile.id)
          const list: Reminder[] = []
          for (const s of students) {
            const [cs, ss] = await Promise.all([backend.listCheckins(s.id, 14), backend.listSessions(s.id)])
            const last = cs[0]
            const gap = last ? dayDiff(todayIso(), last.date) : 99
            if (!last) list.push({ id: `c-${s.id}`, tone: 'info', title: `${s.fullName} هنوز چک‌این نداده`, body: 'یک پیام کوتاه بفرست یا در برنامه‌ی این هفته هدف کوچک بگذار.', link: `/c/student/${s.id}` })
            else if (gap >= 3) list.push({ id: `c-${s.id}`, tone: 'warn', title: `${s.fullName}: ${faNum(gap)} روز بدون چک‌این`, body: 'پیگیری کوتاه معمولاً بهتر از یادآوری سخت‌گیرانه جواب می‌دهد.', link: `/c/student/${s.id}` })
            const low = cs.slice(0, 3).filter((x) => x.mood <= 2).length
            if (low >= 2) list.push({ id: `m-${s.id}`, tone: 'danger', title: `حال ${s.fullName} چند روز پایین ثبت شده`, body: 'پیشنهاد: یک تماس کوتاه، سبک‌کردن بار یک روز و تمرین آرام‌سازی.', link: `/c/student/${s.id}` })
            const next = ss.filter((x) => x.status === 'scheduled' && x.date >= todayIso()).sort((a, b) => a.date.localeCompare(b.date))[0]
            if (next && dayDiff(next.date, todayIso()) <= 1)
              list.push({ id: `s-${s.id}`, tone: 'info', title: `جلسه‌ی ${s.fullName} ${faRelative(next.date)}`, body: next.topic, link: `/c/sessions` })
          }
          const pending = [] as Reminder[]
          for (const s of students) {
            const ps = await backend.listPlans(s.id)
            for (const p of ps.filter((x) => x.status === 'pending'))
              pending.push({ id: `p-${p.id}`, tone: 'info', title: `برنامه‌ی «${p.title}» منتظر تأیید ${s.fullName} است`, link: `/c/plan/${p.id}` })
          }
          if (alive) setOut([...pending, ...list].slice(0, 6))
          if (alive) setLoaded(true)
          return
        }
        if (alive) setLoaded(true)
        return
      }

      const list: Reminder[] = []
      const t = todayIso()

      // ۱) جلسه‌ی نزدیک
      const next = (sessions || []).filter((x) => x.status === 'scheduled' && x.date >= t).sort((a, b) => a.date.localeCompare(b.date))[0]
      if (next) {
        const diff = dayDiff(next.date, t)
        if (diff <= 2)
          list.push({
            id: 'next-session',
            tone: 'info',
            title: diff === 0 ? 'امروز جلسه داری' : `${faRelative(next.date)} جلسه داری`,
            body: `${next.topic}${next.time ? ` — ساعت ${faNum(next.time)}` : ''}`,
            link: '/s/chat',
          })
      }

      // ۲) چک‌این امروز
      const hasToday = (checkins || []).some((c) => c.date === t)
      if (!hasToday) list.push({ id: 'checkin', tone: 'info', title: 'چک‌این امروز ثبت نشده', body: 'یک دقیقه وقت بگذار؛ مشاورت این را می‌بیند.', link: '/s/checkin' })

      // ۳) تمرین‌های سرررسید
      for (const task of (openTasks || []).filter((x) => x.dueDate)) {
        const diff = dayDiff(task.dueDate!, t)
        if (diff < 0)
          list.push({ id: `t-${task.id}`, tone: 'warn', title: `مهلت «${task.title}» گذشته`, body: `${faNum(-diff)} روز گذشته — یا انجامش بده یا یادداشت بگذار.`, link: '/s/tasks' })
        else if (diff === 0) list.push({ id: `t-${task.id}`, tone: 'info', title: `مهلت «${task.title}» امروز است`, link: '/s/tasks' })
        else if (diff === 1) list.push({ id: `t-${task.id}`, tone: 'info', title: `مهلت «${task.title}» فردا است`, link: '/s/tasks' })
      }

      // ۴) برنامه‌ی در انتظار تأیید
      for (const p of (plans || []).filter((x) => x.status === 'pending'))
        list.push({ id: `p-${p.id}`, tone: 'info', title: 'برنامه‌ای منتظر تأیید توست', body: p.title, link: `/s/plan/${p.id}` })

      // ۵) عقب‌افتادگی برنامه (دیروز کارهای انجام‌نشده)
      const yesterday = addDaysIso(t, -1)
      const missed = (items || []).filter((i) => i.date === yesterday && !i.done)
      if (missed.length >= 2)
        list.push({
          id: 'missed',
          tone: 'warn',
          title: `${faNum(missed.length)} کار از دیروز جا مانده`,
          body: missed.map((m) => m.title).slice(0, 2).join('، ') + (missed.length > 2 ? ' و …' : ''),
          link: '/s/plan',
        })

      // ۶) هشدار حال
      const recent = (checkins || []).slice(0, 3)
      if (recent.length >= 2 && recent.filter((c) => c.mood <= 2).length >= 2)
        list.push({
          id: 'mood',
          tone: 'danger',
          title: 'چند روز است حالت پایین ثبت شده',
          body: 'این عادی است ولی مهم. یک تمرین کوتاه تنفس امتحان کن و با مشاورت حرف بزن.',
          link: '/s/chat',
        })

      // ۷) کم‌خوابی
      const sleeps = recent.map((c) => c.sleepHours).filter((x) => x > 0)
      if (sleeps.length >= 3 && sleeps.reduce((a, b) => a + b, 0) / sleeps.length < 6.5)
        list.push({ id: 'sleep', tone: 'warn', title: 'میانگین خواب این چند روز کم است', body: 'کم‌خوابی مستقیم روی تمرکز و حافظه اثر می‌گذارد.', link: '/s/checkin' })

      if (alive) setOut(list.slice(0, 4))
      if (alive) setLoaded(true)
    })().catch(() => setLoaded(true))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, profile?.id, openTasks?.length, checkins?.length, sessions?.length, plans?.length, items?.length])

  return { reminders: out, loaded }
}

const toneStyles: Record<Reminder['tone'], { wrap: string; icon: string }> = {
  info: { wrap: 'bg-brand-50 border-brand-100 text-brand-900', icon: 'bg-white text-brand-600' },
  warn: { wrap: 'bg-amber-50 border-amber-200 text-amber-900', icon: 'bg-white text-amber-600' },
  danger: { wrap: 'bg-rose-50 border-rose-200 text-rose-900', icon: 'bg-white text-rose-600' },
}

export function ReminderStrip({ reminders }: { reminders: Reminder[] }) {
  const nav = useNavigate()
  if (!reminders.length) return null
  return (
    <Card className="border-dashed">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 grid place-items-center">
          <IconBell className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">یادآورهای امروز</p>
          <p className="text-[10px] text-slate-500">بدون پیامک — وقتی اپ را باز می‌کنی، این‌ها را می‌بینی</p>
        </div>
        <Badge tone="slate" className="mr-auto">
          {faNum(reminders.length)} مورد
        </Badge>
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {reminders.map((r) => {
          const t = toneStyles[r.tone]
          return (
            <button
              key={r.id}
              onClick={() => r.link && nav(r.link)}
              className={cn('text-right border rounded-2xl p-2.5 flex items-start gap-2 transition hover:shadow-sm', t.wrap)}
            >
              <span className={cn('w-7 h-7 rounded-lg grid place-items-center shrink-0', t.icon)}>
                {r.tone === 'danger' ? <IconAlert className="w-4 h-4" /> : r.tone === 'warn' ? <IconTrend className="w-4 h-4" /> : <IconSpark className="w-4 h-4" />}
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-bold leading-5">{r.title}</span>
                {r.body && <span className="block text-[11px] opacity-80 mt-0.5 leading-5">{r.body}</span>}
              </span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}

/** کارت آماری کوچک برای نوار بالای صفحه مشاور */
export function QuickStudentStrip({ students, onOpen }: { students: (Profile & { pct?: number; lastMood?: number; gap?: number })[]; onOpen: (id: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {students.map((s) => (
        <button
          key={s.id}
          onClick={() => onOpen(s.id)}
          className="shrink-0 w-[172px] bg-white border border-slate-200 rounded-2xl p-2.5 text-right hover:border-brand-300 transition"
        >
          <div className="flex items-center gap-2">
            <Avatar name={s.fullName} size={30} />
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-800 truncate">{s.fullName}</p>
              <p className="text-[10px] text-slate-500">{s.grade || ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[10px]">
            <Badge tone={(s.pct ?? 0) >= 60 ? 'green' : (s.pct ?? 0) >= 35 ? 'amber' : 'rose'}>{faNum(s.pct ?? 0)}٪ انجام</Badge>
            {s.gap !== undefined && s.gap >= 3 && <Badge tone="amber">{faNum(s.gap)} روز بی‌چک‌این</Badge>}
          </div>
        </button>
      ))}
    </div>
  )
}

export const reminderIcons = { IconBook, IconCalendar, IconClipboard, IconHeart }
