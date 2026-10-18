-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  هم‌قدم — افزودنی‌ها: آزمون‌ها، دفتر اشتباهات، قالب‌های برنامه و تمرین      ║
-- ║  بعد از 0001_init.sql در SQL Editor اجرا کنید.                            ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ─────────────────────────────────────────────────────────────────────────────
-- ۱) آزمون‌ها
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.exams (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.profiles (id) on delete cascade,
  counselor_id uuid references public.profiles (id) on delete set null,
  title        text not null,
  date         date not null default current_date,
  scope        text not null default 'mock' check (scope in ('mock', 'school', 'quiz', 'final')),
  note         text,
  created_at   timestamptz not null default now()
);

create table if not exists public.exam_subjects (
  id             uuid primary key default gen_random_uuid(),
  exam_id        uuid not null references public.exams (id) on delete cascade,
  subject        text not null,
  total          int not null default 0,
  correct        int not null default 0,
  wrong          int not null default 0,
  blank          int not null default 0,
  percent        numeric(5, 1),
  target_percent numeric(5, 1),
  note           text
);

-- ─────────────────────────────────────────────────────────────────────────────
-- ۲) دفتر اشتباهات
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.mistakes (
  id         uuid primary key default gen_random_uuid(),
  exam_id    uuid not null references public.exams (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  subject    text,
  reason     text not null default 'knowledge' check (reason in ('careless', 'knowledge', 'time', 'misread', 'other')),
  note       text,
  resolved   boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_exams_student on public.exams (student_id, date desc);
create index if not exists idx_exam_subjects_exam on public.exam_subjects (exam_id);
create index if not exists idx_mistakes_student on public.mistakes (student_id, resolved);

-- ─────────────────────────────────────────────────────────────────────────────
-- ۳) قالب‌های برنامه و تمرین (خصوص مشاور)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.plan_templates (
  id           uuid primary key default gen_random_uuid(),
  counselor_id uuid not null references public.profiles (id) on delete cascade,
  title        text not null,
  kind         text not null default 'week' check (kind in ('week', 'month', 'day', 'term')),
  note         text,
  items        jsonb not null default '[]'::jsonb,
  created_at   timestamptz not null default now()
);

create table if not exists public.task_templates (
  id           uuid primary key default gen_random_uuid(),
  counselor_id uuid not null references public.profiles (id) on delete cascade,
  title        text not null,
  description  text,
  category     text,
  days         int not null default 7,
  created_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- ۴) RLS
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.exams           enable row level security;
alter table public.exam_subjects   enable row level security;
alter table public.mistakes        enable row level security;
alter table public.plan_templates  enable row level security;
alter table public.task_templates  enable row level security;

-- exams
drop policy if exists exams_select on public.exams;
create policy exams_select on public.exams for select to authenticated
using (public.can_view_student(student_id));

drop policy if exists exams_write on public.exams;
create policy exams_write on public.exams for all to authenticated
using (public.can_edit_student(student_id))
with check (public.can_edit_student(student_id));

-- exam_subjects (از طریق آزمون والد)
drop policy if exists exam_subjects_select on public.exam_subjects;
create policy exam_subjects_select on public.exam_subjects for select to authenticated
using (exists (select 1 from public.exams e where e.id = exam_id and public.can_view_student(e.student_id)));

drop policy if exists exam_subjects_write on public.exam_subjects;
create policy exam_subjects_write on public.exam_subjects for all to authenticated
using (exists (select 1 from public.exams e where e.id = exam_id and public.can_edit_student(e.student_id)))
with check (exists (select 1 from public.exams e where e.id = exam_id and public.can_edit_student(e.student_id)));

-- mistakes
drop policy if exists mistakes_select on public.mistakes;
create policy mistakes_select on public.mistakes for select to authenticated
using (public.can_view_student(student_id));

drop policy if exists mistakes_write on public.mistakes;
create policy mistakes_write on public.mistakes for all to authenticated
using (public.can_edit_student(student_id))
with check (public.can_edit_student(student_id));

-- plan_templates / task_templates: فقط صاحب قالب
drop policy if exists plan_templates_all on public.plan_templates;
create policy plan_templates_all on public.plan_templates for all to authenticated
using (counselor_id = auth.uid() or public.is_admin())
with check (counselor_id = auth.uid() or public.is_admin());

drop policy if exists task_templates_all on public.task_templates;
create policy task_templates_all on public.task_templates for all to authenticated
using (counselor_id = auth.uid() or public.is_admin())
with check (counselor_id = auth.uid() or public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- ۵) RPC: ساخت برنامه از قالب (یک تراکنش، بدون رفت‌وبرگشت شبکه)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.apply_plan_template(
  p_template uuid,
  p_student  uuid,
  p_start    date,
  p_title    text default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  tpl      public.plan_templates;
  v_plan   uuid;
  v_end    date;
  it       jsonb;
begin
  if not public.can_edit_student(p_student) then
    raise exception 'دسترسی به این دانش‌آموز مجاز نیست';
  end if;

  select * into tpl from public.plan_templates where id = p_template;
  if tpl.id is null then raise exception 'قالب پیدا نشد'; end if;

  v_end := case when tpl.kind = 'month' then p_start + 29 else p_start + 6 end;

  insert into public.plans (student_id, counselor_id, title, kind, start_date, end_date, status, visibility, note, created_by)
  values (p_student, auth.uid(), coalesce(p_title, tpl.title), tpl.kind, p_start, v_end, 'draft', 'student_editable', tpl.note, auth.uid())
  returning id into v_plan;

  for it in select * from jsonb_array_elements(coalesce(tpl.items, '[]'::jsonb))
  loop
    insert into public.plan_items (plan_id, date, start_time, subject, title, kind, minutes, priority, note)
    values (
      v_plan,
      p_start + coalesce((it ->> 'dayOffset')::int, 0),
      nullif(it ->> 'startTime', '')::time,
      coalesce(it ->> 'subject', ''),
      coalesce(it ->> 'title', 'آیتم'),
      coalesce(nullif(it ->> 'kind', ''), 'study'),
      coalesce((it ->> 'minutes')::int, 60),
      coalesce(nullif(it ->> 'priority', ''), 'mid'),
      nullif(it ->> 'note', '')
    );
  end loop;

  return jsonb_build_object('plan_id', v_plan);
end $$;
