# رادمهر روی GitHub Desktop دوم — از صفر تا دیپلوی خودکار

این راهنما برای کسی نوشته شده که **GitHub و GitHub Desktop را قبلاً دارد و برای پروژه‌های دیگرش استفاده کرده** و حالا می‌خواهد رادمهر را به‌عنوان یک **پروژه‌ی جدید و جدا** بالا بیاورد؛ چه با همان حساب قبلی، چه با یک حساب دوم.

> **نکته‌ی مهم که خیلی وقت‌ها باعث سردرگمی می‌شود:** لازم نیست نسخه‌ی دوم GitHub Desktop نصب کنی. یک نصب، هم‌زمان چند حساب GitHub را پشتیبانی می‌کند و برای هر مخزن می‌پرسی «با کدام حساب Publish شود؟». نصب دوم فقط دردسرِ آپدیت و کلید می‌سازد.

---

## فهرست

1. [سه قاعده‌ی قبل از شروع](#۱-سه-قاعده‌ی-قبل-از-شروع)
2. [مسیر A — همان حساب، مخزن جدید (ساده‌ترین)](#۲-مسیر-a--همان-حساب-مخزن-جدید)
3. [مسیر B — حساب دوم روی همان GitHub Desktop](#۳-مسیر-b--حساب-دوم-روی-همان-github-desktop)
4. [اتصال به Netlify و دیپلوی خودکار](#۴-اتصال-به-netlify-و-دیپلوی-خودکار)
5. [چرخه‌ی کاری روزمره](#۵-چرخه‌ی-کاری-روزمره)
6. [خطاهای رایج و راه‌حل](#۶-خطاهای-رایج-و-راه‌حل)
7. [چک‌لیست نهایی](#۷-چک‌لیست-نهایی)

---

## ۱) سه قاعده‌ی قبل از شروع

### قاعده‌ی ۱ — مسیر پوشه را تمیز انتخاب کن

فایل `hamghadam-v2-source.zip` را در مسیری مثل این باز کن:

```
C:\Projects\radmehr
```

نه داخل `Downloads`، نه داخل `OneDrive` (همگام‌سازی OneDrive با `node_modules` و فایل‌های قفل گیت دعوا می‌کند)، نه داخل پوشه‌ی پروژه‌ی قدیمی‌ات.

- مسیر **انگلیسی، کوتاه و بدون فاصله** باشد. نام فارسی و فاصله در مسیر، بعداً در بیلد Netlify و اسکریپت‌ها دردسر می‌سازد.
- داخل پوشه باید این‌ها را ببینی: `package.json`، `src/`، `supabase/`، `netlify.toml`، `SETUP.md`، `preview/`.
- اگر باز کردی و دیدی داخلش یک پوشه‌ی دیگر به اسم `hamghadam` است، یک سطح بیا بالا؛ **`package.json` باید در ریشه‌ی همان پوشه‌ای باشد که در GitHub Desktop انتخاب می‌کنی.**

### قاعده‌ی ۲ — چیزهایی که هرگز نباید آپلود شوند

فایل `.gitignore` از قبل درست تنظیم شده و این‌ها را نادیده می‌گیرد:

| نادیده گرفته می‌شود | چرا |
|---|---|
| `node_modules/` | چند صد مگابایت و ده‌ها هزار فایل؛ در هر سیستم با `npm install` ساخته می‌شود |
| `dist/` | خروجی بیلد؛ Netlify خودش می‌سازد |
| `.env` / `.env.local` | **کلیدهای Supabase**؛ اگر لو برود، هر کسی می‌تواند به داده‌ها وصل شود |
| `coverage/`, `.vite/`, `*.log` | زباله‌ی ابزارها |

بعد از اولین اجرای `npm install` پوشه‌ی `node_modules` ساخته می‌شود؛ **طبیعی است** و نباید در لیست فایل‌های آماده‌ی Commit دیده شود. اگر دیدی GitHub Desktop می‌گوید «۹ هزار فایل»، یعنی `.gitignore` جا افتاده — برو به بخش [خطاهای رایج](#۶-خطاهای-رایج-و-راه‌حل).

### قاعده‌ی ۳ — مخزن را Private بساز

این یک محصول نیمه‌آماده با منطق کسب‌وکار است، نه دموی عمومی. Private رایگان است و هیچ محدودیتی برای Netlify ایجاد نمی‌کند.

---

## ۲) مسیر A — همان حساب، مخزن جدید

اگر حساب GitHub فعلی‌ات مال خودت است و فقط می‌خواهی پروژه‌ی جدا داشته باشی، همین مسیر را برو. حدود ۵ دقیقه.

| گام | کار |
|---|---|
| ۱ | زیپ را در `C:\Projects\radmehr` باز کن (قاعده‌ی ۱). |
| ۲ | GitHub Desktop را باز کن → منوی **File → Add Local Repository…** |
| ۳ | پوشه‌ی `C:\Projects\radmehr` را انتخاب کن. GitHub Desktop می‌گوید «این پوشه مخزن گیت نیست» و دکمه‌ی **create a repository** نشان می‌دهد → آن را بزن. |
| ۴ | در پنجره‌ی ساخت مخزن: **Name**: `radmehr` · **Description**: «پلتفرم مشاوره‌ی تحصیلی و روان‌شناختی» · **Git ignore**: *None* (چون `.gitignore` خودمان هست) · **License**: *None* · تیک **Initialize this repository with a README** را **بردار** (README داریم). |
| ۵ | **Create repository**. |
| ۶ | تب **Changes** را ببین: باید حدود ۹۳ فایل باشد و **هیچ‌کدام** زیر `node_modules` یا `dist` یا `.env` نباشد. پیام Commit بگذار: `نسخهٔ اول رادمهر` → دکمه‌ی **Commit to main**. |
| ۷ | بالای پنجره: **Publish repository**. تیک **Keep this code private** را بزن (اگر برنداشتی، بعداً از Settings → Danger Zone هم می‌شود Private کرد). → **Publish**. |
| ۸ | در مرورگر `github.com/<username>/radmehr` را باز کن و مطمئن شو فایل‌ها هست. |

**نکته‌ی طلایی:** اگر بعد از Commit فهمیدی فایلی نباید می‌آمد (مثلاً `.env`)، کافی است:

```bash
# در ترمینال همان پوشه
git rm -r --cached .env
git commit -m "حذف .env از مخزن"
git push
```

و اگر کلیدی واقعاً آپلود شده بود، **همان کلید را در Supabase باطل و از نو بساز**.

---

## ۳) مسیر B — حساب دوم روی همین GitHub Desktop

GitHub Desktop چند حساب را هم‌زمان نگه می‌دارد. یعنی می‌توانی برای پروژه‌های شخصی حسابی داشته باشی و رادمهر را زیر یک حساب/برند دیگر (مثلاً حساب کاری مرکز مشاوره) منتشر کنی — بدون نصب دوباره.

### ۳.۱ افزودن حساب دوم

1. **File → Options** (ویندوز) یا **GitHub Desktop → Settings** (مک) → تب **Accounts**.
2. زیر «GitHub.com» دکمه‌ی **Sign in to another account** را بزن (اگر نسخه‌ات ندارد، Sign out کن و با حساب دوم Sign in کن؛ حساب اول حذف نمی‌شود، فقط فعال نیست).
3. مرورگر باز می‌شود؛ با **حساب دوم** وارد شو و Authorize را تأیید کن.
4. برگرد به GitHub Desktop؛ در بالای پنجره اسم حساب فعلی دیده می‌شود و با کلیک روی آن می‌توانی بین حساب‌ها سوئیچ کنی.

### ۳.۲ کدام حساب Commit را می‌سازد؟

هر مخزن دقیقاً یک هویت نویسنده دارد. اگر هویت را درست نکنی، Commitها با عکس خاکستری و «Unknown author» ثبت می‌شوند و در پروفایل حساب دوم شمرده نمی‌شوند.

در GitHub Desktop برو به: **Repository → Repository Settings… → Git config** و این دو را پر کن:

| فیلد | مقدار پیشنهادی |
|---|---|
| Name | همان نمایشی که در حساب دوم داری |
| Email | ایمیل حساب دوم، یا ایمیل privacy: `<ID>+<username>@users.noreply.github.com` |

`<ID>` همان عددی است که در `https://api.github.com/users/<username>` می‌بینی (فیلد `id`). استفاده از ایمیل privacy جلوی عمومی‌شدن ایمیل واقعی‌ات را می‌گیرد.

بعد از تنظیم، اولین Commit را **از نو** نزن؛ فقط مطمئن شو Commit بعدی با آواتار درست می‌آید.

### ۳.۳ موقع Publish با کدام حساب می‌رود؟

وقتی **Publish repository** را می‌زنی، GitHub Desktop اگر چند حساب داشته باشد می‌پرسد مخزن روی کدام حساب ساخته شود. حساب دوم را انتخاب کن.

قبل از Publish یک بار در مرورگر چک کن که **با همان حساب دوم** لاگین هستی — وگرنه مخزن روی حساب اشتباه ساخته می‌شود.

### ۳.۴ اگر Netlify هم باید حساب جدا داشته باشد

دو حالت:

- **حساب Netlify جدا برای برند دوم (تمیزتر):** در Netlify روی Sign up → **GitHub** بزن و با **حساب دوم** اجازه بده. بعد از این، فقط مخزن‌های همان حساب در لیست می‌آید.
- **همان حساب Netlify قبلی:** هنگام اتصال مخزن، دسترسی سازمان/حساب دوم را هم Authorize کن (Netlify → User settings → Applications → GitHub → Configure). در این حالت دو سایت زیر یک تیم داری که اشکالی ندارد، ولی مدیریت دسترسی‌ها کمی درهم می‌شود.

> **نصب کاملاً جدا؟** اگر واقعاً می‌خواهی یک GitHub Desktop مستقل با تنظیمات جدا داشته باشی (مثلاً برای کسی دیگر روی همان کامپیوتر)، تنها راه تمیز، **یک کاربر ویندوز/مک جداگانه** است. نسخه‌ی Portable یا کپی پوشه‌ی `%AppData%\GitHub Desktop` تست‌نشده و ناپایدار است؛ توصیه نمی‌شود.

---

## ۴) اتصال به Netlify و دیپلوی خودکار

### ۴.۱ ساخت سایت

1. به [app.netlify.com](https://app.netlify.com) برو → **Add new site → Import an existing project**.
2. **GitHub** را انتخاب کن. اگر تازه Authorize کردی، فقط مخزن‌های همان حسابی را که اجازه دادی می‌بینی. اگر `radmehr` را نمی‌بینی → **Configure the Netlify app on GitHub** را بزن و دسترسی به مخزن جدید را اضافه کن.
3. مخزن `radmehr` و شاخه‌ی **`main`** را انتخاب کن.
4. تنظیمات بیلد را همان‌طور که `netlify.toml` می‌گوید بگذار (Netlify خودش از فایل می‌خواند، ولی برای اطمینان هم چک کن):

| فیلد | مقدار |
|---|---|
| Build command | `npm run build` |
| Publish directory | `dist` |
| Node version | `20` |

> `netlify.toml` سه چیز را از قبل حل کرده: دستور و پوشه‌ی بیلد، نسخه‌ی Node، و **ریدایرکت SPA** (بدون آن، رفرش روی `/c/students` خطای 404 می‌دهد). فایل باید در **ریشه‌ی مخزن** باشد؛ این‌جاست. ✅

### ۴.۲ متغیرهای محیطی (مهم‌ترین گام)

قبل از اولین بیلد موفق، در **Site configuration → Environment variables → Add a variable**:

| نام | مقدار |
|---|---|
| `VITE_SUPABASE_URL` | آدرس پروژه‌ی Supabase، مثل `https://xxxxxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | کلید **anon public** (هرگز `service_role`) |

هر دو در Supabase → Project Settings → API هست. اسکوپ را روی `Builds` بگذار (کافی است).

> این متغیرها **در زمان بیلد** داخل فایل‌های جاوااسکریپت ریخته می‌شوند. اگر بعداً عوضشان کردی، فقط Save کافی نیست: **Deploys → Trigger deploy → Clear cache and deploy site**.

### ۴.۳ بعد از اولین Deploy

1. آدرس `https://<site-name>.netlify.app` را باز کن؛ صفحه‌ی ورود رادمهر باید بیاید و نشان «متصل به Supabase» داشته باشد. اگر «حالت دمو» نشان می‌دهد، یعنی متغیرها نخوانده شده‌اند → گام ۴.۲ و Clear cache.
2. در Supabase → Authentication → URL Configuration: **Site URL** = آدرس Netlify، و در **Redirect URLs** هم `http://localhost:5173` را اضافه کن.
3. اولین حساب‌ها را از خود اپ بساز (به ترتیب: مشاور → دعوت دانش‌آموز → والد) — جزئیاتش در `SETUP.md` بخش ۱۱.

### ۴.۴ هر Push = یک دیپلوی

از این لحظه:

- Push روی `main` → Netlify خودکار بیلد می‌کند (۱ تا ۳ دقیقه). صفحه‌ی **Deploys** تاریخ و وضعیت را نشان می‌دهد.
- Push روی یک **شاخه‌ی دیگر** → Netlify یک **Deploy Preview** با آدرس موقت می‌سازد. این بهترین ابزار برای «قبل از اینکه به برنامه‌ی واقعی برود، ببینم درست است یا نه».
- هر Deploy قبلی قابل **Rollback** است: Deploys → روی نسخه‌ی سالم → *Publish deploy*.

---

## ۵) چرخه‌ی کاری روزمره

```
GitHub Desktop  →  Open in Visual Studio Code  →  ویرایش کد
        ↓
npm run dev  (تست محلی روی localhost:5173)
        ↓
Changes → Commit → Push origin
        ↓
Netlify خودش بیلد و منتشر می‌کند
```

- **یک تغییر = یک Commit.** پیام فارسی و روشن: «افزودن فیلد ورزش به چک‌این».
- برای تغییرهای پرریسک: در GitHub Desktop → **Current Branch → New Branch** → شاخه‌ی `feature/checkin-exercise` → Push → در GitHub یک Pull Request بزن، Deploy Preview را ببین، بعد Merge.
- اگر چند نفر روی پروژه کار می‌کنند: قبل از شروع **Fetch origin** بزن و اگر Commit جدید آمد، Pull کن.
- دکمه‌ی **ساده‌تر برای شروع روز:** فایل `start-dev.bat` (ویندوز) یا `start-dev.command` (مک) در ریشه‌ی پروژه.

---

## ۶) خطاهای رایج و راه‌حل

| پیام / نشانه | علت | راه‌حل |
|---|---|---|
| «This directory does not appear to be a Git repository» | پوشه هنوز مخزن نیست | همان‌جا **create a repository** را بزن (گام ۳ مسیر A) |
| در Changes هزاران فایل و پوشه‌ی `node_modules` دیده می‌شود | `.gitignore` خوانده نشده یا حذف شده | مطمئن شو `.gitignore` در ریشه است؛ سپس در ترمینال: `git rm -r --cached node_modules` و Commit |
| خطای «file is 100 MB» موقع Push | فایل حجیم (ویدیو، زیپ، دیتابیس) داخل مخزن | فایل را بیرون ببر، `.gitignore` را کامل کن، `git rm --cached <file>` |
| Publish کار نمی‌کند: «You don't have permission» | حساب اشتباه انتخاب شده | بالای GitHub Desktop حساب دوم را فعال کن؛ یا در Repository Settings → Remote آدرس مالک را درست کن |
| «Authentication failed» یا مدام پسورد می‌خواهد | نشست GitHub Desktop منقضی شده | File → Options → Accounts → Sign out و دوباره Sign in (توکن دستی لازم نیست) |
| Commitها با آواتار خاکستری و «Unknown author» | ایمیل نویسنده با هیچ حسابی تطبیق ندارد | Repository Settings → Git config → ایمیل حساب/ایمیل privacy را درست کن |
| مخزن روی حساب اشتباه Publish شد | چند حساب فعال بود | در GitHub: Settings → **Transfer ownership** به حساب درست؛ Remote در GitHub Desktop خودکار به‌روز می‌شود |
| Netlify مخزن را در لیست نمی‌آورد | دسترسی Netlify به آن حساب/مخزن داده نشده | GitHub → Settings → Applications → Netlify → Configure → Repository access را روی `radmehr` بگذار |
| Netlify بیلد می‌کند ولی صفحه سفید است | متغیرهای `VITE_*` نبوده‌اند | گام ۴.۲ + **Clear cache and deploy site** |
| در سایت، رفرش روی `/c/students` → 404 | ریدایرکت SPA نیست | `netlify.toml` در ریشه‌ی مخزن باشد و دوباره Deploy کن |
| «حالت دمو» روی سایت واقعی | همان مشکل متغیرهای محیطی یا کش | بالا |
| Deploy جدید اعمال نمی‌شود | Commit شده ولی Push نشده، یا روی شاخه‌ی دیگر رفته | GitHub Desktop → **Push origin**؛ در Netlify شاخه‌ی Production را چک کن |
| `npm install` روی سیستم خودت خطای peer dependency | نسخه‌های React/Vite | `npm install --legacy-peer-deps` (این پروژه با همین ساخته شده) |
| نام مخزن فارسی یا با فاصله ساخته شد | موقع ساخت Name را فارسی گذاشتی | GitHub → Settings → Repository name را `radmehr` کن؛ URL عوض می‌شود و Remote هم به‌روز می‌شود |

---

## ۷) چک‌لیست نهایی

- [ ] زیپ در مسیری انگلیسی و بدون فاصله باز شد و `package.json` در ریشه است
- [ ] `.env` روی سیستم ساخته شد ولی در Changes دیده نمی‌شود
- [ ] `npm install --legacy-peer-deps` و `npm run dev` کار می‌کند (localhost:5173)
- [ ] مخزن با نام `radmehr` ساخته و **Private** منتشر شد
- [ ] هویت نویسنده (Name/Email) روی حساب درست تنظیم شد
- [ ] GitHub Desktop → **Open in Visual Studio Code** باز می‌شود
- [ ] Netlify به مخزن و شاخه‌ی `main` وصل شد
- [ ] `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY` تنظیم شدند
- [ ] اولین Deploy با نشان «متصل به Supabase» بالا آمد
- [ ] Site URL در Supabase روی آدرس Netlify تنظیم شد
- [ ] یک Commit آزمایشی → Push → دیدی که Deploy خودکار اجرا شد

---

## پیوست — همان کار با ترمینال (اختیاری)

اگر ترجیح می‌دهی از خط فرمان انجام بدهی، دقیقاً همان نتیجه را می‌دهد:

```bash
cd /path/to/radmehr

git init
git add .
git status                 # چک کن node_modules و .env نباشند
git commit -m "نسخهٔ اول رادمهر"

# حساب دوم را با مخزن جدید مطمئن شو:
git config user.name  "Your Name"
git config user.email "you@example.com"

git branch -M main
git remote add origin https://github.com/<username>/radmehr.git
git push -u origin main
```

اگر Git برای بار اول رمز خواست، GitHub دیگر پسورد قبول نمی‌کند؛ از **Personal Access Token** (GitHub → Settings → Developer settings → Tokens → Fine-grained) با دسترسی `Contents: Read and write` استفاده کن، یا همان GitHub Desktop را برای احراز هویت یک بار Sign in کن تا Git از آن استفاده کند.
