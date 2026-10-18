import type { Backend, SignUpInput } from './backend'
import { inviteCode, normalizePhone, uid } from './backend'
import { addDaysIso, startOfFaWeek, todayIso } from './jalali'
import type {
  Checkin,
  Exam,
  ExamMistake,
  ExamSubject,
  Feedback,
  Invite,
  Notification,
  Plan,
  PlanItem,
  PlanTemplate,
  Profile,
  Role,
  SessionRow,
  Task,
  TaskTemplate,
} from './types'

type Account = { id: string; phone: string; password: string }
type DB = {
  accounts: Account[]
  profiles: Profile[]
  links: { counselorId: string; studentId: string }[]
  parentLinks: { parentId: string; studentId: string; relation?: string }[]
  invites: Invite[]
  plans: Plan[]
  items: PlanItem[]
  tasks: Task[]
  checkins: Checkin[]
  sessions: SessionRow[]
  feedback: Feedback[]
  notifications: Notification[]
  exams: Exam[]
  examSubjects: ExamSubject[]
  mistakes: ExamMistake[]
  planTemplates: PlanTemplate[]
  taskTemplates: TaskTemplate[]
}

const KEY = 'hamghadam.demo.v4'

const read = (): DB | null => {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as DB) : null
  } catch {
    return null
  }
}
const write = (db: DB) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    /* ignore */
  }
}

export const DEMO_ACCOUNTS = [
  { role: 'counselor' as Role, phone: '09120000000', password: '123456', name: 'سمیرا رضایی' },
  { role: 'student' as Role, phone: '09121111111', password: '123456', name: 'علی محمدی' },
  { role: 'student' as Role, phone: '09122222222', password: '123456', name: 'نگار کاظمی' },
  { role: 'student' as Role, phone: '09124444444', password: '123456', name: 'سینا احمدی' },
  { role: 'parent' as Role, phone: '09123333333', password: '123456', name: 'زهرا محمدی (مادر علی)' },
]

