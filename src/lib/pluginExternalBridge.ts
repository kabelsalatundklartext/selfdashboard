'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { registerPlugin } from '@/lib/pluginRegistry'
import { registerNavbarSlot } from '@/lib/pluginNavbarRegistry'
import { registerAppSettingsPanel } from '@/lib/pluginAppSettingsRegistry'
import { pluginApiJson, reportPluginCatch } from '@/lib/pluginDev'
import type { PluginComponent, PluginMeta } from '@/types'

export type SelfDashboardPluginBridge = {
  React: typeof React
  /** Host react-dom APIs used by volume widgets (e.g. createPortal for modals). */
  ReactDOM: { createPortal: typeof createPortal }
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
    registerPlugin,
    registerNavbarSlot,
    registerAppSettingsPanel,
    pluginApiJson,
    reportPluginCatch,
  }
}
