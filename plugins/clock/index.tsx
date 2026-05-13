'use client'

import { useEffect, useState } from 'react'
import type { PluginComponent, PluginMeta, PluginWidgetProps, PluginSettingsProps } from '@/types'

export const meta: PluginMeta = {
  id: 'clock',
  name: 'Clock & Date',
  description: 'Displays the current time and date with timezone support.',
  version: '1.1.0',
  author: 'SelfDashboard',
  category: 'utility',
  icon: '🕐',
  configSchema: [
    { key: 'timezone', label: 'Timezone', type: 'text', placeholder: 'Europe/Berlin', defaultValue: '' },
    { key: 'format24h', label: '24h Format', type: 'boolean', defaultValue: true },
    { key: 'showSeconds', label: 'Show Seconds', type: 'boolean', defaultValue: true },
    { key: 'showDate', label: 'Show Date', type: 'boolean', defaultValue: true },
    { key: 'cityName', label: 'City Name', type: 'text', placeholder: 'z.B. Berlin, New York, Tokyo', defaultValue: '' },
  ],
}

const TIMEZONES = [
  { label: 'Local (auto)', value: '' },
  { label: 'Europe/Berlin', value: 'Europe/Berlin' },
  { label: 'Europe/London', value: 'Europe/London' },
  { label: 'Europe/Paris', value: 'Europe/Paris' },
  { label: 'America/New_York', value: 'America/New_York' },
  { label: 'America/Los_Angeles', value: 'America/Los_Angeles' },
  { label: 'America/Chicago', value: 'America/Chicago' },
  { label: 'Asia/Tokyo', value: 'Asia/Tokyo' },
  { label: 'Asia/Shanghai', value: 'Asia/Shanghai' },
  { label: 'Asia/Dubai', value: 'Asia/Dubai' },
  { label: 'Australia/Sydney', value: 'Australia/Sydney' },
  { label: 'UTC', value: 'UTC' },
]

function Widget({ config }: PluginWidgetProps) {
  const [now, setNow] = useState(new Date())
  const tz = (config.timezone as string) || undefined
  const is24h = config.format24h !== false
  const showSeconds = config.showSeconds !== false
  const showDate = config.showDate !== false

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const timeStr = now.toLocaleTimeString('de-DE', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    ...(showSeconds ? { second: '2-digit' } : {}),
    hour12: !is24h,
  })

  const dateStr = now.toLocaleDateString('de-DE', {
    timeZone: tz,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const cityName = (config.cityName as string)?.trim()
  const tzLabel = cityName || tz || ''

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "2px" }}>
      <p
        className="tabular-nums tracking-tight"
        style={{ color: 'var(--accent)', fontVariantNumeric: 'tabular-nums', fontSize: showSeconds ? '2.5em' : '3em', fontWeight: 800 }}
      >
        {timeStr}
      </p>
      {showDate && (
        <p style={{ fontSize: "0.875em" }} style={{ color: 'var(--text-muted)' }}>
          {dateStr}
        </p>
      )}
      {(cityName || tz) && (
        <p style={{ fontSize: "0.75em", marginTop: "4px", padding: "2px 8px", borderRadius: "999px" }} style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
          {tzLabel}
        </p>
      )}
    </div>
  )
}

function Settings({ config, onChange }: PluginSettingsProps) {
  const inputStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Timezone */}
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
          Timezone
        </label>
        <select
          style={{ ...inputStyle, cursor: 'pointer' }}
          value={(config.timezone as string) || ''}
          onChange={(e) => onChange('timezone', e.target.value)}
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>{tz.label}</option>
          ))}
        </select>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Not in the list? Type manually below:
        </p>
        <input
          style={{ ...inputStyle, marginTop: '4px' }}
          value={(config.timezone as string) || ''}
          onChange={(e) => onChange('timezone', e.target.value)}
          placeholder="e.g. America/Toronto"
        />
      </div>

      {/* Toggles */}
      {/* City Name */}
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
          Stadtname / City Name
        </label>
        <input
          style={{ ...inputStyle }}
          value={(config.cityName as string) || ''}
          onChange={(e) => onChange('cityName', e.target.value)}
          placeholder="z.B. Berlin, New York, Tokyo"
        />
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Wird unter der Uhrzeit angezeigt
        </p>
      </div>

      {[
        { key: 'format24h', label: '24-hour format', default: true },
        { key: 'showSeconds', label: 'Show seconds', default: true },
        { key: 'showDate', label: 'Show date', default: true },
      ].map(({ key, label, default: def }) => (
        <label key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
          <span style={{ fontSize: '13px', color: 'var(--text)' }}>{label}</span>
          <div
            style={{
              width: '36px',
              height: '20px',
              borderRadius: '10px',
              background: (config[key] ?? def) ? 'var(--accent)' : 'var(--border)',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background 0.2s',
              flexShrink: 0,
            }}
            onClick={() => onChange(key, !(config[key] ?? def))}
          >
            <div style={{
              position: 'absolute',
              top: '2px',
              left: (config[key] ?? def) ? '18px' : '2px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: '#fff',
              transition: 'left 0.2s',
            }} />
          </div>
        </label>
      ))}
    </div>
  )
}

export const component: PluginComponent = { Widget, Settings }
