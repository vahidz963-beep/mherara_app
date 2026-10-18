export type Role = 'counselor' | 'student' | 'parent' | 'admin'

export type Profile = {
  id: string
  phone: string
  fullName: string
  role: Role
  /** دانش‌آموز: پایه/رشته/مدرسه */
  grade?: string
  field?: string
  school?: string
  /** دانش‌آموز: مشاور اصلی */
  counselorId?: string | null
  /** والد: فرزندِ متصل */
  childId?: string | null
  relation?: string
  bio?: string
  isActive: boolean
  createdAt: string
}

export type PlanStatus = 'draft' | 'pending' | 'active' | 'needs_revision' | 'archived'
export type PlanVisibility = 'private' | 'student_view' | 'student_editable'

/** آیا این برنامه (و آیتم‌هایش) برای والدین قابل مشاهده است؟ */
export type ParentShare = 'shared' | 'hidden'

export type Plan = {
  id: string
  studentId: string
  counselorId: string
  title: string
  kind: 'week' | 'month' | 'day' | 'term'
  startDate: string
  endDate: string
  status: PlanStatus
  visibility: PlanVisibility
  parentShare: ParentShare
  note?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  version: number
}

export type ItemKind = 'study' | 'test' | 'review' | 'rest' | 'sport' | 'skill' | 'other'
export type PlanItem = {
  id: string
  planId: string
  date: string
  startTime?: string
  subject: string
  title: string
  kind: ItemKind
  minutes: number
  priority: 'high' | 'mid' | 'low'
  note?: string
  done?: boolean
  doneAt?: string
  studentNote?: string
  sort: number
  // ── ثبت پیشرفت دانش‌آموز روی همین آیتم ──
  /** تعداد کل سؤال‌های زده‌شده در این بلوک */
  testsTotal?: number | null
  /** تعداد سؤال‌های درست */
  testsCorrect?: number | null
  /** مراحل مطالعه‌ی اجراشده برای این مبحث (۱ تا ۷) */
  stages?: number[]
}

/** هفت مرحله‌ی استاندارد مطالعه‌ی یک مبحث (برای ثبت در برنامه) */
export const STUDY_STAGES: { n: number; label: string; hint: string }[] = [
  { n: 1, label: 'پیش‌خوانی', hint: 'یک دور سریع از کل مبحث، بدون توقف روی جزئیات' },
  { n: 2, label: 'مطالعه‌ی عمیق', hint: 'خواندن دقیق + فهم مثال‌ها' },
  { n: 3, label: 'خلاصه‌نویسی', hint: 'نوشتن نکات کلیدی با زبان خودت' },
  { n: 4, label: 'تست‌زنی', hint: 'حل سؤال از همان مبحث' },
  { n: 5, label: 'تحلیل غلط‌ها', hint: 'بررسی علت خطا در دفتر اشتباهات' },
  { n: 6, label: 'مرور فاصله‌دار', hint: 'مرور در روزهای بعد (۱-۳-۷)' },
  { n: 7, label: 'جمع‌بندی و آزمون', hint: 'آزمون یا جمع‌بندی نهایی مبحث' },
]

export const stageLabel = (n: number) => STUDY_STAGES.find((s) => s.n === n)?.label || String(n)

/** درصد صحت تست‌های یک آیتم */
export const itemAccuracy = (item: Pick<PlanItem, 'testsCorrect' | 'testsTotal'>) => {
  if (!item.testsTotal) return null
  return Math.round(((item.testsCorrect || 0) / item.testsTotal) * 1000) / 10
}

export type TargetType = 'plan' | 'item' | 'task' | 'checkin' | 'session' | 'student'
export type FeedbackKind = 'comment' | 'approve' | 'request_change' | 'edit' | 'reply' | 'checkin_reply'

export type Feedback = {
  id: string
  targetType: TargetType
  targetId: string
  studentId: string
  authorId: string
  authorName?: string
  authorRole?: Role
  kind: FeedbackKind
  body: string
  meta?: Record<string, unknown>
  createdAt: string
}

export type TaskStatus = 'todo' | 'doing' | 'done'
export type Task = {
  id: string
  studentId: string
  counselorId: string
  title: string
  description?: string
  dueDate?: string
  status: TaskStatus
  studentNote?: string
  counselorFeedback?: string
  createdAt: string
  updatedAt: string
}

export type Checkin = {
  id: string
  studentId: string
  date: string
  mood: number
  energy: number
  focus: number
  /** دقایق مطالعه */
  studyMinutes: number
  /** ساعت خواب */
  sleepHours: number
  /** ساعت استفاده از فضای مجازی (شبکه‌های اجتماعی، بازی، پیام‌رسان) */
  screenHours?: number
  /** دقایق ورزش و تحرک */
  exerciseMinutes?: number
  /** تفریح‌های سالم انجام‌شده‌ی همان روز (شناسه‌ها از LEISURE_ITEMS) */
  leisure?: string[]
  note?: string
  counselorReply?: string
  createdAt: string
}

export type SessionRow = {
  id: string
  studentId: string
  counselorId: string
  date: string
  time?: string
  mode: 'online' | 'in_person' | 'phone'
  topic: string
  summary?: string
  nextSteps?: string
  status: 'scheduled' | 'done' | 'canceled'
  createdAt: string
}

