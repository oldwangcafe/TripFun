'use client'
import { useState } from 'react'
import { Trip, TripMember, Expense, FundContribution } from '@/types'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import CategoryPieChart from '@/components/charts/CategoryPieChart'
import { calculateMemberBalances, calculateSettlements, calculateCategoryTotals } from '@/lib/settlement'
import { formatCurrency } from '@/lib/utils'
import { EXPENSE_CATEGORIES } from '@/lib/constants'
import { ArrowRight, Mail, CheckCircle2 } from 'lucide-react'

interface Props {
  trip: Trip
  members: TripMember[]
  expenses: Expense[]
  contributions: FundContribution[]
  userId: string
  userEmail: string
}

export default function SettlementClient({ trip, members, expenses, contributions, userId, userEmail }: Props) {
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const categoryTotals = calculateCategoryTotals(expenses)
  const totalSpent = Object.values(categoryTotals).reduce((a, b) => a + b, 0)
  const memberBalances = calculateMemberBalances(members, contributions)
  const settlements = calculateSettlements(memberBalances, trip.trip_currency)

  const pieData = EXPENSE_CATEGORIES
    .filter(cat => categoryTotals[cat.value] > 0)
    .map(cat => ({
      name: cat.label,
      value: categoryTotals[cat.value],
      color: cat.color,
      icon: cat.icon,
    }))

  async function handleSendEmail() {
    setSendingEmail(true)
    try {
      await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: trip.id,
          userEmail,
        }),
      })
      setEmailSent(true)
    } catch (e) {
      console.error(e)
    }
    setSendingEmail(false)
  }

  return (
    <div className="space-y-5">
      {/* Summary Header */}
      <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 border-0 text-white">
        <h2 className="text-sm font-medium text-white/70 mb-1">{trip.title}</h2>
        <p className="text-3xl font-bold mb-3">
          {formatCurrency(totalSpent, trip.trip_currency)}
        </p>
        <div className="flex gap-4 text-sm">
          <div>
            <p className="text-white/60 text-xs">總入帳</p>
            <p className="font-semibold">{formatCurrency(trip.initial_fund, trip.trip_currency)}</p>
          </div>
          <div>
            <p className="text-white/60 text-xs">剩餘</p>
            <p className="font-semibold">{formatCurrency(trip.current_fund, trip.trip_currency)}</p>
          </div>
          <div>
            <p className="text-white/60 text-xs">成員數</p>
            <p className="font-semibold">{members.length} 人</p>
          </div>
        </div>
      </Card>

      {/* Category Pie Chart */}
      {pieData.length > 0 && (
        <Card>
          <h3 className="font-semibold text-slate-800 mb-4">支出分類</h3>
          <CategoryPieChart data={pieData} currency={trip.trip_currency} />
        </Card>
      )}

      {/* Member Balances */}
      <Card>
        <h3 className="font-semibold text-slate-800 mb-4">成員概覽</h3>
        <div className="space-y-3">
          {memberBalances.map(({ member, contributed, fairShare, balance }) => (
            <div key={member.id} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center font-semibold text-indigo-600 text-sm flex-shrink-0">
                {member.nickname.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700">{member.nickname}</p>
                <p className="text-xs text-slate-400">
                  出資 {formatCurrency(contributed, trip.trip_currency)} · 應分攤 {formatCurrency(fairShare, trip.trip_currency)}
                </p>
              </div>
              <div className={`text-sm font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                {balance >= 0 ? '+' : ''}{formatCurrency(balance, trip.trip_currency)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Settlement Transactions */}
      <Card>
        <h3 className="font-semibold text-slate-800 mb-4">結算清單</h3>
        {settlements.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500">🎉 大家貢獻均等，無需補款！</p>
          </div>
        ) : (
          <div className="space-y-3">
            {settlements.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center font-semibold text-rose-600 text-xs flex-shrink-0">
                  {s.from.slice(0, 2)}
                </div>
                <p className="text-sm font-medium text-slate-700 flex-shrink-0">{s.from}</p>
                <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center font-semibold text-emerald-600 text-xs flex-shrink-0">
                  {s.to.slice(0, 2)}
                </div>
                <p className="text-sm font-medium text-slate-700 flex-shrink-0">{s.to}</p>
                <div className="flex-1 text-right">
                  <p className="text-sm font-bold text-slate-800">
                    {formatCurrency(s.amount, s.currency)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Send Email Report */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Mail className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">寄送結算報告</p>
            <p className="text-xs text-slate-400">將完整報告寄至 {userEmail}</p>
          </div>
        </div>
        {emailSent ? (
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-3 rounded-xl">
            <CheckCircle2 className="w-4 h-4" />
            <p className="text-sm font-medium">報告已成功寄出！</p>
          </div>
        ) : (
          <Button fullWidth variant="secondary" loading={sendingEmail} onClick={handleSendEmail}>
            <Mail className="w-4 h-4" />
            寄送報告到我的信箱
          </Button>
        )}
      </Card>
    </div>
  )
}
