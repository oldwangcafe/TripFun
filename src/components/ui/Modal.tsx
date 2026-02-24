'use client'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  // Track whether we're mounted on the client (for SSR safety)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open || !mounted) return null

  /*
   * We use createPortal to render the overlay at document.body level.
   * This escapes ANY parent stacking context (e.g. Navbar's backdrop-blur-md
   * creates a stacking context that traps children's z-index values).
   * With a portal the z-50 overlay is always on top of everything.
   */
  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop — stays fixed so it always covers the full screen */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Inner centering wrapper */}
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
    </div>,
    document.body
  )
}
