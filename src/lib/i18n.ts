export type Locale = 'en' | 'de'

export const translations = {
  en: {
    addPlugin: 'Add Plugin',
    settings: 'Settings',
    noWidgets: 'No widgets yet',
    noWidgetsHint: 'Click + in the top bar to get started',
    settingsTitle: 'Settings',
    dashboardTitle: 'Dashboard Title',
    colorTheme: 'Color Theme',
    language: 'Language',
    editMode: 'Edit Mode',
    editModeHint: 'Drag & resize widgets',
    mobileStackHint: 'Narrow screen: widgets stack in one column. Drag position on desktop; height can be resized here.',
    pluginStore: 'Plugin Store',
    pluginsAvailable: 'plugins available',
    searchPlugins: 'Search plugins...',
    noPluginsFound: 'No plugins found',
    add: 'Add',
    devHint: 'Developers can create their own plugins —',
    readTheDocs: 'read the docs',
    removeWidget: 'Remove widget',
    media: '🎬 Media',
    system: '🖥️ System',
    network: '🌐 Network',
    storage: '💾 Storage',
    security: '🔒 Security',
    productivity: '📋 Productivity',
    utility: '🔧 Utility',
    version: 'Version',
    // Plugin names & descriptions
    bookmarksName: 'App Bookmarks',
    bookmarksDesc: 'Quick links to your self-hosted services with custom icons.',
    clockName: 'Clock & Date',
    clockDesc: 'Displays the current time and date with timezone support.',
    iframeName: 'Iframe',
    iframeDesc:
      'Embed any website by URL (iframe) or open as a link — dashboards, internal tools, maps. If X-Frame-Options blocks embedding, use link-only mode or reverse-proxy to the same origin.',
  },
  de: {
    addPlugin: 'Plugin hinzufügen',
    settings: 'Einstellungen',
    noWidgets: 'Noch keine Widgets',
    noWidgetsHint: 'Klicke auf + in der oberen Leiste',
    settingsTitle: 'Einstellungen',
    dashboardTitle: 'Dashboard-Titel',
    colorTheme: 'Farbthema',
    language: 'Sprache',
    editMode: 'Bearbeitungsmodus',
    editModeHint: 'Widgets verschieben & skalieren',
    mobileStackHint:
      'Schmale Ansicht: Widgets untereinander. Position am Desktop ziehen; hier nur die Höhe anpassbar.',
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
    bookmarksName: 'App-Lesezeichen',
    bookmarksDesc: 'Schnelllinks zu deinen selbst gehosteten Diensten mit eigenen Icons.',
    clockName: 'Uhr & Datum',
    clockDesc: 'Zeigt die aktuelle Uhrzeit und das Datum mit Zeitzonenunterstützung.',
    iframeName: 'Iframe',
    iframeDesc:
      'Beliebige Webseite per URL einbetten (iframe) oder als Link öffnen — Dashboards, interne Tools, Karten. Wenn X-Frame-Options das Einbetten blockiert: Nur-Link-Modus oder Reverse-Proxy auf dieselbe Origin.',
  },
} as const

export type TranslationKey = keyof typeof translations['en']

export function t(locale: Locale, key: TranslationKey): string {
  return translations[locale][key] ?? translations['en'][key] ?? key
}
