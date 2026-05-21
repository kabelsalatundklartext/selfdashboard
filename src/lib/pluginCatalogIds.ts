import {
  hasVolumeFile,
  listInstalledVolumePluginIds,
} from '@/lib/pluginVolumeInfo'

export function getWidgetLoadedIdsForCatalog(): Set<string> {
  return new Set(
    listInstalledVolumePluginIds().filter((id) => hasVolumeFile(id, 'widget.js')),
  )
}
