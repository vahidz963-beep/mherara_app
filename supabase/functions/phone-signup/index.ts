// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  Edge Function: phone-signup                                              ║
// ║  ثبت‌نام «شماره موبایل + رمز» بدون ارسال ایمیل یا پیامک.                    ║
// ║  چرا لازم است؟ چون Supabase برای ورود با رمز به ایمیل نیاز دارد و به‌طور     ║
// ║  پیش‌فرض «تأیید ایمیل» را اجبار می‌کند. این تابع با کلید سرویس، کاربر را     ║
// ║  تأییدشده می‌سازد (email_confirm = true) و ایمیل ساختگی هیچ‌گاه ارسال نمی‌شود. ║
// ║                                                                          ║
// ║  نصب:  supabase functions deploy phone-signup --no-verify-jwt           ║
// ║  (کلید سرویس به‌صورت خودکار در محیط توابع Supabase موجود است)               ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405)

  try {
    const { email, password, metadata } = await req.json()
    if (!email || !password) return json({ ok: false, error: 'email و password لازم است' }, 400)
    if (!String(email).endsWith('@phone.hamghadam.local')) {
      // فقط شماره‌های نگاشت‌شده‌ی هم‌قدم را می‌پذیریم
      return json({ ok: false, error: 'دامنه‌ی ایمیل نامعتبر' }, 400)
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata ?? {},
    })

    if (error) return json({ ok: false, error: error.message }, 400)
    return json({ ok: true, id: data.user?.id })
  } catch (e) {
    return json({ ok: false, error: String((e as Error)?.message || e) }, 500)
  }
})
