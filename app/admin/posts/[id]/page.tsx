'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getSession } from '@/lib/auth'
import { createBrowserClient } from '@/lib/supabase'
import { Button } from '@/components/Button'
import { ToastContainer } from '@/components/Toast'
import { useToast } from '@/lib/useToast'
import type { Post, Book, WeeklyEmail } from '@/lib/supabase'

export default function EditPostPage() {
  const params = useParams()
  const id = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const router = useRouter()
  const { toasts, showToast, removeToast } = useToast()

  // Form state
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [published, setPublished] = useState(false)
  const [books, setBooks] = useState<Book[]>([])
  const [infographicUrl, setInfographicUrl] = useState('')
  const [uploadingInfo, setUploadingInfo] = useState(false)
  const [email, setEmail] = useState<WeeklyEmail | null>(null)
  const [showEmail, setShowEmail] = useState(false)
  const [sendingEmails, setSendingEmails] = useState(false)

  const fetchPost = useCallback(async () => {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      alert('Post not found')
      router.push('/admin/dashboard')
      return
    }

    const postData = data as Post
    setTitle(postData.title)
    setSlug(postData.slug)
    setExcerpt(postData.excerpt)
    setContent(postData.content)
    setPublished(postData.published)
    setBooks(postData.books || [])
    setInfographicUrl(postData.infographic_url || '')
    
    // Fetch associated email
    const { data: emailData, error: emailError } = await supabase
      .from('weekly_emails')
      .select('*')
      .eq('post_id', id)
      .maybeSingle()
    
    if (!emailError && emailData) {
      setEmail(emailData as WeeklyEmail)
    }
    
    setLoading(false)
  }, [id, router])

  useEffect(() => {
    getSession().then((session) => {
      if (!session) {
        router.push('/admin')
      } else {
        fetchPost()
      }
    })
  }, [router, fetchPost])

  const handleSave = async () => {
    setSaving(true)

    const supabase = createBrowserClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('posts') as any)
      .update({
        title,
        slug,
        excerpt,
        content,
        published,
        books,
        infographic_url: infographicUrl,
      })
      .eq('id', id)

    if (error) {
      showToast('Failed to save: ' + error.message, 'error')
    } else {
      showToast('Post saved successfully!', 'success')
    }
    setSaving(false)
  }

  const handleSaveEmail = async () => {
    if (!email) return
    
    setSaving(true)

    const supabase = createBrowserClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('weekly_emails') as any)
      .update({
        subject: email.subject,
        preheader: email.preheader,
        body: email.body,
        leadership_prompt: email.leadership_prompt,
        watch_for: email.watch_for,
        execution_nudge: email.execution_nudge,
      })
      .eq('id', email.id)

    if (error) {
      showToast('Failed to save email: ' + error.message, 'error')
    } else {
      showToast('Email saved successfully!', 'success')
    }
    setSaving(false)
  }

  const handleSendEmails = async () => {
    if (!published) {
      showToast('Post must be published before sending emails', 'error')
      return
    }

    if (!email) {
      showToast('Weekly email must exist before sending', 'error')
      return
    }

    if (!confirm(`Send weekly emails to all active subscribers for "${title}"?`)) {
      return
    }

    setSendingEmails(true)

    try {
      const secret = prompt('Enter your CRON_SECRET to send emails:')
      if (!secret) {
        setSendingEmails(false)
        return
      }

      const response = await fetch(`/api/send-weekly-emails?post_id=${id}&secret=${encodeURIComponent(secret)}`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send emails')
      }

      let messageText = `Emails sent successfully! Sent to ${data.sent} subscribers`
      if (data.failed > 0) {
        messageText += ` (${data.failed} failed)`
        showToast(messageText, data.failed > 0 ? 'error' : 'success', 7000)
      } else {
        showToast(messageText, 'success')
      }

      // Refresh email to get updated sent status
      fetchPost()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      showToast(`Failed to send emails: ${message}`, 'error')
    } finally {
      setSendingEmails(false)
    }
  }

  const updateBook = (index: number, field: keyof Book, value: string) => {
    const newBooks = [...books]
    newBooks[index] = { ...newBooks[index], [field]: value }
    setBooks(newBooks)
  }

  const addBook = () => {
    setBooks([...books, { title: '', author: '', asin: '', description: '' }])
  }

  const removeBook = (index: number) => {
    setBooks(books.filter((_, i) => i !== index))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return
    }

    const file = e.target.files[0]
    setUploadingInfo(true)

    try {
      const supabase = createBrowserClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `infographics/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage.from('post-images').getPublicUrl(filePath)
      setInfographicUrl(data.publicUrl)
      showToast('Infographic uploaded successfully', 'success')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      showToast('Error uploading infographic: ' + error.message, 'error')
    } finally {
      setUploadingInfo(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-wip-dark flex items-center justify-center">
        <div className="flex items-center gap-3 text-wip-muted">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading post...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-wip-dark">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {/* Header */}
      <header className="border-b border-wip-border bg-wip-card sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/admin/dashboard" className="text-wip-muted hover:text-black transition-colors">
            ← Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            {email && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEmail(!showEmail)}
              >
                {showEmail ? 'Hide Email' : 'View Email'}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Edit' : 'Preview'}
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Email Editor */}
        {showEmail && email && (
          <div className="bg-wip-card border border-wip-border rounded-xl p-6 mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-black mb-2">Weekly Email Companion</h2>
                {published && !email.sent && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSendEmails}
                    disabled={sendingEmails}
                  >
                    {sendingEmails ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      'Send Weekly Emails'
                    )}
                  </Button>
                )}
                {email.sent && (
                  <span className="inline-flex items-center px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-sm border border-green-500/30">
                    ✓ Sent ({email.sent_count || 0} subscribers)
                  </span>
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSaveEmail}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Email'
                )}
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-wip-text mb-2">Subject</label>
                <input
                  type="text"
                  value={email.subject}
                  onChange={(e) => setEmail({ ...email, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-wip-dark border border-wip-border rounded-lg text-black focus:outline-none focus:border-wip-gold transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-wip-text mb-2">Preheader</label>
                <input
                  type="text"
                  value={email.preheader || ''}
                  onChange={(e) => setEmail({ ...email, preheader: e.target.value })}
                  className="w-full px-4 py-3 bg-wip-dark border border-wip-border rounded-lg text-black focus:outline-none focus:border-wip-gold transition-colors"
                  placeholder="Preview text"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-wip-text mb-2">Body</label>
                <textarea
                  value={email.body}
                  onChange={(e) => setEmail({ ...email, body: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-3 bg-wip-dark border border-wip-border rounded-lg text-black focus:outline-none focus:border-wip-gold transition-colors resize-y"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-wip-text mb-2">Leadership Prompt</label>
                <textarea
                  value={email.leadership_prompt}
                  onChange={(e) => setEmail({ ...email, leadership_prompt: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 bg-wip-dark border border-wip-border rounded-lg text-black focus:outline-none focus:border-wip-gold transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-wip-text mb-2">Watch For</label>
                <textarea
                  value={email.watch_for}
                  onChange={(e) => setEmail({ ...email, watch_for: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 bg-wip-dark border border-wip-border rounded-lg text-black focus:outline-none focus:border-wip-gold transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-wip-text mb-2">Execution Nudge</label>
                <textarea
                  value={email.execution_nudge}
                  onChange={(e) => setEmail({ ...email, execution_nudge: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 bg-wip-dark border border-wip-border rounded-lg text-black focus:outline-none focus:border-wip-gold transition-colors resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {showPreview ? (
          /* Preview Mode */
          <div className="bg-wip-card border border-wip-border rounded-xl p-8">
            <h1 className="text-3xl font-bold text-black mb-4">{title}</h1>
            <p className="text-wip-muted mb-8">{excerpt}</p>
            <div className="prose max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <div className="space-y-12">
            {/* Basic Info */}
            <div className="bg-wip-card border border-wip-border rounded-xl p-6 space-y-5">
              <h2 className="text-lg font-semibold text-black mb-6">Post Details</h2>

              <div>
                <label className="block text-sm font-medium text-wip-text mb-2">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-wip-dark border border-wip-border rounded-lg text-black focus:outline-none focus:border-wip-gold transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-wip-text mb-2">Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-4 py-3 bg-wip-dark border border-wip-border rounded-lg text-black focus:outline-none focus:border-wip-gold transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-wip-text mb-2">Excerpt</label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 bg-wip-dark border border-wip-border rounded-lg text-black focus:outline-none focus:border-wip-gold transition-colors resize-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="w-4 h-4 rounded border-wip-border bg-wip-dark text-wip-gold focus:ring-wip-gold"
                  />
                  <span className="text-sm text-wip-text">Published</span>
                </label>
              </div>

              {/* Infographic Upload */}
              <div>
                <label className="block text-sm font-medium text-wip-text mb-2">Infographic (Optional)</label>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploadingInfo}
                    className="w-full text-sm text-wip-muted
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-medium
                      file:bg-wip-gold file:text-wip-dark
                      hover:file:bg-wip-gold-dark
                      file:cursor-pointer cursor-pointer"
                  />
                  {uploadingInfo && <span className="text-sm text-wip-muted">Uploading...</span>}
                  {infographicUrl && (
                    <div className="mt-2">
                      <p className="text-xs text-green-400 mb-2">✓ Uploaded/Existing successfully</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={infographicUrl}
                        alt="Infographic preview"
                        className="max-h-40 rounded border border-wip-border"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="bg-wip-card border border-wip-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-black mb-4">Content (Markdown)</h2>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={20}
                className="w-full px-4 py-3 bg-wip-dark border border-wip-border rounded-lg text-black font-mono text-sm focus:outline-none focus:border-wip-gold transition-colors resize-y"
                placeholder="Write your post content in Markdown..."
              />
            </div>

            {/* Books */}
            <div className="bg-wip-card border border-wip-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-black">Book Recommendations</h2>
                <button
                  onClick={addBook}
                  className="text-sm text-wip-gold hover:text-wip-gold-dark transition-colors"
                >
                  + Add Book
                </button>
              </div>

              {books.length === 0 ? (
                <p className="text-wip-muted text-sm">No book recommendations yet.</p>
              ) : (
                <div className="space-y-4">
                  {books.map((book, index) => (
                    <div key={index} className="bg-wip-dark border border-wip-border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-wip-muted">Book {index + 1}</span>
                        <button
                          onClick={() => removeBook(index)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={book.title}
                          onChange={(e) => updateBook(index, 'title', e.target.value)}
                          placeholder="Book Title"
                          className="px-3 py-2 bg-wip-card border border-wip-border rounded text-black text-sm focus:outline-none focus:border-wip-gold"
                        />
                        <input
                          type="text"
                          value={book.author}
                          onChange={(e) => updateBook(index, 'author', e.target.value)}
                          placeholder="Author"
                          className="px-3 py-2 bg-wip-card border border-wip-border rounded text-black text-sm focus:outline-none focus:border-wip-gold"
                        />
                      </div>
                      <textarea
                        value={book.description}
                        onChange={(e) => updateBook(index, 'description', e.target.value)}
                        placeholder="Why this book is relevant..."
                        rows={2}
                        className="w-full px-3 py-2 bg-wip-card border border-wip-border rounded text-black text-sm focus:outline-none focus:border-wip-gold resize-none"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

