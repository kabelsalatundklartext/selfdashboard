import type { Theme } from '@/types'

export const themes: Theme[] = [
  {
    id: 'dark',
    name: 'Dark',
    colors: {
      background: '#0d0f14',
      surface: '#161920',
      'surface-2': '#1e2229',
      border: '#2a2f3a',
      text: '#e8eaf0',
      'text-muted': '#6b7280',
      accent: '#6366f1',
    },
  },
  {
    id: 'light',
    name: 'Light',
    colors: {
      background: '#f4f5f7',
      surface: '#ffffff',
      'surface-2': '#f0f1f3',
      border: '#e2e4e9',
      text: '#111318',
      'text-muted': '#6b7280',
      accent: '#6366f1',
    },
  },
  {
    id: 'nord',
    name: 'Nord',
    colors: {
      background: '#242933',
      surface: '#2e3440',
      'surface-2': '#3b4252',
      border: '#434c5e',
      text: '#eceff4',
      'text-muted': '#7b88a1',
      accent: '#88c0d0',
    },
  },
  {
    id: 'catppuccin',
    name: 'Catppuccin',
    colors: {
      background: '#1e1e2e',
      surface: '#24273a',
      'surface-2': '#2a2d3e',
      border: '#363a4f',
      text: '#cad3f5',
      'text-muted': '#6e738d',
      accent: '#c6a0f6',
    },
  },
  {
    id: 'dracula',
    name: 'Dracula',
    colors: {
      background: '#191a21',
      surface: '#282a36',
      'surface-2': '#2f3240',
      border: '#44475a',
      text: '#f8f8f2',
      'text-muted': '#6272a4',
      accent: '#bd93f9',
    },
  },
  {
    id: 'solarized',
    name: 'Solarized',
    colors: {
      background: '#001e26',
      surface: '#002b36',
      'surface-2': '#073642',
      border: '#094553',
      text: '#fdf6e3',
      'text-muted': '#657b83',
      accent: '#2aa198',
    },
  },
]

export const getTheme = (id: string) => themes.find((t) => t.id === id) ?? themes[0]
