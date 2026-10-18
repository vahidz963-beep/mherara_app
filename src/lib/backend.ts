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
  SessionRow,
  Task,
  TaskTemplate,
  Role,
} from './types'

export type BackendMode = 'demo' | 'supabase'

export type SignUpInput = {
  phone: string
  password: string
  fullName: string
  role: Role
  grade?: string
  field?: string
  school?: string
  relation?: string
  /** برای نقش والد: تلفن یا کد دعوت فرزند */
  childCode?: string
  /** برای نقش دانش‌آموز: کد دعوت مشاور */
  inviteCode?: string
}

/** یک قرارداد واحد برای هر دو بک‌اند (دمو و Supabase) */
export interface Backend {
  readonly mode: BackendMode

  // ── احراز هویت ──────────────────────────────────────────────
  signIn(phone: string, password: string): Promise<Profile>
  signUp(input: SignUpInput): Promise<Profile>
  signOut(): Promise<void>
  currentProfile(): Promise<Profile | null>
  updatePassword?(newPassword: string): Promise<void>

  // ── پروفایل‌ها ──────────────────────────────────────────────
  getProfile(id: string): Promise<Profile | null>
  listProfiles(): Promise<Profile[]>
  updateProfile(id: string, patch: Partial<Profile>): Promise<Profile>

  // ── اتصال‌ها: مشاور ↔ دانش‌آموز ↔ والد ─────────────────────
  listStudents(counselorId: string): Promise<Profile[]>
  linkStudent(counselorId: string, studentId: string, note?: string): Promise<void>
  unlinkStudent(counselorId: string, studentId: string): Promise<void>
  listChildren(parentId: string): Promise<Profile[]>
  linkChild(parentId: string, code: string): Promise<Profile>

  // ── کدهای دعوت ─────────────────────────────────────────────
  createInvite(input: { role: Role; createdBy: string; studentId?: string | null; note?: string }): Promise<Invite>
  listInvites(createdBy: string): Promise<Invite[]>

  // ── برنامه‌ها ───────────────────────────────────────────────
  listPlans(studentId: string): Promise<Plan[]>
  getPlan(id: string): Promise<Plan | null>
  listPlanItems(planId: string): Promise<PlanItem[]>
  listPlanItemsByRange(studentId: string, fromIso: string, toIso: string): Promise<PlanItem[]>
  createPlan(input: Partial<Plan> & { studentId: string; counselorId: string; title: string }): Promise<Plan>
  updatePlan(id: string, patch: Partial<Plan>): Promise<Plan>
  deletePlan(id: string): Promise<void>
  saveItem(item: Partial<PlanItem> & { planId: string }): Promise<PlanItem>
  deleteItem(id: string): Promise<void>

  // ── کارها / چک‌این‌ها / جلسات ───────────────────────────────
  listTasks(studentId: string): Promise<Task[]>
  saveTask(task: Partial<Task> & { studentId: string }): Promise<Task>
  deleteTask(id: string): Promise<void>

  listCheckins(studentId: string, limit?: number): Promise<Checkin[]>
  saveCheckin(checkin: Partial<Checkin> & { studentId: string; date: string }): Promise<Checkin>

  listSessions(studentId: string): Promise<SessionRow[]>
  saveSession(session: Partial<SessionRow> & { studentId: string }): Promise<SessionRow>
  deleteSession(id: string): Promise<void>

  // ── بازخورد و گفت‌وگو ───────────────────────────────────────
  listFeedback(filter: { targetType?: string; targetId?: string; studentId?: string; limit?: number }): Promise<Feedback[]>
  addFeedback(input: Omit<Feedback, 'id' | 'createdAt'>): Promise<Feedback>

  // ── آزمون‌ها و دفتر اشتباهات ────────────────────────────────
  listExams(studentId: string): Promise<Exam[]>
  getExam(id: string): Promise<Exam | null>
  saveExam(exam: Partial<Exam> & { studentId: string }): Promise<Exam>
  deleteExam(id: string): Promise<void>
  listExamSubjects(examId: string): Promise<ExamSubject[]>
  saveExamSubject(subject: Partial<ExamSubject> & { examId: string }): Promise<ExamSubject>
  deleteExamSubject(id: string): Promise<void>
  listMistakes(studentId: string, examId?: string): Promise<ExamMistake[]>
  saveMistake(mistake: Partial<ExamMistake> & { studentId: string; examId: string }): Promise<ExamMistake>
  deleteMistake(id: string): Promise<void>

  // ── قالب‌های برنامه و تمرین ─────────────────────────────────
  listPlanTemplates(counselorId: string): Promise<PlanTemplate[]>
  savePlanTemplate(t: Omit<PlanTemplate, 'id' | 'createdAt'>): Promise<PlanTemplate>
  deletePlanTemplate(id: string): Promise<void>
  applyPlanTemplate(input: {
    templateId: string
    studentId: string
    counselorId: string
    startDate: string
    title?: string
  }): Promise<Plan>

  listTaskTemplates(counselorId: string): Promise<TaskTemplate[]>
  saveTaskTemplate(t: Omit<TaskTemplate, 'id' | 'createdAt'>): Promise<TaskTemplate>
  deleteTaskTemplate(id: string): Promise<void>

  // ── اعلان‌ها ────────────────────────────────────────────────
  listNotifications(userId: string): Promise<Notification[]>
  markNotificationsRead(userId: string): Promise<void>
}

export const normalizePhone = (phone: string) => {
  const digits = (phone || '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[^\d+]/g, '')
  if (digits.startsWith('+98')) return '0' + digits.slice(3)
  if (digits.startsWith('0098')) return '0' + digits.slice(4)
  if (digits.startsWith('98') && digits.length === 12) return '0' + digits.slice(2)
  if (digits.startsWith('9') && digits.length === 10) return '0' + digits
  return digits
}

export const isValidPhone = (phone: string) => /^09\d{9}$/.test(normalizePhone(phone))

export const uid = (prefix = '') => prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

export const inviteCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}
