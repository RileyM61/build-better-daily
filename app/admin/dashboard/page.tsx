'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSession, signOut } from '@/lib/auth'
import { createBrowserClient } from '@/lib/supabase'
import type { Post } from '@/lib/supabase'

export default function AdminDashboard() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check authentication
    getSession().then((session) => {
      if (!session) {
        router.push('/admin')
      } else {
        fetchPosts()
      }
    })
  }, [router])

  const fetchPosts = async () => {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching posts:', error)
    } else {
      setPosts(data as Post[])
    }
    setLoading(false)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/admin')
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return

    const supabase = createBrowserClient()
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Failed to delete post')
    } else {
      setPosts(posts.filter(p => p.id !== id))
    }
  }

  const togglePublished = async (id: string, currentStatus: boolean) => {
    const supabase = createBrowserClient()
    const { error } = await supabase
      .from('posts')
      .update({ published: !currentStatus })
      .eq('id', id)

    if (error) {
      alert('Failed to update post')
    } else {
      setPosts(posts.map(p => p.id === id ? { ...p, published: !currentStatus } : p))
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
              <div className="w-8 h-8 bg-gradient-to-br from-wip-gold to-wip-gold-dark rounded-lg flex items-center justify-center">
                <span className="text-wip-dark font-bold text-sm">W</span>
              </div>
              <span className="text-lg font-semibold text-white">WIP Wisdom</span>
            </Link>
            <span className="text-wip-muted">/ Admin</span>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm text-wip-muted hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Blog Posts</h1>
          <div className="flex gap-3">
            <a
              href="/api/generate-post?secret=my-secret-cron-key-12345"
              target="_blank"
              className="px-4 py-2 bg-wip-card border border-wip-border text-wip-text rounded-lg hover:border-wip-gold/50 transition-colors text-sm"
            >
              Generate New Post
            </a>
            <Link
              href="/admin/posts/new"
              className="px-4 py-2 bg-wip-gold hover:bg-wip-gold-dark text-wip-dark font-medium rounded-lg transition-colors text-sm"
            >
              + New Post
            </Link>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12 bg-wip-card border border-wip-border rounded-xl">
            <p className="text-wip-muted">No posts yet. Generate or create your first post!</p>
          </div>
        ) : (
          <div className="bg-wip-card border border-wip-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-wip-dark/50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-wip-muted">Title</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-wip-muted w-32">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-wip-muted w-40">Date</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-wip-muted w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wip-border">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-wip-dark/30 transition-colors">
                    <td className="px-4 py-4">
                      <Link
                        href={`/admin/posts/${post.id}`}
                        className="text-white hover:text-wip-gold transition-colors font-medium"
                      >
                        {post.title}
                      </Link>
                      <p className="text-sm text-wip-muted mt-1 line-clamp-1">{post.excerpt}</p>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => togglePublished(post.id, post.published)}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          post.published
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {post.published ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-sm text-wip-muted">
                      {new Date(post.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/post/${post.slug}`}
                          target="_blank"
                          className="p-2 text-wip-muted hover:text-white transition-colors"
                          title="View"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        <Link
                          href={`/admin/posts/${post.id}`}
                          className="p-2 text-wip-muted hover:text-wip-gold transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDelete(post.id, post.title)}
                          className="p-2 text-wip-muted hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
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

