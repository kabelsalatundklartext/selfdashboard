export type ThreatTheme = 'cyan' | 'alarm' | 'matrix' | 'amber'

export const THEME_LABELS: Record<ThreatTheme, string> = {
  cyan: 'CYAN',
  alarm: 'ALARM',
  matrix: 'MATRIX',
  amber: 'AMBER',
}

export const THEME_VARS: Record<ThreatTheme, Record<string, string>> = {
  cyan: {
    '--cs-bg': '#020810',
    '--cs-accent': '#00ffe0',
    '--cs-danger': '#ff2244',
    '--cs-warn': '#ff8800',
    '--cs-ok': '#00ff88',
    '--cs-dim': 'rgba(0,255,200,0.15)',
    '--cs-text': '#a0ffd8',
    '--cs-server': '#00aaff',
  },
  alarm: {
    '--cs-bg': '#100208',
    '--cs-accent': '#ff4466',
    '--cs-danger': '#ff0022',
    '--cs-warn': '#ffaa00',
    '--cs-ok': '#ff8866',
    '--cs-dim': 'rgba(255,60,80,0.18)',
    '--cs-text': '#ffd0d8',
    '--cs-server': '#ff6688',
  },
  matrix: {
    '--cs-bg': '#020a04',
    '--cs-accent': '#00ff44',
    '--cs-danger': '#ff2244',
    '--cs-warn': '#aaff00',
    '--cs-ok': '#00ff88',
    '--cs-dim': 'rgba(0,255,80,0.15)',
    '--cs-text': '#a8ffb8',
    '--cs-server': '#44ff88',
  },
  amber: {
    '--cs-bg': '#0a0802',
    '--cs-accent': '#ffaa00',
    '--cs-danger': '#ff2244',
    '--cs-warn': '#ffcc44',
    '--cs-ok': '#88ff44',
    '--cs-dim': 'rgba(255,180,0,0.15)',
    '--cs-text': '#ffe8b0',
    '--cs-server': '#ff9900',
  },
}

export const FLAG: Record<string, string> = {
  AF: '🇦🇫', AL: '🇦🇱', DZ: '🇩🇿', AR: '🇦🇷', AU: '🇦🇺', AT: '🇦🇹', AZ: '🇦🇿',
  BD: '🇧🇩', BE: '🇧🇪', BR: '🇧🇷', BG: '🇧🇬', CA: '🇨🇦', CH: '🇨🇭', CN: '🇨🇳',
  CZ: '🇨🇿', DE: '🇩🇪', DK: '🇩🇰', EE: '🇪🇪', ES: '🇪🇸', FI: '🇫🇮', FR: '🇫🇷',
  GB: '🇬🇧', GR: '🇬🇷', HK: '🇭🇰', HU: '🇭🇺', ID: '🇮🇩', IE: '🇮🇪', IL: '🇮🇱',
  IN: '🇮🇳', IR: '🇮🇷', IT: '🇮🇹', JP: '🇯🇵', KR: '🇰🇷', KZ: '🇰🇿', LT: '🇱🇹',
  LV: '🇱🇻', MX: '🇲🇽', MY: '🇲🇾', NL: '🇳🇱', NO: '🇳🇴', NZ: '🇳🇿', PL: '🇵🇱',
  PT: '🇵🇹', RO: '🇷🇴', RU: '🇷🇺', SA: '🇸🇦', SE: '🇸🇪', SG: '🇸🇬', SK: '🇸🇰',
  TH: '🇹🇭', TR: '🇹🇷', TW: '🇹🇼', UA: '🇺🇦', US: '🇺🇸', VN: '🇻🇳', ZA: '🇿🇦',
}

export const COUNTRY_NAME: Record<string, string> = {
  DE: 'Germany', US: 'USA', GB: 'UK', FR: 'France', NL: 'Netherlands',
  RU: 'Russia', CN: 'China', IN: 'India', BR: 'Brazil', JP: 'Japan',
  AU: 'Australia', CA: 'Canada', IT: 'Italy', ES: 'Spain', PL: 'Poland',
  UA: 'Ukraine', TR: 'Turkey', KR: 'Korea', AT: 'Austria', CH: 'Switzerland',
}
