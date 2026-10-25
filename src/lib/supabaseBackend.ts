import type { Backend, SignUpInput } from './backend'
import { normalizePhone } from './backend'
import { supabase, isSupabaseConfigured, phoneToEmail } from './supabaseClient'
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
} from './types'

// ── نگاشت ردیف‌های دیتابیس (snake_case) به مدل‌های برنامه (camelCase) ──
const toProfile = (r: any): Profile => ({
  id: r.id,
  phone: r.phone,
  fullName: r.full_name,
  role: r.role,
  grade: r.grade ?? undefined,
  field: r.field ?? undefined,
  school: r.school ?? undefined,
  counselorId: r.counselor_id,
  childId: r.child_id,
  relation: r.relation ?? undefined,
  bio: r.bio ?? undefined,
  isActive: r.is_active !== false,
  createdAt: r.created_at,
})

const profilePatch = (p: Partial<Profile>) => {
  const out: Record<string, unknown> = {}
  if (p.fullName !== undefined) out.full_name = p.fullName
  if (p.grade !== undefined) out.grade = p.grade
  if (p.field !== undefined) out.field = p.field
  if (p.school !== undefined) out.school = p.school
  if (p.bio !== undefined) out.bio = p.bio
  if (p.relation !== undefined) out.relation = p.relation
  if (p.isActive !== undefined) out.is_active = p.isActive
  if (p.counselorId !== undefined) out.counselor_id = p.counselorId
  if (p.childId !== undefined) out.child_id = p.childId
  if (p.role !== undefined) out.role = p.role
  if (p.phone !== undefined) out.phone = normalizePhone(p.phone)
  return out
}

const toPlan = (r: any): Plan => ({
  id: r.id,
  studentId: r.student_id,
  counselorId: r.counselor_id,
  title: r.title,
  kind: r.kind,
  startDate: r.start_date,
  endDate: r.end_date,
  status: r.status,
  visibility: r.visibility,
  parentShare: r.parent_share ?? 'shared',
  note: r.note ?? undefined,
  createdBy: r.created_by,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  version: r.version ?? 1,
})

const planPatch = (p: Partial<Plan>) => {
  const out: Record<string, unknown> = {}
  if (p.title !== undefined) out.title = p.title
  if (p.kind !== undefined) out.kind = p.kind
  if (p.startDate !== undefined) out.start_date = p.startDate
  if (p.endDate !== undefined) out.end_date = p.endDate
  if (p.status !== undefined) out.status = p.status
  if (p.visibility !== undefined) out.visibility = p.visibility
  if (p.parentShare !== undefined) out.parent_share = p.parentShare
  if (p.note !== undefined) out.note = p.note
  if (p.counselorId !== undefined) out.counselor_id = p.counselorId
  out.updated_at = new Date().toISOString()
  return out
}

const toItem = (r: any): PlanItem => ({
  id: r.id,
  planId: r.plan_id,
  date: r.date,
  startTime: r.start_time ?? undefined,
  subject: r.subject ?? '',
  title: r.title,
  kind: r.kind,
  minutes: r.minutes ?? 60,
  priority: r.priority ?? 'mid',
  note: r.note ?? undefined,
  done: r.done ?? false,
  doneAt: r.done_at ?? undefined,
  studentNote: r.student_note ?? undefined,
  sort: r.sort ?? 0,
  testsTotal: r.tests_total ?? undefined,
  testsCorrect: r.tests_correct ?? undefined,
  stages: Array.isArray(r.stages) ? r.stages : r.stages ? Object.values(r.stages) : undefined,
})

