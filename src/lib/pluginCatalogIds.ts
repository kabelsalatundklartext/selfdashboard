import { BUILTIN_PLUGIN_IDS } from '@/lib/builtinPluginIds'
import { isVolumeOnlyPlugins } from '@/lib/pluginMode'
import {
  getCustomWidgetOverrideIds,
  hasVolumeFile,
  listInstalledVolumePluginIds,
} from '@/lib/pluginVolumeInfo'

export function getWidgetLoadedIdsForCatalog(): Set<string> {
  if (isVolumeOnlyPlugins()) {
    return new Set(
      listInstalledVolumePluginIds().filter((id) => hasVolumeFile(id, 'widget.js')),
    )
  }
  return new Set([
    ...BUILTIN_PLUGIN_IDS.filter((id) => !getCustomWidgetOverrideIds().includes(id)),
    ...getCustomWidgetOverrideIds(),
  ])
}
