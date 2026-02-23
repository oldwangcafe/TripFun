import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function VerifyEmailPage() {
  return (
    <Card>
      <div className="text-center py-4">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-lg font-semibold text-slate-800 mb-2">電子郵件已驗證！</h2>
        <p className="text-sm text-slate-500 mb-6">
          您的帳號已成功驗證，現在可以登入使用 TripFund 了。
        </p>
        <Link href="/login">
          <Button fullWidth size="lg">前往登入</Button>
        </Link>
      </div>
    </Card>
  )
}
