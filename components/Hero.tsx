'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from './Button'
import Modal from './Modal'

export default function Hero() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

    const handleScrollToPosts = () => {
        const postsSection = document.getElementById('posts')
        if (postsSection) {
            postsSection.scrollIntoView({ behavior: 'smooth' })
        }
    }

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
            <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
                {/* Background Image with Overlay - clean darkening without haze */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-black/40 z-10" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/50 z-10" />
                    <Image
                        src="/images/hero-construction.png"
                        alt="Construction Site"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>

                <div className="max-w-4xl mx-auto px-4 text-center relative z-20 pt-20">
                    {/* GROUNDED: Solid badge, no blur */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 border border-white/30 mb-8"
                    >
                        <span className="w-2 h-2 bg-wip-gold rounded-full animate-pulse" />
                        <span className="text-wip-gold text-base font-black tracking-wider uppercase drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]" style={{ textShadow: '0 1px 0 rgba(0,0,0,0.3)' }}>Clarity for Construction Leaders</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-black text-white mb-8 leading-[1.1] tracking-tight drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
                    >
                        Master the <span className="text-gradient-gold">Business</span><br />
                        of Building
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-lg md:text-xl text-white font-medium max-w-2xl mx-auto leading-relaxed mb-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                    >
                        Real talk about cash flow, leadership, and building a construction business that actually works.
                        No fluff. No jargon. Just clarity.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex items-center justify-center"
                    >
                        <Button size="lg" className="gap-2 group shadow-xl shadow-black/20" onClick={handleScrollToPosts}>
                            Start Reading
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </motion.div>
                </div>
            </section>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Join the Newsletter">
                {status === 'success' ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500 border border-green-500/20">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h4 className="text-xl font-bold text-wip-text mb-2">You&apos;re on the list!</h4>
                        <p className="text-wip-muted">Thanks for subscribing. Keep an eye on your inbox.</p>
                    </div>
                ) : (
                    <div>
                        <p className="text-wip-muted mb-6">
                            Get weekly insights on construction management, cash flow, and leadership strategies delivered straight to your inbox.
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
                                        Joining...
                                    </>
                                ) : (
                                    'Subscribe for Updates'
                                )}
                            </Button>
                        </form>
                    </div>
                )}
            </Modal>
        </>
    )
}
