import { TripMember, Expense, FundContribution, Settlement, MemberBalance } from '@/types'

/**
 * Calculate each member's balance.
 *
 * Fair-share model (supports negative fund / out-of-pocket payments):
 *   fairShare  = total expenses ÷ number of members
 *   totalPaid  = fund contributions  +  out-of-pocket expenses (paid_by_member_id)
 *   balance    = totalPaid − fairShare
 *     > 0  → creditor (others owe this person)
 *     < 0  → debtor   (this person owes others)
 *
 * When `expenses` is omitted the old contribution-only model is used as fallback.
 */
export function calculateMemberBalances(
  members: TripMember[],
  contributions: FundContribution[],
  expenses: Expense[] = [],
): MemberBalance[] {
  // Use actual total expenses as the fair-share basis when available;
  // fall back to total fund contributions for backward compatibility.
  const totalBasis = expenses.length > 0
    ? expenses.reduce((sum, e) => sum + e.amount, 0)
    : contributions.reduce((sum, c) => sum + c.total_amount, 0)

  const perPersonFairShare = members.length > 0 ? totalBasis / members.length : 0

  return members.map(member => {
    // 1. Fund contributions (money put INTO the public fund)
    let fundContributed = 0
    contributions.forEach(c => {
      const entry = c.contributors?.find(e => e.member_id === member.id)
      if (entry) fundContributed += entry.amount
    })
    // Fallback: per_person_contribution column
    if (fundContributed === 0) {
      fundContributed = member.per_person_contribution ?? 0
    }

    // 2. Out-of-pocket payments (expenses this member personally paid for)
    const outOfPocket = expenses
      .filter(e => e.paid_by_member_id === member.id)
      .reduce((sum, e) => sum + e.amount, 0)

    const totalPaid = fundContributed + outOfPocket
    const balance = totalPaid - perPersonFairShare

    return {
      member,
      contributed: totalPaid,   // fund contributions + out-of-pocket advances
      fairShare: perPersonFairShare,
      balance,
    }
  })
}

export function calculateSettlements(
  balances: MemberBalance[],
  currency: string,
): Settlement[] {
  const settlements: Settlement[] = []

  // Clone and sort: creditors (positive balance) and debtors (negative balance)
  const creditors = balances
    .filter(b => b.balance > 0.01)
    .map(b => ({ ...b }))
    .sort((a, b) => b.balance - a.balance)

  const debtors = balances
    .filter(b => b.balance < -0.01)
    .map(b => ({ ...b }))
    .sort((a, b) => a.balance - b.balance)

  let i = 0
  let j = 0

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i]
    const debtor = debtors[j]

    const amount = Math.min(creditor.balance, Math.abs(debtor.balance))

    if (amount > 0.01) {
      settlements.push({
        from: debtor.member.nickname,
        to: creditor.member.nickname,
        amount: Math.round(amount * 100) / 100,
        currency,
      })
    }

    creditor.balance -= amount
    debtor.balance += amount

    if (Math.abs(creditor.balance) < 0.01) i++
    if (Math.abs(debtor.balance) < 0.01) j++
  }

  return settlements
}

export function calculateCategoryTotals(expenses: Expense[]) {
  return {
    meals: expenses.filter(e => e.category === 'meals').reduce((s, e) => s + e.amount, 0),
    transport: expenses.filter(e => e.category === 'transport').reduce((s, e) => s + e.amount, 0),
    shopping: expenses.filter(e => e.category === 'shopping').reduce((s, e) => s + e.amount, 0),
    other: expenses.filter(e => e.category === 'other').reduce((s, e) => s + e.amount, 0),
  }
}
