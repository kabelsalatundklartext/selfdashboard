import type { PluginCategory, PluginConfigField, WidgetLayout } from '@/types'

/** On-disk manifest (`plugins/<id>/plugin.json`) — metadata for store & scanner. */
export interface PluginManifest {
  id: string
  name: string
  description: string
  version: string
  author: string
  category: PluginCategory
  icon?: string
  iconUrl?: string
  minAppVersion?: string
  homepage?: string
  configSchema?: PluginConfigField[]
  defaultLayout?: Partial<WidgetLayout>
  stackedExtraH?: number
  /** Plugin exposes server routes via `plugins/<id>/server.ts` and the API gateway. */
  hasServer?: boolean
  /** `widget.js` present on volume (`plugins/custom/<id>/`). */
  hasWidgetFile?: boolean
  /** Volume widget replaces built-in widget for the same id. */
  overridesBuiltin?: boolean
  /** `builtin` = shipped in image; `custom` = under plugins/custom (volume on Unraid). */
  source?: 'builtin' | 'custom'
}

export interface PluginCatalogEntry extends PluginManifest {
  /** True when widget is registered in the client registry (built-in import). */
  widgetLoaded: boolean
}
