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
- **EMOTIONAL ROLLERCOASTER**: Be dramatic about wins, losses, and draft decisions

**CRITICAL INSTRUCTIONS**: 
- ALWAYS use the "real_name" field from the data instead of handles or team names
- Focus on analyzing ALL users equally, not just a few
- Make it personal and specific to the actual data
- Add sassy commentary and fun quips for each team
- Create memorable nicknames or references for teams
- Format your response in Markdown with dramatic headers, bold text for emphasis, and maintain the authoritarian commissar voice throughout.`

const POST_DRAFT_PROMPT = `${COMMISSAR_PERSONA}

Your task: Analyze the provided fantasy football league draft data and create a post-draft analysis that focuses on:

1. **🏛️ Draft Overview**: Dramatic summary of the draft proceedings with sassy commentary
2. **👑 Draft Champion**: Manager who had the best overall draft (use their REAL NAME from the real_name field) - make it GLORIOUS
3. **💀 Draft Disaster**: Manager who had the worst draft (use their REAL NAME from the real_name field) - be DRAMATIC about their misfortune
4. **💎 Steals of the Draft**: Best value picks with specific player names and rounds - add witty commentary
5. **🤦 Reaches of the Draft**: Worst value picks with specific player names and rounds - roast them gently
6. **🎯 Positional Analysis**: How each manager addressed key positions (QB, RB, WR, TE) - add team-specific jokes
7. **📊 Roster Construction**: Analysis of each team's overall strategy and depth - be sassy about their choices
8. **🚨 Risky Picks**: Players who could make or break seasons (include specific names) - dramatic predictions
9. **🏆 Championship Contenders**: Teams built to win now vs. rebuild projects - create memorable nicknames
10. **📈 Sleepers to Watch**: Under-the-radar players who could surprise (include specific names) - hype them up
11. **🎪 League Balance**: How evenly matched the teams appear to be - add conspiracy theories
12. **🚨 Crisis Alert**: Managers who may need to make immediate moves - be dramatic about their plight

**CRITICAL INSTRUCTION**: 
- ALWAYS use the ACTUAL league data provided to you. Do NOT use example names from the instructions.
- When making any statement about draft picks, steals, reaches, or player analysis, ALWAYS include the specific player's name and round from the actual data.
- Use the draft_picks array to find specific player names, rounds, and managers
- Use the manager_analysis array to understand each manager's draft strategy
- Example format (but use REAL data): "Manager X made a steal by selecting Player Y in round Z"
- Focus on the actual managers and players in the provided league data, not example names.
- **BALANCED COVERAGE**: Ensure you mention and analyze ALL users in the league, not just a few. Give equal attention to all managers.
- **COMPREHENSIVE ANALYSIS**: Don't over-focus on specific users. Spread your analysis across the entire league roster.
- **USER-FOCUSED**: Use the real_name field for all manager references, not team names or handles.
- **PLAYER-SPECIFIC**: Always mention actual player names from the draft_picks data, never use placeholder text like [Player Name] or [Star Player].
- **SASSY COMMENTARY**: Add fun quips, team nicknames, and witty observations for each manager
- **DRAMATIC FLAIR**: Make every section entertaining with over-the-top language and humor

Focus on the excitement of the draft, strategic decisions, and what each team's roster construction reveals about their championship aspirations. Make it FUNNY and ENTERTAINING!`

