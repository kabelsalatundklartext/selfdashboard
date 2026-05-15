'use client'

import { useEffect, useState } from 'react'
import { X, Settings } from 'lucide-react'
import { pluginRegistry } from '@/lib/pluginRegistry'
import { useDashboardStore } from '@/lib/store'
import { Portal } from '@/components/ui/Portal'
import { PluginMetaIcon } from '@/components/plugins/PluginMetaIcon'
import { t } from '@/lib/i18n'
import type { PluginInstance, WidgetLayout } from '@/types'

interface Props {
  instance: PluginInstance
  open: boolean
  onClose: () => void
}

function parseOptPositiveInt(s: string): number | undefined {
  const x = s.trim()
  if (!x) return undefined
  const n = Math.round(Number(x))
  if (!Number.isFinite(n) || n < 1) return undefined
  return n
}

function parseOptNonNegInt(s: string): number | undefined {
  const x = s.trim()
  if (!x) return undefined
  const n = Math.round(Number(x))
  if (!Number.isFinite(n) || n < 0) return undefined
  return n
}

const fieldInput: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  background: 'var(--surface-2)',
  color: 'var(--text)',
  fontSize: '13px',
  boxSizing: 'border-box',
}

export function PluginConfigModal({ instance, open, onClose }: Props) {
  const { updatePluginConfig, setPluginResponsiveLayouts, locale } = useDashboardStore()
  const [localConfig, setLocalConfig] = useState<Record<string, unknown>>({ ...instance.config })
  const [phoneH, setPhoneH] = useState('')
  const [phoneMinH, setPhoneMinH] = useState('')
  const [tabW, setTabW] = useState('')
  const [tabH, setTabH] = useState('')
  const [tabX, setTabX] = useState('')
  const [tabY, setTabY] = useState('')
  const [tabMinH, setTabMinH] = useState('')
  const registered = pluginRegistry.get(instance.pluginId)

  useEffect(() => {
    if (!open) return
    const live = useDashboardStore.getState().activeDashboard().plugins.find((p) => p.instanceId === instance.instanceId)
    const inst = live ?? instance
    setLocalConfig({ ...inst.config })
    const ph = inst.layoutPhone ?? {}
    setPhoneH(ph.h != null ? String(ph.h) : '')
    setPhoneMinH(ph.minH != null ? String(ph.minH) : '')
    const tt = inst.layoutTablet ?? {}
    setTabW(tt.w != null ? String(tt.w) : '')
    setTabH(tt.h != null ? String(tt.h) : '')
    setTabX(tt.x != null ? String(tt.x) : '')
    setTabY(tt.y != null ? String(tt.y) : '')
    setTabMinH(tt.minH != null ? String(tt.minH) : '')
  }, [open, instance.instanceId, instance])

  if (!open || !registered) return null

  const { Settings: SettingsComponent } = registered.component

  const handleChange = (key: string, value: unknown) => {
    setLocalConfig((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    const { dashboards, activeDashboardId } = useDashboardStore.getState()
    const dash = dashboards.find((d) => d.id === activeDashboardId)
    const live = dash?.plugins.find((p) => p.instanceId === instance.instanceId)
    const inst = live ?? instance
    const base = (inst.config ?? {}) as Record<string, unknown>
    updatePluginConfig(instance.instanceId, { ...base, ...localConfig })

    const phonePart: Partial<WidgetLayout> = {}
    const pH = parseOptPositiveInt(phoneH)
    const pMin = parseOptPositiveInt(phoneMinH)
    if (pH !== undefined) phonePart.h = pH
    if (pMin !== undefined) phonePart.minH = pMin
    const hadPhone = !!(inst.layoutPhone && Object.keys(inst.layoutPhone).length)

    const tabPart: Partial<WidgetLayout> = {}
    const tW = parseOptPositiveInt(tabW)
    const tH = parseOptPositiveInt(tabH)
    const tX = parseOptNonNegInt(tabX)
    const tY = parseOptNonNegInt(tabY)
    const tMin = parseOptPositiveInt(tabMinH)
    if (tW !== undefined) tabPart.w = tW
    if (tH !== undefined) tabPart.h = tH
    if (tX !== undefined) tabPart.x = tX
    if (tY !== undefined) tabPart.y = tY
    if (tMin !== undefined) tabPart.minH = tMin
    const hadTablet = !!(inst.layoutTablet && Object.keys(inst.layoutTablet).length)

    const responsivePatch: {
      layoutPhone?: Partial<WidgetLayout> | null
      layoutTablet?: Partial<WidgetLayout> | null
    } = {}

    if (Object.keys(phonePart).length > 0) responsivePatch.layoutPhone = phonePart
    else if (hadPhone) responsivePatch.layoutPhone = null

    if (Object.keys(tabPart).length > 0) responsivePatch.layoutTablet = tabPart
    else if (hadTablet) responsivePatch.layoutTablet = null

    if (Object.keys(responsivePatch).length > 0) {
      setPluginResponsiveLayouts(instance.instanceId, responsivePatch)
    }
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
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={onClose}
        />

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
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '20px', paddingBottom: '16px',
            borderBottom: '1px solid var(--border)', flexShrink: 0,
          }}>
            <PluginMetaIcon meta={registered.meta} size={40} />
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

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {SettingsComponent ? (
              <SettingsComponent config={localConfig} onChange={handleChange} />
            ) : (
              <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Settings size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ fontSize: '14px' }}>Dieses Plugin hat keine Einstellungen.</p>
              </div>
            )}

            <div style={{ marginTop: '22px', paddingTop: '18px', borderTop: '1px solid var(--border)' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', margin: '0 0 6px' }}>
                {t(locale, 'responsiveLayoutTitle')}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 14px', lineHeight: 1.45 }}>
                {t(locale, 'responsiveLayoutIntro')}
              </p>

              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t(locale, 'responsivePhoneSection')}
              </p>
              <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {t(locale, 'responsiveHeight')}
                  <input style={{ ...fieldInput, marginTop: '4px' }} value={phoneH} onChange={(e) => setPhoneH(e.target.value)} inputMode="numeric" />
                </label>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {t(locale, 'responsiveMinHeight')}
                  <input style={{ ...fieldInput, marginTop: '4px' }} value={phoneMinH} onChange={(e) => setPhoneMinH(e.target.value)} inputMode="numeric" />
                </label>
              </div>

              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t(locale, 'responsiveTabletSection')}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 10px' }}>
                {t(locale, 'responsiveTabletSaveHint')}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {t(locale, 'responsiveWidth')}
                  <input style={{ ...fieldInput, marginTop: '4px' }} value={tabW} onChange={(e) => setTabW(e.target.value)} inputMode="numeric" />
                </label>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {t(locale, 'responsiveHeight')}
                  <input style={{ ...fieldInput, marginTop: '4px' }} value={tabH} onChange={(e) => setTabH(e.target.value)} inputMode="numeric" />
                </label>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {t(locale, 'responsivePosX')}
                  <input style={{ ...fieldInput, marginTop: '4px' }} value={tabX} onChange={(e) => setTabX(e.target.value)} inputMode="numeric" />
                </label>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {t(locale, 'responsivePosY')}
                  <input style={{ ...fieldInput, marginTop: '4px' }} value={tabY} onChange={(e) => setTabY(e.target.value)} inputMode="numeric" />
                </label>
                <label style={{ gridColumn: '1 / -1', fontSize: '12px', color: 'var(--text-muted)' }}>
                  {t(locale, 'responsiveMinHeight')}
                  <input style={{ ...fieldInput, marginTop: '4px' }} value={tabMinH} onChange={(e) => setTabMinH(e.target.value)} inputMode="numeric" />
                </label>
              </div>
            </div>
          </div>

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
