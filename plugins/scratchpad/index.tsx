'use client'

import type {
  PluginComponent,
  PluginMeta,
  PluginSettingsProps,
  PluginWidgetProps,
} from '@/types'

export const meta: PluginMeta = {
  id: 'scratchpad',
  name: 'Notizzettel',
  description: 'Kurzer Merkzettel für Aufgaben, IPs oder Einkaufslisten.',
  version: '1.0.0',
  author: 'Du',
  category: 'utility',
  icon: '📝',
  configSchema: [
    {
      key: 'title',
      label: 'Titel',
      type: 'text',
      defaultValue: 'Notizzettel',
      placeholder: 'z. B. Heute erledigen',
    },
  ],
}

function Widget({ config }: PluginWidgetProps) {
  const title = (config.title as string) || 'Notizzettel'
  const note = (config.note as string) || ''

  return (
    <div
      className="widget-panel"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '12px',
        gap: '8px',
        overflow: 'hidden',
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: '0.95rem',
          fontWeight: 700,
          color: 'var(--text)',
        }}
      >
        {title}
      </h3>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          fontSize: '0.875rem',
          lineHeight: 1.45,
          color: 'var(--text-muted)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {note.trim() ? note : 'Noch leer — über das Zahnrad Text eintragen.'}
      </div>
    </div>
  )
}

function Settings({ config, onChange }: PluginSettingsProps) {
  const inputStyle: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    borderRadius: '6px',
    padding: '8px 10px',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            display: 'block',
            marginBottom: '6px',
          }}
        >
          Titel
        </label>
        <input
          style={inputStyle}
          value={(config.title as string) || ''}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="Überschrift"
        />
      </div>
      <div>
        <label
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            display: 'block',
            marginBottom: '6px',
          }}
        >
          Notiz
        </label>
        <textarea
          style={{
            ...inputStyle,
            minHeight: '140px',
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
          value={(config.note as string) || ''}
          onChange={(e) => onChange('note', e.target.value)}
          placeholder="Freitext …"
        />
      </div>
    </div>
  )
}

export const component: PluginComponent = { Widget, Settings }
