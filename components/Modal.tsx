'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
    title?: string
}

export default function Modal({ isOpen, onClose, children, title }: ModalProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    if (!mounted) return null

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* GROUNDED: Solid overlay, no blur - clear framing */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-50 transition-all"
                    />

                    {/* GROUNDED: Modal with clear boundary and shadow */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-wip-card border border-wip-border rounded-xl shadow-2xl z-50 p-6 md:p-8 overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-6">
                            {title && <h3 className="text-xl font-bold text-wip-text">{title}</h3>}
                            <button
                                onClick={onClose}
                                className="text-wip-muted hover:text-wip-text transition-colors p-1 hover:bg-wip-navy rounded-full"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* GROUNDED: Removed blur decoration - clean, solid modal */}

                        {children}
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    )
}
