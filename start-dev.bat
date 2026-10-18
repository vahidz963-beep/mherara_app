@echo off
REM راه‌اندازی سریع هم‌قدم روی ویندوز — دو بار کلیک کن
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js نصب نیست. از https://nodejs.org نسخه LTS را نصب کن و دوباره اجرا کن.
  pause
  exit /b 1
)
if not exist node_modules (
  echo در حال نصب کتابخانه‌ها... (یک‌بار، چند دقیقه)
  call npm install --legacy-peer-deps
)
echo در حال اجرای اپ... در مرورگر برو به http://localhost:5173
call npm run dev
pause
