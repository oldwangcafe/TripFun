'use client'
import { Trip, Expense } from '@/types'
import { Card } from '@/components/ui/Card'
import { formatCurrency, getFundBarColor, getFundStatusColor } from '@/lib/utils'
import { EXPENSE_CATEGORIES } from '@/lib/constants'

interface Props {
  trip: Trip
  expenses: Expense[]
}

export default function FundBalanceCard({ trip, expenses }: Props) {
  const spent = trip.initial_fund - trip.current_fund
  const percentage = trip.initial_fund > 0 ? Math.max(0, (trip.current_fund / trip.initial_fund) * 100) : 0
  const barColor = getFundBarColor(percentage)
  const textColor = getFundStatusColor(percentage)

  const categoryTotals = EXPENSE_CATEGORIES.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.value).reduce((s, e) => s + e.amount, 0)
  })).filter(c => c.total > 0)

  return (
    <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-lg shadow-indigo-200">
      <div className="mb-4">
        <p className="text-white/70 text-sm mb-1">公基金餘額</p>
        <p className={`text-4xl font-bold tracking-tight ${trip.current_fund < 0 ? 'text-rose-300' : ''}`}>
          {formatCurrency(trip.current_fund, trip.trip_currency)}
        </p>
        {trip.current_fund < 0 && (
          <p className="text-rose-300 text-xs mt-1">
            💳 墊付 {formatCurrency(Math.abs(trip.current_fund), trip.trip_currency)}，結算時補回
          </p>
        )}
        {trip.exchange_rate && trip.settlement_currency !== trip.trip_currency && (
          <p className="text-white/60 text-sm mt-1">
            ≈ {formatCurrency(trip.current_fund * trip.exchange_rate, trip.settlement_currency)}
          </p>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-white/60 mb-1.5">
          <span>已用 {formatCurrency(spent, trip.trip_currency)}</span>
          <span>{trip.current_fund < 0 ? '已超支' : `${Math.round(percentage)}% 剩餘`}</span>
        </div>
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${trip.current_fund < 0 ? 'bg-rose-400/80 w-full' : 'bg-white/80'}`}
            style={{ width: trip.current_fund < 0 ? '100%' : `${percentage}%` }}
          />
        </div>
      </div>

      {/* Category breakdown */}
      {categoryTotals.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {categoryTotals.map(cat => (
            <div key={cat.value} className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1.5">
              <span className="text-sm">{cat.icon}</span>
              <div>
                <p className="text-[10px] text-white/60">{cat.label}</p>
                <p className="text-xs font-semibold text-white">
                  {formatCurrency(cat.total, trip.trip_currency)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
