'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { registerPlugin } from '@/lib/pluginRegistry'
import { registerNavbarSlot } from '@/lib/pluginNavbarRegistry'
import { registerAppSettingsPanel } from '@/lib/pluginAppSettingsRegistry'
import { pluginApiJson, reportPluginCatch } from '@/lib/pluginDev'
import { useDashboardStore } from '@/lib/store'
import { usePluginLocale } from '@/lib/pluginLocale'
import { t } from '@/lib/i18n'
import type { PluginComponent, PluginMeta } from '@/types'

export type SelfDashboardPluginBridge = {
  React: typeof React
  /** Host react-dom APIs used by volume widgets (e.g. createPortal for modals). */
  ReactDOM: { createPortal: typeof createPortal }
  /** Host Zustand hook — volume widgets must not bundle a separate store copy. */
  useDashboardStore: typeof useDashboardStore
  usePluginLocale: typeof usePluginLocale
  t: typeof t
  registerPlugin: (meta: PluginMeta, component: PluginComponent, opts?: { replace?: boolean }) => void
  registerNavbarSlot: typeof registerNavbarSlot
  registerAppSettingsPanel: typeof registerAppSettingsPanel
  pluginApiJson: typeof pluginApiJson
  reportPluginCatch: typeof reportPluginCatch
}

declare global {
  interface Window {
    SelfDashboard?: SelfDashboardPluginBridge
  }
}

export function installPluginExternalBridge(): void {
  if (typeof window === 'undefined') return
  window.SelfDashboard = {
    React,
    ReactDOM: { createPortal },
    useDashboardStore,
    usePluginLocale,
    t,
    registerPlugin,
    registerNavbarSlot,
    registerAppSettingsPanel,
    pluginApiJson,
    reportPluginCatch,
  }
}
