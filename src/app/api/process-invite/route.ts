import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { token } = await request.json()

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Find and validate the invite
  const { data: invite } = await supabase
    .from('trip_invites')
    .select('*')
    .eq('invite_token', token)
    .eq('is_used', false)
    .single()

  if (!invite) {
    return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 })
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invite has expired' }, { status: 400 })
  }

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from('trip_members')
    .select('id')
    .eq('trip_id', invite.trip_id)
    .eq('user_id', user.id)
    .single()

  if (existingMember) {
    // Already a member, just return the trip id
    return NextResponse.json({ tripId: invite.trip_id })
  }

  // Create trip_member record
  const displayName =
    user.user_metadata?.display_name ||
    user.email?.split('@')[0] ||
    '協助者'

  const { error: insertError } = await supabase.from('trip_members').insert({
    trip_id: invite.trip_id,
    user_id: user.id,
    nickname: displayName,
    role: invite.role,
    email: user.email,
  })

  if (insertError) {
    console.error('Failed to insert trip_member:', insertError)
    return NextResponse.json({ error: 'Failed to join trip' }, { status: 500 })
  }

  // Mark invite as used
  await supabase
    .from('trip_invites')
    .update({ is_used: true, used_by: user.id })
    .eq('id', invite.id)

  return NextResponse.json({ tripId: invite.trip_id })
}
