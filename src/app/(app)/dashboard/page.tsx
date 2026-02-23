import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, MapPin, Users, TrendingDown } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, getDestinationFlag } from '@/lib/utils'
import { Trip } from '@/types'
import LogoutButton from './_components/LogoutButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch trips where user is creator or collaborator
  const { data: trips } = await supabase
    .from('trips')
    .select('*, trip_members(id, nickname, role)')
    .or(`creator_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  const activeTrips = trips?.filter(t => t.status === 'active') ?? []
  const endedTrips = trips?.filter(t => t.status === 'ended') ?? []

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">我的旅程 ✈️</h1>
          <p className="text-sm text-slate-500 mt-0.5">共 {trips?.length ?? 0} 個旅程</p>
        </div>
        <LogoutButton />
      </div>

      {/* Create new trip CTA */}
      <Link href="/trips/new">
        <Card
          hover
          className="mb-6 bg-gradient-to-r from-indigo-500 to-purple-500 border-0 text-white"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold">建立新旅程</p>
              <p className="text-sm text-white/70 mt-0.5">設定公基金，開始記帳</p>
            </div>
          </div>
        </Card>
      </Link>

      {/* Active Trips */}
      {activeTrips.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            進行中
          </h2>
          <div className="space-y-3">
            {activeTrips.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}

      {/* Ended Trips */}
      {endedTrips.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            已結束
          </h2>
          <div className="space-y-3 opacity-70">
            {endedTrips.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {(!trips || trips.length === 0) && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="font-semibold text-slate-700 mb-2">還沒有旅程</h3>
          <p className="text-sm text-slate-400 mb-6">建立第一個旅程，開始管理公基金</p>
          <Link href="/trips/new">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white rounded-xl font-medium text-sm shadow-sm shadow-indigo-200">
              <Plus className="w-4 h-4" />
              建立旅程
            </span>
          </Link>
        </div>
      )}
    </div>
  )
}

function TripCard({ trip }: { trip: Trip & { trip_members?: { id: string; nickname: string; role: string }[] } }) {
  const flag = getDestinationFlag(trip.destination)
  const memberCount = trip.trip_members?.length ?? 0
  const spent = trip.initial_fund - trip.current_fund
  const percentage = trip.initial_fund > 0 ? Math.max(0, (trip.current_fund / trip.initial_fund) * 100) : 0
  const barColor = percentage > 50 ? 'bg-emerald-400' : percentage > 20 ? 'bg-amber-400' : 'bg-rose-400'

  return (
    <Link href={`/trips/${trip.id}`}>
      <Card hover className="animate-fadeIn">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <span className="text-2xl">{flag}</span>
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-800 truncate">{trip.title}</h3>
              <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                <MapPin className="w-3 h-3" />
                <span>{trip.destination}</span>
              </div>
            </div>
          </div>
          <Badge variant={trip.status === 'active' ? 'success' : 'default'}>
            {trip.status === 'active' ? '進行中' : '已結束'}
          </Badge>
        </div>

        {/* Fund balance */}
        <div className="bg-slate-50 rounded-xl p-3 mb-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-500">公基金餘額</span>
            <span className="text-xs text-slate-400">
              已用 {formatCurrency(spent, trip.trip_currency)}
            </span>
          </div>
          <p className="font-bold text-slate-800 text-lg">
            {formatCurrency(trip.current_fund, trip.trip_currency)}
          </p>
          <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>{memberCount} 位成員</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>{trip.trip_currency}</span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