function seed(): DB {
  const now = new Date().toISOString()
  const counselorId = 'u-counselor'
  const a1 = 'u-ali'
  const a2 = 'u-negar'
  const a3 = 'u-sina'
  const parentId = 'u-parent'

  const profiles: Profile[] = [
    {
      id: counselorId,
      phone: '09120000000',
      fullName: 'سمیرا رضایی',
      role: 'counselor',
      bio: 'کارشناسی ارشد روان‌شناسی تربیتی — مشاور کنکور و برنامه‌ریزی درسی',
      isActive: true,
      createdAt: now,
    },
    {
      id: a1,
      phone: '09121111111',
      fullName: 'علی محمدی',
      role: 'student',
      grade: 'دوازدهم',
      field: 'علوم تجربی',
      school: 'دبیرستان شهید بهشتی',
      counselorId,
      isActive: true,
      createdAt: now,
    },
    {
      id: a2,
      phone: '09122222222',
      fullName: 'نگار کاظمی',
      role: 'student',
      grade: 'یازدهم',
      field: 'ریاضی و فیزیک',
      school: 'فرزانگان ۲',
      counselorId,
      isActive: true,
      createdAt: now,
    },
    {
      id: a3,
      phone: '09124444444',
      fullName: 'سینا احمدی',
      role: 'student',
      grade: 'دهم',
      field: 'علوم انسانی',
      counselorId,
      isActive: true,
      createdAt: now,
    },
    {
      id: parentId,
      phone: '09123333333',
      fullName: 'زهرا محمدی',
      role: 'parent',
      childId: a1,
      relation: 'مادر',
      isActive: true,
      createdAt: now,
    },
  ]

  const accounts: Account[] = DEMO_ACCOUNTS.map((a, i) => ({
    id: profiles[i].id,
    phone: a.phone,
    password: a.password,
  }))

  const weekStart = startOfFaWeek(todayIso())
  const plans: Plan[] = []
  const items: PlanItem[] = []

  const mkPlan = (
    p: Partial<Plan> & { studentId: string; title: string; startDate: string; status: Plan['status'] },
  ): Plan => {
    const plan: Plan = {
      id: uid('p-'),
      counselorId,
      kind: 'week',
      endDate: addDaysIso(p.startDate, 6),
      visibility: 'student_editable',
      createdBy: counselorId,
      createdAt: now,
      updatedAt: now,
      version: 1,
      ...p,
    } as Plan
    plans.push(plan)
    return plan
  }

  const addItem = (planId: string, i: Partial<PlanItem> & { date: string; title: string }) => {
    items.push({
      id: uid('i-'),
      planId,
      subject: '',
      kind: 'study',
      minutes: 60,
      priority: 'mid',
      sort: items.length,
      ...i,
    } as PlanItem)
  }

  // ── برنامه‌ی فعال هفته‌ی جاری علی ──
  const aliWeek = mkPlan({
    studentId: a1,
    title: 'برنامه‌ی هفتگی — جمع‌بندی فصل‌های آزمون',
    startDate: weekStart,
    status: 'active',
  })
  const d = (n: number) => addDaysIso(weekStart, n)
  addItem(aliWeek.id, {
    date: d(0),
    title: 'زیست — فصل ۵ گوارش',
    subject: 'زیست',
    minutes: 90,
    startTime: '16:00',
    done: true,
    priority: 'high',
    testsTotal: 25,
    testsCorrect: 19,
    stages: [1, 2, 3, 4],
  })
  addItem(aliWeek.id, { date: d(0), title: 'حل ۲۵ تست ریاضی مبحث تابع', subject: 'ریاضی', kind: 'test', minutes: 60, startTime: '18:00', done: true, testsTotal: 25, testsCorrect: 20, stages: [4, 5] })
  addItem(aliWeek.id, { date: d(1), title: 'شیمی — مرور استوکیومتری', subject: 'شیمی', kind: 'review', minutes: 75, startTime: '16:30', testsTotal: 15, testsCorrect: 9, stages: [6] })
  addItem(aliWeek.id, { date: d(1), title: 'زبان — ۳۰ لغت + reading', subject: 'زبان', minutes: 45, startTime: '19:00' })
  addItem(aliWeek.id, { date: d(2), title: 'فیزیک — حرکت‌شناسی', subject: 'فیزیک', minutes: 90, startTime: '15:30', priority: 'high' })
  addItem(aliWeek.id, { date: d(2), title: 'ورزش / پیاده‌روی', kind: 'sport', minutes: 40, startTime: '20:00' })
  addItem(aliWeek.id, { date: d(3), title: 'آزمون آزمایشی — عمومی', kind: 'test', minutes: 120, startTime: '16:00', priority: 'high', testsTotal: 100, testsCorrect: 71, stages: [7] })
  addItem(aliWeek.id, { date: d(3), title: 'تحلیل آزمون و دفتر اشتباهات', kind: 'review', minutes: 60, startTime: '18:30' })
  addItem(aliWeek.id, { date: d(4), title: 'زیست — ژنتیک', subject: 'زیست', minutes: 90, startTime: '16:00' })
  addItem(aliWeek.id, { date: d(5), title: 'مرور کلی هفته + برنامه‌ریزی بعدی', kind: 'review', minutes: 45, startTime: '10:00' })
  addItem(aliWeek.id, { date: d(6), title: 'استراحت فعال + مطالعه‌ی آزاد', kind: 'rest', minutes: 60, startTime: '11:00' })

  // ── برنامه‌ی در انتظار تأیید برای علی ──
  const aliNext = mkPlan({
    studentId: a1,
    title: 'برنامه‌ی هفته‌ی بعد — تمرکز روی نقاط ضعف',
    startDate: addDaysIso(weekStart, 7),
    status: 'pending',
  })
  addItem(aliNext.id, { date: addDaysIso(weekStart, 7), title: 'ریاضی — احتمال', subject: 'ریاضی', minutes: 90, startTime: '16:00', priority: 'high' })
  addItem(aliNext.id, { date: addDaysIso(weekStart, 8), title: 'شیمی — اسید و باز', subject: 'شیمی', minutes: 75, startTime: '17:00' })
  addItem(aliNext.id, { date: addDaysIso(weekStart, 9), title: 'زیست — آزمون فصل ۶', subject: 'زیست', kind: 'test', minutes: 60, startTime: '16:30' })

  // ── نگار: یک برنامه‌ی فعال ──
  const negarWeek = mkPlan({
    studentId: a2,
    title: 'برنامه‌ی هفتگی نگار — تثبیت مباحث',
    startDate: weekStart,
    status: 'active',
  })
  addItem(negarWeek.id, { date: d(0), title: 'هندسه — فصل ۲', subject: 'هندسه', minutes: 80, startTime: '17:00', done: true })
  addItem(negarWeek.id, { date: d(2), title: 'فیزیک — الکتریسیته ساکن', subject: 'فیزیک', minutes: 90, startTime: '16:00' })
  addItem(negarWeek.id, { date: d(4), title: 'حسابان — مشتق', subject: 'حسابان', minutes: 90, startTime: '16:30' })

  // ── سینا: پیش‌نویس ──
  const sinaDraft = mkPlan({
    studentId: a3,
    title: 'پیش‌نویس برنامه‌ی اولیه',
    startDate: weekStart,
    status: 'draft',
    visibility: 'private',
  })
  addItem(sinaDraft.id, { date: d(1), title: 'عربی — قواعد درس ۱', subject: 'عربی', minutes: 45 })

  const tasks: Task[] = [
    {
      id: uid('t-'),
      studentId: a1,
      counselorId,
      title: 'تکمیل دفتر اشتباهات آزمون هفته‌ی گذشته',
      description: 'برای هر سؤال غلط، علت خطا را در سه دسته بنویس: بی‌دقتی، نبودِ دانش، کمبود زمان.',
      dueDate: addDaysIso(todayIso(), 2),
      status: 'doing',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uid('t-'),
      studentId: a1,
      counselorId,
      title: 'تمرین تنفس ۴-۷-۸ قبل از خواب (۷ شب)',
      description: 'هر شب ۵ دقیقه. در همین صفحه تیک بزن.',
      dueDate: addDaysIso(todayIso(), 7),
      status: 'todo',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uid('t-'),
      studentId: a1,
      counselorId,
      title: 'ارسال کارنامه‌ی آزمون آزمایشی',
      status: 'done',
      studentNote: 'کارنامه را در جلسه نشان می‌دهم؛ فایلش هم فرستادم.',
      counselorFeedback: 'دیدم، روند تراز عمومیت خوب بود. روی درس زمین‌شناسی یک بازه‌ی ثابت بگذاریم.',
      dueDate: addDaysIso(todayIso(), -1),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uid('t-'),
      studentId: a2,
      counselorId,
      title: 'حل ۱۵ تست هندسه از مبحث دایره',
      dueDate: addDaysIso(todayIso(), 3),
      status: 'todo',
      createdAt: now,
      updatedAt: now,
    },
  ]

  const checkins: Checkin[] = []
  const moods = [3, 4, 4, 2, 4, 5, 3, 4, 4, 5]
  const studies = [180, 240, 210, 90, 300, 260, 150, 240, 280, 310]
  const screens = [3.5, 2, 2.5, 5, 1.5, 1, 4, 2.5, 2, 1.5]
  const exercises = [0, 30, 20, 0, 45, 30, 0, 30, 20, 40]
  const leisurePlans: string[][] = [
    ['walk'],
    ['sport', 'book'],
    ['book', 'music'],
    [],
    ['sport', 'boardgame'],
    ['walk', 'movie'],
    [],
    ['music', 'writing'],
    ['walk', 'book'],
    ['sport', 'nature', 'movie'],
  ]
  for (let i = 9; i >= 0; i--) {
    const idx = 9 - i
    const date = addDaysIso(todayIso(), -i)
    checkins.push({
      id: uid('c-'),
      studentId: a1,
      date,
      mood: moods[idx],
      energy: Math.max(1, moods[idx] - 1),
      focus: Math.min(5, moods[idx]),
      studyMinutes: studies[idx],
      sleepHours: 6 + (idx % 3),
      screenHours: screens[idx],
      exerciseMinutes: exercises[idx],
      leisure: leisurePlans[idx],
      note: idx === 0 ? 'امروز تمرکزم کم بود، بیشتر وقت تلف شد.' : idx === 6 ? 'بعد از آزمون خسته بودم.' : undefined,
      counselorReply:
        idx === 0
          ? 'طبیعیه. بیا برای نیم‌ساعت اول روز یک کار کوچک مشخص تعیین کنیم که شروع کردن ساده باشه.'
          : undefined,
      createdAt: now,
    })
  }

  const sessions: SessionRow[] = [
    {
      id: uid('s-'),
      studentId: a1,
      counselorId,
      date: addDaysIso(todayIso(), -5),
      time: '18:00',
      mode: 'online',
      topic: 'بررسی وضعیت مطالعه و اضطراب آزمون',
      summary:
        'درباره‌ی اضطراب قبل از آزمون صحبت کردیم؛ علائم جسمی (تپش قلب، بی‌خوابی شب قبل) داشت. تکنیک تنفس و برنامه‌ی خواب تعیین شد.',
      nextSteps: '۱) تمرین تنفس شبانه ۲) دفتر اشتباهات ۳) ثبت چک‌این روزانه',
      status: 'done',
      createdAt: now,
    },
    {
      id: uid('s-'),
      studentId: a1,
      counselorId,
      date: addDaysIso(todayIso(), 2),
      time: '17:30',
      mode: 'online',
      topic: 'جلسه‌ی پیگیری هفتگی + بررسی برنامه‌ی جدید',
      status: 'scheduled',
      createdAt: now,
    },
    {
      id: uid('s-'),
      studentId: a2,
      counselorId,
      date: addDaysIso(todayIso(), 3),
      time: '16:00',
      mode: 'online',
      topic: 'انتخاب رشته و تعیین هدف',
      status: 'scheduled',
      createdAt: now,
    },
  ]

  const feedback: Feedback[] = [
    {
      id: uid('f-'),
      targetType: 'student',
      targetId: a1,
      studentId: a1,
      authorId: counselorId,
      authorName: 'سمیرا رضایی',
      authorRole: 'counselor',
      kind: 'comment',
      body: 'علی جان، برنامه‌ی هفته‌ی بعد را آماده کردم. اگر جایی فشار زیادی دارد بگو تا سبک‌ترش کنیم.',
      createdAt: now,
    },
    {
      id: uid('f-'),
      targetType: 'student',
      targetId: a1,
      studentId: a1,
      authorId: a1,
      authorName: 'علی محمدی',
      authorRole: 'student',
      kind: 'reply',
      body: 'سلام خانم رضایی. دوشنبه‌ها تا ۶ کلاس دارم، می‌شه ساعت ریاضی رو به ۱۹ منتقل کنیم؟',
      createdAt: now,
    },
  ]

  const invites: Invite[] = [
    {
      code: 'ALI1405',
      role: 'student',
      createdBy: counselorId,
      note: 'دعوت مشاوره‌ی علی',
      createdAt: now,
      expiresAt: addDaysIso(todayIso(), 14),
    },
  ]


  // ── آزمون‌ها و دفتر اشتباهات ──
  const exams: Exam[] = []
  const examSubjects: ExamSubject[] = []
  const mistakes: ExamMistake[] = []

  const addExam = (e: Partial<Exam> & { studentId: string; title: string; date: string }) => {
    const exam: Exam = { id: uid('e-'), scope: 'mock', counselorId, createdAt: now, ...e } as Exam
    exams.push(exam)
    return exam
  }
  const addSubject = (examId: string, subject: string, total: number, correct: number, wrong: number, blank: number, targetPercent?: number) => {
    examSubjects.push({ id: uid('es-'), examId, subject, total, correct, wrong, blank, targetPercent })
  }

  const mock1 = addExam({ studentId: a1, title: 'آزمون آزمایشی شماره ۳', date: addDaysIso(todayIso(), -16), scope: 'mock', note: 'عمومی‌ها خوب بود، اختصاصی‌ها افت داشت.' })
  addSubject(mock1.id, 'ریاضی', 30, 14, 12, 4, 60)
  addSubject(mock1.id, 'زیست', 50, 26, 18, 6, 65)
  addSubject(mock1.id, 'شیمی', 35, 18, 12, 5, 60)
  addSubject(mock1.id, 'فیزیک', 30, 11, 15, 4, 55)
  addSubject(mock1.id, 'ادبیات', 25, 17, 5, 3, 70)
  addSubject(mock1.id, 'عربی', 25, 12, 9, 4, 60)

  const mock2 = addExam({ studentId: a1, title: 'آزمون آزمایشی شماره ۴', date: addDaysIso(todayIso(), -2), scope: 'mock', note: 'زمان فیزیک کم آمد.' })
  addSubject(mock2.id, 'ریاضی', 30, 17, 9, 4, 60)
  addSubject(mock2.id, 'زیست', 50, 31, 14, 5, 65)
  addSubject(mock2.id, 'شیمی', 35, 21, 10, 4, 60)
  addSubject(mock2.id, 'فیزیک', 30, 12, 16, 2, 55)
  addSubject(mock2.id, 'ادبیات', 25, 19, 4, 2, 70)
  addSubject(mock2.id, 'عربی', 25, 14, 8, 3, 60)

  const mkMistake = (examId: string, subject: string, reason: ExamMistake['reason'], note: string, resolved = false) =>
    mistakes.push({ id: uid('m-'), examId, studentId: a1, subject, reason, note, resolved, createdAt: now })

  mkMistake(mock2.id, 'فیزیک', 'time', 'سه سؤال آخر وقت نرسید؛ باید روی تست‌های سریع‌تر کار کنم.', false)
  mkMistake(mock2.id, 'فیزیک', 'knowledge', 'مبحث القا را کامل نخوانده بودم.', false)
  mkMistake(mock2.id, 'ریاضی', 'careless', 'دو سؤال را در محاسبه‌ی ساده اشتباه کردم؛ باید مرحله‌ها را بنویسم.', false)
  mkMistake(mock2.id, 'شیمی', 'misread', 'صورت سؤال «مجموع» را «تفاوت» خواندم.', true)
  mkMistake(mock1.id, 'زیست', 'knowledge', 'فصل ۷ (تولید مثل) هنوز مرور نشده.', true)

  const planTemplates: PlanTemplate[] = []
  const taskTemplates: TaskTemplate[] = []

  return {
    accounts,
    profiles,
    links: [
      { counselorId, studentId: a1 },
      { counselorId, studentId: a2 },
      { counselorId, studentId: a3 },
    ],
    parentLinks: [{ parentId, studentId: a1, relation: 'مادر' }],
    invites,
    plans,
    items,
    tasks,
    checkins,
    sessions,
    feedback,
    notifications: [],
    exams,
    examSubjects,
    mistakes,
    planTemplates,
    taskTemplates,
  }
}

