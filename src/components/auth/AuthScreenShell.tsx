'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useDashboardStore } from '@/lib/store'
import type { Locale } from '@/lib/i18n'
import { authT } from '@/lib/authScreenI18n'

export function AuthScreenShell({ children }: { children: ReactNode }) {
  const locale = useDashboardStore((s) => s.locale)
  const setLocale = useDashboardStore((s) => s.setLocale)

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'var(--background)', color: 'var(--text)' }}
    >
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <div className="w-full flex justify-center">
          <Link
            href="/"
            className="inline-flex flex-col items-center no-underline"
            aria-label="SelfDashboard"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img
                src="/shield.png"
                alt=""
                width={48}
                height={48}
                style={{ height: '48px', width: '48px', objectFit: 'contain', flexShrink: 0 }}
              />
              <div style={{ height: '40px', width: '4px', borderRadius: '2px', background: 'var(--accent)', flexShrink: 0 }} />
              <span
                style={{
                  fontFamily: 'var(--font-orbitron)',
                  fontWeight: 800,
                  fontSize: '30px',
                  letterSpacing: '0.5px',
                  color: 'var(--text)',
                  lineHeight: 1,
                }}
              >
                Self<span style={{ color: 'var(--accent)' }}>Dashboard</span>
              </span>
            </div>
            <span
              style={{
                marginTop: '8px',
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.35em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
              }}
            >
              Your modular home dashboard
            </span>
          </Link>
        </div>

        <div
          className="relative w-full rounded-2xl"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="absolute top-3 right-3 z-10">
            <LangToggle locale={locale} setLocale={setLocale} />
          </div>
          <div className="p-8 pt-10 flex flex-col gap-4">{children}</div>
        </div>
      </div>
    </div>
  )
}

function LangToggle({
  locale,
  setLocale,
}: {
  locale: Locale
  setLocale: (l: Locale) => void
}) {
  const btn = (id: Locale, label: string) => (
    <button
      type="button"
      onClick={() => setLocale(id)}
      title={label}
      aria-pressed={locale === id}
      className="text-xs font-semibold rounded-md px-2 py-1 transition-colors min-w-[2rem]"
      style={{
        background: locale === id ? 'var(--accent)' : 'var(--surface-2)',
        color: locale === id ? '#fff' : 'var(--text-muted)',
        border: `1px solid ${locale === id ? 'var(--accent)' : 'var(--border)'}`,
        cursor: 'pointer',
      }}
    >
      {id.toUpperCase()}
    </button>
  )

  return (
    <div
      className="flex gap-1 shrink-0"
      role="group"
      aria-label={locale === 'de' ? 'Sprache' : 'Language'}
    >
      {btn('de', authT(locale, 'langDe'))}
      {btn('en', authT(locale, 'langEn'))}
    </div>
  )
}
