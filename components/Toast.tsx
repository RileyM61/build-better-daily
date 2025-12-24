'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, X } from 'lucide-react'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error'
  duration?: number
}

interface ToastProps {
  toast: Toast
  onClose: () => void
}

export function ToastComponent({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, toast.duration || 5000)
    return () => clearTimeout(timer)
  }, [toast.duration, onClose])

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="fixed top-4 right-4 z-50 max-w-md"
    >
      <div className={`
        flex items-center gap-3 px-4 py-3 rounded-lg border-2 shadow-lg bg-wip-card
        ${toast.type === 'success' 
          ? 'border-green-500/50 text-green-600' 
          : 'border-red-500/50 text-red-600'
        }
      `}>
        {toast.type === 'success' ? (
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
        ) : (
          <XCircle className="w-5 h-5 flex-shrink-0" />
        )}
        <p className="flex-1 text-sm font-medium">{toast.message}</p>
        <button
          onClick={onClose}
          className="text-current opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastComponent
            key={toast.id}
            toast={toast}
            onClose={() => onRemove(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

