-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  هم‌قدم — سخت‌تر کردن حریم کدهای دعوت                                       ║
-- ║  بعد از 0003 اجرا کنید.                                                    ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- قبل از این مایگریشن، هر کاربر واردشده می‌توانست فهرست کدهای استفاده‌نشده را
-- بخواند (سیاست invites_select). حالا فقط سازنده‌ی کد آن را می‌بیند و
-- استفاده از کد صرفاً از مسیر تابع امن redeem_invite (SECURITY DEFINER) انجام می‌شود.

drop policy if exists invites_select on public.invites;
create policy invites_select on public.invites for select to authenticated
using (created_by = auth.uid() or public.is_admin());

-- تابع redeem_invite از RLS عبور می‌کند (SECURITY DEFINER) و کد را اعتبارسنجی می‌کند،
-- پس کاربران نیازی به خواندن جدول ندارند.
grant execute on function public.redeem_invite(text) to authenticated;
grant execute on function public.create_invite(text, uuid, text) to authenticated;
