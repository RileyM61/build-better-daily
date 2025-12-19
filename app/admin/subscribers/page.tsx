'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSession, signOut } from '@/lib/auth'
import { createBrowserClient } from '@/lib/supabase'
import type { Subscriber } from '@/lib/supabase'

export default function AdminSubscribers() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    getSession().then((session) => {
      if (!session) {
        router.push('/admin')
      } else {
        fetchSubscribers()
      }
    })
  }, [router])

  const fetchSubscribers = async () => {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from('subscribers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching subscribers:', error)
    } else {
      setSubscribers(data as Subscriber[])
    }
    setLoading(false)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/admin')
  }

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Remove "${email}" from subscribers?`)) return

    const supabase = createBrowserClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('subscribers') as any)
      .delete()
      .eq('id', id)

    if (error) {
      alert('Failed to remove subscriber')
    } else {
      setSubscribers(subscribers.filter(s => s.id !== id))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-wip-dark flex items-center justify-center">
        <div className="text-wip-muted">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-wip-dark">
      {/* Header */}
      <header className="border-b border-wip-border bg-wip-card">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeLinecap="round"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
              <span className="text-lg font-semibold text-white">Build Better Daily</span>
            </Link>
            <span className="text-wip-muted">/</span>
            <Link href="/admin/dashboard" className="text-wip-muted hover:text-white transition-colors">
              Admin
            </Link>
            <span className="text-wip-muted">/</span>
            <span className="text-white">Subscribers</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="text-sm text-wip-muted hover:text-white transition-colors"
            >
              Posts
            </Link>
            <span className="text-wip-border">|</span>
            <button
              onClick={handleSignOut}
              className="text-sm text-wip-muted hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Subscribers</h1>
            <p className="text-wip-muted mt-1">
              {subscribers.length} {subscribers.length === 1 ? 'subscriber' : 'subscribers'} total
            </p>
          </div>
        </div>

        {subscribers.length === 0 ? (
          <div className="text-center py-12 bg-wip-card border border-wip-border rounded-xl">
            <svg className="w-12 h-12 text-wip-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-wip-muted">No subscribers yet.</p>
            <p className="text-wip-muted text-sm mt-1">They&apos;ll appear here when people subscribe on your site.</p>
          </div>
        ) : (
          <div className="bg-wip-card border border-wip-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-wip-dark/50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-wip-muted">Email</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-wip-muted w-48">Date Subscribed</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-wip-muted w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wip-border">
                {subscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="hover:bg-wip-dark/30 transition-colors">
                    <td className="px-4 py-4">
                      <span className="text-white">{subscriber.email}</span>
                    </td>
                    <td className="px-4 py-4 text-sm text-wip-muted">
                      {new Date(subscriber.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => handleDelete(subscriber.id, subscriber.email)}
                        className="p-2 text-wip-muted hover:text-red-400 transition-colors"
                        title="Remove subscriber"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}

