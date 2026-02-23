'use client'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface PieData {
  name: string
  value: number
  color: string
  icon: string
}

interface Props {
  data: PieData[]
  currency: string
}

function CustomTooltip({ active, payload, currency }: { active?: boolean; payload?: { payload: PieData; value: number }[]; currency: string }) {
  if (active && payload && payload.length) {
    const item = payload[0]
    return (
      <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-3 py-2">
        <p className="text-sm font-semibold text-slate-800">
          {item.payload.icon} {item.payload.name}
        </p>
        <p className="text-sm text-slate-600">{formatCurrency(item.value, currency)}</p>
      </div>
    )
  }
  return null
}

function CustomLegend({ data, currency }: { data: PieData[]; currency: string }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="grid grid-cols-2 gap-2 mt-4">
      {data.map(item => (
        <div key={item.name} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
          <div className="min-w-0">
            <p className="text-xs text-slate-500 truncate">{item.icon} {item.name}</p>
            <p className="text-xs font-bold text-slate-700">{formatCurrency(item.value, currency)}</p>
            <p className="text-[10px] text-slate-400">{total > 0 ? Math.round((item.value / total) * 100) : 0}%</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function CategoryPieChart({ data, currency }: Props) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <p className="text-4xl mb-2">📊</p>
        <p className="text-sm">還沒有支出資料</p>
      </div>
    )
  }

  return (
    <div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip currency={currency} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <CustomLegend data={data} currency={currency} />
    </div>
  )
}
