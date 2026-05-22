'use client'

import { registerCorePluginSettingsPanels } from '@/lib/registerCorePluginSettings'

registerCorePluginSettingsPanels()

/** Ensures mail (and future core) settings tabs exist before the settings modal opens. */
export function CorePluginSettingsInit() {
  return null
}
