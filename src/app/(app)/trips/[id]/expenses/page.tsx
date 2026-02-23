import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import ExpensesPageClient from './_components/ExpensesPageClient'

export default async function ExpensesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .single()
  if (!trip) notFound()

  const { data: members } = await supabase
    .from('trip_members')
    .select('*')
    .eq('trip_id', id)
    .order('created_at')

  const { data: expenses } = await supabase
    .from('expenses')
    .select('*, paid_by:trip_members(id, nickname)')
    .eq('trip_id', id)
    .order('created_at', { ascending: false })

  const userMember = members?.find(m => m.user_id === user.id)
  const isManager = userMember?.role === 'creator' || userMember?.role === 'collaborator'

  return (
    <div>
      <Navbar title="支出記錄" showBack />
      <div className="px-4 py-4">
        <ExpensesPageClient
          trip={trip}
          initialExpenses={expenses ?? []}
          members={members ?? []}
          isManager={isManager}
          userId={user.id}
        />
      </div>
    </div>
  )
}
