'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreVertical, Flag, Share2, Copy } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { generateInviteToken } from '@/lib/utils'

interface Props {
  tripId: string
  tripStatus: string
  isCreator: boolean
}

export default function TripActionMenu({ tripId, tripStatus, isCreator }: Props) {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleEndTrip() {
    if (!confirm('確定要結束這個旅程嗎？結束後將無法繼續記帳。')) return
    setLoading(true)
    const supabase = createClient()
    await supabase
      .from('trips')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', tripId)
    setShowMenu(false)
    router.refresh()
  }

  async function handleGenerateInvite() {
    setLoading(true)
    const supabase = createClient()
    const token = generateInviteToken()
    await supabase.from('trip_invites').insert({
      trip_id: tripId,
      invite_token: token,
      role: 'collaborator',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    const link = `${window.location.origin}/register?invite=${token}`
    setInviteLink(link)
    setShowMenu(false)
    setShowInvite(true)
    setLoading(false)
  }

  async function copyLink() {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <button
        onClick={() => setShowMenu(true)}
        className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      <Modal open={showMenu} onClose={() => setShowMenu(false)} title="旅程設定">
        <div className="space-y-2">
          {isCreator && tripStatus === 'active' && (
            <>
              <button
                onClick={handleGenerateInvite}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Share2 className="w-4 h-4 text-indigo-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">邀請協助者</p>
                  <p className="text-xs text-slate-400">產生邀請連結</p>
                </div>
              </button>
              <button
                onClick={handleEndTrip}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
                  <Flag className="w-4 h-4 text-rose-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-rose-600">結束旅程</p>
                  <p className="text-xs text-slate-400">停止記帳，進行結算</p>
                </div>
              </button>
            </>
          )}
        </div>
      </Modal>

      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="邀請協助者">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            將以下連結傳給想要一起協助記帳的旅伴，他們需要用此連結完成註冊。
          </p>
          <div className="bg-slate-50 rounded-xl p-3 break-all">
            <p className="text-xs text-slate-600 font-mono">{inviteLink}</p>
          </div>
          <Button fullWidth onClick={copyLink} variant={copied ? 'secondary' : 'primary'}>
            <Copy className="w-4 h-4" />
            {copied ? '已複製！' : '複製連結'}
          </Button>
        </div>
      </Modal>
    </>
  )
}
