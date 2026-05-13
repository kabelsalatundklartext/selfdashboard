'use client'

import { useCallback, useEffect, useState } from 'react'
import type {
  PluginComponent,
  PluginMeta,
  PluginSettingsProps,
  PluginWidgetProps,
} from '@/types'
import { Portal } from '@/components/ui/Portal'
import { useDashboardStore } from '@/lib/store'
import { usePluginLocale } from '@/lib/pluginLocale'

export const meta: PluginMeta = {
  id: 'scratchpad',
  name: 'Notizzettel',
  description: 'Kurzer Merkzettel — direkt im Widget bearbeitbar, Speichern mit Sicherheitsabfrage.',
  version: '1.1.1',
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

function SaveConfirmModal({
  open,
  title,
  de,
  onCancel,
  onConfirm,
}: {
  open: boolean
  title: string
  de: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <Portal>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}
        role="presentation"
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)',
          }}
          onClick={onCancel}
          aria-hidden
        />
        <div
          className="animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="scratchpad-confirm-title"
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '400px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '20px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 id="scratchpad-confirm-title" style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
            {de ? 'Änderungen speichern?' : 'Save changes?'}
          </h2>
          <p style={{ margin: '0 0 18px', fontSize: '13px', lineHeight: 1.5, color: 'var(--text-muted)' }}>
            {de ? (
              <>Die Notiz unter „{title}“ wird im Dashboard dauerhaft überschrieben. Fortfahren?</>
            ) : (
              <>The note under “{title}” will be permanently overwritten on the dashboard. Continue?</>
            )}
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-ghost"
              style={{ padding: '8px 14px', fontSize: '13px' }}
              onClick={onCancel}
            >
              {de ? 'Abbrechen' : 'Cancel'}
            </button>
            <button type="button" className="btn-accent" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={onConfirm}>
              {de ? 'Speichern' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}

function Widget({ instanceId, config }: PluginWidgetProps) {
  const { de } = usePluginLocale()
  const title = (config.title as string) || (de ? 'Notizzettel' : 'Scratchpad')
  const savedNote = (config.note as string) || ''
  const updatePluginConfig = useDashboardStore((s) => s.updatePluginConfig)

  const [draft, setDraft] = useState(savedNote)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    setDraft(savedNote)
  }, [savedNote, instanceId])

  const dirty = draft !== savedNote

  const persist = useCallback(() => {
    updatePluginConfig(instanceId, { note: draft })
    setConfirmOpen(false)
  }, [draft, instanceId, updatePluginConfig])

  const inp: React.CSSProperties = {
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    borderRadius: '8px',
    padding: '10px 10px',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'none' as const,
    flex: 1,
    minHeight: '80px',
    lineHeight: 1.45,
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '4px 2px 0',
        gap: '8px',
        overflow: 'hidden',
        minWidth: 0,
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: '0.95rem',
          fontWeight: 700,
          color: 'var(--text)',
          flexShrink: 0,
        }}
      >
        {title}
      </h3>

      <textarea
        style={inp}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={de ? 'Notiz … (Speichern nicht vergessen)' : 'Note … (remember to save)'}
        spellCheck
        aria-label={de ? 'Notiz' : 'Note'}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn-ghost"
          style={{ padding: '6px 12px', fontSize: '12px', opacity: dirty ? 1 : 0.45 }}
          disabled={!dirty}
          onClick={() => setDraft(savedNote)}
        >
          {de ? 'Verwerfen' : 'Discard'}
        </button>
        <button
          type="button"
          className="btn-accent"
          style={{ padding: '6px 14px', fontSize: '12px' }}
          disabled={!dirty}
          onClick={() => setConfirmOpen(true)}
        >
          {de ? 'Speichern …' : 'Save…'}
        </button>
      </div>

      <SaveConfirmModal
        open={confirmOpen}
        title={title}
        de={de}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={persist}
      />
    </div>
  )
}

function Settings({ config, onChange }: PluginSettingsProps) {
  const { de } = usePluginLocale()
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
          {de ? 'Titel' : 'Title'}
        </label>
        <input
          style={inputStyle}
          value={(config.title as string) || ''}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder={de ? 'Überschrift' : 'Heading'}
        />
      </div>
      <p style={{ fontSize: '12px', lineHeight: 1.5, color: 'var(--text-muted)', margin: 0 }}>
        {de
          ? 'Den Notiztext trägst du direkt im Widget ein — dort wird vor dem Speichern nachgefragt, damit nichts aus Versehen überschrieben wird.'
          : 'Enter the note text in the widget — it asks before saving so nothing is overwritten by accident.'}
      </p>
    </div>
  )
}

export const component: PluginComponent = { Widget, Settings }
