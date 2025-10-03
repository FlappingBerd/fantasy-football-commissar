import { createClient } from '@supabase/supabase-js'

// Use environment variables for security
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Fetch fresh data from Sleeper API
export async function fetchSleeperData(leagueId, week = null) {
  try {
    const SLEEPER_API = "https://api.sleeper.app/v1"
    
    // If no week specified, get current week
    if (!week) {
      const stateResponse = await fetch(`${SLEEPER_API}/state/nfl`)
      const state = await stateResponse.json()
      week = state.week
    }
    
    // Fetch league data
    const [leagueResponse, usersResponse, rostersResponse, matchupsResponse] = await Promise.all([
      fetch(`${SLEEPER_API}/league/${leagueId}`),
      fetch(`${SLEEPER_API}/league/${leagueId}/users`),
      fetch(`${SLEEPER_API}/league/${leagueId}/rosters`),
      fetch(`${SLEEPER_API}/league/${leagueId}/matchups/${week}`)
    ])
    
    const [league, users, rosters, matchups] = await Promise.all([
      leagueResponse.json(),
      usersResponse.json(),
      rostersResponse.json(),
      matchupsResponse.json()
    ])
    
    // Process the data similar to the fetch_sleeper_week.js script
    const processedData = {
      week: week.toString(),
      week_type: "completed",
      league: {
        id: league.league_id,
        name: league.name,
        season: league.season,
        scoring_settings: league.scoring_settings
      },
      users: users.map(user => ({
        user_id: user.user_id,
        display_name: user.display_name,
        username: user.username,
        metadata: user.metadata
      })),
      rosters: rosters.map(roster => {
        const user = users.find(u => u.user_id === roster.owner_id)
        const teamName = user?.metadata?.team_name || user?.display_name || user?.username || "Unknown Team"
        const realName = user?.display_name || user?.username || "Unknown Manager"
        
        // Use roster data if available, otherwise use defaults
        const wins = roster.settings.wins || 0
        const losses = roster.settings.losses || 0
        const fpts = roster.settings.fpts || 0
        
        return {
          roster_id: roster.roster_id,
          owner_id: roster.owner_id,
          wins: wins,
          losses: losses,
          fpts: fpts,
          fpts_decimal: roster.settings.fpts_decimal || 0,
          team_name: teamName,
          real_name: realName,
          manager: realName,
          playoff_position: wins >= 3 ? "playoff" : wins <= 1 ? "bubble" : "playoff"
        }
      }),
      matchups: (() => {
        // Group matchups by matchup_id to create home/away pairs
        const matchupGroups = {}
        matchups.forEach(matchup => {
          if (!matchupGroups[matchup.matchup_id]) {
            matchupGroups[matchup.matchup_id] = []
          }
          matchupGroups[matchup.matchup_id].push(matchup)
        })
        
        // Convert grouped matchups to home/away format
        return Object.values(matchupGroups).map(matchupPair => {
          if (matchupPair.length !== 2) {
            console.warn('Unexpected matchup pair length:', matchupPair.length)
            return null
          }
          
          const [home, away] = matchupPair
          const homeRoster = rosters.find(r => r.roster_id === home.roster_id)
          const awayRoster = rosters.find(r => r.roster_id === away.roster_id)
          const homeUser = users.find(u => u.user_id === homeRoster?.owner_id)
          const awayUser = users.find(u => u.user_id === awayRoster?.owner_id)
          
          const homeTeamName = homeUser?.metadata?.team_name || homeUser?.display_name || homeUser?.username || "Unknown Team"
          const awayTeamName = awayUser?.metadata?.team_name || awayUser?.display_name || awayUser?.username || "Unknown Team"
          const homeRealName = homeUser?.display_name || homeUser?.username || "Unknown Manager"
          const awayRealName = awayUser?.display_name || awayUser?.username || "Unknown Manager"
          
          return {
            matchup_id: home.matchup_id,
            roster_id_home: home.roster_id,
            roster_id_away: away.roster_id,
            team_name_home: homeTeamName,
            team_name_away: awayTeamName,
            real_name_home: homeRealName,
            real_name_away: awayRealName,
            points_home: home.points,
            points_away: away.points,
            proj_home: home.custom_points || 0,
            proj_away: away.custom_points || 0,
            margin: Math.abs(home.points - away.points),
            is_key_matchup: Math.abs(home.points - away.points) < 10 || Math.abs(home.points - away.points) > 30,
            matchup_type: Math.abs(home.points - away.points) > 30 ? "blowout" : 
                         Math.abs(home.points - away.points) < 10 ? "close" : "standard",
            winner: home.points > away.points ? "home" : "away",
            winner_name: home.points > away.points ? homeTeamName : awayTeamName,
            loser_name: home.points > away.points ? awayTeamName : homeTeamName
          }
        }).filter(Boolean)
      })()
    }
    
    // Add basic stats processing
    const sortedRosters = processedData.rosters.sort((a, b) => b.fpts - a.fpts)
    const sortedByWins = processedData.rosters.sort((a, b) => (b.wins - b.losses) - (a.wins - a.losses))
    
    processedData.stats = {
      top_score: sortedRosters[0] || { manager: 'Unknown', real_name: 'Unknown', team_name: 'Unknown Team', points: 0 },
      low_score: sortedRosters[sortedRosters.length - 1] || { manager: 'Unknown', real_name: 'Unknown', team_name: 'Unknown Team', points: 0 },
      best_manager: sortedByWins[0] || { manager: 'Unknown', real_name: 'Unknown', team_name: 'Unknown Team', points: 0 },
      worst_manager: sortedByWins[sortedByWins.length - 1] || { manager: 'Unknown', real_name: 'Unknown', team_name: 'Unknown Team', points: 0 },
      closest_game: processedData.matchups.reduce((closest, matchup) => {
        if (!closest || matchup.margin < closest.margin) {
          return {
            teams: [matchup.team_name_home, matchup.team_name_away],
            managers: [matchup.real_name_home, matchup.real_name_away],
            margin: matchup.margin
          }
        }
        return closest
      }, null) || { teams: ['Unknown', 'Unknown'], managers: ['Unknown', 'Unknown'], margin: 0 },
      largest_blowout: processedData.matchups.reduce((largest, matchup) => {
        if (!largest || matchup.margin > largest.margin) {
          return {
            teams: [matchup.team_name_home, matchup.team_name_away],
            managers: [matchup.real_name_home, matchup.real_name_away],
            margin: matchup.margin
          }
        }
        return largest
      }, null) || { teams: ['Unknown', 'Unknown'], managers: ['Unknown', 'Unknown'], margin: 0 },
      power_rankings: sortedByWins.slice(0, 10),
      standings_analysis: {
        total_teams: processedData.rosters.length,
        playoff_teams: processedData.rosters.filter(r => r.wins >= 3).length,
        bubble_teams: processedData.rosters.filter(r => r.wins >= 2 && r.wins <= 3).length,
        eliminated_teams: processedData.rosters.filter(r => r.wins <= 1).length
      }
    }
    
    return processedData
    
  } catch (error) {
    console.error('Error fetching Sleeper data:', error)
    throw error
  }
}

