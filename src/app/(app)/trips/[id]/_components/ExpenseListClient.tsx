'use client'
import { Expense } from '@/types'
import { Card } from '@/components/ui/Card'
import { EXPENSE_CATEGORIES } from '@/lib/constants'
import { formatCurrency, formatDateShort } from '@/lib/utils'

interface Props {
  initialExpenses: (Expense & { paid_by?: { id: string; nickname: string } | null })[]
  tripCurrency: string
  settlementCurrency: string
  exchangeRate?: number | null
}

export default function ExpenseListClient({ initialExpenses, tripCurrency, settlementCurrency, exchangeRate }: Props) {
  if (initialExpenses.length === 0) {
    return (
      <Card className="text-center py-8">
        <p className="text-3xl mb-2">🧾</p>
        <p className="text-sm text-slate-400">還沒有支出記錄</p>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {initialExpenses.map(expense => {
        const cat = EXPENSE_CATEGORIES.find(c => c.value === expense.category)
        return (
          <Card key={expense.id} padding="sm" className="flex items-center gap-3 animate-fadeIn">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
              style={{ backgroundColor: cat?.bgColor }}
            >
              {cat?.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">
                {expense.description || cat?.label}
              </p>
              <p className="text-xs text-slate-400">
                {expense.paid_by ? `由 ${expense.paid_by.nickname} 付款` : cat?.label}
                {' · '}{expense.expense_date ? formatDateShort(expense.expense_date) : formatDateShort(expense.created_at)}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-slate-800">
                -{formatCurrency(expense.amount, tripCurrency)}
              </p>
              {exchangeRate && settlementCurrency !== tripCurrency && (
                <p className="text-[10px] text-slate-400">
                  ≈ {formatCurrency(expense.amount * exchangeRate, settlementCurrency)}
                </p>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
