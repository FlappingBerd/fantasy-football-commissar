import OpenAI from 'openai'
import { getPromptForContext } from '../../../prompts.js'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || 'your_openai_api_key_here',
  dangerouslyAllowBrowser: true // Note: In production, use a backend proxy
})


// Prompts are now imported from the shared prompts.js file

export async function generateCommissarAnalysis(leagueData, context = 'weekly') {
  try {
    // Check if API key is set
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      throw new Error('OpenAI API key not configured. Please check your .env file.')
    }

    // Validate and sanitize the league data
    if (!leagueData) {
      throw new Error('No league data provided')
    }

    const prompt = getPromptForContext(context)

    // Optimize data to reduce token usage with proper error handling
    const optimizedData = {
      week: leagueData.week || 1,
      league: {
        name: leagueData.league?.name || 'Fantasy Football League',
        season: leagueData.league?.season || '2025'
      },
      users: (leagueData.users || []).map(user => ({
        user_id: user.user_id,
        display_name: user.display_name || 'Unknown',
        team_name: user.team_name || 'Unknown Team',
        handle: user.handle || 'Unknown',
        real_name: user.real_name || user.display_name || 'Unknown'
      })),
      rosters: (leagueData.rosters || []).map(roster => {
        // For season kickoff, include minimal roster details
        if (context === 'season_kickoff') {
          return {
            team_name: roster.team_name || 'Unknown Team',
            real_name: roster.real_name || roster.manager || 'Unknown',
            // Include only top 3 key players for roasting
            top_players: (roster.starters || []).slice(0, 3).map(player => ({
              name: player.name || 'Unknown Player',
              position: player.position || 'Unknown'
            }))
          }
        } else {
          // For other contexts, use minimal roster data
          return {
            roster_id: roster.roster_id,
            team_name: roster.team_name || 'Unknown Team',
            manager: roster.manager || 'Unknown',
            real_name: roster.real_name || roster.manager || 'Unknown',
            wins: roster.wins || 0,
            losses: roster.losses || 0,
            fpts: roster.fpts || 0,
            playoff_position: roster.playoff_position || 'unknown'
          }
        }
      }),
      matchups: (leagueData.matchups || []).map(matchup => ({
        team_name_home: matchup.team_name_home || 'Unknown Team',
        team_name_away: matchup.team_name_away || 'Unknown Team',
        real_name_home: matchup.real_name_home || 'Unknown',
        real_name_away: matchup.real_name_away || 'Unknown',
        points_home: matchup.points_home,
        points_away: matchup.points_away,
        margin: matchup.margin,
        winner: matchup.points_home > matchup.points_away ? 'home' : 'away',
        winner_name: matchup.points_home > matchup.points_away ? matchup.team_name_home : matchup.team_name_away,
        loser_name: matchup.points_home > matchup.points_away ? matchup.team_name_away : matchup.team_name_home
      })),
      stats: {
        top_score: leagueData.stats?.top_score || { manager: 'Unknown', real_name: 'Unknown', team_name: 'Unknown Team', points: 0 },
        low_score: leagueData.stats?.low_score || { manager: 'Unknown', real_name: 'Unknown', team_name: 'Unknown Team', points: 0 },
        best_manager: leagueData.stats?.best_manager || { manager: 'Unknown', real_name: 'Unknown', team_name: 'Unknown Team', points: 0 },
        worst_manager: leagueData.stats?.worst_manager || { manager: 'Unknown', real_name: 'Unknown', team_name: 'Unknown Team', bench_points: 0 },
        closest_game: leagueData.stats?.closest_game || { teams: ['Unknown', 'Unknown'], managers: ['Unknown', 'Unknown'], margin: 0 },
        largest_blowout: leagueData.stats?.largest_blowout || { teams: ['Unknown', 'Unknown'], managers: ['Unknown', 'Unknown'], margin: 0 },
        power_rankings: (leagueData.stats?.power_rankings || []).slice(0, 10), // Top 10 only
        standings_analysis: leagueData.stats?.standings_analysis || { total_teams: 0, playoff_teams: 0, bubble_teams: 0, eliminated_teams: 0 }
      }
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",  // More powerful model with higher token limits
      messages: [
        {
          role: "system",
          content: prompt
        },
        {
          role: "user",
          content: `Generate a comprehensive ${context} fantasy football analysis in the style of the Commissar of Competitive Balance. Analyze ALL teams equally and provide detailed coverage. 

IMPORTANT: Use ONLY the actual player names from the data provided. Do NOT use placeholder text like [Player Name], [Star Player], or [Emerging Talent].

Here is the optimized league data:\n\n${JSON.stringify(optimizedData, null, 2)}`
        }
      ],
      temperature: 0.9,
      max_tokens: context === 'season_kickoff' ? 4000 : 8000  // Adjusted for gpt-4o capabilities
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response received from OpenAI')
    }

    return response

  } catch (error) {
    // Provide a fallback response if OpenAI fails
    if (error.message.includes('API key')) {
      throw new Error('OpenAI API key not configured. Please check your .env file.')
    } else if (error.message.includes('rate limit')) {
      throw new Error('OpenAI rate limit exceeded. Please try again in a moment.')
    } else if (error.message.includes('quota')) {
      throw new Error('OpenAI quota exceeded. Please check your account.')
    } else if (error.message.includes('No league data provided')) {
      throw new Error('League data is missing. Please try refreshing the page.')
    } else {
      throw new Error(`OpenAI API error: ${error.message}`)
    }
  }
}

// Backward compatibility
export async function generateCommissarRecap(leagueData) {
  return generateCommissarAnalysis(leagueData, 'weekly')
} 