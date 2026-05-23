import { Suspense } from 'react'
import { LoginForm } from '@/app/login/LoginForm'

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--background)', color: 'var(--text)' }}
    >
      <Suspense fallback={<div className="w-full max-w-md h-64 rounded-2xl" style={{ background: 'var(--surface)' }} />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
