'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { registerPlugin } from '@/lib/pluginRegistry'
import { registerNavbarSlot } from '@/lib/pluginNavbarRegistry'
import { registerAppSettingsPanel } from '@/lib/pluginAppSettingsRegistry'
import { pluginApiJson, pluginApiJsonWithStale, reportPluginCatch } from '@/lib/pluginDev'
import { reportPluginError } from '@/lib/pluginLog'
import { pluginLucideIcons } from '@/lib/pluginLucideBridge'
import { useDashboardStore } from '@/lib/store'
import { usePluginLocale } from '@/lib/pluginLocale'
import { t } from '@/lib/i18n'
import type { PluginComponent, PluginMeta } from '@/types'
import type { LucideIcon } from 'lucide-react'

export type SelfDashboardPluginBridge = {
  React: typeof React
  /** Host react-dom APIs used by volume widgets (e.g. createPortal for modals). */
  ReactDOM: { createPortal: typeof createPortal }
  /** Shared Lucide icons — volume widgets must not bundle lucide-react. */
  LucideReact: Record<string, LucideIcon>
  /** Host Zustand hook — volume widgets must not bundle a separate store copy. */
  useDashboardStore: typeof useDashboardStore
  usePluginLocale: typeof usePluginLocale
  t: typeof t
  registerPlugin: (meta: PluginMeta, component: PluginComponent, opts?: { replace?: boolean }) => void
  registerNavbarSlot: typeof registerNavbarSlot
  registerAppSettingsPanel: typeof registerAppSettingsPanel
  pluginApiJson: typeof pluginApiJson
  pluginApiJsonWithStale: typeof pluginApiJsonWithStale
  reportPluginCatch: typeof reportPluginCatch
  reportPluginError: typeof reportPluginError
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
    LucideReact: pluginLucideIcons,
    useDashboardStore,
    usePluginLocale,
    t,
    registerPlugin,
    registerNavbarSlot,
    registerAppSettingsPanel,
    pluginApiJson,
    pluginApiJsonWithStale,
    reportPluginCatch,
    reportPluginError,
  }
}
