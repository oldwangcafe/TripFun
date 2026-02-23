import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const inviteToken = searchParams.get('invite')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // If there's an invite token, process it
      if (inviteToken) {
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          // Find and validate the invite
          const { data: invite } = await supabase
            .from('trip_invites')
            .select('*')
            .eq('invite_token', inviteToken)
            .eq('is_used', false)
            .single()

          if (invite && (!invite.expires_at || new Date(invite.expires_at) >= new Date())) {
            // Check if already a member
            const { data: existingMember } = await supabase
              .from('trip_members')
              .select('id')
              .eq('trip_id', invite.trip_id)
              .eq('user_id', user.id)
              .single()

            if (!existingMember) {
              const displayName =
                user.user_metadata?.display_name ||
                user.email?.split('@')[0] ||
                '協助者'

              await supabase.from('trip_members').insert({
                trip_id: invite.trip_id,
                user_id: user.id,
                nickname: displayName,
                role: invite.role,
                email: user.email,
              })
            }

            // Mark invite as used
            await supabase
              .from('trip_invites')
              .update({ is_used: true, used_by: user.id })
              .eq('id', invite.id)

            return NextResponse.redirect(`${origin}/trips/${invite.trip_id}`)
          }
        }
      }

      // No invite or invite processing done — go to dashboard
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // Exchange failed or no code
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
