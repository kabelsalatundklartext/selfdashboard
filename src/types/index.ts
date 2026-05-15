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
  /** Merged with `{ x: 0, y: Infinity, w: 4, h: 4 }` when adding a widget from the plugin store. */
  defaultLayout?: Partial<WidgetLayout>
  /**
   * Nur wenn das Dashboard **gestapelt** ist (schmale Kachel): zusätzliche Rasterzeilen zur **Anzeige**-Höhe.
   * Die im Store gespeicherte `h` bleibt die Desktop-Höhe; beim Resizen im Stapelmodus wird der Wert wieder abgezogen.
   */
  stackedExtraH?: number
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
  /** Desktop / große Ansicht (12 Spalten, ab 1024px Rasterbreite). */
  layout: WidgetLayout
  /**
   * Schmale Ansicht (Handy, unter 768px Rasterbreite): gestapelt 1 Spalte — überschreibt nur gesetzte Felder (typisch `h`, `minH`).
   * Unbesetzt = gleiche Werte wie `layout`.
   */
  layoutPhone?: Partial<WidgetLayout>
  /**
   * Tablet (768–1023px Rasterbreite): 12-Spalten-Raster wie Desktop — überschreibt nur gesetzte Felder (`w`, `h`, `x`, `y`, …).
   * Unbesetzt = gleiche Werte wie `layout`.
   */
  layoutTablet?: Partial<WidgetLayout>
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
  /** true, wenn das Dashboard im Layout-Bearbeiten ist (z. B. Kacheln im Plugin sortieren). */
  editMode?: boolean
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
  hideTab?: boolean   // hide this dashboard from navbar tabs
}

export interface AppState {
  dashboards: Dashboard[]
  activeDashboardId: string
  locale: 'en' | 'de'
  editMode: boolean
}
