'use client'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
    if (loginError) {
      setError(loginError.message === 'Invalid login credentials' ? '帳號或密碼錯誤' : loginError.message)
      setLoading(false)
      return
    }

    // If there's an invite token, process it after login
    if (inviteToken) {
      try {
        const res = await fetch('/api/process-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: inviteToken }),
        })
        const result = await res.json()
        if (result.tripId) {
          router.push(`/trips/${result.tripId}`)
          return
        }
      } catch {
        // Invite processing failed — fall through to dashboard
      }
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-800 mb-1">登入帳號</h2>
      {inviteToken && (
        <p className="text-xs text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg mb-4">
          🎉 登入後將自動加入旅程協助管理
        </p>
      )}
      <form onSubmit={handleLogin} className="space-y-4 mt-4">
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
          <Link
            href={inviteToken ? `/register?invite=${inviteToken}` : '/register'}
            className="text-indigo-600 font-medium hover:underline"
          >
            立即註冊
          </Link>
        </p>
      </div>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Card><div className="py-8 text-center text-slate-400">載入中…</div></Card>}>
      <LoginForm />
    </Suspense>
  )
}
