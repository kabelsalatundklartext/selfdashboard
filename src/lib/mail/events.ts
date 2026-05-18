/** Client-side: Navbar refreshes after mail enable/disable in settings. */
export const MAIL_CONFIG_CHANGED = 'selfdashboard:mail-config-changed'

export function dispatchMailConfigChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(MAIL_CONFIG_CHANGED))
  }
}
