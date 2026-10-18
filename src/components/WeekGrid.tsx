import { useMemo, useState } from 'react'
import { addDaysIso, faDate, faNum, faTime, faWeekdayIndex, todayIso, FA_WEEKDAYS } from '../lib/jalali'
import { ITEM_KIND_COLOR, ITEM_KIND_LABEL, type PlanItem } from '../lib/types'
import { TestBadge } from './ItemProgress'
import { Badge, Button, cn } from './ui'
import { IconCheck, IconEdit, IconGrip, IconPlus, IconTarget } from './icons'

type Props = {
  startIso: string
  items: PlanItem[]
  editable?: boolean
  onToggleDone?: (item: PlanItem) => void
  onEdit?: (item: PlanItem) => void
  onAdd?: (dateIso: string) => void
  onOpenItem?: (item: PlanItem) => void
  /** جابه‌جایی آیتم به روز دیگر (کشیدن روی موبایل و دسکتاپ) */
  onMoveItem?: (item: PlanItem, newDateIso: string) => void
  /** ثبت تست‌ها و مرحله‌ی مطالعه روی این آیتم */
  onLogProgress?: (item: PlanItem) => void
  emptyHint?: string
}

export function WeekGrid({ startIso, items, editable, onToggleDone, onEdit, onAdd, onOpenItem, onMoveItem, onLogProgress, emptyHint }: Props) {
  const today = todayIso()
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDaysIso(startIso, i)), [startIso])
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overDate, setOverDate] = useState<string | null>(null)
  const [picker, setPicker] = useState<PlanItem | null>(null)

  const dragProps = (item: PlanItem) =>
    editable && onMoveItem
      ? {
          draggable: true,
          onDragStart: (e: React.DragEvent) => {
            setDraggingId(item.id)
            e.dataTransfer.setData('text/plain', item.id)
            e.dataTransfer.effectAllowed = 'move'
          },
          onDragEnd: () => {
            setDraggingId(null)
            setOverDate(null)
          },
        }
      : {}

  const dropProps = (date: string) =>
    editable && onMoveItem
      ? {
          onDragOver: (e: React.DragEvent) => {
            e.preventDefault()
            setOverDate(date)
          },
          onDragLeave: () => setOverDate((d) => (d === date ? null : d)),
          onDrop: (e: React.DragEvent) => {
            e.preventDefault()
            const id = e.dataTransfer.getData('text/plain') || draggingId
            const item = items.find((i) => i.id === id)
            setOverDate(null)
            setDraggingId(null)
            if (item && item.date !== date) onMoveItem(item, date)
          },
        }
      : {}

  return (
    <div className="space-y-3">
      {/* موبایل */}
      <div className="lg:hidden space-y-3">
        {days.map((d) => {
          const list = items.filter((i) => i.date === d)
          const total = list.reduce((s, i) => s + (i.minutes || 0), 0)
          return (
            <div
              key={d}
              {...dropProps(d)}
              className={cn(
                'rounded-2xl border bg-white p-3 transition',
                d === today ? 'border-brand-400 ring-2 ring-brand-100' : 'border-slate-200',
                overDate === d && 'border-brand-500 bg-brand-50/60',
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {FA_WEEKDAYS[faWeekdayIndex(d)]} <span className="text-[11px] text-slate-500 font-normal">· {faDate(d, { short: true })}</span>
                  </p>
                  {d === today && <span className="text-[10px] text-brand-600 font-bold">امروز</span>}
                </div>
                <div className="flex items-center gap-2">
                  {total > 0 && <Badge tone="brand">{faNum(Math.round(total / 60))} ساعت</Badge>}
                  {editable && onAdd && (
                    <Button size="sm" variant="ghost" onClick={() => onAdd(d)}>
                      <IconPlus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                {list.length === 0 && <p className="text-[11px] text-slate-400">{emptyHint || 'چیزی برای این روز ثبت نشده'}</p>}
                {list.map((it) => (
                  <ItemRow
                    key={it.id}
                    item={it}
                    editable={editable}
                    onToggleDone={onToggleDone}
                    onEdit={onEdit}
                    onOpenItem={onOpenItem}
                    onLongPress={() => onMoveItem && setPicker(it)}
                    dragging={draggingId === it.id}
                    dragProps={dragProps(it)}
                    onLogProgress={onLogProgress}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* دسکتاپ */}
      <div className="hidden lg:grid grid-cols-7 gap-2">
        {days.map((d) => {
          const list = items.filter((i) => i.date === d)
          const total = list.reduce((s, i) => s + (i.minutes || 0), 0)
          return (
            <div
              key={d}
              {...dropProps(d)}
              className={cn(
                'rounded-2xl border bg-white p-2 min-h-[240px] flex flex-col transition',
                d === today ? 'border-brand-400 ring-2 ring-brand-100' : 'border-slate-200',
                overDate === d && 'border-brand-500 bg-brand-50/60',
              )}
            >
              <div className="text-center pb-2 mb-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-700">{FA_WEEKDAYS[faWeekdayIndex(d)]}</p>
                <p className="text-[10px] text-slate-500">{faDate(d, { short: true })}</p>
                {total > 0 && <p className="text-[10px] text-brand-600 mt-0.5">{faNum(Math.round(total / 60))} ساعت</p>}
              </div>
              <div className="space-y-1.5 flex-1">
                {list.length === 0 && <p className="text-[10px] text-slate-300 text-center pt-4">—</p>}
                {list.map((it) => (
                  <ItemRow
                    key={it.id}
                    item={it}
                    editable={editable}
                    onToggleDone={onToggleDone}
                    onEdit={onEdit}
                    onOpenItem={onOpenItem}
                    dragging={draggingId === it.id}
                    dragProps={dragProps(it)}
                    onLogProgress={onLogProgress}
                    small
                  />
                ))}
              </div>
              {editable && onAdd && (
                <button
                  onClick={() => onAdd(d)}
                  className="mt-2 text-[11px] text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg py-1.5 transition"
                >
                  + افزودن
                </button>
              )}
            </div>
          )
        })}
      </div>

      {editable && onMoveItem && (
        <p className="text-[10px] text-slate-400 text-center no-print">
          برای جابه‌جایی: آیتم را روی روز دیگر بکش و رها کن (موبایل: دکمه‌ی ⋮ را بزن و روز مقصد را انتخاب کن).
        </p>
      )}

      {/* انتخاب روز مقصد در موبایل */}
      {picker && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setPicker(null)} />
          <div className="relative bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-4 animate-fade-up">
            <p className="font-bold text-slate-800 text-sm mb-1">جابه‌جایی «{picker.title}»</p>
            <p className="text-[11px] text-slate-500 mb-3">روز مقصد را انتخاب کن:</p>
            <div className="space-y-1.5">
              {days.map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    if (d !== picker.date) onMoveItem?.(picker, d)
                    setPicker(null)
                  }}
                  className={cn(
                    'w-full flex items-center justify-between text-xs rounded-xl border px-3 py-2.5',
                    d === picker.date ? 'border-brand-300 bg-brand-50 text-brand-800' : 'border-slate-200 hover:border-brand-300',
                  )}
                >
                  <span>
                    {FA_WEEKDAYS[faWeekdayIndex(d)]} — {faDate(d, { short: true })}
                  </span>
                  {d === picker.date && <Badge tone="brand">روز فعلی</Badge>}
                </button>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-3" onClick={() => setPicker(null)}>
              بستن
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function ItemRow({
  item,
  editable,
  onToggleDone,
  onEdit,
  onOpenItem,
  small,
  dragProps,
  dragging,
  onLongPress,
  onLogProgress,
}: {
  item: PlanItem
  editable?: boolean
  onToggleDone?: (item: PlanItem) => void
  onEdit?: (item: PlanItem) => void
  onOpenItem?: (item: PlanItem) => void
  small?: boolean
  dragProps?: Record<string, unknown>
  dragging?: boolean
  onLongPress?: () => void
  onLogProgress?: (item: PlanItem) => void
}) {
  return (
    <div
      {...dragProps}
      className={cn(
        'rounded-xl border p-2 text-right transition group',
        ITEM_KIND_COLOR[item.kind],
        item.done && 'opacity-60',
        dragging && 'opacity-40 ring-2 ring-brand-300',
        dragProps && 'cursor-grab active:cursor-grabbing',
      )}
    >
      <div className="flex items-start gap-1.5">
        {onToggleDone && (
          <button
            onClick={() => onToggleDone(item)}
            className={cn(
              'mt-0.5 w-4 h-4 rounded-md border grid place-items-center shrink-0 transition',
              item.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white/70 border-current',
            )}
            aria-label="انجام شد"
          >
            {item.done && <IconCheck className="w-3 h-3" />}
          </button>
        )}
        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onOpenItem?.(item)}>
          <p className={cn('font-medium leading-5', small ? 'text-[11px]' : 'text-xs', item.done && 'line-through')}>{item.title}</p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap text-[10px] opacity-80">
            {item.startTime && <span dir="ltr">{faTime(item.startTime)}</span>}
            <span>{faNum(item.minutes)}′</span>
            <span className="opacity-70">{ITEM_KIND_LABEL[item.kind]}</span>
          </div>
          {(item.testsTotal || (item.stages || []).length) ? (
            <div className="mt-1">
              <TestBadge item={item} />
            </div>
          ) : null}
          {item.studentNote && <p className="text-[10px] mt-1 bg-white/70 rounded-md px-1.5 py-1">🗒 {item.studentNote}</p>}
        </div>
        {onLogProgress && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onLogProgress(item)
            }}
            className="p-1 rounded-md hover:bg-white/70 transition"
            title="ثبت تست و مرحله‌ی مطالعه"
            aria-label="ثبت تست و مرحله‌ی مطالعه"
          >
            <IconTarget className="w-3.5 h-3.5" />
          </button>
        )}
        {dragProps && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onLongPress?.()
            }}
            className="opacity-60 p-1 rounded-md hover:bg-white/70 lg:cursor-grab"
            title="جابه‌جایی"
            aria-label="جابه‌جایی"
          >
            <IconGrip className="w-3.5 h-3.5" />
          </button>
        )}
        {editable && onEdit && (
          <button onClick={() => onEdit(item)} className="opacity-0 group-hover:opacity-100 transition p-1 rounded-md hover:bg-white/70" aria-label="ویرایش">
            <IconEdit className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
