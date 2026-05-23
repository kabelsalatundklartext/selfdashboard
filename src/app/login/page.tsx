import { Suspense } from 'react'
import { LoginForm } from '@/app/login/LoginForm'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
          <div className="w-full max-w-md h-64 rounded-2xl" style={{ background: 'var(--surface)' }} />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
