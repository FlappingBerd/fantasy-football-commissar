/**
 * Sleeper → Weekly Payload for Claude
 * Usage:
 *   node fetch_sleeper_week.js --league <LEAGUE_ID>
 *
 * Env alternative:
 *   SLEEPER_LEAGUE_ID=123 node fetch_sleeper_week.js
 *
 * Output: JSON on stdout shaped for your Claude prompt.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SLEEPER = "https://api.sleeper.app/v1";

// ---- CLI args --------------------------------------------------------------
const args = {};
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i].startsWith('--')) {
    const key = process.argv[i].substring(2);
    const value = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true;
    args[key] = value;
    if (value !== true) i++; // Skip next arg if it was consumed
  }
}

const LEAGUE_ID = args.league || process.env.SLEEPER_LEAGUE_ID;
const WEEK = args.week || process.env.SLEEPER_WEEK;
const MODE = args.mode || 'recap'; // 'recap' for post-game analysis, 'projections' for current week

if (!LEAGUE_ID) {
  console.error("Missing league id. Pass --league <ID> or set SLEEPER_LEAGUE_ID.");
  process.exit(1);
}

// Removed special-mention hint arguments to ensure balanced coverage

// ---- Helpers ---------------------------------------------------------------
async function j(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} for ${url}`);
  return r.json();
}

function handleFromUser(u) {
  const name = u.display_name || u.username || "manager";
  return `@${name}`;
}

// Removed hint-based handle lookup (no special mentions)

function toFixed(n, d = 1) {
  return Number.isFinite(n) ? Number(n.toFixed(d)) : n;
}

// Get real name from current team name or display name
function getRealName(user) {
  // Use display name, username, or team name as the "real name"
  // Since Sleeper often has null display_name/username, fall back to team name
  return user.display_name || user.username || getTeamName(user) || "Unknown Manager";
}

// Dynamic team name mapping - handles team name changes
function getTeamName(user) {
  // Priority order for team names:
  // 1. Current team name from Sleeper metadata (most up-to-date)
  // 2. Display name
  // 3. Username
  // 4. Fallback
  
  const currentTeamName = user.metadata?.team_name;
  const displayName = user.display_name;
  const username = user.username;
  
  // If we have a current team name, use it
  if (currentTeamName && currentTeamName.trim() !== '') {
    return currentTeamName;
  }
  
  // Fallback to display name or username
  return displayName || username || "Unknown Team";
}

// Function to analyze matchups and identify key ones
function analyzeMatchups(matchups, rosters, players) {
  return matchups.map(matchup => {
    const homeRoster = rosters.find(r => r.roster_id === matchup.roster_id_home);
    const awayRoster = rosters.find(r => r.roster_id === matchup.roster_id_away);
    
    // Use actual projected points from Sleeper if available, otherwise calculate from starters using search_rank
    let homeProjected = matchup.proj_home;
    let awayProjected = matchup.proj_away;
    
    // If Sleeper projections are 0 or null (preseason), use search_rank as proxy for projections
    if (!homeProjected || homeProjected === 0) {
      homeProjected = homeRoster?.starters?.reduce((sum, player) => {
        const playerData = players[player.player_id];
        // Convert search_rank to projected points (lower rank = higher projection)
        // Use a simple formula: 25 - (search_rank / 10) for a rough projection
        const projection = playerData?.search_rank ? Math.max(5, 25 - (playerData.search_rank / 10)) : 10;
        return sum + projection;
      }, 0) || 0;
    }
    
    if (!awayProjected || awayProjected === 0) {
      awayProjected = awayRoster?.starters?.reduce((sum, player) => {
        const playerData = players[player.player_id];
        // Convert search_rank to projected points (lower rank = higher projection)
        const projection = playerData?.search_rank ? Math.max(5, 25 - (playerData.search_rank / 10)) : 10;
        return sum + projection;
      }, 0) || 0;
    }
    
    // Calculate margin (use projected points if actual points are 0)
    const homePoints = matchup.points_home || homeProjected;
    const awayPoints = matchup.points_away || awayProjected;
    const margin = Math.abs(homePoints - awayPoints);
    
    // Determine if this is a key matchup
    const isKeyMatchup = 
      margin > 10 || // Big blowout
      margin < 2 || // Very close game
      homeProjected > 130 || // High projected score
      awayProjected > 130 || // High projected score
      Math.abs(homeProjected - awayProjected) > 30; // Mismatched projections
    
    // Get top performers from each team
    const homeTopPerformers = homeRoster?.starters
      ?.sort((a, b) => (b.points || 0) - (a.points || 0))
      ?.slice(0, 3) || [];
      
    const awayTopPerformers = awayRoster?.starters
      ?.sort((a, b) => (b.points || 0) - (a.points || 0))
      ?.slice(0, 3) || [];
    
    return {
      ...matchup,
      proj_home: toFixed(homeProjected), // Update the projections with our calculated values
      proj_away: toFixed(awayProjected),
      home_projected: toFixed(homeProjected),
      away_projected: toFixed(awayProjected),
      margin: toFixed(margin),
      is_key_matchup: isKeyMatchup,
      matchup_type: margin > 20 ? 'blowout' : margin < 2 ? 'nail_biter' : 'standard',
      home_top_performers: homeTopPerformers,
      away_top_performers: awayTopPerformers,
      prediction: generateMatchupPrediction(matchup, homeProjected, awayProjected, margin)
    };
  });
}

// Function to generate sassy matchup predictions
function generateMatchupPrediction(matchup, homeProj, awayProj, margin) {
  const homeName = matchup.team_name_home;
  const awayName = matchup.team_name_away;
  const homeRealName = matchup.real_name_home;
  const awayRealName = matchup.real_name_away;
  
  if (margin > 20) {
    const winner = matchup.points_home > matchup.points_away ? homeName : awayName;
    const loser = matchup.points_home > matchup.points_away ? awayName : homeName;
    const winnerReal = matchup.points_home > matchup.points_away ? homeRealName : awayRealName;
    const loserReal = matchup.points_home > matchup.points_away ? awayRealName : homeRealName;
    
    return `${winnerReal} absolutely DEMOLISHED ${loserReal} with ${winner} crushing ${loser} by ${margin.toFixed(1)} points! This wasn't a game, it was a public execution!`;
  } else if (margin < 2) {
    return `${homeRealName} vs ${awayRealName} was a nail-biter! ${homeName} and ${awayName} were separated by just ${margin.toFixed(1)} points. The people demand overtime!`;
  } else if (homeProj > 130 || awayProj > 130) {
    const highProjTeam = homeProj > awayProj ? homeName : awayName;
    const highProjReal = homeProj > awayProj ? homeRealName : awayRealName;
    return `${highProjReal} had ${highProjTeam} projected for ${Math.max(homeProj, awayProj).toFixed(0)} points! The projections are calling this a shootout!`;
  } else if (Math.abs(homeProj - awayProj) > 30) {
    const mismatchTeam = homeProj > awayProj ? homeName : awayName;
    const mismatchReal = homeProj > awayProj ? homeRealName : awayRealName;
    return `${mismatchReal} has ${mismatchTeam} projected to dominate this matchup! The oddsmakers are calling this one early!`;
  }
  
  return `${homeRealName} and ${awayRealName} face off in what should be a competitive battle between ${homeName} and ${awayName}.`;
}

// Function to log team name changes for monitoring
async function logTeamNameChanges(users, previousTeamNames = {}) {
  const changes = [];
  
  users.forEach(user => {
    const currentName = getTeamName(user);
    const previousName = previousTeamNames[user.user_id];
    
    if (previousName && previousName !== currentName) {
      changes.push({
        user_id: user.user_id,
        handle: handleFromUser(user),
        real_name: getRealName(handleFromUser(user)),
        old_name: previousName,
        new_name: currentName,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  if (changes.length > 0) {
    console.log('🔄 Team name changes detected:');
    changes.forEach(change => {
      console.log(`  ${change.real_name} (@${change.handle}): "${change.old_name}" → "${change.new_name}"`);
    });
    
    // Save changes to a log file
    const fs = await import('fs');
    const path = await import('path');
    const logFile = path.default.join(__dirname, '..', 'team_name_changes.json');
    
    let existingLog = [];
    try {
      if (fs.default.existsSync(logFile)) {
        existingLog = JSON.parse(fs.default.readFileSync(logFile, 'utf8'));
      }
    } catch (e) {
      console.log('⚠️ Could not read existing team name log');
    }
    
    const updatedLog = [...existingLog, ...changes];
    fs.default.writeFileSync(logFile, JSON.stringify(updatedLog, null, 2));
    console.log(`💾 Team name changes logged to: ${logFile}`);
  }
  
  return changes;
}

// Function to get player details from roster
function getPlayerDetails(playerId, players) {
  if (!playerId || !players[playerId]) {
    return {
      player_id: playerId,
      name: 'Unknown Player',
      position: 'Unknown',
      team: 'Unknown',
      status: 'Unknown'
    };
  }
  
  const player = players[playerId];
  return {
    player_id: playerId,
    name: player.full_name || `${player.first_name} ${player.last_name}` || 'Unknown Player',
    position: player.position || 'Unknown',
    team: player.team || 'Unknown',
    status: player.status || 'Active',
    injury_status: player.injury_status || null,
    search_rank: player.search_rank || null,
    fantasy_positions: player.fantasy_positions || []
  };
}

// Function to process roster with player details
function processRoster(roster, user, players) {
  const rosterPlayers = [];
  
  // Process all players on the roster
  if (roster.players) {
    roster.players.forEach(playerId => {
      const playerDetails = getPlayerDetails(playerId, players);
      rosterPlayers.push({
        ...playerDetails,
        roster_slot: 'bench' // Default to bench, will be updated below
      });
    });
  }
  
  // Mark starters
  if (roster.starters) {
    roster.starters.forEach((playerId, index) => {
      const playerIndex = rosterPlayers.findIndex(p => p.player_id === playerId);
      if (playerIndex !== -1) {
        rosterPlayers[playerIndex].roster_slot = 'starter';
        rosterPlayers[playerIndex].starter_position = index;
      }
    });
  }
  
  // Mark taxi squad
  if (roster.taxi) {
    roster.taxi.forEach(playerId => {
      const playerIndex = rosterPlayers.findIndex(p => p.player_id === playerId);
      if (playerIndex !== -1) {
        rosterPlayers[playerIndex].roster_slot = 'taxi';
      }
    });
  }
  
  // Mark injured reserve
  if (roster.reserve) {
    roster.reserve.forEach(playerId => {
      const playerIndex = rosterPlayers.findIndex(p => p.player_id === playerId);
      if (playerIndex !== -1) {
        rosterPlayers[playerIndex].roster_slot = 'ir';
      }
    });
  }
  
  return {
    roster_id: roster.roster_id,
    owner_id: roster.owner_id,
    team_name: getTeamName(user),
    manager: handleFromUser(user),
    real_name: getRealName(user),
    wins: roster.settings?.wins ?? 0,
    losses: roster.settings?.losses ?? 0,
    ties: roster.settings?.ties ?? 0,
    fpts: toFixed((roster.settings?.fpts ?? 0) + (roster.settings?.fpts_decimal ?? 0) / 100, 1),
    fpts_against: toFixed((roster.settings?.fpts_against ?? 0) + (roster.settings?.fpts_against_decimal ?? 0) / 100, 1),
    players: rosterPlayers,
    starters: rosterPlayers.filter(p => p.roster_slot === 'starter'),
    bench: rosterPlayers.filter(p => p.roster_slot === 'bench'),
    taxi: rosterPlayers.filter(p => p.roster_slot === 'taxi'),
    ir: rosterPlayers.filter(p => p.roster_slot === 'ir'),
    position_counts: rosterPlayers.reduce((acc, player) => {
      acc[player.position] = (acc[player.position] || 0) + 1;
      return acc;
    }, {})
  };
}

// ---- Main builder ----------------------------------------------------------
async function buildWeeklyPayload() {
  const state = await j(`${SLEEPER}/state/nfl`);
  
  let targetWeek, weekType;
  
  if (MODE === 'projections') {
    // For matchup analysis: get current week projections
    targetWeek = WEEK || state.week || 1;
    weekType = 'current';
    console.log(`🎯 Fetching CURRENT WEEK ${targetWeek} projections for matchup analysis...`);
  } else {
    // For weekly recap: get last completed week results
    targetWeek = WEEK || Math.max(1, ((state.week ?? 1) | 0) - 1);
    weekType = 'completed';
    console.log(`🏆 Fetching LAST COMPLETED WEEK ${targetWeek} results for weekly recap...`);
  }

  const [league, users, rosters, matchups, txs] = await Promise.all([
    j(`${SLEEPER}/league/${LEAGUE_ID}`),
    j(`${SLEEPER}/league/${LEAGUE_ID}/users`),
    j(`${SLEEPER}/league/${LEAGUE_ID}/rosters`),
    j(`${SLEEPER}/league/${LEAGUE_ID}/matchups/${targetWeek}`),
    j(`${SLEEPER}/league/${LEAGUE_ID}/transactions/${targetWeek}`),
  ]);

  // Fetch player data for roster analysis
  console.log('📡 Fetching player data for roster analysis...');
  const players = await j(`${SLEEPER}/players/nfl`);
  console.log(`✅ Fetched ${Object.keys(players).length} players`);

  const userById = Object.fromEntries(users.map((u) => [u.user_id, u]));
  const rosterById = Object.fromEntries(rosters.map((r) => [r.roster_id, r]));

  // Check for team name changes (optional - can be disabled)
  try {
    const fs = await import('fs');
    const path = await import('path');
    const previousDataFile = path.default.join(__dirname, '..', 'weekly_summaries', 'latest.json');
    
    if (fs.default.existsSync(previousDataFile)) {
      const previousData = JSON.parse(fs.default.readFileSync(previousDataFile, 'utf8'));
      const previousTeamNames = {};
      
      // Build previous team names map
      if (previousData.users) {
        previousData.users.forEach(user => {
          previousTeamNames[user.user_id] = user.team_name;
        });
      }
      
      // Log any team name changes
      await logTeamNameChanges(users, previousTeamNames);
    }
  } catch (error) {
    console.log('⚠️ Could not check for team name changes:', error.message);
  }

  // Enhanced team data with names and bench points
  const teams = matchups.map((m) => {
    const roster = rosterById[m.roster_id];
    const user = userById[roster?.owner_id] || {};
    const teamName = getTeamName(user);
    
    // Calculate bench points
    const startersPoints = Array.isArray(m.starters_points) ? m.starters_points.reduce((a, b) => a + Number(b || 0), 0) : 0;
    const totalPoints = Number(m.points || 0);
    const benchPoints = totalPoints - startersPoints;
    
    return {
      matchup_id: m.matchup_id,
      roster_id: m.roster_id,
      points: totalPoints,
      starters_points: startersPoints,
      bench_points: benchPoints,
      team_name: teamName,
      manager: handleFromUser(user),
      user_id: roster?.owner_id
    };
  });

  const byMatchId = Object.values(
    teams.reduce((acc, t) => {
      acc[t.matchup_id] = acc[t.matchup_id] || [];
      acc[t.matchup_id].push(t);
      return acc;
    }, {})
  ).filter((arr) => arr.length === 2); // keep only proper H2H pairs

  const matchupsNorm = byMatchId.map(([a, b]) => {
    // Get the original matchup data to access projected points
    const homeMatchup = matchups.find(m => m.roster_id === a.roster_id);
    const awayMatchup = matchups.find(m => m.roster_id === b.roster_id);
    
    return {
      matchup_id: a.matchup_id,
      roster_id_home: a.roster_id,
      roster_id_away: b.roster_id,
      points_home: toFixed(a.points),
      points_away: toFixed(b.points),
      proj_home: homeMatchup?.starters_points && homeMatchup.starters_points > 0 ? toFixed(homeMatchup.starters_points) : null,
      proj_away: awayMatchup?.starters_points && awayMatchup.starters_points > 0 ? toFixed(awayMatchup.starters_points) : null,
      manager_home: a.manager,
      manager_away: b.manager,
      real_name_home: getRealName(userById[a.user_id] || {}),
      real_name_away: getRealName(userById[b.user_id] || {}),
      team_name_home: a.team_name,
      team_name_away: b.team_name,
      bench_points_home: toFixed(a.bench_points),
      bench_points_away: toFixed(b.bench_points),
      user_id_home: a.user_id,
      user_id_away: b.user_id,
      top_performers: [], // You can enrich via player_box_scores if you want
    };
  });

  // Analyze matchups and add predictions
  const matchupsWithAnalysis = analyzeMatchups(matchupsNorm, rosters, players);

  // Standings snapshot (season-to-date) with enhanced roster data
  const standings = rosters
    .map((r) => {
      const user = userById[r.owner_id] || {};
      return processRoster(r, user, players);
    })
    .sort((a, b) => (b.wins - a.wins) || (b.fpts - a.fpts));

  // Users normalized with team names
  const usersNorm = users.map((u) => ({
    user_id: u.user_id,
    display_name: u.display_name || u.username,
    team_name: getTeamName(u),
    handle: handleFromUser(u),
    real_name: getRealName(u),
  }));

  // Per-team weekly points for stats
  const allTeamScores = matchupsNorm.flatMap((m) => [
    { 
      manager: m.manager_home, 
      team_name: m.team_name_home,
      points: m.points_home,
      bench_points: m.bench_points_home,
      user_id: m.user_id_home
    },
    { 
      manager: m.manager_away, 
      team_name: m.team_name_away,
      points: m.points_away,
      bench_points: m.bench_points_away,
      user_id: m.user_id_away
    },
  ]);

  // Enhanced stats with team names
  const top_score = allTeamScores.reduce((acc, s) => (s.points > (acc?.points ?? -Infinity) ? s : acc), null);
  const low_score = allTeamScores.reduce((acc, s) => (s.points < (acc?.points ?? Infinity) ? s : acc), null);
  
  // Best manager (most points scored)
  const best_manager = top_score;
  
  // Worst manager (left most points on bench)
  const worst_manager = allTeamScores.reduce((acc, s) => (s.bench_points > (acc?.bench_points ?? -Infinity) ? s : acc), null);

  const closest_game = byMatchId.reduce(
    (acc, [a, b]) => {
      const margin = Math.abs(a.points - b.points);
      if (!acc || margin < acc.margin) {
        return { 
          teams: [a.team_name, b.team_name], 
          managers: [a.manager, b.manager],
          user_ids: [a.user_id, b.user_id],
          margin: toFixed(margin, 1) 
        };
      }
      return acc;
    },
    null
  );

  const largest_blowout = byMatchId.reduce(
    (acc, [a, b]) => {
      const margin = Math.abs(a.points - b.points);
      if (!acc || margin > acc.margin) {
        const winner = a.points > b.points ? a : b;
        const loser = a.points > b.points ? b : a;
        return { 
          teams: [winner.team_name, loser.team_name], 
          managers: [winner.manager, loser.manager],
          user_ids: [winner.user_id, loser.user_id],
          margin: toFixed(margin, 1) 
        };
      }
      return acc;
    },
    null
  );

  // "Over/Underachiever" using crude baseline: starters_points as a proxy if present; otherwise null.
  function deltaFromProj(points, proj) {
    return proj == null ? null : toFixed(points - proj, 1);
  }
  const deltas = matchupsNorm.flatMap((m) => [
    { manager: m.manager_home, team_name: m.team_name_home, delta: deltaFromProj(m.points_home, m.proj_home) },
    { manager: m.manager_away, team_name: m.team_name_away, delta: deltaFromProj(m.points_away, m.proj_away) },
  ]).filter(d => d.delta != null);

  const overachiever = deltas.length ? deltas.reduce((a, b) => (a.delta > b.delta ? a : b)) : null;
  const underachiever = deltas.length ? deltas.reduce((a, b) => (a.delta < b.delta ? a : b)) : null;

  // Enhanced standings with additional metrics
  const enhancedStandings = standings.map((r, index) => {
    const totalGames = r.wins + r.losses + r.ties;
    const winPercentage = totalGames > 0 ? toFixed((r.wins + (r.ties * 0.5)) / totalGames * 100, 1) : 0;
    const pointsPerGame = totalGames > 0 ? toFixed(r.fpts / totalGames, 1) : 0;
    const playoffPosition = index < 6 ? 'playoff' : index < 10 ? 'bubble' : 'out';
    
    return {
      ...r,
      win_percentage: winPercentage,
      points_per_game: pointsPerGame,
      playoff_position: playoffPosition,
      total_games: totalGames
    };
  });

  // Lightweight power score: 1500 + 20*(wins-losses) + 0.5*(fpts - leagueAvgFpts)
  const avgFpts = standings.reduce((s, r) => s + (r.fpts || 0), 0) / Math.max(standings.length, 1);
  const power_rankings = enhancedStandings
    .map((r) => {
      const elo = Math.round(
        1500 + 20 * (r.wins - r.losses) + 0.5 * ((r.fpts || 0) - (avgFpts || 0))
      );
      return { 
        rank: 0, // Will be set below
        manager: r.manager, 
        team_name: r.team_name,
        real_name: r.real_name,
        elo, 
        wins: r.wins,
        losses: r.losses,
        ties: r.ties,
        fpts: r.fpts,
        win_percentage: r.win_percentage,
        points_per_game: r.points_per_game,
        playoff_position: r.playoff_position
      };
    })
    .sort((a, b) => b.elo - a.elo)
    .map((row, i) => ({ ...row, rank: i + 1 }));

  // Standings analysis
  const standingsAnalysis = {
    total_teams: enhancedStandings.length,
    playoff_teams: enhancedStandings.filter(s => s.playoff_position === 'playoff').length,
    bubble_teams: enhancedStandings.filter(s => s.playoff_position === 'bubble').length,
    eliminated_teams: enhancedStandings.filter(s => s.playoff_position === 'out').length,
    top_scorer: enhancedStandings.reduce((acc, s) => (s.fpts > (acc?.fpts ?? -Infinity) ? s : acc), null),
    worst_record: enhancedStandings.reduce((acc, s) => (s.win_percentage < (acc?.win_percentage ?? Infinity) ? s : acc), null),
    most_consistent: enhancedStandings.reduce((acc, s) => (s.points_per_game > (acc?.points_per_game ?? -Infinity) ? s : acc), null)
  };

  // Transactions
  const waivers = txs
    .filter((t) => t.type !== "trade")
    .map((t) => ({
      type: t.type,
      player: t.adds ? Object.keys(t.adds)[0] : "",
      by: handleFromUser(userById[t.creator_id] || {}),
      faab: t.settings?.waiver_bid ?? null,
      timestamp: t.status_updated || t.created,
    }));

  const trades = txs
    .filter((t) => t.type === "trade")
    .map((t) => {
      // t.adds is an object of {player_id: roster_id}; for display you'd normally map IDs→names (out of scope here)
      const teams = (t.roster_ids || []).map((rid) => {
        const r = rosterById[rid];
        const user = userById[r?.owner_id] || {};
        return {
          manager: handleFromUser(user),
          team_name: user.metadata?.team_name || user.display_name || user.username || "Unknown Team"
        };
      });
      return { teams, players: t.adds || {}, timestamp: t.status_updated || t.created };
    });

  // Final payload with enhanced data
  const payload = {
    week: targetWeek,
    week_type: weekType, // 'completed' for recap, 'current' for projections
    date_range: "", // Sleeper doesn't provide; your writer can omit or compute if you add a calendar
    league: {
      id: LEAGUE_ID,
      name: league.name,
      season: league.season,
      scoring_settings: league.scoring_settings || {},
    },
    users: usersNorm,
    rosters: enhancedStandings.map((r) => ({
      roster_id: r.roster_id,
      owner_id: r.owner_id,
      team_name: r.team_name,
      manager: r.manager,
      real_name: r.real_name,
      wins: r.wins,
      losses: r.losses,
      fpts: r.fpts,
      fpts_against: r.fpts_against,
      win_percentage: r.win_percentage,
      points_per_game: r.points_per_game,
      playoff_position: r.playoff_position,
      total_games: r.total_games,
      // Enhanced roster data
      players: r.players,
      starters: r.starters,
      bench: r.bench,
      taxi: r.taxi,
      ir: r.ir,
      position_counts: r.position_counts
    })),
    matchups: matchupsWithAnalysis,
    transactions: { waivers, trades },
    injuries: [], // Optional: can be filled if you add a separate injury source
    stats: {
      top_score: top_score ? { 
        manager: top_score.manager, 
        real_name: getRealName(userById[top_score.user_id] || {}),
        team_name: top_score.team_name,
        points: toFixed(top_score.points) 
      } : null,
      low_score: low_score ? { 
        manager: low_score.manager, 
        real_name: getRealName(userById[low_score.user_id] || {}),
        team_name: low_score.team_name,
        points: toFixed(low_score.points) 
      } : null,
      best_manager: best_manager ? {
        manager: best_manager.manager,
        real_name: getRealName(userById[best_manager.user_id] || {}),
        team_name: best_manager.team_name,
        points: toFixed(best_manager.points)
      } : null,
      worst_manager: worst_manager ? {
        manager: worst_manager.manager,
        real_name: getRealName(userById[worst_manager.user_id] || {}),
        team_name: worst_manager.team_name,
        bench_points: toFixed(worst_manager.bench_points)
      } : null,
      overachiever: overachiever ? { 
        manager: overachiever.manager, 
        real_name: getRealName(userById[overachiever.user_id] || {}),
        team_name: overachiever.team_name,
        delta: `${overachiever.delta >= 0 ? "+" : ""}${overachiever.delta}` 
      } : null,
      underachiever: underachiever ? { 
        manager: underachiever.manager, 
        real_name: getRealName(userById[underachiever.user_id] || {}),
        team_name: underachiever.team_name,
        delta: `${underachiever.delta >= 0 ? "+" : ""}${underachiever.delta}` 
      } : null,
      closest_game: closest_game ? {
        teams: closest_game.teams,
        managers: closest_game.managers,
        real_names: [getRealName(userById[closest_game.user_ids[0]] || {}), getRealName(userById[closest_game.user_ids[1]] || {})],
        margin: closest_game.margin
      } : null,
      largest_blowout: largest_blowout ? {
        teams: largest_blowout.teams,
        managers: largest_blowout.managers,
        real_names: [getRealName(userById[largest_blowout.user_ids[0]] || {}), getRealName(userById[largest_blowout.user_ids[1]] || {})],
        margin: largest_blowout.margin
      } : null,
      power_rankings: power_rankings.map(rank => ({
        ...rank,
        real_name: getRealName(userById[rank.owner_id] || {})
      })),
      standings_analysis: standingsAnalysis
    }
  };

  // Return both full and trimmed payloads
  return {
    full: payload,
    trimmed: createTrimmedPayload(payload)
  };
}

// Function to create a trimmed payload for OpenAI (reduces token usage)
function createTrimmedPayload(fullPayload, context = 'weekly') {
  return {
    week: fullPayload.week,
    league: {
      name: fullPayload.league.name,
      season: fullPayload.league.season
    },
    users: fullPayload.users.map(u => ({
      user_id: u.user_id,
      real_name: u.real_name,
      team_name: u.team_name
    })),
    rosters: fullPayload.rosters.map(r => ({
      team_name: r.team_name,
      real_name: r.real_name,
      wins: r.wins,
      losses: r.losses,
      fpts: r.fpts,
      playoff_position: r.playoff_position,
      // Include roster details for season kickoff
      ...(context === 'season_kickoff' && {
        starters: r.starters?.map(player => ({
          name: player.name,
          position: player.position,
          team: player.team
        })) || [],
        bench: r.bench?.slice(0, 3).map(player => ({
          name: player.name,
          position: player.position,
          team: player.team
        })) || []
      })
    })),
    matchups: fullPayload.matchups.map(m => ({
      team_name_home: m.team_name_home,
      team_name_away: m.team_name_away,
      real_name_home: m.real_name_home,
      real_name_away: m.real_name_away,
      points_home: m.points_home,
      points_away: m.points_away,
      proj_home: m.proj_home,
      proj_away: m.proj_away,
      margin: m.margin,
      is_key_matchup: m.is_key_matchup,
      matchup_type: m.matchup_type,
      prediction: m.prediction
    })),
    stats: {
      top_score: fullPayload.stats.top_score,
      low_score: fullPayload.stats.low_score,
      best_manager: fullPayload.stats.best_manager,
      worst_manager: fullPayload.stats.worst_manager,
      overachiever: fullPayload.stats.overachiever,
      underachiever: fullPayload.stats.underachiever,
      closest_game: fullPayload.stats.closest_game,
      largest_blowout: fullPayload.stats.largest_blowout,
      power_rankings: fullPayload.stats.power_rankings.slice(0, 10) // Only top 10
    }
  };
}

// ---- Run -------------------------------------------------------------------
buildWeeklyPayload()
  .then((p) => {
    console.log(JSON.stringify(p, null, 2));
    
    // Also save to file for the headless test
    
    // Ensure weekly_summaries directory exists
    const weeklyDir = path.join(__dirname, '..', 'weekly_summaries');
    if (!fs.existsSync(weeklyDir)) {
      fs.mkdirSync(weeklyDir, { recursive: true });
    }
    
    // Save both full and trimmed versions
    const latestFile = path.join(weeklyDir, 'latest.json');
    const trimmedFile = path.join(weeklyDir, 'latest_trimmed.json');
    
    fs.writeFileSync(latestFile, JSON.stringify(p.full, null, 2));
    fs.writeFileSync(trimmedFile, JSON.stringify(p.trimmed, null, 2));
    
    // Also copy to frontend public directory for immediate access
    const frontendPublicDir = path.join(__dirname, '..', 'frontend', 'public');
    const frontendLatestFile = path.join(frontendPublicDir, 'latest.json');
    const frontendTrimmedFile = path.join(frontendPublicDir, 'latest_trimmed.json');
    
    fs.writeFileSync(frontendLatestFile, JSON.stringify(p.full, null, 2));
    fs.writeFileSync(frontendTrimmedFile, JSON.stringify(p.trimmed, null, 2));
    
    console.error(`💾 Saved full data to: ${latestFile}`);
    console.error(`💾 Saved trimmed data to: ${trimmedFile}`);
    console.error(`🚀 Copied to frontend: ${frontendLatestFile}`);
    console.error(`🚀 Copied to frontend: ${frontendTrimmedFile}`);
    console.error(`📊 Full payload size: ${JSON.stringify(p.full).length} characters`);
    console.error(`📊 Trimmed payload size: ${JSON.stringify(p.trimmed).length} characters`);
  })
  .catch((e) => {
    console.error("Error:", e.message);
    process.exit(2);
  }); 