const itemPatch = (i: Partial<PlanItem>) => {
  const out: Record<string, unknown> = {}
  const map: [keyof PlanItem, string][] = [
    ['planId', 'plan_id'],
    ['date', 'date'],
    ['startTime', 'start_time'],
    ['subject', 'subject'],
    ['title', 'title'],
    ['kind', 'kind'],
    ['minutes', 'minutes'],
    ['priority', 'priority'],
    ['note', 'note'],
    ['done', 'done'],
    ['doneAt', 'done_at'],
    ['studentNote', 'student_note'],
    ['sort', 'sort'],
    ['testsTotal', 'tests_total'],
    ['testsCorrect', 'tests_correct'],
    ['stages', 'stages'],
  ]
  for (const [from, to] of map) if (i[from] !== undefined) out[to] = i[from] === null && to === 'stages' ? [] : i[from]
  return out
}

const toTask = (r: any): Task => ({
  id: r.id,
  studentId: r.student_id,
  counselorId: r.counselor_id,
  title: r.title,
  description: r.description ?? undefined,
  dueDate: r.due_date ?? undefined,
  status: r.status,
  studentNote: r.student_note ?? undefined,
  counselorFeedback: r.counselor_feedback ?? undefined,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
})

const toCheckin = (r: any): Checkin => ({
  id: r.id,
  studentId: r.student_id,
  date: r.date,
  mood: r.mood,
  energy: r.energy,
  focus: r.focus,
  studyMinutes: r.study_minutes,
  sleepHours: Number(r.sleep_hours),
  screenHours: r.screen_hours === null || r.screen_hours === undefined ? undefined : Number(r.screen_hours),
  exerciseMinutes: r.exercise_minutes ?? undefined,
  leisure: Array.isArray(r.leisure) ? r.leisure : [],
  note: r.note ?? undefined,
  counselorReply: r.counselor_reply ?? undefined,
  createdAt: r.created_at,
})

const toSession = (r: any): SessionRow => ({
  id: r.id,
  studentId: r.student_id,
  counselorId: r.counselor_id,
  date: r.date,
  time: r.time?.slice(0, 5) ?? undefined,
  mode: r.mode,
  topic: r.topic,
  summary: r.summary ?? undefined,
  nextSteps: r.next_steps ?? undefined,
  status: r.status,
  createdAt: r.created_at,
})

const toFeedback = (r: any): Feedback => ({
  id: r.id,
  targetType: r.target_type,
  targetId: r.target_id,
  studentId: r.student_id,
  authorId: r.author_id,
  authorName: r.profiles?.full_name,
  authorRole: r.profiles?.role,
  kind: r.kind,
  body: r.body,
  meta: r.meta ?? undefined,
  createdAt: r.created_at,
})

const toExam = (r: any): Exam => ({
  id: r.id,
  studentId: r.student_id,
  counselorId: r.counselor_id,
  title: r.title,
  date: r.date,
  scope: r.scope,
  note: r.note ?? undefined,
  createdAt: r.created_at,
})

const toExamSubject = (r: any): ExamSubject => ({
  id: r.id,
  examId: r.exam_id,
  subject: r.subject,
  total: r.total ?? 0,
  correct: r.correct ?? 0,
  wrong: r.wrong ?? 0,
  blank: r.blank ?? 0,
  percent: r.percent === null || r.percent === undefined ? undefined : Number(r.percent),
  targetPercent: r.target_percent === null || r.target_percent === undefined ? undefined : Number(r.target_percent),
  note: r.note ?? undefined,
})

const toMistake = (r: any): ExamMistake => ({
  id: r.id,
  examId: r.exam_id,
  studentId: r.student_id,
  subject: r.subject ?? '',
  reason: r.reason,
  note: r.note ?? undefined,
  resolved: !!r.resolved,
  createdAt: r.created_at,
  examTitle: r.exams?.title,
  examDate: r.exams?.date,
})

const toPlanTemplate = (r: any): PlanTemplate => ({
  id: r.id,
  counselorId: r.counselor_id,
  title: r.title,
  kind: r.kind,
  note: r.note ?? undefined,
  items: Array.isArray(r.items) ? r.items : [],
  createdAt: r.created_at,
})

const toTaskTemplate = (r: any): TaskTemplate => ({
  id: r.id,
  counselorId: r.counselor_id,
  title: r.title,
  description: r.description ?? undefined,
  category: r.category ?? undefined,
  days: r.days ?? 7,
  createdAt: r.created_at,
})

