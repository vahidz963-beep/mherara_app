-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  رادمهر — مایگریشن ۶: ساخت مدیر اصلی + رفع یک آسیب‌پذیری امنیتی             ║
-- ║  پیش‌نیاز: ۰۰۰۱ تا ۰۰۰۵ اجرا شده باشند.                                      ║
-- ║  در Supabase → SQL Editor اجرا کنید (یک‌بار).                              ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ─────────────────────────────────────────────────────────────────────────────
-- ۱) رفع آسیب‌پذیری: قبلاً هر کاربری می‌توانست در ثبت‌نام، نقش «admin» را در
--    متادیتا بفرستد و مستقیم مدیر شود. حالا فقط نقش‌های مجاز پذیرفته می‌شوند.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_phone text := coalesce(meta ->> 'phone', split_part(new.email, '@', 1));
  v_role text := coalesce(nullif(meta ->> 'role', ''), 'student');
begin
  -- مدیر فقط از طریق bootstrap_admin (یا توسط یک مدیر موجود) ساخته می‌شود
  if v_role not in ('student', 'parent', 'counselor') then
    v_role := 'student';
  end if;

  insert into public.profiles (id, phone, full_name, role, grade, field, school, relation)
  values (
    new.id,
    nullif(v_phone, ''),
    coalesce(nullif(meta ->> 'full_name', ''), 'کاربر جدید'),
    v_role,
    nullif(meta ->> 'grade', ''),
    nullif(meta ->> 'field', ''),
    nullif(meta ->> 'school', ''),
    nullif(meta ->> 'relation', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- ۲) محافظ تغییر نقش: هیچ کاربر عادی‌ای (حتی برای خودش) نمی‌تواند نقشش را عوض کند.
--    تغییر نقش فقط وقتی مجاز است که:
--    • از SQL Editor یا سرویس مدیریتی اجرا شود (auth.uid() برابر null است)، یا
--    • کاربر فعلی خودش مدیر باشد.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role then
    if auth.uid() is not null and not public.is_admin() then
      raise exception 'تغییر نقش فقط توسط مدیر مجاز است';
    end if;
  end if;
  return new;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- ۳) تابع ساخت/ارتقای مدیر اصلی — فقط از SQL Editor (نقش postgres) یا service_role
--    قابل اجراست؛ کلید anon و کاربران عادی به آن دسترسی ندارند.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.bootstrap_admin(p_email text, p_name text default 'مدیر رادمهر')
returns text language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  select id into v_id from auth.users where lower(email) = lower(trim(p_email));
  if v_id is null then
    raise exception 'کاربری با ایمیل % پیدا نشد. اول در Authentication → Users آن را بسازید (Auto Confirm User را تیک بزنید).', p_email;
  end if;

  insert into public.profiles (id, phone, full_name, role, is_active)
  values (v_id, null, p_name, 'admin', true)
  on conflict (id) do update
    set role = 'admin',
        full_name = excluded.full_name,
        is_active = true;

  return 'مدیر اصلی تنظیم شد: ' || lower(trim(p_email));
end $$;

-- فقط نقش‌های مدیریتی می‌توانند این تابع را صدا بزنند
revoke all on function public.bootstrap_admin(text, text) from public, anon, authenticated;
grant execute on function public.bootstrap_admin(text, text) to service_role;
