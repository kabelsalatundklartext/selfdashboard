'use client'

import type { CSSProperties } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppWindow, ExternalLink, RefreshCw } from 'lucide-react'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'
import { usePluginLocale } from '@/lib/pluginLocale'

const EXAMPLE_URL = 'http://192.168.1.10:8080'

/** All user-visible strings for this plugin (widget + settings), keyed by locale. */
function iframeStrings(de: boolean) {
  return {
    hintNoUrlBefore: de ? 'URL der einzubettenden Seite eintragen — z. B.' : 'Enter the URL to embed — e.g.',
    openPage: de ? 'Seite öffnen' : 'Open page',
    linkModeHelp: de
      ? 'Modus „Nur Link“: sinnvoll, wenn die Zielseite nicht per iframe eingebettet werden darf (X-Frame-Options).'
      : '“Link only” mode: use when the target page cannot be embedded (X-Frame-Options).',

    loadSlowHint: de
      ? 'Die Seite antwortet nicht wie erwartet (iframe / Layout). Neu laden oder im Tab öffnen.'
      : 'The page is taking unusually long (iframe / layout). Reload or open in a new tab.',
    reload: de ? 'Erneut laden' : 'Reload',

    iframeTitle: de ? 'Eingebettete Seite' : 'Embedded page',
    openInNewTab: de ? 'In neuem Tab' : 'Open in new tab',

    settingsUrlLabel: de ? 'Seiten-URL' : 'Page URL',
    settingsUrlHelpDe: (
      <>
        Ohne <code style={{ fontSize: '10px' }}>http://</code> wird <code style={{ fontSize: '10px' }}>http</code>{' '}
        angenommen. Für HTTPS die vollständige URL angeben.
      </>
    ),
    settingsUrlHelpEn: (
      <>
        If you omit <code style={{ fontSize: '10px' }}>http://</code>, <code style={{ fontSize: '10px' }}>http</code> is assumed.
        Use a full <code style={{ fontSize: '10px' }}>https://</code> URL when needed.
      </>
    ),
    embedToggle: de ? 'Per iframe einbetten' : 'Embed as iframe',
    settingsFootnote: de
      ? 'Hinweis: Bleibt die Vorschau leer, sendet die Zielseite evtl. X-Frame-Options — dann „Einbetten“ aus und nur per Link öffnen (oder Reverse-Proxy auf dieselbe Origin).'
      : 'If the preview stays blank, the target may send X-Frame-Options — turn off “Embed” and use link mode (or reverse-proxy under the same origin).',

    viewportLabel: de ? 'Ansicht (Viewport)' : 'View (viewport)',
    viewportAuto: de ? 'Automatisch (volle Widget-Breite)' : 'Automatic (full widget width)',
    viewportMobile: de ? 'Immer mobil (schmale Spalte)' : 'Always mobile (narrow column)',
    viewportDesktop: de ? 'Immer Desktop (breit, ggf. horizontal scrollen)' : 'Always desktop (wide; may scroll horizontally)',
    viewportHelp: de
      ? '„Mobil“: schmale Layout-Breite. Breites Panel: gleichmäßig skaliert, sodass die volle Widget-Höhe genutzt wird (unten nicht abgeschnitten).'
      : '“Mobile”: narrow layout. Wide panel: scaled so the full widget height is used (no cut-off at the bottom).',
    mobileWidthLabel: de ? 'Mobile Breite (px)' : 'Mobile width (px)',
  }
}

export const meta: PluginMeta = {
  id: 'iframe',
  name: 'Iframe',
  description:
    'Embed any website (iframe) or open as a link; use link mode when X-Frame-Options blocks embedding. Optional mobile or desktop viewport.',
  version: '2.1.4',
  author: 'SelfDashboard',
  category: 'utility',
  icon: '🖼️',
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function normalizeUrl(raw: string): string {
  const s = raw.trim()
  if (!s) return ''
  return /^https?:\/\//i.test(s) ? s : `http://${s}`
}

type ViewportMode = 'auto' | 'mobile' | 'desktop'

function parseViewportMode(v: unknown): ViewportMode {
  if (v === 'mobile' || v === 'desktop' || v === 'auto') return v
  return 'auto'
}

const DESKTOP_FRAME_MIN_WIDTH = 1280

function clampMobileFrameWidth(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) return 390
  return Math.min(480, Math.max(320, Math.round(n)))
}

