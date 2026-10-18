/**
 * فهرست تفریح‌های سالم — دانش‌آموز هر روز هر کدام را انجام داد، تیک می‌زند
 * و رادمهر تعداد روزهای هر تفریح را در هفته می‌شمارد.
 */

export type LeisureItem = { id: string; label: string; emoji: string }

export const LEISURE_ITEMS: LeisureItem[] = [
  { id: 'walk', label: 'پیاده‌روی یا دوچرخه', emoji: '🚶' },
  { id: 'sport', label: 'ورزش (فوتبال، شنا، بدنسازی)', emoji: '⚽' },
  { id: 'book', label: 'کتاب غیردرسی', emoji: '📖' },
  { id: 'music', label: 'موسیقی یا ساززدن', emoji: '🎵' },
  { id: 'art', label: 'نقاشی یا خطاطی', emoji: '🎨' },
  { id: 'cook', label: 'آشپزی یا شیرینی‌پزی', emoji: '🍳' },
  { id: 'boardgame', label: 'بازی فکری با خانواده', emoji: '🎲' },
  { id: 'movie', label: 'فیلم یا مستند با خانواده', emoji: '🎬' },
  { id: 'writing', label: 'نوشتن (خاطرات یا داستان)', emoji: '✍️' },
  { id: 'nature', label: 'طبیعت‌گردی یا نگهداری گل', emoji: '🌿' },
]

export const leisureById = (id: string) => LEISURE_ITEMS.find((l) => l.id === id)
export const leisureLabel = (id: string) => leisureById(id)?.label || id

/** شمارش هر تفریح در یک بازه (مثلاً یک هفته) */
export function leisureCounts(checkins: { date: string; leisure?: string[] }[], fromIso: string, toIso: string) {
  const counts: Record<string, number> = {}
  checkins
    .filter((c) => c.date >= fromIso && c.date <= toIso)
    .forEach((c) => (c.leisure || []).forEach((id) => (counts[id] = (counts[id] || 0) + 1)))
  return counts
}
