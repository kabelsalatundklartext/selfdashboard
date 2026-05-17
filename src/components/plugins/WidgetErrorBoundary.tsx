'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { reportPluginCatch } from '@/lib/pluginLog'

type Props = {
  pluginId: string
  instanceId: string
  children: ReactNode
}

type State = { error: Error | null }

export class WidgetErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportPluginCatch(this.props.pluginId, error, 'render')
    if (info.componentStack?.trim()) {
      reportPluginCatch(
        this.props.pluginId,
        new Error(info.componentStack.trim().slice(0, 500)),
        'react-stack',
      )
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '12px',
            lineHeight: 1.4,
          }}
        >
          <div>
            <p style={{ margin: '0 0 6px', color: '#f87171', fontWeight: 600 }}>Plugin-Fehler</p>
            <p style={{ margin: 0, wordBreak: 'break-word' }}>{this.state.error.message}</p>
            <p style={{ margin: '8px 0 0', fontSize: '10px', opacity: 0.85 }}>
              Details in Einstellungen → Protokoll
            </p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
