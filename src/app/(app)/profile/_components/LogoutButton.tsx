'use client'
import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    // Use full page navigation to ensure session is cleared before redirect
    window.location.href = '/login'
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-rose-50 rounded-2xl transition-colors disabled:opacity-60"
    >
      <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
        <LogOut className="w-4 h-4 text-rose-500" />
      </div>
      <span className="text-sm font-medium text-rose-600">
        {loading ? '登出中…' : '登出帳號'}
      </span>
    </button>
  )
}
