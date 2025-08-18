#!/usr/bin/env node

/**
 * Sleeper → Draft Data for Commissar Analysis
 * Usage:
 *   node fetch_draft_data.js --league <LEAGUE_ID>
 *
 * Output: JSON on stdout with draft picks and player names
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

function toFixed(n, d = 1) {
  return Number.isFinite(n) ? Number(n.toFixed(d)) : n;
}

// Name mapping for personalized recaps
function getRealName(handle) {
  const nameMap = {
    '@Kodiak': 'Riky',
    '@davis218': 'Tio',
    '@hannygeorge': 'Jan',
    '@mLeggett': 'Myke',
    '@WhatayaZay': 'Danimal',
    '@natezeff': 'Zephyr',
    '@bdvabch': 'BD',
    '@Freddie4sumball': 'Brent',
    '@RenPetschke': 'Donald',
    '@FlappingBird': 'His Royal Highness and Supreme Commissioner',
    '@Ana2187': 'Tia Ana',
    '@Schafer2121': 'Schafer',
    '@rguerra19': 'Tio Ryan',
    '@leevus': 'Levi'
  };
  return nameMap[handle] || handle;
}

// ---- Main builder ----------------------------------------------------------
async function buildDraftPayload() {
  console.log('📡 Fetching draft data from Sleeper...');

  const [league, users, rosters, draft] = await Promise.all([
    j(`${SLEEPER}/league/${LEAGUE_ID}`),
    j(`${SLEEPER}/league/${LEAGUE_ID}/users`),
    j(`${SLEEPER}/league/${LEAGUE_ID}/rosters`),
    j(`${SLEEPER}/league/${LEAGUE_ID}/drafts`),
  ]);

  // Get the most recent draft
  const latestDraft = draft[0];
  if (!latestDraft) {
    throw new Error('No draft found for this league');
  }

  console.log(`📊 Found draft: ${latestDraft.draft_id}`);

  // Fetch draft picks
  const picks = await j(`${SLEEPER}/draft/${latestDraft.draft_id}/picks`);
  
  // Fetch player data for the picks
  const playerIds = [...new Set(picks.map(pick => pick.player_id).filter(Boolean))];
  const players = {};
  
  // Fetch player data in batches (Sleeper has rate limits)
  const batchSize = 50;
  for (let i = 0; i < playerIds.length; i += batchSize) {
    const batch = playerIds.slice(i, i + batchSize);
    const batchPlayers = await j(`${SLEEPER}/players/nfl`);
    
    // Filter to only the players we need
    batch.forEach(playerId => {
      if (batchPlayers[playerId]) {
        players[playerId] = batchPlayers[playerId];
      }
    });
    
    // Small delay to respect rate limits
    if (i + batchSize < playerIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  const userById = Object.fromEntries(users.map((u) => [u.user_id, u]));
  const rosterById = Object.fromEntries(rosters.map((r) => [r.roster_id, r]));

  // Process draft picks with player names
  const draftPicks = picks.map((pick) => {
    const player = players[pick.player_id];
    const roster = rosterById[pick.roster_id];
    const user = userById[roster?.owner_id] || {};
    
    return {
      round: pick.round,
      pick_no: pick.pick_no,
      player_id: pick.player_id,
      player_name: player?.full_name || player?.first_name + ' ' + player?.last_name || 'Unknown Player',
      position: player?.position || 'Unknown',
      team: player?.team || 'Unknown',
      manager: handleFromUser(user),
      real_name: getRealName(handleFromUser(user)),
      team_name: user.metadata?.team_name || user.display_name || user.username || "Unknown Team",
      roster_id: pick.roster_id
    };
  });

  // Group picks by manager
  const picksByManager = {};
  draftPicks.forEach(pick => {
    if (!picksByManager[pick.manager]) {
      picksByManager[pick.manager] = [];
    }
    picksByManager[pick.manager].push(pick);
  });

  // Calculate draft grades and analysis
  const managerAnalysis = Object.entries(picksByManager).map(([manager, picks]) => {
    const positionCounts = picks.reduce((acc, pick) => {
      acc[pick.position] = (acc[pick.position] || 0) + 1;
      return acc;
    }, {});

    const earlyPicks = picks.filter(p => p.round <= 3);
    const midPicks = picks.filter(p => p.round > 3 && p.round <= 8);
    const latePicks = picks.filter(p => p.round > 8);

    return {
      manager,
      real_name: getRealName(manager),
      team_name: picks[0]?.team_name || 'Unknown Team',
      total_picks: picks.length,
      position_breakdown: positionCounts,
      early_picks: earlyPicks,
      mid_picks: midPicks,
      late_picks: latePicks,
      picks: picks.sort((a, b) => a.pick_no - b.pick_no)
    };
  });

  // Users normalized
  const usersNorm = users.map((u) => ({
    user_id: u.user_id,
    display_name: u.display_name || u.username,
    team_name: u.metadata?.team_name || null,
    handle: handleFromUser(u),
    real_name: getRealName(handleFromUser(u)),
  }));

  // Final payload
  const payload = {
    draft_id: latestDraft.draft_id,
    draft_type: latestDraft.type,
    draft_status: latestDraft.status,
    league: {
      id: LEAGUE_ID,
      name: league.name,
      season: league.season,
      scoring_settings: league.scoring_settings || {},
    },
    users: usersNorm,
    draft_picks: draftPicks,
    manager_analysis: managerAnalysis,
    draft_summary: {
      total_rounds: Math.max(...draftPicks.map(p => p.round)),
      total_picks: draftPicks.length,
      total_managers: Object.keys(picksByManager).length,
      positions_drafted: [...new Set(draftPicks.map(p => p.position))],
      teams_represented: [...new Set(draftPicks.map(p => p.team).filter(Boolean))]
    }
  };

  return payload;
}

// ---- Run -------------------------------------------------------------------
buildDraftPayload()
  .then((p) => {
    console.log(JSON.stringify(p, null, 2));
    
    // Save to file
    const draftDir = path.join(__dirname, '..', 'draft_data');
    if (!fs.existsSync(draftDir)) {
      fs.mkdirSync(draftDir, { recursive: true });
    }
    
    const filename = path.join(draftDir, 'latest_draft.json');
    fs.writeFileSync(filename, JSON.stringify(p, null, 2));
    console.error(`💾 Draft data saved to: ${filename}`);
  })
  .catch((e) => {
    console.error("Error:", e.message);
    process.exit(2);
  });
