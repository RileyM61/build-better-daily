'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { getSession, signOut } from '@/lib/auth'
import { createBrowserClient } from '@/lib/supabase'
import { Button } from '@/components/Button'
import { ToastContainer } from '@/components/Toast'
import { useToast } from '@/lib/useToast'
import type { Post } from '@/lib/supabase'

interface PostWithEmail extends Post {
  hasEmail?: boolean
}

export default function AdminDashboard() {
  const [posts, setPosts] = useState<PostWithEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ id: string; title: string } | null>(null)
  const router = useRouter()
  const { toasts, showToast, removeToast } = useToast()

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
      // Check which posts have emails
      const postsWithEmailStatus = await Promise.all(
        (data as Post[]).map(async (post) => {
          const { data: emailData } = await supabase
            .from('weekly_emails')
            .select('id')
            .eq('post_id', post.id)
            .single()
          
          return { ...post, hasEmail: !!emailData } as PostWithEmail
        })
      )
      setPosts(postsWithEmailStatus)
    }
    setLoading(false)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/admin')
  }

  const handleDeleteClick = (id: string, title: string) => {
    setShowDeleteConfirm({ id, title })
  }

  const handleDeleteConfirm = async () => {
    if (!showDeleteConfirm) return

    const { id, title } = showDeleteConfirm
    setDeletingId(id)
    setShowDeleteConfirm(null)

    try {
      // Get the post slug before deletion for revalidation
      const postToDelete = posts.find(p => p.id === id)
      const slug = postToDelete?.slug

      // Use server-side API endpoint with service role key to ensure deletion works
      const response = await fetch('/api/delete-post', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId: id }),
      })

      const data = await response.json()

      if (!response.ok) {
        showToast(`Failed to delete post: ${data.error || 'Unknown error'}`, 'error')
        setDeletingId(null)
        return
      }

      // Remove from local state
      setPosts(posts.filter(p => p.id !== id))

      // Trigger revalidation to clear Next.js cache
      try {
        await fetch('/api/revalidate?path=/', { method: 'POST' })
        if (slug) {
          await fetch(`/api/revalidate?path=/post/${slug}`, { method: 'POST' })
        }
      } catch (revalidateError) {
        console.warn('Revalidation failed (this is okay):', revalidateError)
      }

      showToast(`"${title}" deleted successfully`, 'success')
    } catch (error) {
      console.error('Error deleting post:', error)
      showToast('Failed to delete post. Please try again.', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const togglePublished = async (id: string, currentStatus: boolean) => {
    setTogglingId(id)
    const supabase = createBrowserClient()
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('posts') as any)
        .update({ published: !currentStatus })
        .eq('id', id)

      if (error) {
        showToast('Failed to update post status', 'error')
      } else {
        setPosts(posts.map(p => p.id === id ? { ...p, published: !currentStatus } : p))
        showToast(
          `Post ${!currentStatus ? 'published' : 'unpublished'} successfully`,
          'success',
          3000
        )
      }
    } catch {
      showToast('Failed to update post status', 'error')
    } finally {
      setTogglingId(null)
    }
  }

  const handleGeneratePost = async () => {
    setGenerating(true)
    
    try {
      // Prompt for the cron secret
      const secret = prompt('Enter your CRON_SECRET to generate a new post:')
      if (!secret) {
        setGenerating(false)
        return
      }

      const response = await fetch(`/api/generate-post?secret=${encodeURIComponent(secret)}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to generate post')
      }
      
      // Success - refresh posts list
      showToast(`Successfully generated: "${data.post?.title || 'New Post'}"`, 'success')
      fetchPosts()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      showToast(`Generation failed: ${message}`, 'error')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-wip-dark flex items-center justify-center">
        <div className="flex items-center gap-3 text-wip-muted">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading posts...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-wip-dark">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {/* Header */}
      <header className="border-b border-wip-border bg-wip-card">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeLinecap="round"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
              <span className="text-lg font-semibold text-black">Build Better Daily</span>
            </Link>
            <span className="text-wip-muted">/</span>
            <span className="text-black">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/social"
              className="text-sm text-wip-muted hover:text-black transition-colors"
            >
              Social
            </Link>
            <span className="text-wip-border">|</span>
            <Link
              href="/admin/subscribers"
              className="text-sm text-wip-muted hover:text-black transition-colors"
            >
              Subscribers
            </Link>
            <span className="text-wip-border">|</span>
            <button
              onClick={handleSignOut}
              className="text-sm text-wip-muted hover:text-black transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-2xl font-bold text-black">Blog Posts</h1>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGeneratePost}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                'Generate Post'
              )}
            </Button>
            <Button
              variant="primary"
              as={Link}
              href="/admin/posts/new"
            >
              + New Post
            </Button>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-16 bg-wip-card border border-wip-border rounded-xl">
            <p className="text-wip-muted">No posts yet. Generate or create your first post!</p>
          </div>
        ) : (
          <div className="bg-wip-card border border-wip-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-wip-dark/50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-wip-muted">Title</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-wip-muted w-32">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-wip-muted w-40">Date</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-wip-muted w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wip-border">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-wip-dark/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/posts/${post.id}`}
                          className="text-black hover:text-wip-gold transition-colors font-medium"
                        >
                          {post.title}
                        </Link>
                        {post.hasEmail && (
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30" title="Has email companion">
                            📧
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-wip-muted mt-1 line-clamp-1">{post.excerpt}</p>
                    </td>
                    <td className="px-6 py-5">
                      <button
                        onClick={() => togglePublished(post.id, post.published)}
                        disabled={togglingId === post.id}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50 ${
                          post.published
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}
                      >
                        {togglingId === post.id ? (
                          <span className="flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Updating...
                          </span>
                        ) : (
                          post.published ? 'Published' : 'Draft'
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-5 text-sm text-wip-muted">
                      {new Date(post.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/post/${post.slug}`}
                          target="_blank"
                          className="p-2 text-wip-muted hover:text-black transition-colors"
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
                          onClick={() => handleDeleteClick(post.id, post.title)}
                          disabled={deletingId === post.id}
                          className="p-2 text-wip-muted hover:text-red-400 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === post.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-wip-card border-2 border-wip-border rounded-lg p-6 max-w-md mx-4 shadow-lg">
              <h3 className="text-lg font-bold text-wip-heading mb-2">Delete Post?</h3>
              <p className="text-wip-muted mb-6">
                Are you sure you want to permanently delete &quot;{showDeleteConfirm.title}&quot;? This cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDeleteConfirm}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

