import { TripMember, Expense, FundContribution, Settlement, MemberBalance } from '@/types'

/**
 * Calculate each member's balance.
 *
 * Chronological advance model:
 *   - All expenses are paid from the group fund.
 *   - paid_by_member_id marks who physically handled an expense.
 *   - A personal "advance" only occurs when the fund balance is insufficient
 *     to cover that expense. advance = max(0, expense.amount − max(0, runningFund))
 *   - fairShare  = total expenses ÷ number of members
 *   - contributed = fund contributions + personal advance
 *   - balance    = contributed − fairShare
 *       > 0  → creditor (others owe this person)
 *       < 0  → debtor   (this person owes others)
 *
 * When `expenses` is omitted the contribution-only model is used as fallback.
 */
export function calculateMemberBalances(
  members: TripMember[],
  contributions: FundContribution[],
  expenses: Expense[] = [],
): MemberBalance[] {
  const totalContributions = contributions.reduce((sum, c) => sum + c.total_amount, 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalBasis = expenses.length > 0 ? totalExpenses : totalContributions
  const perPersonFairShare = members.length > 0 ? totalBasis / members.length : 0

  // --- Chronological advance calculation ---
  // Process expenses in order. When fund < expense amount and someone physically
  // paid (paid_by_member_id), the shortfall is their personal advance.
  const advances: Record<string, number> = {}
  members.forEach(m => { advances[m.id] = 0 })

  let runningFund = totalContributions
  const sortedExpenses = [...expenses].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  for (const expense of sortedExpenses) {
    if (expense.paid_by_member_id && advances[expense.paid_by_member_id] !== undefined) {
      // Only the portion exceeding available fund is an out-of-pocket advance
      const advance = Math.max(0, expense.amount - Math.max(0, runningFund))
      advances[expense.paid_by_member_id] += advance
    }
    runningFund -= expense.amount
  }

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

    // 2. Personal advance (only the excess beyond available fund, chronologically)
    const advance = advances[member.id] ?? 0
    const totalPaid = fundContributed + advance
    const balance = totalPaid - perPersonFairShare

    return {
      member,
      contributed: totalPaid,
      fairShare: perPersonFairShare,
      balance,
      advance,
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
