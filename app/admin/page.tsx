'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, getSession } from '@/lib/auth'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if already logged in
    getSession().then((session) => {
      if (session) {
        router.push('/admin/dashboard')
      } else {
        setCheckingAuth(false)
      }
    })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, password)
      router.push('/admin/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-wip-dark flex items-center justify-center">
        <div className="text-wip-muted">Checking authentication...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-wip-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-wip-gold to-wip-gold-dark rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-wip-dark font-bold text-xl">W</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Login</h1>
          <p className="text-wip-muted mt-2">Sign in to manage your blog</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-wip-card border border-wip-border rounded-xl p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-wip-text mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-wip-dark border border-wip-border rounded-lg text-white placeholder-wip-muted focus:outline-none focus:border-wip-gold transition-colors"
              placeholder="admin@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-wip-text mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-wip-dark border border-wip-border rounded-lg text-white placeholder-wip-muted focus:outline-none focus:border-wip-gold transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-wip-gold hover:bg-wip-gold-dark text-wip-dark font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-wip-muted text-sm mt-6">
          First time? Create an admin account in your Supabase dashboard.
        </p>
      </div>
    </div>
  )
}