function db(): DB {
  let d = read()
  if (!d) {
    d = seed()
    write(d)
  }
  return d
}

const persist = (d: DB) => write(d)

export function resetDemoData() {
  const fresh = seed()
  persist(fresh)
}

export class DemoBackend implements Backend {
  readonly mode = 'demo' as const
  private sessionKey = 'hamghadam.demo.session'
  private latency = 120

  private async tick() {
    await new Promise((r) => setTimeout(r, this.latency))
  }

  private session(): string | null {
    return localStorage.getItem(this.sessionKey)
  }
  private setSession(id: string | null) {
    if (id) localStorage.setItem(this.sessionKey, id)
    else localStorage.removeItem(this.sessionKey)
  }

  private profile(id: string): Profile {
    const p = db().profiles.find((x) => x.id === id)
    if (!p) throw new Error('کاربر پیدا نشد')
    return p
  }

  // ── auth ──
  async signIn(phone: string, password: string) {
    await this.tick()
    const d = db()
    const acc = d.accounts.find((a) => a.phone === normalizePhone(phone))
    if (!acc) throw new Error('با این شماره کاربری ثبت‌نام نشده است')
    if (acc.password !== password) throw new Error('رمز عبور درست نیست')
    this.setSession(acc.id)
    return this.profile(acc.id)
  }

