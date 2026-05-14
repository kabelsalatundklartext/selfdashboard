'use client'

import { useEffect, useState } from 'react'
import { X, Settings } from 'lucide-react'
import { pluginRegistry } from '@/lib/pluginRegistry'
import { useDashboardStore } from '@/lib/store'
import { Portal } from '@/components/ui/Portal'
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

  useEffect(() => {
    if (open) setLocalConfig({ ...instance.config })
  }, [open, instance.instanceId])

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
    <Portal>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}
      >
        {/* Backdrop */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={onClose}
        />

        {/* Modal */}
        <div
          className="animate-fade-in"
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '460px',
            maxHeight: '85vh',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '20px', paddingBottom: '16px',
            borderBottom: '1px solid var(--border)', flexShrink: 0,
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'var(--surface-2)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', flexShrink: 0,
            }}>
              {registered.meta.icon ?? '🧩'}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
                {registered.meta.name}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                v{registered.meta.version} · Einstellungen
              </p>
            </div>
            <button className="btn-ghost" style={{ padding: '6px' }} onClick={onClose}>
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {SettingsComponent ? (
              <SettingsComponent config={localConfig} onChange={handleChange} />
            ) : (
              <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Settings size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ fontSize: '14px' }}>Dieses Plugin hat keine Einstellungen.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex', gap: '12px', padding: '16px 20px',
            borderTop: '1px solid var(--border)', flexShrink: 0,
          }}>
            <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Abbrechen</button>
            <button className="btn-accent" style={{ flex: 1 }} onClick={handleSave}>Speichern</button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
