'use client'
import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-')
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800',
              'placeholder:text-slate-400',
              'focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent',
              'disabled:bg-slate-50 disabled:text-slate-400',
              'transition-all duration-150',
              error && 'border-rose-300 focus:ring-rose-400',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

export default Input
