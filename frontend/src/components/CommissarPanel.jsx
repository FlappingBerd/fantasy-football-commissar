import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { fetchLatestRecap, uploadRecap, saveCommissarRecap, listSavedRecaps, downloadRecap } from '../lib/supabase'
import { generateCommissarAnalysis } from '../lib/openai'

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

export default function CommissarPanel() {
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
      console.log('📡 Fetching latest league data...')
      let leagueData
      
      try {
        leagueData = await fetchLatestRecap()
        console.log('✅ Successfully fetched league data')
        console.log('📊 League data structure:', Object.keys(leagueData))
        console.log('👥 Number of users:', leagueData.users?.length || 0)
        console.log('🏈 Number of rosters:', leagueData.rosters?.length || 0)
        console.log('⚔️ Number of matchups:', leagueData.matchups?.length || 0)
        console.log('🔍 Sample users:', leagueData.users?.slice(0, 3).map(u => u.real_name))
        console.log('🔍 Sample rosters:', leagueData.rosters?.slice(0, 3).map(r => r.real_name))
        
        // Check if we have enhanced matchup data
        if (leagueData.matchups && leagueData.matchups.length > 0) {
          const hasEnhancedData = leagueData.matchups.some(m => m.is_key_matchup !== undefined)
          console.log('🔍 Enhanced matchup data:', hasEnhancedData ? 'YES' : 'NO')
          if (hasEnhancedData) {
            console.log('🎯 Key matchups found:', leagueData.matchups.filter(m => m.is_key_matchup).length)
          }
        }
        
        setCurrentWeek(leagueData.week || 1)
      } catch (fetchError) {
        console.log('⚠️ Data fetch failed, using minimal fallback:', fetchError.message)
        console.log('🔍 Fetch error details:', fetchError)
        leagueData = fallbackData
        console.log('🔄 Using minimal fallback data')
      }
      
      
      // Generate commissar analysis
      console.log(`🎭 Generating ${analysisContext} analysis...`)
      console.log('📤 Data source:', leagueData === fallbackData ? 'FALLBACK' : 'SUPABASE')
      console.log('📤 Sending data to OpenAI:', JSON.stringify(leagueData, null, 2).substring(0, 500) + '...')
      
      const commissarAnalysis = await generateCommissarAnalysis(leagueData, analysisContext)
      
      console.log('📝 Received analysis from OpenAI:', commissarAnalysis.substring(0, 200) + '...')
      
      if (!commissarAnalysis || commissarAnalysis.trim() === '') {
        throw new Error('OpenAI returned an empty response')
      }
      
      setAnalysis(commissarAnalysis)
      console.log('✅ Analysis generated successfully')
      
    } catch (error) {
      console.error('❌ Error generating analysis:', error)
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
      console.log('✅ Analysis saved:', result.filename)
      
      // Refresh the list of saved recaps
      await loadSavedRecaps()
      
      alert(`Analysis saved as: ${result.filename}`)
    } catch (err) {
      console.error('❌ Error saving analysis:', err)
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
      console.error('❌ Error loading saved recaps:', err)
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
      console.error('❌ Error copying to clipboard:', err)
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
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-semibold text-terminal-accent">
            🏛️ Commissar of Competitive Balance
          </h1>
          <p className="text-sm text-terminal-fg/70 mt-1">
            Official Fantasy Football League Analysis Terminal
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Analysis Type Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-terminal-fg/80 mb-2">
            Analysis Type:
          </label>
          <select
            value={analysisContext}
            onChange={(e) => setAnalysisContext(e.target.value)}
            className="bg-terminal-bg border border-terminal-border text-terminal-fg px-3 py-2 rounded-md font-mono text-sm focus:outline-none focus:border-terminal-accent"
          >
            <option value="weekly_projections">⚔️ Weekly Matchup Projections</option>
            <option value="weekly_recap">🏛️ Weekly Recap</option>
          </select>
        </div>

        {/* Generate Button */}
        <div className="mb-8">
          <button
            onClick={handleGenerateAnalysis}
            disabled={isLoading}
            className={`
              px-6 py-3 font-mono text-sm font-medium rounded-md border
              transition-all duration-200
              ${isLoading 
                ? 'bg-terminal-border text-terminal-fg/50 cursor-not-allowed' 
                : 'bg-terminal-accent/10 border-terminal-accent text-terminal-accent hover:bg-terminal-accent/20 hover:border-terminal-accent/80'
              }
            `}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-terminal-accent/30 border-t-terminal-accent rounded-full animate-spin"></div>
                Generating {getContextLabel(analysisContext)}...
              </span>
            ) : (
              `🚨 Generate ${getContextLabel(analysisContext)}`
            )}
          </button>
          
          {/* Force Refresh Button */}
          <button
            onClick={async () => {
              try {
                console.log('🔄 Force refreshing data...')
                const freshData = await fetchLatestRecap()
                console.log('✅ Fresh data loaded:')
                console.log('📊 Week:', freshData.week)
                console.log('👥 Users:', freshData.users?.length || 0)
                console.log('🏈 Rosters:', freshData.rosters?.length || 0)
                console.log('⚔️ Matchups:', freshData.matchups?.length || 0)
                
                // Show sample of what we actually have
                if (freshData.users && freshData.users.length > 0) {
                  console.log('🔍 Sample users:', freshData.users.slice(0, 3).map(u => `${u.real_name}: ${u.team_name}`))
                }
                if (freshData.rosters && freshData.rosters.length > 0) {
                  console.log('🔍 Sample rosters:', freshData.rosters.slice(0, 3).map(r => `${r.real_name}: ${r.team_name}`))
                }
                if (freshData.matchups && freshData.matchups.length > 0) {
                  console.log('🔍 Sample matchups:', freshData.matchups.slice(0, 3).map(m => `${m.team_name_home} vs ${m.team_name_away}`))
                }
                
                setError('✅ Data refreshed! Check console for details.')
              } catch (err) {
                console.error('❌ Refresh failed:', err)
                setError(`Refresh failed: ${err.message}`)
              }
            }}
            disabled={isLoading}
            className={`
              ml-4 px-4 py-3 font-mono text-sm font-medium rounded-md border
              transition-all duration-200
              ${isLoading 
                ? 'bg-terminal-border text-terminal-fg/50 cursor-not-allowed' 
                : 'bg-green-600/20 border-green-500 text-green-400 hover:bg-green-600/30'
              }
            `}
          >
            🔄 Force Refresh Data
          </button>
          
          {/* Test Button */}
          <button
            onClick={async () => {
              setIsLoading(true)
              setError('')
              setAnalysis('')
              
              try {
                console.log('🧪 Testing with current league data...')
                const testData = await fetchLatestRecap()
                
                if (testData.users && testData.users.length > 0) {
                  console.log('✅ Using real league data for test')
                  const testAnalysis = await generateCommissarAnalysis(testData, analysisContext)
                  setAnalysis(testAnalysis)
                  console.log('✅ Test analysis generated with real data!')
                } else {
                  throw new Error('No real league data available for testing')
                }
              } catch (err) {
                console.error('❌ Test failed:', err)
                setError(`Test failed: ${err.message}`)
              } finally {
                setIsLoading(false)
              }
            }}
            disabled={isLoading}
            className={`
              ml-4 px-4 py-3 font-mono text-sm font-medium rounded-md border
              transition-all duration-200
              ${isLoading 
                ? 'bg-terminal-border text-terminal-fg/50 cursor-not-allowed' 
                : 'bg-yellow-600/20 border-yellow-500 text-yellow-400 hover:bg-yellow-600/30'
              }
            `}
          >
            🧪 Test with Real Data
          </button>

          {/* Supabase Test Button */}
          <button
            onClick={async () => {
              try {
                console.log('🔍 Testing Supabase connection...')
                const testData = await fetchLatestRecap()
                console.log('✅ Supabase test successful!')
                console.log('📊 Data keys:', Object.keys(testData))
                console.log('👥 Users:', testData.users?.length || 0)
                console.log('🏈 Rosters:', testData.rosters?.length || 0)
                setError('✅ Supabase connection successful! Check console for details.')
              } catch (err) {
                console.error('❌ Supabase test failed:', err)
                setError(`Supabase test failed: ${err.message}`)
              }
            }}
            disabled={isLoading}
            className={`
              ml-4 px-4 py-3 font-mono text-sm font-medium rounded-md border
              transition-all duration-200
              ${isLoading 
                ? 'bg-terminal-border text-terminal-fg/50 cursor-not-allowed' 
                : 'bg-blue-600/20 border-blue-500 text-blue-400 hover:bg-blue-600/30'
              }
            `}
          >
            🔍 Test Supabase
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-md">
            <p className="text-red-400 font-mono text-sm">
              <span className="text-red-500">ERROR:</span> {error}
            </p>
          </div>
        )}

        {/* Analysis Output */}
        {analysis && (
          <div className="bg-terminal-bg border border-terminal-border rounded-md overflow-hidden mb-6">
            <div className="px-4 py-3 bg-terminal-border/30 border-b border-terminal-border flex justify-between items-center">
              <h2 className="text-sm font-medium text-terminal-fg/80">
                📋 COMMISSAR'S {analysisContext.toUpperCase()} REPORT
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyAnalysis}
                  className="px-3 py-1 text-xs font-mono rounded border bg-blue-600/20 border-blue-500 text-blue-400 hover:bg-blue-600/30 transition-all duration-200"
                >
                  📋 Copy to Clipboard
                </button>
                <button
                  onClick={handleSaveAnalysis}
                  disabled={isSaving}
                  className={`
                    px-3 py-1 text-xs font-mono rounded border
                    transition-all duration-200
                    ${isSaving
                      ? 'bg-terminal-border text-terminal-fg/50 cursor-not-allowed'
                      : 'bg-green-600/20 border-green-500 text-green-400 hover:bg-green-600/30'
                    }
                  `}
                >
                  {isSaving ? '💾 Saving...' : '💾 Save to Supabase'}
                </button>
              </div>
            </div>
            <div className="p-6 prose prose-invert prose-sm max-w-none">
              {(() => {
                try {
                  // Simple text rendering first to test
                  if (!analysis || analysis.trim() === '') {
                    return <div className="text-red-400">No analysis content received</div>
                  }
                  
                  // Try ReactMarkdown with error boundary
                  return (
                    <div className="font-mono text-terminal-fg whitespace-pre-wrap">
                      {analysis}
                    </div>
                  )
                } catch (renderError) {
                  console.error('❌ Error rendering analysis:', renderError)
                  return (
                    <div className="text-red-400 font-mono text-sm">
                      <p>Error rendering analysis. Raw content:</p>
                      <pre className="mt-2 p-2 bg-terminal-border/20 rounded text-xs overflow-auto max-h-96">
                        {analysis}
                      </pre>
                    </div>
                  )
                }
              })()}
            </div>
          </div>
        )}

        {/* Saved Recaps Section */}
        {savedRecaps.length > 0 && (
          <div className="bg-terminal-bg border border-terminal-border rounded-md overflow-hidden">
            <div className="px-4 py-3 bg-terminal-border/30 border-b border-terminal-border">
              <h2 className="text-sm font-medium text-terminal-fg/80">
                📁 SAVED RECAPS ({savedRecaps.length})
              </h2>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                {savedRecaps.map((recap, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-terminal-border/20 rounded">
                    <span className="text-sm text-terminal-fg/80">{recap.name}</span>
                    <span className="text-xs text-terminal-fg/60">
                      {new Date(recap.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!analysis && !isLoading && (
          <div className="text-center py-12 text-terminal-fg/60">
            <p className="font-mono text-sm">
              Select an analysis type and click the button above to generate your fantasy football analysis
            </p>
            <p className="font-mono text-xs mt-2">
              The Commissar will analyze your league data and deliver a satirical report
            </p>
            <p className="font-mono text-xs mt-1">
              Generated analyses can be saved to Supabase for future reference
            </p>
          </div>
        )}
      </main>
    </div>
  )
} 