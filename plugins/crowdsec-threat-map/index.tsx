'use client'

import type { CSSProperties } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ExternalLink, Map, RefreshCw } from 'lucide-react'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'
import type { Locale } from '@/lib/i18n'
import { useDashboardStore } from '@/lib/store'

export const meta: PluginMeta = {
  id: 'crowdsec-threat-map',
  name: 'CrowdSec Threat Map',
  description:
    'Eingebettete Ansicht oder Link zur CrowdSec Threat Map (Docker: ghcr.io/kabelsalatundklartext/crowdsec-threat-map-docker).',
  version: '1.0.1',
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

  const iframeHostRef = useRef<HTMLDivElement>(null)
  const [frameNonce, setFrameNonce] = useState(0)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [loadSlow, setLoadSlow] = useState(false)
  const lastBoxRef = useRef<{ w: number; h: number }>({ w: -1, h: -1 })
  const skipResizeBounceUntil = useRef(0)

  const bumpFrame = useCallback(() => {
    setIframeLoaded(false)
    setLoadSlow(false)
    setFrameNonce((n) => n + 1)
  }, [])

  useEffect(() => {
    if (!url || !embed) return
    setIframeLoaded(false)
    setLoadSlow(false)
    setFrameNonce((n) => n + 1)
    lastBoxRef.current = { w: -1, h: -1 }
    skipResizeBounceUntil.current = Date.now() + 320
  }, [url, embed])

  useEffect(() => {
    if (!url || !embed) return
    const el = iframeHostRef.current
    if (!el) return

    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect
      if (!cr) return
      const w = Math.round(cr.width)
      const h = Math.round(cr.height)
      const prev = lastBoxRef.current
      lastBoxRef.current = { w, h }
      if (Date.now() < skipResizeBounceUntil.current) return
      // Widget springt oft von ~0 auf echte Höhe (Grid/Flex) — iframe zeichnet sonst leer / falsch
      if (prev.h >= 0 && prev.h < 28 && h >= 48 && w >= 48) bumpFrame()
    })

    ro.observe(el)
    return () => ro.disconnect()
  }, [url, embed, bumpFrame])

  useEffect(() => {
    if (!url || !embed || iframeLoaded) return
    const t = window.setTimeout(() => setLoadSlow(true), 12_000)
    return () => clearTimeout(t)
  }, [url, embed, iframeLoaded, frameNonce])

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
      <div
        ref={iframeHostRef}
        style={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          width: '100%',
          position: 'relative',
          background: 'var(--surface)',
        }}
      >
        {!iframeLoaded ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: 12,
              textAlign: 'center',
              background: 'color-mix(in srgb, var(--surface) 92%, var(--background))',
              zIndex: 1,
              pointerEvents: loadSlow ? 'auto' : 'none',
            }}
            aria-hidden={!loadSlow}
          >
            <div className="skeleton" style={{ width: 'min(220px, 70%)', height: 10, borderRadius: 4, opacity: 0.55 }} />
            <div className="skeleton" style={{ width: 'min(160px, 55%)', height: 10, borderRadius: 4, opacity: 0.45 }} />
            {loadSlow ? (
              <>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.45, maxWidth: 280 }}>
                  {de
                    ? 'Die Karte antwortet nicht wie erwartet (iframe / Layout). Neu laden oder im Tab öffnen.'
                    : 'The map is taking unusually long (iframe / layout). Reload or open in a new tab.'}
                </p>
                <button
                  type="button"
                  onClick={() => bumpFrame()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    color: 'var(--text)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <RefreshCw size={14} aria-hidden />
                  {de ? 'Erneut laden' : 'Reload'}
                </button>
              </>
            ) : null}
          </div>
        ) : null}
        <iframe
          key={`${url}#${frameNonce}`}
          title={de ? 'CrowdSec Threat Map' : 'CrowdSec threat map'}
          src={url}
          loading="eager"
          onLoad={() => {
            setIframeLoaded(true)
            setLoadSlow(false)
          }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            border: 0,
            background: 'var(--surface)',
          }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
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
