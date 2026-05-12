// ── SelfDashboard i18n ───────────────────────────────────────
export type Locale = 'en' | 'de'

export const translations = {
  en: {
    // Navbar
    addPlugin: '+ Add Plugin',
    settings: 'Settings',
    // Empty state
    noWidgets: 'No widgets yet',
    noWidgetsHint: 'Click Add Plugin in the top bar to get started',
    // Settings Modal
    settingsTitle: 'Settings',
    dashboardTitle: 'Dashboard Title',
    colorTheme: 'Color Theme',
    language: 'Language',
    editMode: 'Edit Mode',
    editModeHint: 'Drag & resize widgets',
    // Plugin Store
    pluginStore: 'Plugin Store',
    pluginsAvailable: 'plugins available',
    searchPlugins: 'Search plugins...',
    noPluginsFound: 'No plugins found',
    add: 'Add',
    devHint: 'Developers can create their own plugins —',
    readTheDocs: 'read the docs',
    // Widget
    removeWidget: 'Remove widget',
    // Categories
    media: '🎬 Media',
    system: '🖥️ System',
    network: '🌐 Network',
    storage: '💾 Storage',
    security: '🔒 Security',
    productivity: '📋 Productivity',
    utility: '🔧 Utility',
    // Version
    version: 'Version',
  },
  de: {
    addPlugin: '+ Plugin hinzufügen',
    settings: 'Einstellungen',
    noWidgets: 'Noch keine Widgets',
    noWidgetsHint: 'Klicke auf "Plugin hinzufügen" in der oberen Leiste',
    settingsTitle: 'Einstellungen',
    dashboardTitle: 'Dashboard-Titel',
    colorTheme: 'Farbthema',
    language: 'Sprache',
    editMode: 'Bearbeitungsmodus',
    editModeHint: 'Widgets verschieben & skalieren',
    pluginStore: 'Plugin-Store',
    pluginsAvailable: 'Plugins verfügbar',
    searchPlugins: 'Plugins suchen...',
    noPluginsFound: 'Keine Plugins gefunden',
    add: 'Hinzufügen',
    devHint: 'Entwickler können eigene Plugins erstellen —',
    readTheDocs: 'zur Dokumentation',
    removeWidget: 'Widget entfernen',
    media: '🎬 Medien',
    system: '🖥️ System',
    network: '🌐 Netzwerk',
    storage: '💾 Speicher',
    security: '🔒 Sicherheit',
    productivity: '📋 Produktivität',
    utility: '🔧 Dienstprogramm',
    version: 'Version',
  },
} as const

export type TranslationKey = keyof typeof translations['en']

export function t(locale: Locale, key: TranslationKey): string {
  return translations[locale][key] ?? translations['en'][key] ?? key
}
