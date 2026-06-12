import type { ReactNode } from 'react'
import { useAuth } from '../../contexts/auth-context'

export type TabId = 'home' | 'goals' | 'tasks' | 'notes'

const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
  {
    id: 'home',
    label: 'Home',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
        <path d="M3 10.5 12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 9.5V21h14V9.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'goals',
    label: 'Goals',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="4.5" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="m9 12 2.5 2.5L15.5 9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'notes',
    label: 'Notes',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
        <path d="M5 4h14v12l-4 4H5z" strokeLinejoin="round" />
        <path d="M15 20v-4h4" strokeLinejoin="round" />
      </svg>
    ),
  },
]

interface Props {
  active: TabId
  onNavigate: (tab: TabId) => void
  children: ReactNode
}

export default function AppLayout({ active, onNavigate, children }: Props) {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-slate-900 text-white md:flex">
      {/* Sidebar — Mac / wide screens */}
      <aside className="hidden md:flex md:flex-col md:w-56 md:shrink-0 border-r border-slate-800 p-4 md:sticky md:top-0 md:h-screen">
        <h1 className="text-lg font-bold px-3 mb-6">David's Tracker</h1>
        <nav className="space-y-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onNavigate(tab.id)}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active === tab.id
                  ? 'bg-indigo-500/15 text-indigo-300'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto pt-4 border-t border-slate-800">
          <p className="px-3 text-xs text-slate-500 truncate mb-2">{user?.email}</p>
          <button
            type="button"
            onClick={signOut}
            className="w-full text-left rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 pb-24 md:pb-8">
        <div className="max-w-3xl mx-auto px-4 pt-6 md:pt-8">{children}</div>
      </main>

      {/* Tab bar — iPhone / narrow screens */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 bg-slate-950/90 backdrop-blur border-t border-slate-800 flex"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onNavigate(tab.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px] ${
              active === tab.id ? 'text-indigo-400' : 'text-slate-500'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
