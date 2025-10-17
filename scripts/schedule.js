import cron from 'node-cron';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const LEAGUE_ID = config.SLEEPER_LEAGUE_ID;
const DISCORD_WEBHOOK_URL = config.DISCORD_WEBHOOK_URL;

// Ensure weekly_summaries directory exists
const summariesDir = path.join(__dirname, 'weekly_summaries');
if (!fs.existsSync(summariesDir)) {
  fs.mkdirSync(summariesDir, { recursive: true });
}

// Function to save weekly summary to file
function saveWeeklySummary(data, week) {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `weekly_summary_week_${week}_${timestamp}.json`;
  const filepath = path.join(summariesDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`Weekly summary saved to: ${filepath}`);
  return filepath;
}

// Function to post to Discord (optional)
async function postToDiscord(message) {
  if (!DISCORD_WEBHOOK_URL) {
    console.log('No Discord webhook configured. Skipping Discord post.');
    return;
  }

  try {
    const axios = await import('axios');
    await axios.default.post(DISCORD_WEBHOOK_URL, {
      content: message
    });
    console.log('Posted to Discord successfully!');
  } catch (error) {
    console.error('Failed to post to Discord:', error.message);
  }
}

// Main weekly task function
function runWeeklyTask() {
  console.log('🏈 Running weekly Sleeper summary task...');
  console.log(`📅 ${new Date().toLocaleString()}`);
  
  const command = `node scripts/fetch_sleeper_week.js --league=${LEAGUE_ID}`;
  
  exec(command, async (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error: ${error.message}`);
      return;
    }
    
    if (stderr) {
      console.error(`⚠️  Stderr: ${stderr}`);
    }

    try {
      // Parse the JSON output
      const data = JSON.parse(stdout);
      
      // Save to file
      const savedFile = saveWeeklySummary(data, data.week || 'unknown');
      
      // Create a formatted message for Discord/console
      const message = formatWeeklyMessage(data);
      
      // Log to console
      console.log('\n📊 Weekly Summary Generated:');
      console.log(message);
      
      // Post to Discord if configured
      await postToDiscord(message);
      
      console.log('✅ Weekly task completed successfully!');
      
    } catch (parseError) {
      console.error('❌ Failed to parse JSON output:', parseError.message);
      console.log('Raw output:', stdout);
    }
  });
}

// Function to format the weekly message
function formatWeeklyMessage(data) {
  let message = `🏈 **Week ${data.week} Fantasy Football Recap**\n\n`;
  
  // League info
  message += `📊 **${data.league.name}** (Week ${data.week})\n\n`;
  
  // Top and low scores
  if (data.stats.top_score) {
    message += `🔥 **Highest Score:** ${data.stats.top_score.manager} (${data.stats.top_score.points} pts)\n`;
  }
  
  if (data.stats.low_score) {
    message += `❄️ **Lowest Score:** ${data.stats.low_score.manager} (${data.stats.low_score.points} pts)\n\n`;
  }
  
  // Over/Underachievers
  if (data.stats.overachiever) {
    message += `🚀 **Overachiever:** ${data.stats.overachiever.manager} (${data.stats.overachiever.delta} vs projection)\n`;
  }
  
  if (data.stats.underachiever) {
    message += `📉 **Underachiever:** ${data.stats.underachiever.manager} (${data.stats.underachiever.delta} vs projection)\n\n`;
  }
  
  // Closest game
  if (data.stats.closest_game) {
    message += `⚡ **Closest Game:** ${data.stats.closest_game.teams[0]} vs ${data.stats.closest_game.teams[1]} (${data.stats.closest_game.margin} pt margin)\n\n`;
  }
  
  // Biggest blowout
  if (data.stats.largest_blowout) {
    message += `💥 **Biggest Blowout:** ${data.stats.largest_blowout.teams[0]} vs ${data.stats.largest_blowout.teams[1]} (${data.stats.largest_blowout.margin} pt margin)\n\n`;
  }
  
  // Power rankings (top 5)
  message += `📈 **Power Rankings:**\n`;
  if (data.stats.power_rankings && data.stats.power_rankings.length > 0) {
    data.stats.power_rankings.slice(0, 5).forEach((rank, index) => {
      message += `${rank.rank}. ${rank.manager} (${rank.elo} ELO)\n`;
    });
  }
  
  // Team-by-team roundup (ensure broad coverage)
  if (Array.isArray(data.users) && data.users.length > 0) {
    message += `\n🧭 **Team-by-Team Roundup:**\n`;
    const uniqueManagers = new Set();
    (data.users || []).forEach((u) => {
      const name = u.real_name || u.display_name || u.handle || 'Manager';
      if (!uniqueManagers.has(name)) {
        uniqueManagers.add(name);
        message += `- ${name}\n`;
      }
    });
    message += `\n`;
  }
  
  return message;
}

// Schedule the task to run every Tuesday at 11:00 AM
console.log('⏰ Setting up weekly scheduler...');
console.log('📅 Task will run every Tuesday at 11:00 AM');
console.log(`🏈 League ID: ${LEAGUE_ID}`);
console.log(`💬 Discord: ${DISCORD_WEBHOOK_URL ? 'Configured' : 'Not configured'}`);
console.log('🚀 Starting scheduler...\n');

cron.schedule(config.SCHEDULE_TIME, () => {
  runWeeklyTask();
}, {
  scheduled: true,
  timezone: config.TIMEZONE
});

// Keep the process running
console.log('✅ Scheduler is running. Press Ctrl+C to stop.');
console.log('💡 To test immediately, run: node scripts/fetch_sleeper_week.js --league YOUR_LEAGUE_ID\n');

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down scheduler...');
  process.exit(0);
});

// Export for testing
export { formatWeeklyMessage }; 