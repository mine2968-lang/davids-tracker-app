import { useState } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './contexts/auth-context'
import LoginScreen from './components/LoginScreen'
import AppLayout from './components/layout/AppLayout'
import type { TabId } from './components/layout/AppLayout'
import HomeView from './views/HomeView'
import TasksView from './views/TasksView'
import GoalsView from './views/GoalsView'
import PlaceholderView from './views/PlaceholderView'
import { useTasks } from './hooks/useTasks'
import { useProjects } from './hooks/useProjects'
import { useGoals } from './hooks/useGoals'

function Shell() {
  const [tab, setTab] = useState<TabId>('home')
  const tasksApi = useTasks()
  const projectsApi = useProjects()
  const goalsApi = useGoals()

  return (
    <AppLayout active={tab} onNavigate={setTab}>
      {tab === 'home' && (
        <HomeView
          tasksApi={tasksApi}
          projectsApi={projectsApi}
          goalsApi={goalsApi}
          onGoToTasks={() => setTab('tasks')}
          onGoToGoals={() => setTab('goals')}
        />
      )}
      {tab === 'tasks' && <TasksView tasksApi={tasksApi} projectsApi={projectsApi} />}
      {tab === 'goals' && (
        <GoalsView goalsApi={goalsApi} tasksApi={tasksApi} projectsApi={projectsApi} />
      )}
      {tab === 'notes' && <PlaceholderView title="Notes" phase="Phase 3" />}
    </AppLayout>
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
