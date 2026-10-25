# انتشار رادمهر روی Cloudflare Pages (مسیر جایگزین Netlify)

این راهنما برای زمانی است که Netlify در دسترس نیست. اپ رادمهر یک سایت **استاتیک** (Vite) است، پس روی Cloudflare Pages هم بدون تغییر کد اجرا می‌شود. فایل `public/_redirects` مسیرهای داخلی (مثل `/c/students`) را به `index.html` می‌فرستد.

## ۱) ساخت حساب و اتصال گیت‌هاب
1. در سایت Cloudflare حساب رایگان بساز.
2. از منوی **Workers & Pages** → **Create** → تب **Pages** → **Connect to Git**.
3. گیت‌هاب را وصل کن و مخزن **radmehr** (یا هر اسمی که برای پروژه گذاشتی) را انتخاب کن.

## ۲) تنظیمات Build
| گزینه | مقدار |
|---|---|
| Framework preset | None (یا Vite) |
| Build command | `npm run build` |
| Build output directory | `dist` (فقط در حالت Pages) |
| Root directory | (خالی) |

**متغیرهای محیطی** (Settings → Environment variables، برای Production و Preview):

| نام | مقدار |
|---|---|
| `VITE_SUPABASE_URL` | Project URL از Supabase |
| `VITE_SUPABASE_ANON_KEY` | کلید **anon public** از Supabase (هرگز service_role) |
| `NODE_VERSION` | `22` |

> `NODE_VERSION` باید دقیقاً `22` باشد (نه `2`). نیازی به `NPM_FLAGS` نیست، چون فایل `.npmrc` در ریشهٔ پروژه، `legacy-peer-deps` را خودکار فعال می‌کند.

**فایل‌های لازم در ریشهٔ مخزن:** `.npmrc` و `wrangler.jsonc` (هر دو در فایل zip نهایی هستند). `wrangler.jsonc` مشخص می‌کند که پوشهٔ `dist` منتشر شود و مسیرهای SPA کار کنند.

**Deploy command** را `npx wrangler deploy` بگذار (اگر فیلد وجود داشت).

سپس **Save and Deploy** را بزن. آدرس سایت به شکل `https://<نام-پروژه>.pages.dev` ساخته می‌شود.

## ۳) تنظیم Supabase
در Supabase → **Authentication → URL Configuration**:
- **Site URL**: آدرس `pages.dev` بالا
- **Redirect URLs**: همان آدرس + `http://localhost:5173`

## ۴) بعد از هر تغییر متغیر محیطی
Cloudflare به‌صورت خودکار دوباره build نمی‌کند. برای اعمال تغییر: **Deployments → … → Retry deployment** یا یک commit جدید بزن.

## ۵) نکته‌ی مهم درباره‌ی Netlify
اگر بعداً حساب Netlify فعال شد، همین مخزن را روی Netlify هم می‌توانی وصل کنی؛ `netlify.toml` از قبل آماده است. دو سرویس می‌توانند همزمان روی یک مخزن باشند.

## ✅ چک نهایی
- صفحه‌ی `/login` باز می‌شود و جمله‌ی رادمهر را نشان می‌دهد.
- با ایمیل مدیر وارد می‌شوی و به `/a` می‌روی.
- رفرش کردن `/c/students` خطای 404 نمی‌دهد.
- صفحه‌ی `/setup` همه‌ی موارد را سبز نشان می‌دهد.
