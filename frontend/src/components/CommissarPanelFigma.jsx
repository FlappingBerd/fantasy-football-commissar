import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { fetchLatestRecap, uploadRecap, saveCommissarRecap, listSavedRecaps, downloadRecap } from '../lib/supabase'
import { generateCommissarAnalysis } from '../lib/openai'
import { Button, Card, Input } from './ui'

/**
 * FIGMA-READY COMMISSAR PANEL
 * This is an example of how the CommissarPanel would look using the new UI components
 * It maintains all existing functionality while being ready for Figma design integration
 */

// Fallback data in case both local and Supabase are unavailable
const fallbackData = {
  week: 1,
  league: {
    name: "Internet Football League",
    season: "2025"
  },
  users: [],
  rosters: [],
  matchups: []
}

export default function CommissarPanelFigma() {
  const [isLoading, setIsLoading] = useState(false)
  const [analysis, setAnalysis] = useState('')
  const [error, setError] = useState('')
  const [savedRecaps, setSavedRecaps] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [currentWeek, setCurrentWeek] = useState(1)
  const [analysisContext, setAnalysisContext] = useState('weekly_recap')

  // Load saved recaps on component mount
  useEffect(() => {
    loadSavedRecaps()
  }, [])

  // Helper function to get context label
  const getContextLabel = (context) => {
    switch (context) {
      case 'weekly_projections':
        return 'Weekly Matchup Projections'
      case 'weekly_recap':
        return 'Weekly Recap'
      case 'season_kickoff':
        return 'Season Kickoff'
      default:
        return 'Analysis'
    }
  }

  const handleGenerateAnalysis = async () => {
    setIsLoading(true)
    setError('')
    setAnalysis('')

    try {
      // Try to fetch latest data from Supabase
      let leagueData
      
      try {
        leagueData = await fetchLatestRecap(analysisContext)
        setCurrentWeek(leagueData.week || 1)
      } catch (fetchError) {
        leagueData = fallbackData
      }
      
      // Generate commissar analysis
      const commissarAnalysis = await generateCommissarAnalysis(leagueData, analysisContext)
      
      if (!commissarAnalysis || commissarAnalysis.trim() === '') {
        throw new Error('OpenAI returned an empty response')
      }
      
      setAnalysis(commissarAnalysis)
      
    } catch (error) {
      setError(`ERROR: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveAnalysis = async () => {
    if (!analysis) return
    
    setIsSaving(true)
    try {
      const result = await saveCommissarRecap(analysis, currentWeek)
      
      // Refresh the list of saved recaps
      await loadSavedRecaps()
      
      alert(`Analysis saved as: ${result.filename}`)
    } catch (err) {
      setError(`Failed to save analysis: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const loadSavedRecaps = async () => {
    try {
      const recaps = await listSavedRecaps()
      setSavedRecaps(recaps)
    } catch (err) {
      // Silently handle error - recaps are optional
    }
  }

  const handleCopyAnalysis = async () => {
    if (!analysis) return
    
    try {
      await navigator.clipboard.writeText(analysis)
      // Show a temporary success message
      const originalText = document.title
      document.title = '✅ Copied to clipboard!'
      setTimeout(() => {
        document.title = originalText
      }, 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = analysis
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  }

  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-fg font-mono">
      {/* Header */}
      <header className="border-b border-terminal-border bg-terminal-bg/50 backdrop-blur-sm">
        <div className="figma-container py-4">
          <h1 className="figma-heading-1 text-terminal-accent">
            🏛️ Commissar of Competitive Balance
          </h1>
          <p className="figma-caption mt-1">
            Official Fantasy Football League Analysis Terminal
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="figma-container py-8">
        {/* Analysis Type Selector */}
        <Card variant="outlined" padding="md" className="mb-6">
          <Input.Select
            label="Analysis Type"
            value={analysisContext}
            onChange={(e) => setAnalysisContext(e.target.value)}
            size="md"
          >
            <option value="weekly_projections">⚔️ Weekly Matchup Projections</option>
            <option value="weekly_recap">🏛️ Weekly Recap</option>
            <option value="season_kickoff">🚀 Season Kickoff</option>
          </Input.Select>
        </Card>

        {/* Action Buttons */}
        <div className="figma-flex figma-flex-start mb-8">
          <Button
            variant="primary"
            size="lg"
            onClick={handleGenerateAnalysis}
            loading={isLoading}
            className="figma-hover"
          >
            {isLoading ? `Generating ${getContextLabel(analysisContext)}...` : `🚨 Generate ${getContextLabel(analysisContext)}`}
          </Button>
          
          <Button
            variant="success"
            size="lg"
            onClick={async () => {
              try {
                await fetchLatestRecap()
                setError('✅ Data refreshed successfully!')
              } catch (err) {
                setError(`Refresh failed: ${err.message}`)
              }
            }}
            disabled={isLoading}
            className="figma-hover"
          >
            🔄 Force Refresh Data
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Card variant="filled" padding="md" className="mb-6">
            <p className="text-red-400 font-mono text-sm">
              <span className="text-red-500">ERROR:</span> {error}
            </p>
          </Card>
        )}

        {/* Analysis Output */}
        {analysis && (
          <Card variant="elevated" padding="none" className="mb-6 figma-fade-in">
            <Card.Header>
              <div className="figma-flex figma-flex-between">
                <h2 className="figma-heading-2">
                  📋 COMMISSAR'S {analysisContext.toUpperCase()} REPORT
                </h2>
                <div className="figma-flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCopyAnalysis}
                    className="figma-hover"
                  >
                    📋 Copy to Clipboard
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={handleSaveAnalysis}
                    loading={isSaving}
                    className="figma-hover"
                  >
                    {isSaving ? '💾 Saving...' : '💾 Save to Supabase'}
                  </Button>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="font-mono text-terminal-fg whitespace-pre-wrap">
                {analysis}
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Saved Recaps Section */}
        {savedRecaps.length > 0 && (
          <Card variant="default" padding="none" className="figma-fade-in">
            <Card.Header>
              <h2 className="figma-heading-2">
                📁 SAVED RECAPS ({savedRecaps.length})
              </h2>
            </Card.Header>
            <Card.Body>
              <div className="figma-grid gap-2">
                {savedRecaps.map((recap, index) => (
                  <div key={index} className="figma-flex figma-flex-between p-2 bg-terminal-border/20 rounded figma-hover">
                    <span className="figma-body text-sm">{recap.name}</span>
                    <span className="figma-caption">
                      {new Date(recap.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Instructions */}
        {!analysis && !isLoading && (
          <Card variant="outlined" padding="xl" className="figma-text-center">
            <p className="figma-body">
              Select an analysis type and click the button above to generate your fantasy football analysis
            </p>
            <p className="figma-caption mt-2">
              The Commissar will analyze your league data and deliver a satirical report
            </p>
            <p className="figma-caption mt-1">
              Generated analyses can be saved to Supabase for future reference
            </p>
          </Card>
        )}
      </main>
    </div>
  )
}
