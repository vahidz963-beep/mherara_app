-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  رادمهر — ثبت پیشرفت مطالعه: تست‌ها، مراحل مطالعه، فضای مجازی، ورزش و تفریح ║
-- ║  بعد از 0004 اجرا کنید.                                                    ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ۱) روی هر بلوک برنامه: تعداد تست‌ها و مراحل مطالعه‌ی اجراشده (۱ تا ۷)
alter table public.plan_items
  add column if not exists tests_total   int,
  add column if not exists tests_correct int,
  add column if not exists stages        jsonb not null default '[]'::jsonb;

alter table public.plan_items
  drop constraint if exists plan_items_tests_check;
alter table public.plan_items
  add constraint plan_items_tests_check
  check (
    (tests_total is null or tests_total >= 0)
    and (tests_correct is null or tests_correct >= 0)
    and (tests_total is null or tests_correct is null or tests_correct <= tests_total)
  );

-- ۲) در چک‌این روزانه: فضای مجازی، ورزش و تفریح‌های سالم
alter table public.checkins
  add column if not exists screen_hours     numeric(4,1),
  add column if not exists exercise_minutes int not null default 0,
  add column if not exists leisure          text[] not null default '{}';

-- ۳) خلاصه‌ی تست‌های هر برنامه در یک تابع خوانا (برای نمایش کسری: صحیح/کل)
create or replace function public.plan_test_summary(p_plan uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'total',   coalesce(sum(coalesce(tests_total, 0)), 0),
    'correct', coalesce(sum(coalesce(tests_correct, 0)), 0),
    'items_with_tests', count(*) filter (where tests_total is not null),
    'stages_used', (select coalesce(jsonb_agg(distinct s), '[]'::jsonb)
                    from public.plan_items pi2, jsonb_array_elements_text(pi2.stages) s
                    where pi2.plan_id = p_plan)
  )
  from public.plan_items
  where plan_id = p_plan
    and (public.can_view_student(public.plan_student(p_plan)));
$$;

grant execute on function public.plan_test_summary(uuid) to authenticated;
