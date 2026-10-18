import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import App from '../App'
import { resetDemoData } from '../lib/demoBackend'

/**
 * تست دود: هر سه نقش بدون خطا بالا می‌آیند و مسیرهای اصلی رندر می‌شوند.
 * اجرا: npm test
 */

const seedSession = (phone: string) => {
  // ساخت داده‌ی نمونه و سپس انتخاب حساب موردنظر (شبیه ورود)
  resetDemoData()
  const ids: Record<string, string> = {
    '09120000000': 'u-counselor',
    '09121111111': 'u-ali',
    '09122222222': 'u-negar',
    '09123333333': 'u-parent',
    '09124444444': 'u-sina',
  }
  window.localStorage.setItem('hamghadam.demo.session', ids[phone])
  window.location.hash = ''
}

beforeEach(() => {
  cleanup()
  window.history.pushState({}, '', '/')
  window.localStorage.clear()
})

describe('رادمهر — تست دود', () => {
  it('صفحه‌ی ورود بالا می‌آید و حساب‌های نمونه را نشان می‌دهد', async () => {
    render(<App />)
    await waitFor(() => expect(screen.getByText('ورود به حساب')).toBeTruthy())
    expect(screen.getByText('سمیرا رضایی')).toBeTruthy()
    expect(screen.getAllByText('علی محمدی').length).toBeGreaterThan(0)
  })

  it('داشبورد مشاور رندر می‌شود', async () => {
    seedSession('09120000000')
    window.history.pushState({}, '', '/c')
    render(<App />)
    await waitFor(() => expect(screen.getByText(/سلام سمیرا رضایی/)).toBeTruthy(), { timeout: 8000 })
    expect(screen.getByText('وضعیت دانش‌آموزان')).toBeTruthy()
    expect(screen.getAllByText('علی محمدی').length).toBeGreaterThan(0)
  })

  it('خانه‌ی دانش‌آموز با کارهای امروز و چک‌این رندر می‌شود', async () => {
    seedSession('09121111111')
    window.history.pushState({}, '', '/s')
    render(<App />)
    await waitFor(() => expect(screen.getByText(/سلام علی محمدی/)).toBeTruthy(), { timeout: 8000 })
    expect(screen.getAllByText('کارهای امروز').length).toBeGreaterThan(0)
  })

  it('نمای والد با گزارش خواندنی رندر می‌شود', async () => {
    seedSession('09123333333')
    window.history.pushState({}, '', '/p')
    render(<App />)
    await waitFor(() => expect(screen.getByText(/سلام زهرا محمدی/)).toBeTruthy(), { timeout: 8000 })
    expect(screen.getByText('گزارش هفتگی')).toBeTruthy()
  })

  it('نمای هفتگی برنامه‌ی دانش‌آموز آیتم‌ها را نشان می‌دهد', async () => {
    seedSession('09121111111')
    window.history.pushState({}, '', '/s/plan')
    render(<App />)
    await waitFor(() => expect(screen.getByText('برنامه‌ی این هفته')).toBeTruthy(), { timeout: 8000 })
    expect(screen.getAllByText(/زیست|ریاضی|شیمی|فیزیک/).length).toBeGreaterThan(0)
  })
})
