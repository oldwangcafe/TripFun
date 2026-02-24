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
  onExpenseAdded?: (expense: {
    amount: number
    category: string
    description: string
    paidByMemberId?: string
  }) => void
}

function todayString() {
  return new Date().toISOString().split('T')[0]
}

export default function AddExpenseButton({ trip, members, userId, onExpenseAdded }: Props) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<string>('meals')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [paidByMemberId, setPaidByMemberId] = useState('')
  const [note, setNote] = useState('')
  const [expenseDate, setExpenseDate] = useState(todayString())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const currencySymbol = CURRENCIES.find(c => c.code === trip.trip_currency)?.symbol ?? trip.trip_currency
  const amountNum = parseFloat(amount)
  const exceedsBalance = !!amountNum && amountNum > trip.current_fund

  const memberOptions = [
    { value: '', label: '-- 選擇付款人（選填）' },
    ...members.map(m => ({ value: m.id, label: m.nickname }))
  ]

  const dateMin = trip.start_date ?? undefined
  const dateMax = trip.end_date
    ? (trip.end_date < todayString() ? trip.end_date : todayString())
    : todayString()

  function resetForm() {
    setAmount('')
    setDescription('')
    setNote('')
    setPaidByMemberId('')
    setCategory('meals')
    setExpenseDate(todayString())
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amountNum || amountNum <= 0) { setError('請輸入有效金額'); return }
    if (!expenseDate) { setError('請選擇費用日期'); return }

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
      expense_date: expenseDate,
    })

    if (insertError) { setError('新增失敗，請再試一次'); setLoading(false); return }

    await supabase
      .from('trips')
      .update({ current_fund: trip.current_fund - amountNum })
      .eq('id', trip.id)

    setLoading(false)
    setOpen(false)
    onExpenseAdded?.({ amount: amountNum, category, description, paidByMemberId: paidByMemberId || undefined })
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
            {amountNum > 0 && (
              <p className={`text-xs mt-1 px-1 ${exceedsBalance ? 'text-amber-600 font-medium' : 'text-slate-400'}`}>
                公基金剩餘：{formatCurrency(trip.current_fund, trip.trip_currency)}
                {exceedsBalance && '　⚠️ 超出餘額，將以墊付方式記帳'}
              </p>
            )}
          </div>

          <Input
            label="費用日期"
            type="date"
            value={expenseDate}
            min={dateMin}
            max={dateMax}
            onChange={e => setExpenseDate(e.target.value)}
            required
            hint={trip.start_date ? `旅程期間：${trip.start_date} ～ ${trip.end_date ?? '未設定'}` : undefined}
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

          {error && (
            <p className="text-sm text-rose-500 bg-rose-50 px-3 py-2 rounded-xl">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" fullWidth onClick={() => { setOpen(false); resetForm() }}>取消</Button>
            <Button type="submit" fullWidth loading={loading}>
              {exceedsBalance ? '墊付記帳' : '記帳'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
