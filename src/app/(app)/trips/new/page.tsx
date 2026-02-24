'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, MapPin, Users, DollarSign, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/Navbar'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { CURRENCIES } from '@/lib/constants'
import { detectCurrencyFromDestination } from '@/lib/utils'

const currencyOptions = CURRENCIES.map(c => ({ value: c.code, label: `${c.code} ${c.name}（${c.symbol}）` }))

export default function NewTripPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [tripCurrency, setTripCurrency] = useState('JPY')
  const [settlementCurrency, setSettlementCurrency] = useState('TWD')
  const [perPerson, setPerPerson] = useState('')
  const [members, setMembers] = useState<string[]>([''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleDestinationChange(val: string) {
    setDestination(val)
    const detected = detectCurrencyFromDestination(val)
    if (detected) setTripCurrency(detected)
  }

  function addMember() {
    setMembers([...members, ''])
  }

  function removeMember(index: number) {
    setMembers(members.filter((_, i) => i !== index))
  }

  function updateMember(index: number, value: string) {
    const updated = [...members]
    updated[index] = value
    setMembers(updated)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validMembers = members.filter(m => m.trim() !== '')
    if (validMembers.length === 0) {
      setError('至少需要填寫一位成員暱稱')
      return
    }
    if (startDate && endDate && endDate < startDate) {
      setError('結束日期不能早於開始日期')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const memberCount = validMembers.length + 1 // +1 for creator
    const perPersonAmount = parseFloat(perPerson) || 0
    const totalFund = perPersonAmount * memberCount

    // Create trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        title,
        destination,
        trip_currency: tripCurrency,
        settlement_currency: settlementCurrency,
        initial_fund: totalFund,
        current_fund: totalFund,
        creator_id: user.id,
        status: 'active',
        ...(startDate ? { start_date: startDate } : {}),
        ...(endDate   ? { end_date: endDate }     : {}),
      })
      .select()
      .single()

    if (tripError || !trip) {
      setError(tripError?.message ?? '建立失敗')
      setLoading(false)
      return
    }

    // Add creator as member
    const userMeta = user.user_metadata
    await supabase.from('trip_members').insert({
      trip_id: trip.id,
      user_id: user.id,
      nickname: userMeta.display_name ?? user.email?.split('@')[0] ?? '我',
      role: 'creator',
      per_person_contribution: perPersonAmount,
    })

    // Add other members
    for (const nickname of validMembers) {
      await supabase.from('trip_members').insert({
        trip_id: trip.id,
        nickname,
        role: 'member',
        per_person_contribution: perPersonAmount,
      })
    }

    // Record initial fund contribution
    const { data: allMembers } = await supabase
      .from('trip_members')
      .select('id, nickname')
      .eq('trip_id', trip.id)

    if (allMembers) {
      const contributors = allMembers.map(m => ({
        member_id: m.id,
        amount: perPersonAmount,
        nickname: m.nickname,
      }))
      await supabase.from('fund_contributions').insert({
        trip_id: trip.id,
        recorded_by: user.id,
        total_amount: totalFund,
        contributors,
        note: '初始公基金',
      })
    }

    router.push(`/trips/${trip.id}`)
  }

  return (
    <div>
      <Navbar title="建立新旅程" showBack />
      <div className="px-4 py-5 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 基本資訊 */}
          <Card>
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-500" />
              旅程資訊
            </h2>
            <div className="space-y-3">
              <Input
                label="旅程標題"
                placeholder="例如：東京3天2夜遊"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
              <Input
                label="目的地"
                placeholder="例如：日本、韓國、泰國"
                value={destination}
                onChange={e => handleDestinationChange(e.target.value)}
                hint={destination ? `自動偵測幣別：${tripCurrency}` : '輸入目的地會自動帶入幣別'}
                required
              />
            </div>
          </Card>

          {/* 旅程日期 */}
          <Card>
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              旅程日期（選填）
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="出發日期"
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value)
                  if (endDate && e.target.value > endDate) setEndDate('')
                }}
              />
              <Input
                label="返程日期"
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
            {startDate && endDate && (
              <p className="text-xs text-slate-400 mt-2 text-center">
                共 {Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1} 天
              </p>
            )}
          </Card>

          {/* 幣別設定 */}
          <Card>
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-indigo-500" />
              幣別設定
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="記帳幣別"
                value={tripCurrency}
                onChange={e => setTripCurrency(e.target.value)}
                options={currencyOptions}
              />
              <Select
                label="結帳幣別"
                value={settlementCurrency}
                onChange={e => setSettlementCurrency(e.target.value)}
                options={currencyOptions}
              />
            </div>
          </Card>

          {/* 初始基金 */}
          <Card>
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-indigo-500" />
              初始公基金
            </h2>
            <Input
              label={`每人出資金額（${tripCurrency}）`}
              type="number"
              placeholder="例如：20000"
              value={perPerson}
              onChange={e => setPerPerson(e.target.value)}
              hint={
                perPerson && members.filter(m => m.trim()).length > 0
                  ? `共 ${members.filter(m => m.trim()).length + 1} 人 × ${parseFloat(perPerson).toLocaleString()} = 總計 ${((members.filter(m => m.trim()).length + 1) * parseFloat(perPerson)).toLocaleString()} ${tripCurrency}`
                  : '設定後可以修改'
              }
              min="0"
            />
          </Card>

          {/* 成員設定 */}
          <Card>
            <h2 className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              旅伴暱稱
            </h2>
            <p className="text-xs text-slate-400 mb-4">（不含您自己，之後可以新增修改）</p>
            <div className="space-y-2">
              {members.map((member, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`旅伴 ${index + 1}，例如：阿明、小花`}
                    value={member}
                    onChange={e => updateMember(index, e.target.value)}
                  />
                  {members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMember(index)}
                      className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addMember}
                size="sm"
                className="w-full mt-1"
              >
                <Plus className="w-4 h-4" />
                新增旅伴
              </Button>
            </div>
          </Card>

          {error && (
            <p className="text-sm text-rose-500 bg-rose-50 px-3 py-2 rounded-xl">{error}</p>
          )}

          <Button type="submit" fullWidth size="lg" loading={loading}>
            ✈️ 建立旅程
          </Button>
        </form>
      </div>
    </div>
  )
}
