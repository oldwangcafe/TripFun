export type UserRole = 'creator' | 'collaborator' | 'member'
export type TripStatus = 'active' | 'ended'
export type ExpenseCategory = 'meals' | 'transport' | 'shopping' | 'other'

export interface Profile {
  id: string
  email: string
  display_name?: string
  created_at: string
}

export interface Trip {
  id: string
  created_at: string
  title: string
  destination: string
  trip_currency: string
  settlement_currency: string
  initial_fund: number
  current_fund: number
  status: TripStatus
  creator_id: string
  exchange_rate?: number
  ended_at?: string
  trip_members?: TripMember[]
}

export interface TripMember {
  id: string
  created_at: string
  trip_id: string
  user_id?: string
  nickname: string
  role: UserRole
  email?: string
  per_person_contribution: number
}

export interface Expense {
  id: string
  created_at: string
  trip_id: string
  recorded_by: string
  category: ExpenseCategory
  amount: number
  description: string
  paid_by_member_id?: string
  note?: string
  paid_by?: TripMember
}

export interface FundContribution {
  id: string
  created_at: string
  trip_id: string
  recorded_by: string
  total_amount: number
  contributors: ContributorEntry[]
  note?: string
}

export interface ContributorEntry {
  member_id: string
  amount: number
  nickname?: string
}

export interface TripInvite {
  id: string
  created_at: string
  trip_id: string
  invite_token: string
  role: UserRole
  used_by?: string
  expires_at?: string
  is_used: boolean
}

export interface Settlement {
  from: string
  to: string
  amount: number
  currency: string
}

export interface SettlementReport {
  trip: Trip
  members: TripMember[]
  expenses: Expense[]
  contributions: FundContribution[]
  settlements: Settlement[]
  categoryTotals: Record<ExpenseCategory, number>
  memberBalances: MemberBalance[]
}

export interface MemberBalance {
  member: TripMember
  contributed: number
  fairShare: number
  balance: number
}

export interface CurrencyOption {
  code: string
  name: string
  symbol: string
  country?: string
}

export interface DestinationCurrency {
  destination: string
  currency: string
  flag: string
}
