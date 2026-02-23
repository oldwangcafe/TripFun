export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-200 mb-4">
            <span className="text-3xl">✈️</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">TripFund</h1>
          <p className="text-sm text-slate-500 mt-1">旅遊公基金管理</p>
        </div>
        {children}
      </div>
    </div>
  )
}
