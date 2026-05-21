'use client'

import { registerAppSettingsPanel } from '@/lib/pluginAppSettingsRegistry'
import { MailSettingsPanel } from '@/components/settings/MailSettingsPanel'

let registered = false

/** Mail API lives in the core image; settings panel must use the app React tree (not volume widget.js). */
export function registerCorePluginSettingsPanels(): void {
  if (registered) return
  registered = true
  registerAppSettingsPanel('mail', { de: 'E-Mail', en: 'Email' }, MailSettingsPanel)
}
