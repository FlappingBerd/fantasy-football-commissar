// Configuration file for Fantasy Weekly Updates
module.exports = {
  // Your Sleeper League ID (required)
  SLEEPER_LEAGUE_ID: '1249366852329549824',
  
  // Discord webhook URL (optional - for posting updates to Discord)
  DISCORD_WEBHOOK_URL: null,
  
  // Timezone for the scheduler (default: America/New_York)
  TIMEZONE: 'America/New_York',
  
  // Schedule time (default: Tuesday at 11:00 AM)
  SCHEDULE_TIME: '0 11 * * 2',
  
  // Output settings
  OUTPUT: {
    // Save JSON files to weekly_summaries directory
    SAVE_JSON: true,
    
    // Post to Discord
    POST_TO_DISCORD: false,
    
    // Console output
    CONSOLE_OUTPUT: true
  }
}; 