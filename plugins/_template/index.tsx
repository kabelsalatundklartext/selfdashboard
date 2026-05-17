'use client'

/**
 * Copy this folder to plugins/<your-id>/ and adjust meta.id.
 * Register in src/lib/pluginLoader.ts — see docs/PLUGIN_DEV.md
 */

import { useCallback, useEffect, useState } from 'react'
import type { PluginComponent, PluginMeta, PluginWidgetProps } from '@/types'
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

function Widget({ instanceId, config }: PluginWidgetProps) {
  const [text, setText] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      // Example: once you add src/app/api/myplugin/route.ts
      // const data = await pluginApiJson<{ ok: boolean }>('myplugin', '/')
      // setText(data.ok ? 'OK' : 'Error')
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
