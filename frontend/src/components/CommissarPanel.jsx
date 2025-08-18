import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { fetchLatestRecap, uploadRecap, saveCommissarRecap, listSavedRecaps, downloadRecap } from '../lib/supabase'
import { generateCommissarAnalysis } from '../lib/openai'

// Fallback data in case Supabase is unavailable
const fallbackData = {
  "week": 1,
  "league": {
    "name": "Internet Football League",
    "season": "2025"
  },
  "users": [
    {"display_name": "Alex", "team_name": "Alex's Aces", "handle": "@alex", "real_name": "Alex"},
    {"display_name": "Sam", "team_name": "Sam's Spartans", "handle": "@sam", "real_name": "Sam"}
  ],
  "rosters": [
    {
      "team_name": "Alex's Aces",
      "manager": "@alex",
      "real_name": "Alex",
      "wins": 1,
      "losses": 0,
      "fpts": 145.2,
      "playoff_position": "playoff"
    },
    {
      "team_name": "Sam's Spartans",
      "manager": "@sam",
      "real_name": "Sam",
      "wins": 0,
      "losses": 1,
      "fpts": 132.8,
      "playoff_position": "bubble"
    }
  ],
  "matchups": [
    {
      "manager_home": "@alex",
      "manager_away": "@sam",
      "real_name_home": "Alex",
      "real_name_away": "Sam",
      "team_name_home": "Alex's Aces",
      "team_name_away": "Sam's Spartans",
      "points_home": 145.2,
      "points_away": 132.8,
      "bench_points_home": 12.5,
      "bench_points_away": 8.2
    }
  ],
  "stats": {
    "top_score": {"manager": "@alex", "real_name": "Alex", "team_name": "Alex's Aces", "points": 145.2},
    "low_score": {"manager": "@sam", "real_name": "Sam", "team_name": "Sam's Spartans", "points": 132.8},
    "best_manager": {"manager": "@alex", "real_name": "Alex", "team_name": "Alex's Aces", "points": 145.2},
    "worst_manager": {"manager": "@sam", "real_name": "Sam", "team_name": "Sam's Spartans", "bench_points": 8.2},
    "closest_game": {
      "teams": ["Alex's Aces", "Sam's Spartans"],
      "managers": ["@alex", "@sam"],
      "real_names": ["Alex", "Sam"],
      "margin": 12.4
    },
    "largest_blowout": {
      "teams": ["Alex's Aces", "Sam's Spartans"],
      "managers": ["@alex", "@sam"],
      "real_names": ["Alex", "Sam"],
      "margin": 12.4
    },
    "power_rankings": [
      {"rank": 1, "manager": "@alex", "real_name": "Alex", "team_name": "Alex's Aces", "elo": 1550},
      {"rank": 2, "manager": "@sam", "real_name": "Sam", "team_name": "Sam's Spartans", "elo": 1450}
    ],
    "standings_analysis": {
      "total_teams": 2,
      "playoff_teams": 1,
      "bubble_teams": 1,
      "eliminated_teams": 0
    }
  }
}

