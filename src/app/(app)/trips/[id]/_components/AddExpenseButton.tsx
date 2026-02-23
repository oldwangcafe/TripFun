'use client'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import { EXPENSE_CATEGORIES, CURRENCIES } from '@/lib/constants'
import { Trip, TripMember } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface Props {
  trip: Trip
  members: TripMember[]
  userId: string
  /** Called immediately after a successful insert for optimistic UI update */
  onExpenseAdded?: (expense: {
    amount: number
    category: string
    description: string
    paidByMemberId?: string
  }) => void
}

export default function AddExpenseButton({ trip, members, userId, onExpenseAdded }: Props) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<string>('meals')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [paidByMemberId, setPaidByMemberId] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const currencySymbol = CURRENCIES.find(c => c.code === trip.trip_currency)?.symbol ?? trip.trip_currency
  const amountNum = parseFloat(amount)
  const exceedsBalance = !!amountNum && amountNum > trip.current_fund

  const memberOptions = [
    { value: '', label: '-- 選擇付款人（選填）' },
    ...members.map(m => ({ value: m.id, label: m.nickname }))
  ]

  function resetForm() {
    setAmount('')
    setDescription('')
    setNote('')
    setPaidByMemberId('')
    setCategory('meals')
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amountNum || amountNum <= 0) {
      setError('請輸入有效金額')
      return
    }
    if (amountNum > trip.current_fund) {
      setError(`金額超過公基金餘額（剩餘：${formatCurrency(trip.current_fund, trip.trip_currency)}）`)
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()

    const { error: insertError } = await supabase.from('expenses').insert({
      trip_id: trip.id,
      recorded_by: userId,
      category,
      amount: amountNum,
      description,
      paid_by_member_id: paidByMemberId || null,
      note,
    })

    if (insertError) {
      setError('新增失敗，請再試一次')
      setLoading(false)
      return
    }

    await supabase
      .from('trips')
      .update({ current_fund: trip.current_fund - amountNum })
      .eq('id', trip.id)

    setLoading(false)
    setOpen(false)
    // Notify parent to update optimistic state immediately
    onExpenseAdded?.({
      amount: amountNum,
      category,
      description,
      paidByMemberId: paidByMemberId || undefined,
    })
    resetForm()
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} fullWidth className="py-3">
        <Plus className="w-4 h-4" />
        新增支出
      </Button>

      <Modal open={open} onClose={() => { setOpen(false); resetForm() }} title="新增支出">
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

          <div>
            <Input
              label={`金額（${trip.trip_currency}）`}
              type="number"
              placeholder="0"
              value={amount}
              onChange={e => { setAmount(e.target.value); setError('') }}
              leftIcon={<span className="text-sm font-medium">{currencySymbol}</span>}
              required
              min="0"
              step="1"
            />
            {/* Live balance hint */}
            {amountNum > 0 && (
              <p className={`text-xs mt-1 px-1 ${exceedsBalance ? 'text-rose-500 font-medium' : 'text-slate-400'}`}>
                公基金剩餘：{formatCurrency(trip.current_fund, trip.trip_currency)}
                {exceedsBalance && '　⚠️ 超出餘額'}
              </p>
            )}
          </div>

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

          {error && (
            <p className="text-sm text-rose-500 bg-rose-50 px-3 py-2 rounded-xl">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" fullWidth onClick={() => { setOpen(false); resetForm() }}>
              取消
            </Button>
            <Button type="submit" fullWidth loading={loading} disabled={exceedsBalance}>
              記帳
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
