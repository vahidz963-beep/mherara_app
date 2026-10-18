#!/bin/bash
# راه‌اندازی سریع هم‌قدم روی مک/لینوکس — دو بار کلیک کن
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js نصب نیست. از https://nodejs.org نسخه LTS را نصب کن."
  read -r -p "Enter برای بستن…" _
  exit 1
fi
if [ ! -d node_modules ]; then
  echo "در حال نصب کتابخانه‌ها… (یک‌بار، چند دقیقه)"
  npm install --legacy-peer-deps
fi
npm run dev
