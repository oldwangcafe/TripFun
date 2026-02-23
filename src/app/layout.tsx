import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TripFund｜旅遊公基金管理',
  description: '和朋友出遊時，輕鬆管理公共基金、記錄支出、一鍵結算',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TripFund',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#6366f1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body className="antialiased bg-slate-50 text-slate-800">
        {children}
      </body>
    </html>
  )
}
