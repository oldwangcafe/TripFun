'use client'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite')

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('密碼至少需要 8 個字元')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${window.location.origin}/verify-email${inviteToken ? `?invite=${inviteToken}` : ''}`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <Card>
        <div className="text-center py-4">
          <div className="text-5xl mb-4">📬</div>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">確認信已寄出！</h2>
          <p className="text-sm text-slate-500">
            請到 <strong>{email}</strong> 收取確認信，點擊連結完成驗證後即可登入。
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-800 mb-1">建立帳號</h2>
      {inviteToken && (
        <p className="text-xs text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg mb-4">
          🎉 您已被邀請加入旅程協助管理
        </p>
      )}
      <form onSubmit={handleRegister} className="space-y-4 mt-4">
        <Input
          label="暱稱"
          type="text"
          placeholder="例如：阿明、小花"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          leftIcon={<User className="w-4 h-4" />}
          required
        />
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
          placeholder="至少 8 個字元"
          value={password}
          onChange={e => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          required
        />
        {error && (
          <p className="text-sm text-rose-500 bg-rose-50 px-3 py-2 rounded-lg">{error}</p>
        )}
        <Button type="submit" fullWidth loading={loading} size="lg">
          註冊並發送確認信
        </Button>
      </form>
      <div className="mt-4 text-center">
        <p className="text-sm text-slate-500">
          已有帳號？{' '}
          <Link href="/login" className="text-indigo-600 font-medium hover:underline">
            立即登入
          </Link>
        </p>
      </div>
    </Card>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<Card><div className="py-8 text-center text-slate-400">載入中…</div></Card>}>
      <RegisterForm />
    </Suspense>
  )
}
