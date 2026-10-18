import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import App from '../App'
import { resetDemoData } from '../lib/demoBackend'

const seedSession = (id: string) => {
  resetDemoData()
  window.localStorage.setItem('hamghadam.demo.session', id)
}

beforeEach(() => {
  cleanup()
  window.history.pushState({}, '', '/')
  window.localStorage.clear()
})

describe('قابلیت‌های جدید', () => {
  it('صفحه‌ی آزمون‌های دانش‌آموز با تحلیل و دفتر اشتباهات بالا می‌آید', async () => {
    seedSession('u-ali')
    window.history.pushState({}, '', '/s/assessments')
    render(<App />)
    await waitFor(() => expect(screen.getByText('آزمون‌های من')).toBeTruthy(), { timeout: 8000 })
    expect(screen.getByText('تحلیل آزمون‌ها')).toBeTruthy()
    expect(screen.getByText('دفتر اشتباهات')).toBeTruthy()
    // داده‌ی نمونه: آزمون آزمایشی شماره ۴ در ستون «آخرین آزمون»
    expect(screen.getAllByText(/آزمون آزمایشی/).length).toBeGreaterThan(0)
  })

  it('مشاور می‌تواند روند آزمون‌های یک دانش‌آموز را ببیند', async () => {
    seedSession('u-counselor')
    window.history.pushState({}, '', '/c/assessments')
    render(<App />)
    await waitFor(() => expect(screen.getByText('آزمون‌ها و دفتر اشتباهات')).toBeTruthy(), { timeout: 8000 })
    await waitFor(() => expect(screen.getByText('تحلیل آزمون‌ها')).toBeTruthy(), { timeout: 8000 })
    expect(screen.getByText(/قوی‌ترین درس/)).toBeTruthy()
  })

  it('یادآورهای درون‌برنامه‌ای در خانه‌ی مشاور دیده می‌شوند', async () => {
    seedSession('u-counselor')
    window.history.pushState({}, '', '/c')
    render(<App />)
    await waitFor(() => expect(screen.getByText('یادآورهای امروز')).toBeTruthy(), { timeout: 8000 })
  })

  it('بانک تمرین‌های استاندارد در پرونده‌ی دانش‌آموز قابل بازکردن است', async () => {
    seedSession('u-counselor')
    window.history.pushState({}, '', '/c/student/u-ali')
    render(<App />)
    await waitFor(() => expect(screen.getByText('پیشنهادهای تمرین بر اساس داده')).toBeTruthy(), { timeout: 8000 })
    expect(screen.getByText(/باز کردن بانک تمرین‌ها/)).toBeTruthy()
  })

  it('گزارش والد شامل بخش آزمون‌ها است', async () => {
    seedSession('u-parent')
    window.history.pushState({}, '', '/p/report')
    render(<App />)
    await waitFor(() => expect(screen.getByText('گزارش هفتگی')).toBeTruthy(), { timeout: 8000 })
    await waitFor(() => expect(screen.getByText('آزمون‌ها و کارنامه‌ها')).toBeTruthy(), { timeout: 8000 })
  })
})

describe('ثبت تست، مرحله‌ی مطالعه و چک‌این گسترده', () => {
  it('نام برند رادمهر و جمله‌ی صفحه‌ی ورود دیده می‌شود', async () => {
    window.history.pushState({}, '', '/login')
    render(<App />)
    await waitFor(() => expect(screen.getAllByText('رادمهر').length).toBeGreaterThan(0), { timeout: 8000 })
    expect(screen.getByText('با هم برنامه‌ای متناسب با خودمان می‌نویسیم تا زندگی را بهتر کنیم.')).toBeTruthy()
  })

  it('برنامه‌ی هفتگی دانش‌آموز کسر تست و مرحله‌ی مطالعه را نشان می‌دهد', async () => {
    seedSession('u-ali')
    window.history.pushState({}, '', '/s/plan')
    render(<App />)
    await waitFor(() => expect(screen.getByText('جمع تست‌های این هفته')).toBeTruthy(), { timeout: 8000 })
    // کسر «درست/کل» از داده‌ی نمونه (۱۹ از ۲۵ تست زیست)
    expect(screen.getAllByText(/۱۹\/۲۵/).length).toBeGreaterThan(0)
  })

  it('چک‌این شامل فضای مجازی، ورزش و فهرست تفریح‌های سالم است', async () => {
    seedSession('u-ali')
    window.history.pushState({}, '', '/s/checkin')
    render(<App />)
    await waitFor(() => expect(screen.getByText('تفریح‌های امروز')).toBeTruthy(), { timeout: 8000 })
    expect(screen.getByText('فضای مجازی (ساعت)')).toBeTruthy()
    expect(screen.getByText('ورزش (دقیقه)')).toBeTruthy()
    expect(screen.getByText('پیاده‌روی یا دوچرخه')).toBeTruthy()
    expect(screen.getByText('بازی فکری با خانواده')).toBeTruthy()
  })
})

describe('صفحه‌ی بررسی راه‌اندازی', () => {
  it('در حالت دمو می‌گوید باید .env ساخته شود', async () => {
    window.history.pushState({}, '', '/setup')
    render(<App />)
    await waitFor(() => expect(screen.getByText('بررسی راه‌اندازی')).toBeTruthy(), { timeout: 8000 })
    await waitFor(() => expect(screen.getByText(/متغیرهای محیطی/)).toBeTruthy(), { timeout: 8000 })
    expect(screen.getAllByText(/\.env/).length).toBeGreaterThan(0)
  })
})
