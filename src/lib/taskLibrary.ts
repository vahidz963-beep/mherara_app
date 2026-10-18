/**
 * بانک تمرین‌های استاندارد — مشاور می‌تواند با یک کلیک تمرین را به دانش‌آموز بدهد
 * و بعد متنش را برای همان دانش‌آموز شخصی‌سازی کند.
 *
 * منبع: تکنیک‌های رایج مطالعه، مدیریت زمان، تنظیم هیجان و آمادگی آزمون.
 * (بازبینی محتوایی توسط مشاور لازم است — این‌ها نقطه‌ی شروع‌اند، نه نسخه‌ی نهایی.)
 */

export type LibraryTask = {
  id: string
  title: string
  description: string
  category: LibraryCategory
  /** مدت پیشنهادی (روز) برای این تمرین */
  days: number
}

export type LibraryCategory =
  | 'study'
  | 'focus'
  | 'anxiety'
  | 'motivation'
  | 'sleep'
  | 'exam'
  | 'social'

export const LIBRARY_CATEGORIES: Record<LibraryCategory, { label: string; emoji: string; color: string }> = {
  study: { label: 'روش مطالعه', emoji: '📚', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  focus: { label: 'تمرکز و زمان', emoji: '🎯', color: 'bg-brand-50 text-brand-700 border-brand-200' },
  anxiety: { label: 'اضطراب و آرام‌سازی', emoji: '🌿', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  motivation: { label: 'انگیزه و عادت', emoji: '🔥', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  sleep: { label: 'خواب و سلامت', emoji: '😴', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  exam: { label: 'آمادگی آزمون', emoji: '📝', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  social: { label: 'ارتباط و خانواده', emoji: '💬', color: 'bg-teal-50 text-teal-700 border-teal-200' },
}

export const TASK_LIBRARY: LibraryTask[] = [
  // ── روش مطالعه ──
  {
    id: 'active-recall',
    title: 'بازیابی فعال: بدون کتاب جواب بده',
    description:
      'بعد از هر بلوک مطالعه، کتاب را ببند و روی یک کاغذ هر چه یادت مانده بنویس (۵ دقیقه). بعد کتاب را باز کن و نداشته‌ها را با رنگ دیگر کامل کن. هفته‌ای ۳ بار برای هر درس اصلی.',
    category: 'study',
    days: 7,
  },
  {
    id: 'spaced-review',
    title: 'مرور فاصله‌دار (۱-۳-۷)',
    description:
      'هر مبحث تازه را در سه نوبت مرور کن: یک روز بعد، سه روز بعد و هفت روز بعد. هر مرور ۱۰ تا ۱۵ دقیقه و فقط با تست و خلاصه‌ی خودت.',
    category: 'study',
    days: 7,
  },
  {
    id: 'test-targeted',
    title: 'تست‌زنی هدفمند روی یک مبحث',
    description:
      'به‌جای پخش‌کردن تست‌ها، امروز فقط از یک مبحث مشخص ۲۰ تست بزن و همه را تحلیل کن: چرا غلط؟ چرا درست؟ زمان هر تست چقدر بود؟',
    category: 'study',
    days: 3,
  },
  {
    id: 'tree-notes',
    title: 'خلاصه‌نویسی درختی',
    description: 'هر فصل را در یک صفحه‌ی A4 به‌شکل درختی خلاصه کن؛ فقط کلیدواژه‌ها. این صفحه بعداً مرجع مرور سریع می‌شود.',
    category: 'study',
    days: 4,
  },
  {
    id: 'mistake-notebook',
    title: 'دفتر اشتباهات روزانه',
    description:
      'برای هر سؤال غلط در بخش «آزمون‌ها» علت را در سه دسته بنویس: بی‌دقتی، نبودِ دانش، کمبود زمان. جمعه‌ها فقط همین دفتر را مرور کن.',
    category: 'study',
    days: 7,
  },

  // ── تمرکز و زمان ──
  {
    id: 'pomodoro',
    title: 'بلوک‌های ۲۵/۵ (پومودورو)',
    description:
      '۲۵ دقیقه مطالعه‌ی بی‌وقفه، ۵ دقیقه استراحت. بعد از ۴ دور، یک استراحت ۲۰ دقیقه‌ای. گوشی در بلوک‌ها در اتاق دیگر باشد.',
    category: 'focus',
    days: 7,
  },
  {
    id: 'time-blocks',
    title: 'بلوک‌بندی شب قبل',
    description: 'هر شب قبل از خواب، فردا را در ۳ بلوک بنویس: بلوک طلایی (سخت‌ترین کار)، بلوک معمولی، بلوک سبک.',
    category: 'focus',
    days: 7,
  },
  {
    id: 'phone-fence',
    title: 'حصار گوشی',
    description:
      'گوشی را در ساعات مطالعه روی حالت پرواز یا در اتاق دیگر بگذار. هر بار که به‌سمتش رفتی، روی کاغذ یک تیک بزن (خودآگاهی از وسوسه).',
    category: 'focus',
    days: 7,
  },
  {
    id: 'two-minute',
    title: 'قانون دو دقیقه برای شروع',
    description: 'وقتی حوصله نداری، قرار بگذار فقط دو دقیقه بنشینی و شروع کنی. اگر بعد از دو دقیقه نخواستی، می‌توانی بلند شوی.',
    category: 'focus',
    days: 7,
  },

  // ── اضطراب و آرام‌سازی ──
  {
    id: 'breath478',
    title: 'تنفس ۴-۷-۸',
    description:
      '۴ شماره از بینی دم، ۷ شماره نگه‌داشتن، ۸ شماره بازدم آرام از دهان. چهار دور. شب قبل خواب و ۱۰ دقیقه قبل آزمون.',
    category: 'anxiety',
    days: 14,
  },
  {
    id: 'body-scan',
    title: 'اسکن بدن ۵ دقیقه‌ای',
    description: 'دراز بکش، از سر تا پا توجه را روی تکتک نقاط بدن ببر؛ جاهایی که سفت‌اند را با بازدم رها کن.',
    category: 'anxiety',
    days: 14,
  },
  {
    id: 'worry-time',
    title: 'وقت نگرانی مشخص',
    description:
      'هر روز ۱۵ دقیقه در ساعت ثابت بنشین و نگرانی‌هایت را روی کاغذ بنویس و کنارش یک قدم کوچک بنویس. بقیه‌ی شب اگر نگرانی آمد، بگو «وقتش است، نه الان».',
    category: 'anxiety',
    days: 14,
  },
  {
    id: 'exam-rehearsal',
    title: 'تمرین ذهنی موقعیت آزمون',
    description:
      '۳ دقیقه چشمت را ببند و تصور کن وارد حوزه شدی، برگه را گرفتی و آرام شروع کردی. بدن را در همین تصویر شل نگه دار. سه بار در هفته.',
    category: 'anxiety',
    days: 14,
  },
  {
    id: 'sos-card',
    title: 'کارت «وقتی حال بد شد»',
    description:
      'روی یک کارت کوچک بنویس: ۱) سه نفس آرام ۲) یادم بیاور این حال می‌گذرد ۳) یک قدم کوچک بعدی چیست. کارت را در کیف بگذار.',
    category: 'anxiety',
    days: 10,
  },

  // ── انگیزه و عادت ──
  {
    id: 'tiny-habit',
    title: 'عادت کوچک روزانه',
    description: 'هر روز فقط ۱۰ دقیقه از درس سخت را ثابت و در ساعت مشخص. هدف، ساختن عادت است، نه حجم زیاد.',
    category: 'motivation',
    days: 21,
  },
  {
    id: 'habit-chain',
    title: 'زنجیره‌ی عادت',
    description: 'برای هر روز که کار مشخصت را انجام دادی، روی تقویم یک ضربدر بزن؛ زنجیره را قطع نکن. دو روز پشت‌هم را از دست نده.',
    category: 'motivation',
    days: 21,
  },
  {
    id: 'reward',
    title: 'پاداش بعد از بلوک سخت',
    description: 'برای هر بلوک سخت یک پاداش کوچک مشخص کن (۱۰ دقیقه آهنگ، یک سریال کوتاه) — پاداش بعد از کار، نه قبلش.',
    category: 'motivation',
    days: 10,
  },
  {
    id: 'why-line',
    title: 'یک جمله‌ی «چرا»',
    description: 'روی دیوار بنویس «چرا این مسیر را انتخاب کردم؟» — کوتاه و صادقانه. هر جا انگیزه افت کرد، همان را بخوان.',
    category: 'motivation',
    days: 30,
  },

  // ── خواب و سلامت ──
  {
    id: 'sleep-window',
    title: 'پنجره‌ی خواب ثابت',
    description: 'ساعت خواب و بیداری ثابت (اختلاف آخر هفته حداکثر ۱ ساعت). نیم‌ساعت قبل از خواب صفحه‌ی گوشی را قطع کن.',
    category: 'sleep',
    days: 14,
  },
  {
    id: 'move-20',
    title: '۲۰ دقیقه حرکت روزانه',
    description: 'پیاده‌روی یا ورزش کوتاه بعد از مطالعه‌ی سنگین؛ برای تمرکز و خواب، مغز به بدنِ فعال نیاز دارد.',
    category: 'sleep',
    days: 14,
  },
  {
    id: 'no-caffeine',
    title: 'بعد از ۶ عصر قهوه/چای پررنگ نه',
    description: 'کافئین بعدازظهر باعث خواب سبک می‌شود و فردا تمرکز را پایین می‌آورد.',
    category: 'sleep',
    days: 14,
  },

  // ── آمادگی آزمون ──
  {
    id: 'mock-exam',
    title: 'شبیه‌سازی آزمون در شرایط واقعی',
    description: 'هفته‌ای یک بار آزمون را در ساعت واقعی برگزاری، با زمان و بدون وقفه بزن. کار با برگه‌ی پاسخ مثل آزمون اصلی.',
    category: 'exam',
    days: 21,
  },
  {
    id: 'exam-timing',
    title: 'مدیریت زمان آزمون',
    description: 'برای هر درس سقف زمان مشخص کن و روی برگه بنویس. اگر سؤالی بیش از سقفش گرفت، علامت بزن و رد شو.',
    category: 'exam',
    days: 14,
  },
  {
    id: 'exam-analysis',
    title: 'تحلیل آزمون در ۴۸ ساعت',
    description:
      'نتایج آزمون را در بخش «آزمون‌ها» ثبت کن: درصد هر درس، زمان صرف‌شده و علت غلط‌ها. برنامه‌ی هفته‌ی بعد باید از همین تحلیل بیرون بیاید.',
    category: 'exam',
    days: 3,
  },
  {
    id: 'topic-priority',
    title: 'انتخاب مباحث پربازده',
    description: 'بین فصل‌های هر درس، دو فصل با (سهم بالا + تسلط کم) را انتخاب کن؛ هفته را روی همین دو بگذار.',
    category: 'exam',
    days: 7,
  },

  // ── ارتباط و خانواده ──
  {
    id: 'say-needs',
    title: 'بیان نیازها در خانه',
    description:
      'یک جمله‌ی آماده بساز و تمرین کن: «وقتی با صدای بلند نمره می‌پرسی، استرس می‌گیرم. می‌شه بگی چه چیزی برات مهمه؟» این را با مشاور مرور کن.',
    category: 'social',
    days: 7,
  },
  {
    id: 'share-plan',
    title: 'نشان دادن برنامه به والدین',
    description: 'هفته‌ای یک بار برنامه و پیشرفت را خودت برای والدین توضیح بده تا در جریان باشند و فشار بی‌جا کم شود.',
    category: 'social',
    days: 7,
  },
]

/** پیشنهاد تمرین بر اساس داده‌ی چک‌این و آزمون */
export function suggestLibraryTasks(args: {
  avgMood?: number
  avgSleep?: number
  avgFocus?: number
  checkinGapDays?: number
  lastExamPercent?: number
}): LibraryTask[] {
  const out: LibraryTask[] = []
  const { avgMood = 3, avgSleep = 7, avgFocus = 3, checkinGapDays = 0, lastExamPercent } = args
  if (avgSleep < 6.5) out.push(TASK_LIBRARY.find((t) => t.id === 'sleep-window')!)
  if (avgFocus < 3) out.push(TASK_LIBRARY.find((t) => t.id === 'pomodoro')!, TASK_LIBRARY.find((t) => t.id === 'phone-fence')!)
  if (avgMood < 3) out.push(TASK_LIBRARY.find((t) => t.id === 'breath478')!, TASK_LIBRARY.find((t) => t.id === 'worry-time')!)
  if (checkinGapDays >= 3) out.push(TASK_LIBRARY.find((t) => t.id === 'habit-chain')!)
  if (lastExamPercent !== undefined && lastExamPercent < 50) out.push(TASK_LIBRARY.find((t) => t.id === 'mistake-notebook')!, TASK_LIBRARY.find((t) => t.id === 'exam-analysis')!)
  out.push(TASK_LIBRARY.find((t) => t.id === 'active-recall')!)
  return Array.from(new Set(out)).slice(0, 5)
}
