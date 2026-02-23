import { ExpenseCategory, CurrencyOption, DestinationCurrency } from '@/types'

export const EXPENSE_CATEGORIES: {
  value: ExpenseCategory
  label: string
  icon: string
  color: string
  bgColor: string
}[] = [
  { value: 'meals', label: '用餐', icon: '🍜', color: '#f97316', bgColor: '#fff7ed' },
  { value: 'transport', label: '交通', icon: '🚌', color: '#0ea5e9', bgColor: '#f0f9ff' },
  { value: 'shopping', label: '購物', icon: '🛍️', color: '#ec4899', bgColor: '#fdf2f8' },
  { value: 'other', label: '其他', icon: '📌', color: '#94a3b8', bgColor: '#f8fafc' },
]

export const CURRENCIES: CurrencyOption[] = [
  { code: 'JPY', name: '日圓', symbol: '¥', country: '日本' },
  { code: 'TWD', name: '新台幣', symbol: 'NT$', country: '台灣' },
  { code: 'USD', name: '美元', symbol: '$', country: '美國' },
  { code: 'EUR', name: '歐元', symbol: '€', country: '歐洲' },
  { code: 'KRW', name: '韓圓', symbol: '₩', country: '韓國' },
  { code: 'HKD', name: '港幣', symbol: 'HK$', country: '香港' },
  { code: 'SGD', name: '新加坡元', symbol: 'S$', country: '新加坡' },
  { code: 'THB', name: '泰銖', symbol: '฿', country: '泰國' },
  { code: 'MYR', name: '馬來西亞幣', symbol: 'RM', country: '馬來西亞' },
  { code: 'GBP', name: '英鎊', symbol: '£', country: '英國' },
  { code: 'AUD', name: '澳幣', symbol: 'A$', country: '澳洲' },
  { code: 'CAD', name: '加拿大元', symbol: 'C$', country: '加拿大' },
  { code: 'CNY', name: '人民幣', symbol: '¥', country: '中國' },
  { code: 'VND', name: '越南盾', symbol: '₫', country: '越南' },
]

export const DESTINATION_CURRENCY_MAP: DestinationCurrency[] = [
  { destination: '日本', currency: 'JPY', flag: '🇯🇵' },
  { destination: '韓國', currency: 'KRW', flag: '🇰🇷' },
  { destination: '香港', currency: 'HKD', flag: '🇭🇰' },
  { destination: '新加坡', currency: 'SGD', flag: '🇸🇬' },
  { destination: '泰國', currency: 'THB', flag: '🇹🇭' },
  { destination: '馬來西亞', currency: 'MYR', flag: '🇲🇾' },
  { destination: '美國', currency: 'USD', flag: '🇺🇸' },
  { destination: '英國', currency: 'GBP', flag: '🇬🇧' },
  { destination: '歐洲', currency: 'EUR', flag: '🇪🇺' },
  { destination: '澳洲', currency: 'AUD', flag: '🇦🇺' },
  { destination: '加拿大', currency: 'CAD', flag: '🇨🇦' },
  { destination: '中國', currency: 'CNY', flag: '🇨🇳' },
  { destination: '越南', currency: 'VND', flag: '🇻🇳' },
  { destination: '台灣', currency: 'TWD', flag: '🇹🇼' },
]

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  meals: '#f97316',
  transport: '#0ea5e9',
  shopping: '#ec4899',
  other: '#94a3b8',
}

export const CATEGORY_PIE_COLORS = ['#f97316', '#0ea5e9', '#ec4899', '#94a3b8']
