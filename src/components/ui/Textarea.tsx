'use client'
import { cn } from '@/lib/utils'
import { TextareaHTMLAttributes, forwardRef } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s/g, '-')
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-slate-700 mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={3}
          className={cn(
            'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800',
            'placeholder:text-slate-400 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent',
            'transition-all duration-150',
            error && 'border-rose-300 focus:ring-rose-400',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export default Textarea
