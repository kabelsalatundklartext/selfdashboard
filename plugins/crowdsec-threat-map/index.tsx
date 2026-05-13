'use client'

import type { CSSProperties } from 'react'
import { ExternalLink, Map } from 'lucide-react'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'
import type { Locale } from '@/lib/i18n'
import { useDashboardStore } from '@/lib/store'

export const meta: PluginMeta = {
  id: 'crowdsec-threat-map',
  name: 'CrowdSec Threat Map',
  description:
    'Eingebettete Ansicht oder Link zur CrowdSec Threat Map (Docker: ghcr.io/kabelsalatundklartext/crowdsec-threat-map-docker).',
  version: '1.0.0',
  author: 'SelfDashboard',
  category: 'security',
  icon: '🗺️',
  homepage: 'https://github.com/kabelsalatundklartext/crowdsec-threat-map-docker',
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function normalizeUrl(raw: string): string {
  const s = raw.trim()
  if (!s) return ''
  return /^https?:\/\//i.test(s) ? s : `http://${s}`
}

function Widget({ config }: PluginWidgetProps) {
  const locale = useDashboardStore((s) => s.locale) as Locale
  const de = locale !== 'en'
  const url = normalizeUrl(str(config.url))
  const embed = config.embed !== false

  const shell: CSSProperties = {
    height: '100%',
    width: '100%',
    minHeight: 0,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    overflow: 'hidden',
    containerType: 'size',
  }

  if (!url) {
    return (
      <div
        style={{
          ...shell,
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px',
          textAlign: 'center',
          gap: '10px',
        }}
      >
        <Map size={34} strokeWidth={2} style={{ color: 'var(--accent)', opacity: 0.9 }} aria-hidden />
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.45, maxWidth: '26em' }}>
          {de ? (
            <>
              URL der Threat Map eintragen — z. B. <code style={{ fontSize: '11px' }}>http://UNRAID-IP:8080</code>
              <br />
              (siehe{' '}
              <a href={meta.homepage} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                crowdsec-threat-map-docker
              </a>
              )
            </>
          ) : (
            <>
              Set the threat map URL — e.g. <code style={{ fontSize: '11px' }}>http://SERVER:8080</code>
              <br />
              (see{' '}
              <a href={meta.homepage} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                crowdsec-threat-map-docker
              </a>
              )
            </>
          )}
        </p>
      </div>
    )
  }

  if (!embed) {
    return (
      <div
        style={{
          ...shell,
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          gap: '14px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
          }}
        >
          <Map size={30} strokeWidth={2} style={{ color: 'var(--accent)' }} aria-hidden />
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '10px',
            background: 'var(--accent)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '13px',
            textDecoration: 'none',
            border: 'none',
          }}
        >
          <ExternalLink size={16} />
          {de ? 'Threat Map öffnen' : 'Open threat map'}
        </a>
        <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.45, maxWidth: '28em' }}>
          {de
            ? 'Modus „Nur Link“: nützlich wenn die Map nicht per iframe eingebettet werden darf (X-Frame-Options).'
            : '“Link only” mode: use when the map cannot be embedded (X-Frame-Options).'}
        </p>
      </div>
    )
  }

  return (
    <div style={shell}>
      <iframe
        title={de ? 'CrowdSec Threat Map' : 'CrowdSec threat map'}
        src={url}
        style={{
          flex: 1,
          width: '100%',
          minHeight: 0,
          border: 0,
          background: 'var(--surface)',
        }}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 8px',
          borderTop: '1px solid var(--border)',
          background: 'var(--surface-2)',
        }}
      >
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            display: 'inline-flex',
            gap: '5px',
            alignItems: 'center',
            textDecoration: 'none',
          }}
        >
          <ExternalLink size={12} />
          {de ? 'In neuem Tab' : 'Open in new tab'}
        </a>
      </div>
    </div>
  )
}

function Settings({ config, onChange }: PluginSettingsProps) {
  const locale = useDashboardStore((s) => s.locale) as Locale
  const de = locale !== 'en'

  const inp: CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  }

  const embed = config.embed !== false

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
          Threat-Map-URL
        </label>
        <input
          style={inp}
          value={str(config.url)}
          onChange={(e) => onChange('url', e.target.value)}
          placeholder="http://192.168.1.10:8080"
        />
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.45 }}>
          {de ? (
            <>
              Port wie im Docker-Template (z. B. 8080). Ohne <code style={{ fontSize: '10px' }}>http://</code> wird http
              angenommen. Projekt:{' '}
              <a href={meta.homepage} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                GitHub
              </a>
            </>
          ) : (
            <>
              Same port as in Docker (e.g. 8080). If you omit <code style={{ fontSize: '10px' }}>http://</code>, http is
              assumed. Project:{' '}
              <a href={meta.homepage} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                GitHub
              </a>
            </>
          )}
        </p>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', cursor: 'pointer' }}>
        <span style={{ fontSize: '13px', color: 'var(--text)', flex: 1, lineHeight: 1.35 }}>
          {de ? 'Karte einbetten (iframe)' : 'Embed map (iframe)'}
        </span>
        <input
          type="checkbox"
          checked={embed}
          onChange={(e) => onChange('embed', e.target.checked)}
          style={{ width: '18px', height: '18px', accentColor: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }}
        />
      </label>

      <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
        {de
          ? 'Hinweis: Wenn die Karte leer bleibt, sendet der Threat-Map-Container evtl. X-Frame-Options — dann „Einbetten“ aus und nur per Link öffnen (oder Reverse-Proxy auf dieselbe Origin).'
          : 'If the map stays blank, the threat map container may send X-Frame-Options — turn off “Embed” and use link mode (or reverse-proxy under the same origin).'}
      </p>
    </div>
  )
}

export const component: PluginComponent = { Widget, Settings }