export class SupabaseBackend implements Backend {
  readonly mode = 'supabase' as const

  private sb() {
    if (!supabase) throw new Error('Supabase پیکربندی نشده است')
    return supabase
  }

  private async me(): Promise<Profile | null> {
    const sb = this.sb()
    const { data } = await sb.auth.getUser()
    if (!data.user) return null
    const { data: row } = await sb.from('profiles').select('*').eq('id', data.user.id).maybeSingle()
    if (!row) {
      // اگر تریگر پروفایل اجرا نشده باشد، پروفایل را از متادیتا می‌سازیم
      const meta: any = data.user.user_metadata || {}
      const { data: created } = await sb
        .from('profiles')
        .upsert({
          id: data.user.id,
          phone: meta.phone || '',
          full_name: meta.full_name || meta.fullName || 'کاربر',
          role: meta.role || 'student',
        })
        .select()
        .maybeSingle()
      return created ? toProfile(created) : null
    }
    return toProfile(row)
  }

  // ── auth ──
  async signIn(phone: string, password: string) {
    const sb = this.sb()
    // مدیر با ایمیل وارد می‌شود؛ بقیه با شماره موبایل (که به ایمیل داخلی نگاشت می‌شود)
    const id = phone.trim()
    const email = id.includes('@') ? id.toLowerCase() : phoneToEmail(phone)
    const { error } = await sb.auth.signInWithPassword({ email, password })
    if (error) {
      const msg = /Invalid login/i.test(error.message)
        ? 'شماره یا رمز عبور درست نیست'
        : /Email not confirmed/i.test(error.message)
          ? 'حساب تأییدنشده است؛ در Supabase گزینه‌ی «Confirm email» را خاموش کنید'
          : error.message
      throw new Error(msg)
    }
    const me = await this.me()
    if (!me) throw new Error('پروفایل کاربر پیدا نشد')
    return me
  }

  async signUp(input: SignUpInput) {
    const sb = this.sb()
    const phone = normalizePhone(input.phone)
    const email = phoneToEmail(phone)
    const code = (input.inviteCode || '').trim().toUpperCase()
    if (input.role === 'counselor') {
      // ثبت‌نام مشاور فقط با کد دعوت مدیر؛ اعتبارسنجی نهایی داخل دیتابیس هم انجام می‌شود
      if (!code) throw new Error('ثبت‌نام مشاور فقط با کد دعوت مدیر رادمهر امکان‌پذیر است')
      const { data: ok, error: chkErr } = await sb.rpc('check_counselor_invite', { p_code: code })
      if (chkErr) throw new Error(chkErr.message)
      if (!ok) throw new Error('کد دعوت مشاور نامعتبر، منقضی یا قبلاً استفاده شده است')
    }
    const meta: Record<string, unknown> = {
      phone,
      full_name: input.fullName,
      role: input.role,
      grade: input.grade,
      field: input.field,
      school: input.school,
      relation: input.relation,
      ...(input.role === 'counselor' ? { invite_code: code } : {}),
    }
    const { data, error } = await sb.auth.signUp({ email, password: input.password, options: { data: meta } })
    if (error) {
      // اگر ثبت‌نام عمومی بسته است، از Edge Function با کلید سرویس استفاده می‌کنیم
      const fb = await this.signUpViaFunction(email, input.password, meta)
      if (!fb) throw new Error(error.message)
    }
    if (!data?.session) {
      const fb = await this.signUpViaFunction(email, input.password, meta)
      if (!fb) {
        throw new Error(
          'حساب ساخته شد ولی نیاز به تأیید ایمیل دارد. در Supabase مسیر Authentication → Sign In / Providers گزینهٔ «Confirm email» را خاموش کنید یا Edge Function را دیپلوی کنید.',
        )
      }
    }
    const { error: e2 } = await sb.auth.signInWithPassword({ email, password: input.password })
    if (e2) throw new Error(e2.message)
    const me = await this.me()
    if (!me) throw new Error('پروفایل ساخته نشد')
    if (input.role === 'student' && input.inviteCode) {
      try {
        await this.redeemInvite(input.inviteCode)
      } catch {
        /* کد نامعتبر — ادامه می‌دهیم */
      }
    }
    if (input.role === 'parent' && input.childCode) {
      try {
        await this.linkChild(me.id, input.childCode)
      } catch {
        /* ignore */
      }
    }
    return (await this.me()) || me
  }

