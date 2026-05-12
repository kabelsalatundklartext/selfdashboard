'use client'

import { useEffect } from 'react'
import { loadBuiltinPlugins } from '@/lib/pluginLoader'

let loaded = false

export function PluginBootstrap() {
  useEffect(() => {
    if (!loaded) {
      loadBuiltinPlugins()
      loaded = true
    }
  }, [])

  return null
}
