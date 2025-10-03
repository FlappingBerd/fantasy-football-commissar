import CommissarPanel from './components/CommissarPanel'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <CommissarPanel />
    </ErrorBoundary>
  )
}

export default App
