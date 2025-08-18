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
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur) => {
    const m = cur.match(/^--([^=\s]+)(?:=(.*))?$/);
    if (m) acc.push([m[1], m[2] ?? true]);
    else acc.push([cur, true]);
    return acc;
  }, [])
);

const LEAGUE_ID = args.league || process.env.SLEEPER_LEAGUE_ID;
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

// Name mapping for personalized recaps
function getRealName(handle) {
  const nameMap = {
    // Populate as desired; removed hard-coded special mentions to keep analysis balanced
  };
  return nameMap[handle] || handle;
}

// ---- Main builder ----------------------------------------------------------
async function buildWeeklyPayload() {
  const state = await j(`${SLEEPER}/state/nfl`);
  // Use last *completed* week. If week is 1 or missing, stick to 1.
  const lastCompletedWeek = Math.max(1, ((state.week ?? 1) | 0) - 1);

  const [league, users, rosters, matchups, txs] = await Promise.all([
    j(`${SLEEPER}/league/${LEAGUE_ID}`),
    j(`${SLEEPER}/league/${LEAGUE_ID}/users`),
    j(`${SLEEPER}/league/${LEAGUE_ID}/rosters`),
    j(`${SLEEPER}/league/${LEAGUE_ID}/matchups/${lastCompletedWeek}`),
    j(`${SLEEPER}/league/${LEAGUE_ID}/transactions/${lastCompletedWeek}`),
  ]);

  const userById = Object.fromEntries(users.map((u) => [u.user_id, u]));
  const rosterById = Object.fromEntries(rosters.map((r) => [r.roster_id, r]));

  // Enhanced team data with names and bench points
  const teams = matchups.map((m) => {
    const roster = rosterById[m.roster_id];
    const user = userById[roster?.owner_id] || {};
    const teamName = user.metadata?.team_name || user.display_name || user.username || "Unknown Team";
    
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
    return {
      matchup_id: a.matchup_id,
      roster_id_home: a.roster_id,
      roster_id_away: b.roster_id,
      points_home: toFixed(a.points),
      points_away: toFixed(b.points),
      proj_home: a.starters_points ? toFixed(a.starters_points) : null,
      proj_away: b.starters_points ? toFixed(b.starters_points) : null,
      manager_home: a.manager,
      manager_away: b.manager,
      real_name_home: getRealName(a.manager),
      real_name_away: getRealName(b.manager),
      team_name_home: a.team_name,
      team_name_away: b.team_name,
      bench_points_home: toFixed(a.bench_points),
      bench_points_away: toFixed(b.bench_points),
      user_id_home: a.user_id,
      user_id_away: b.user_id,
      top_performers: [], // You can enrich via player_box_scores if you want
    };
  });

  // Standings snapshot (season-to-date)
  const standings = rosters
    .map((r) => {
      const user = userById[r.owner_id] || {};
      const teamName = user.metadata?.team_name || user.display_name || user.username || "Unknown Team";
      return {
        roster_id: r.roster_id,
        owner_id: r.owner_id,
        team_name: teamName,
        manager: handleFromUser(user),
        wins: r.settings?.wins ?? 0,
        losses: r.settings?.losses ?? 0,
        ties: r.settings?.ties ?? 0,
        fpts: toFixed((r.settings?.fpts ?? 0) + (r.settings?.fpts_decimal ?? 0) / 100, 1),
        fpts_against: toFixed((r.settings?.fpts_against ?? 0) + (r.settings?.fpts_against_decimal ?? 0) / 100, 1),
      };
    })
    .sort((a, b) => (b.wins - a.wins) || (b.fpts - a.fpts));

  // Users normalized with team names
  const usersNorm = users.map((u) => ({
    user_id: u.user_id,
    display_name: u.display_name || u.username,
    team_name: u.metadata?.team_name || null,
    handle: handleFromUser(u),
    real_name: getRealName(handleFromUser(u)),
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
        real_name: getRealName(r.manager),
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
    week: lastCompletedWeek,
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
      real_name: getRealName(r.manager),
      wins: r.wins,
      losses: r.losses,
      fpts: r.fpts,
      fpts_against: r.fpts_against,
      win_percentage: r.win_percentage,
      points_per_game: r.points_per_game,
      playoff_position: r.playoff_position,
      total_games: r.total_games
    })),
    matchups: matchupsNorm,
    transactions: { waivers, trades },
    injuries: [], // Optional: can be filled if you add a separate injury source
    stats: {
      top_score: top_score ? { 
        manager: top_score.manager, 
        real_name: getRealName(top_score.manager),
        team_name: top_score.team_name,
        points: toFixed(top_score.points) 
      } : null,
      low_score: low_score ? { 
        manager: low_score.manager, 
        real_name: getRealName(low_score.manager),
        team_name: low_score.team_name,
        points: toFixed(low_score.points) 
      } : null,
      best_manager: best_manager ? {
        manager: best_manager.manager,
        real_name: getRealName(best_manager.manager),
        team_name: best_manager.team_name,
        points: toFixed(best_manager.points)
      } : null,
      worst_manager: worst_manager ? {
        manager: worst_manager.manager,
        real_name: getRealName(worst_manager.manager),
        team_name: worst_manager.team_name,
        bench_points: toFixed(worst_manager.bench_points)
      } : null,
      overachiever: overachiever ? { 
        manager: overachiever.manager, 
        real_name: getRealName(overachiever.manager),
        team_name: overachiever.team_name,
        delta: `${overachiever.delta >= 0 ? "+" : ""}${overachiever.delta}` 
      } : null,
      underachiever: underachiever ? { 
        manager: underachiever.manager, 
        real_name: getRealName(underachiever.manager),
        team_name: underachiever.team_name,
        delta: `${underachiever.delta >= 0 ? "+" : ""}${underachiever.delta}` 
      } : null,
      closest_game: closest_game ? {
        teams: closest_game.teams,
        managers: closest_game.managers,
        real_names: [getRealName(closest_game.managers[0]), getRealName(closest_game.managers[1])],
        margin: closest_game.margin
      } : null,
      largest_blowout: largest_blowout ? {
        teams: largest_blowout.teams,
        managers: largest_blowout.managers,
        real_names: [getRealName(largest_blowout.managers[0]), getRealName(largest_blowout.managers[1])],
        margin: largest_blowout.margin
      } : null,
      power_rankings: power_rankings.map(rank => ({
        ...rank,
        real_name: getRealName(rank.manager)
      })),
      standings_analysis: standingsAnalysis
    }
  };

  return payload;
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
    
    // Save to latest.json
    const latestFile = path.join(weeklyDir, 'latest.json');
    fs.writeFileSync(latestFile, JSON.stringify(p, null, 2));
    console.error(`💾 Saved to: ${latestFile}`);
  })
  .catch((e) => {
    console.error("Error:", e.message);
    process.exit(2);
  }); 