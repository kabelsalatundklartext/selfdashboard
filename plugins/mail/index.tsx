'use client'

import { useEffect, useState } from 'react'
import type { PluginComponent, PluginMeta, PluginWidgetProps } from '@/types'
import { NavbarMail } from '@/components/layout/NavbarMail'
import { pluginApiJson } from '@/lib/pluginDev'
import { MAIL_PLUGIN_ID } from '@/lib/mail/clientApi'

export const meta: PluginMeta = {
  id: 'mail',
  name: 'E-Mail / IMAP',
  description: 'Navbar-Badge mit ungelesenen Mails, mehrere IMAP-Konten. API: /api/plugins/mail.',
  version: '1.1.0',
  author: 'SelfDashboard',
  category: 'productivity',
  icon: '✉️',
  defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 },
}

function MailStatusSummary() {
  const [unread, setUnread] = useState<number | null>(null)
  useEffect(() => {
    void pluginApiJson<{ unread?: number }>(MAIL_PLUGIN_ID, '/status')
      .then(j => setUnread(j.unread ?? 0))
      .catch(() => setUnread(null))
  }, [])
  if (unread === null) return <span>…</span>
  return <span>{unread} ungelesen</span>
}

function MailStatusWidget(_props: PluginWidgetProps) {
  return (
    <div
      className="flex flex-col items-center justify-center h-full text-center p-3"
      style={{ color: 'var(--text-muted)', fontSize: '12px' }}
    >
      <span style={{ fontSize: '24px', marginBottom: '8px' }}>✉️</span>
      <MailStatusSummary />
    </div>
  )
}

/** Called from widget.js entry after SelfDashboard bridge is ready. */
export function registerMailPluginSurfaces(): void {
  const SD = typeof window !== 'undefined' ? window.SelfDashboard : undefined
  if (!SD?.registerNavbarSlot) return
  SD.registerNavbarSlot(meta.id, NavbarMail)
}

export const component: PluginComponent = {
  Widget: MailStatusWidget,
}
