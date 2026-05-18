/** Lesbare Meldungen für IMAP / gespeicherte Secrets */
export function formatMailError(message: string): string {
  const m = message.toLowerCase()
  if (
    m.includes('unsupported state') ||
    m.includes('unable to authenticate data') ||
    m.includes('auth tag') ||
    m.includes('encrypted payload')
  ) {
    return 'Passwort nicht lesbar — nach Docker-Neustart in Einstellungen → E-Mail Passwort neu eintragen und „Speichern“.'
  }
  if (m.includes('enotfound') && m.includes(':5000')) {
    return 'IMAP-Host darf keine Webmail-URL sein — nur IP/Hostname (z. B. 192.168.1.15), Port 993.'
  }
  if (m.includes('wrong version number')) {
    return 'SSL/TLS passt nicht — Port 993 mit „SSL/TLS“ an, oder Zertifikat-Prüfung aus.'
  }
  if (m.includes('unable to verify the first certificate')) {
    return 'TLS-Zertifikat abgelehnt — „TLS-Zertifikat prüfen“ ausschalten (lokale Synology).'
  }
  if (m.includes('greeting') && m.includes('tls')) {
    return 'IMAP antwortet nicht mit TLS — „SSL/TLS“ aktivieren (Port 993).'
  }
  return message
}

export function isMailConfigError(message?: string): boolean {
  if (!message) return false
  const m = message.toLowerCase()
  return (
    m.includes('passwort nicht lesbar') ||
    m.includes('passwort speichern') ||
    m.includes('kein abrufbares konto') ||
    m.includes('unsupported state') ||
    m.includes('unable to authenticate data')
  )
}
