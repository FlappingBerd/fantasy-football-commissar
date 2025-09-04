#!/usr/bin/env node

/**
 * Check current team names and compare with previous data
 * Usage: node scripts/check_team_names.js --league <LEAGUE_ID>
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

function getTeamName(user) {
  const currentTeamName = user.metadata?.team_name;
  const displayName = user.display_name;
  const username = user.username;
  
  if (currentTeamName && currentTeamName.trim() !== '') {
    return currentTeamName;
  }
  
  return displayName || username || "Unknown Team";
}

// ---- Main function ---------------------------------------------------------
async function checkTeamNames() {
  console.log('🔍 Checking current team names...');
  
  try {
    // Fetch current league data
    const [league, users] = await Promise.all([
      j(`${SLEEPER}/league/${LEAGUE_ID}`),
      j(`${SLEEPER}/league/${LEAGUE_ID}/users`),
    ]);

    console.log(`\n📊 League: ${league.name} (${league.season})`);
    console.log(`👥 Total Users: ${users.length}\n`);

    // Display current team names
    console.log('🏈 CURRENT TEAM NAMES:');
    console.log('='.repeat(60));
    
    const currentTeamNames = {};
    
    users.forEach((user, index) => {
      const handle = handleFromUser(user);
      const realName = getRealName(handle);
      const teamName = getTeamName(user);
      
      currentTeamNames[user.user_id] = teamName;
      
      console.log(`${(index + 1).toString().padStart(2, ' ')}. ${realName.padEnd(25)} | ${teamName}`);
    });

    // Check for previous data and compare
    const previousDataFile = path.join(__dirname, '..', 'weekly_summaries', 'latest.json');
    
    if (fs.existsSync(previousDataFile)) {
      console.log('\n🔄 COMPARING WITH PREVIOUS DATA:');
      console.log('='.repeat(60));
      
      const previousData = JSON.parse(fs.readFileSync(previousDataFile, 'utf8'));
      const previousTeamNames = {};
      
      if (previousData.users) {
        previousData.users.forEach(user => {
          previousTeamNames[user.user_id] = user.team_name;
        });
      }
      
      let changesFound = false;
      
      users.forEach(user => {
        const currentName = currentTeamNames[user.user_id];
        const previousName = previousTeamNames[user.user_id];
        
        if (previousName && previousName !== currentName) {
          if (!changesFound) {
            changesFound = true;
          }
          
          const handle = handleFromUser(user);
          const realName = getRealName(handle);
          
          console.log(`🔄 ${realName}: "${previousName}" → "${currentName}"`);
        }
      });
      
      if (!changesFound) {
        console.log('✅ No team name changes detected');
      }
    } else {
      console.log('\n⚠️ No previous data found for comparison');
    }

    // Save current team names for future reference
    const teamNamesFile = path.join(__dirname, '..', 'current_team_names.json');
    const teamNamesData = {
      timestamp: new Date().toISOString(),
      league_id: LEAGUE_ID,
      league_name: league.name,
      team_names: currentTeamNames,
      users: users.map(user => ({
        user_id: user.user_id,
        handle: handleFromUser(user),
        real_name: getRealName(handleFromUser(user)),
        team_name: getTeamName(user),
        display_name: user.display_name,
        username: user.username
      }))
    };
    
    fs.writeFileSync(teamNamesFile, JSON.stringify(teamNamesData, null, 2));
    console.log(`\n💾 Current team names saved to: ${teamNamesFile}`);

  } catch (error) {
    console.error('❌ Error checking team names:', error.message);
    process.exit(1);
  }
}

// ---- Run -------------------------------------------------------------------
checkTeamNames();
