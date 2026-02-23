import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Card } from '@/components/ui/Card'
import { LogOut, User, Mail, Calendar, Plane } from 'lucide-react'
import LogoutButton from './_components/LogoutButton'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch trip count (trips where user is a member)
  const { count: tripCount } = await supabase
    .from('trip_members')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || '使用者'
  const initials = displayName.slice(0, 2).toUpperCase()
  const joinedDate = new Date(user.created_at).toLocaleDateString('zh-TW', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div>
      <Navbar title="我的" />

      <div className="px-4 py-4 space-y-4">
        {/* Avatar + name */}
        <Card className="text-center py-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-500 text-white text-2xl font-bold mb-3 shadow-lg shadow-indigo-200">
            {initials}
          </div>
          <h2 className="text-xl font-bold text-slate-800">{displayName}</h2>
          <p className="text-sm text-slate-400 mt-0.5">{user.email}</p>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="text-center py-4">
            <Plane className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-slate-800">{tripCount ?? 0}</p>
            <p className="text-xs text-slate-400">參與旅程</p>
          </Card>
          <Card className="text-center py-4">
            <Calendar className="w-5 h-5 text-purple-400 mx-auto mb-1" />
            <p className="text-xs font-medium text-slate-600 mt-1">加入日期</p>
            <p className="text-xs text-slate-400">{joinedDate}</p>
          </Card>
        </div>

        {/* Account info */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">帳號資料</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-indigo-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">暱稱</p>
                <p className="text-sm font-medium text-slate-700">{displayName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">電子郵件</p>
                <p className="text-sm font-medium text-slate-700">{user.email}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Logout */}
        <Card padding="none">
          <LogoutButton />
        </Card>
      </div>
    </div>
  )
}
