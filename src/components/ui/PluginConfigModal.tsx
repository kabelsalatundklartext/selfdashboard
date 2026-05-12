'use client'

import { useState } from 'react'
import { X, Settings } from 'lucide-react'
import { pluginRegistry } from '@/lib/pluginRegistry'
import { useDashboardStore } from '@/lib/store'
import type { PluginInstance } from '@/types'

interface Props {
  instance: PluginInstance
  open: boolean
  onClose: () => void
}

export function PluginConfigModal({ instance, open, onClose }: Props) {
  const { updatePluginConfig } = useDashboardStore()
  const [localConfig, setLocalConfig] = useState<Record<string, unknown>>({ ...instance.config })
  const registered = pluginRegistry.get(instance.pluginId)

  if (!open || !registered) return null

  const { Settings: SettingsComponent } = registered.component

  const handleChange = (key: string, value: unknown) => {
    setLocalConfig((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    updatePluginConfig(instance.instanceId, localConfig)
    onClose()
  }

  return (
    // Full screen overlay — always centered, never cut off
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl flex flex-col animate-fade-in"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          maxHeight: '85vh',
          zIndex: 1,
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 pt-5 pb-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-xl flex-shrink-0"
            style={{ background: 'var(--surface-2)' }}
          >
            {registered.meta.icon ?? '🧩'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
              {registered.meta.name}
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {registered.meta.version} · Settings
            </p>
          </div>
          <button className="btn-ghost p-1.5 flex-shrink-0" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {SettingsComponent ? (
            <SettingsComponent config={localConfig} onChange={handleChange} />
          ) : (
            <div className="py-8 text-center" style={{ color: 'var(--text-muted)' }}>
              <Settings size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">This plugin has no settings.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex gap-3 px-5 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button className="btn-ghost flex-1" onClick={onClose}>Cancel</button>
          <button className="btn-accent flex-1" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}
