'use client'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    // Full page navigation to ensure session cookie is cleared before redirect
    window.location.href = '/login'
  }
  return (
    <button
      onClick={handleLogout}
      className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
    >
      <LogOut className="w-5 h-5" />
    </button>
  )
}
