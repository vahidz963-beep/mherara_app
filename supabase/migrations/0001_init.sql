-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  هم‌قدم — اسکیمای پایه                                                    ║
-- ║  در Supabase → SQL Editor اجرا کنید (یک‌بار).                              ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────────
-- ۱) پروفایل‌ها (مشاور / دانش‌آموز / والد / مدیر)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  phone        text unique,
  full_name    text not null default 'کاربر',
  role         text not null default 'student' check (role in ('counselor', 'student', 'parent', 'admin')),
  grade        text,
  field        text,
  school       text,
  counselor_id uuid references public.profiles (id) on delete set null,
  child_id     uuid references public.profiles (id) on delete set null,
  relation     text,
  bio          text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- ۲) اتصال‌ها
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.counselor_students (
  counselor_id uuid not null references public.profiles (id) on delete cascade,
  student_id   uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (counselor_id, student_id)
);

create table if not exists public.parent_students (
  parent_id  uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  relation   text,
  created_at timestamptz not null default now(),
  primary key (parent_id, student_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- ۳) کدهای دعوت
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.invites (
  code       text primary key,
  role       text not null default 'student' check (role in ('student', 'parent', 'counselor')),
  created_by uuid not null references public.profiles (id) on delete cascade,
  student_id uuid references public.profiles (id) on delete set null,
  note       text,
  created_at timestamptz not null default now(),
  expires_at timestamptz default (now() + interval '30 days'),
  used_by    uuid references public.profiles (id) on delete set null,
  used_at    timestamptz
);

-- ─────────────────────────────────────────────────────────────────────────────
-- ۴) برنامه‌ها و آیتم‌ها
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.plans (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.profiles (id) on delete cascade,
  counselor_id uuid references public.profiles (id) on delete set null,
  title        text not null,
  kind         text not null default 'week' check (kind in ('week', 'month', 'day', 'term')),
  start_date   date not null default current_date,
  end_date     date not null default current_date,
  status       text not null default 'draft' check (status in ('draft', 'pending', 'active', 'needs_revision', 'archived')),
  visibility   text not null default 'student_editable' check (visibility in ('private', 'student_view', 'student_editable')),
  note         text,
  created_by   uuid,
  version      int not null default 1,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.plan_items (
  id           uuid primary key default gen_random_uuid(),
  plan_id      uuid not null references public.plans (id) on delete cascade,
  date         date not null default current_date,
  start_time   time,
  subject      text,
  title        text not null,
  kind         text not null default 'study' check (kind in ('study', 'test', 'review', 'rest', 'sport', 'skill', 'other')),
  minutes      int not null default 60,
  priority     text not null default 'mid' check (priority in ('high', 'mid', 'low')),
  note         text,
  done         boolean not null default false,
  done_at      timestamptz,
  student_note text,
  sort         int not null default 0,
  created_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- ۵) تمرین‌ها، چک‌این‌ها، جلسات، بازخورد، اعلان‌ها
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.tasks (
  id                 uuid primary key default gen_random_uuid(),
  student_id         uuid not null references public.profiles (id) on delete cascade,
  counselor_id       uuid references public.profiles (id) on delete set null,
  title              text not null,
  description        text,
  due_date           date,
  status             text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  student_note       text,
  counselor_feedback text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists public.checkins (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references public.profiles (id) on delete cascade,
  date            date not null,
  mood            int not null default 3 check (mood between 1 and 5),
  energy          int not null default 3 check (energy between 1 and 5),
  focus           int not null default 3 check (focus between 1 and 5),
  study_minutes   int not null default 0,
  sleep_hours     numeric(3, 1) not null default 7,
  note            text,
  counselor_reply text,
  created_at      timestamptz not null default now(),
  unique (student_id, date)
);

create table if not exists public.sessions (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.profiles (id) on delete cascade,
  counselor_id uuid references public.profiles (id) on delete set null,
  date         date not null default current_date,
  time         time,
  mode         text not null default 'online' check (mode in ('online', 'in_person', 'phone')),
  topic        text not null default 'جلسه‌ی مشاوره',
  summary      text,
  next_steps   text,
  status       text not null default 'scheduled' check (status in ('scheduled', 'done', 'canceled')),
  created_at   timestamptz not null default now()
);

create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('plan', 'item', 'task', 'checkin', 'session', 'student')),
  target_id   uuid not null,
  student_id  uuid not null references public.profiles (id) on delete cascade,
  author_id   uuid not null references public.profiles (id) on delete cascade,
  kind        text not null default 'comment' check (kind in ('comment', 'approve', 'request_change', 'edit', 'reply', 'checkin_reply')),
  body        text not null,
  meta        jsonb,
  created_at  timestamptz not null default now()
);

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  title      text not null,
  body       text,
  link       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_plan_items_plan on public.plan_items (plan_id, date);
