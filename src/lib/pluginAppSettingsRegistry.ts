'use client'

import type { ComponentType } from 'react'
import type { Locale } from '@/lib/i18n'

export type AppSettingsPanelProps = {
  locale: Locale
  onOpenProtocol?: () => void
}

const panels = new Map<string, { label: { de: string; en: string }; component: ComponentType<AppSettingsPanelProps> }>()
const listeners = new Set<() => void>()
let version = 0

function notifyAppSettings() {
  version += 1
  for (const fn of listeners) fn()
}

export function subscribeAppSettingsPanels(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange)
  return () => listeners.delete(onStoreChange)
}

export function getAppSettingsPanelsVersion(): number {
  return version
}

export function registerAppSettingsPanel(
  id: string,
  labels: { de: string; en: string },
  component: ComponentType<AppSettingsPanelProps>,
): void {
  panels.set(id, { label: labels, component })
  notifyAppSettings()
}

export function unregisterAppSettingsPanel(id: string): void {
  panels.delete(id)
  notifyAppSettings()
}

export function getAppSettingsPanels(): {
  id: string
  label: { de: string; en: string }
  component: ComponentType<AppSettingsPanelProps>
}[] {
  return Array.from(panels.entries()).map(([id, v]) => ({ id, ...v }))
}

export function hasAppSettingsPanel(id: string): boolean {
  return panels.has(id)
}
