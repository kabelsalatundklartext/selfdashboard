import type { PluginComponent, PluginMeta, PluginWidgetProps } from '@/types'

export const meta: PluginMeta = {
  id: 'bookmarks',
  name: 'App Bookmarks',
  description: 'Quick links to your self-hosted services with icons and status indicators.',
  version: '1.0.0',
  author: 'SelfDashboard',
  category: 'utility',
  icon: '🔖',
  configSchema: [
    { key: 'title', label: 'Section Title', type: 'text', defaultValue: 'My Apps' },
    {
      key: 'links',
      label: 'Links (JSON)',
      type: 'text',
      placeholder: '[{"name":"Portainer","url":"http://...","icon":"🐳"}]',
    },
  ],
}

interface BookmarkLink { name: string; url: string; icon?: string }

function Widget({ config }: PluginWidgetProps) {
  const sectionTitle = (config.title as string) ?? 'My Apps'
  let links: BookmarkLink[] = []

  try {
    links = config.links
      ? JSON.parse(config.links as string)
      : [
          { name: 'Portainer', url: '#', icon: '🐳' },
          { name: 'Nextcloud', url: '#', icon: '☁️' },
          { name: 'Jellyfin', url: '#', icon: '🎬' },
          { name: 'Unraid', url: '#', icon: '🖥️' },
        ]
  } catch {
    links = []
  }

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        {sectionTitle}
      </p>
      <div className="grid grid-cols-2 gap-2 mt-1">
        {links.map((link, i) => (
          <a
            key={i}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
            }}
          >
            <span className="text-xl">{link.icon ?? '🔗'}</span>
            <span className="text-sm font-medium truncate">{link.name}</span>
          </a>
        ))}
      </div>
    </>
  )
}

export const component: PluginComponent = { Widget }
