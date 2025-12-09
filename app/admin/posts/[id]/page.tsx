'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getSession } from '@/lib/auth'
import { createBrowserClient } from '@/lib/supabase'
import type { Post, Book } from '@/lib/supabase'

export default function EditPostPage() {
  const params = useParams()
  const id = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const router = useRouter()

  // Form state
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [published, setPublished] = useState(false)
  const [books, setBooks] = useState<Book[]>([])
  const [infographicUrl, setInfographicUrl] = useState('')
  const [uploadingInfo, setUploadingInfo] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [debugData, setDebugData] = useState<any>(null)

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
    console.log('Fetched Post Data:', postData)
    setDebugData(postData)
    setTitle(postData.title)
    setSlug(postData.slug)
    setExcerpt(postData.excerpt)
    setContent(postData.content)
    setPublished(postData.published)
    setBooks(postData.books || [])
    setInfographicUrl(postData.infographic_url || '')
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
    setMessage(null)

    const supabase = createBrowserClient()
    const updatePayload = {
      title,
      slug,
      excerpt,
      content,
      published,
      books,
      infographic_url: infographicUrl,
    }
    console.log('Reviewing Payload:', updatePayload)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('posts') as any)
      .update(updatePayload)
      .eq('id', id)

    if (error) {
      setMessage({ type: 'error', text: 'Failed to save: ' + error.message })
    } else {
      setMessage({ type: 'success', text: 'Post saved successfully!' })
    }
    setSaving(false)
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
      setMessage({ type: 'success', text: 'Infographic uploaded successfully' })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Error uploading infographic: ' + error.message })
    } finally {
      setUploadingInfo(false)
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
      <header className="border-b border-wip-border bg-wip-card sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-wip-muted hover:text-white transition-colors">
              ← Back to Dashboard
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-4 py-2 bg-wip-dark border border-wip-border text-wip-text rounded-lg hover:border-wip-gold/50 transition-colors text-sm"
            >
              {showPreview ? 'Edit' : 'Preview'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-wip-gold hover:bg-wip-gold-dark text-wip-dark font-medium rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </header>

      {/* Message */}
      {message && (
        <div className={`max-w-6xl mx-auto px-4 mt-4`}>
          <div className={`px-4 py-3 rounded-lg text-sm ${message.type === 'success'
            ? 'bg-green-500/10 border border-green-500/50 text-green-400'
            : 'bg-red-500/10 border border-red-500/50 text-red-400'
            }`}>
            {message.text}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {showPreview ? (
          /* Preview Mode */
          <div className="bg-wip-card border border-wip-border rounded-xl p-8">
            <h1 className="text-3xl font-bold text-white mb-4">{title}</h1>
            <p className="text-wip-muted mb-8">{excerpt}</p>
            <div className="prose max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-wip-card border border-wip-border rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white mb-4">Post Details</h2>

              <div>
                <label className="block text-sm font-medium text-wip-text mb-2">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-wip-dark border border-wip-border rounded-lg text-white focus:outline-none focus:border-wip-gold transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-wip-text mb-2">Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-4 py-3 bg-wip-dark border border-wip-border rounded-lg text-white focus:outline-none focus:border-wip-gold transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-wip-text mb-2">Excerpt</label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 bg-wip-dark border border-wip-border rounded-lg text-white focus:outline-none focus:border-wip-gold transition-colors resize-none"
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
              <h2 className="text-lg font-semibold text-white mb-4">Content (Markdown)</h2>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={20}
                className="w-full px-4 py-3 bg-wip-dark border border-wip-border rounded-lg text-white font-mono text-sm focus:outline-none focus:border-wip-gold transition-colors resize-y"
                placeholder="Write your post content in Markdown..."
              />
            </div>

            {/* Books */}
            <div className="bg-wip-card border border-wip-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Book Recommendations</h2>
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
                          className="px-3 py-2 bg-wip-card border border-wip-border rounded text-white text-sm focus:outline-none focus:border-wip-gold"
                        />
                        <input
                          type="text"
                          value={book.author}
                          onChange={(e) => updateBook(index, 'author', e.target.value)}
                          placeholder="Author"
                          className="px-3 py-2 bg-wip-card border border-wip-border rounded text-white text-sm focus:outline-none focus:border-wip-gold"
                        />
                      </div>
                      <textarea
                        value={book.description}
                        onChange={(e) => updateBook(index, 'description', e.target.value)}
                        placeholder="Why this book is relevant..."
                        rows={2}
                        className="w-full px-3 py-2 bg-wip-card border border-wip-border rounded text-white text-sm focus:outline-none focus:border-wip-gold resize-none"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Debug Info */}
      <div className="max-w-6xl mx-auto px-4 py-8 mb-8">
        <details className="bg-gray-800 p-4 rounded text-xs text-white">
          <summary className="cursor-pointer font-bold mb-2">Debug Info (Developer Only)</summary>
          <pre>{JSON.stringify(debugData, null, 2)}</pre>
        </details>
      </div>
    </div>
  )
}

