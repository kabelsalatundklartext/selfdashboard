import type { PluginMeta } from '@/types'
import { t, type Locale, type TranslationKey } from '@/lib/i18n'
import { PLUGIN_META_CATALOG } from '@/lib/pluginMetaCatalog'

const META_KEYS: Partial<Record<string, { name: TranslationKey; description: TranslationKey }>> = {
  iframe: { name: 'iframeName', description: 'iframeDesc' },
  bookmarks: { name: 'bookmarksName', description: 'bookmarksDesc' },
  clock: { name: 'clockName', description: 'clockDesc' },
  weather: { name: 'weatherName', description: 'weatherDesc' },
  crowdsec: { name: 'crowdsecName', description: 'crowdsecDesc' },
  unraid: { name: 'unraidName', description: 'unraidDesc' },
}

/** Localized plugin title/description for store and config modal (falls back to plugin.json). */
export function displayPluginMeta(meta: PluginMeta, locale: Locale): { name: string; description: string } {
  const keys = META_KEYS[meta.id]
  if (keys) {
    return { name: t(locale, keys.name), description: t(locale, keys.description) }
  }
  const catalog = PLUGIN_META_CATALOG[meta.id]
  if (catalog) {
    const name = locale === 'de'
      ? catalog.nameDe ?? meta.name ?? meta.id
      : catalog.nameEn ?? meta.name ?? meta.id
    return { name, description: locale === 'de' ? catalog.de : catalog.en }
  }
  return { name: meta.name ?? meta.id, description: meta.description ?? '' }
}