function Widget({ config }: PluginWidgetProps) {
  const { de } = usePluginLocale()
  const s = useMemo(() => iframeStrings(de), [de])
  const url = normalizeUrl(str(config.url))
  const embed = config.embed !== false
  const r = config as Record<string, unknown>
  const viewportMode = parseViewportMode(r.viewportMode)
  const mobileFrameWidth = clampMobileFrameWidth(r.mobileFrameWidth)

  const iframeHostRef = useRef<HTMLDivElement>(null)
  const [frameNonce, setFrameNonce] = useState(0)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [loadSlow, setLoadSlow] = useState(false)
  const [slotRect, setSlotRect] = useState({ w: 0, h: 0 })
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
  }, [url, embed, viewportMode, mobileFrameWidth])

  useEffect(() => {
    if (!url || !embed) return
    const el = iframeHostRef.current
    if (!el) return

    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect
      if (!cr) return
      const w = Math.round(cr.width)
      const h = Math.round(cr.height)
      if (viewportMode === 'mobile') {
        setSlotRect({ w, h })
      } else {
        setSlotRect({ w: 0, h: 0 })
      }
      const prev = lastBoxRef.current
      lastBoxRef.current = { w, h }
      if (Date.now() < skipResizeBounceUntil.current) return
      if (prev.h >= 0 && prev.h < 28 && h >= 48 && w >= 48) bumpFrame()
    })

    ro.observe(el)
    return () => ro.disconnect()
  }, [url, embed, bumpFrame, viewportMode, mobileFrameWidth])

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
        <AppWindow size={34} strokeWidth={2} style={{ color: 'var(--accent)', opacity: 0.9 }} aria-hidden />
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.45, maxWidth: '26em' }}>
          {s.hintNoUrlBefore} <code style={{ fontSize: '11px' }}>{EXAMPLE_URL}</code>
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
          <AppWindow size={30} strokeWidth={2} style={{ color: 'var(--accent)' }} aria-hidden />
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
          <ExternalLink size={16} aria-hidden />
          {s.openPage}
        </a>
        <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.45, maxWidth: '28em' }}>{s.linkModeHelp}</p>
      </div>
    )
  }

  const hostOuter: CSSProperties = {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    width: '100%',
    position: 'relative',
    background: 'var(--surface)',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: viewportMode === 'desktop' ? 'auto' : 'hidden',
  }

  const hostInner: CSSProperties =
    viewportMode === 'desktop'
      ? {
          minWidth: DESKTOP_FRAME_MIN_WIDTH,
          width: `max(100%, ${DESKTOP_FRAME_MIN_WIDTH}px)`,
          minHeight: 0,
          height: '100%',
          position: 'relative',
          flex: '0 0 auto',
        }
      : {
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          width: '100%',
          height: '100%',
          position: 'relative',
        }

  const wideMobileSlot = slotRect.w > mobileFrameWidth && slotRect.h > 0
  /**
   * Uniform scale to fill slot width without vertical overflow:
   * logical size (W0 × H0) with s = slotW/W0 gives visual (slotW × H0·s).
   * Choose H0 = slotH·W0/slotW so visual height = slotH (no bottom clip).
   */
  const mobileScale = wideMobileSlot ? slotRect.w / mobileFrameWidth : 1
  const mobileLogicalHeight = wideMobileSlot ? (slotRect.h * mobileFrameWidth) / slotRect.w : 0

  const mobileSlotClip: CSSProperties = {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
  }

  const mobileScaledStage: CSSProperties = wideMobileSlot
    ? {
        position: 'absolute',
        left: 0,
        top: 0,
        width: mobileFrameWidth,
        height: mobileLogicalHeight,
        transform: `scale(${mobileScale})`,
        transformOrigin: 'top left',
      }
    : {
        position: 'absolute',
        inset: 0,
      }

  const mobileFlexFill: CSSProperties = {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    width: '100%',
    height: '100%',
    position: 'relative',
  }

  const frameBody = (
    <>
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
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.45, maxWidth: 280 }}>{s.loadSlowHint}</p>
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
                  {s.reload}
                </button>
              </>
            ) : null}
          </div>
        ) : null}
        <iframe
          key={`${url}#${frameNonce}`}
          title={s.iframeTitle}
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
    </>
  )

  return (
    <div style={shell}>
      <div ref={iframeHostRef} style={hostOuter}>
        {viewportMode === 'mobile' ? (
          <div style={mobileFlexFill}>
            <div style={mobileSlotClip}>
              <div style={mobileScaledStage}>{frameBody}</div>
            </div>
          </div>
        ) : (
          <div style={hostInner}>{frameBody}</div>
        )}
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
          <ExternalLink size={12} aria-hidden />
          {s.openInNewTab}
        </a>
      </div>
    </div>
  )
}

function Settings({ config, onChange }: PluginSettingsProps) {
  const { de } = usePluginLocale()
  const s = useMemo(() => iframeStrings(de), [de])

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
          {s.settingsUrlLabel}
        </label>
        <input
          style={inp}
          value={str(config.url)}
          onChange={(e) => onChange('url', e.target.value)}
          placeholder={EXAMPLE_URL}
        />
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.45 }}>{de ? s.settingsUrlHelpDe : s.settingsUrlHelpEn}</p>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', cursor: 'pointer' }}>
        <span style={{ fontSize: '13px', color: 'var(--text)', flex: 1, lineHeight: 1.35 }}>{s.embedToggle}</span>
        <input
          type="checkbox"
          checked={embed}
          onChange={(e) => onChange('embed', e.target.checked)}
          style={{ width: '18px', height: '18px', accentColor: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }}
          aria-label={s.embedToggle}
        />
      </label>

      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
          {s.viewportLabel}
        </label>
        <select
          style={{ ...inp, cursor: 'pointer' }}
          value={parseViewportMode(config.viewportMode)}
          onChange={(e) => onChange('viewportMode', e.target.value)}
        >
          <option value="auto">{s.viewportAuto}</option>
          <option value="mobile">{s.viewportMobile}</option>
          <option value="desktop">{s.viewportDesktop}</option>
        </select>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.45 }}>{s.viewportHelp}</p>
      </div>

      {parseViewportMode(config.viewportMode) === 'mobile' ? (
        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
            {s.mobileWidthLabel}
          </label>
          <input
            style={inp}
            type="number"
            min={320}
            max={480}
            step={10}
            value={clampMobileFrameWidth(config.mobileFrameWidth)}
            onChange={(e) => {
              const raw = e.target.value === '' ? 390 : Number(e.target.value)
              onChange('mobileFrameWidth', Number.isFinite(raw) ? raw : 390)
            }}
          />
        </div>
      ) : null}

      <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>{s.settingsFootnote}</p>
    </div>
  )
}

export const component: PluginComponent = { Widget, Settings }