export default function CommissarPanel() {
  const [isLoading, setIsLoading] = useState(false)
  const [analysis, setAnalysis] = useState('')
  const [error, setError] = useState('')
  const [savedRecaps, setSavedRecaps] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [currentWeek, setCurrentWeek] = useState(1)
  const [analysisContext, setAnalysisContext] = useState('weekly')

  // Load saved recaps on component mount
  useEffect(() => {
    loadSavedRecaps()
  }, [])

  // Helper function to get context label
  const getContextLabel = (context) => {
    switch (context) {
      case 'draft':
        return 'Post-Draft Analysis'
      case 'pre-season':
        return 'Pre-Season Preview'
      case 'weekly':
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
        console.log('✅ Successfully fetched from Supabase')
        console.log('📊 League data structure:', Object.keys(leagueData))
        console.log('👥 Number of users:', leagueData.users?.length || 0)
        console.log('🏈 Number of rosters:', leagueData.rosters?.length || 0)
        console.log('⚔️ Number of matchups:', leagueData.matchups?.length || 0)
        console.log('🔍 Sample users:', leagueData.users?.slice(0, 3).map(u => u.real_name))
        console.log('🔍 Sample rosters:', leagueData.rosters?.slice(0, 3).map(r => r.real_name))
        setCurrentWeek(leagueData.week || 1)
      } catch (fetchError) {
        console.log('⚠️ Supabase fetch failed, using fallback data:', fetchError.message)
        console.log('🔍 Fetch error details:', fetchError)
        leagueData = fallbackData
        console.log('🔄 Using fallback data with users:', leagueData.users?.length || 0)
      }
      
      // If this is a draft analysis, try to fetch draft data
      if (analysisContext === 'draft') {
        try {
          console.log('📋 Attempting to fetch draft data...')
          
          // Try to fetch from the saved draft data file
          const draftDataResponse = await fetch('/draft_data/latest_draft.json')
          if (draftDataResponse.ok) {
            const parsedDraftData = await draftDataResponse.json()
            console.log('✅ Draft data fetched successfully from file')
            console.log('📊 Draft picks:', parsedDraftData.draft_picks?.length || 0)
            console.log('👥 Managers with picks:', parsedDraftData.manager_analysis?.length || 0)
            
            // Merge draft data with league data
            leagueData = {
              ...leagueData,
              draft_picks: parsedDraftData.draft_picks,
              manager_analysis: parsedDraftData.manager_analysis,
              draft_summary: parsedDraftData.draft_summary
            }
          } else {
            console.log('⚠️ Draft data file not found, using enhanced fallback data')
            // Use enhanced fallback data with some sample draft picks
            leagueData = {
              ...leagueData,
              draft_picks: [
                {
                  round: 1,
                  pick_no: 1,
                  player_name: "Christian McCaffrey",
                  position: "RB",
                  team: "SF",
                  manager: "@alex",
                  real_name: "Alex",
                  team_name: "Alex's Aces"
                },
                {
                  round: 1,
                  pick_no: 2,
                  player_name: "Tyreek Hill",
                  position: "WR",
                  team: "MIA",
                  manager: "@sam",
                  real_name: "Sam",
                  team_name: "Sam's Spartans"
                },
                {
                  round: 2,
                  pick_no: 3,
                  player_name: "Breece Hall",
                  position: "RB",
                  team: "NYJ",
                  manager: "@alex",
                  real_name: "Alex",
                  team_name: "Alex's Aces"
                },
                {
                  round: 2,
                  pick_no: 4,
                  player_name: "CeeDee Lamb",
                  position: "WR",
                  team: "DAL",
                  manager: "@sam",
                  real_name: "Sam",
                  team_name: "Sam's Spartans"
                }
              ],
              manager_analysis: [
                {
                  manager: "@alex",
                  real_name: "Alex",
                  team_name: "Alex's Aces",
                  total_picks: 2,
                  position_breakdown: { "RB": 2 },
                  picks: [
                    { round: 1, player_name: "Christian McCaffrey", position: "RB", team: "SF" },
                    { round: 2, player_name: "Breece Hall", position: "RB", team: "NYJ" }
                  ]
                },
                {
                  manager: "@sam",
                  real_name: "Sam",
                  team_name: "Sam's Spartans",
                  total_picks: 2,
                  position_breakdown: { "WR": 2 },
                  picks: [
                    { round: 1, player_name: "Tyreek Hill", position: "WR", team: "MIA" },
                    { round: 2, player_name: "CeeDee Lamb", position: "WR", team: "DAL" }
                  ]
                }
              ]
            }
          }
          
        } catch (draftError) {
          console.log('⚠️ Draft data fetch failed:', draftError.message)
          console.log('🔄 Proceeding with weekly data for draft analysis')
        }
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
            <option value="draft">📋 Post-Draft Analysis</option>
            <option value="pre-season">🎪 Pre-Season Preview</option>
            <option value="weekly">🏛️ Weekly Recap</option>
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
          
          {/* Test Button */}
          <button
            onClick={async () => {
              setIsLoading(true)
              setError('')
              setAnalysis('')
              
              try {
                console.log('🧪 Testing with minimal data...')
                const testData = {
                  week: 1,
                  league: { name: "Test League" },
                  stats: {
                    top_score: { manager: "@alex", real_name: "Alex", team_name: "Alex's Aces", points: 150 },
                    low_score: { manager: "@sam", real_name: "Sam", team_name: "Sam's Spartans", points: 100 }
                  }
                }
                
                const testAnalysis = await generateCommissarAnalysis(testData, analysisContext)
                setAnalysis(testAnalysis)
                console.log('✅ Test analysis generated!')
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
            🧪 Test OpenAI
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