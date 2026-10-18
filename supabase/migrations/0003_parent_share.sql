-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  هم‌قدم — حریم خصوصی: کنترل اشتراک برنامه با والدین                        ║
-- ║  بعد از 0002 اجرا کنید.                                                    ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

alter table public.plans
  add column if not exists parent_share text not null default 'shared'
  check (parent_share in ('shared', 'hidden'));

-- والدین برنامه‌های «پنهان» را نمی‌بینند
drop policy if exists plans_select on public.plans;
create policy plans_select on public.plans for select to authenticated
using (
  (public.can_edit_student(student_id) or student_id = auth.uid())
    and (visibility <> 'private' or public.can_edit_student(student_id))
  or (public.is_parent_of(student_id) and parent_share = 'shared')
);

-- آیتم‌های برنامه‌ی پنهان هم برای والد قابل مشاهده نیستند
drop policy if exists items_select on public.plan_items;
create policy items_select on public.plan_items for select to authenticated
using (
  exists (
    select 1 from public.plans p
    where p.id = plan_id
      and (
        ((public.can_edit_student(p.student_id) or p.student_id = auth.uid())
          and (p.visibility <> 'private' or public.can_edit_student(p.student_id)))
        or (public.is_parent_of(p.student_id) and p.parent_share = 'shared')
      )
  )
);
