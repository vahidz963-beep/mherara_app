import { useState } from 'react'
import { useApp } from '../../store/AppContext'
import { useAsync } from '../../store/hooks'
import { Card, EmptyState, SectionTitle, Select, Spinner } from '../../components/ui'
import { CounselorAssessments } from '../../components/Assessments'
import { IconChart } from '../../components/icons'
import type { Profile } from '../../lib/types'

export function CounselorAssessmentsPage() {
  const { backend, profile } = useApp()
  const [studentId, setStudentId] = useState('')

  const { data, loading } = useAsync(async () => backend.listStudents(profile!.id), [backend, profile?.id], [] as Profile[])

  if (loading) return <Spinner />

  if (data.length === 0)
    return (
      <Card>
        <EmptyState title="هنوز دانش‌آموزی وصل نشده" body="از صفحه‌ی «دانش‌آموزان» یک کد دعوت بساز یا دانش‌آموز را با شماره‌اش اضافه کن." icon="🧑‍🎓" />
      </Card>
    )

  const current = studentId || data[0].id

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle
          title="آزمون‌ها و دفتر اشتباهات"
          subtitle="دانش‌آموز را انتخاب کن تا کارنامه‌ها، روند و علت غلط‌هایش را ببینی و ثبت کنی"
          icon={<IconChart className="w-4 h-4" />}
          action={
            <Select value={current} onChange={(e) => setStudentId(e.target.value)} className="text-xs max-w-[200px]">
              {data.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}
                </option>
              ))}
            </Select>
          }
        />
      </Card>
      <CounselorAssessments studentId={current} />
    </div>
  )
}
