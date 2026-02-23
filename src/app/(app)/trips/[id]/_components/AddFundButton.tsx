'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlusCircle, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import { Trip, TripMember } from '@/types'
import { CURRENCIES } from '@/lib/constants'

interface Props {
  trip: Trip
  members: TripMember[]
  userId: string
}

export default function AddFundButton({ trip, members, userId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [contributions, setContributions] = useState<{ memberId: string; amount: string }[]>(
    members.map(m => ({ memberId: m.id, amount: '' }))
  )
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const currencySymbol = CURRENCIES.find(c => c.code === trip.trip_currency)?.symbol ?? trip.trip_currency

  const totalAmount = contributions.reduce((sum, c) => {
    const val = parseFloat(c.amount)
    return sum + (isNaN(val) ? 0 : val)
  }, 0)

  function updateContribution(memberId: string, amount: string) {
    setContributions(prev => prev.map(c => c.memberId === memberId ? { ...c, amount } : c))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (totalAmount <= 0) return
    setLoading(true)

    const supabase = createClient()
    const validContributors = contributions
      .filter(c => parseFloat(c.amount) > 0)
      .map(c => {
        const member = members.find(m => m.id === c.memberId)
        return { member_id: c.memberId, amount: parseFloat(c.amount), nickname: member?.nickname ?? '' }
      })

    await supabase.from('fund_contributions').insert({
      trip_id: trip.id,
      recorded_by: userId,
      total_amount: totalAmount,
      contributors: validContributors,
      note,
    })

    await supabase
      .from('trips')
      .update({ current_fund: trip.current_fund + totalAmount })
      .eq('id', trip.id)

    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)} fullWidth className="py-3">
        <PlusCircle className="w-4 h-4" />
        追加基金
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="追加公基金">
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-slate-500">選擇本次出資的成員及金額</p>

          <div className="space-y-2">
            {members.map(member => (
              <div key={member.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700 mb-1">{member.nickname}</p>
                </div>
                <div className="w-32">
                  <Input
                    type="number"
                    placeholder="0"
                    value={contributions.find(c => c.memberId === member.id)?.amount ?? ''}
                    onChange={e => updateContribution(member.id, e.target.value)}
                    leftIcon={<span className="text-xs">{currencySymbol}</span>}
                    min="0"
                  />
                </div>
              </div>
            ))}
          </div>

          {totalAmount > 0 && (
            <div className="bg-indigo-50 rounded-xl px-4 py-3">
              <p className="text-sm text-indigo-700">
                合計追加：<strong>{currencySymbol}{totalAmount.toLocaleString()} {trip.trip_currency}</strong>
              </p>
            </div>
          )}

          <Textarea
            label="備註（選填）"
            placeholder="例如：日費不足，再度追加"
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
          />

          <div className="flex gap-3">
            <Button type="button" variant="outline" fullWidth onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit" fullWidth loading={loading} disabled={totalAmount <= 0}>
              確認追加
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
