'use client'

import type { Locale } from '@/lib/i18n'
import { useDashboardStore } from '@/lib/store'

/** `de` is true for the default dashboard locale (`de`) and any future non-`en` locale. */
export function usePluginLocale(): { locale: Locale; de: boolean } {
  const locale = useDashboardStore((s) => s.locale) as Locale
  return { locale, de: locale !== 'en' }
}
