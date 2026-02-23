'use client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavbarProps {
  title: string
  showBack?: boolean
  rightAction?: React.ReactNode
  className?: string
}

export function Navbar({ title, showBack, rightAction, className }: NavbarProps) {
  const router = useRouter()
  return (
    <header className={cn(
      'sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100',
      className
    )}>
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="font-semibold text-slate-800 truncate max-w-[200px]">{title}</h1>
        </div>
        <div>{rightAction}</div>
      </div>
    </header>
  )
}
