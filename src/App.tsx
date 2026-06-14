import { useState } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './contexts/auth-context'
import LoginScreen from './components/LoginScreen'
import AppLayout from './components/layout/AppLayout'
import type { TabId } from './components/layout/AppLayout'
import QuickCapture from './components/QuickCapture'
import HomeView from './views/HomeView'
import TasksView from './views/TasksView'
import GoalsView from './views/GoalsView'
import ProjectsView from './views/ProjectsView'
import NotesView from './views/NotesView'
import { useTasks } from './hooks/useTasks'
import { useProjects } from './hooks/useProjects'
import { useGoals } from './hooks/useGoals'
import { useNotes } from './hooks/useNotes'
import { useTags } from './hooks/useTags'

function Shell() {
  const [tab, setTab] = useState<TabId>('home')
  const [openNoteId, setOpenNoteId] = useState<string | null>(null)
  const tasksApi = useTasks()
  const projectsApi = useProjects()
  const goalsApi = useGoals()
  const notesApi = useNotes()
  const tagsApi = useTags()

  const openNote = (noteId: string) => {
    setOpenNoteId(noteId)
    setTab('notes')
  }

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
      {tab === 'projects' && <ProjectsView projectsApi={projectsApi} tasksApi={tasksApi} />}
      {tab === 'goals' && (
        <GoalsView
          goalsApi={goalsApi}
          tasksApi={tasksApi}
          projectsApi={projectsApi}
          notesApi={notesApi}
          onOpenNote={openNote}
        />
      )}
      {tab === 'notes' && (
        <NotesView
          notesApi={notesApi}
          tagsApi={tagsApi}
          goalsApi={goalsApi}
          tasksApi={tasksApi}
          openNoteId={openNoteId}
          onConsumeOpenNote={() => setOpenNoteId(null)}
          onGoToGoals={() => setTab('goals')}
          onGoToTasks={() => setTab('tasks')}
        />
      )}
      <QuickCapture onSave={notesApi.addNote} />
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
