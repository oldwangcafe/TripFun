'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import AddExpenseButton from '../../_components/AddExpenseButton'
import { EXPENSE_CATEGORIES } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Trip, TripMember, Expense } from '@/types'

interface Props {
  trip: Trip
  initialExpenses: (Expense & { paid_by?: { id: string; nickname: string } | null })[]
  members: TripMember[]
  isManager: boolean
  userId: string
}

const CATEGORY_FILTER_OPTIONS = [
  { value: 'all', label: '全部' },
  ...EXPENSE_CATEGORIES.map(c => ({ value: c.value, label: `${c.icon} ${c.label}` })),
]

export default function ExpensesPageClient({ trip, initialExpenses, members, isManager, userId }: Props) {
  const router = useRouter()
  const [expenses, setExpenses] = useState(initialExpenses)
  const [filter, setFilter] = useState<string>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = filter === 'all' ? expenses : expenses.filter(e => e.category === filter)
  const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0)

  async function handleDelete(expense: Expense) {
    if (!confirm(`確定要刪除「${expense.description || '這筆支出'}」嗎？`)) return
    setDeletingId(expense.id)
    const supabase = createClient()

    await supabase.from('expenses').delete().eq('id', expense.id)
    // Restore fund
    await supabase
      .from('trips')
      .update({ current_fund: trip.current_fund + expense.amount })
      .eq('id', trip.id)

    setExpenses(prev => prev.filter(e => e.id !== expense.id))
    setDeletingId(null)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
        <p className="text-white/70 text-xs mb-1">
          {filter === 'all' ? '全部支出' : EXPENSE_CATEGORIES.find(c => c.value === filter)?.label}
        </p>
        <p className="text-2xl font-bold">{formatCurrency(totalFiltered, trip.trip_currency)}</p>
        <p className="text-white/60 text-xs mt-1">{filtered.length} 筆記錄</p>
      </Card>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORY_FILTER_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === opt.value
                ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-200'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Add button for managers */}
      {isManager && trip.status === 'active' && (
        <AddExpenseButton
          trip={trip}
          members={members}
          userId={userId}
          onExpenseAdded={(expense) => {
            const optimistic = {
              id: `optimistic-${Date.now()}`,
              trip_id: trip.id,
              amount: expense.amount,
              category: expense.category as Expense['category'],
              description: expense.description,
              paid_by_member_id: expense.paidByMemberId || undefined,
              created_at: new Date().toISOString(),
              recorded_by: userId,
            }
            setExpenses(prev => [optimistic, ...prev])
            router.refresh()
          }}
        />
      )}

      {/* Expense list */}
      {filtered.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-4xl mb-2">🧾</p>
          <p className="text-sm text-slate-400">
            {filter === 'all' ? '還沒有支出記錄' : '這個類別還沒有支出'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(expense => {
            const cat = EXPENSE_CATEGORIES.find(c => c.value === expense.category)
            const canDelete = isManager && (expense.recorded_by === userId || trip.creator_id === userId)
            return (
              <Card key={expense.id} padding="sm" className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                  style={{ backgroundColor: cat?.bgColor }}
                >
                  {cat?.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {expense.description || cat?.label}
                    </p>
                    <Badge variant="default" className="flex-shrink-0 text-[10px]">
                      {cat?.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400">
                    {expense.paid_by ? `${expense.paid_by.nickname} 付款` : '公基金支出'}
                    {' · '}{expense.expense_date ? formatDate(expense.expense_date) : formatDate(expense.created_at)}
                  </p>
                  {expense.note && (
                    <p className="text-xs text-slate-400 mt-0.5 truncate">備註：{expense.note}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <p className="text-sm font-bold text-slate-800">
                    -{formatCurrency(expense.amount, trip.trip_currency)}
                  </p>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(expense)}
                      disabled={deletingId === expense.id}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
