import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import MembersClient from './_components/MembersClient'

export default async function MembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: trip } = await supabase.from('trips').select('*').eq('id', id).single()
  if (!trip) notFound()

  const { data: members } = await supabase
    .from('trip_members').select('*').eq('trip_id', id).order('created_at')

  const isCreator = trip.creator_id === user.id

  return (
    <div>
      <Navbar title="成員管理" showBack />
      <div className="px-4 py-5">
        <MembersClient
          trip={trip}
          initialMembers={members ?? []}
          isCreator={isCreator}
          userId={user.id}
        />
      </div>
    </div>
  )
}
