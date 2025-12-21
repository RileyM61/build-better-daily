'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSession, signOut } from '@/lib/auth'
import { createBrowserClient } from '@/lib/supabase'
import type { Post, LinkedInPack } from '@/lib/supabase'
import { Copy, Check, ChevronDown, ChevronUp, Save, ExternalLink } from 'lucide-react'

interface PostWithPack extends Post {
  linkedinPack?: LinkedInPack
}

export default function SocialAdminPage() {
  const [posts, setPosts] = useState<PostWithPack[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedPost, setExpandedPost] = useState<string | null>(null)
  const [editingPack, setEditingPack] = useState<LinkedInPack | null>(null)
  const [saving, setSaving] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
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
    
    // Fetch published posts
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })

    if (postsError) {
      console.error('Error fetching posts:', postsError)
      setLoading(false)
      return
    }

    // Fetch LinkedIn Packs for each post
    const postsWithPacks = await Promise.all(
      (postsData as Post[]).map(async (post) => {
        const { data: packData } = await supabase
          .from('linkedin_packs')
          .select('*')
          .eq('post_id', post.id)
          .single()

        return {
          ...post,
          linkedinPack: packData as LinkedInPack | undefined,
        } as PostWithPack
      })
    )

    setPosts(postsWithPacks)
    setLoading(false)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/admin')
  }

  const handleExpand = (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null)
      setEditingPack(null)
    } else {
      setExpandedPost(postId)
      const post = posts.find(p => p.id === postId)
      if (post?.linkedinPack) {
        setEditingPack({ ...post.linkedinPack })
      }
    }
  }

  const handleFieldChange = (field: keyof LinkedInPack, value: string | string[]) => {
    if (!editingPack) return
    setEditingPack({
      ...editingPack,
      [field]: value,
    })
  }

  const handleSave = async () => {
    if (!editingPack) return

    setSaving(true)
    try {
      // Determine if status should be 'edited' (if it was 'draft' and we're making changes)
      const originalPack = posts.find(p => p.id === editingPack.post_id)?.linkedinPack
      const shouldMarkEdited = originalPack?.status === 'draft' && 
        JSON.stringify(editingPack) !== JSON.stringify(originalPack)

      const updates: Partial<LinkedInPack> = {
        primary_post: editingPack.primary_post,
        short_version: editingPack.short_version,
        comment_starters: editingPack.comment_starters,
        reply_angles: editingPack.reply_angles,
        article_link: editingPack.article_link,
      }

      if (shouldMarkEdited) {
        updates.status = 'edited'
      }

      const response = await fetch('/api/linkedin-pack', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingPack.id,
          ...updates,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || 'Failed to save')
      }

      // Refresh posts to get updated data
      await fetchPosts()
      
      // Keep the pack expanded
      setExpandedPost(editingPack.post_id)
      
      alert('LinkedIn Pack saved successfully')
    } catch (error) {
      console.error('Error saving LinkedIn Pack:', error)
      alert(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleMarkAsPosted = async (packId: string) => {
    if (!confirm('Mark this LinkedIn Pack as posted?')) return

    try {
      const response = await fetch('/api/linkedin-pack', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: packId,
          status: 'posted',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark as posted')
      }

      await fetchPosts()
      alert('Marked as posted')
    } catch (error) {
      console.error('Error marking as posted:', error)
      alert('Failed to mark as posted')
    }
  }

  const handleCopy = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldId)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      alert('Failed to copy to clipboard')
    }
  }

  const getStatusBadge = (status: LinkedInPack['status']) => {
    const styles = {
      draft: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      edited: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      posted: 'bg-green-500/20 text-green-400 border-green-500/30',
    }
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium border ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
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
              <span className="text-lg font-semibold text-black">Build Better Daily</span>
            </Link>
            <span className="text-wip-muted">/</span>
            <span className="text-black">Social</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="text-sm text-wip-muted hover:text-black transition-colors"
            >
              Dashboard
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-black mb-2">LinkedIn Pack Manager</h1>
          <p className="text-wip-muted text-sm">
            Review, edit, and manage LinkedIn content generated alongside weekly articles.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12 bg-wip-card border border-wip-border rounded-xl">
            <p className="text-wip-muted">No published posts yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-wip-card border border-wip-border rounded-xl overflow-hidden"
              >
                {/* Post Header */}
                <div
                  className="p-4 hover:bg-wip-dark/30 transition-colors cursor-pointer"
                  onClick={() => handleExpand(post.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-black">{post.title}</h3>
                        {post.linkedinPack ? (
                          getStatusBadge(post.linkedinPack.status)
                        ) : (
                          <span className="px-2 py-1 rounded text-xs font-medium border bg-gray-500/20 text-gray-400 border-gray-500/30">
                            No Pack
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-wip-muted line-clamp-1">{post.excerpt}</p>
                      <p className="text-xs text-wip-muted mt-1">
                        {new Date(post.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="ml-4">
                      {expandedPost === post.id ? (
                        <ChevronUp className="w-5 h-5 text-wip-muted" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-wip-muted" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedPost === post.id && post.linkedinPack && editingPack && (
                  <div className="border-t border-wip-border p-6 space-y-6">
                    {/* Primary Post */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-black">Primary LinkedIn Post</label>
                        <button
                          onClick={() => handleCopy(editingPack.primary_post, `primary-${post.id}`)}
                          className="flex items-center gap-1 text-xs text-wip-muted hover:text-black transition-colors"
                        >
                          {copiedField === `primary-${post.id}` ? (
                            <>
                              <Check className="w-3 h-3" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <textarea
                        value={editingPack.primary_post}
                        onChange={(e) => handleFieldChange('primary_post', e.target.value)}
                        className="w-full h-48 bg-wip-dark border border-wip-border rounded-lg p-3 text-black placeholder-wip-muted focus:outline-none focus:ring-1 focus:ring-wip-gold/50 text-sm leading-relaxed resize-none"
                        placeholder="Primary LinkedIn post (5-8 paragraphs, first person, ends with question)"
                      />
                    </div>

                    {/* Short Version */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-black">Short Version</label>
                        <button
                          onClick={() => handleCopy(editingPack.short_version, `short-${post.id}`)}
                          className="flex items-center gap-1 text-xs text-wip-muted hover:text-black transition-colors"
                        >
                          {copiedField === `short-${post.id}` ? (
                            <>
                              <Check className="w-3 h-3" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <textarea
                        value={editingPack.short_version}
                        onChange={(e) => handleFieldChange('short_version', e.target.value)}
                        className="w-full h-32 bg-wip-dark border border-wip-border rounded-lg p-3 text-black placeholder-wip-muted focus:outline-none focus:ring-1 focus:ring-wip-gold/50 text-sm leading-relaxed resize-none"
                        placeholder="Short version (3-4 paragraphs)"
                      />
                    </div>

                    {/* Comment Starters */}
                    <div>
                      <label className="text-sm font-medium text-black mb-2 block">Comment Starters (3 prompts)</label>
                      {editingPack.comment_starters.map((starter, idx) => (
                        <div key={idx} className="mb-2">
                          <textarea
                            value={starter}
                            onChange={(e) => {
                              const updated = [...editingPack.comment_starters]
                              updated[idx] = e.target.value
                              handleFieldChange('comment_starters', updated)
                            }}
                            className="w-full h-20 bg-wip-dark border border-wip-border rounded-lg p-3 text-black placeholder-wip-muted focus:outline-none focus:ring-1 focus:ring-wip-gold/50 text-sm resize-none"
                            placeholder={`Comment starter ${idx + 1}`}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Reply Angles */}
                    <div>
                      <label className="text-sm font-medium text-black mb-2 block">Reply Angles (3 prompts)</label>
                      {editingPack.reply_angles.map((angle, idx) => (
                        <div key={idx} className="mb-2">
                          <textarea
                            value={angle}
                            onChange={(e) => {
                              const updated = [...editingPack.reply_angles]
                              updated[idx] = e.target.value
                              handleFieldChange('reply_angles', updated)
                            }}
                            className="w-full h-20 bg-wip-dark border border-wip-border rounded-lg p-3 text-black placeholder-wip-muted focus:outline-none focus:ring-1 focus:ring-wip-gold/50 text-sm resize-none"
                            placeholder={`Reply angle ${idx + 1}`}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Article Link */}
                    <div>
                      <label className="text-sm font-medium text-black mb-2 block">Article Link (Optional CTA)</label>
                      <input
                        type="text"
                        value={editingPack.article_link || ''}
                        onChange={(e) => handleFieldChange('article_link', e.target.value)}
                        className="w-full bg-wip-dark border border-wip-border rounded-lg p-3 text-black placeholder-wip-muted focus:outline-none focus:ring-1 focus:ring-wip-gold/50 text-sm"
                        placeholder="I wrote more about this here → [link]"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-wip-border">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleMarkAsPosted(editingPack.id)}
                          disabled={editingPack.status === 'posted'}
                          className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {editingPack.status === 'posted' ? 'Posted' : 'Mark as Posted'}
                        </button>
                        <Link
                          href={`/post/${post.slug}`}
                          target="_blank"
                          className="flex items-center gap-1 text-sm text-wip-muted hover:text-black transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Article
                        </Link>
                      </div>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-wip-gold hover:bg-wip-gold-dark text-wip-dark font-medium rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                )}

                {/* No Pack Message */}
                {expandedPost === post.id && !post.linkedinPack && (
                  <div className="border-t border-wip-border p-6 text-center">
                    <p className="text-wip-muted">
                      No LinkedIn Pack generated yet. Generate a new post to create one automatically.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