  async signUp(input: SignUpInput) {
    await this.tick()
    const d = db()
    const phone = normalizePhone(input.phone)
    if (d.accounts.some((a) => a.phone === phone)) throw new Error('این شماره قبلاً ثبت شده است')
    if ((input.password || '').length < 6) throw new Error('رمز عبور باید حداقل ۶ کاراکتر باشد')

    const id = uid('u-')
    const profile: Profile = {
      id,
      phone,
      fullName: input.fullName?.trim() || 'کاربر جدید',
      role: input.role,
      grade: input.grade,
      field: input.field,
      school: input.school,
      relation: input.relation,
      isActive: true,
      createdAt: new Date().toISOString(),
    }

    if (input.role === 'student') {
      const code = (input.inviteCode || '').trim().toUpperCase()
      const inv = d.invites.find((i) => i.code === code)
      if (inv) {
        profile.counselorId = inv.createdBy
        inv.usedBy = id
        inv.usedAt = new Date().toISOString()
        if (!d.links.some((l) => l.counselorId === inv.createdBy && l.studentId === id))
          d.links.push({ counselorId: inv.createdBy, studentId: id })
      }
    }
    if (input.role === 'parent' && input.childCode) {
      const code = input.childCode.trim()
      const child =
        d.profiles.find((p) => p.role === 'student' && normalizePhone(p.phone) === normalizePhone(code)) ||
        d.profiles.find((p) => p.role === 'student' && p.fullName === code)
      if (child) {
        profile.childId = child.id
        d.parentLinks.push({ parentId: id, studentId: child.id, relation: input.relation })
      }
    }

    d.profiles.push(profile)
    d.accounts.push({ id, phone, password: input.password })
    persist(d)
    this.setSession(id)
    return profile
  }

