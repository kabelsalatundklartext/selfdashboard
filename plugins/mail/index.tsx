'use client'

import { useEffect, useState } from 'react'
import type { PluginComponent, PluginMeta, PluginWidgetProps } from '@/types'
import { registerPlugin } from '@/lib/pluginRegistry'
import { registerNavbarSlot } from '@/lib/pluginNavbarRegistry'
import { registerAppSettingsPanel } from '@/lib/pluginAppSettingsRegistry'
import { NavbarMail } from '@/components/layout/NavbarMail'
import { MailSettingsPanel } from '@/components/settings/MailSettingsPanel'
import { pluginApiJson } from '@/lib/pluginDev'
import { MAIL_PLUGIN_ID } from '@/lib/mail/clientApi'

export const meta: PluginMeta = {
  id: 'mail',
  name: 'E-Mail / IMAP',
  description: 'Navbar-Badge mit ungelesenen Mails, mehrere IMAP-Konten.',
  version: '1.0.0',
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

function registerMailPluginSurfaces() {
  registerNavbarSlot(meta.id, NavbarMail)
  registerAppSettingsPanel(meta.id, { de: 'E-Mail', en: 'Email' }, MailSettingsPanel)
}

registerMailPluginSurfaces()

export const component: PluginComponent = {
  Widget: MailStatusWidget,
}

registerPlugin(meta, component, { replace: true })
