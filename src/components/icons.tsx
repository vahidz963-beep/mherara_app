type P = { className?: string }
const base = 'w-5 h-5'

const S = ({ children, className }: P & { children: React.ReactNode }) => (
  <svg
    className={className || base}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
)

export const IconHome = (p: P) => (
  <S {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
  </S>
)
export const IconUsers = (p: P) => (
  <S {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M17 11a3 3 0 1 0 0-6" />
    <path d="M18 20a6.4 6.4 0 0 0-2-4.6" />
  </S>
)
export const IconCalendar = (p: P) => (
  <S {...p}>
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M8 3v4M16 3v4M3 11h18" />
  </S>
)
export const IconClipboard = (p: P) => (
  <S {...p}>
    <rect x="5" y="4" width="14" height="17" rx="2.5" />
    <path d="M9 4V3h6v1" />
    <path d="M9 10h6M9 14h6M9 18h3" />
  </S>
)
export const IconHeart = (p: P) => (
  <S {...p}>
    <path d="M12 20s-7-4.3-7-9.4A4.1 4.1 0 0 1 12 7a4.1 4.1 0 0 1 7 3.6C19 15.7 12 20 12 20Z" />
  </S>
)
export const IconChat = (p: P) => (
  <S {...p}>
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.1A8 8 0 1 1 21 12Z" />
  </S>
)
export const IconTicket = (p: P) => (
  <S {...p}>
    <path d="M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a3 3 0 0 0 0 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a3 3 0 0 0 0-6Z" />
    <path d="M12 8v8" strokeDasharray="2 3" />
  </S>
)
export const IconUser = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </S>
)
export const IconPlus = (p: P) => (
  <S {...p}>
    <path d="M12 5v14M5 12h14" />
  </S>
)
export const IconCheck = (p: P) => (
  <S {...p}>
    <path d="M4 12.5 9 17.5 20 6.5" />
  </S>
)
export const IconEdit = (p: P) => (
  <S {...p}>
    <path d="M4 20h4l10-10-4-4L4 16v4Z" />
    <path d="M13.5 6.5l4 4" />
  </S>
)
export const IconTrash = (p: P) => (
  <S {...p}>
    <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
  </S>
)
export const IconLogout = (p: P) => (
  <S {...p}>
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
    <path d="M10 8l-4 4 4 4M6 12h9" />
  </S>
)
export const IconChart = (p: P) => (
  <S {...p}>
    <path d="M4 20V6M4 20h16" />
    <path d="M8 20v-6M12 20v-9M16 20v-4" />
  </S>
)
export const IconSpark = (p: P) => (
  <S {...p}>
    <path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z" />
  </S>
)
export const IconBook = (p: P) => (
  <S {...p}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5Z" />
    <path d="M4 5.5V20.5" />
  </S>
)
export const IconClock = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </S>
)
export const IconTrend = (p: P) => (
  <S {...p}>
    <path d="M4 17l5-6 3 3 5-7" />
    <path d="M17 7h3v3" />
  </S>
)
export const IconAlert = (p: P) => (
  <S {...p}>
    <path d="M12 4l8.5 15h-17L12 4Z" />
    <path d="M12 10v4M12 17h.01" />
  </S>
)
export const IconFlag = (p: P) => (
  <S {...p}>
    <path d="M6 3v18M6 4h11l-1.5 3.5L17 11H6" />
  </S>
)
export const IconGrip = (p: P) => (
  <S {...p}>
    <circle cx="9" cy="6" r="1" />
    <circle cx="9" cy="12" r="1" />
    <circle cx="9" cy="18" r="1" />
    <circle cx="15" cy="6" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="15" cy="18" r="1" />
  </S>
)
export const IconTarget = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3.5" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </S>
)
export const IconBell = (p: P) => (
  <S {...p}>
    <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9Z" />
    <path d="M10 18a2 2 0 0 0 4 0" />
  </S>
)
