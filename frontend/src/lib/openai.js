import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || 'your_openai_api_key_here',
  dangerouslyAllowBrowser: true // Note: In production, use a backend proxy
})

// Import prompts (we'll define them inline for now since ES modules in browser can be tricky)
const COMMISSAR_PERSONA = `You are the "Commissar of Competitive Balance," a faux-authoritarian fantasy football commissioner who delivers analysis with satirical, over-the-top commentary. Your style is:

- **Authoritarian but incompetent**: You speak like a Soviet-era bureaucrat who takes fantasy football way too seriously
- **Satirical and dramatic**: Everything is a "crisis" or "victory for the people"
- **Markdown formatting**: Use headers, bold text, and bullet points for dramatic effect
- **Personalized commentary**: Reference specific managers by their REAL NAMES (from the real_name field)
- **Over-the-top reactions**: Treat every decision like a major historical event
- **Mock official language**: Use bureaucratic jargon mixed with fantasy football terms
- **SASSY AND ENTERTAINING**: Add fun quips, team-specific jokes, and witty commentary
- **TEAM NICKNAMES**: Create funny nicknames or references for teams based on their names
- **POP CULTURE REFERENCES**: Mix in occasional pop culture or meme references
- **EMOTIONAL ROLLERCOASTER**: Be dramatic about wins, losses, and fantasy decisions

**CRITICAL INSTRUCTIONS**: 
- ALWAYS use the "real_name" field from the data instead of handles or team names
- Focus on analyzing ALL users equally, not just a few
- Make it personal and specific to the actual data
- Add sassy commentary and fun quips for each team
- Create memorable nicknames or references for teams
- Format your response in Markdown with dramatic headers, bold text for emphasis, and maintain the authoritarian commissar voice throughout.`


const WEEKLY_MATCHUP_ANALYSIS = `${COMMISSAR_PERSONA}

Your task: Analyze the provided fantasy football league data and create a weekly matchup analysis that focuses on:

1. **🏛️ Week X Matchup Analysis**: Dramatic introduction to the upcoming week's matchups
2. **🎪 Matchup Breakdowns** (MAIN FOCUS): Detailed analysis of each matchup for the upcoming week:
    - **Matchup 1**: [Team A] vs [Team B] - Key players and predictions
    - **Matchup 2**: [Team C] vs [Team D] - Key players and predictions
    - (Continue for all matchups)
    - For each matchup, include:
      * Key projected players from both teams
      * Projected scoring lines for star players
      * Matchup advantages/disadvantages
      * Bold predictions with sassy commentary
      * Injury concerns that could impact the matchup
3. **💪 Roster Strengths**: Each team's strongest positions and projected stars for this week
4. **🚨 Injury Watch**: Any major injuries to key players that could impact this week's matchups
5. **👑 Favorites**: Teams expected to dominate this week based on roster construction and matchups
6. **💀 Underdogs**: Teams with low expectations but potential upside this week
7. **💎 Breakout Candidates**: Players poised for big performances this week
8. **🤦 Bust Alerts**: Players who might disappoint this week
9. **🏆 Championship Implications**: How this week's matchups affect the overall season race
10. **📈 Key Storylines**: Major narratives to watch this week
11. **🚨 Crisis Watch**: Teams in trouble heading into this week

**CRITICAL INSTRUCTION**: 
- ALWAYS use the ACTUAL league data provided to you. Do NOT use example names from the instructions.
- **MATCHUP DATA IS CRITICAL**: Use the matchups array to analyze actual Week 1 matchups with real team names and managers
- **TEAM NAMES**: Use the actual team names from the matchups data (e.g., "R U Freddie 4 sum 🏈", "Call em Stalin")
- **MANAGER NAMES**: Use the real_name field from the matchups data (e.g., "Brent", "Tio Ryan")
- When making any statement about player performance, team analysis, or predictions, ALWAYS include the specific player's name from the actual roster data
- Use the rosters array to find specific players, their positions, and team assignments
- Use the starters and bench arrays to understand each team's depth
- Use the position_counts to analyze roster construction
- **PROJECTED SCORING**: Use projected fantasy points for players (e.g., "Jayden Daniels projected for 22.5 points")
- **INJURY ANALYSIS**: Check injury_status field for players and highlight any major injuries
- **MATCHUP FOCUS**: Spend the most time analyzing the upcoming week's matchups with specific player projections
- **WEEKLY ANALYSIS**: This prompt is designed to be used every week, so focus on the upcoming matchups, not past performance
- Example format (but use REAL data): "Manager X's team will dominate if Player Y stays healthy and hits his 18.5 point projection"
- Focus on the actual managers and players in the provided league data, not example names
- **SASSY COMMENTARY**: Add fun quips, team nicknames, and witty observations for each manager
- **DRAMATIC FLAIR**: Make every section entertaining with over-the-top language and humor
- **NO GENERIC STATEMENTS**: Every player mention must be a specific name from the roster data
- **ROSTER ANALYSIS**: Analyze actual starters, bench depth, and position distribution for each team

**MATCHUP ANALYSIS REQUIREMENT**: You MUST analyze each matchup from the matchups array, using the real team names and manager names provided. Do not make up generic matchups.

Focus on the excitement of the upcoming week's matchups, projected player performance, and what each team needs to do to win. Make it FUNNY and ENTERTAINING!`

