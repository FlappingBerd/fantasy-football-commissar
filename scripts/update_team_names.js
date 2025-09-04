#!/usr/bin/env node

/**
 * Update team names from Sleeper API
 * Usage: node scripts/update_team_names.js --league <LEAGUE_ID>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SLEEPER = "https://api.sleeper.app/v1";

// CLI args
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
if (!LEAGUE_ID) {
  console.error("Missing league id. Pass --league <ID> or set SLEEPER_LEAGUE_ID.");
  process.exit(1);
}

async function j(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} for ${url}`);
  return r.json();
}

function handleFromUser(u) {
  const name = u.display_name || u.username || "manager";
  return `@${name}`;
}

function getRealName(user) {
  // Use the current team name from Sleeper as the "real name"
  return getTeamName(user);
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

async function updateTeamNames() {
  try {
    console.log('📡 Fetching latest team data from Sleeper...');
    
    const [league, users] = await Promise.all([
      j(`${SLEEPER}/league/${LEAGUE_ID}`),
      j(`${SLEEPER}/league/${LEAGUE_ID}/users`),
    ]);

    const teamNames = {};
    const usersData = [];

    users.forEach(user => {
      const teamName = getTeamName(user);
      teamNames[user.user_id] = teamName;
      
      usersData.push({
        user_id: user.user_id,
        handle: handleFromUser(user),
        real_name: getRealName(user),
        team_name: teamName,
        display_name: user.display_name
      });
    });

    const updatedData = {
      timestamp: new Date().toISOString(),
      league_id: LEAGUE_ID,
      league_name: league.name,
      team_names: teamNames,
      users: usersData
    };

    // Save to current_team_names.json
    const outputFile = path.join(__dirname, '..', 'current_team_names.json');
    fs.writeFileSync(outputFile, JSON.stringify(updatedData, null, 2));
    
    console.log('✅ Team names updated successfully!');
    console.log(`💾 Saved to: ${outputFile}`);
    
    // Show any team name changes
    const oldDataFile = path.join(__dirname, '..', 'current_team_names.json');
    if (fs.existsSync(oldDataFile)) {
      try {
        const oldData = JSON.parse(fs.readFileSync(oldDataFile, 'utf8'));
        console.log('\n🔄 Team name changes detected:');
        
        users.forEach(user => {
          const currentName = getTeamName(user);
          const oldName = oldData.team_names?.[user.user_id];
          
          if (oldName && oldName !== currentName) {
            console.log(`  ${getRealName(user)}: "${oldName}" → "${currentName}"`);
          }
        });
      } catch (e) {
        console.log('⚠️ Could not compare with old data');
      }
    }
    
    console.log('\n📊 Current team names:');
    users.forEach(user => {
              console.log(`  ${getRealName(user)}: ${getTeamName(user)}`);
    });
    
  } catch (error) {
    console.error('❌ Error updating team names:', error.message);
    process.exit(1);
  }
}

updateTeamNames();
