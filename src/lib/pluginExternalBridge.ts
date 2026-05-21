'use client'

import * as React from 'react'
import { registerPlugin } from '@/lib/pluginRegistry'
import { registerNavbarSlot } from '@/lib/pluginNavbarRegistry'
import { registerAppSettingsPanel } from '@/lib/pluginAppSettingsRegistry'
import { pluginApiJson, reportPluginCatch } from '@/lib/pluginDev'
import type { PluginComponent, PluginMeta } from '@/types'

export type SelfDashboardPluginBridge = {
  React: typeof React
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
    registerPlugin,
    registerNavbarSlot,
    registerAppSettingsPanel,
    pluginApiJson,
    reportPluginCatch,
  }
}