  private async signUpViaFunction(email: string, password: string, meta: Record<string, unknown>) {
    try {
      const sb = this.sb()
      const { data, error } = await sb.functions.invoke('phone-signup', {
        body: { email, password, metadata: meta },
      })
      if (error) return false
      return !!data?.ok
    } catch {
      return false
    }
  }

  async redeemInvite(code: string): Promise<string | null> {
    const sb = this.sb()
    const { data, error } = await sb.rpc('redeem_invite', { p_code: code.trim().toUpperCase() })
    if (error) throw new Error(error.message)
    return (data as string) || null
  }

  async signOut() {
    await this.sb().auth.signOut()
  }

  async currentProfile() {
    const sb = this.sb()
    const { data } = await sb.auth.getSession()
    if (!data.session) return null
    return this.me()
  }

  async updatePassword(newPassword: string) {
    const { error } = await this.sb().auth.updateUser({ password: newPassword })
    if (error) throw new Error(error.message)
  }

  // ── profiles ──
  async getProfile(id: string) {
    const { data } = await this.sb().from('profiles').select('*').eq('id', id).maybeSingle()
    return data ? toProfile(data) : null
  }

  async listProfiles() {
    const { data, error } = await this.sb().from('profiles').select('*').order('created_at')
    if (error) throw new Error(error.message)
    return (data || []).map(toProfile)
  }

  async updateProfile(id: string, patch: Partial<Profile>) {
    const { data, error } = await this.sb().from('profiles').update(profilePatch(patch)).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return toProfile(data)
  }

  // ── links ──
  async listStudents(counselorId: string) {
    const sb = this.sb()
    const { data: links } = await sb.from('counselor_students').select('student_id').eq('counselor_id', counselorId)
    const ids = (links || []).map((l: any) => l.student_id)
    if (!ids.length) return []
    const { data, error } = await sb.from('profiles').select('*').in('id', ids)
    if (error) throw new Error(error.message)
    return (data || []).map(toProfile)
  }

  async linkStudent(counselorId: string, studentId: string) {
    const { error } = await this.sb()
      .from('counselor_students')
      .upsert({ counselor_id: counselorId, student_id: studentId })
    if (error) throw new Error(error.message)
  }

  async unlinkStudent(counselorId: string, studentId: string) {
    const { error } = await this.sb()
      .from('counselor_students')
      .delete()
      .eq('counselor_id', counselorId)
      .eq('student_id', studentId)
    if (error) throw new Error(error.message)
  }

  async listChildren(parentId: string) {
    const sb = this.sb()
    const { data: links } = await sb.from('parent_students').select('student_id').eq('parent_id', parentId)
    const ids = (links || []).map((l: any) => l.student_id)
    if (!ids.length) return []
    const { data } = await sb.from('profiles').select('*').in('id', ids)
    return (data || []).map(toProfile)
  }

  async linkChild(parentId: string, code: string) {
    const sb = this.sb()
    const phone = normalizePhone(code)
    const { data, error } = await sb
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .or(`phone.eq.${phone},id.eq.${code}`)
      .maybeSingle()
    if (error || !data) throw new Error('دانش‌آموزی با این اطلاعات پیدا نشد')
    const child = toProfile(data)
    await sb.from('parent_students').upsert({ parent_id: parentId, student_id: child.id })
    await sb.from('profiles').update({ child_id: child.id }).eq('id', parentId)
    return child
  }

