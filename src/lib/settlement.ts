import { TripMember, Expense, FundContribution, Settlement, MemberBalance } from '@/types'

export function calculateMemberBalances(
  members: TripMember[],
  contributions: FundContribution[],
): MemberBalance[] {
  const totalContributed = contributions.reduce((sum, c) => sum + c.total_amount, 0)
  const perPersonFairShare = members.length > 0 ? totalContributed / members.length : 0

  return members.map(member => {
    // Sum all contributions from this member
    let contributed = 0
    contributions.forEach(c => {
      const entry = c.contributors?.find(e => e.member_id === member.id)
      if (entry) contributed += entry.amount
    })

    // If no detailed contributor records, use per_person_contribution
    if (contributed === 0) {
      contributed = member.per_person_contribution ?? 0
    }

    const balance = contributed - perPersonFairShare

    return {
      member,
      contributed,
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
