import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { BarChart2, Users, Receipt, ArrowRight } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Card } from '@/components/ui/Card'
import TripActionMenu from './_components/TripActionMenu'
import TripDetailClient from './_components/TripDetailClient'

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch trip
  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .single()
  if (!trip) notFound()

  // Fetch members
  const { data: members } = await supabase
    .from('trip_members')
    .select('*')
    .eq('trip_id', id)
    .order('created_at')

  // Fetch expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*, paid_by:trip_members(id, nickname)')
    .eq('trip_id', id)
    .order('created_at', { ascending: false })

  // Fetch contributions
  const { data: contributions } = await supabase
    .from('fund_contributions')
    .select('*')
    .eq('trip_id', id)
    .order('created_at', { ascending: false })

  // Check if user is manager
  const userMember = members?.find(m => m.user_id === user.id)
  const isManager = userMember?.role === 'creator' || userMember?.role === 'collaborator'

  return (
    <div>
      <Navbar
        title={trip.title}
        showBack
        rightAction={
          <TripActionMenu
            tripId={trip.id}
            tripStatus={trip.status}
            isCreator={trip.creator_id === user.id}
          />
        }
      />

      <div className="px-4 py-4 space-y-4">
        {/* Client component: FundBalanceCard + quick actions + recent expenses (with optimistic updates) */}
        <TripDetailClient
          trip={trip}
          members={members ?? []}
          expenses={expenses ?? []}
          userId={user.id}
          isManager={isManager}
        />

        {/* Navigation cards */}
        <div className="grid grid-cols-3 gap-2">
          <Link href={`/trips/${id}/expenses`}>
            <Card hover className="text-center p-3">
              <Receipt className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
              <p className="text-xs font-medium text-slate-600">支出記錄</p>
              <p className="text-lg font-bold text-slate-800">{expenses?.length ?? 0}</p>
            </Card>
          </Link>
          <Link href={`/trips/${id}/members`}>
            <Card hover className="text-center p-3">
              <Users className="w-5 h-5 text-purple-400 mx-auto mb-1" />
              <p className="text-xs font-medium text-slate-600">成員</p>
              <p className="text-lg font-bold text-slate-800">{members?.length ?? 0}</p>
            </Card>
          </Link>
          <Link href={`/trips/${id}/settlement`}>
            <Card hover className="text-center p-3">
              <BarChart2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <p className="text-xs font-medium text-slate-600">結算</p>
              <ArrowRight className="w-4 h-4 text-slate-300 mx-auto mt-1" />
            </Card>
          </Link>
        </div>

        {/* Fund Contribution History */}
        {contributions && contributions.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-slate-700 mb-3">公基金紀錄</h2>
            <div className="space-y-2">
              {contributions.map(c => {
                const contributorNames = c.contributors && c.contributors.length > 0
                  ? c.contributors.map((entry: { member_id: string; amount: number; nickname?: string }) => {
                      const name = entry.nickname || members?.find(m => m.id === entry.member_id)?.nickname || '成員'
                      return c.contributors.length > 1
                        ? `${name} ¥${entry.amount.toLocaleString()}`
                        : name
                    }).join('、')
                  : null

                return (
                  <Card key={c.id} padding="sm" className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">💰</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700">
                        {contributorNames ?? (c.note ?? '追加公基金')}
                      </p>
                      <p className="text-xs text-slate-400">
                        {c.note && contributorNames ? `${c.note} · ` : ''}
                        {new Date(c.created_at).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-emerald-600">
                      +{c.total_amount.toLocaleString()} {trip.trip_currency}
                    </p>
                  </Card>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
