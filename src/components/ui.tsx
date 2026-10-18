import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { useEffect } from 'react'

export const cn = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ')

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'soft' | 'outline' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

export function Button({ variant = 'primary', size = 'md', className, ...rest }: BtnProps) {
  const variants: Record<string, string> = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-600/20',
    soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-100',
    outline: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
    ghost: 'text-slate-600 hover:bg-slate-100',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  }
  const sizes: Record<string, string> = {
    sm: 'text-xs px-2.5 py-1.5 rounded-lg gap-1',
    md: 'text-sm px-3.5 py-2 rounded-xl gap-1.5',
    lg: 'text-base px-5 py-2.5 rounded-xl gap-2',
    icon: 'w-9 h-9 rounded-lg justify-center',
  }
  return (
    <button
      {...rest}
      className={cn(
        'inline-flex items-center justify-center font-medium transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-[.98]',
        variants[variant],
        sizes[size],
        className,
      )}
    />
  )
}

export function Card({
  children,
  className,
  padded = true,
}: {
  children: ReactNode
  className?: string
  padded?: boolean
}) {
  return (
    <div
      className={cn(
        'bg-white border border-slate-200/80 rounded-2xl shadow-sm shadow-slate-200/40',
        padded && 'p-4 sm:p-5',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function SectionTitle({
  title,
  subtitle,
  action,
  icon,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-start gap-2.5">
        {icon && <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 grid place-items-center">{icon}</div>}
        <div>
          <h2 className="font-bold text-slate-800">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5 leading-5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

export function Badge({
  children,
  tone = 'slate',
  className,
}: {
  children: ReactNode
  tone?: 'slate' | 'brand' | 'green' | 'amber' | 'rose' | 'violet' | 'teal'
  className?: string
}) {
  const tones: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    brand: 'bg-brand-50 text-brand-700 border-brand-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
  }
  return (
    <span className={cn('inline-flex items-center gap-1 text-[11px] font-medium border rounded-full px-2 py-0.5', tones[tone], className)}>
      {children}
    </span>
  )
}

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label?: string
  hint?: string
  error?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn('block', className)}>
      {label && <span className="block text-xs font-medium text-slate-600 mb-1.5">{label}</span>}
      {children}
      {hint && !error && <span className="block text-[11px] text-slate-400 mt-1">{hint}</span>}
      {error && <span className="block text-[11px] text-rose-600 mt-1">{error}</span>}
    </label>
  )
}

const fieldCls =
  'w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={cn(fieldCls, className)} />
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} className={cn(fieldCls, 'leading-6 min-h-[90px]', className)} />
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...rest} className={cn(fieldCls, 'appearance-none bg-[left_0.75rem_center] pl-9', className)}>
      {children}
    </select>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'relative bg-white w-full rounded-t-3xl sm:rounded-2xl shadow-xl max-h-[92vh] flex flex-col animate-fade-up',
          wide ? 'sm:max-w-3xl' : 'sm:max-w-lg',
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500" aria-label="بستن">
            ✕
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}

export function Segmented({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: any) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="inline-flex bg-slate-100 rounded-xl p-1 gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'text-xs px-3 py-1.5 rounded-lg font-medium transition',
            value === o.value ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Progress({ value, className, tone = 'brand' }: { value: number; className?: string; tone?: 'brand' | 'green' | 'amber' }) {
  const tones = { brand: 'bg-brand-500', green: 'bg-emerald-500', amber: 'bg-amber-500' }
  return (
    <div className={cn('h-2 bg-slate-100 rounded-full overflow-hidden', className)}>
      <div className={cn('h-full rounded-full transition-all', tones[tone])} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

export function EmptyState({ title, body, action, icon = '📋' }: { title: string; body?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="text-center py-10 px-4">
      <div className="text-3xl mb-2">{icon}</div>
      <p className="font-medium text-slate-700">{title}</p>
      {body && <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-6">{body}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-400 text-sm py-6 justify-center">
      <span className="w-4 h-4 border-2 border-slate-300 border-t-brand-500 rounded-full animate-spin" />
      {label || 'در حال بارگذاری…'}
    </div>
  )
}

export function Avatar({ name, size = 40, tone = 'brand' }: { name: string; size?: number; tone?: 'brand' | 'green' | 'violet' | 'amber' }) {
  const tones = {
    brand: 'bg-brand-100 text-brand-700',
    green: 'bg-emerald-100 text-emerald-700',
    violet: 'bg-violet-100 text-violet-700',
    amber: 'bg-amber-100 text-amber-800',
  }
  const initials = (name || '؟')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
  return (
    <span
      className={cn('inline-grid place-items-center rounded-full font-bold shrink-0', tones[tone])}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  )
}

export function StatCard({
  label,
  value,
  unit,
  tone = 'brand',
  icon,
  hint,
}: {
  label: string
  value: ReactNode
  unit?: string
  tone?: 'brand' | 'green' | 'amber' | 'rose' | 'violet'
  icon?: ReactNode
  hint?: string
}) {
  const tones: Record<string, string> = {
    brand: 'from-brand-50 to-white text-brand-700',
    green: 'from-emerald-50 to-white text-emerald-700',
    amber: 'from-amber-50 to-white text-amber-800',
    rose: 'from-rose-50 to-white text-rose-700',
    violet: 'from-violet-50 to-white text-violet-700',
  }
  return (
    <div className={cn('rounded-2xl border border-slate-200/70 bg-gradient-to-b p-3.5', tones[tone])}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium opacity-80">{label}</span>
        {icon}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="text-xl font-extrabold text-slate-800">{value}</span>
        {unit && <span className="text-[11px] text-slate-500">{unit}</span>}
      </div>
      {hint && <p className="text-[10px] text-slate-500 mt-1">{hint}</p>}
    </div>
  )
}

export function Rating({ value, onChange, readOnly, max = 5 }: { value: number; onChange?: (v: number) => void; readOnly?: boolean; max?: number }) {
  return (
    <div className="flex items-center gap-1.5" dir="ltr">
      {Array.from({ length: max }).map((_, i) => {
        const n = i + 1
        const active = n <= value
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(n)}
            className={cn(
              'w-7 h-7 rounded-full border text-[11px] font-bold transition',
              active ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-slate-300 text-slate-400',
              !readOnly && 'hover:scale-105',
            )}
          >
            {n}
          </button>
        )
      })}
    </div>
  )
}

export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: string; label: string; count?: number }[]
  value: string
  onChange: (v: any) => void
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            'text-xs whitespace-nowrap px-3 py-2 rounded-xl font-medium border transition',
            value === t.value
              ? 'bg-brand-600 text-white border-brand-600'
              : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300',
          )}
        >
          {t.label}
          {t.count !== undefined && <span className="mr-1 opacity-70">({t.count})</span>}
        </button>
      ))}
    </div>
  )
}

export function Toasts({ items }: { items: { id: number; text: string; tone: 'ok' | 'err' | 'info' }[] }) {
  const tones = { ok: 'bg-emerald-600', err: 'bg-rose-600', info: 'bg-slate-800' }
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-[85vw]">
      {items.map((t) => (
        <div key={t.id} className={cn('text-white text-xs px-3.5 py-2.5 rounded-xl shadow-lg animate-fade-up', tones[t.tone])}>
          {t.text}
        </div>
      ))}
    </div>
  )
}
