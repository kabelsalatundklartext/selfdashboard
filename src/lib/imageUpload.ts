/**
 * Erlaubt nur Raster-Bildformate für hochgeladene Logos/Icons/Hintergründe.
 * Lehnt insbesondere SVG ab: SVG kann <script>/CSS enthalten und landet sonst
 * als data:-URL in einer CSS `url()` bzw. einem <img>/Logo → XSS-Fläche.
 */
const RASTER_MIME = /^image\/(jpeg|png|webp|gif|avif)$/i
const RASTER_EXT = /\.(jpe?g|png|webp|gif|avif)$/i

export function isSafeRasterImage(file: File): boolean {
  // SVG explizit verbieten (auch wenn als image/* deklariert).
  if (/svg/i.test(file.type) || /\.svg$/i.test(file.name)) return false
  if (file.type) return RASTER_MIME.test(file.type)
  // Manche Browser liefern keinen MIME-Typ → auf Endung zurückfallen.
  return RASTER_EXT.test(file.name)
}

export function rasterImageRejectMessage(locale: string): string {
  return locale === 'de'
    ? 'Nur JPG, PNG, WebP oder GIF (kein SVG).'
    : 'Only JPG, PNG, WebP or GIF (no SVG).'
}