  async signOut() {
    this.setSession(null)
  }

  async currentProfile() {
    const id = this.session()
    if (!id) return null
    return db().profiles.find((p) => p.id === id) || null
  }

  async updatePassword(newPassword: string) {
    await this.tick()
    const id = this.session()
    const d = db()
    const acc = d.accounts.find((a) => a.id === id)
    if (acc) acc.password = newPassword
    persist(d)
  }

  // ── profiles ──
  async getProfile(id: string) {
    await this.tick()
    return db().profiles.find((p) => p.id === id) || null
  }

  async listProfiles() {
    await this.tick()
    return db().profiles
  }

  async updateProfile(id: string, patch: Partial<Profile>) {
    await this.tick()
    const d = db()
    const i = d.profiles.findIndex((p) => p.id === id)
    if (i < 0) throw new Error('کاربر پیدا نشد')
    d.profiles[i] = { ...d.profiles[i], ...patch, id }
    if (patch.fullName) {
      d.feedback = d.feedback.map((f) => (f.authorId === id ? { ...f, authorName: patch.fullName } : f))
    }
    persist(d)
    return d.profiles[i]
  }

  // ── links ──
  async listStudents(counselorId: string) {
    await this.tick()
    const d = db()
    const ids = new Set(d.links.filter((l) => l.counselorId === counselorId).map((l) => l.studentId))
    d.profiles.filter((p) => p.role === 'student' && (ids.has(p.id) || p.counselorId === counselorId)).forEach((p) => ids.add(p.id))
    return d.profiles.filter((p) => ids.has(p.id))
  }

  async linkStudent(counselorId: string, studentId: string) {
    await this.tick()
    const d = db()
    if (!d.links.some((l) => l.counselorId === counselorId && l.studentId === studentId))
      d.links.push({ counselorId, studentId })
    const p = d.profiles.find((x) => x.id === studentId)
    if (p) p.counselorId = counselorId
    persist(d)
  }

  async unlinkStudent(counselorId: string, studentId: string) {
    await this.tick()
    const d = db()
    d.links = d.links.filter((l) => !(l.counselorId === counselorId && l.studentId === studentId))
    persist(d)
  }

  async listChildren(parentId: string) {
    await this.tick()
    const d = db()
    const ids = d.parentLinks.filter((l) => l.parentId === parentId).map((l) => l.studentId)
    const p = d.profiles.find((x) => x.id === parentId)
    if (p?.childId && !ids.includes(p.childId)) ids.push(p.childId)
    return d.profiles.filter((x) => ids.includes(x.id))
  }

