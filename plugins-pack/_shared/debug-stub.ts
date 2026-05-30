/** No-op replacement for the `debug` package (avoids require("tty") in ESM server bundles). */
function debug(_namespace: string): (...args: unknown[]) => void {
  return () => {}
}

debug.enable = () => {}
debug.disable = () => {}
debug.enabled = () => false
debug.formatters = {}

export default debug