export async function fetchLatestRecap(context = 'weekly') {
  try {
    // First try to fetch from local weekly_summaries directory
    try {
      const timestamp = Date.now()
      
      // For weekly recaps, we want to analyze the PREVIOUS week's completed games
      // For other contexts, use the latest available data
      if (context === 'weekly_recap') {
        // Try to get previous week's data for weekly recaps
        // First, get the current week from latest data to determine previous week
        let currentWeekData
        try {
          const currentResponse = await fetch(`/latest.json?t=${timestamp}`)
          if (currentResponse.ok) {
            currentWeekData = await currentResponse.json()
          }
        } catch (e) {
          // Fallback to trimmed
          const currentResponse = await fetch(`/latest_trimmed.json?t=${timestamp}`)
          if (currentResponse.ok) {
            currentWeekData = await currentResponse.json()
          }
        }
        
        if (currentWeekData && currentWeekData.week) {
          const currentWeek = parseInt(currentWeekData.week)
          const previousWeek = currentWeek - 1
          
          // Try to fetch previous week's data
          if (previousWeek > 0) {
            try {
              let prevResponse = await fetch(`/weekly_summaries/week_${previousWeek}_trimmed.json?t=${timestamp}`)
              if (prevResponse.ok) {
                return await prevResponse.json()
              }
              
              // Fallback to full data
              prevResponse = await fetch(`/weekly_summaries/week_${previousWeek}.json?t=${timestamp}`)
              if (prevResponse.ok) {
                return await prevResponse.json()
              }
            } catch (e) {
              // If previous week data not found, fall back to current week
              console.log(`Previous week ${previousWeek} data not found, using current week ${currentWeek}`)
            }
          }
        }
      }
      
      // For season kickoff, prefer full data (includes roster details)
      // For other contexts, prefer trimmed data (reduces token usage)
      const preferFullData = context === 'season_kickoff'
      
      if (preferFullData) {
        // Try full data first for season kickoff
        let localResponse = await fetch(`/latest.json?t=${timestamp}`)
        if (localResponse.ok) {
          return await localResponse.json()
        }
        
        // Fallback to trimmed data
        localResponse = await fetch(`/latest_trimmed.json?t=${timestamp}`)
        if (localResponse.ok) {
          return await localResponse.json()
        }
      } else {
        // Try trimmed data first for other contexts
        let localResponse = await fetch(`/latest_trimmed.json?t=${timestamp}`)
        if (localResponse.ok) {
          return await localResponse.json()
        }
        
        // Fallback to full data
        localResponse = await fetch(`/latest.json?t=${timestamp}`)
        if (localResponse.ok) {
          return await localResponse.json()
        }
      }
      
      // Fallback to parent directory
      let localResponse = await fetch(`/weekly_summaries/latest_trimmed.json?t=${timestamp}`)
      if (localResponse.ok) {
        return await localResponse.json()
      }
      
      localResponse = await fetch(`/weekly_summaries/latest.json?t=${timestamp}`)
      if (localResponse.ok) {
        return await localResponse.json()
      }
    } catch (localError) {
      // Local fetch failed, will try Supabase
    }
    
    // Fallback to Supabase if local fetch fails
    const { data, error } = await supabase.storage
      .from('weekly_summaries')
      .download('latest.json')
    
    if (error) {
      throw new Error(`Supabase error: ${error.message}`)
    }
    
    if (!data) {
      throw new Error('No data received from Supabase')
    }
    
    const jsonData = await data.text()
    
    try {
      return JSON.parse(jsonData)
    } catch (parseError) {
      throw new Error(`JSON Parse error: ${parseError.message}`)
    }
    
  } catch (error) {
    console.error('Failed to fetch latest recap:', error)
    throw error
  }
}

