-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  رادمهر — مایگریشن ۷: ثبت‌نام مشاور فقط با کد دعوت مدیر                      ║
-- ║  پیش‌نیاز: ۰۰۰۱ تا ۰۰۰۶ اجرا شده باشند.                                      ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ─────────────────────────────────────────────────────────────────────────────
-- ۱) ساخت کد دعوت مشاور فقط توسط مدیر؛ اعتبار ۱۴ روز
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.create_invite(p_role text, p_student uuid default null, p_note text default null)
returns public.invites language plpgsql security definer set search_path = public as $$
declare
  v_code text;
  v_role text := coalesce(nullif(p_role, ''), 'student');
  v_row public.invites;
begin
  if auth.uid() is null then raise exception 'ورود لازم است'; end if;
  if v_role not in ('student', 'parent', 'counselor') then
    raise exception 'نوع دعوت نامعتبر است';
  end if;
  if v_role = 'counselor' and not public.is_admin() then
    raise exception 'فقط مدیر می‌تواند کد دعوت مشاور بسازد';
  end if;

  loop
    v_code := upper(substr(translate(encode(gen_random_bytes(6), 'base64'), '+/=0OIl', 'ABCDEFGH'), 1, 6));
    exit when not exists (select 1 from public.invites where code = v_code);
  end loop;

  insert into public.invites (code, role, created_by, student_id, note, expires_at)
  values (
    v_code,
    v_role,
    auth.uid(),
    p_student,
    p_note,
    case when v_role = 'counselor' then now() + interval '14 days' else now() + interval '30 days' end
  )
  returning * into v_row;

  return v_row;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- ۲) بررسی سریع کد مشاور قبل از ثبت‌نام (برای پیام خطای واضح در فرم)
--    فقط «معتبر است/نیست» برمی‌گرداند؛ اطلاعات دیگری از جدول فاش نمی‌شود.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.check_counselor_invite(p_code text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.invites
    where code = upper(trim(coalesce(p_code, '')))
      and role = 'counselor'
      and used_by is null
      and (expires_at is null or expires_at > now())
  );
$$;
grant execute on function public.check_counselor_invite(text) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- ۳) ساخت پروفایل: مشاور بدون کد معتبر ساخته نمی‌شود
--    این بررسی داخل خود دیتابیس انجام می‌شود، پس دور زدن آن از اپ ممکن نیست.
--    اگر کد نامعتبر باشد، کل ثبت‌نام (حساب احراز هویت) rollback می‌شود.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_phone text := coalesce(meta ->> 'phone', split_part(new.email, '@', 1));
  v_role text := coalesce(nullif(meta ->> 'role', ''), 'student');
  v_code text := upper(trim(coalesce(meta ->> 'invite_code', '')));
begin
  -- مدیر فقط از طریق bootstrap_admin ساخته می‌شود
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

  if v_role = 'counselor' then
    update public.invites
      set used_by = new.id, used_at = now()
      where code = v_code
        and role = 'counselor'
        and used_by is null
        and (expires_at is null or expires_at > now());
    if not found then
      raise exception 'کد دعوت مشاور نامعتبر، منقضی یا قبلاً استفاده شده است';
    end if;
  end if;

  return new;
end $$;
