import type { Locale } from '@/lib/i18n'

export function TotpQrImage({ dataUrl, locale }: { dataUrl: string; locale: Locale }) {
  const de = locale === 'de'
  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <img
        src={dataUrl}
        alt={de ? 'QR-Code für Authenticator-App' : 'QR code for authenticator app'}
        width={220}
        height={220}
        className="rounded-lg"
        style={{ background: '#fff', padding: 8, border: '1px solid var(--border)' }}
      />
      <p className="text-xs text-center" style={{ color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
        {de
          ? 'QR-Code mit Google Authenticator, Aegis, Bitwarden o.ä. scannen.'
          : 'Scan the QR code with Google Authenticator, Aegis, Bitwarden, etc.'}
      </p>
    </div>
  )
}
