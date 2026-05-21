import * as plugin from 'C:/Users/svens/Desktop/SelfDashboard/plugins/unraid/index.tsx'
;(function (SD) {
  if (!SD || !SD.registerPlugin) throw new Error('SelfDashboard bridge missing')
  SD.registerPlugin(plugin.meta, plugin.component, { replace: true })
  if (typeof plugin.registerMailPluginSurfaces === 'function') plugin.registerMailPluginSurfaces()
})(typeof window !== 'undefined' ? window.SelfDashboard : globalThis.SelfDashboard)