  async linkChild(parentId: string, code: string) {
    await this.tick()
    const d = db()
    const child =
      d.profiles.find((p) => p.role === 'student' && normalizePhone(p.phone) === normalizePhone(code)) ||
      d.profiles.find((p) => p.role === 'student' && p.fullName === code.trim())
    if (!child) throw new Error('دانش‌آموزی با این شماره پیدا نشد')
    d.parentLinks.push({ parentId, studentId: child.id })
    const parent = d.profiles.find((x) => x.id === parentId)
    if (parent) parent.childId = child.id
    persist(d)
    return child
  }

  // ── invites ──
  async createInvite(input: { role: Role; createdBy: string; studentId?: string | null; note?: string }) {
    await this.tick()
    const d = db()
    const inv: Invite = {
      code: inviteCode(),
      role: input.role,
      createdBy: input.createdBy,
      studentId: input.studentId ?? null,
      note: input.note,
      createdAt: new Date().toISOString(),
      expiresAt: addDaysIso(todayIso(), 30),
    }
    d.invites.unshift(inv)
    persist(d)
    return inv
  }

  async listInvites(createdBy: string) {
    await this.tick()
    return db().invites.filter((i) => i.createdBy === createdBy)
  }

  // ── plans ──
  async listPlans(studentId: string) {
    await this.tick()
    return db()
      .plans.filter((p) => p.studentId === studentId)
      .sort((a, b) => (a.startDate < b.startDate ? 1 : -1))
  }

  async getPlan(id: string) {
    await this.tick()
    return db().plans.find((p) => p.id === id) || null
  }

  async listPlanItems(planId: string) {
    await this.tick()
    return db()
      .items.filter((i) => i.planId === planId)
      .sort((a, b) => (a.date + (a.startTime || '')).localeCompare(b.date + (b.startTime || '')))
  }

  async listPlanItemsByRange(studentId: string, fromIso: string, toIso: string) {
    await this.tick()
    const d = db()
    const planIds = d.plans.filter((p) => p.studentId === studentId && p.status !== 'archived').map((p) => p.id)
    return d.items
      .filter((i) => planIds.includes(i.planId) && i.date >= fromIso && i.date <= toIso)
      .sort((a, b) => (a.date + (a.startTime || '')).localeCompare(b.date + (b.startTime || '')))
  }

  async createPlan(input: Partial<Plan> & { studentId: string; counselorId: string; title: string }) {
    await this.tick()
    const d = db()
    const now = new Date().toISOString()
    const plan: Plan = {
      id: uid('p-'),
      kind: 'week',
      startDate: todayIso(),
      endDate: addDaysIso(todayIso(), 6),
      status: 'draft',
      visibility: 'student_editable',
      parentShare: 'shared',
      createdBy: input.counselorId,
      createdAt: now,
      updatedAt: now,
      version: 1,
      ...input,
    } as Plan
    d.plans.push(plan)
    persist(d)
    return plan
  }

  async updatePlan(id: string, patch: Partial<Plan>) {
    await this.tick()
    const d = db()
    const i = d.plans.findIndex((p) => p.id === id)
    if (i < 0) throw new Error('برنامه پیدا نشد')
    d.plans[i] = { ...d.plans[i], ...patch, id, updatedAt: new Date().toISOString() }
    persist(d)
    return d.plans[i]
  }

  async deletePlan(id: string) {
    await this.tick()
    const d = db()
    d.plans = d.plans.filter((p) => p.id !== id)
    d.items = d.items.filter((i) => i.planId !== id)
    persist(d)
  }

  async saveItem(item: Partial<PlanItem> & { planId: string }) {
    await this.tick()
    const d = db()
    if (item.id) {
      const i = d.items.findIndex((x) => x.id === item.id)
      if (i >= 0) {
        d.items[i] = { ...d.items[i], ...item } as PlanItem
        persist(d)
        return d.items[i]
      }
    }
    const created: PlanItem = {
      id: uid('i-'),
      date: todayIso(),
      subject: '',
      title: '',
      kind: 'study',
      minutes: 60,
      priority: 'mid',
      sort: d.items.length,
      ...item,
    } as PlanItem
    d.items.push(created)
    persist(d)
    return created
  }

  async deleteItem(id: string) {
    await this.tick()
    const d = db()
    d.items = d.items.filter((i) => i.id !== id)
    persist(d)
  }

  // ── tasks / checkins / sessions ──
  async listTasks(studentId: string) {
    await this.tick()
    return db()
      .tasks.filter((t) => t.studentId === studentId)
      .sort((a, b) => (a.status === b.status ? 0 : a.status === 'done' ? 1 : -1))
  }

  async saveTask(task: Partial<Task> & { studentId: string }) {
    await this.tick()
    const d = db()
    const now = new Date().toISOString()
    if (task.id) {
      const i = d.tasks.findIndex((t) => t.id === task.id)
      if (i >= 0) {
        d.tasks[i] = { ...d.tasks[i], ...task, updatedAt: now } as Task
        persist(d)
        return d.tasks[i]
      }
    }
    const created: Task = {
      id: uid('t-'),
      counselorId: '',
      title: 'کار جدید',
      status: 'todo',
      createdAt: now,
      updatedAt: now,
      ...task,
    } as Task
    d.tasks.push(created)
    persist(d)
    return created
  }

