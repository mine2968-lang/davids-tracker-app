import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './contexts/auth-context'
import LoginScreen from './components/LoginScreen'

function Shell() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-2xl font-bold">Signed in</h1>
      <p className="text-slate-400">{user?.email}</p>
      <p className="text-slate-500 text-sm text-center max-w-xs">
        Phase 0 complete. Tasks, Goals, and Notes arrive in the next phases.
      </p>
      <button
        type="button"
        onClick={signOut}
        className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm transition-colors"
      >
        Sign out
      </button>
    </div>
  )
}

function Gate() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-slate-400">Loading…</p>
      </div>
    )
  }

  return session ? <Shell /> : <LoginScreen />
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