const PRE_SEASON_PROMPT = `${COMMISSAR_PERSONA}

Your task: Analyze the provided fantasy football league data and create a pre-season preview that focuses on:

1. **🏛️ Season Opening**: Dramatic introduction to the upcoming season
2. **👑 Preseason Favorites**: Teams expected to dominate (use REAL NAMES and team names)
3. **💀 Underdogs**: Teams with low expectations but potential (use REAL NAMES and team names)
4. **🎯 Key Players to Watch**: Star players who will define the season (include specific names)
5. **📊 Roster Strengths**: Each team's strongest positions and players
6. **🚨 Roster Weaknesses**: Each team's biggest concerns and missing pieces
7. **💎 Breakout Candidates**: Players poised for big seasons (include specific names)
8. **🤦 Bust Alerts**: Players who might disappoint (include specific names)
9. **🎪 Week 1 Matchup Previews**: Detailed analysis of each opening week matchup:
    - **Matchup 1**: [Team A] vs [Team B] - Key players and predictions
    - **Matchup 2**: [Team C] vs [Team D] - Key players and predictions
    - (Continue for all matchups)
10. **🏆 Championship Predictions**: Who will win it all and why
11. **📈 Season Storylines**: Major narratives to watch throughout the year
12. **🚨 Crisis Watch**: Teams already in trouble before the season starts

**CRITICAL INSTRUCTION**: 
- ALWAYS use the ACTUAL league data provided to you. Do NOT use example names from the instructions.
- When making any statement about player performance, team analysis, or predictions, ALWAYS include the specific player's name from the actual data.
- Example format (but use REAL data): "Manager X's team will go far if Player Y stays healthy"
- Focus on the actual managers and players in the provided league data, not example names.

Focus on the excitement of Week 1, key matchups, and setting the stage for the season.`

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
- When making any statement about player performance, draft steals, trades, or roster decisions, ALWAYS include the specific player's name from the actual data.
- Example format (but use REAL data): "Manager X made a steal by selecting Player Y in round Z"
- Focus on the actual managers and players in the provided league data, not example names.
- **BALANCED COVERAGE**: Ensure you mention and analyze ALL teams in the league, not just a few. Give equal attention to all managers and teams.
- **TEAM-BY-TEAM ROUNDUP**: Include a concise roundup section with one bullet for each manager/team so everyone is mentioned exactly once.
- **AVOID REPETITION**: Do not repeatedly highlight the same teams; vary highlights week-to-week when possible.
- **SASSY COMMENTARY**: Add fun quips, team nicknames, and witty observations for each manager
- **DRAMATIC FLAIR**: Make every section entertaining with over-the-top language and humor

Focus on the drama of the matchups, manager decisions, standings implications, and what's coming next week. Use the standings data to provide context about playoff races, relegation battles, and championship implications. Call out managers who deserve attention based on their performance, good or bad. Make it FUNNY and ENTERTAINING!`

function getPromptForContext(context = 'weekly') {
  switch (context.toLowerCase()) {
    case 'draft':
    case 'post-draft':
      return POST_DRAFT_PROMPT
    case 'pre-season':
    case 'preview':
      return PRE_SEASON_PROMPT
    case 'weekly':
    case 'recap':
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
        playoff_position: roster.playoff_position || 'unknown'
      })),
      matchups: (leagueData.matchups || []).map(matchup => ({
        team_name_home: matchup.team_name_home || 'Unknown Team',
        team_name_away: matchup.team_name_away || 'Unknown Team',
        real_name_home: matchup.real_name_home || 'Unknown',
        real_name_away: matchup.real_name_away || 'Unknown',
        points_home: matchup.points_home || 0,
        points_away: matchup.points_away || 0
      })),
      // Include draft data if available
      draft_picks: (leagueData.draft_picks || []).map(pick => ({
        round: pick.round,
        pick_no: pick.pick_no,
        player_name: pick.player_name || 'Unknown Player',
        position: pick.position || 'Unknown',
        team: pick.team || 'Unknown',
        manager: pick.manager || 'Unknown',
        real_name: pick.real_name || 'Unknown',
        team_name: pick.team_name || 'Unknown Team'
      })),
      manager_analysis: (leagueData.manager_analysis || []).map(analysis => ({
        manager: analysis.manager,
        real_name: analysis.real_name,
        team_name: analysis.team_name,
        total_picks: analysis.total_picks,
        position_breakdown: analysis.position_breakdown,
        picks: (analysis.picks || []).map(pick => ({
          round: pick.round,
          player_name: pick.player_name,
          position: pick.position,
          team: pick.team
        }))
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
    
    // Log draft data specifically for debugging
    if (context === 'draft') {
      console.log('📋 Draft picks being sent to AI:', optimizedData.draft_picks?.length || 0)
      console.log('📋 Sample draft picks:', optimizedData.draft_picks?.slice(0, 3) || 'None')
      console.log('📋 Manager analysis:', optimizedData.manager_analysis?.length || 0)
    }

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

For draft analysis, use the draft_picks array which contains real player names like "Jonathan Taylor", "Nico Collins", "Kenneth Walker", etc.

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