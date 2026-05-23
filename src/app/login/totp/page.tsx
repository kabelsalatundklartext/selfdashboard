import { Suspense } from 'react'
import { TotpLoginForm } from '@/app/login/totp/TotpLoginForm'

export default function TotpLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
          <div className="w-full max-w-md h-64 rounded-2xl" style={{ background: 'var(--surface)' }} />
        </div>
      }
    >
      <TotpLoginForm />
    </Suspense>
  )
}
