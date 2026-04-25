'use client'

import { Component, type ReactNode, type ErrorInfo } from 'react'
import { captureException } from '@/lib/sentry'

type FallbackFn = (error: Error, reset: () => void) => ReactNode

interface Props {
  fallback: ReactNode | FallbackFn
  onError?: (error: Error, info: ErrorInfo) => void
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    captureException(error, { componentStack: info.componentStack })
    this.props.onError?.(error, info)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const { fallback } = this.props
      return typeof fallback === 'function' ? fallback(this.state.error, this.reset) : fallback
    }
    return this.props.children
  }
}
