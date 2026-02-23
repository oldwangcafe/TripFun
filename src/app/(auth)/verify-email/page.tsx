'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite')
  const [processing, setProcessing] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    // If there's an invite token on this page (fallback — user was redirected here
    // instead of /auth/callback), try to process the invite now.
    if (!inviteToken) {
      setDone(true)
      return
    }

    setProcessing(true)
    fetch('/api/process-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: inviteToken }),
    })
      .then(res => res.json())
      .then(result => {
        if (result.tripId) {
          router.replace(`/trips/${result.tripId}`)
        } else {
          setDone(true)
          setProcessing(false)
        }
      })
      .catch(() => {
        setDone(true)
        setProcessing(false)
      })
  }, [inviteToken, router])

  if (processing && !done) {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-sm text-slate-500">正在加入旅程，請稍候…</p>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="text-center py-4">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-lg font-semibold text-slate-800 mb-2">電子郵件已驗證！</h2>
        <p className="text-sm text-slate-500 mb-6">
          您的帳號已成功驗證，現在可以登入使用 TripFun 了。
        </p>
        <Link href="/login">
          <Button fullWidth size="lg">前往登入</Button>
        </Link>
      </div>
    </Card>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <Card>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-sm text-slate-500">載入中…</p>
        </div>
      </Card>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
