import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider, useApp } from './store/AppContext'
import { Layout } from './components/Layout'
import { Spinner, Toasts } from './components/ui'
import { SetupPage } from './pages/Setup'
import { Login } from './pages/auth/Login'
import { Signup } from './pages/auth/Signup'
import { ProfilePage } from './pages/Profile'
import { CounselorDashboard } from './pages/counselor/Dashboard'
import { Students } from './pages/counselor/Students'
import { StudentFile } from './pages/counselor/StudentFile'
import { PlanEditor } from './pages/counselor/PlanEditor'
import { Sessions } from './pages/counselor/Sessions'
import { Invites } from './pages/counselor/Invites'
import { AllPlans } from './pages/counselor/AllPlans'
import { CounselorAssessmentsPage } from './pages/counselor/Assessments'
import { StudentHome } from './pages/student/Home'
import { StudentPlan } from './pages/student/Plan'
import { StudentPlanDetail } from './pages/student/PlanDetail'
import { StudentTasks } from './pages/student/Tasks'
import { StudentCheckin } from './pages/student/Checkin'
import { StudentChat } from './pages/student/Chat'
import { StudentAssessments } from './pages/student/Assessments'
import { ParentHome } from './pages/parent/Home'
import { ParentPlan } from './pages/parent/Plan'
import { ParentReport } from './pages/parent/Report'
import { ParentChat } from './pages/parent/Chat'
import { AdminDashboard } from './pages/admin/Dashboard'
import type { Role } from './lib/types'

export const homePath = (role: Role) =>
  role === 'admin' ? '/a' : role === 'counselor' ? '/c' : role === 'parent' ? '/p' : '/s'

function Guard({ role, children }: { role: Role; children: React.ReactNode }) {
  const { profile } = useApp()
  if (!profile) return <Navigate to="/login" replace />
  // مدیر اصلی به همه‌ی صفحات مشاور دسترسی دارد
  const allowed = profile.role === role || (profile.role === 'admin' && role === 'counselor')
  if (!allowed) return <Navigate to={homePath(profile.role)} replace />
  return <>{children}</>
}

function Shell() {
  const { profile, ready, toasts } = useApp()

  if (!ready)
    return (
      <div className="min-h-screen grid place-items-center">
        <Spinner label="در حال آماده‌سازی رادمهر…" />
      </div>
    )

  if (!profile)
    return (
      <>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toasts items={toasts} />
      </>
    )

  const home = homePath(profile.role)

  return (
    <>
      <Layout>
        <Routes>
          {/* مدیر اصلی */}
          <Route path="/a" element={<Guard role="admin"><AdminDashboard /></Guard>} />

          {/* مشاور */}
          <Route path="/c" element={<Guard role="counselor"><CounselorDashboard /></Guard>} />
          <Route path="/c/students" element={<Guard role="counselor"><Students /></Guard>} />
          <Route path="/c/student/:id" element={<Guard role="counselor"><StudentFile /></Guard>} />
          <Route path="/c/plan/:planId" element={<Guard role="counselor"><PlanEditor /></Guard>} />
          <Route path="/c/plans" element={<Guard role="counselor"><AllPlans /></Guard>} />
          <Route path="/c/sessions" element={<Guard role="counselor"><Sessions /></Guard>} />
          <Route path="/c/invites" element={<Guard role="counselor"><Invites /></Guard>} />
          <Route path="/c/assessments" element={<Guard role="counselor"><CounselorAssessmentsPage /></Guard>} />

          {/* دانش‌آموز */}
          <Route path="/s" element={<Guard role="student"><StudentHome /></Guard>} />
          <Route path="/s/plan" element={<Guard role="student"><StudentPlan /></Guard>} />
          <Route path="/s/plan/:planId" element={<Guard role="student"><StudentPlanDetail /></Guard>} />
          <Route path="/s/tasks" element={<Guard role="student"><StudentTasks /></Guard>} />
          <Route path="/s/checkin" element={<Guard role="student"><StudentCheckin /></Guard>} />
          <Route path="/s/assessments" element={<Guard role="student"><StudentAssessments /></Guard>} />
          <Route path="/s/chat" element={<Guard role="student"><StudentChat /></Guard>} />
          <Route path="/s/sessions" element={<Guard role="student"><StudentHome /></Guard>} />

          {/* والد */}
          <Route path="/p" element={<Guard role="parent"><ParentHome /></Guard>} />
          <Route path="/p/plan" element={<Guard role="parent"><ParentPlan /></Guard>} />
          <Route path="/p/report" element={<Guard role="parent"><ParentReport /></Guard>} />
          <Route path="/p/chat" element={<Guard role="parent"><ParentChat /></Guard>} />

          <Route path="/setup" element={<SetupPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to={home} replace />} />
        </Routes>
      </Layout>
      <Toasts items={toasts} />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Shell />
      </AppProvider>
    </BrowserRouter>
  )
}