  async deleteTask(id: string) {
    await this.tick()
    const d = db()
    d.tasks = d.tasks.filter((t) => t.id !== id)
    persist(d)
  }

  async listCheckins(studentId: string, limit = 30) {
    await this.tick()
    return db()
      .checkins.filter((c) => c.studentId === studentId)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, limit)
  }

  async saveCheckin(checkin: Partial<Checkin> & { studentId: string; date: string }) {
    await this.tick()
    const d = db()
    const i = d.checkins.findIndex((c) => c.studentId === checkin.studentId && c.date === checkin.date)
    if (i >= 0) {
      d.checkins[i] = { ...d.checkins[i], ...checkin } as Checkin
      persist(d)
      return d.checkins[i]
    }
    const created: Checkin = {
      id: uid('c-'),
      mood: 3,
      energy: 3,
      focus: 3,
      studyMinutes: 0,
      sleepHours: 7,
      screenHours: 0,
      exerciseMinutes: 0,
      leisure: [],
      createdAt: new Date().toISOString(),
      ...checkin,
    } as Checkin
    d.checkins.push(created)
    persist(d)
    return created
  }

  async listSessions(studentId: string) {
    await this.tick()
    return db()
      .sessions.filter((s) => s.studentId === studentId)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }

  async saveSession(session: Partial<SessionRow> & { studentId: string }) {
    await this.tick()
    const d = db()
    if (session.id) {
      const i = d.sessions.findIndex((s) => s.id === session.id)
      if (i >= 0) {
        d.sessions[i] = { ...d.sessions[i], ...session } as SessionRow
        persist(d)
        return d.sessions[i]
      }
    }
    const created: SessionRow = {
      id: uid('s-'),
      counselorId: '',
      date: todayIso(),
      mode: 'online',
      topic: 'جلسه‌ی مشاوره',
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      ...session,
    } as SessionRow
    d.sessions.push(created)
    persist(d)
    return created
  }

  async deleteSession(id: string) {
    await this.tick()
    const d = db()
    d.sessions = d.sessions.filter((s) => s.id !== id)
    persist(d)
  }

  // ── feedback ──
  async listFeedback(filter: { targetType?: string; targetId?: string; studentId?: string; limit?: number }) {
    await this.tick()
    let list = db().feedback
    if (filter.targetType) list = list.filter((f) => f.targetType === filter.targetType)
    if (filter.targetId) list = list.filter((f) => f.targetId === filter.targetId)
    if (filter.studentId) list = list.filter((f) => f.studentId === filter.studentId)
    list = [...list].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
    return filter.limit ? list.slice(-filter.limit) : list
  }

  async addFeedback(input: Omit<Feedback, 'id' | 'createdAt'>) {
    await this.tick()
    const d = db()
    const author = d.profiles.find((p) => p.id === input.authorId)
    const fb: Feedback = {
      ...input,
      authorName: input.authorName || author?.fullName,
      authorRole: input.authorRole || author?.role,
      id: uid('f-'),
      createdAt: new Date().toISOString(),
    }
    d.feedback.push(fb)
    persist(d)
    return fb
  }

  async listNotifications(userId: string) {
    await this.tick()
    return db().notifications.filter((n) => n.userId === userId)
  }

  async markNotificationsRead(userId: string) {
    await this.tick()
    const d = db()
    d.notifications = d.notifications.map((n) => (n.userId === userId ? { ...n, read: true } : n))
    persist(d)
  }

  // ── آزمون‌ها ────────────────────────────────────────────────
  async listExams(studentId: string) {
    await this.tick()
    return db()
      .exams.filter((e) => e.studentId === studentId)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }

  async getExam(id: string) {
    await this.tick()
    return db().exams.find((e) => e.id === id) || null
  }

  async saveExam(exam: Partial<Exam> & { studentId: string }) {
    await this.tick()
    const d = db()
    if (exam.id) {
      const i = d.exams.findIndex((e) => e.id === exam.id)
      if (i >= 0) {
        d.exams[i] = { ...d.exams[i], ...exam } as Exam
        persist(d)
        return d.exams[i]
      }
    }
    const created: Exam = {
      id: uid('e-'),
      title: 'آزمون بدون عنوان',
      date: todayIso(),
      scope: 'mock',
      createdAt: new Date().toISOString(),
      ...exam,
    } as Exam
    d.exams.push(created)
    persist(d)
    return created
  }

  async deleteExam(id: string) {
    await this.tick()
    const d = db()
    d.exams = d.exams.filter((e) => e.id !== id)
    d.examSubjects = d.examSubjects.filter((s) => s.examId !== id)
    d.mistakes = d.mistakes.filter((m) => m.examId !== id)
    persist(d)
  }

  async listExamSubjects(examId: string) {
    await this.tick()
    return db().examSubjects.filter((s) => s.examId === examId)
  }

  async saveExamSubject(subject: Partial<ExamSubject> & { examId: string }) {
    await this.tick()
    const d = db()
    if (subject.id) {
      const i = d.examSubjects.findIndex((s) => s.id === subject.id)
      if (i >= 0) {
        d.examSubjects[i] = { ...d.examSubjects[i], ...subject } as ExamSubject
        persist(d)
        return d.examSubjects[i]
      }
    }
    const created: ExamSubject = {
      id: uid('es-'),
      subject: 'درس',
      total: 0,
      correct: 0,
      wrong: 0,
      blank: 0,
      ...subject,
    } as ExamSubject
    d.examSubjects.push(created)
    persist(d)
    return created
  }

  async deleteExamSubject(id: string) {
    await this.tick()
    const d = db()
    d.examSubjects = d.examSubjects.filter((s) => s.id !== id)
    persist(d)
  }

  async listMistakes(studentId: string, examId?: string) {
    await this.tick()
    const d = db()
    const examsById = new Map(d.exams.map((e) => [e.id, e]))
    return d.mistakes
      .filter((m) => m.studentId === studentId && (!examId || m.examId === examId))
      .map((m) => ({
        ...m,
        examTitle: examsById.get(m.examId)?.title,
        examDate: examsById.get(m.examId)?.date,
      }))
      .sort((a, b) => ((a.examDate || '') < (b.examDate || '') ? 1 : -1))
  }

  async saveMistake(mistake: Partial<ExamMistake> & { studentId: string; examId: string }) {
    await this.tick()
    const d = db()
    if (mistake.id) {
      const i = d.mistakes.findIndex((m) => m.id === mistake.id)
      if (i >= 0) {
        d.mistakes[i] = { ...d.mistakes[i], ...mistake } as ExamMistake
        persist(d)
        return d.mistakes[i]
      }
    }
    const created: ExamMistake = {
      id: uid('m-'),
      subject: '',
      reason: 'knowledge',
      resolved: false,
      createdAt: new Date().toISOString(),
      ...mistake,
    } as ExamMistake
    d.mistakes.push(created)
    persist(d)
    return created
  }

  async deleteMistake(id: string) {
    await this.tick()
    const d = db()
    d.mistakes = d.mistakes.filter((m) => m.id !== id)
    persist(d)
  }

  // ── قالب‌های برنامه ─────────────────────────────────────────
  async listPlanTemplates(counselorId: string) {
    await this.tick()
    return db()
      .planTemplates.filter((t) => t.counselorId === counselorId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  }

  async savePlanTemplate(t: Omit<PlanTemplate, 'id' | 'createdAt'>) {
    await this.tick()
    const d = db()
    const created: PlanTemplate = { ...t, id: uid('pt-'), createdAt: new Date().toISOString() }
    d.planTemplates.unshift(created)
    persist(d)
    return created
  }

  async deletePlanTemplate(id: string) {
    await this.tick()
    const d = db()
    d.planTemplates = d.planTemplates.filter((t) => t.id !== id)
    persist(d)
  }

  async applyPlanTemplate(input: { templateId: string; studentId: string; counselorId: string; startDate: string; title?: string }) {
    const d = db()
    const tpl = d.planTemplates.find((t) => t.id === input.templateId)
    if (!tpl) throw new Error('قالب پیدا نشد')
    const plan = await this.createPlan({
      studentId: input.studentId,
      counselorId: input.counselorId,
      title: input.title || tpl.title,
      kind: tpl.kind,
      startDate: input.startDate,
      endDate: addDaysIso(input.startDate, tpl.kind === 'month' ? 29 : 6),
      visibility: 'student_editable',
      status: 'draft',
      note: tpl.note,
      createdBy: input.counselorId,
    })
    for (const it of tpl.items) {
      await this.saveItem({
        planId: plan.id,
        date: addDaysIso(input.startDate, it.dayOffset || 0),
        title: it.title,
        subject: it.subject,
        kind: it.kind,
        minutes: it.minutes,
        startTime: it.startTime,
        priority: it.priority,
        note: it.note,
      })
    }
    return plan
  }

  // ── قالب‌های تمرین ──────────────────────────────────────────
  async listTaskTemplates(counselorId: string) {
    await this.tick()
    return db()
      .taskTemplates.filter((t) => t.counselorId === counselorId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  }

  async saveTaskTemplate(t: Omit<TaskTemplate, 'id' | 'createdAt'>) {
    await this.tick()
    const d = db()
    const created: TaskTemplate = { ...t, id: uid('tt-'), createdAt: new Date().toISOString() }
    d.taskTemplates.unshift(created)
    persist(d)
    return created
  }

  async deleteTaskTemplate(id: string) {
    await this.tick()
    const d = db()
    d.taskTemplates = d.taskTemplates.filter((t) => t.id !== id)
    persist(d)
  }
}
