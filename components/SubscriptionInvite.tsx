/**
 * Subscription Invite Component
 * 
 * DESIGN INTENT:
 * This component positions subscription as a natural continuation of trust,
 * not a marketing CTA. It appears after the "Read First" post, once the reader
 * understands what Build Better Daily is.
 * 
 * Tone: Human, first-person, invitation (not request)
 * Visual: Quiet, subtle, optional (not demanding)
 * Copy: "I send this to you" not "sign up"
 */

'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from './Button'
import Modal from './Modal'

export default function SubscriptionInvite() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus('loading')

        try {
            const res = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })

            if (res.ok) {
                setStatus('success')
                setTimeout(() => {
                    setIsModalOpen(false)
                    setStatus('idle')
                    setEmail('')
                }, 3000)
            } else {
                setStatus('error')
            }
        } catch {
            setStatus('error')
        }
    }

    return (
        <>
            {/* LOAD-BEARING: Subscription invite with structural container */}
            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="text-center space-y-4 bg-wip-navy rounded-lg p-8 border-2 border-wip-border">
                    <p className="text-wip-muted text-sm leading-relaxed max-w-lg mx-auto">
                        I send one short note each week to help you bring this into your leadership meeting and turn it into action.
                    </p>
                    <Button
                        variant="ghost"
                        onClick={() => setIsModalOpen(true)}
                    >
                        Get the weekly leadership note
                    </Button>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="">
                {status === 'success' ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500 border border-green-500/20">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h4 className="text-xl font-bold text-wip-text mb-2">You&apos;re on the list</h4>
                        <p className="text-wip-muted">Check your inbox for the next weekly note.</p>
                    </div>
                ) : (
                    <div>
                        <p className="text-wip-muted mb-6 leading-relaxed">
                            I send one short note each week. It includes the leadership prompt from that week&apos;s article, plus a quick way to bring it into your meeting. No newsletter. No marketing. Just the tool.
                        </p>
                        <form onSubmit={handleSubscribe} className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-wip-muted mb-2">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@company.com"
                                    className="w-full px-4 py-3 rounded-lg bg-wip-navy/50 border border-wip-border text-wip-text placeholder:text-wip-muted/50 focus:outline-none focus:ring-2 focus:ring-wip-gold/50 focus:border-wip-gold/50 transition-all"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={status === 'loading'}
                            >
                                {status === 'loading' ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Adding...
                                    </>
                                ) : (
                                    'Get the note'
                                )}
                            </Button>
                        </form>
                    </div>
                )}
            </Modal>
        </>
    )
}