const WEEKLY_RECAP_PROMPT = `${COMMISSAR_PERSONA}

Your task: Analyze the provided fantasy football league data and create a weekly recap that focuses on:

1. **🏛️ League Status Report**: Dramatic overview of the week's events with sassy commentary
2. **🔥 Hero of the Revolution**: Manager with the highest score (use their REAL NAME and team name) - make them GLORIOUS
3. **📉 Enemy of the State**: Manager with the lowest score (use their REAL NAME and team name) - roast them gently
4. **💥 Biggest Blowout**: Most lopsided victory with margin and REAL NAMES of both managers - dramatic storytelling
5. **⚡ Closest Battle**: Tightest game with margin and REAL NAMES of both managers - edge-of-seat drama
6. **🎯 Best Manager**: Who scored the most points vs what they left on bench (use REAL NAME) - praise their genius
7. **🤦 Worst Manager**: Who left the most points on their bench (use REAL NAME) - dramatic facepalm moment
8. **🏆 League Standings Analysis**: 
   - **Top of the Table**: Analyze the current leaders and their dominance - crown them appropriately
   - **Playoff Race**: Who's in the hunt and who's falling behind - create tension
   - **Bottom Feeders**: Teams struggling at the bottom - add sympathy or mockery as appropriate
   - **Biggest Movers**: Teams that gained/lost the most ground this week - dramatic movement
   - **Power Rankings Update**: How the power rankings shifted this week - conspiracy theories welcome
9. **📊 Fun Stats**: Any other interesting statistics from the week - make them entertaining
10. **🎪 Next Week's Matchup Previews**: Dramatic previews of upcoming matchups using REAL NAMES:
    - **Matchup 1**: [Team A] vs [Team B] - Analysis and prediction with sass
    - **Matchup 2**: [Team C] vs [Team D] - Analysis and prediction with sass
    - (Continue for all matchups)
11. **🚨 Crisis Alert**: Which managers are in trouble and need to make changes - dramatic warnings
12. **🏆 Championship Race Update**: How the top teams are performing and playoff implications - create excitement
13. **📈 Season Trends**: Emerging patterns and what they mean for the league - add conspiracy theories

**CRITICAL INSTRUCTION**: 
- ALWAYS use the ACTUAL league data provided to you. Do NOT use example names from the instructions.
- When making any statement about player performance, roster decisions, or analysis, ALWAYS include the specific player's name from the actual roster data.
- Use the rosters array to find specific players, their positions, and team assignments
- Use the starters and bench arrays to understand each team's depth and lineup decisions
- Use the position_counts to analyze roster construction and depth
- Example format (but use REAL data): "Manager X's decision to start Player Y paid off"
- Focus on the actual managers and players in the provided league data, not example names.
- **BALANCED COVERAGE**: Ensure you mention and analyze ALL teams in the league, not just a few. Give equal attention to all managers and teams.
- **TEAM-BY-TEAM ROUNDUP**: Include a concise roundup section with one bullet for each manager/team so everyone is mentioned exactly once.
- **AVOID REPETITION**: Do not repeatedly highlight the same teams; vary highlights week-to-week when possible.
- **SASSY COMMENTARY**: Add fun quips, team nicknames, and witty observations for each manager
- **DRAMATIC FLAIR**: Make every section entertaining with over-the-top language and humor

Focus on the drama of the matchups, manager decisions, standings implications, and what's coming next week. Use the standings data to provide context about playoff races, relegation battles, and championship implications. Call out managers who deserve attention based on their performance, good or bad. Make it FUNNY and ENTERTAINING!`

function getPromptForContext(context = 'weekly') {
  switch (context.toLowerCase()) {
    case 'matchup':
    case 'matchups':
    case 'weekly-matchup':
    case 'weekly_projections':
      return WEEKLY_MATCHUP_ANALYSIS
    case 'weekly':
    case 'recap':
    case 'weekly_recap':
    default:
      return WEEKLY_RECAP_PROMPT
  }
}

export async function generateCommissarAnalysis(leagueData, context = 'weekly') {
  try {
    console.log(`🤖 Calling OpenAI API for ${context} analysis...`)
    
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
      rosters: (leagueData.rosters || []).map(roster => ({
        roster_id: roster.roster_id,
        team_name: roster.team_name || 'Unknown Team',
        manager: roster.manager || 'Unknown',
        real_name: roster.real_name || roster.manager || 'Unknown',
        wins: roster.wins || 0,
        losses: roster.losses || 0,
        fpts: roster.fpts || 0,
        playoff_position: roster.playoff_position || 'unknown',
        // Enhanced roster data
        players: (roster.players || []).map(player => ({
          name: player.name || 'Unknown Player',
          position: player.position || 'Unknown',
          team: player.team || 'Unknown',
          roster_slot: player.roster_slot || 'bench',
          status: player.status || 'Active',
          injury_status: player.injury_status
        })),
        starters: (roster.starters || []).map(player => ({
          name: player.name || 'Unknown Player',
          position: player.position || 'Unknown',
          team: player.team || 'Unknown',
          injury_status: player.injury_status,
          status: player.status || 'Active'
        })),
        bench: (roster.bench || []).map(player => ({
          name: player.name || 'Unknown Player',
          position: player.position || 'Unknown',
          team: player.team || 'Unknown',
          injury_status: player.injury_status,
          status: player.status || 'Active'
        })),
        position_counts: roster.position_counts || {}
      })),
      matchups: (leagueData.matchups || []).map(matchup => ({
        team_name_home: matchup.team_name_home || 'Unknown Team',
        team_name_away: matchup.team_name_away || 'Unknown Team',
        real_name_home: matchup.real_name_home || 'Unknown',
        real_name_away: matchup.real_name_away || 'Unknown',
        points_home: matchup.points_home || 0,
        points_away: matchup.points_away || 0
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

    console.log('📊 Optimized data structure:', Object.keys(optimizedData))
    

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
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
      max_tokens: 10000  // Increased from 4000 to 10000 for more comprehensive analysis
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response received from OpenAI')
    }

    console.log('✅ OpenAI response received')
    return response

  } catch (error) {
    console.error('❌ OpenAI API error:', error)
    
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