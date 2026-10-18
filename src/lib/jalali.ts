/** تبدیل و قالب‌بندی تاریخ شمسی (بدون وابستگی خارجی) */

const breaks = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394,
  2456, 3178,
]

const div = (a: number, b: number) => ~~(a / b)
const mod = (a: number, b: number) => a - ~~(a / b) * b

function jalCal(jy: number) {
  const bl = breaks.length
  const gy = jy + 621
  let leapJ = -14
  let jp = breaks[0]
  let jm = 0
  let jump = 0
  let leap = 0

  if (jy < jp || jy >= breaks[bl - 1]) throw new Error('Invalid Jalaali year ' + jy)

  for (let i = 1; i < bl; i += 1) {
    jm = breaks[i]
    jump = jm - jp
    if (jy < jm) break
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4)
    jp = jm
  }
  let n = jy - jp

  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4)
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150
  const march = 20 + leapJ - leapG

  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33
  leap = mod(mod(n + 1, 33) - 1, 4)
  if (leap === -1) leap = 4

  return { leap, gy, march }
}

function g2d(gy: number, gm: number, gd: number) {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752
  return d
}

function d2g(jdn: number) {
  let j = 4 * jdn + 139361631
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908
  const i = div(mod(j, 1461), 4) * 5 + 308
  const gd = div(mod(i, 153), 5) + 1
  const gm = mod(div(i, 153), 12) + 1
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6)
  return { gy, gm, gd }
}

function j2d(jy: number, jm: number, jd: number) {
  const r = jalCal(jy)
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1
}

export function toJalali(gy: number, gm: number, gd: number) {
  const jdn = g2d(gy, gm, gd)
  const gy2 = d2g(jdn).gy
  let jy = gy2 - 621
  const r = jalCal(jy)
  const jdn1f = g2d(gy2, 3, r.march)
  let k = jdn - jdn1f
  if (k >= 0) {
    if (k <= 185) return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 }
    k -= 186
  } else {
    jy -= 1
    k += 179
    if (r.leap === 1) k += 1
  }
  return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 }
}

export function toGregorian(jy: number, jm: number, jd: number) {
  return d2g(j2d(jy, jm, jd))
}

/** ISO تاریخ (yyyy-mm-dd میلادی) → شمسی */
export function isoToJalali(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return toJalali(y, m, d)
}

export function dayDiff(aIso: string, bIso: string) {
  const a = new Date(aIso + 'T00:00:00').getTime()
  const b = new Date(bIso + 'T00:00:00').getTime()
  return Math.round((a - b) / 86400000)
}

export function addDaysIso(iso: string, days: number) {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return toIso(d)
}

export function toIso(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export const todayIso = () => toIso(new Date())

export const FA_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
]

export const FA_WEEKDAYS = ['شنبه', 'یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه']

export const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

export function faNum(input: string | number) {
  return String(input ?? '').replace(/\d/g, (d) => FA_DIGITS[Number(d)])
}

/** شماره‌ی روز هفته‌ی ایرانی: شنبه = ۰ */
export function faWeekdayIndex(iso: string) {
  const jsDay = new Date(iso + 'T00:00:00').getDay() // 0=Sunday
  return (jsDay + 1) % 7
}

/** ۲۴ مهر ۱۴۰۵ */
export function faDate(iso: string, opts: { withWeekday?: boolean; short?: boolean } = {}) {
  if (!iso) return '—'
  const { jy, jm, jd } = isoToJalali(iso)
  const base = opts.short ? `${faNum(jd)} ${FA_MONTHS[jm - 1]}` : `${faNum(jd)} ${FA_MONTHS[jm - 1]} ${faNum(jy)}`
  return opts.withWeekday ? `${FA_WEEKDAYS[faWeekdayIndex(iso)]}، ${base}` : base
}

/** ۱۴۰۵/۰۷/۲۴ */
export function faDateNumeric(iso: string) {
  if (!iso) return '—'
  const { jy, jm, jd } = isoToJalali(iso)
  const p = (n: number) => faNum(String(n).padStart(2, '0'))
  return `${faNum(jy)}/${p(jm)}/${p(jd)}`
}

/** «همین امروز»، «۳ روز مانده»، «۲ روز گذشته» */
export function faRelative(iso: string) {
  const diff = dayDiff(iso, todayIso())
  if (diff === 0) return 'امروز'
  if (diff === 1) return 'فردا'
  if (diff === -1) return 'دیروز'
  if (diff > 1) return `${faNum(diff)} روز آینده`
  return `${faNum(-diff)} روز گذشته`
}

/** «۱۴:۳۰» */
export function faTime(t?: string) {
  if (!t) return ''
  const [h, m] = t.split(':')
  return faNum(`${h}:${m}`)
}

/** ابتدای هفته‌ی ایرانی (شنبه) */
export function startOfFaWeek(iso: string) {
  return addDaysIso(iso, -faWeekdayIndex(iso))
}

export function faWeekRangeLabel(startIso: string) {
  const end = addDaysIso(startIso, 6)
  const s = isoToJalali(startIso)
  const e = isoToJalali(end)
  if (s.jm === e.jm) return `${faNum(s.jd)} تا ${faNum(e.jd)} ${FA_MONTHS[s.jm - 1]}`
  return `${faNum(s.jd)} ${FA_MONTHS[s.jm - 1]} تا ${faNum(e.jd)} ${FA_MONTHS[e.jm - 1]}`
}
