'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getSession } from '@/lib/auth'
import { createBrowserClient } from '@/lib/supabase'
import { Button } from '@/components/Button'
import { ToastContainer } from '@/components/Toast'
import { useToast } from '@/lib/useToast'
import type { Book } from '@/lib/supabase'

export default function NewPostPage() {
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

  useEffect(() => {
    getSession().then((session) => {
      if (!session) {
        router.push('/admin')
      } else {
        setLoading(false)
      }
    })
  }, [router])

  // Auto-generate slug from title
  useEffect(() => {
    const generatedSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
    setSlug(generatedSlug)
  }, [title])

  const handleSave = async () => {
    if (!title || !slug || !content) {
      showToast('Please fill in title, slug, and content', 'error')
      return
    }

    setSaving(true)

    const supabase = createBrowserClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('posts') as any)
      .insert({
        title,
        slug,
        excerpt: excerpt || title,
        content,
        published,
        books,
        infographic_url: infographicUrl,
      })
      .select()
      .single()

    if (error) {
      showToast('Failed to create: ' + error.message, 'error')
      setSaving(false)
    } else {
      showToast('Post created successfully!', 'success')
      router.push(`/admin/posts/${data.id}`)
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
          <span>Loading...</span>
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
                  Creating...
                </>
              ) : (
                'Create Post'
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-black mb-12">Create New Post</h1>

        {showPreview ? (
          /* Preview Mode */
          <div className="bg-wip-card border border-wip-border rounded-xl p-8">
            <h1 className="text-3xl font-bold text-black mb-4">{title || 'Untitled'}</h1>
            <p className="text-wip-muted mb-8">{excerpt || 'No excerpt'}</p>
            <div className="prose max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || '*No content yet*'}</ReactMarkdown>
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <div className="space-y-12">
            {/* Basic Info */}
            <div className="bg-wip-card border border-wip-border rounded-xl p-6 space-y-5">
              <h2 className="text-lg font-semibold text-black mb-4">Post Details</h2>

              <div>
                <label className="block text-sm font-medium text-wip-text mb-2">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-wip-dark border border-wip-border rounded-lg text-black focus:outline-none focus:border-wip-gold transition-colors"
                  placeholder="Enter post title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-wip-text mb-2">Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-4 py-3 bg-wip-dark border border-wip-border rounded-lg text-black focus:outline-none focus:border-wip-gold transition-colors"
                  placeholder="url-friendly-slug"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-wip-text mb-2">Excerpt</label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 bg-wip-dark border border-wip-border rounded-lg text-black focus:outline-none focus:border-wip-gold transition-colors resize-none"
                  placeholder="Brief description of the post..."
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
                  <span className="text-sm text-wip-text">Publish immediately</span>
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
                      <p className="text-xs text-green-400 mb-2">✓ Uploaded successfully</p>
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
                <p className="text-wip-muted text-sm">No book recommendations yet. Click &quot;Add Book&quot; to add one.</p>
              ) : (
                <div className="space-y-5">
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

