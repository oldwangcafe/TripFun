'use client'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    /*
     * Outer div is a SCROLLABLE fixed overlay.
     * This lets the user scroll up to reach the header/close button
     * even when the modal is taller than the visible viewport
     * (common on mobile where the browser address bar eats space).
     */
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop — stays fixed so it always covers the full screen */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Inner centering wrapper — min-h-full ensures centering when content is short */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={cn(
          'relative bg-white w-full max-w-sm rounded-2xl',
          'animate-slideUp shadow-2xl',
          className
        )}>
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">{title}</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Body */}
          <div className="p-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
