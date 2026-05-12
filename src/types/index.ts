export type ThemeId = 'dark' | 'light' | 'nord' | 'catppuccin' | 'dracula' | 'solarized'

export interface Theme {
  id: ThemeId
  name: string
  colors: {
    background: string
    surface: string
    'surface-2': string
    border: string
    text: string
    'text-muted': string
    accent: string
  }
}

export type PluginCategory = 'media' | 'system' | 'network' | 'storage' | 'security' | 'productivity' | 'utility'

export interface PluginMeta {
  id: string
  name: string
  description: string
  version: string
  author: string
  category: PluginCategory
  icon?: string
  minAppVersion?: string
  homepage?: string
  configSchema?: PluginConfigField[]
}

export interface PluginConfigField {
  key: string
  label: string
  type: 'text' | 'password' | 'number' | 'boolean' | 'select'
  placeholder?: string
  required?: boolean
  options?: { label: string; value: string }[]
  defaultValue?: unknown
}

export interface PluginInstance {
  instanceId: string
  pluginId: string
  config: Record<string, unknown>
  layout: WidgetLayout
}

export interface WidgetLayout {
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
}

export interface PluginComponent {
  Widget: React.ComponentType<PluginWidgetProps>
  Settings?: React.ComponentType<PluginSettingsProps>
}

export interface PluginWidgetProps {
  instanceId: string
  config: Record<string, unknown>
  theme: ThemeId
}

export interface PluginSettingsProps {
  config: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
}

// ── Multi-Dashboard ──────────────────────────────────────────

export interface Dashboard {
  id: string          // used in URL: /dashboard/[id]
  name: string
  icon: string        // emoji
  theme: ThemeId
  customColors?: Record<string, string>
  customLogo?: string
  customIcon?: string  // base64 PNG for tab icon
  plugins: PluginInstance[]
}

export interface AppState {
  dashboards: Dashboard[]
  activeDashboardId: string
  locale: 'en' | 'de'
  editMode: boolean
}
