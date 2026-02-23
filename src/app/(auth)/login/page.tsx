'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message === 'Invalid login credentials' ? '帳號或密碼錯誤' : error.message)
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-800 mb-5">登入帳號</h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <Input
          label="電子郵件"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          required
        />
        <Input
          label="密碼"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          required
        />
        {error && (
          <p className="text-sm text-rose-500 bg-rose-50 px-3 py-2 rounded-lg">{error}</p>
        )}
        <Button type="submit" fullWidth loading={loading} size="lg">
          登入
        </Button>
      </form>
      <div className="mt-4 text-center">
        <p className="text-sm text-slate-500">
          還沒有帳號？{' '}
          <Link href="/register" className="text-indigo-600 font-medium hover:underline">
            立即註冊
          </Link>
        </p>
      </div>
    </Card>
  )
}
