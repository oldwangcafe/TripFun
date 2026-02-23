'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trip, TripMember, Expense } from '@/types'
import FundBalanceCard from './FundBalanceCard'
import ExpenseListClient from './ExpenseListClient'
import AddExpenseButton from './AddExpenseButton'
import AddFundButton from './AddFundButton'

interface Props {
  trip: Trip
  members: TripMember[]
  expenses: (Expense & { paid_by?: { id: string; nickname: string } | null })[]
  userId: string
  isManager: boolean
}

export default function TripDetailClient({
  trip,
  members,
  expenses: initialExpenses,
  userId,
  isManager,
}: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  // Optimistic state — updated immediately on action, synced by router.refresh()
  const [currentFund, setCurrentFund] = useState(trip.current_fund)
  const [expenseList, setExpenseList] = useState(initialExpenses)

  // A modified trip with the live current_fund
  const displayTrip: Trip = { ...trip, current_fund: currentFund }

  function handleExpenseAdded(expense: {
    amount: number
    category: string
    description: string
    paidByMemberId?: string
  }) {
    // Optimistic update — immediately reflect in UI
    const optimistic = {
      id: `optimistic-${Date.now()}`,
      trip_id: trip.id,
      amount: expense.amount,
      category: expense.category as Expense['category'],
      description: expense.description,
      paid_by_member_id: expense.paidByMemberId || undefined,
      created_at: new Date().toISOString(),
      recorded_by: userId,
      paid_by: expense.paidByMemberId
        ? members.find(m => m.id === expense.paidByMemberId) ?? undefined
        : undefined,
    }
    setCurrentFund(prev => prev - expense.amount)
    setExpenseList(prev => [optimistic, ...prev])
    // Background server sync
    startTransition(() => router.refresh())
  }

  function handleFundAdded(amount: number) {
    setCurrentFund(prev => prev + amount)
    startTransition(() => router.refresh())
  }

  return (
    <>
      <FundBalanceCard trip={displayTrip} expenses={expenseList} />

      {isManager && trip.status === 'active' && (
        <div className="grid grid-cols-2 gap-3">
          <AddExpenseButton
            trip={displayTrip}
            members={members}
            userId={userId}
            onExpenseAdded={handleExpenseAdded}
          />
          <AddFundButton
            trip={displayTrip}
            members={members}
            userId={userId}
            onFundAdded={handleFundAdded}
          />
        </div>
      )}

      <ExpenseListClient
        initialExpenses={expenseList.slice(0, 5)}
        tripCurrency={trip.trip_currency}
        settlementCurrency={trip.settlement_currency}
        exchangeRate={trip.exchange_rate}
      />
    </>
  )
}
