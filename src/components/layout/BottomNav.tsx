'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Plus, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/dashboard', icon: Home, label: '首頁' },
  { href: '/trips/new', icon: Plus, label: '新旅程', special: true },
  { href: '/profile', icon: User, label: '我的' },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-slate-100 safe-bottom">
      <div className="max-w-2xl mx-auto px-4 flex items-center justify-around h-16">
        {tabs.map(tab => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
          if (tab.special) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center gap-0.5"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-200 -mt-6">
                  <tab.icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-xs text-slate-400">{tab.label}</span>
              </Link>
            )
          }
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-colors',
                isActive ? 'text-indigo-600' : 'text-slate-400'
              )}
            >
              <tab.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
