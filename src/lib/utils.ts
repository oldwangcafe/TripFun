import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { CURRENCIES, DESTINATION_CURRENCY_MAP } from './constants'
import { CurrencyOption } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCurrencyInfo(code: string): CurrencyOption {
  return CURRENCIES.find(c => c.code === code) ?? { code, name: code, symbol: code }
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const info = getCurrencyInfo(currencyCode)
  const isNoDecimal = ['JPY', 'KRW', 'VND'].includes(currencyCode)
  const formatted = isNoDecimal
    ? Math.round(amount).toLocaleString('zh-TW')
    : amount.toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  return `${info.symbol}${formatted}`
}

export function formatAmount(amount: number, tripCurrency: string, settlementCurrency: string, exchangeRate?: number): string {
  const primary = formatCurrency(amount, tripCurrency)
  if (exchangeRate && settlementCurrency && settlementCurrency !== tripCurrency) {
    const converted = amount * exchangeRate
    const secondary = formatCurrency(converted, settlementCurrency)
    return `${primary}（≈ ${secondary}）`
  }
  return primary
}

export function detectCurrencyFromDestination(destination: string): string | null {
  const lower = destination.toLowerCase()
  const match = DESTINATION_CURRENCY_MAP.find(d =>
    lower.includes(d.destination.toLowerCase()) ||
    d.destination.toLowerCase().includes(lower)
  )
  return match?.currency ?? null
}

export function getDestinationFlag(destination: string): string {
  const lower = destination.toLowerCase()
  const match = DESTINATION_CURRENCY_MAP.find(d =>
    lower.includes(d.destination.toLowerCase()) ||
    d.destination.toLowerCase().includes(lower)
  )
  return match?.flag ?? '🌏'
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW', {
    month: 'short',
    day: 'numeric',
  })
}

export function generateInviteToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function getFundPercentage(current: number, initial: number): number {
  if (initial === 0) return 0
  return Math.max(0, Math.min(100, (current / initial) * 100))
}

export function getFundStatusColor(percentage: number): string {
  if (percentage > 50) return 'text-emerald-600'
  if (percentage > 20) return 'text-amber-500'
  return 'text-rose-500'
}

export function getFundBarColor(percentage: number): string {
  if (percentage > 50) return 'bg-emerald-400'
  if (percentage > 20) return 'bg-amber-400'
  return 'bg-rose-400'
}
