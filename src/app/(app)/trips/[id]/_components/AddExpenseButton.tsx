'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import { EXPENSE_CATEGORIES, CURRENCIES } from '@/lib/constants'
import { Trip, TripMember } from '@/types'

interface Props {
  trip: Trip
  members: TripMember[]
  userId: string
}

export default function AddExpenseButton({ trip, members, userId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<string>('meals')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [paidByMemberId, setPaidByMemberId] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const currencySymbol = CURRENCIES.find(c => c.code === trip.trip_currency)?.symbol ?? trip.trip_currency

  const memberOptions = [
    { value: '', label: '-- 選擇付款人（選填）' },
    ...members.map(m => ({ value: m.id, label: m.nickname }))
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amountNum = parseFloat(amount)
    if (!amountNum || amountNum <= 0) return
    setLoading(true)

    const supabase = createClient()

    // Insert expense
    const { error } = await supabase.from('expenses').insert({
      trip_id: trip.id,
      recorded_by: userId,
      category,
      amount: amountNum,
      description,
      paid_by_member_id: paidByMemberId || null,
      note,
    })

    if (!error) {
      // Update trip current_fund
      await supabase
        .from('trips')
        .update({ current_fund: trip.current_fund - amountNum })
        .eq('id', trip.id)
    }

    setLoading(false)
    setOpen(false)
    setAmount('')
    setDescription('')
    setNote('')
    router.refresh()
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} fullWidth className="py-3">
        <Plus className="w-4 h-4" />
        新增支出
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="新增支出">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">支出類別</label>
            <div className="grid grid-cols-4 gap-2">
              {EXPENSE_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${
                    category === cat.value
                      ? 'border-indigo-400 bg-indigo-50'
                      : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-xs font-medium text-slate-600">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Input
            label={`金額（${trip.trip_currency}）`}
            type="number"
            placeholder="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            leftIcon={<span className="text-sm font-medium">{currencySymbol}</span>}
            required
            min="0"
            step="1"
          />

          <Input
            label="說明（選填）"
            placeholder="例如：拉麵午餐、地鐵票"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />

          <Select
            label="付款人（選填）"
            value={paidByMemberId}
            onChange={e => setPaidByMemberId(e.target.value)}
            options={memberOptions}
          />

          <Textarea
            label="備註（選填）"
            placeholder="其他說明..."
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
          />

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" fullWidth onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit" fullWidth loading={loading}>
              記帳
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