create index if not exists idx_plans_student on public.plans (student_id, start_date desc);
create index if not exists idx_checkins_student on public.checkins (student_id, date desc);
create index if not exists idx_feedback_target on public.feedback (target_type, target_id, created_at);
create index if not exists idx_tasks_student on public.tasks (student_id, status);

-- ─────────────────────────────────────────────────────────────────────────────
-- ۶) توابع کمکی برای سیاست‌های دسترسی
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.me_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_counselor_of(sid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.counselor_students cs
    where cs.counselor_id = auth.uid() and cs.student_id = sid
  ) or exists (
    select 1 from public.profiles p where p.id = sid and p.counselor_id = auth.uid()
  );
$$;

create or replace function public.is_parent_of(sid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.parent_students ps
    where ps.parent_id = auth.uid() and ps.student_id = sid
  );
$$;

create or replace function public.can_view_student(sid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select sid = auth.uid() or public.is_admin() or public.is_counselor_of(sid) or public.is_parent_of(sid);
$$;

create or replace function public.can_edit_student(sid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select sid = auth.uid() or public.is_admin() or public.is_counselor_of(sid);
$$;

create or replace function public.plan_student(pid uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select student_id from public.plans where id = pid;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- ۷) ساخت پروفایل خودکار پس از ثبت‌نام (auth.users → profiles)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_phone text := coalesce(meta ->> 'phone', split_part(new.email, '@', 1));
begin
  insert into public.profiles (id, phone, full_name, role, grade, field, school, relation)
  values (
    new.id,
    nullif(v_phone, ''),
    coalesce(nullif(meta ->> 'full_name', ''), 'کاربر جدید'),
    coalesce(nullif(meta ->> 'role', ''), 'student'),
    nullif(meta ->> 'grade', ''),
    nullif(meta ->> 'field', ''),
    nullif(meta ->> 'school', ''),
    nullif(meta ->> 'relation', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- جلوگیری از ارتقای نقش به «مدیر» توسط خود کاربر
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    if new.role = 'admin' then
      raise exception 'تغییر نقش به مدیر مجاز نیست';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists guard_profile_update on public.profiles;
create trigger guard_profile_update
before update on public.profiles
for each row execute function public.guard_profile_update();

-- ─────────────────────────────────────────────────────────────────────────────
-- ۸) RPC: ساخت کد دعوت و استفاده از کد
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.create_invite(p_role text, p_student uuid default null, p_note text default null)
returns public.invites language plpgsql security definer set search_path = public as $$
declare
  v_code text;
  v_row public.invites;
begin
  if auth.uid() is null then raise exception 'ورود لازم است'; end if;
  loop
    v_code := upper(substr(translate(encode(gen_random_bytes(6), 'base64'), '+/=0OIl', 'ABCDEFGH'), 1, 6));
    exit when not exists (select 1 from public.invites where code = v_code);
  end loop;

  insert into public.invites (code, role, created_by, student_id, note)
  values (v_code, coalesce(p_role, 'student'), auth.uid(), p_student, p_note)
  returning * into v_row;

  return v_row;
end $$;

create or replace function public.redeem_invite(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  inv public.invites;
  v_role text;
begin
  if auth.uid() is null then raise exception 'ورود لازم است'; end if;
  select role into v_role from public.profiles where id = auth.uid();

  select * into inv from public.invites
  where code = upper(trim(p_code))
    and used_by is null
    and (expires_at is null or expires_at > now());

  if inv.code is null then raise exception 'کد دعوت نامعتبر یا منقضی است'; end if;

  update public.invites set used_by = auth.uid(), used_at = now() where code = inv.code;

  if v_role = 'student' then
    insert into public.counselor_students (counselor_id, student_id)
    values (inv.created_by, auth.uid()) on conflict do nothing;
    update public.profiles set counselor_id = inv.created_by where id = auth.uid();
  elsif v_role = 'parent' then
    insert into public.parent_students (parent_id, student_id, relation)
    values (auth.uid(), coalesce(inv.student_id, inv.created_by), null) on conflict do nothing;
  end if;

  return inv.created_by;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- ۹) فعال‌سازی RLS و سیاست‌ها
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.profiles          enable row level security;
alter table public.counselor_students enable row level security;
alter table public.parent_students   enable row level security;
alter table public.invites           enable row level security;
alter table public.plans             enable row level security;
alter table public.plan_items        enable row level security;
alter table public.tasks             enable row level security;
alter table public.checkins          enable row level security;
alter table public.sessions          enable row level security;
alter table public.feedback          enable row level security;
alter table public.notifications     enable row level security;

-- profiles
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
using (
  id = auth.uid()
  or public.is_admin()
  or role in ('counselor', 'admin')          -- فهرست مشاوران برای انتخاب/دعوت
  or public.is_counselor_of(id)
  or public.is_parent_of(id)
);

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert to authenticated
with check (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
using (id = auth.uid() or public.is_admin() or public.is_counselor_of(id))
with check (id = auth.uid() or public.is_admin() or public.is_counselor_of(id));

-- counselor_students
drop policy if exists cs_select on public.counselor_students;
create policy cs_select on public.counselor_students for select to authenticated
using (counselor_id = auth.uid() or student_id = auth.uid() or public.is_admin());

drop policy if exists cs_write on public.counselor_students;
create policy cs_write on public.counselor_students for all to authenticated
using (counselor_id = auth.uid() or public.is_admin())
with check (counselor_id = auth.uid() or public.is_admin());

-- parent_students
drop policy if exists ps_select on public.parent_students;
create policy ps_select on public.parent_students for select to authenticated
using (parent_id = auth.uid() or student_id = auth.uid() or public.is_admin());

drop policy if exists ps_write on public.parent_students;
create policy ps_write on public.parent_students for all to authenticated
using (parent_id = auth.uid() or public.is_admin())
with check (parent_id = auth.uid() or public.is_admin());

-- invites
drop policy if exists invites_select on public.invites;
create policy invites_select on public.invites for select to authenticated
using (created_by = auth.uid() or used_by = auth.uid() or used_by is null or public.is_admin());

drop policy if exists invites_insert on public.invites;
create policy invites_insert on public.invites for insert to authenticated
with check (created_by = auth.uid());

drop policy if exists invites_update on public.invites;
create policy invites_update on public.invites for update to authenticated
using (created_by = auth.uid() or used_by is null or public.is_admin())
with check (created_by = auth.uid() or used_by = auth.uid() or public.is_admin());

-- plans
drop policy if exists plans_select on public.plans;
create policy plans_select on public.plans for select to authenticated
using (public.can_view_student(student_id) and (visibility <> 'private' or public.can_edit_student(student_id)));

drop policy if exists plans_insert on public.plans;
create policy plans_insert on public.plans for insert to authenticated
with check (public.can_edit_student(student_id));

drop policy if exists plans_update on public.plans;
create policy plans_update on public.plans for update to authenticated
using (public.can_edit_student(student_id) or (student_id = auth.uid() and visibility <> 'private'))
with check (public.can_edit_student(student_id) or (student_id = auth.uid() and visibility <> 'private'));

drop policy if exists plans_delete on public.plans;
create policy plans_delete on public.plans for delete to authenticated
using (public.can_edit_student(student_id));

-- plan_items
drop policy if exists items_select on public.plan_items;
create policy items_select on public.plan_items for select to authenticated
using (
  exists (
    select 1 from public.plans p
    where p.id = plan_id
      and public.can_view_student(p.student_id)
      and (p.visibility <> 'private' or public.can_edit_student(p.student_id))
  )
);

drop policy if exists items_write on public.plan_items;
create policy items_write on public.plan_items for all to authenticated
using (
  exists (
    select 1 from public.plans p
    where p.id = plan_id
      and (public.can_edit_student(p.student_id) or (p.student_id = auth.uid() and p.visibility = 'student_editable'))
  )
)
with check (
  exists (
    select 1 from public.plans p
    where p.id = plan_id
      and (public.can_edit_student(p.student_id) or (p.student_id = auth.uid() and p.visibility = 'student_editable'))
  )
);

-- tasks
drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks for select to authenticated
using (public.can_view_student(student_id));

drop policy if exists tasks_insert on public.tasks;
create policy tasks_insert on public.tasks for insert to authenticated
with check (public.can_edit_student(student_id));

drop policy if exists tasks_update on public.tasks;
create policy tasks_update on public.tasks for update to authenticated
using (public.can_edit_student(student_id) or student_id = auth.uid())
with check (public.can_edit_student(student_id) or student_id = auth.uid());

drop policy if exists tasks_delete on public.tasks;
create policy tasks_delete on public.tasks for delete to authenticated
using (public.can_edit_student(student_id));

-- checkins
drop policy if exists checkins_select on public.checkins;
create policy checkins_select on public.checkins for select to authenticated
using (public.can_view_student(student_id));

drop policy if exists checkins_insert on public.checkins;
create policy checkins_insert on public.checkins for insert to authenticated
with check (public.can_edit_student(student_id));

drop policy if exists checkins_update on public.checkins;
create policy checkins_update on public.checkins for update to authenticated
using (public.can_view_student(student_id))
with check (public.can_view_student(student_id));

-- sessions
drop policy if exists sessions_select on public.sessions;
create policy sessions_select on public.sessions for select to authenticated
using (public.can_view_student(student_id));

drop policy if exists sessions_write on public.sessions;
create policy sessions_write on public.sessions for all to authenticated
using (public.can_edit_student(student_id))
with check (public.can_edit_student(student_id));

-- feedback
drop policy if exists feedback_select on public.feedback;
create policy feedback_select on public.feedback for select to authenticated
using (public.can_view_student(student_id));

drop policy if exists feedback_insert on public.feedback;
create policy feedback_insert on public.feedback for insert to authenticated
with check (public.can_view_student(student_id) and author_id = auth.uid());

drop policy if exists feedback_update on public.feedback;
create policy feedback_update on public.feedback for update to authenticated
using (author_id = auth.uid() or public.is_admin())
with check (author_id = auth.uid() or public.is_admin());

-- notifications
drop policy if exists notif_select on public.notifications;
create policy notif_select on public.notifications for select to authenticated
using (user_id = auth.uid());

drop policy if exists notif_update on public.notifications;
create policy notif_update on public.notifications for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- ۱۰) به‌روزرسانی خودکار updated_at
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists touch_plans on public.plans;
create trigger touch_plans before update on public.plans
for each row execute function public.touch_updated_at();

drop trigger if exists touch_tasks on public.tasks;
create trigger touch_tasks before update on public.tasks
for each row execute function public.touch_updated_at();
