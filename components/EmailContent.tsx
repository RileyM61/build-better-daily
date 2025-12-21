'use client'

import { useState } from 'react'
import type { LeadershipTool } from '@/lib/supabase'

interface EmailContentProps {
  postId: string
  postSlug: string
}

interface EmailData {
  subject: string
  body: string
  leadership_prompt: string
  watch_for: string
  execution_nudge: string
  leadership_tool: LeadershipTool
  article_url: string
}

export default function EmailContent({ postId, postSlug }: EmailContentProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailData, setEmailData] = useState<EmailData | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/get-email-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), postId }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to get email content')
        setEmailData(null)
        return
      }

      setEmailData(data.email)
    } catch (err) {
      setError('Failed to load email content. Please try again.')
      setEmailData(null)
    } finally {
      setLoading(false)
    }
  }

  if (emailData) {
    return (
      <div className="mt-12 pt-12 border-t-2 border-wip-border">
        <div className="bg-wip-card border-2 border-wip-border rounded-lg p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-wip-heading mb-6">
            Your Leadership Email
          </h2>

          {/* Orientation */}
          <p className="text-sm text-wip-muted italic mb-6">
            This is your weekly leadership prompt — designed to be brought into the room, not just read.
          </p>

          {/* Opening Frame */}
          <div className="mb-8">
            <p className="text-base text-wip-text leading-relaxed">
              {emailData.body}
            </p>
          </div>

          {/* Core Leadership Tool */}
          {emailData.leadership_tool && (
            <div className="bg-wip-dark border-l-4 border-wip-gold p-6 mb-8 rounded-r-lg">
              <h3 className="text-lg font-semibold text-wip-heading mb-4">
                Bring This to Your Leadership Meeting
              </h3>

              <div className="space-y-4">
                <div>
                  <strong className="text-wip-heading block mb-2">The Question:</strong>
                  <p className="text-wip-text">{emailData.leadership_tool.question}</p>
                </div>

                <div>
                  <strong className="text-wip-heading block mb-2">The Prompt:</strong>
                  <p className="text-wip-text">{emailData.leadership_tool.prompt}</p>
                </div>

                <div>
                  <strong className="text-wip-heading block mb-2">The Action:</strong>
                  <p className="text-wip-text">{emailData.leadership_tool.action}</p>
                </div>
              </div>
            </div>
          )}

          {/* Friction Warning */}
          <div className="mb-6">
            <strong className="text-wip-heading block mb-2">What will derail this conversation:</strong>
            <p className="text-wip-text">{emailData.watch_for}</p>
          </div>

          {/* Execution Nudge */}
          <div className="mb-8">
            <strong className="text-wip-heading block mb-2">If it stalls:</strong>
            <p className="text-wip-text">{emailData.execution_nudge}</p>
          </div>

          {/* Reset button */}
          <button
            onClick={() => {
              setEmailData(null)
              setEmail('')
            }}
            className="text-sm text-wip-gold hover:text-wip-gold-dark transition-colors"
          >
            ← View different email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-12 pt-12 border-t-2 border-wip-border">
      <div className="bg-wip-card border-2 border-wip-border rounded-lg p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-wip-heading mb-4">
          Get Your Leadership Email
        </h2>
        <p className="text-wip-muted mb-6">
          Enter your email to view the leadership prompts and action items for this article.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-3 border-2 border-wip-border rounded-lg bg-white text-wip-text focus:outline-none focus:ring-2 focus:ring-wip-gold focus:border-wip-gold"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-wip-gold hover:bg-wip-gold-dark text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Get Email Content'}
          </button>
        </form>
      </div>
    </div>
  )
}

