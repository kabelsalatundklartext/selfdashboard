// ============================================================
// SelfDashboard – Core Types
// ============================================================

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

// ── Plugin System ────────────────────────────────────────────

export type PluginCategory =
  | 'media'
  | 'system'
  | 'network'
  | 'storage'
  | 'security'
  | 'productivity'
  | 'utility'

export interface PluginMeta {
  /** Unique identifier, e.g. "emby" or "com.example.myplugin" */
  id: string
  name: string
  description: string
  version: string
  author: string
  category: PluginCategory
  /** URL to plugin icon (optional) */
  icon?: string
  /** Minimum SelfDashboard version required */
  minAppVersion?: string
  /** URL to plugin homepage / GitHub repo */
  homepage?: string
  /** Config fields shown in the plugin settings modal */
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
  /** Runtime id of this placed widget (uuid) */
  instanceId: string
  pluginId: string
  /** User-configured values matching the configSchema */
  config: Record<string, unknown>
  /** Grid position */
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

// The actual React component a plugin exports
export interface PluginComponent {
  // The widget rendered on the dashboard
  Widget: React.ComponentType<PluginWidgetProps>
  // Optional settings panel rendered in the config modal
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

// ── Dashboard State ──────────────────────────────────────────

export interface DashboardConfig {
  theme: ThemeId
  title: string
  backgroundImage?: string
  plugins: PluginInstance[]
}