export async function uploadRecap(jsonData) {
  try {
    const { data, error } = await supabase.storage
      .from('weekly_summaries')
      .upload('latest.json', JSON.stringify(jsonData, null, 2), {
        contentType: 'application/json',
        upsert: true
      })
    
    if (error) {
      throw error
    }
    
    return data
  } catch (error) {
    throw error
  }
}

// Save Commissar recap as text file
export async function saveCommissarRecap(recapText, week = 1) {
  try {
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `commissar_recap_week_${week}_${timestamp}.md`
    
    const { data, error } = await supabase.storage
      .from('recaps')
      .upload(filename, recapText, {
        contentType: 'text/markdown',
        upsert: false // Don't overwrite existing files
      })
    
    if (error) {
      throw new Error(`Failed to save recap: ${error.message}`)
    }
    
    return { filename, data }
    
  } catch (error) {
    throw error
  }
}

// List all saved recaps
export async function listSavedRecaps() {
  try {
    const { data, error } = await supabase.storage
      .from('recaps')
      .list()
    
    if (error) {
      throw error
    }
    
    return data || []
  } catch (error) {
    throw error
  }
}

// Download a specific recap
export async function downloadRecap(filename) {
  try {
    const { data, error } = await supabase.storage
      .from('recaps')
      .download(filename)
    
    if (error) {
      throw error
    }
    
    const text = await data.text()
    return text
  } catch (error) {
    throw error
  }
} 