export type Invite = {
  code: string
  role: Role
  createdBy: string
  studentId?: string | null
  note?: string
  createdAt: string
  expiresAt?: string | null
  usedBy?: string | null
  usedAt?: string | null
}

export type Notification = {
  id: string
  userId: string
  title: string
  body?: string
  link?: string
  read: boolean
  createdAt: string
}

export const ITEM_KIND_LABEL: Record<ItemKind, string> = {
  study: 'مطالعه',
  test: 'آزمون',
  review: 'مرور',
  rest: 'استراحت',
  sport: 'ورزش',
  skill: 'مهارت/هنر',
  other: 'سایر',
}

export const ITEM_KIND_COLOR: Record<ItemKind, string> = {
  study: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  test: 'bg-rose-100 text-rose-700 border-rose-200',
  review: 'bg-amber-100 text-amber-800 border-amber-200',
  rest: 'bg-slate-100 text-slate-700 border-slate-200',
  sport: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  skill: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
  other: 'bg-teal-100 text-teal-700 border-teal-200',
}

export const PLAN_STATUS_LABEL: Record<PlanStatus, string> = {
  draft: 'پیش‌نویس',
  pending: 'در انتظار تأیید دانش‌آموز',
  active: 'فعال',
  needs_revision: 'نیاز به اصلاح',
  archived: 'بایگانی',
}

export const PLAN_STATUS_COLOR: Record<PlanStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  needs_revision: 'bg-rose-100 text-rose-700 border-rose-200',
  archived: 'bg-slate-100 text-slate-500 border-slate-200',
}

export const PARENT_SHARE_LABEL: Record<ParentShare, string> = {
  shared: 'برای والدین قابل مشاهده',
  hidden: 'پنهان از والدین',
}

export const VISIBILITY_LABEL: Record<PlanVisibility, string> = {
  private: 'فقط مشاور',
  student_view: 'دانش‌آموز: فقط مشاهده',
  student_editable: 'دانش‌آموز: قابل ویرایش',
}

export const ROLE_LABEL: Record<Role, string> = {
  counselor: 'مشاور',
  student: 'دانش‌آموز',
  parent: 'والد',
  admin: 'مدیر مرکز',
}

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'شروع نشده',
  doing: 'در حال انجام',
  done: 'انجام شد',
}

// ── آزمون‌ها و دفتر اشتباهات ──────────────────────────────────────────────────
export type ExamScope = 'mock' | 'school' | 'quiz' | 'final'

export type Exam = {
  id: string
  studentId: string
  counselorId?: string | null
  title: string
  date: string
  scope: ExamScope
  note?: string
  createdAt: string
}

export type ExamSubject = {
  id: string
  examId: string
  subject: string
  total: number
  correct: number
  wrong: number
  blank: number
  /** درصد؛ اگر خالی باشد از correct/total حساب می‌شود */
  percent?: number | null
  targetPercent?: number | null
  note?: string
}

export type MistakeReason = 'careless' | 'knowledge' | 'time' | 'misread' | 'other'

export type ExamMistake = {
  id: string
  examId: string
  studentId: string
  subject: string
  reason: MistakeReason
  note?: string
  resolved: boolean
  createdAt: string
  /** برای نمایش در فهرست */
  examTitle?: string
  examDate?: string
}

export const EXAM_SCOPE_LABEL: Record<ExamScope, string> = {
  mock: 'آزمون آزمایشی',
  school: 'امتحان مدرسه',
  quiz: 'کوییز کلاسی',
  final: 'پایان‌ترم / نهایی',
}

export const MISTAKE_REASON_LABEL: Record<MistakeReason, string> = {
  careless: 'بی‌دقتی',
  knowledge: 'نبودِ دانش',
  time: 'کمبود زمان',
  misread: 'بدخوانی صورت سؤال',
  other: 'سایر',
}

export const MISTAKE_REASON_COLOR: Record<MistakeReason, string> = {
  careless: 'bg-amber-50 text-amber-800 border-amber-200',
  knowledge: 'bg-rose-50 text-rose-700 border-rose-200',
  time: 'bg-violet-50 text-violet-700 border-violet-200',
  misread: 'bg-teal-50 text-teal-700 border-teal-200',
  other: 'bg-slate-50 text-slate-600 border-slate-200',
}

export const subjectPercent = (s: Pick<ExamSubject, 'percent' | 'correct' | 'total'>) => {
  if (s.percent !== undefined && s.percent !== null && !Number.isNaN(s.percent)) return s.percent
  if (!s.total) return 0
  return Math.round((s.correct / s.total) * 1000) / 10
}

// ── قالب‌ها ──────────────────────────────────────────────────────────────────
export type PlanTemplateItem = {
  dayOffset: number
  title: string
  subject: string
  kind: ItemKind
  minutes: number
  startTime?: string
  priority: PlanItem['priority']
  note?: string
}

export type PlanTemplate = {
  id: string
  counselorId: string
  title: string
  kind: Plan['kind']
  note?: string
  items: PlanTemplateItem[]
  createdAt: string
}

export type TaskTemplate = {
  id: string
  counselorId: string
  title: string
  description?: string
  category?: string
  days: number
  createdAt: string
}

// ── یادآور درون‌برنامه‌ای ─────────────────────────────────────────────────────
export type Reminder = {
  id: string
  tone: 'info' | 'warn' | 'danger'
  title: string
  body?: string
  link?: string
}
