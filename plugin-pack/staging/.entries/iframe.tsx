import * as plugin from '../../../plugins/iframe/index.tsx'
;(function (SD) {
  if (!SD || !SD.registerPlugin) throw new Error('SelfDashboard bridge missing')
  SD.registerPlugin(plugin.meta, plugin.component, { replace: true })
})(typeof window !== 'undefined' ? window.SelfDashboard : globalThis.SelfDashboard)
