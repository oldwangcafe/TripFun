import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateMemberBalances, calculateSettlements, calculateCategoryTotals } from '@/lib/settlement'
import { formatCurrency } from '@/lib/utils'
import { EXPENSE_CATEGORIES } from '@/lib/constants'

export async function POST(request: NextRequest) {
  const { tripId, userEmail } = await request.json()
  if (!tripId || !userEmail) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch all data
  const [{ data: trip }, { data: members }, { data: expenses }, { data: contributions }] = await Promise.all([
    supabase.from('trips').select('*').eq('id', tripId).single(),
    supabase.from('trip_members').select('*').eq('trip_id', tripId),
    supabase.from('expenses').select('*').eq('trip_id', tripId).order('created_at'),
    supabase.from('fund_contributions').select('*').eq('trip_id', tripId),
  ])

  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })

  const categoryTotals = calculateCategoryTotals(expenses ?? [])
  const memberBalances = calculateMemberBalances(members ?? [], contributions ?? [], expenses ?? [])
  const settlements = calculateSettlements(memberBalances, trip.trip_currency)
  const totalSpent = (expenses ?? []).reduce((s, e) => s + e.amount, 0)

  // Build HTML email
  const categoryRows = EXPENSE_CATEGORIES
    .filter(cat => categoryTotals[cat.value] > 0)
    .map(cat => `
      <tr>
        <td style="padding:8px 12px;">${cat.icon} ${cat.label}</td>
        <td style="padding:8px 12px;text-align:right;font-weight:600;">${formatCurrency(categoryTotals[cat.value], trip.trip_currency)}</td>
      </tr>
    `).join('')

  const settlementRows = settlements.length > 0
    ? settlements.map(s => `
        <tr>
          <td style="padding:8px 12px;">${s.from} → ${s.to}</td>
          <td style="padding:8px 12px;text-align:right;font-weight:600;color:#e11d48;">${formatCurrency(s.amount, s.currency)}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="2" style="padding:12px;text-align:center;color:#10b981;">🎉 大家貢獻均等，無需補款！</td></tr>'

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:20px;">
      <div style="max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;color:white;">
          <p style="margin:0;font-size:14px;opacity:0.8;">TripFun 旅程結算報告</p>
          <h1 style="margin:8px 0 0;font-size:28px;">${trip.title}</h1>
          <p style="margin:8px 0 0;opacity:0.7;">📍 ${trip.destination}</p>
        </div>
        <div style="padding:24px;">
          <div style="background:#f1f5f9;border-radius:12px;padding:16px;margin-bottom:20px;">
            <div style="display:flex;justify-content:space-between;">
              <div><p style="margin:0;font-size:12px;color:#64748b;">總支出</p><p style="margin:4px 0 0;font-size:24px;font-weight:700;color:#1e293b;">${formatCurrency(totalSpent, trip.trip_currency)}</p></div>
              <div><p style="margin:0;font-size:12px;color:#64748b;">剩餘</p><p style="margin:4px 0 0;font-size:24px;font-weight:700;color:#10b981;">${formatCurrency(trip.current_fund, trip.trip_currency)}</p></div>
              <div><p style="margin:0;font-size:12px;color:#64748b;">成員</p><p style="margin:4px 0 0;font-size:24px;font-weight:700;color:#1e293b;">${(members ?? []).length} 人</p></div>
            </div>
          </div>
          <h3 style="color:#1e293b;margin-bottom:12px;">支出分類</h3>
          <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:12px;overflow:hidden;margin-bottom:20px;">
            ${categoryRows}
          </table>
          <h3 style="color:#1e293b;margin-bottom:12px;">結算清單</h3>
          <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:12px;overflow:hidden;margin-bottom:20px;">
            ${settlementRows}
          </table>
        </div>
        <div style="padding:16px 24px;background:#f8fafc;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">由 TripFun 自動產生 · ${new Date().toLocaleDateString('zh-TW')}</p>
        </div>
      </div>
    </body>
    </html>
  `

  // Send via Resend
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
  }

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'TripFun <noreply@tripfund.app>',
      to: [userEmail],
      subject: `✈️ ${trip.title} 旅程結算報告`,
      html,
    }),
  })

  if (!emailRes.ok) {
    const err = await emailRes.json()
    return NextResponse.json({ error: err }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
