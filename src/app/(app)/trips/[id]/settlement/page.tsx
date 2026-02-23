import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Card } from '@/components/ui/Card'
import SettlementClient from './_components/SettlementClient'

export default async function SettlementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: trip } = await supabase.from('trips').select('*').eq('id', id).single()
  if (!trip) notFound()

  const { data: members } = await supabase
    .from('trip_members').select('*').eq('trip_id', id).order('created_at')

  const { data: expenses } = await supabase
    .from('expenses').select('*, paid_by:trip_members(id, nickname)')
    .eq('trip_id', id).order('created_at')

  const { data: contributions } = await supabase
    .from('fund_contributions').select('*').eq('trip_id', id)

  return (
    <div>
      <Navbar title="旅程結算" showBack />
      <div className="px-4 py-5">
        <SettlementClient
          trip={trip}
          members={members ?? []}
          expenses={expenses ?? []}
          contributions={contributions ?? []}
          userId={user.id}
          userEmail={user.email ?? ''}
        />
      </div>
    </div>
  )
}
