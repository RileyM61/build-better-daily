'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './Button'
import { Loader2, Copy, Check, Linkedin, Twitter, Sparkles, AlertCircle } from 'lucide-react'

interface SocialGeneratorProps {
    post: {
        id: string
        title: string
        content: string
    }
}

type Platform = 'linkedin' | 'twitter'

export default function SocialGenerator({ post }: SocialGeneratorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedContent, setGeneratedContent] = useState<{ linkedin: string; twitter: string } | null>(null)
    const [activeTab, setActiveTab] = useState<Platform>('linkedin')
    const [copied, setCopied] = useState(false)
    const [error, setError] = useState('')

    const handleGenerate = async () => {
        setIsGenerating(true)
        setError('')

        try {
            const res = await fetch('/api/generate-social', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: post.title,
                    content: post.content
                }),
            })

            if (!res.ok) throw new Error('Failed to generate content')

            const data = await res.json()
            setGeneratedContent(data)
            setIsOpen(true)
        } catch {
            setError('Failed to generate. Please try again.')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleCopy = async () => {
        if (!generatedContent) return
        const text = generatedContent[activeTab]
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="mt-4">
            {!isOpen && (
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="gap-2 border-wip-gold/30 text-wip-gold hover:bg-wip-gold/10"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Crafting...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Generate Social Posts
                            </>
                        )}
                    </Button>
                    {error && <span className="text-red-400 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {error}</span>}
                </div>
            )}

            <AnimatePresence>
                {isOpen && generatedContent && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-6 bg-wip-card/50 rounded-xl border border-wip-border overflow-hidden"
                    >
                        {/* Tabs */}
                        <div className="flex bg-wip-navy border-b border-wip-border">
                            <button
                                onClick={() => setActiveTab('linkedin')}
                                className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'linkedin'
                                    ? 'bg-wip-card text-white border-b-2 border-wip-gold'
                                    : 'text-wip-muted hover:text-white hover:bg-wip-card/50'
                                    }`}
                            >
                                <Linkedin className="w-4 h-4" /> LinkedIn
                            </button>
                            <button
                                onClick={() => setActiveTab('twitter')}
                                className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'twitter'
                                    ? 'bg-wip-card text-white border-b-2 border-wip-gold'
                                    : 'text-wip-muted hover:text-white hover:bg-wip-card/50'
                                    }`}
                            >
                                <Twitter className="w-4 h-4" /> X (Twitter)
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="p-4 bg-wip-card">
                            <textarea
                                value={generatedContent[activeTab]}
                                onChange={(e) => setGeneratedContent({
                                    ...generatedContent,
                                    [activeTab]: e.target.value
                                })}
                                className="w-full h-64 bg-wip-navy/50 border border-wip-border rounded-lg p-4 text-white placeholder:text-wip-muted/50 focus:outline-none focus:ring-1 focus:ring-wip-gold/50 text-sm leading-relaxed resize-none font-mono"
                            />

                            <div className="flex justify-between items-center mt-4">
                                <span className="text-xs text-wip-muted italic">
                                    You can edit the text before copying.
                                </span>
                                <div className="flex gap-3">
                                    <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="text-wip-muted hover:text-white">
                                        Close
                                    </Button>
                                    <Button size="sm" onClick={handleCopy} className="gap-2 min-w-[100px]">
                                        {copied ? (
                                            <>
                                                <Check className="w-4 h-4" />
                                                Copied
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4" />
                                                Copy Text
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
