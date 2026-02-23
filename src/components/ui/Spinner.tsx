import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export function Spinner({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }
  return <Loader2 className={cn('animate-spin text-indigo-500', sizes[size], className)} />
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-3 text-sm text-slate-400">載入中...</p>
      </div>
    </div>
  )
}
