import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-terminal-bg text-terminal-fg font-mono flex items-center justify-center">
          <div className="text-center p-8 border border-red-500/30 rounded-md bg-red-900/20">
            <h2 className="text-xl font-semibold text-red-400 mb-4">
              🚨 System Error
            </h2>
            <p className="text-terminal-fg/80 mb-4">
              The Commissar's analysis terminal has encountered an error.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-terminal-accent/20 border border-terminal-accent text-terminal-accent rounded-md hover:bg-terminal-accent/30 transition-all duration-200"
            >
              🔄 Reload Terminal
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
