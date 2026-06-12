import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../contexts/auth-context'

export default function LoginScreen() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (mode === 'signup' && password !== confirmPassword) {
      setError("Passwords don't match.")
      return
    }
    setBusy(true)
    const { error: err } =
      mode === 'signin' ? await signIn(email, password) : await signUp(email, password)
    setBusy(false)
    if (err) {
      setError(err)
    } else if (mode === 'signup') {
      setInfo('Account created. If email confirmation is on, check your inbox before signing in.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">David's Tracker</h1>
          <p className="text-slate-400 mt-2">Goals · Tasks · Notes</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-800 rounded-xl p-6 space-y-4 shadow-lg"
        >
          <div>
            <label htmlFor="email" className="block text-sm text-slate-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-slate-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {mode === 'signup' && (
            <div>
              <label htmlFor="confirm-password" className="block text-sm text-slate-300 mb-1">
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}
          {info && <p className="text-sm text-emerald-400">{info}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white font-medium py-2 transition-colors"
          >
            {busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin')
            setConfirmPassword('')
            setError(null)
            setInfo(null)
          }}
          className="block mx-auto mt-4 text-sm text-slate-400 hover:text-white"
        >
          {mode === 'signin'
            ? "No account? Create one"
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
