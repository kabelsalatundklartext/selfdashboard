/** Client-side: Navbar refreshes after mail enable/disable in settings. */
export const MAIL_CONFIG_CHANGED = 'selfdashboard:mail-config-changed'

export type MailConfigChangedDetail = { openUrl?: string | null; unread?: number }

export function dispatchMailConfigChanged(detail?: MailConfigChangedDetail): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<MailConfigChangedDetail>(MAIL_CONFIG_CHANGED, { detail }))
  }
}
