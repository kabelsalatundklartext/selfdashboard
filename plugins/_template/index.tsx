'use client'

/**
 * Vorlage: nach plugins/<deine-id>/ kopieren, plugin.json anpassen.
 * Veröffentlichen: cd selfdashboard && npm run publish:plugin-pack
 * Doku: selfdashboard/docs/PLUGIN_DEV.md · Architektur: docs/PLUGIN_ARCH_BETA.md
 */

import { useCallback, useEffect, useState } from 'react'
import type { PluginComponent, PluginMeta, PluginWidgetProps } from '@/types'
import { registerPlugin } from '@/lib/pluginRegistry'
import { pluginApiJson, reportPluginCatch } from '@/lib/pluginDev'

export const meta: PluginMeta = {
  id: 'myplugin',
  name: 'My Plugin',
  description: 'Template with automatic error logging.',
  version: '1.0.0',
  author: 'Your Name',
  category: 'utility',
  icon: '✨',
  defaultLayout: { w: 3, h: 3, minW: 2, minH: 2 },
}

function Widget({ config }: PluginWidgetProps) {
  const [text, setText] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      // Beispiel mit Server-Route: await pluginApiJson('myplugin', '/status')
      setText((config.label as string) || 'Hello')
    } catch (e) {
      reportPluginCatch('myplugin', e, 'load')
      setText(null)
    }
  }, [config.label])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div
      style={{
        height: '100%',
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text)',
        fontSize: '13px',
      }}
    >
      {text ?? '…'}
    </div>
  )
}

export const component: PluginComponent = { Widget }

registerPlugin(meta, component, { replace: true })