  // ── invites ──
  async createInvite(input: { role: Invite['role']; createdBy: string; studentId?: string | null; note?: string }) {
    const sb = this.sb()
    const { data, error } = await sb.rpc('create_invite', {
      p_role: input.role,
      p_student: input.studentId ?? null,
      p_note: input.note ?? null,
    })
    if (error) throw new Error(error.message)
    const r: any = data
    return {
      code: r.code,
      role: r.role,
      createdBy: r.created_by,
      studentId: r.student_id,
      note: r.note,
      createdAt: r.created_at,
      expiresAt: r.expires_at,
      usedBy: r.used_by,
      usedAt: r.used_at,
    } as Invite
  }

  async listInvites(createdBy: string) {
    const { data, error } = await this.sb()
      .from('invites')
      .select('*')
      .eq('created_by', createdBy)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data || []).map(
      (r: any): Invite => ({
        code: r.code,
        role: r.role,
        createdBy: r.created_by,
        studentId: r.student_id,
        note: r.note,
        createdAt: r.created_at,
        expiresAt: r.expires_at,
        usedBy: r.used_by,
        usedAt: r.used_at,
      }),
    )
  }

  // ── plans ──
  async listPlans(studentId: string) {
    const { data, error } = await this.sb()
      .from('plans')
      .select('*')
      .eq('student_id', studentId)
      .order('start_date', { ascending: false })
    if (error) throw new Error(error.message)
    return (data || []).map(toPlan)
  }

  async getPlan(id: string) {
    const { data } = await this.sb().from('plans').select('*').eq('id', id).maybeSingle()
    return data ? toPlan(data) : null
  }

  async listPlanItems(planId: string) {
    const { data, error } = await this.sb()
      .from('plan_items')
      .select('*')
      .eq('plan_id', planId)
      .order('date')
      .order('start_time')
    if (error) throw new Error(error.message)
    return (data || []).map(toItem)
  }

  async listPlanItemsByRange(studentId: string, fromIso: string, toIso: string) {
    const sb = this.sb()
    const { data: plans } = await sb.from('plans').select('id').eq('student_id', studentId).neq('status', 'archived')
    const ids = (plans || []).map((p: any) => p.id)
    if (!ids.length) return []
    const { data, error } = await sb
      .from('plan_items')
      .select('*')
      .in('plan_id', ids)
      .gte('date', fromIso)
      .lte('date', toIso)
      .order('date')
      .order('start_time')
    if (error) throw new Error(error.message)
    return (data || []).map(toItem)
  }

  async createPlan(input: Partial<Plan> & { studentId: string; counselorId: string; title: string }) {
    const sb = this.sb()
    const { data, error } = await sb
      .from('plans')
      .insert({
        student_id: input.studentId,
        counselor_id: input.counselorId,
        title: input.title,
        kind: input.kind ?? 'week',
        start_date: input.startDate,
        end_date: input.endDate,
        status: input.status ?? 'draft',
        visibility: input.visibility ?? 'student_editable',
        parent_share: input.parentShare ?? 'shared',
        note: input.note ?? null,
        created_by: input.createdBy ?? input.counselorId,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return toPlan(data)
  }

  async updatePlan(id: string, patch: Partial<Plan>) {
    const { data, error } = await this.sb().from('plans').update(planPatch(patch)).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return toPlan(data)
  }

  async deletePlan(id: string) {
    const { error } = await this.sb().from('plans').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }

  async saveItem(item: Partial<PlanItem> & { planId: string }) {
    const sb = this.sb()
    if (item.id) {
      const { data, error } = await sb.from('plan_items').update(itemPatch(item)).eq('id', item.id).select().single()
      if (error) throw new Error(error.message)
      return toItem(data)
    }
    const { data, error } = await sb
      .from('plan_items')
      .insert(itemPatch(item))
      .select()
      .single()
    if (error) throw new Error(error.message)
    return toItem(data)
  }

  async deleteItem(id: string) {
    const { error } = await this.sb().from('plan_items').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }

  // ── tasks ──
  async listTasks(studentId: string) {
    const { data, error } = await this.sb()
      .from('tasks')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data || []).map(toTask)
  }

  async saveTask(task: Partial<Task> & { studentId: string }) {
    const sb = this.sb()
    const patch: Record<string, unknown> = { student_id: task.studentId, updated_at: new Date().toISOString() }
    if (task.title !== undefined) patch.title = task.title
    if (task.description !== undefined) patch.description = task.description
    if (task.dueDate !== undefined) patch.due_date = task.dueDate
    if (task.status !== undefined) patch.status = task.status
    if (task.studentNote !== undefined) patch.student_note = task.studentNote
    if (task.counselorFeedback !== undefined) patch.counselor_feedback = task.counselorFeedback
    if (task.counselorId !== undefined) patch.counselor_id = task.counselorId
    if (task.id) {
      const { data, error } = await sb.from('tasks').update(patch).eq('id', task.id).select().single()
      if (error) throw new Error(error.message)
      return toTask(data)
    }
    const { data, error } = await sb.from('tasks').insert(patch).select().single()
    if (error) throw new Error(error.message)
    return toTask(data)
  }

  async deleteTask(id: string) {
    const { error } = await this.sb().from('tasks').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }

  // ── checkins ──
  async listCheckins(studentId: string, limit = 30) {
    const { data, error } = await this.sb()
      .from('checkins')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false })
      .limit(limit)
    if (error) throw new Error(error.message)
    return (data || []).map(toCheckin)
  }

  async saveCheckin(checkin: Partial<Checkin> & { studentId: string; date: string }) {
    const sb = this.sb()
    const patch: Record<string, unknown> = { student_id: checkin.studentId, date: checkin.date }
    ;(['mood', 'energy', 'focus'] as const).forEach((k) => {
      if (checkin[k] !== undefined) patch[k] = checkin[k]
    })
    if (checkin.studyMinutes !== undefined) patch.study_minutes = checkin.studyMinutes
    if (checkin.sleepHours !== undefined) patch.sleep_hours = checkin.sleepHours
    if (checkin.screenHours !== undefined) patch.screen_hours = checkin.screenHours
    if (checkin.exerciseMinutes !== undefined) patch.exercise_minutes = checkin.exerciseMinutes
    if (checkin.leisure !== undefined) patch.leisure = checkin.leisure
    if (checkin.note !== undefined) patch.note = checkin.note
    if (checkin.counselorReply !== undefined) patch.counselor_reply = checkin.counselorReply
    const { data, error } = await sb
      .from('checkins')
      .upsert(patch, { onConflict: 'student_id,date' })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return toCheckin(data)
  }

  // ── sessions ──
  async listSessions(studentId: string) {
    const { data, error } = await this.sb()
      .from('sessions')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false })
    if (error) throw new Error(error.message)
    return (data || []).map(toSession)
  }

  async saveSession(session: Partial<SessionRow> & { studentId: string }) {
    const sb = this.sb()
    const patch: Record<string, unknown> = { student_id: session.studentId }
    if (session.date !== undefined) patch.date = session.date
    if (session.time !== undefined) patch.time = session.time
    if (session.mode !== undefined) patch.mode = session.mode
    if (session.topic !== undefined) patch.topic = session.topic
    if (session.summary !== undefined) patch.summary = session.summary
    if (session.nextSteps !== undefined) patch.next_steps = session.nextSteps
    if (session.status !== undefined) patch.status = session.status
    if (session.counselorId !== undefined) patch.counselor_id = session.counselorId
    if (session.id) {
      const { data, error } = await sb.from('sessions').update(patch).eq('id', session.id).select().single()
      if (error) throw new Error(error.message)
      return toSession(data)
    }
    const { data, error } = await sb.from('sessions').insert(patch).select().single()
    if (error) throw new Error(error.message)
    return toSession(data)
  }

  async deleteSession(id: string) {
    const { error } = await this.sb().from('sessions').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }

  // ── feedback ──
  async listFeedback(filter: { targetType?: string; targetId?: string; studentId?: string; limit?: number }) {
    let q = this.sb().from('feedback').select('*, profiles:author_id(full_name, role)')
    if (filter.targetType) q = q.eq('target_type', filter.targetType)
    if (filter.targetId) q = q.eq('target_id', filter.targetId)
    if (filter.studentId) q = q.eq('student_id', filter.studentId)
    q = q.order('created_at', { ascending: true })
    if (filter.limit) q = q.limit(filter.limit)
    const { data, error } = await q
    if (error) throw new Error(error.message)
    return (data || []).map(toFeedback)
  }

  async addFeedback(input: Omit<Feedback, 'id' | 'createdAt'>) {
    const { data, error } = await this.sb()
      .from('feedback')
      .insert({
        target_type: input.targetType,
        target_id: input.targetId,
        student_id: input.studentId,
        author_id: input.authorId,
        kind: input.kind,
        body: input.body,
        meta: input.meta ?? null,
      })
      .select('*, profiles:author_id(full_name, role)')
      .single()
    if (error) throw new Error(error.message)
    return toFeedback(data)
  }

  // ── notifications ──
  async listNotifications(userId: string) {
    const { data } = await this.sb()
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)
    return (data || []).map(
      (r: any): Notification => ({
        id: r.id,
        userId: r.user_id,
        title: r.title,
        body: r.body,
        link: r.link,
        read: r.read,
        createdAt: r.created_at,
      }),
    )
  }

  async markNotificationsRead(userId: string) {
    await this.sb().from('notifications').update({ read: true }).eq('user_id', userId)
  }

  // ── آزمون‌ها ────────────────────────────────────────────────
  async listExams(studentId: string) {
    const { data, error } = await this.sb()
      .from('exams')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false })
    if (error) throw new Error(error.message)
    return (data || []).map(toExam)
  }

  async getExam(id: string) {
    const { data } = await this.sb().from('exams').select('*').eq('id', id).maybeSingle()
    return data ? toExam(data) : null
  }

  async saveExam(exam: Partial<Exam> & { studentId: string }) {
    const sb = this.sb()
    const patch: Record<string, unknown> = { student_id: exam.studentId }
    if (exam.title !== undefined) patch.title = exam.title
    if (exam.date !== undefined) patch.date = exam.date
    if (exam.scope !== undefined) patch.scope = exam.scope
    if (exam.note !== undefined) patch.note = exam.note
    if (exam.counselorId !== undefined) patch.counselor_id = exam.counselorId
    if (exam.id) {
      const { data, error } = await sb.from('exams').update(patch).eq('id', exam.id).select().single()
      if (error) throw new Error(error.message)
      return toExam(data)
    }
    const { data, error } = await sb.from('exams').insert(patch).select().single()
    if (error) throw new Error(error.message)
    return toExam(data)
  }

  async deleteExam(id: string) {
    const { error } = await this.sb().from('exams').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }

  async listExamSubjects(examId: string) {
    const { data, error } = await this.sb().from('exam_subjects').select('*').eq('exam_id', examId).order('subject')
    if (error) throw new Error(error.message)
    return (data || []).map(toExamSubject)
  }

  async saveExamSubject(subject: Partial<ExamSubject> & { examId: string }) {
    const sb = this.sb()
    const patch: Record<string, unknown> = { exam_id: subject.examId }
    if (subject.subject !== undefined) patch.subject = subject.subject
    if (subject.total !== undefined) patch.total = subject.total
    if (subject.correct !== undefined) patch.correct = subject.correct
    if (subject.wrong !== undefined) patch.wrong = subject.wrong
    if (subject.blank !== undefined) patch.blank = subject.blank
    if (subject.percent !== undefined) patch.percent = subject.percent
    if (subject.targetPercent !== undefined) patch.target_percent = subject.targetPercent
    if (subject.note !== undefined) patch.note = subject.note
    if (subject.id) {
      const { data, error } = await sb.from('exam_subjects').update(patch).eq('id', subject.id).select().single()
      if (error) throw new Error(error.message)
      return toExamSubject(data)
    }
    const { data, error } = await sb.from('exam_subjects').insert(patch).select().single()
    if (error) throw new Error(error.message)
    return toExamSubject(data)
  }

  async deleteExamSubject(id: string) {
    const { error } = await this.sb().from('exam_subjects').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }

  async listMistakes(studentId: string, examId?: string) {
    let q = this.sb().from('mistakes').select('*, exams:exam_id(title, date)').eq('student_id', studentId)
    if (examId) q = q.eq('exam_id', examId)
    q = q.order('created_at', { ascending: false })
    const { data, error } = await q
    if (error) throw new Error(error.message)
    return (data || []).map(toMistake)
  }

  async saveMistake(mistake: Partial<ExamMistake> & { studentId: string; examId: string }) {
    const sb = this.sb()
    const patch: Record<string, unknown> = { student_id: mistake.studentId, exam_id: mistake.examId }
    if (mistake.subject !== undefined) patch.subject = mistake.subject
    if (mistake.reason !== undefined) patch.reason = mistake.reason
    if (mistake.note !== undefined) patch.note = mistake.note
    if (mistake.resolved !== undefined) patch.resolved = mistake.resolved
    if (mistake.id) {
      const { data, error } = await sb.from('mistakes').update(patch).eq('id', mistake.id).select().single()
      if (error) throw new Error(error.message)
      return toMistake(data)
    }
    const { data, error } = await sb.from('mistakes').insert(patch).select().single()
    if (error) throw new Error(error.message)
    return toMistake(data)
  }

  async deleteMistake(id: string) {
    const { error } = await this.sb().from('mistakes').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }

  // ── قالب برنامه ─────────────────────────────────────────────
  async listPlanTemplates(counselorId: string) {
    const { data, error } = await this.sb()
      .from('plan_templates')
      .select('*')
      .eq('counselor_id', counselorId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data || []).map(toPlanTemplate)
  }

  async savePlanTemplate(t: Omit<PlanTemplate, 'id' | 'createdAt'>) {
    const { data, error } = await this.sb()
      .from('plan_templates')
      .insert({
        counselor_id: t.counselorId,
        title: t.title,
        kind: t.kind,
        note: t.note ?? null,
        items: t.items,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return toPlanTemplate(data)
  }

  async deletePlanTemplate(id: string) {
    const { error } = await this.sb().from('plan_templates').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }

  async applyPlanTemplate(input: { templateId: string; studentId: string; counselorId: string; startDate: string; title?: string }) {
    const { data, error } = await this.sb().rpc('apply_plan_template', {
      p_template: input.templateId,
      p_student: input.studentId,
      p_start: input.startDate,
      p_title: input.title ?? null,
    })
    if (error) throw new Error(error.message)
    const planId = (data as any)?.plan_id || data
    const plan = await this.getPlan(String(planId))
    if (!plan) throw new Error('ساخت برنامه از قالب ناموفق بود')
    return plan
  }

  // ── قالب تمرین ──────────────────────────────────────────────
  async listTaskTemplates(counselorId: string) {
    const { data, error } = await this.sb()
      .from('task_templates')
      .select('*')
      .eq('counselor_id', counselorId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data || []).map(toTaskTemplate)
  }

  async saveTaskTemplate(t: Omit<TaskTemplate, 'id' | 'createdAt'>) {
    const { data, error } = await this.sb()
      .from('task_templates')
      .insert({
        counselor_id: t.counselorId,
        title: t.title,
        description: t.description ?? null,
        category: t.category ?? null,
        days: t.days,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return toTaskTemplate(data)
  }

  async deleteTaskTemplate(id: string) {
    const { error } = await this.sb().from('task_templates').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }

}

export const supabaseAvailable = () => isSupabaseConfigured
