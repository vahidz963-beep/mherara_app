import { beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from '../App'
import { getBackend } from '../lib/index'
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

describe('مدیر اصلی رادمهر', () => {
  it('مدیر پس از ورود به پنل مدیریت کاربران هدایت می‌شود', async () => {
    seedSession('u-admin')
    window.history.pushState({}, '', '/a')
    render(<App />)
    await waitFor(() => expect(screen.getByText('مدیریت کاربران رادمهر')).toBeTruthy(), { timeout: 8000 })
    // شمارش نقش‌ها و جدول کاربران نمایش داده می‌شود
    expect(screen.getAllByText('دانش‌آموز').length).toBeGreaterThan(0)
  })

  it('مدیر به صفحات مشاور هم دسترسی دارد', async () => {
    seedSession('u-admin')
    window.history.pushState({}, '', '/c/students')
    render(<App />)
    await waitFor(() => expect(screen.getAllByText('دانش‌آموزان').length).toBeGreaterThan(0), { timeout: 8000 })
    expect(screen.queryByText('مدیریت کاربران رادمهر')).toBeNull()
  })

  it('دانش‌آموز نمی‌تواند وارد پنل مدیر شود', async () => {
    seedSession('u-ali')
    window.history.pushState({}, '', '/a')
    render(<App />)
    await waitFor(() => expect(screen.getAllByText('خانه‌ی من').length).toBeGreaterThan(0), { timeout: 8000 })
    expect(screen.queryByText('مدیریت کاربران رادمهر')).toBeNull()
  })

  it('ورود مدیر با ایمیل و رمز از صفحه‌ی ورود کار می‌کند', async () => {
    resetDemoData()
    window.history.pushState({}, '', '/login')
    render(<App />)
    await waitFor(() => expect(document.querySelector('input[type="password"]')).toBeTruthy(), { timeout: 8000 })
    const phoneInput = document.querySelector('input[placeholder="0912xxxxxxx"]') as HTMLInputElement
    const passInput = document.querySelector('input[type="password"]') as HTMLInputElement
    fireEvent.change(phoneInput, { target: { value: 'raz.abi.ilm@gmail.com' } })
    fireEvent.change(passInput, { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'ورود' }))
    await waitFor(() => expect(screen.getByText('مدیریت کاربران رادمهر')).toBeTruthy(), { timeout: 8000 })
  })
})

describe('ثبت‌نام مشاور فقط با کد دعوت مدیر', () => {
  it('دانش‌آموز نمی‌تواند کد دعوت مشاور بسازد', async () => {
    resetDemoData()
    const backend = getBackend()
    await expect(backend.createInvite({ role: 'counselor', createdBy: 'u-ali' })).rejects.toThrow('فقط مدیر')
  })

  it('ثبت‌نام مشاور بدون کد دعوت انجام نمی‌شود', async () => {
    resetDemoData()
    const backend = getBackend()
    await expect(
      backend.signUp({ phone: '09125550001', password: '123456', fullName: 'مشاور آزمایشی', role: 'counselor' }),
    ).rejects.toThrow('کد دعوت')
  })

  it('مشاور با کد مدیر ثبت‌نام می‌کند و کد یک‌بار مصرف است', async () => {
    resetDemoData()
    const backend = getBackend()
    const inv = await backend.createInvite({ role: 'counselor', createdBy: 'u-admin', note: 'مشاور جدید' })
    expect(inv.role).toBe('counselor')

    const p = await backend.signUp({
      phone: '09125550002',
      password: '123456',
      fullName: 'مشاور جدید',
      role: 'counselor',
      inviteCode: inv.code,
    })
    expect(p.role).toBe('counselor')

    await expect(
      backend.signUp({
        phone: '09125550003',
        password: '123456',
        fullName: 'مشاور دوم',
        role: 'counselor',
        inviteCode: inv.code,
      }),
    ).rejects.toThrow('نامعتبر')
  })
})
