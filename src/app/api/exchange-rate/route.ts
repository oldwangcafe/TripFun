import { NextRequest, NextResponse } from 'next/server'

const CACHE: Record<string, { rate: number; updatedAt: number }> = {}
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from') ?? 'JPY'
  const to = searchParams.get('to') ?? 'TWD'

  if (from === to) return NextResponse.json({ rate: 1 })

  const cacheKey = `${from}_${to}`
  const cached = CACHE[cacheKey]
  if (cached && Date.now() - cached.updatedAt < CACHE_TTL) {
    return NextResponse.json({ rate: cached.rate, cached: true })
  }

  try {
    const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) throw new Error('Exchange rate API failed')
    const data = await res.json()
    const rate = data.rates?.[to]
    if (!rate) throw new Error(`Currency ${to} not found`)

    CACHE[cacheKey] = { rate, updatedAt: Date.now() }
    return NextResponse.json({ rate })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch exchange rate' }, { status: 500 })
  }
}
